-- SAVINGS 13B: P0 financial-integrity hardening.
-- The client supplies identifiers and destination choices only. All monetary
-- values are derived from locked snapshots inside these RPCs.

create or replace function public.savings_is_eligible_liquid_account(
  p_account_id uuid,
  p_household_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = p_household_id
      and a.is_archived = false
      and a.type in ('cash', 'checking', 'savings', 'ewallet', 'other')
      and public.can_mutate_financial_resource(
        a.household_id,
        a.financial_scope,
        a.owner_membership_id
      )
  );
$$;

revoke all on function public.savings_is_eligible_liquid_account(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.savings_calculate_interest(
  p_principal numeric,
  p_annual_rate numeric,
  p_start_date date,
  p_end_date date,
  p_method text,
  p_as_of_date date default null
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_principal numeric := greatest(coalesce(p_principal, 0), 0);
  v_rate numeric := greatest(coalesce(p_annual_rate, 0), 0);
  v_days integer := greatest(coalesce(p_as_of_date, p_end_date) - p_start_date, 0);
  v_months integer;
  v_partial_days integer;
  v_amount numeric;
begin
  case lower(coalesce(p_method, ''))
    when 'simple' then
      return greatest(0, floor(v_principal * v_rate * v_days / 100 / 365));
    when 'compound_daily' then
      v_amount := v_principal * power(1 + v_rate / 100 / 365, v_days);
      return greatest(0, floor(v_amount - v_principal));
    when 'compound_monthly' then
      v_months := floor(v_days / 30);
      v_partial_days := mod(v_days, 30);
      v_amount := v_principal * power(1 + v_rate / 100 / 12, v_months);
      if v_partial_days > 0 then
        v_amount := v_amount * (1 + v_rate / 100 / 365 * v_partial_days);
      end if;
      return greatest(0, floor(v_amount - v_principal));
    else
      raise exception 'Unsupported Savings interest calculation method';
  end case;
end;
$$;

revoke all on function public.savings_calculate_interest(numeric, numeric, date, date, text, date)
  from public, anon, authenticated;

create or replace function public.savings_tax_for_interest(
  p_gross_interest numeric,
  p_tax_rule text,
  p_tax_rate numeric
)
returns numeric
language sql
immutable
as $$
  select case
    when upper(coalesce(p_tax_rule, 'NONE')) = 'PROFIT_PERCENTAGE'
      and greatest(coalesce(p_gross_interest, 0), 0) > 0
      and greatest(coalesce(p_tax_rate, 0), 0) > 0
    then floor(greatest(p_gross_interest, 0) * greatest(p_tax_rate, 0) / 100)
    else 0
  end;
$$;

revoke all on function public.savings_tax_for_interest(numeric, text, numeric)
  from public, anon, authenticated;

create or replace function public.savings_early_withdrawal_breakdown(
  p_cycle_id uuid,
  p_as_of_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_package jsonb;
  v_method text;
  v_rule text;
  v_strategy text;
  v_rate numeric;
  v_demand_rate numeric;
  v_fixed_amount numeric;
  v_gross_interest numeric;
  v_eligible_interest numeric := 0;
  v_penalty numeric := 0;
  v_tax numeric := 0;
  v_tax_rule text;
  v_tax_rate numeric := 0;
  v_days integer;
  v_total_days integer;
begin
  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id;
  if not found then raise exception 'Cycle not found'; end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id;
  if not found or not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  v_package := coalesce(v_cycle.package_snapshot, '{}'::jsonb);
  v_method := coalesce(
    v_package->>'interestCalculationMethod',
    v_saving.product_snapshot->>'interestCalculationMethod',
    'simple'
  );
  v_days := greatest(coalesce(p_as_of_date, timezone('utc', now())::date) - v_cycle.start_date, 0);
  v_total_days := greatest(v_cycle.end_date - v_cycle.start_date, 0);
  v_gross_interest := public.savings_calculate_interest(
    v_cycle.principal,
    v_cycle.locked_rate,
    v_cycle.start_date,
    v_cycle.end_date,
    v_method,
    coalesce(p_as_of_date, timezone('utc', now())::date)
  );

  v_rule := upper(coalesce(
    v_package->>'earlySettlementRule',
    v_saving.product_snapshot->>'earlySettlementRule',
    'RETURN_PRINCIPAL_ONLY'
  ));

  if v_rule = 'NOT_ALLOWED' then
    raise exception 'Early settlement is not allowed';
  elsif v_rule = 'CUSTOM_RATE' then
    v_rate := nullif(coalesce(
      v_package->>'earlySettlementRatePercent',
      v_saving.product_snapshot->>'earlySettlementRatePercent'
    ), '')::numeric;
    if v_rate is null then
      raise exception 'Early settlement rate unavailable';
    end if;
    v_eligible_interest := floor(v_cycle.principal * v_rate * v_days / 100 / 365);
    v_penalty := greatest(v_gross_interest - v_eligible_interest, 0);
    v_strategy := 'custom_rate';
  elsif v_rule in ('RETURN_PRINCIPAL_ONLY', 'PENALTY', 'CUSTOM') then
    v_strategy := lower(coalesce(
      v_package->'penaltyRules'->0->>'strategy',
      'no_interest'
    ));
    case v_strategy
      when 'no_interest' then
        v_eligible_interest := 0;
        v_penalty := v_gross_interest;
      when 'demand_interest' then
        v_demand_rate := nullif(v_package->'penaltyRules'->0->>'demandRate', '')::numeric;
        if v_demand_rate is null then
          raise exception 'Early settlement demand rate unavailable';
        end if;
        v_eligible_interest := floor(v_cycle.principal * v_demand_rate * v_days / 100 / 365);
        v_penalty := greatest(v_gross_interest - v_eligible_interest, 0);
      when 'fixed_penalty' then
        v_fixed_amount := nullif(v_package->'penaltyRules'->0->>'fixedAmount', '')::numeric;
        if v_fixed_amount is null then
          raise exception 'Early settlement penalty unavailable';
        end if;
        v_penalty := least(greatest(v_fixed_amount, 0), v_gross_interest);
        v_eligible_interest := greatest(v_gross_interest - v_penalty, 0);
      when 'provider_formula', 'provider_custom' then
        raise exception 'Provider early settlement quote required';
      else
        raise exception 'Early settlement penalty rule unavailable';
    end case;
  else
    raise exception 'Early settlement rule unavailable';
  end if;

  v_tax_rule := coalesce(
    v_package->>'taxRule',
    v_saving.product_snapshot->>'taxRule',
    'NONE'
  );
  v_tax_rate := greatest(coalesce(
    nullif(v_package->>'taxRatePercent', '')::numeric,
    nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric,
    0
  ), 0);
  -- Tax is assessed on the realized gross interest; forfeited interest is
  -- represented separately as an actual Savings fee/penalty.
  v_tax := public.savings_tax_for_interest(v_gross_interest, v_tax_rule, v_tax_rate);

  return jsonb_build_object(
    'principal', v_cycle.principal,
    'grossInterest', v_gross_interest,
    'accruedInterest', v_gross_interest,
    'eligibleInterest', greatest(v_eligible_interest, 0),
    'tax', v_tax,
    'penalty', greatest(v_penalty, 0),
    'fee', greatest(v_penalty, 0),
    'netInterest', greatest(v_gross_interest - v_tax - v_penalty, 0),
    'netPayout', greatest(v_cycle.principal + v_gross_interest - v_tax - v_penalty, 0),
    'netReturned', greatest(v_cycle.principal + v_gross_interest - v_tax - v_penalty, 0),
    'penaltyAmount', greatest(v_penalty, 0),
    'penaltyStrategy', v_strategy,
    'earlySettlementRatePercent', v_rate,
    'daysHeld', v_days,
    'totalTermDays', v_total_days,
    'quoteReady', true,
    'taxRule', v_tax_rule,
    'taxRatePercent', v_tax_rate
  );
end;
$$;

revoke all on function public.savings_early_withdrawal_breakdown(uuid, date)
  from public, anon, authenticated;

create or replace function public.preview_early_withdraw_saving(
  p_cycle_id uuid,
  p_as_of_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.savings_early_withdrawal_breakdown(p_cycle_id, p_as_of_date);
end;
$$;

revoke all on function public.preview_early_withdraw_saving(uuid, date)
  from public, anon;
grant execute on function public.preview_early_withdraw_saving(uuid, date) to authenticated;

-- Replace the ownership-aware live placement RPC while preserving its public
-- signature and existing financial_scope contract.
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
  p_financial_scope text default 'household'
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
  v_scope text := lower(trim(coalesce(p_financial_scope, 'household')));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
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

  if nullif(trim(p_idempotency_key), '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(
      'savings:create:' || v_household_id::text || ':' || trim(p_idempotency_key), 0
    ));
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc
    join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = trim(p_idempotency_key) || ':out'
    limit 1;
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
  v_product_currency := coalesce(p_product_snapshot->>'currency', v_currency);
  if upper(v_product_currency) <> upper(v_currency) then raise exception 'Currency mismatch'; end if;
  if p_funding_account_id = p_settlement_account_id then raise exception 'Funding and settlement accounts must differ'; end if;
  if not public.savings_is_eligible_liquid_account(p_funding_account_id, v_household_id) then
    raise exception 'Invalid funding account';
  end if;
  if not public.savings_is_eligible_liquid_account(p_settlement_account_id, v_household_id) then
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
    nullif(trim(p_idempotency_key) || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_funding_tx_id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
  ) values (
    v_household_id, v_product_account_id, 'transfer_in', p_principal, v_currency,
    p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
    nullif(trim(p_idempotency_key) || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
  ) returning id into v_receiving_tx_id;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction,
    created_by, financial_scope, owner_membership_id
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, p_product_snapshot, v_policy, v_config, v_instruction,
    v_user_id, v_scope, v_owner_membership_id
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
  return jsonb_build_object('ok', true, 'savingId', v_saving_id, 'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id, 'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', v_transfer_group_id, 'idempotentReplay', false);
end;
$$;

grant execute on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text) to authenticated;

-- Maturity detection now uses the same method-aware interest contract as
-- settlement and rollover.
do $$
declare
  v_definition text;
begin
  v_definition := pg_get_functiondef('public.detect_matured_savings(uuid)'::regprocedure);
  v_definition := regexp_replace(
    v_definition,
    'v_accrued := public\.savings_simple_interest\([^;]+\);',
    'v_accrued := public.savings_calculate_interest(v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date, coalesce(v_cycle.package_snapshot->>''interestCalculationMethod'', v_cycle.product_snapshot->>''interestCalculationMethod'', ''simple''), v_cycle.end_date);',
    1
  );
  execute v_definition;
end;
$$;

drop function if exists public.settle_saving_cycle(uuid, uuid);
create or replace function public.settle_saving_cycle(
  p_cycle_id uuid,
  p_settlement_account_id uuid default null,
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
  v_settlement_id uuid;
  v_product_account_id uuid;
  v_currency text;
  v_group_id uuid := gen_random_uuid();
  v_gross_interest numeric;
  v_tax numeric;
  v_penalty numeric := 0;
  v_net_interest numeric;
  v_total numeric;
  v_tax_rule text;
  v_tax_rate numeric;
  v_out_tx uuid;
  v_in_tx uuid;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  if v_cycle.status <> 'matured' then
    if v_cycle.settlement_result is not null and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
        'netAmount', coalesce((v_cycle.settlement_result->>'netPayout')::numeric, (v_cycle.settlement_result->>'netAmount')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id, 'idempotentReplay', true);
    end if;
    raise exception 'Cycle must be matured to settle';
  end if;
  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_gross_interest := public.savings_calculate_interest(
    v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date,
    coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', v_saving.product_snapshot->>'interestCalculationMethod', 'simple'),
    v_cycle.end_date
  );
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce(nullif(v_cycle.package_snapshot->>'taxRatePercent', '')::numeric, nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric, 0), 0);
  v_tax := public.savings_tax_for_interest(v_gross_interest, v_tax_rule, v_tax_rate);
  v_net_interest := greatest(v_gross_interest - v_tax - v_penalty, 0);
  v_total := v_cycle.principal + v_net_interest;

  if v_gross_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_gross_interest, v_currency, timezone('utc', now())::date, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, timezone('utc', now())::date, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_total, v_currency, timezone('utc', now())::date, 'Tất toán tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_total, v_currency, timezone('utc', now())::date, 'Nhận tiền tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;
  update public.saving_cycles set status = 'rolled', accrued_interest = v_gross_interest, settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object('action', 'withdraw', 'principal', v_cycle.principal, 'principalReturned', v_cycle.principal,
      'grossInterest', v_gross_interest, 'interestReturned', v_gross_interest, 'tax', v_tax, 'penalty', v_penalty, 'fee', v_penalty,
      'netInterest', v_net_interest, 'netPayout', v_total, 'netAmount', v_total, 'totalCashReceived', v_total,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id, 'transferGroupId', v_group_id,
      'interestTransactionId', v_interest_tx, 'taxTransactionId', v_tax_tx)
  where id = v_cycle.id;
  update public.savings set status = 'closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id, 'netAmount', v_total,
    'netPayout', v_total, 'principal', v_cycle.principal, 'grossInterest', v_gross_interest, 'tax', v_tax,
    'penalty', v_penalty, 'fee', v_penalty, 'netInterest', v_net_interest, 'settlementTransactionId', v_in_tx,
    'transferGroupId', v_group_id, 'idempotentReplay', false);
end;
$$;

grant execute on function public.settle_saving_cycle(uuid, uuid, text) to authenticated;
revoke execute on function public.settle_saving_cycle(uuid, uuid, text) from public, anon;

drop function if exists public.early_withdraw_saving(uuid, numeric, numeric, numeric, numeric, numeric, text, uuid);
create or replace function public.early_withdraw_saving(
  p_cycle_id uuid,
  p_settlement_account_id uuid default null,
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
  v_breakdown jsonb;
  v_settlement_id uuid;
  v_product_account_id uuid;
  v_currency text;
  v_group_id uuid := gen_random_uuid();
  v_gross_interest numeric;
  v_eligible_interest numeric;
  v_tax numeric;
  v_penalty numeric;
  v_net_interest numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_fee_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_ew_id uuid;
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  if v_cycle.status <> 'active' then
    if v_cycle.status = 'early_closed' and v_cycle.settlement_result is not null and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_cycle.saving_id, 'cycleId', v_cycle.id,
        'netReturned', coalesce((v_cycle.settlement_result->>'netPayout')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id, 'idempotentReplay', true);
    end if;
    raise exception 'Only active cycles can be withdrawn early';
  end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  v_settlement_id := p_settlement_account_id;
  if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;

  v_breakdown := public.savings_early_withdrawal_breakdown(v_cycle.id, timezone('utc', now())::date);
  v_gross_interest := (v_breakdown->>'grossInterest')::numeric;
  v_eligible_interest := (v_breakdown->>'eligibleInterest')::numeric;
  v_tax := (v_breakdown->>'tax')::numeric;
  v_penalty := (v_breakdown->>'penalty')::numeric;
  v_net_interest := (v_breakdown->>'netInterest')::numeric;
  v_net := (v_breakdown->>'netPayout')::numeric;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);

  if v_gross_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_gross_interest, v_currency, timezone('utc', now())::date, 'Lãi rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, timezone('utc', now())::date, 'Thuế lãi rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  if v_penalty > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_penalty, v_currency, timezone('utc', now())::date, 'Phí/phạt rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':fee', ':fee'), v_user_id, 'manual', 'SAVINGS_FEE') returning id into v_fee_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net, v_currency, timezone('utc', now())::date, 'Rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net, v_currency, timezone('utc', now())::date, 'Nhận tiền rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;
  update public.saving_cycles set status = 'early_closed', accrued_interest = v_gross_interest, settlement_transaction_id = v_in_tx,
    settlement_result = v_breakdown || jsonb_build_object('action', 'withdraw', 'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id, 'transferGroupId', v_group_id, 'interestTransactionId', v_interest_tx,
      'taxTransactionId', v_tax_tx, 'feeTransactionId', v_fee_tx)
  where id = v_cycle.id;
  update public.savings set status = 'early_closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  insert into public.early_withdrawals (cycle_id, saving_id, principal, accrued_interest, eligible_interest, penalty_amount, net_returned, penalty_strategy, settlement_transaction_id, executed_by)
  values (v_cycle.id, v_saving.id, v_cycle.principal, v_gross_interest, v_eligible_interest, v_penalty, v_net,
    coalesce(v_breakdown->>'penaltyStrategy', 'no_interest'), v_in_tx, v_user_id)
  returning id into v_ew_id;
  return v_breakdown || jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
    'earlyWithdrawalId', v_ew_id, 'settlementTransactionId', v_in_tx, 'transferGroupId', v_group_id,
    'idempotentReplay', false);
end;
$$;

grant execute on function public.early_withdraw_saving(uuid, uuid, text) to authenticated;
revoke execute on function public.early_withdraw_saving(uuid, uuid, text) from public, anon;

-- Rollover uses the locked matured cycle before reading realized interest and
-- keeps the matured receipt/history intact while linking the next cycle.
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
  if p_target_package_id is null then raise exception 'Target package is required'; end if;

  select sp.id, sp.provider_id, sp.package_name, sp.duration_days, sp.annual_interest_rate,
    sp.min_amount, sp.max_amount, sp.settlement_rules, sp.penalty_rules, sp.renewable_available,
    sp.is_active, sp.term_amount, sp.term_unit, sp.interest_calculation_method, sp.currency,
    sp.tax_rule, sp.tax_rate_percent, sp.early_settlement_rule, sp.early_settlement_rate_percent,
    sp.supports_partial_settlement, sv.display_name, sv.provider_key, sv.family
  into v_package
  from public.saving_packages sp
  join public.saving_providers sv on sv.id = sp.provider_id
  where sp.id = p_target_package_id and sp.provider_id = v_saving.provider_id
    and sp.is_active = true and sp.renewable_available = true and sv.is_active = true
    and (sv.household_id is null or public.is_household_member(sv.household_id));
  if not found then raise exception 'Target package is unavailable'; end if;
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
    jsonb_build_object('packageId', v_package.id, 'packageName', v_package.package_name, 'durationDays', v_package.duration_days,
      'annualInterestRate', v_package.annual_interest_rate, 'settlementRules', v_package.settlement_rules, 'penaltyRules', v_package.penalty_rules,
      'renewableAvailable', v_package.renewable_available, 'minAmount', v_package.min_amount, 'maxAmount', v_package.max_amount,
      'termAmount', v_package.term_amount, 'termUnit', v_package.term_unit, 'interestCalculationMethod', v_package.interest_calculation_method,
      'currency', v_package.currency, 'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
      'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent,
      'supportsPartialSettlement', v_package.supports_partial_settlement, 'providerId', v_package.provider_id, 'providerFamily', v_package.family),
    'active', v_cycle.id)
  returning id into v_new_cycle_id;

  update public.saving_cycles set status = 'rolled', next_cycle_id = v_new_cycle_id, settlement_transaction_id = v_in_tx,
    accrued_interest = v_interest,
    settlement_result = jsonb_build_object('action', v_action, 'principal', v_cycle.principal, 'principalReturned', 0,
      'grossInterest', v_interest, 'interestReturned', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'tax', v_tax, 'penalty', v_penalty, 'fee', v_penalty, 'netInterest', v_net_interest,
      'netPayout', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'netAmount', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'totalCashReceived', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id, 'interestTransactionId', v_interest_tx,
      'taxTransactionId', v_tax_tx, 'transferGroupId', v_group_id)
  where id = v_cycle.id;
  update public.savings set status = 'active', product_snapshot = v_saving.product_snapshot || jsonb_build_object(
    'packageId', v_package.id, 'packageName', v_package.package_name, 'depositTermDays', v_package.duration_days,
    'annualInterestRate', v_package.annual_interest_rate, 'providerId', v_package.provider_id,
    'providerNameSnapshot', v_package.display_name, 'providerKey', v_package.provider_key, 'currency', v_package.currency,
    'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
    'settlementRules', v_package.settlement_rules, 'interestCalculationMethod', v_package.interest_calculation_method,
    'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent),
    updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_new_cycle_id,
    'principal', v_new_principal, 'grossInterest', v_interest, 'netInterest', v_net_interest, 'tax', v_tax,
    'penalty', v_penalty, 'action', v_action, 'idempotentReplay', false);
end;
$$;

grant execute on function public.rollover_saving_cycle(uuid,text,uuid,uuid,date,date,text) to authenticated;
revoke execute on function public.rollover_saving_cycle(uuid,text,uuid,uuid,date,date,text) from public, anon;
