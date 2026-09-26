-- Personal expenses count toward Plan only when the transaction stores a jar assignment.
-- The database keeps transactions.jar_id as the single participation decision.

CREATE OR REPLACE FUNCTION public.record_transaction(p_account_id uuid, p_type text, p_amount numeric, p_transaction_date date DEFAULT (timezone('utc'::text, now()))::date, p_note text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_income_mode text;
  v_existing_id uuid;
  v_tx_id uuid;
  v_inbox_id uuid;
  v_jar_ok boolean;
  v_category_ok boolean;
  v_title text;
  v_jar_id uuid;
  v_category_jar uuid;
  v_status text;
  v_category_name text;
  v_account_name text;
  v_account_scope text;
  v_note text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('income', 'expense') then
    raise exception 'Invalid transaction type';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select t.id into v_existing_id
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = trim(p_idempotency_key)
    limit 1;

    if v_existing_id is not null then
      select i.id into v_inbox_id
      from public.inbox_items i
      where i.household_id = v_household_id
        and i.source_type = 'transaction'
        and i.source_id = v_existing_id
        and i.status = 'pending'
      limit 1;

      return jsonb_build_object(
        'transaction_id', v_existing_id,
        'inbox_item_id', v_inbox_id,
        'idempotent', true
      );
    end if;
  end if;

  select a.name, a.financial_scope into v_account_name, v_account_scope
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.is_archived = false;

  if v_account_name is null then
    raise exception 'Account not found';
  end if;

  select h.base_currency, h.income_allocate_mode
  into v_currency, v_income_mode
  from public.households h
  where h.id = v_household_id;

  v_jar_id := p_jar_id;
  v_category_jar := null;
  v_category_name := null;
  v_note := nullif(trim(coalesce(p_note, '')), '');

  if p_category_id is not null then
    select exists (
      select 1
      from public.categories c
      where c.id = p_category_id
        and c.is_active = true
        and c.kind = p_type
        and (c.household_id is null or c.household_id = v_household_id)
    ) into v_category_ok;

    if not v_category_ok then
      raise exception 'Invalid category tag';
    end if;

    select c.jar_id, c.name into v_category_jar, v_category_name
    from public.categories c
    where c.id = p_category_id;

    if v_jar_id is null and v_category_jar is not null
       and not (p_type = 'expense' and v_account_scope = 'personal') then
      v_jar_id := v_category_jar;
    end if;
  end if;

  if v_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = v_jar_id
        and j.household_id = v_household_id
        and j.is_archived = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
  end if;

  v_status := case
    when p_type = 'expense' and v_jar_id is null and v_account_scope = 'household' then 'pending_mapping'
    else 'posted'
  end;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    created_by,
    idempotency_key
  )
  values (
    v_household_id,
    p_account_id,
    p_type,
    p_amount,
    coalesce(v_currency, 'VND'),
    coalesce(p_transaction_date, (timezone('utc', now()))::date),
    v_note,
    p_category_id,
    v_jar_id,
    v_status,
    v_user_id,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_tx_id;

  if p_type = 'expense' and v_jar_id is null and v_account_scope = 'household' then
    v_title := coalesce(v_note, nullif(trim(coalesce(v_category_name, '')), ''), 'Unmapped expense');
    v_inbox_id := (
      select (public.produce_inbox_item(
        p_household_id => v_household_id,
        p_kind => 'unmapped_expense',
        p_source_type => 'transaction',
        p_source_id => v_tx_id,
        p_amount => p_amount,
        p_currency => coalesce(v_currency, 'VND'),
        p_title => v_title,
        p_suggested_category_id => p_category_id,
        p_context => jsonb_build_object(
          'reason', 'unmapped_expense',
          'category_id', p_category_id,
          'category_name', v_category_name,
          'account_id', p_account_id,
          'account_name', v_account_name,
          'note', v_note
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  if p_type = 'income'
     and v_jar_id is null
     and coalesce(v_income_mode, 'suggest') in ('suggest', 'auto')
  then
    v_title := coalesce(v_note, nullif(trim(coalesce(v_category_name, '')), ''), 'Place income');
    v_inbox_id := (
      select (public.produce_inbox_item(
        p_household_id => v_household_id,
        p_kind => 'income_suggest',
        p_source_type => 'transaction',
        p_source_id => v_tx_id,
        p_amount => p_amount,
        p_currency => coalesce(v_currency, 'VND'),
        p_title => v_title,
        p_suggested_category_id => p_category_id,
        p_context => jsonb_build_object(
          'reason', 'income_suggest',
          'income_allocate_mode', v_income_mode,
          'category_id', p_category_id,
          'category_name', v_category_name,
          'account_id', p_account_id,
          'account_name', v_account_name,
          'note', v_note
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  return jsonb_build_object(
    'transaction_id', v_tx_id,
    'inbox_item_id', v_inbox_id,
    'idempotent', false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.correct_transaction(p_original_transaction_id uuid, p_amount numeric, p_type text, p_account_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text, p_transaction_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_original public.transactions%rowtype;
  v_reversal_id uuid;
  v_correction_id uuid;
  v_account_id uuid;
  v_category_id uuid;
  v_jar_id uuid;
  v_reversal_type text;
  v_date date;
  v_account public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_month public.card_billing_months%rowtype;
  v_billing_month date;
  v_due_month date;
  v_due_date date;
  v_statement_amount numeric;
  v_paid_amount numeric;
  v_signed_amount numeric;
  v_statement_day integer;
  v_due_day integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then raise exception 'Invalid transaction type'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select * into v_original from public.transactions t
  where t.id = p_original_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_original.household_id) then raise exception 'Forbidden'; end if;
  if v_original.type not in ('income', 'expense')
     or v_original.savings_event_kind is not null
     or exists (select 1 from public.accounts a where a.id = v_original.account_id and a.type = 'credit_card')
  then
    raise exception 'Transaction is not correctable';
  end if;
  if v_original.status not in ('posted', 'pending_mapping') then raise exception 'Transaction is not correctable'; end if;
  if v_original.reverses_transaction_id is not null or v_original.corrects_transaction_id is not null then
    raise exception 'Transaction is not correctable';
  end if;

  v_account_id := coalesce(p_account_id, v_original.account_id);
  v_category_id := coalesce(p_category_id, v_original.category_id);
  v_date := coalesce(p_transaction_date, v_original.transaction_date);

  select * into v_account
  from public.accounts a
  where a.id = v_account_id
    and a.household_id = v_original.household_id
    and a.is_archived = false;
  if not found then raise exception 'Account not found'; end if;

  v_jar_id := case
    when v_account.financial_scope = 'personal' and p_type = 'expense' then p_jar_id
    else coalesce(p_jar_id, v_original.jar_id)
  end;

  if v_category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = v_category_id and c.is_active = true and c.kind = p_type
      and (c.household_id is null or c.household_id = v_original.household_id)
  ) then raise exception 'Invalid category tag'; end if;
  if v_jar_id is not null and not exists (
    select 1 from public.jars j
    where j.id = v_jar_id and j.household_id = v_original.household_id and j.is_archived = false
  ) then raise exception 'Invalid jar'; end if;

  if v_account.type = 'credit_card' then
    select * into v_settings
    from public.credit_card_settings s
    where s.account_id = v_account.id
      and s.household_id = v_original.household_id
    for update;
    if not found then raise exception 'Card settings not found'; end if;

  end if;

  v_reversal_type := case when v_original.type = 'expense' then 'income' else 'expense' end;
  update public.transactions
  set status = 'reversed', updated_at = timezone('utc', now())
  where id = v_original.id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, reverses_transaction_id, created_by
  ) values (
    v_original.household_id, v_original.account_id, v_reversal_type, v_original.amount,
    v_original.currency, v_date, 'Reversal', v_original.category_id, v_original.jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_reversal_id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, corrects_transaction_id, created_by
  ) values (
    v_original.household_id, v_account_id, p_type, p_amount, v_original.currency, v_date,
    coalesce(nullif(trim(coalesce(p_note, '')), ''), v_original.note), v_category_id, v_jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_correction_id;

  if v_account.type = 'credit_card' then
    v_statement_day := least(31, greatest(1, v_settings.statement_day));
    v_due_day := least(31, greatest(1, v_settings.due_day));
    v_signed_amount := case when p_type = 'income' then -abs(p_amount) else abs(p_amount) end;
    v_billing_month := date_trunc('month', v_date)::date;

    if p_type = 'expense' and extract(day from v_date)::int > v_statement_day then
      v_billing_month := (v_billing_month + interval '1 month')::date;
    elsif p_type = 'income' then
      select m.billing_month into v_billing_month
      from public.card_billing_months m
      where m.household_id = v_original.household_id
        and m.card_account_id = v_account.id
        and m.status <> 'settled'
      order by m.billing_month desc
      limit 1;
      v_billing_month := coalesce(v_billing_month, date_trunc('month', v_date)::date);
    end if;

    v_due_month := case
      when v_due_day <= v_statement_day then (v_billing_month + interval '1 month')::date
      else v_billing_month
    end;
    v_due_date := make_date(
      extract(year from v_due_month)::int,
      extract(month from v_due_month)::int,
      least(
        v_due_day,
        extract(day from (date_trunc('month', v_due_month + interval '1 month') - interval '1 day'))::int
      )
    );

    select * into v_month
    from public.card_billing_months m
    where m.household_id = v_original.household_id
      and m.card_account_id = v_account.id
      and m.billing_month = v_billing_month
    for update;

    if found then
      v_statement_amount := greatest(0, v_month.statement_amount + v_signed_amount);
      v_paid_amount := v_month.paid_amount;
      update public.card_billing_months
      set statement_amount = v_statement_amount,
          status = case
            when v_statement_amount <= 0 or v_paid_amount >= v_statement_amount then 'settled'
            when v_paid_amount > 0 then 'partial'
            else 'open'
          end,
          updated_at = timezone('utc', now())
      where id = v_month.id;
    else
      v_statement_amount := greatest(0, v_signed_amount);
      v_paid_amount := 0;
      insert into public.card_billing_months (
        household_id, card_account_id, billing_month, statement_amount,
        paid_amount, due_date, status
      ) values (
        v_original.household_id, v_account.id, v_billing_month, v_statement_amount,
        0, v_due_date, case when v_statement_amount <= 0 then 'settled' else 'open' end
      ) returning * into v_month;
    end if;

    insert into public.card_billing_items (
      household_id, billing_month_id, card_account_id, transaction_id,
      description, amount, fee_amount, item_type, is_paid, is_converted_to_installment
    ) values (
      v_original.household_id, v_month.id, v_account.id, v_correction_id,
      nullif(trim(coalesce(p_note, '')), ''), v_signed_amount, 0, 'standard', false, false
    );
  end if;

  return jsonb_build_object(
    'original_transaction_id', v_original.id,
    'reversal_transaction_id', v_reversal_id,
    'correction_transaction_id', v_correction_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.reallocate_jar_capacity(p_source_jar_id uuid, p_target_jar_id uuid, p_amount numeric, p_is_emergency boolean DEFAULT false, p_intent_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_period date;
  v_timezone text;
  v_source_snapshot public.jar_period_rule_snapshots%rowtype;
  v_target_snapshot public.jar_period_rule_snapshots%rowtype;
  v_source_adjustment numeric := 0;
  v_source_spent numeric := 0;
  v_source_remaining numeric := 0;
  v_movement_id uuid;
  v_note text := nullif(trim(coalesce(p_intent_note, '')), '');
  v_is_emergency boolean := coalesce(p_is_emergency, false);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  if p_source_jar_id is null or p_target_jar_id is null or p_source_jar_id = p_target_jar_id then
    raise exception 'Distinct source and target jars required';
  end if;
  if v_is_emergency and v_note is null then
    raise exception 'Emergency intent note required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  order by hm.household_id
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  select coalesce(h.timezone, 'Asia/Ho_Chi_Minh') into v_timezone
  from public.households h where h.id = v_household_id;
  v_period := to_char(timezone(v_timezone, now()), 'YYYY-MM-01')::date;

  if p_source_jar_id < p_target_jar_id then
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
  else
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
  end if;

  if not exists (
    select 1 from public.jars
    where id = p_source_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid source jar'; end if;
  if not exists (
    select 1 from public.jars
    where id = p_target_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid target jar'; end if;

  select * into v_source_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_source_jar_id and period_month = v_period
  for update;
  select * into v_target_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_target_jar_id and period_month = v_period
  for update;
  if not found or v_source_snapshot.id is null or v_target_snapshot.id is null then
    raise exception 'Jar budget snapshot required';
  end if;

  select coalesce(sum(a.amount), 0) into v_source_adjustment
  from public.jar_period_adjustments a
  where a.household_id = v_household_id and a.jar_id = p_source_jar_id and a.period_month = v_period;

  select coalesce(sum(case
    when t.status = 'reversed' then 0
    when coalesce(t.is_reversal, false) or t.reverses_transaction_id is not null then
      case
        when exists (
          select 1 from public.transactions correction
          where correction.corrects_transaction_id = t.reverses_transaction_id
        ) then 0
        when t.type in ('income', 'expense', 'investment_buy', 'investment_fee', 'liability_payment') then -t.amount
        else 0
      end
    when t.type in ('expense', 'investment_buy', 'investment_fee') then t.amount
    when t.type = 'liability_payment' and exists (
      select 1 from public.loan_payments lp where lp.transaction_id = t.id
    ) then t.amount
    when t.type in ('transfer_out', 'transfer_in')
      and upper(coalesce(t.savings_event_kind, '')) like '%PLACEMENT%' then t.amount
    else 0
  end), 0) into v_source_spent
  from public.transactions t
  where t.household_id = v_household_id and t.jar_id = p_source_jar_id
    and t.transaction_date >= v_period
    and t.transaction_date < (v_period + interval '1 month')::date;

  v_source_remaining := greatest(0,
    v_source_snapshot.rule_budget
    + v_source_snapshot.rollover_credit
    + v_source_adjustment
    - v_source_spent
  );
  if p_amount > v_source_remaining then
    raise exception 'ERR_INSUFFICIENT_REALLOCATABLE_BUDGET';
  end if;

  insert into public.plan_movements (
    household_id, source_jar_id, target_jar_id, amount, is_emergency,
    intent_note, executed_by_user_id, ledger_impact, period_month, reason
  ) values (
    v_household_id, p_source_jar_id, p_target_jar_id, p_amount, v_is_emergency,
    v_note, v_user_id, 0, v_period, v_note
  ) returning id into v_movement_id;

  insert into public.jar_period_adjustments (
    household_id, jar_id, period_month, amount, plan_movement_id, note, created_by
  ) values
    (v_household_id, p_source_jar_id, v_period, -p_amount, v_movement_id, 'reallocate_out', v_user_id),
    (v_household_id, p_target_jar_id, v_period, p_amount, v_movement_id, 'reallocate_in', v_user_id);

  -- BR-13: partner-visible emergency attention via the Inbox gateway.
  -- One item per active partner (other than the declarer); a solo household
  -- keeps one declarer-visible audit item.
  if v_is_emergency then
    declare
      v_partner record;
      v_partner_count int := 0;
      v_emergency_id uuid;
    begin
      for v_partner in
        select hm.user_id
        from public.household_members hm
        where hm.household_id = v_household_id
          and hm.is_active = true
          and hm.user_id <> v_user_id
      loop
        select (public.produce_inbox_item(
          p_household_id => v_household_id,
          p_kind => 'emergency_declaration',
          p_source_type => 'plan_movement',
          p_source_id => v_movement_id,
          p_amount => p_amount,
          p_currency => (select base_currency from public.households where id = v_household_id),
          p_title => 'Emergency reallocation declared',
          p_assigned_to_user_id => v_partner.user_id,
          p_context => jsonb_build_object(
            'event', 'EmergencyDeclaredEvent',
            'intentNote', v_note,
            'sourceJarId', p_source_jar_id,
            'targetJarId', p_target_jar_id,
            'executedByUserId', v_user_id,
            'priority', 'high'
          )
        ))->>'inbox_item_id' into v_emergency_id;
        v_partner_count := v_partner_count + 1;
      end loop;

      if v_partner_count = 0 then
        select (public.produce_inbox_item(
          p_household_id => v_household_id,
          p_kind => 'emergency_declaration',
          p_source_type => 'plan_movement',
          p_source_id => v_movement_id,
          p_amount => p_amount,
          p_currency => (select base_currency from public.households where id = v_household_id),
          p_title => 'Emergency reallocation declared',
          p_assigned_to_user_id => v_user_id,
          p_context => jsonb_build_object(
            'event', 'EmergencyDeclaredEvent',
            'intentNote', v_note,
            'sourceJarId', p_source_jar_id,
            'targetJarId', p_target_jar_id,
            'executedByUserId', v_user_id,
            'priority', 'high',
            'soloAudit', true
          )
        ))->>'inbox_item_id' into v_emergency_id;
      end if;
    end;
  end if;

  return jsonb_build_object(
    'plan_movement_id', v_movement_id,
    'source_jar_id', p_source_jar_id,
    'target_jar_id', p_target_jar_id,
    'amount', p_amount,
    'period_month', v_period,
    'is_emergency', v_is_emergency,
    'inbox_item_id', v_movement_id,
    'ledger_transactions_created', 0,
    'ledger_impact', 0
  );
end;
$function$;

create or replace function public.get_plan_jar_budget_raw_inputs(p_now timestamptz default now())
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with scoped_household as (
    select public.investment_active_household() as household_id
  ),
  settings as (
    select
      h.id as household_id,
      coalesce(h.timezone, 'Asia/Ho_Chi_Minh') as timezone,
      h.base_currency,
      h.month_close_mode,
      h.income_allocate_mode,
      h.qualifying_monthly_income
    from public.households h
    join scoped_household scoped on scoped.household_id = h.id
  ),
  periods as (
    select
      settings.*,
      date_trunc('month', p_now at time zone settings.timezone)::date
        as current_period_month
    from settings
  ),
  period_bounds as (
    select
      periods.*,
      (periods.current_period_month - interval '1 month')::date
        as previous_period_month
    from periods
  ),
  jar_rows as (
    select
      j.id,
      j.name,
      j.kind,
      j.sort_order,
      j.is_archived,
      j.is_paused,
      j.rollover_mode,
      jp.plan_kind,
      jp.percent_bps,
      jp.fixed_amount
    from public.jars j
    left join lateral (
      select
        p.plan_kind,
        p.percent_bps,
        p.fixed_amount
      from public.jar_plans p
      where p.jar_id = j.id
        and p.household_id = j.household_id
      order by p.created_at desc, p.id desc
      limit 1
    ) jp on true
    join period_bounds periods on periods.household_id = j.household_id
  ),
  period_transactions as (
    select
      case
        when t.transaction_date >= periods.current_period_month
         and t.transaction_date < periods.current_period_month + interval '1 month'
          then 'current'
        else 'previous'
      end as period_kind,
      t.transaction_date,
      t.created_at,
      jsonb_build_object(
        'id', t.id,
        'financial_scope', a.financial_scope,
        'type', t.type,
        'amount', t.amount,
        'status', t.status,
        'jar_id', t.jar_id,
        'savings_event_kind', t.savings_event_kind,
        'reverses_transaction_id', t.reverses_transaction_id,
        'corrects_transaction_id', t.corrects_transaction_id,
        'is_reversal', t.is_reversal
      ) as row_data
    from public.transactions t
    join public.accounts a
      on a.id = t.account_id
     and a.household_id = t.household_id
     and a.financial_scope in ('household', 'personal')
    join period_bounds periods on periods.household_id = t.household_id
    where t.household_id = periods.household_id
      and (
        a.financial_scope = 'household'
        or (
          a.financial_scope = 'personal'
          and (
            t.jar_id is not null
            or t.reverses_transaction_id is not null
            or t.corrects_transaction_id is not null
            or coalesce(t.is_reversal, false)
          )
        )
      )
      and (
        (
          t.transaction_date >= periods.current_period_month
          and t.transaction_date < periods.current_period_month + interval '1 month'
        )
        or (
          t.transaction_date >= periods.previous_period_month
          and t.transaction_date < periods.current_period_month
        )
      )
  ),
  period_loan_payments as (
    select
      case
        when lp.paid_at >= periods.current_period_month
         and lp.paid_at < periods.current_period_month + interval '1 month'
          then 'current'
        else 'previous'
      end as period_kind,
      lp.transaction_id
    from public.loan_payments lp
    join period_bounds periods on periods.household_id = lp.household_id
    where lp.household_id = periods.household_id
      and (
        (
          lp.paid_at >= periods.current_period_month
          and lp.paid_at < periods.current_period_month + interval '1 month'
        )
        or (
          lp.paid_at >= periods.previous_period_month
          and lp.paid_at < periods.current_period_month
        )
      )
  ),
  recurring_income as (
    select
      r.id,
      r.name,
      r.direction,
      r.amount,
      r.frequency,
      r.interval_count,
      r.day_of_month,
      r.day_of_week,
      r.start_date,
      r.next_run_date,
      r.is_active
    from public.recurring_rules r
    join period_bounds periods on periods.household_id = r.household_id
    where r.household_id = periods.household_id
      and r.direction = 'income'
      and r.is_active = true
  ),
  snapshots as (
    select
      s.id,
      s.household_id,
      s.jar_id,
      s.period_month,
      s.jar_name,
      s.plan_kind,
      s.percent_bps,
      s.fixed_amount,
      s.rollover_mode,
      s.qualifying_income,
      s.qualifying_income_source,
      s.rule_budget,
      s.rollover_credit
    from public.jar_period_rule_snapshots s
    join period_bounds periods on periods.household_id = s.household_id
    where s.household_id = periods.household_id
      and s.period_month in (
        periods.current_period_month,
        periods.previous_period_month
      )
      and exists (
        select 1
        from jar_rows jars
        where jars.id = s.jar_id
          and jars.is_archived = false
          and jars.is_paused = false
      )
  ),
  adjustments as (
    select
      a.jar_id,
      a.period_month,
      a.amount
    from public.jar_period_adjustments a
    join period_bounds periods on periods.household_id = a.household_id
    where a.household_id = periods.household_id
      and a.period_month in (
        periods.current_period_month,
        periods.previous_period_month
      )
      and exists (
        select 1
        from jar_rows jars
        where jars.id = a.jar_id
          and jars.is_archived = false
          and jars.is_paused = false
      )
  )
  select jsonb_build_object(
    'household_id', periods.household_id,
    'timezone', periods.timezone,
    'base_currency', periods.base_currency,
    'month_close_mode', periods.month_close_mode,
    'income_allocate_mode', periods.income_allocate_mode,
    'qualifying_monthly_income', periods.qualifying_monthly_income,
    'current_period_month', periods.current_period_month,
    'previous_period_month', periods.previous_period_month,
    'jars', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', jars.id,
          'name', jars.name,
          'kind', jars.kind,
          'sort_order', jars.sort_order,
          'is_archived', jars.is_archived,
          'is_paused', jars.is_paused,
          'rollover_mode', jars.rollover_mode,
          'jar_plans', case
            when jars.plan_kind is null then null
            else jsonb_build_object(
              'plan_kind', jars.plan_kind,
              'percent_bps', jars.percent_bps,
              'fixed_amount', jars.fixed_amount
            )
          end
        )
        order by jars.sort_order asc, jars.id asc
      )
      from jar_rows jars
    ), '[]'::jsonb),
    'current_transactions', coalesce((
      select jsonb_agg(
        transactions.row_data
        order by transactions.transaction_date asc, transactions.created_at asc
      ) filter (where transactions.period_kind = 'current')
      from period_transactions transactions
    ), '[]'::jsonb),
    'previous_transactions', coalesce((
      select jsonb_agg(
        transactions.row_data
        order by transactions.transaction_date asc, transactions.created_at asc
      ) filter (where transactions.period_kind = 'previous')
      from period_transactions transactions
    ), '[]'::jsonb),
    'current_loan_payment_ids', coalesce((
      select jsonb_agg(payments.transaction_id order by payments.transaction_id)
      from period_loan_payments payments
      where payments.period_kind = 'current'
    ), '[]'::jsonb),
    'previous_loan_payment_ids', coalesce((
      select jsonb_agg(payments.transaction_id order by payments.transaction_id)
      from period_loan_payments payments
      where payments.period_kind = 'previous'
    ), '[]'::jsonb),
    'recurring_income', coalesce((
      select jsonb_agg(to_jsonb(income) order by income.id)
      from recurring_income income
    ), '[]'::jsonb),
    'snapshots', coalesce((
      select jsonb_agg(to_jsonb(snapshot) order by snapshot.jar_id, snapshot.period_month)
      from snapshots snapshot
    ), '[]'::jsonb),
    'adjustments', coalesce((
      select jsonb_agg(to_jsonb(adjustment) order by adjustment.jar_id, adjustment.period_month)
      from adjustments adjustment
    ), '[]'::jsonb)
  )
  from period_bounds periods;
$function$;

revoke all on function public.get_plan_jar_budget_raw_inputs(timestamptz) from public;
grant execute on function public.get_plan_jar_budget_raw_inputs(timestamptz) to authenticated;
