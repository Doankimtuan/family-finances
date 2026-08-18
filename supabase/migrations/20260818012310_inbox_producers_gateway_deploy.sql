-- PROMPT 13D — deploy gateway-based producer definitions to the dev project.
-- 13B edited the migration files but they were never applied to the remote DB;
-- this migration re-applies the live producer functions so the canonical
-- producer → produce_inbox_item → inbox_items chain actually runs.

-- record_transaction (gateway version)
create or replace function public.record_transaction(
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_transaction_date date default (timezone('utc', now()))::date,
  p_note text default null,
  p_category_id uuid default null,
  p_jar_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

  select a.name into v_account_name
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

    if v_jar_id is null and v_category_jar is not null then
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
    when p_type = 'expense' and v_jar_id is null then 'pending_mapping'
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

  if p_type = 'expense' and v_jar_id is null then
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
$$;

revoke all on function public.record_transaction(uuid, text, numeric, date, text, uuid, uuid, text) from public;
grant execute on function public.record_transaction(uuid, text, numeric, date, text, uuid, uuid, text) to authenticated;

-- record_loan_payment (gateway version)
create or replace function public.record_loan_payment(
  p_loan_id uuid,
  p_account_id uuid,
  p_mode text default 'scheduled',
  p_paid_at date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_account public.accounts%rowtype;
  v_entry public.loan_schedule_entries%rowtype;
  v_amount numeric;
  v_principal numeric;
  v_interest numeric;
  v_paid_at date;
  v_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);

  -- Mutating early payoff is not authorized in F5.
  if coalesce(p_mode, 'scheduled') <> 'scheduled' then
    raise exception 'Only scheduled loan payment is allowed';
  end if;

  select * into v_loan
  from public.loans l
  where l.id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_loan.status <> 'active' or v_loan.remaining_principal <= 0 then
    raise exception 'Loan already completed';
  end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_loan.household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if v_account.type = 'credit_card' then
    raise exception 'Loan payment cannot use a credit card account';
  end if;

  select * into v_entry
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial')
  order by e.sequence
  limit 1
  for update;

  if not found then
    raise exception 'No upcoming schedule entry';
  end if;

  v_principal := least(v_entry.principal_due, v_loan.remaining_principal);
  v_interest := v_entry.interest_due;
  v_amount := v_principal + v_interest;

  if v_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

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
    created_by
  )
  values (
    v_loan.household_id,
    p_account_id,
    'liability_payment',
    v_amount,
    v_loan.currency,
    v_paid_at,
    null,
    null,
    null,
    'posted',
    v_user_id
  )
  returning id into v_tx_id;

  insert into public.loan_payments (
    household_id,
    loan_id,
    account_id,
    transaction_id,
    amount,
    principal_paid,
    interest_paid,
    paid_at,
    created_by
  )
  values (
    v_loan.household_id,
    p_loan_id,
    p_account_id,
    v_tx_id,
    v_amount,
    v_principal,
    v_interest,
    v_paid_at,
    v_user_id
  )
  returning id into v_payment_id;

  v_remaining := greatest(0, v_loan.remaining_principal - v_principal);
  v_completed := v_remaining <= 0;

  update public.loan_schedule_entries e
  set
    status = 'paid',
    paid_at = v_paid_at,
    loan_payment_id = v_payment_id,
    updated_at = timezone('utc', now())
  where e.id = v_entry.id;

  select e.due_date into v_next
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status = 'upcoming'
  order by e.sequence
  limit 1;

  update public.loans l
  set
    remaining_principal = v_remaining,
    status = case when v_completed then 'completed' else 'active' end,
    next_payment_date = case when v_completed then null else v_next end,
    updated_at = timezone('utc', now())
  where l.id = p_loan_id;

  if v_completed then
    v_item_id := (
      select (public.produce_inbox_item(
        p_household_id => v_loan.household_id,
        p_kind => 'emi_complete',
        p_source_type => 'guided',
        p_source_id => p_loan_id,
        p_amount => v_loan.monthly_payment,
        p_currency => v_loan.currency,
        p_title => v_loan.name,
        p_context => jsonb_build_object(
          'flow', 'loan_complete',
          'loan_id', p_loan_id,
          'principal', v_loan.principal
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paymentId', v_payment_id,
    'transactionId', v_tx_id,
    'remainingPrincipal', v_remaining,
    'completed', v_completed,
    'inboxItemId', v_item_id,
    'amount', v_amount,
    'principalPaid', v_principal,
    'interestPaid', v_interest,
    'feePaid', 0,
    'sourceDelta', -v_amount,
    'scheduleEntryId', v_entry.id
  );
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, text, date) from public;

-- detect_matured_savings (gateway version)
create or replace function public.detect_matured_savings(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle record;
  v_days int;
  v_accrued numeric;
  v_prev_rate numeric;
  v_provider_name text;
  v_item_id uuid;
  v_count int := 0;
  v_currency text;
  v_suggested text;
  v_confidence numeric;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_currency := public.household_base_currency(p_household_id);

  for v_cycle in
    select
      sc.*,
      s.provider_id,
      s.product_name,
      s.product_snapshot,
      s.renewal_policy,
      s.renewal_config,
      s.settlement_account_id,
      s.household_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date <= (timezone('utc', now()))::date
    for update of sc
  loop
    v_days := greatest((v_cycle.end_date - v_cycle.start_date), 0);
    v_accrued := public.savings_simple_interest(
      v_cycle.principal,
      v_cycle.locked_rate,
      v_days
    );

    update public.saving_cycles
    set status = 'matured', accrued_interest = v_accrued
    where id = v_cycle.id;

    update public.savings
    set status = 'matured', updated_at = timezone('utc', now())
    where id = v_cycle.saving_id;

    select sc2.locked_rate into v_prev_rate
    from public.saving_cycles sc2
    where sc2.saving_id = v_cycle.saving_id
      and sc2.cycle_number = v_cycle.cycle_number - 1
    limit 1;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    v_suggested := case v_cycle.renewal_policy
      when 'always_ask' then 'none'
      when 'use_saved_preference' then
        case when coalesce(v_cycle.renewal_config->>'preferredSettlementRule', '') = 'withdraw_everything'
          then 'withdraw'
          else 'confirm_configured'
        end
      when 'auto_renew_until_cancelled' then 'confirm_configured'
      when 'one_time_renewal' then 'confirm_configured'
      else 'none'
    end;

    v_confidence := case v_cycle.renewal_policy
      when 'always_ask' then 0
      when 'use_saved_preference' then 0.7
      when 'auto_renew_until_cancelled' then 0.9
      when 'one_time_renewal' then 0.85
      else 0
    end;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal + v_accrued,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
      p_context => jsonb_build_object(
        'flow', 'savings_maturity',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'providerId', v_cycle.provider_id,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', v_prev_rate,
        'rateDifference', case
          when v_prev_rate is not null then v_cycle.locked_rate - v_prev_rate
          else 0
        end,
        'principal', v_cycle.principal,
        'accruedInterest', v_accrued,
        'estimatedInterest', v_accrued,
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'settlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        ),
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', v_suggested,
        'renewalConfidence', v_confidence,
        'warnings', '[]'::jsonb,
        'preselectedPackageId', v_cycle.renewal_config->>'preferredPackageId',
        'preselectedSettlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'preselectedSettlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        )
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'maturedCount', v_count);
end;
$$;

revoke all on function public.detect_matured_savings(uuid) from public;

-- enqueue_savings_maturity_cascade (gateway version)
create or replace function public.enqueue_savings_maturity_cascade(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle record;
  v_days_left int;
  v_cascade_day int;
  v_currency text;
  v_count int := 0;
  v_provider_name text;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_currency := public.household_base_currency(p_household_id);

  for v_cycle in
    select
      sc.*,
      s.provider_id,
      s.product_name,
      s.product_snapshot,
      s.renewal_policy,
      s.renewal_config,
      s.settlement_account_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date > (timezone('utc', now()))::date
  loop
    v_days_left := (v_cycle.end_date - (timezone('utc', now()))::date);

    if v_days_left in (30, 14, 7, 3, 1) then
      v_cascade_day := v_days_left;
    else
      continue;
    end if;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving')
        || ' — Matures in '
        || v_cascade_day
        || ' days',
      p_context => jsonb_build_object(
        'flow', 'savings_maturity_cascade',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'cascadeDay', v_cascade_day,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', null,
        'rateDifference', 0,
        'principal', v_cycle.principal,
        'accruedInterest', coalesce(v_cycle.accrued_interest, 0),
        'estimatedInterest', coalesce(v_cycle.accrued_interest, 0),
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id,
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', 'none',
        'renewalConfidence', 0,
        'warnings', '[]'::jsonb
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'cascadeCount', v_count);
end;
$$;

revoke all on function public.enqueue_savings_maturity_cascade(uuid) from public;

-- reallocate_jar_capacity (gateway version, restores BR-13 emergency)
create or replace function public.reallocate_jar_capacity(
  p_source_jar_id uuid,
  p_target_jar_id uuid,
  p_amount numeric,
  p_is_emergency boolean default false,
  p_intent_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
      case when t.type in ('income', 'expense', 'investment_buy', 'investment_fee', 'liability_payment') then -t.amount else 0 end
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
$$;

revoke all on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) from public;
