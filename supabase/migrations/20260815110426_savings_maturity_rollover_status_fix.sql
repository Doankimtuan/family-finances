-- Savings maturity instruction + atomic rollover.

alter table public.savings
  add column if not exists maturity_instruction jsonb not null default jsonb_build_object(
    'strategy', 'withdraw_everything',
    'targetMode', 'keep_current_package',
    'targetPackageId', null,
    'payoutAccountId', null,
    'fallbackPolicy', 'ask_user'
  );

update public.savings
set maturity_instruction = jsonb_build_object(
  'strategy', coalesce(renewal_config->>'preferredSettlementRule', product_snapshot->>'settlementRule', 'withdraw_everything'),
  'targetMode', case
    when nullif(renewal_config->>'preferredPackageId', '') is null then 'keep_current_package'
    else 'select_package'
  end,
  'targetPackageId', nullif(renewal_config->>'preferredPackageId', ''),
  'payoutAccountId', nullif(renewal_config->>'preferredSettlementAccountId', ''),
  'fallbackPolicy', 'ask_user'
)
where maturity_instruction = '{"strategy":"withdraw_everything","targetMode":"keep_current_package","targetPackageId":null,"payoutAccountId":null,"fallbackPolicy":"ask_user"}'::jsonb
  and renewal_config <> '{}'::jsonb;

alter table public.saving_cycles
  add column if not exists previous_cycle_id uuid references public.saving_cycles(id),
  add column if not exists next_cycle_id uuid references public.saving_cycles(id);

create index if not exists idx_saving_cycles_lineage
  on public.saving_cycles (previous_cycle_id, next_cycle_id);

-- Keep the current create API; the richer instruction travels in renewal_config
-- and is copied into the canonical column at creation time.
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
  v_config jsonb := coalesce(p_renewal_config, '{}'::jsonb);
  v_instruction jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;
  if p_principal is null or p_principal <= 0 then raise exception 'Principal must be positive'; end if;

  if p_idempotency_key is not null then
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc
    join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = p_idempotency_key || ':out' limit 1;
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
  v_instruction := jsonb_build_object(
    'strategy', coalesce(v_config->>'strategy', v_config->>'preferredSettlementRule', p_product_snapshot->>'settlementRule', 'withdraw_everything'),
    'targetMode', coalesce(v_config->>'targetMode', case when nullif(v_config->>'preferredPackageId', '') is null then 'keep_current_package' else 'select_package' end),
    'targetPackageId', coalesce(nullif(v_config->>'targetPackageId', ''), nullif(v_config->>'preferredPackageId', '')),
    'payoutAccountId', coalesce(nullif(v_config->>'payoutAccountId', ''), nullif(v_config->>'preferredSettlementAccountId', '')),
    'fallbackPolicy', coalesce(v_config->>'fallbackPolicy', 'ask_user')
  );

  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
  ) values (
    v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
    p_cycle_start_date, 'Gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
    nullif(p_idempotency_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_funding_tx_id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
  ) values (
    v_household_id, v_product_account_id, 'transfer_in', p_principal, v_currency,
    p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
    nullif(p_idempotency_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_receiving_tx_id;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction, created_by
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, p_product_snapshot, v_policy, v_config, v_instruction, v_user_id
  ) returning id into v_saving_id;
  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date, principal, locked_rate,
    package_snapshot, status, funding_transaction_id
  ) values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date, p_principal,
    coalesce((p_product_snapshot->>'annualInterestRate')::numeric, 0),
    p_package_snapshot || jsonb_build_object('providerFamily', v_provider_family), 'active', v_funding_tx_id
  ) returning id into v_cycle_id;
  return jsonb_build_object('ok', true, 'savingId', v_saving_id, 'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id, 'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', v_transfer_group_id, 'idempotentReplay', false);
end;
$$;

grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text
) to authenticated;

create or replace function public.rollover_saving_cycle(
  p_cycle_id uuid,
  p_action text,
  p_target_package_id uuid,
  p_settlement_account_id uuid default null,
  p_cycle_start_date date default null,
  p_cycle_end_date date default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_package record;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_new_cycle_id uuid;
  v_currency text;
  v_today date := timezone('utc', now())::date;
  v_start date := coalesce(p_cycle_start_date, v_today);
  v_end date;
  v_interest numeric := greatest(0, coalesce(v_cycle.accrued_interest, 0));
  v_tax numeric := 0;
  v_net_interest numeric := 0;
  v_new_principal numeric;
  v_tax_rule text;
  v_tax_rate numeric := 0;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_group_id uuid := gen_random_uuid();
  v_action text := lower(trim(coalesce(p_action, '')));
  v_target_id uuid := p_target_package_id;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_action not in ('roll_principal_interest', 'roll_principal_only') then raise exception 'Invalid rollover action'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.is_household_member(v_saving.household_id) then raise exception 'Forbidden'; end if;
  if v_cycle.next_cycle_id is not null then
    return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id,
      'cycleId', v_cycle.next_cycle_id, 'idempotentReplay', true);
  end if;
  if v_cycle.status <> 'matured' then raise exception 'Cycle must be matured to rollover'; end if;
  if v_target_id is null then raise exception 'Target package is required'; end if;

  select sp.id, sp.provider_id, sp.package_name, sp.duration_days, sp.annual_interest_rate,
    sp.min_amount, sp.max_amount, sp.settlement_rules, sp.penalty_rules, sp.renewable_available,
    sp.is_active, sp.term_amount, sp.term_unit, sp.interest_calculation_method, sp.currency,
    sp.tax_rule, sp.tax_rate_percent, sp.early_settlement_rule, sp.early_settlement_rate_percent,
    sp.supports_partial_settlement, sv.display_name, sv.provider_key, sv.family
  into v_package
  from public.saving_packages sp
  join public.saving_providers sv on sv.id = sp.provider_id
  where sp.id = v_target_id
    and sp.provider_id = v_saving.provider_id
    and sp.is_active = true and sp.renewable_available = true and sv.is_active = true
    and (sv.household_id is null or public.is_household_member(sv.household_id));
  if not found then raise exception 'Target package is unavailable'; end if;
  if upper(coalesce(v_package.currency, public.household_base_currency(v_saving.household_id))) <> upper(public.household_base_currency(v_saving.household_id)) then raise exception 'Target package currency mismatch'; end if;
  if v_package.min_amount is not null and v_cycle.principal < v_package.min_amount then raise exception 'Target package minimum amount not met'; end if;
  if v_package.max_amount is not null and v_cycle.principal > v_package.max_amount then raise exception 'Target package maximum amount exceeded'; end if;
  if not (v_package.settlement_rules @> jsonb_build_array(v_action)) then raise exception 'Target package does not support this rollover'; end if;
  if v_action = 'roll_principal_only' then
    v_settlement_id := coalesce(p_settlement_account_id, nullif(v_saving.maturity_instruction->>'payoutAccountId', '')::uuid, v_saving.settlement_account_id);
    if not exists (select 1 from public.accounts a where a.id = v_settlement_id and a.household_id = v_saving.household_id and a.is_archived = false and a.type not in ('credit_card', 'savings_product')) then raise exception 'Invalid settlement account'; end if;
  end if;
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce((v_cycle.package_snapshot->>'taxRatePercent')::numeric, (v_saving.product_snapshot->>'taxRatePercent')::numeric, 0), 0);
  if v_tax_rule = 'PROFIT_PERCENTAGE' and v_interest > 0 then v_tax := floor(v_interest * v_tax_rate / 100); end if;
  v_net_interest := greatest(v_interest - v_tax, 0);
  v_new_principal := case when v_action = 'roll_principal_interest' then v_cycle.principal + v_net_interest else v_cycle.principal end;
  v_end := coalesce(p_cycle_end_date, case when v_package.term_unit = 'MONTH' then (v_start + (v_package.term_amount || ' months')::interval)::date else v_start + v_package.term_amount end);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  if v_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, v_today, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  if v_action = 'roll_principal_only' and v_net_interest > 0 then
    v_group_id := gen_random_uuid();
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net_interest, v_currency, v_today, 'Nhận lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_out_tx;
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_in_tx;
  end if;
  insert into public.saving_cycles (saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, status, previous_cycle_id)
  values (v_saving.id, v_cycle.cycle_number + 1, v_start, v_end,
    v_new_principal, v_package.annual_interest_rate,
    jsonb_build_object('packageId', v_package.id, 'packageName', v_package.package_name, 'durationDays', v_package.duration_days,
      'annualInterestRate', v_package.annual_interest_rate, 'settlementRules', v_package.settlement_rules,
      'penaltyRules', v_package.penalty_rules, 'renewableAvailable', v_package.renewable_available,
      'minAmount', v_package.min_amount, 'maxAmount', v_package.max_amount, 'termAmount', v_package.term_amount,
      'termUnit', v_package.term_unit, 'interestCalculationMethod', v_package.interest_calculation_method,
      'currency', v_package.currency, 'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
      'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent,
      'supportsPartialSettlement', v_package.supports_partial_settlement, 'providerId', v_package.provider_id, 'providerFamily', v_package.family),
    'active', v_cycle.id)
  returning id into v_new_cycle_id;
  update public.saving_cycles set status = 'rolled', next_cycle_id = v_new_cycle_id,
    settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object('action', v_action, 'principalReturned', 0, 'interestReturned', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'grossInterest', v_interest, 'tax', v_tax, 'fee', 0, 'netInterest', v_net_interest, 'penaltyApplied', 0, 'netAmount', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'totalCashReceived', case when v_action = 'roll_principal_only' then v_net_interest else 0 end, 'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id, 'interestTransactionId', v_interest_tx, 'taxTransactionId', v_tax_tx, 'transferGroupId', v_group_id)
  where id = v_cycle.id;
  update public.savings set status = 'active', product_snapshot = v_saving.product_snapshot || jsonb_build_object('packageId', v_package.id, 'packageName', v_package.package_name, 'depositTermDays', v_package.duration_days, 'annualInterestRate', v_package.annual_interest_rate, 'providerId', v_package.provider_id, 'providerNameSnapshot', v_package.display_name, 'providerKey', v_package.provider_key, 'currency', v_package.currency, 'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent, 'settlementRules', v_package.settlement_rules), updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_new_cycle_id, 'principal', v_new_principal, 'netInterest', v_net_interest, 'tax', v_tax, 'action', v_action, 'idempotentReplay', false);
end;
$$;

grant execute on function public.rollover_saving_cycle(uuid, text, uuid, uuid, date, date, text) to authenticated;
;
