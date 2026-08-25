-- Repair Savings placement RPC dependencies on databases where the helper
-- migration was skipped or applied out of order.

create or replace function public.household_base_currency(p_household_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select upper(h.base_currency)
      from public.households h
      where h.id = p_household_id
    ),
    'VND'
  );
$$;

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
  p_renewal_config jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_product_account_id uuid;
  v_saving_id uuid;
  v_cycle_id uuid;
  v_funding_tx_id uuid;
  v_receiving_tx_id uuid;
  v_transfer_group_id uuid := gen_random_uuid();
  v_currency text;
  v_policy text;
  v_existing_saving_id uuid;
  v_existing_cycle_id uuid;
  v_provider_family text;
  v_product_currency text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;
  if p_principal is null or p_principal <= 0 then raise exception 'Principal must be positive'; end if;

  if p_idempotency_key is not null then
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc
    join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = p_idempotency_key || ':out'
    limit 1;
    if v_existing_saving_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_existing_saving_id, 'cycleId', v_existing_cycle_id, 'idempotentReplay', true);
    end if;
  end if;

  select p.family into v_provider_family
  from public.saving_providers p
  where p.id = p_provider_id and p.is_active = true
    and (p.household_id is null or public.is_household_member(p.household_id));
  if v_provider_family is null then raise exception 'Invalid or archived Savings provider'; end if;

  v_currency := public.household_base_currency(v_household_id);
  v_product_currency := coalesce(p_product_snapshot->>'currency', v_currency);
  if upper(v_product_currency) <> upper(v_currency) then raise exception 'Currency mismatch'; end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_funding_account_id and a.household_id = v_household_id
      and a.is_archived = false and a.type not in ('credit_card', 'savings_product')
  ) then raise exception 'Invalid funding account'; end if;
  if not exists (
    select 1 from public.accounts a
    where a.id = p_settlement_account_id and a.household_id = v_household_id
      and a.is_archived = false and a.type not in ('credit_card', 'savings_product')
  ) then raise exception 'Invalid settlement account'; end if;

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

  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
  ) values (
    v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
    p_cycle_start_date, 'Gửi tiết kiệm: ' || p_product_name, 'cleared', v_transfer_group_id,
    nullif(p_idempotency_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_funding_tx_id;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
  ) values (
    v_household_id, v_product_account_id, 'transfer_in', p_principal, v_currency,
    p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'cleared', v_transfer_group_id,
    nullif(p_idempotency_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_receiving_tx_id;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, renewal_policy, renewal_config, created_by
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, p_product_snapshot, v_policy, coalesce(p_renewal_config, '{}'::jsonb), v_user_id
  ) returning id into v_saving_id;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date, principal, locked_rate,
    package_snapshot, status, funding_transaction_id
  ) values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date, p_principal,
    coalesce((p_product_snapshot->>'annualInterestRate')::numeric, 0),
    p_package_snapshot || jsonb_build_object('providerFamily', v_provider_family),
    'active', v_funding_tx_id
  ) returning id into v_cycle_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving_id,
    'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id,
    'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', v_transfer_group_id,
    'idempotentReplay', false
  );
end;
$$;

grant execute on function public.household_base_currency(uuid) to authenticated;
grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text
) to authenticated;
;
