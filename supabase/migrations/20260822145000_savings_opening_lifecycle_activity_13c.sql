begin;

-- Historical openings are position seeds, so the source side of the aggregate
-- and its cycle funding transaction must be nullable.
alter table public.savings
  alter column funding_account_id drop not null;

drop function if exists public.create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text, text);
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
  p_idempotency_key text,
  p_financial_scope text default 'household',
  p_creation_mode text default 'LIVE_DEPOSIT'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_owner_membership_id uuid;
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
  v_config jsonb := coalesce(p_renewal_config, '{}'::jsonb);
  v_instruction jsonb;
  v_scope text := lower(trim(coalesce(p_financial_scope, 'household')));
  v_mode text := upper(trim(coalesce(p_creation_mode, 'LIVE_DEPOSIT')));
  v_snapshot jsonb := coalesce(p_product_snapshot, '{}'::jsonb);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_mode not in ('LIVE_DEPOSIT', 'HISTORICAL_OPENING') then
    raise exception 'Invalid Savings creation mode';
  end if;
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;
  if v_scope not in ('household', 'personal') then raise exception 'Invalid financial scope'; end if;
  select public.active_membership_id(v_household_id) into v_owner_membership_id;
  if v_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_scope = 'household' then v_owner_membership_id := null; end if;
  if p_principal is null or p_principal <= 0 then raise exception 'Principal must be positive'; end if;
  if p_cycle_start_date is null or p_cycle_end_date is null or p_cycle_end_date <= p_cycle_start_date then
    raise exception 'Invalid Savings cycle dates';
  end if;
  if nullif(trim(p_product_name), '') is null
    or nullif(trim(v_snapshot->>'providerId'), '') is null
    or v_snapshot->>'providerId' <> p_provider_id::text
    or nullif(trim(v_snapshot->>'packageId'), '') is null
    or nullif(trim(coalesce(p_package_snapshot->>'packageId', '')), '') is null
    or nullif(trim(v_snapshot->>'interestCalculationMethod'), '') is null
  then
    raise exception 'Invalid Savings product snapshot';
  end if;
  if v_snapshot->>'interestCalculationMethod' not in ('simple', 'compound_daily', 'compound_monthly') then
    raise exception 'Invalid Savings interest method';
  end if;

  if nullif(trim(p_idempotency_key), '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(
      'savings:create:' || v_household_id::text || ':' || trim(p_idempotency_key), 0
    ));
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc
    join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = trim(p_idempotency_key) || ':out'
    limit 1;
    if v_existing_saving_id is null then
      select s.id, sc.id into v_existing_saving_id, v_existing_cycle_id
      from public.savings s
      join public.saving_cycles sc on sc.saving_id = s.id and sc.cycle_number = 1
      where s.household_id = v_household_id
        and s.product_snapshot->>'creationIdempotencyKey' = trim(p_idempotency_key)
      limit 1;
    end if;
    if v_existing_saving_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_existing_saving_id,
        'cycleId', v_existing_cycle_id, 'idempotentReplay', true);
    end if;
  end if;

  select p.family into v_provider_family
  from public.saving_providers p
  where p.id = p_provider_id and p.is_active = true
    and (p.household_id is null or public.is_household_member(p.household_id));
  if v_provider_family is null then raise exception 'Invalid or archived Savings provider'; end if;

  v_currency := public.household_base_currency(v_household_id);
  v_product_currency := coalesce(v_snapshot->>'currency', v_currency);
  if upper(v_product_currency) <> upper(v_currency) then raise exception 'Currency mismatch'; end if;
  if not public.savings_is_eligible_liquid_account(p_settlement_account_id, v_household_id) then
    raise exception 'Invalid settlement account';
  end if;

  if v_mode = 'LIVE_DEPOSIT' then
    if p_funding_account_id is null then raise exception 'Funding account is required'; end if;
    if p_funding_account_id = p_settlement_account_id then raise exception 'Funding and settlement accounts must differ'; end if;
    if not public.savings_is_eligible_liquid_account(p_funding_account_id, v_household_id) then
      raise exception 'Invalid funding account';
    end if;
  elsif p_funding_account_id is not null then
    raise exception 'Historical opening does not accept a funding account';
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
  v_instruction := jsonb_build_object(
    'strategy', coalesce(v_config->>'strategy', v_config->>'preferredSettlementRule', v_snapshot->>'settlementRule', 'withdraw_everything'),
    'targetMode', coalesce(v_config->>'targetMode', case when nullif(v_config->>'preferredPackageId', '') is null then 'keep_current_package' else 'select_package' end),
    'targetPackageId', coalesce(nullif(v_config->>'targetPackageId', ''), nullif(v_config->>'preferredPackageId', '')),
    'payoutAccountId', coalesce(nullif(v_config->>'payoutAccountId', ''), nullif(v_config->>'preferredSettlementAccountId', '')),
    'fallbackPolicy', coalesce(v_config->>'fallbackPolicy', 'ask_user')
  );
  v_snapshot := v_snapshot || jsonb_build_object('creationMode', v_mode,
    'creationIdempotencyKey', nullif(trim(p_idempotency_key), ''));

  if v_mode = 'LIVE_DEPOSIT' then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
      p_cycle_start_date, 'Gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
    ) returning id into v_funding_tx_id;
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, public.get_or_create_savings_product_account(v_household_id), 'transfer_in', p_principal, v_currency,
      p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
    ) returning id into v_receiving_tx_id;
  end if;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction,
    created_by, financial_scope, owner_membership_id
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, v_snapshot, v_policy, v_config, v_instruction,
    v_user_id, v_scope, v_owner_membership_id
  ) returning id into v_saving_id;
  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date, principal, locked_rate,
    package_snapshot, status, funding_transaction_id
  ) values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date, p_principal,
    coalesce((v_snapshot->>'annualInterestRate')::numeric, 0),
    p_package_snapshot || jsonb_build_object('providerFamily', v_provider_family),
    'active', v_funding_tx_id
  ) returning id into v_cycle_id;
  return jsonb_build_object('ok', true, 'savingId', v_saving_id, 'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id, 'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', case when v_mode = 'LIVE_DEPOSIT' then v_transfer_group_id else null end,
    'creationMode', v_mode, 'idempotentReplay', false);
end;
$$;

grant execute on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) to authenticated;
revoke execute on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) from public, anon;

commit;
