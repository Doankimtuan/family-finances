-- Savings early-withdrawal safety patch.
-- Keeps eligible interest as earned income, but returns the settlement amount
-- from the internal savings-product account through neutral transfer legs.

create or replace function public.early_withdraw_saving(
  p_cycle_id uuid,
  p_principal numeric,
  p_accrued_interest numeric,
  p_eligible_interest numeric,
  p_penalty_amount numeric,
  p_net_returned numeric,
  p_penalty_strategy text,
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
  v_eligible numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_ew_id uuid;
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

  if v_cycle.status <> 'active' then
    if v_cycle.status = 'early_closed'
       and v_cycle.settlement_result is not null
       and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object(
        'ok', true,
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'netReturned', coalesce((v_cycle.settlement_result->>'netAmount')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id,
        'idempotentReplay', true
      );
    end if;
    raise exception 'Only active cycles can be withdrawn early';
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

  if p_principal is null or p_principal <= 0 then
    raise exception 'Principal must be positive';
  end if;

  v_eligible := greatest(coalesce(p_eligible_interest, 0), 0);
  v_net := greatest(coalesce(p_net_returned, p_principal + v_eligible), 0);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;
  v_group_id := gen_random_uuid();

  if v_eligible > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date,
      note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_eligible, v_currency,
      v_today, 'Lãi rút trước hạn: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, transfer_group_id, created_by, source
  )
  values (
    v_saving.household_id, v_product_account_id, 'transfer_out', v_net, v_currency,
    v_today, 'Rút trước hạn: ' || v_saving.product_name, 'posted',
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_out_tx;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, transfer_group_id, created_by, source
  )
  values (
    v_saving.household_id, v_settlement_id, 'transfer_in', v_net, v_currency,
    v_today, 'Nhận tiền rút trước hạn: ' || v_saving.product_name, 'posted',
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_in_tx;

  update public.saving_cycles
  set
    status = 'early_closed',
    accrued_interest = coalesce(p_accrued_interest, 0),
    settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object(
      'action', 'withdraw',
      'principalReturned', p_principal,
      'interestReturned', v_eligible,
      'penaltyApplied', coalesce(p_penalty_amount, 0),
      'netAmount', v_net,
      'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id,
      'transferGroupId', v_group_id,
      'interestTransactionId', v_interest_tx
    )
  where id = v_cycle.id;

  update public.savings
  set status = 'early_closed', updated_at = timezone('utc', now())
  where id = v_saving.id;

  insert into public.early_withdrawals (
    cycle_id, saving_id, principal, accrued_interest,
    eligible_interest, penalty_amount, net_returned,
    penalty_strategy, settlement_transaction_id, executed_by
  )
  values (
    v_cycle.id, v_saving.id, p_principal, coalesce(p_accr    v_cycle.id, v_savingeligible, coalesce(p_penalty_amount, 0), v_net,
    coalesce(p_penalty_strategy, 'no_interest'), v_in_tx, v_user_id
  )
  returning id into v_ew_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'cycleId', v_cycle.id,
    'earlyWithdrawalId', v_ew_id,
    'netReturned', v_net,
    'settlementTransactionId', v_in_tx,
    'transferGroupId', v_group_id,
    'idempotentReplay', false
  );
end;
$$;

grant execute on function public.early_withdraw_saving(
  uuid, numeric, numeric, numeric, numeric, numeric, text, uuid
) to authenticated;
