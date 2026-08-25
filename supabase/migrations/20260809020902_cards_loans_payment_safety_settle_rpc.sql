create or replace function public.settle_card_payment(
  p_card_account_id uuid,
  p_source_account_id uuid,
  p_amount numeric,
  p_effective_date date default null,
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
  v_effective date;
  v_existing public.card_payments%rowtype;
  v_card public.accounts%rowtype;
  v_source public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_month record;
  v_outstanding numeric := 0;
  v_left numeric;
  v_applied_total numeric := 0;
  v_due numeric;
  v_apply numeric;
  v_new_paid numeric;
  v_new_status text;
  v_tx_id uuid;
  v_payment_id uuid;
  v_remaining_after numeric := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_card_account_id = p_source_account_id then
    raise exception 'Invalid accounts';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  select h.base_currency into v_currency
  from public.households h
  where h.id = v_household_id;

  v_currency := coalesce(v_currency, 'VND');
  v_effective := coalesce(p_effective_date, (timezone('utc', now()))::date);

  if p_idempotency_key is not null then
    select * into v_existing
    from public.card_payments cp
    where cp.household_id = v_household_id
      and cp.idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'ok', true,
        'transactionId', v_existing.transaction_id,
        'paymentId', v_existing.id,
        'sourceDelta', -v_existing.amount,
        'appliedAmount', v_existing.applied_amount,
        'remainingDue', v_existing.remaining_due_after,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_card
  from public.accounts a
  where a.id = p_card_account_id
    and a.household_id = v_household_id
    and a.type = 'credit_card'
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  select * into v_source
  from public.accounts a
  where a.id = p_source_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if v_source.type = 'credit_card' then
    raise exception 'Source cannot be a credit card';
  end if;

  select * into v_settings
  from public.credit_card_settings s
  where s.account_id = p_card_account_id
    and s.household_id = v_household_id;

  if not found then
    raise exception 'Card settings not found';
  end if;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_outstanding
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  if v_outstanding <= 0 then
    raise exception 'No remaining due';
  end if;

  if p_amount > v_outstanding then
    raise exception 'Amount exceeds remaining due';
  end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, category_id, jar_id, status, idempotency_key, created_by
  )
  values (
    v_household_id, p_source_account_id, 'liability_payment', p_amount, v_currency,
    v_effective, null, null, null, 'posted', null, v_user_id
  )
  returning id into v_tx_id;

  insert into public.card_payments (
    household_id, card_account_id, source_account_id, transaction_id,
    amount, applied_amount, remaining_due_after, effective_date, idempotency_key, created_by
  )
  values (
    v_household_id, p_card_account_id, p_source_account_id, v_tx_id,
    p_amount, 0, v_outstanding, v_effective, p_idempotency_key, v_user_id
  )
  returning id into v_payment_id;

  v_left := p_amount;

  for v_month in
    select *
    from public.card_billing_months m
    where m.household_id = v_household_id
      and m.card_account_id = p_card_account_id
      and m.status in ('open', 'partial')
    order by m.billing_month asc
    for update
  loop
    exit when v_left <= 0;
    v_due := greatest(0, v_month.statement_amount - v_month.paid_amount);
    continue when v_due <= 0;

    v_apply := least(v_left, v_due);
    v_new_paid := v_month.paid_amount + v_apply;
    v_new_status := case
      when v_new_paid >= v_month.statement_amount then 'settled'
      when v_new_paid > 0 then 'partial'
      else 'open'
    end;

    update public.card_billing_months
    set paid_amount = v_new_paid, status = v_new_status, updated_at = timezone('utc', now())
    where id = v_month.id;

    insert into public.card_payment_applications (
      household_id, card_payment_id, billing_month_id, applied_amount
    )
    values (v_household_id, v_payment_id, v_month.id, v_apply);

    if v_new_status = 'settled' then
      update public.card_billing_items
      set is_paid = true, updated_at = timezone('utc', now())
      where billing_month_id = v_month.id
        and is_converted_to_installment = false;
    end if;

    v_left := v_left - v_apply;
    v_applied_total := v_applied_total + v_apply;
  end loop;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_remaining_after
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  update public.card_payments
  set applied_amount = v_applied_total, remaining_due_after = v_remaining_after
  where id = v_payment_id;

  return jsonb_build_object(
    'ok', true,
    'transactionId', v_tx_id,
    'paymentId', v_payment_id,
    'sourceDelta', -p_amount,
    'appliedAmount', v_applied_total,
    'remainingDue', v_remaining_after,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.settle_card_payment(uuid, uuid, numeric, date, text) from public;
grant execute on function public.settle_card_payment(uuid, uuid, numeric, date, text) to authenticated;;
