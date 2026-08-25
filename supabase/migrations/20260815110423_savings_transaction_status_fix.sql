-- Prompt 08.2: configurable Savings domain, provider/product ownership,
-- migration-safe snapshots, and financially neutral placement/settlement.

begin;

-- ---------------------------------------------------------------------------
-- 1. Provider ownership and canonical family metadata
-- ---------------------------------------------------------------------------
alter table public.saving_providers
  add column if not exists household_id uuid references public.households(id) on delete restrict,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists family text,
  add column if not exists icon_key text not null default 'bank',
  add column if not exists is_system boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.saving_providers
set family = case when saving_type = 'bank_deposit' then 'BANK' else 'PLATFORM' end
where family is null;

update public.saving_providers
set icon_key = case when family = 'BANK' then 'bank' else 'wallet' end
where icon_key is null or trim(icon_key) = '';

alter table public.saving_providers
  alter column family set default 'PLATFORM',
  alter column family set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'saving_providers_family_check'
      and conrelid = 'public.saving_providers'::regclass
  ) then
    alter table public.saving_providers
      add constraint saving_providers_family_check
      check (family in ('BANK', 'PLATFORM'));
  end if;
end
$$;

-- Existing provider rows are system-owned; user-created rows will have a household.
update public.saving_providers
set is_system = true
where household_id is null;

-- ---------------------------------------------------------------------------
-- 2. Product/package configuration
-- ---------------------------------------------------------------------------
alter table public.saving_packages
  add column if not exists term_amount integer,
  add column if not exists term_unit text not null default 'DAY',
  add column if not exists interest_calculation_method text not null default 'simple',
  add column if not exists currency char(3) not null default 'VND',
  add column if not exists tax_rule text not null default 'NONE',
  add column if not exists tax_rate_percent numeric(7, 4) not null default 0,
  add column if not exists early_settlement_rule text not null default 'RETURN_PRINCIPAL_ONLY',
  add column if not exists supports_partial_settlement boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.saving_packages
set term_amount = duration_days
where term_amount is null;

alter table public.saving_packages
  alter column term_amount set not null;

update public.saving_packages sp
set
  tax_rule = case when p.family = 'PLATFORM' then 'PROFIT_PERCENTAGE' else 'NONE' end,
  tax_rate_percent = case when p.family = 'PLATFORM' then 5 else 0 end,
  early_settlement_rule = case
    when exists (
      select 1 from jsonb_array_elements(sp.penalty_rules) r
      where r->>'strategy' in ('demand_interest', 'fixed_penalty', 'provider_formula', 'provider_custom')
    ) then 'PENALTY'
    else 'RETURN_PRINCIPAL_ONLY'
  end
from public.saving_providers p
where p.id = sp.provider_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_term_unit_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_term_unit_check check (term_unit in ('DAY', 'MONTH'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_interest_method_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_interest_method_check check (interest_calculation_method in ('simple', 'compound_daily', 'compound_monthly'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_tax_rule_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_tax_rule_check check (tax_rule in ('NONE', 'PROFIT_PERCENTAGE'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_tax_rate_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_tax_rate_check check (tax_rate_percent between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_early_rule_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_early_rule_check check (early_settlement_rule in ('NOT_ALLOWED', 'RETURN_PRINCIPAL_ONLY', 'CUSTOM_RATE', 'PENALTY', 'CUSTOM'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saving_packages_amount_range_check' and conrelid = 'public.saving_packages'::regclass) then
    alter table public.saving_packages add constraint saving_packages_amount_range_check check (max_amount is null or min_amount is null or max_amount >= min_amount);
  end if;
end
$$;

-- Archival is the supported lifecycle; hard delete must not cascade historical products.
alter table public.saving_packages drop constraint if exists saving_packages_provider_id_fkey;
alter table public.saving_packages
  add constraint saving_packages_provider_id_fkey
  foreign key (provider_id) references public.saving_providers(id) on delete restrict;

-- ---------------------------------------------------------------------------
-- 3. Canonical Savings event marker; type remains ledger-compatible
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column if not exists savings_event_kind text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_savings_event_kind_check' and conrelid = 'public.transactions'::regclass) then
    alter table public.transactions add constraint transactions_savings_event_kind_check check (
      savings_event_kind is null or savings_event_kind in (
        'SAVINGS_PRINCIPAL_PLACEMENT',
        'SAVINGS_PRINCIPAL_RETURN',
        'SAVINGS_INTEREST',
        'SAVINGS_TAX',
        'SAVINGS_FEE'
      )
    );
  end if;
end
$$;
create index if not exists idx_transactions_savings_event_kind
  on public.transactions (household_id, savings_event_kind)
  where savings_event_kind is not null;

-- ---------------------------------------------------------------------------
-- 4. Provider/product RLS and grants
-- ---------------------------------------------------------------------------
drop policy if exists saving_providers_select_auth on public.saving_providers;
create policy saving_providers_select_auth on public.saving_providers
  for select to authenticated
  using (household_id is null or public.is_household_member(household_id));

drop policy if exists saving_providers_insert_member on public.saving_providers;
create policy saving_providers_insert_member on public.saving_providers
  for insert to authenticated
  with check (
    household_id is not null
    and public.is_household_member(household_id)
    and is_system = false
  );

drop policy if exists saving_providers_update_member on public.saving_providers;
create policy saving_providers_update_member on public.saving_providers
  for update to authenticated
  using (household_id is not null and public.is_household_member(household_id) and is_system = false)
  with check (household_id is not null and public.is_household_member(household_id) and is_system = false);

drop policy if exists saving_packages_select_auth on public.saving_packages;
create policy saving_packages_select_auth on public.saving_packages
  for select to authenticated
  using (
    exists (
      select 1 from public.saving_providers p
      where p.id = provider_id
        and (p.household_id is null or public.is_household_member(p.household_id))
    )
  );

drop policy if exists saving_packages_insert_member on public.saving_packages;
create policy saving_packages_insert_member on public.saving_packages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.saving_providers p
      where p.id = provider_id
        and p.household_id is not null
        and public.is_household_member(p.household_id)
        and p.is_system = false
    )
  );

drop policy if exists saving_packages_update_member on public.saving_packages;
create policy saving_packages_update_member on public.saving_packages
  for update to authenticated
  using (
    exists (
      select 1 from public.saving_providers p
      where p.id = provider_id
        and p.household_id is not null
        and public.is_household_member(p.household_id)
        and p.is_system = false
    )
  )
  with check (
    exists (
      select 1 from public.saving_providers p
      where p.id = provider_id
        and p.household_id is not null
        and public.is_household_member(p.household_id)
        and p.is_system = false
    )
  );

grant select on public.saving_providers, public.saving_packages to authenticated;
grant insert, update on public.saving_providers, public.saving_packages to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Backfill provider/product snapshots without rewriting historical records
-- ---------------------------------------------------------------------------
update public.savings s
set product_snapshot = coalesce(s.product_snapshot, '{}'::jsonb) || jsonb_build_object(
  'providerNameSnapshot', coalesce(s.product_snapshot->>'providerNameSnapshot', p.display_name),
  'providerKey', coalesce(s.product_snapshot->>'providerKey', p.provider_key),
  'savingsFamily', coalesce(s.product_snapshot->>'savingsFamily', p.family),
  'currency', coalesce(s.product_snapshot->>'currency', 'VND'),
  'taxRule', coalesce(s.product_snapshot->>'taxRule', case when p.family = 'PLATFORM' then 'PROFIT_PERCENTAGE' else 'NONE' end),
  'taxRatePercent', coalesce(s.product_snapshot->>'taxRatePercent', case when p.family = 'PLATFORM' then '5' else '0' end)
)
from public.saving_providers p
where p.id = s.provider_id;

update public.saving_cycles c
set package_snapshot = coalesce(c.package_snapshot, '{}'::jsonb) || jsonb_build_object(
  'currency', coalesce(c.package_snapshot->>'currency', 'VND'),
  'taxRule', coalesce(c.package_snapshot->>'taxRule', s.product_snapshot->>'taxRule', 'NONE'),
  'taxRatePercent', coalesce(c.package_snapshot->>'taxRatePercent', s.product_snapshot->>'taxRatePercent', '0')
)
from public.savings s
where s.id = c.saving_id;

-- ---------------------------------------------------------------------------
-- 6. Neutral, atomic Savings placement. The legacy 11-arg signature remains
-- as a wrapper; the 12-arg signature adds idempotency for the real creation flow.
-- ---------------------------------------------------------------------------
drop function if exists public.create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text);
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
  where hm.user_id = v_user_id and hm.is_active = true limit 1;
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

  return jsonb_build_object('ok', true, 'savingId', v_saving_id, 'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id, 'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', v_transfer_group_id, 'idempotentReplay', false);
end;
$$;

drop function if exists public.create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb);
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
  p_renewal_config jsonb default '{}'::jsonb
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.create_saving_with_transfer(
    p_funding_account_id, p_principal, p_provider_id, p_product_name,
    p_product_snapshot, p_renewal_preference, p_settlement_account_id,
    p_cycle_start_date, p_cycle_end_date, p_package_snapshot,
    p_renewal_config, null
  );
$$;

grant execute on function public.create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text) to authenticated;
grant execute on function public.create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Atomic maturity settlement with structured principal/interest/tax/fee.
-- ---------------------------------------------------------------------------
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
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_settlement_id uuid;
  v_product_account_id uuid;
  v_currency text;
  v_group_id uuid := gen_random_uuid();
  v_interest numeric := 0;
  v_tax numeric := 0;
  v_fee numeric := 0;
  v_net_interest numeric := 0;
  v_total numeric := 0;
  v_tax_rule text;
  v_tax_rate numeric := 0;
  v_out_tx uuid;
  v_in_tx uuid;
  v_interest_tx uuid;
  v_tax_tx uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.is_household_member(v_saving.household_id) then raise exception 'Forbidden'; end if;
  if v_cycle.status <> 'matured' then
    if v_cycle.settlement_result is not null and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
        'netAmount', coalesce((v_cycle.settlement_result->>'totalCashReceived')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id, 'idempotentReplay', true);
    end if;
    raise exception 'Cycle must be matured to settle';
  end if;
  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  if not exists (
    select 1 from public.accounts a where a.id = v_settlement_id and a.household_id = v_saving.household_id
      and a.is_archived = false and a.type not in ('credit_card', 'savings_product')
  ) then raise exception 'Invalid settlement account'; end if;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_interest := greatest(coalesce(v_cycle.accrued_interest, 0), 0);
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce((v_cycle.package_snapshot->>'taxRatePercent')::numeric, (v_saving.product_snapshot->>'taxRatePercent')::numeric, 0), 0);
  if v_tax_rule = 'PROFIT_PERCENTAGE' and v_interest > 0 then
    v_tax := floor(v_interest * v_tax_rate / 100);
  end if;
  v_net_interest := greatest(v_interest - v_tax - v_fee, 0);
  v_total := v_cycle.principal + v_net_interest;

  if v_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency, (timezone('utc', now()))::date, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, (timezone('utc', now()))::date, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_total, v_currency, (timezone('utc', now()))::date, 'Tất toán tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_total, v_currency, (timezone('utc', now()))::date, 'Nhận tiền tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;
  update public.saving_cycles set status = 'rolled', settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object('action', 'withdraw', 'principalReturned', v_cycle.principal,
      'interestReturned', v_interest, 'grossInterest', v_interest, 'tax', v_tax, 'fee', v_fee,
      'netInterest', v_net_interest, 'penaltyApplied', 0, 'netAmount', v_total,
      'totalCashReceived', v_total, 'taxRule', v_tax_rule, 'taxRatePercent', v_tax_rate,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id,
      'transferGroupId', v_group_id, 'interestTransactionId', v_interest_tx, 'taxTransactionId', v_tax_tx)
  where id = v_cycle.id;
  update public.savings set status = 'closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
    'netAmount', v_total, 'totalCashReceived', v_total, 'principal', v_cycle.principal,
    'grossInterest', v_interest, 'tax', v_tax, 'fee', v_fee, 'netInterest', v_net_interest,
    'settlementTransactionId', v_in_tx, 'transferGroupId', v_group_id, 'idempotentReplay', false);
end;
$$;
grant execute on function public.settle_saving_cycle(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Atomic early settlement with the same structured breakdown.
-- ---------------------------------------------------------------------------
create or replace function public.early_withdraw_saving(
  p_cycle_id uuid,
  p_principal numeric,
  p_accrued_interest numeric,
  p_eligible_interest numeric,
  p_penalty_amount numeric,
  p_net_returned numeric,
  p_penalty_strategy text,
  p_settlement_account_id uuid
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
  v_gross_interest numeric := greatest(coalesce(p_accrued_interest, 0), 0);
  v_eligible_interest numeric := greatest(coalesce(p_eligible_interest, 0), 0);
  v_penalty numeric := greatest(coalesce(p_penalty_amount, 0), 0);
  v_tax numeric := 0;
  v_fee numeric := 0;
  v_net_interest numeric := 0;
  v_net numeric := 0;
  v_tax_rule text;
  v_tax_rate numeric := 0;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_ew_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.is_household_member(v_saving.household_id) then raise exception 'Forbidden'; end if;
  if v_cycle.status <> 'active' then raise exception 'Cycle must be active'; end if;
  v_settlement_id := p_settlement_account_id;
  if v_settlement_id is null or not exists (
    select 1 from public.accounts a where a.id = v_settlement_id and a.household_id = v_saving.household_id
      and a.is_archived = false and a.type not in ('credit_card', 'savings_product')
  ) then raise exception 'Invalid settlement account'; end if;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce((v_cycle.package_snapshot->>'taxRatePercent')::numeric, (v_saving.product_snapshot->>'taxRatePercent')::numeric, 0), 0);
  if v_tax_rule = 'PROFIT_PERCENTAGE' and v_eligible_interest > 0 then
    v_tax := floor(v_eligible_interest * v_tax_rate / 100);
  end if;
  v_fee := v_penalty;
  v_net_interest := greatest(v_eligible_interest - v_tax, 0);
  v_net := greatest(v_cycle.principal + v_net_interest, 0);

  if v_eligible_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_eligible_interest, v_currency, (timezone('utc', now()))::date, 'Lãi rút trước hạn: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, (timezone('utc', now()))::date, 'Thuế lãi rút trước hạn: ' || v_saving.product_name, 'posted', v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net, v_currency, (timezone('utc', now()))::date, 'Rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net, v_currency, (timezone('utc', now()))::date, 'Nhận tiền rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;

  update public.saving_cycles set status = 'early_closed', accrued_interest = v_gross_interest, settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object('action', 'withdraw', 'principalReturned', v_cycle.principal,
      'interestReturned', v_eligible_interest, 'grossInterest', v_gross_interest, 'tax', v_tax,
      'fee', v_fee, 'netInterest', v_net_interest, 'penaltyApplied', v_penalty,
      'netAmount', v_net, 'totalCashReceived', v_net, 'taxRule', v_tax_rule,
      'taxRatePercent', v_tax_rate, 'penaltyStrategy', p_penalty_strategy,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id,
      'transferGroupId', v_group_id, 'interestTransactionId', v_interest_tx, 'taxTransactionId', v_tax_tx)
  where id = v_cycle.id;
  update public.savings set status = 'early_closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  insert into public.early_withdrawals (cycle_id, saving_id, principal, accrued_interest, eligible_interest, penalty_amount, net_returned, penalty_strategy, settlement_transaction_id, executed_by)
  values (v_cycle.id, v_saving.id, v_cycle.principal, v_gross_interest, v_eligible_interest, v_penalty, v_net, coalesce(p_penalty_strategy, 'no_interest'), v_in_tx, v_user_id)
  returning id into v_ew_id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id, 'earlyWithdrawalId', v_ew_id,
    'netReturned', v_net, 'totalCashReceived', v_net, 'principal', v_cycle.principal,
    'grossInterest', v_gross_interest, 'tax', v_tax, 'fee', v_fee, 'netInterest', v_net_interest,
    'settlementTransactionId', v_in_tx, 'transferGroupId', v_group_id, 'idempotentReplay', false);
end;
$$;
grant execute on function public.early_withdraw_saving(uuid, numeric, numeric, numeric, numeric, numeric, text, uuid) to authenticated;

commit;
;
