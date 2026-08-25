-- Savings placement safety patch.
-- New placements are owned-asset transfers, not ordinary Expense/Income.
-- This migration preserves the existing immutable Savings-cycle API while making
-- the funding ledger neutral and replay-safe.

create or replace function public.create_saving_with_transfer(
  p_funding_account_id uuid,
  p_principal numeric,
  p_provider_id uuid,
  p_product_name text,
  p_product_snapshot jsonb,
  p_renewal_preference text,
  p_settlement_account_id uuid,
  p_cycle_start_date date,
  p_cycle_end_date date,
  p_package_snapshot jsonb,
  p_renewal_config jsonb default '{}'::jsonb,
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
  v_product_account_id uuid;
  v_saving_id uuid;
  v_cycle_id uuid;
  v_funding_tx_id uuid;
  v_receiving_tx_id uuid;
  v_existing_out public.transactions%rowtype;
  v_existing_in public.transactions%rowtype;
  v_group_id uuid;
  v_today date;
  v_currency text;
  v_policy text;
  v_config jsonb;
  v_key text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_principal is null or p_principal <= 0 or p_principal <> trunc(p_principal) then
    raise exception 'Principal must be a positive whole number';
  end if;
  if p_provider_id is null or p_product_snapshot is null or p_package_snapshot is null then
    raise exception 'Savings product configuration required';
  end if;
  if p_settlement_account_id is null then
    raise exception 'Settlement account required';
  end if;

  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_key is not null then
    select * into v_existing_out
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = v_key || ':out'
      and t.type = 'transfer_out'
    limit 1;

    if found then
      select * into v_existing_in
      from public.transactions t
      where t.household_id = v_household_id
        and t.idempotency_key = v_key || ':in'
        and t.type = 'transfer_in'
      limit 1;
      if not found then
        raise exception 'Savings placement replay is incomplete';
      end if;

      select sc.saving_id, sc.id
        into v_saving_id, v_cycle_id
      from public.saving_cycles sc
      where sc.funding_transaction_id = v_existing_out.id
      order by sc.created_at asc
      limit 1;
      if v_saving_id is null or v_cycle_id is null then
        raise exception 'Savings placement replay has no cycle';
      end if;
      return jsonb_build_object(
        'ok', true,
        'savingId', v_saving_id,
        'cycleId', v_cycle_id,
        'fundingTransactionId', v_existing_out.id,
        'idempotentReplay', true
      );
    end if;
  end if;

  if not exists (
    select 1 from public.saving_providers sp
    where sp.id = p_provider_id and sp.is_active = true
  ) then
    raise exception 'Active savings provider required';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_funding_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and a.type not in ('credit_card', 'savings_product')
  ) then
    raise exception 'Invalid funding account';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_settlement_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and a.type not in ('credit_card', 'savings_product')
  ) then
    raise exception 'Invalid settlement account';
  end if;

  v_policy := case p_renewal_preference
    when 'manual_review' then 'always_ask'
    when 'auto_renew_same_package' then 'auto_renew_until_cancelled'
    when 'auto_renew_selected_package' then 'auto_renew_until_cancelled'
    when 'withdraw_everything' then 'use_saved_preference'
    when 'always_ask' then 'always_ask'
    when 'use_saved_preference' then 'use_saved_preference'
    when 'auto_renew_until_cancelled' then 'auto_renew_until_cancelled'
    when 'one_time_renewal' then 'one_time_renewal'
    else 'always_ask'
  end;
  v_config := coalesce(p_renewal_config, '{}'::jsonb);
  if v_policy = 'use_saved_preference' and v_config = '{}'::jsonb then
    v_config := jsonb_build_object(
      'preferredPackageId', null,
      'preferredSettlementRule', 'withdraw_everything',
      'preferredSettlementAccountId', p_settlement_account_id
    );
  end if;

  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);
  v_currency := public.household_base_currency(v_household_id);
  v_today := coalesce(p_cycle_start_date, (timezone('utc', now()))::date);
  v_group_id := gen_random_uuid();

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, idempotency_key, transfer_group_id, created_by, source
  )
  values (
    v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
    v_today, 'Gửi tiết kiệm: ' || p_product_name, 'posted',
    case when v_key is null then null else v_key || ':out' end,
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_funding_tx_id;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, status, idempotency_key, transfer_group_id, created_by, source
  )
  values (
    v_household_id, v_product_account_id, 'transfer_in', p_principal, v_currency,
    v_today, 'Gửi tiết kiệm: ' || p_product_name, 'posted',
    case when v_key is null then null else v_key || ':in' end,
    v_group_id, v_user_id, 'manual'
  )
  returning id into v_receiving_tx_id;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id,
    provider_id, product_name, product_snapshot, renewal_policy,
    renewal_config, created_by
  )
  values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id,
    p_provider_id, p_product_name, p_product_snapshot, v_policy,
    v_config, v_user_id
  )
  returning id into v_saving_id;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date, principal, locked_rate,
    package_snapshot, status, funding_transaction_id
  )
  values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date, p_principal,
    coalesce(
      (p_product_snapshot->>'annualInterestRate')::numeric,
      (p_package_snapshot->>'annualInterestRate')::numeric,
      0
    ), p_package_snapshot, 'active', v_funding_tx_id
  )
  returning id into v_cycle_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving_id,
    'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id,
    'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', v_group_id,
    'idempotentReplay', false
  );
end;
$$;
grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text
) to authenticated;
