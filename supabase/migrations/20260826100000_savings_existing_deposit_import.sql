-- Savings existing-deposit import. The frozen V1 baseline is intentionally untouched.

insert into public.saving_providers (
  provider_key, display_name, saving_type, family, is_system, is_active
)
select 'manual', 'Manual savings', 'manual_saving', 'PLATFORM', true, true
where not exists (
  select 1 from public.saving_providers where provider_key = 'manual'
);

alter table public.savings add column if not exists creation_mode text;

update public.savings
set creation_mode = case
  when product_snapshot->>'creationMode' = 'HISTORICAL_OPENING' then 'HISTORICAL_OPENING'
  else 'LIVE_DEPOSIT'
end
where creation_mode is null;

alter table public.savings alter column creation_mode set default 'LIVE_DEPOSIT';
alter table public.savings alter column creation_mode set not null;
alter table public.savings add constraint savings_creation_mode_check
  check (creation_mode in ('LIVE_DEPOSIT', 'HISTORICAL_OPENING'));
alter table public.savings add constraint savings_creation_mode_funding_check
  check (
    (creation_mode = 'HISTORICAL_OPENING' and funding_account_id is null)
    or (creation_mode = 'LIVE_DEPOSIT' and funding_account_id is not null)
  );

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
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  v_today date := timezone('utc', now())::date;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_mode not in ('LIVE_DEPOSIT', 'HISTORICAL_OPENING') then
    raise exception 'Invalid Savings creation mode';
  end if;
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true limit 1;
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
  if v_mode = 'HISTORICAL_OPENING' then
    if p_cycle_start_date >= v_today then raise exception 'Historical opening must start before today'; end if;
    if p_cycle_end_date < v_today then raise exception 'Historical opening maturity has passed'; end if;
  end if;
  if nullif(trim(p_product_name), '') is null
    or nullif(trim(v_snapshot->>'providerId'), '') is null
    or v_snapshot->>'providerId' <> p_provider_id::text
    or nullif(trim(v_snapshot->>'interestCalculationMethod'), '') is null
  then raise exception 'Invalid Savings product snapshot'; end if;
  if v_mode = 'LIVE_DEPOSIT'
    and (nullif(trim(v_snapshot->>'packageId'), '') is null
      or nullif(trim(coalesce(p_package_snapshot->>'packageId', '')), '') is null)
  then raise exception 'Invalid Savings product snapshot'; end if;
  if v_snapshot->>'interestCalculationMethod' not in ('simple', 'compound_daily', 'compound_monthly') then
    raise exception 'Invalid Savings interest method';
  end if;

  if nullif(trim(p_idempotency_key), '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(
      'savings:create:' || v_household_id::text || ':' || trim(p_idempotency_key), 0));
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = trim(p_idempotency_key) || ':out' limit 1;
    if v_existing_saving_id is null then
      select s.id, sc.id into v_existing_saving_id, v_existing_cycle_id
      from public.savings s
      join public.saving_cycles sc on sc.saving_id = s.id and sc.cycle_number = 1
      where s.household_id = v_household_id
        and s.product_snapshot->>'creationIdempotencyKey' = trim(p_idempotency_key) limit 1;
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
    'fallbackPolicy', coalesce(v_config->>'fallbackPolicy', 'ask_user'));
  v_snapshot := v_snapshot || jsonb_build_object('creationMode', v_mode,
    'creationIdempotencyKey', nullif(trim(p_idempotency_key), ''));

  if v_mode = 'LIVE_DEPOSIT' then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
      p_cycle_start_date, 'Gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT')
    returning id into v_funding_tx_id;
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, public.get_or_create_savings_product_account(v_household_id), 'transfer_in', p_principal, v_currency,
      p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT')
    returning id into v_receiving_tx_id;
  end if;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, creation_mode, renewal_policy, renewal_config, maturity_instruction,
    created_by, financial_scope, owner_membership_id
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, v_snapshot, v_mode, v_policy, v_config, v_instruction,
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
$function$;

grant execute on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) to authenticated;
grant execute on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) to postgres;

create or replace function public.rollover_saving_cycle(
  p_cycle_id uuid, p_action text, p_target_package_id uuid,
  p_settlement_account_id uuid default null, p_cycle_start_date date default null,
  p_cycle_end_date date default null, p_idempotency_key text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_package record;
  v_manual boolean := false;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_new_cycle_id uuid;
  v_currency text;
  v_today date := timezone('utc', now())::date;
  v_start date := coalesce(p_cycle_start_date, v_today);
  v_end date;
  v_interest numeric;
  v_tax numeric;
  v_penalty numeric := 0;
  v_net_interest numeric;
  v_new_principal numeric;
  v_tax_rule text;
  v_tax_rate numeric;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_group_id uuid := gen_random_uuid();
  v_action text := lower(trim(coalesce(p_action, '')));
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_action not in ('roll_principal_interest', 'roll_principal_only') then raise exception 'Invalid rollover action'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  if v_cycle.next_cycle_id is not null then
    return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_cycle.next_cycle_id, 'idempotentReplay', true);
  end if;
  if v_cycle.status <> 'matured' then raise exception 'Cycle must be matured to rollover'; end if;

  if p_target_package_id is null then
    if nullif(v_cycle.package_snapshot->>'packageId', '') is not null
      or coalesce((v_cycle.package_snapshot->>'renewableAvailable')::boolean, false) is not true
    then raise exception 'Target package is required'; end if;
    v_manual := true;
    select
      null::uuid as id, v_saving.provider_id as provider_id,
      coalesce(v_cycle.package_snapshot->>'packageName', v_saving.product_snapshot->>'packageName') as package_name,
      coalesce(nullif(v_cycle.package_snapshot->>'durationDays', '')::integer, 1) as duration_days,
      coalesce(nullif(v_cycle.package_snapshot->>'annualInterestRate', '')::numeric, v_cycle.locked_rate) as annual_interest_rate,
      nullif(v_cycle.package_snapshot->>'minAmount', '')::numeric as min_amount,
      nullif(v_cycle.package_snapshot->>'maxAmount', '')::numeric as max_amount,
      coalesce(v_cycle.package_snapshot->'settlementRules', '[]'::jsonb) as settlement_rules,
      coalesce(v_cycle.package_snapshot->'penaltyRules', '[]'::jsonb) as penalty_rules,
      true as renewable_available,
      nullif(v_cycle.package_snapshot->>'termAmount', '')::integer as term_amount,
      v_cycle.package_snapshot->>'termUnit' as term_unit,
      coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', 'simple') as interest_calculation_method,
      coalesce(v_cycle.package_snapshot->>'currency', public.household_base_currency(v_saving.household_id)) as currency,
      coalesce(v_cycle.package_snapshot->>'taxRule', 'NONE') as tax_rule,
      coalesce(nullif(v_cycle.package_snapshot->>'taxRatePercent', '')::numeric, 0) as tax_rate_percent,
      v_cycle.package_snapshot->>'earlySettlementRule' as early_settlement_rule,
      nullif(v_cycle.package_snapshot->>'earlySettlementRatePercent', '')::numeric as early_settlement_rate_percent,
      coalesce((v_cycle.package_snapshot->>'supportsPartialSettlement')::boolean, false) as supports_partial_settlement,
      sv.display_name, sv.provider_key, sv.family
    into v_package
    from public.saving_providers sv where sv.id = v_saving.provider_id;
  else
    select sp.id, sp.provider_id, sp.package_name, sp.duration_days, sp.annual_interest_rate,
      sp.min_amount, sp.max_amount, sp.settlement_rules, sp.penalty_rules, sp.renewable_available,
      sp.is_active, sp.term_amount, sp.term_unit, sp.interest_calculation_method, sp.currency,
      sp.tax_rule, sp.tax_rate_percent, sp.early_settlement_rule, sp.early_settlement_rate_percent,
      sp.supports_partial_settlement, sv.display_name, sv.provider_key, sv.family
    into v_package
    from public.saving_packages sp join public.saving_providers sv on sv.id = sp.provider_id
    where sp.id = p_target_package_id and sp.provider_id = v_saving.provider_id
      and sp.is_active = true and sp.renewable_available = true and sv.is_active = true
      and (sv.household_id is null or public.is_household_member(sv.household_id));
    if not found then raise exception 'Target package is unavailable'; end if;
  end if;
  if upper(coalesce(v_package.currency, public.household_base_currency(v_saving.household_id))) <> upper(public.household_base_currency(v_saving.household_id)) then raise exception 'Target package currency mismatch'; end if;
  if v_package.min_amount is not null and v_cycle.principal < v_package.min_amount then raise exception 'Target package minimum amount not met'; end if;
  if v_package.max_amount is not null and v_cycle.principal > v_package.max_amount then raise exception 'Target package maximum amount exceeded'; end if;
  if not (v_package.settlement_rules @> jsonb_build_array(v_action)) then raise exception 'Target package does not support this rollover'; end if;
  if v_action = 'roll_principal_only' then
    v_settlement_id := coalesce(p_settlement_account_id, nullif(v_saving.maturity_instruction->>'payoutAccountId', '')::uuid, v_saving.settlement_account_id);
    if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;
  end if;

  v_interest := public.savings_calculate_interest(v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date,
    coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', v_saving.product_snapshot->>'interestCalculationMethod', 'simple'), v_cycle.end_date);
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce(nullif(v_cycle.package_snapshot->>'taxRatePercent', '')::numeric, nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric, 0), 0);
  v_tax := public.savings_tax_for_interest(v_interest, v_tax_rule, v_tax_rate);
  v_net_interest := greatest(v_interest - v_tax - v_penalty, 0);
  v_new_principal := case when v_action = 'roll_principal_interest' then v_cycle.principal + v_net_interest else v_cycle.principal end;
  v_end := coalesce(p_cycle_end_date, case when v_package.term_unit = 'MONTH' then (v_start + (v_package.term_amount || ' months')::interval)::date else v_start + v_package.term_amount end);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);

  if v_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, v_today, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  if v_action = 'roll_principal_only' and v_net_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net_interest, v_currency, v_today, 'Nhận lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_out_tx;
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_in_tx;
  end if;

  insert into public.saving_cycles (saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, status, previous_cycle_id)
  values (v_saving.id, v_cycle.cycle_number + 1, v_start, v_end, v_new_principal, v_package.annual_interest_rate,
    case when v_manual then v_cycle.package_snapshot else jsonb_build_object(
      'packageId', v_package.id, 'packageName', v_package.package_name, 'durationDays', v_package.duration_days,
      'annualInterestRate', v_package.annual_interest_rate, 'settlementRules', v_package.settlement_rules,
      'penaltyRules', v_package.penalty_rules, 'renewableAvailable', v_package.renewable_available,
      'minAmount', v_package.min_amount, 'maxAmount', v_package.max_amount, 'termAmount', v_package.term_amount,
      'termUnit', v_package.term_unit, 'interestCalculationMethod', v_package.interest_calculation_method,
      'currency', v_package.currency, 'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
      'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent,
      'supportsPartialSettlement', v_package.supports_partial_settlement, 'providerId', v_package.provider_id, 'providerFamily', v_package.family) end,
    'active', v_cycle.id) returning id into v_new_cycle_id;
  update public.saving_cycles set status = 'rolled', next_cycle_id = v_new_cycle_id, settlement_transaction_id = v_in_tx,
    accrued_interest = v_interest,
    settlement_result = jsonb_build_object('action', v_action, 'principal', v_cycle.principal, 'principalReturned', 0,
      'grossInterest', v_interest, 'interestReturned', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'tax', v_tax, 'penalty', v_penalty, 'fee', v_penalty, 'netInterest', v_net_interest,
      'netPayout', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'netAmount', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'totalCashReceived', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id, 'interestTransactionId', v_interest_tx,
      'taxTransactionId', v_tax_tx, 'transferGroupId', v_group_id) where id = v_cycle.id;
  update public.savings set status = 'active',
    product_snapshot = case when v_manual then v_saving.product_snapshot else v_saving.product_snapshot || jsonb_build_object(
      'packageId', v_package.id, 'packageName', v_package.package_name, 'depositTermDays', v_package.duration_days,
      'annualInterestRate', v_package.annual_interest_rate, 'providerId', v_package.provider_id,
      'providerNameSnapshot', v_package.display_name, 'providerKey', v_package.provider_key, 'currency', v_package.currency,
      'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
      'settlementRules', v_package.settlement_rules, 'interestCalculationMethod', v_package.interest_calculation_method,
      'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent) end,
    updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_new_cycle_id,
    'principal', v_new_principal, 'grossInterest', v_interest, 'netInterest', v_net_interest, 'tax', v_tax,
    'penalty', v_penalty, 'action', v_action, 'idempotentReplay', false);
end;
$function$;
