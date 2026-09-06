-- Keep corrected transactions and credit-card billing in one atomic operation.
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
  v_jar_id := coalesce(p_jar_id, v_original.jar_id);
  v_date := coalesce(p_transaction_date, v_original.transaction_date);

  select * into v_account
  from public.accounts a
  where a.id = v_account_id
    and a.household_id = v_original.household_id
    and a.is_archived = false;
  if not found then raise exception 'Account not found'; end if;

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

-- Repair historical card corrections that have a ledger row but no billing item.
DO $$
declare
  v_tx record;
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
  for v_tx in
    select
      t.id,
      t.household_id,
      t.account_id,
      t.type,
      t.amount,
      t.transaction_date,
      t.note,
      s.statement_day,
      s.due_day
    from public.transactions t
    join public.accounts a
      on a.id = t.account_id
     and a.household_id = t.household_id
    join public.credit_card_settings s
      on s.account_id = a.id
     and s.household_id = a.household_id
    where a.type = 'credit_card'
      and t.type in ('income', 'expense')
      and t.corrects_transaction_id is not null
      and not exists (
        select 1
        from public.card_billing_items i
        where i.transaction_id = t.id
      )
    order by t.transaction_date, t.created_at, t.id
  loop
    v_statement_day := least(31, greatest(1, v_tx.statement_day));
    v_due_day := least(31, greatest(1, v_tx.due_day));
    v_signed_amount := case when v_tx.type = 'income' then -abs(v_tx.amount) else abs(v_tx.amount) end;
    v_billing_month := date_trunc('month', v_tx.transaction_date)::date;

    if v_tx.type = 'expense' and extract(day from v_tx.transaction_date)::int > v_statement_day then
      v_billing_month := (v_billing_month + interval '1 month')::date;
    elsif v_tx.type = 'income' then
      select m.billing_month into v_billing_month
      from public.card_billing_months m
      where m.household_id = v_tx.household_id
        and m.card_account_id = v_tx.account_id
        and m.status <> 'settled'
      order by m.billing_month desc
      limit 1;
      v_billing_month := coalesce(v_billing_month, date_trunc('month', v_tx.transaction_date)::date);
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
    where m.household_id = v_tx.household_id
      and m.card_account_id = v_tx.account_id
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
        v_tx.household_id, v_tx.account_id, v_billing_month, v_statement_amount,
        0, v_due_date, case when v_statement_amount <= 0 then 'settled' else 'open' end
      ) returning * into v_month;
    end if;

    insert into public.card_billing_items (
      household_id, billing_month_id, card_account_id, transaction_id,
      description, amount, fee_amount, item_type, is_paid, is_converted_to_installment
    ) values (
      v_tx.household_id, v_month.id, v_tx.account_id, v_tx.id,
      nullif(trim(coalesce(v_tx.note, '')), ''), v_signed_amount, 0, 'standard', false, false
    );
  end loop;
end;
$$;
