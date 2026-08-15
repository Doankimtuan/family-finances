-- Savings maturity settlement safety patch.
-- Principal + realized interest leave the internal savings-product account via
-- transfer legs. The separate income entry preserves earned-interest reporting;
-- the destination account does not receive principal as ordinary Income.

create or replace function public.settle_saving_cycle(
  p_cycle_id uuid,
  p_settlement_account_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_interest numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_group_id uuid;
  v_currency text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id
  for update;
  if not found then
    raise exception 'Cycle not found';
  end if;

  -- Safe replay: a completed settlement returns its original receipt instead
  -- of creating another pair of ledger legs.
  if v_cycle.status <> 'matured' then
    if v_cycle.settlement_result is not null
       and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object(
        'ok', true,
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'netAmount', coalesce((v_cycle.settlement_result->>'netAmount')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id,
        'idempotentReplay', true
      );
    end if;
    raise exception 'Cycle must be matured to settle';
  end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id
  for update;
  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  if not exists (
    select 1 from public.accounts a
    where a.id = v_settlement_id
      and a.household_id = v_saving.household_id
      and a.is_archived = false
      and a.type not in ('credit_card', 'savings_product')
  ) then
    raise exception 'Invalid settlement account';
  end if;

  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;
  v_interest := greatest(coalesce(v_cycle.accrued_interest, 0), 0);
  v_net := v_cycle.principal + v_interest;
  v_group_id := gen_random_uuid();

  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date,
      note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency,
      v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, transfer_group_id, created_by, source
  )
  values (
    v_saving.household_id, v_product_account_id, 'transfer_out', v_net, v_currency,
    v_today, 'Tất toán tiết kiệm: ' || v_saving.product_name, 'posted',
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_out_tx;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, transfer_group_id, created_by, source
  )
  values (
    v_saving.household_id, v_settlement_id, 'transfer_in', v_net, v_currency,
    v_today, 'Tất toán tiết kiệm: ' || v_saving.product_name, 'posted',
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_in_tx;

  update public.saving_cycles
  set
    status = 'rolled',
    settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object(
      'action', 'withdraw',
      'principalReturned', v_cycle.principal,
      'interestReturned', v_interest,
      'penaltyApplied', 0,
      'netAmount', v_net,
      'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id,
      'transferGroupId', v_group_id,
      'interestTransactionId', v_interest_tx
    )
  where id = v_cycle.id;

  update public.savings
  set status = 'closed', updated_at = timezone('utc', now())
  where id = v_saving.id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'cycleId', v_cycle.id,
    'netAmount', v_net,
    'settlementTransactionId', v_in_tx,
    'transferGroupId', v_group_id,
    'idempotentReplay', false
  );
end;
$$;

grant execute on function public.settle_saving_cycle(uuid, uuid) to authenticated;
