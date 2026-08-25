-- Savings Domain Evolution — Financial Product (Vietnam 2026)
-- Replaces legacy savings_accounts with full product lifecycle: providers, packages, cycles, early withdrawal.

-- ---------------------------------------------------------------------------
-- 1. Add savings_product account type
-- ---------------------------------------------------------------------------
alter table public.accounts
  drop constraint if exists accounts_type_check;

alter table public.accounts
  add constraint accounts_type_check
  check (
    type in (
      'cash',
      'checking',
      'savings',
      'ewallet',
      'brokerage',
      'credit_card',
      'savings_product',
      'other'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Saving providers (configurable, not hardcoded)
-- ---------------------------------------------------------------------------
create table if not exists public.saving_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  display_name text not null,
  saving_type text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint saving_providers_type_check check (
    saving_type in ('bank_deposit', 'digital_saving', 'flexible_saving', 'manual_saving')
  )
);

-- Seed default "Manual Saving" provider
insert into public.saving_providers (provider_key, display_name, saving_type, metadata)
values
  ('manual', 'Manual Saving', 'manual_saving', '{"description":"Track your own savings product manually"}'::jsonb)
on conflict (provider_key) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Provider packages (configurable per provider)
-- ---------------------------------------------------------------------------
create table if not exists public.saving_packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.saving_providers(id) on delete cascade,
  package_name text not null,
  duration_days int not null,
  annual_interest_rate numeric(10, 6) not null,
  min_amount numeric(18, 0),
  max_amount numeric(18, 0),
  settlement_rules jsonb not null default '["roll_principal_interest"]'::jsonb,
  penalty_rules jsonb not null default '[]'::jsonb,
  renewable_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint saving_packages_duration_positive check (duration_days > 0),
  constraint saving_packages_rate_nonneg check (annual_interest_rate >= 0)
);

-- Seed default packages for Manual Saving
do $$
declare
  v_manual_id uuid;
begin
  select id into v_manual_id from public.saving_providers where provider_key = 'manual';
  if v_manual_id is not null then
    insert into public.saving_packages (provider_id, package_name, duration_days, annual_interest_rate, settlement_rules, penalty_rules)
    values
      (v_manual_id, '30 Days',  30,  3.50, '["roll_principal_interest","roll_principal_only","withdraw_everything"]', '[{"strategy":"demand_interest","demandRate":0.5}]'),
      (v_manual_id, '90 Days',  90,  4.50, '["roll_principal_interest","roll_principal_only","withdraw_everything"]', '[{"strategy":"demand_interest","demandRate":0.5}]'),
      (v_manual_id, '180 Days', 180, 5.50, '["roll_principal_interest","roll_principal_only","withdraw_everything"]', '[{"strategy":"demand_interest","demandRate":0.5}]'),
      (v_manual_id, '365 Days', 365, 6.50, '["roll_principal_interest","roll_principal_only","withdraw_everything"]', '[{"strategy":"demand_interest","demandRate":0.5}]')
    on conflict do nothing;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Savings (aggregate root)
-- ---------------------------------------------------------------------------
create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  status text not null default 'active',
  funding_account_id uuid not null references public.accounts(id),
  settlement_account_id uuid not null references public.accounts(id),
  provider_id uuid not null references public.saving_providers(id),
  product_name text not null default '',
  product_snapshot jsonb not null,
  renewal_preference text not null default 'manual_review',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_status_check check (
    status in ('active', 'matured', 'early_closed', 'closed')
  ),
  constraint savings_renewal_preference_check check (
    renewal_preference in ('manual_review', 'auto_renew_same_package', 'auto_renew_selected_package', 'withdraw_everything')
  )
);

create index if not exists idx_savings_household_status
  on public.savings (household_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Saving cycles (immutable history per cycle)
-- ---------------------------------------------------------------------------
create table if not exists public.saving_cycles (
  id uuid primary key default gen_random_uuid(),
  saving_id uuid not null references public.savings(id) on delete cascade,
  cycle_number int not null,
  start_date date not null,
  end_date date not null,
  principal numeric(18, 0) not null,
  locked_rate numeric(10, 6) not null,
  package_snapshot jsonb not null,
  accrued_interest numeric(18, 0) not null default 0,
  settlement_result jsonb,
  status text not null default 'active',
  funding_transaction_id uuid references public.transactions(id) on delete set null,
  settlement_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint saving_cycles_principal_positive check (principal > 0),
  constraint saving_cycles_rate_nonneg check (locked_rate >= 0),
  constraint saving_cycles_status_check check (
    status in ('active', 'matured', 'early_closed', 'rolled')
  ),
  constraint saving_cycles_unique_number unique (saving_id, cycle_number)
);

create index if not exists idx_saving_cycles_saving
  on public.saving_cycles (saving_id, cycle_number);

create index if not exists idx_saving_cycles_maturity
  on public.saving_cycles (status, end_date)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- 6. Early withdrawal audit log
-- ---------------------------------------------------------------------------
create table if not exists public.early_withdrawals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.saving_cycles(id),
  saving_id uuid not null references public.savings(id),
  requested_at timestamptz not null default now(),
  principal numeric(18, 0) not null,
  accrued_interest numeric(18, 0) not null,
  eligible_interest numeric(18, 0) not null,
  penalty_amount numeric(18, 0) not null,
  net_returned numeric(18, 0) not null,
  penalty_strategy text not null,
  settlement_transaction_id uuid references public.transactions(id) on delete set null,
  executed_by uuid references auth.users(id) on delete set null,
  constraint early_withdrawals_net_nonneg check (net_returned >= 0)
);

-- ---------------------------------------------------------------------------
-- 7. RLS — all tables
-- ---------------------------------------------------------------------------
alter table public.saving_providers enable row level security;
alter table public.saving_packages enable row level security;
alter table public.savings enable row level security;
alter table public.saving_cycles enable row level security;
alter table public.early_withdrawals enable row level security;

-- Providers are readable by all authenticated users
create policy saving_providers_select_auth on public.saving_providers
  for select to authenticated
  using (is_active = true);

-- Packages readable by all authenticated users
create policy saving_packages_select_auth on public.saving_packages
  for select to authenticated
  using (is_active = true);

-- Savings scoped to household
create policy savings_select_member on public.savings
  for select to authenticated
  using (public.is_household_member(household_id));

create policy savings_insert_member on public.savings
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy savings_update_member on public.savings
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Cycles scoped through savings → household
create policy saving_cycles_select_member on public.saving_cycles
  for select to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = saving_id
        and public.is_household_member(s.household_id)
    )
  );

create policy saving_cycles_insert_member on public.saving_cycles
  for insert to authenticated
  with check (
    exists (
      select 1 from public.savings s
      where s.id = saving_id
        and public.is_household_member(s.household_id)
    )
  );

create policy saving_cycles_update_member on public.saving_cycles
  for update to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = saving_id
        and public.is_household_member(s.household_id)
    )
  );

-- Early withdrawals scoped through savings → household
create policy early_withdrawals_select_member on public.early_withdrawals
  for select to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = saving_id
        and public.is_household_member(s.household_id)
    )
  );

create policy early_withdrawals_insert_member on public.early_withdrawals
  for insert to authenticated
  with check (
    exists (
      select 1 from public.savings s
      where s.id = saving_id
        and public.is_household_member(s.household_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------------
grant select on public.saving_providers to authenticated;
grant select on public.saving_packages to authenticated;
grant select, insert, update on public.savings to authenticated;
grant select, insert, update on public.saving_cycles to authenticated;
grant select, insert on public.early_withdrawals to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Update inbox_items: add new savings kinds
-- ---------------------------------------------------------------------------
alter table public.inbox_items
  drop constraint if exists inbox_items_kind_check;

alter table public.inbox_items
  add constraint inbox_items_kind_check
  check (
    kind in (
      'unmapped_expense',
      'income_suggest',
      'savings_maturity',
      'savings_matured',
      'renewal_required',
      'early_withdrawal_confirmation',
      'penalty_warning',
      'rate_changed_suggestion',
      'package_expired',
      'emi_complete',
      'emergency_declaration',
      'payment_reminder'
    )
  );

-- ---------------------------------------------------------------------------
-- 10. Helper: get or create savings_product internal account per household
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_savings_product_account(
  p_household_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  select a.id into v_account_id
  from public.accounts a
  where a.household_id = p_household_id
    and a.type = 'savings_product'
    and a.is_archived = false
  limit 1;

  if v_account_id is not null then
    return v_account_id;
  end if;

  insert into public.accounts (household_id, name, type, opening_balance)
  values (p_household_id, 'Savings Products', 'savings_product', 0)
  returning id into v_account_id;

  return v_account_id;
end;
$$;

grant execute on function public.get_or_create_savings_product_account(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Helper: create saving with atomic ledger transfer
-- ---------------------------------------------------------------------------
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
  p_package_snapshot jsonb
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
  v_today date;
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

  if p_principal is null or p_principal <= 0 then
    raise exception 'Principal must be positive';
  end if;

  -- Verify funding account belongs to household
  if not exists (
    select 1 from public.accounts a
    where a.id = p_funding_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid funding account';
  end if;

  -- Get or create internal savings_product account
  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);

  v_today := (timezone('utc', now()))::date;

  -- Ledger: funding account -principal
  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, p_funding_account_id, 'expense', p_principal, 'VND',
    v_today, 'Fund saving: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_funding_tx_id;

  -- Ledger: savings_product account +principal
  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, v_product_account_id, 'income', p_principal, 'VND',
    v_today, 'Saving funded: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_receiving_tx_id;

  -- Create saving
  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id,
    provider_id, product_name, product_snapshot, renewal_preference, created_by
  )
  values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id,
    p_provider_id, p_product_name, p_product_snapshot, p_renewal_preference, v_user_id
  )
  returning id into v_saving_id;

  -- Create cycle 1
  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status, funding_transaction_id
  )
  values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date,
    p_principal, (p_product_snapshot->>'annualInterestRate')::numeric,
    p_package_snapshot,
    'active', v_funding_tx_id
  )
  returning id into v_cycle_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving_id,
    'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id
  );
end;
$$;

grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. Helper: detect and enqueue matured savings
-- ---------------------------------------------------------------------------
create or replace function public.detect_matured_savings(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle record;
  v_saving record;
  v_pkg record;
  v_item_id uuid;
  v_prev_rate numeric;
  v_count int := 0;
begin
  for v_cycle in
    select sc.*, s.provider_id, s.product_name, s.product_snapshot,
           s.renewal_preference, s.settlement_account_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date <= (timezone('utc', now()))::date
    for update of sc
  loop
    -- Update cycle → matured
    update public.saving_cycles
    set status = 'matured'
    where id = v_cycle.id;

    -- Update saving → matured
    update public.savings
    set status = 'matured', updated_at = timezone('utc', now())
    where id = v_cycle.saving_id;

    -- Get previous cycle rate for comparison
    select sc2.locked_rate into v_prev_rate
    from public.saving_cycles sc2
    where sc2.saving_id = v_cycle.saving_id
      and sc2.cycle_number = v_cycle.cycle_number - 1
    limit 1;

    -- Get current provider packages for recommendations
    -- Compute estimated interest for simple interest
    -- estimated = principal * (rate / 100) * (days / 365)
    -- We'll let the application layer compute this; pass raw data in context_json.

    -- Enqueue inbox item
    insert into public.inbox_items (
      household_id, kind, status, source_type, source_id,
      amount, currency, title, context_json
    )
    values (
      p_household_id,
      'savings_matured',
      'pending',
      'guided',
      v_cycle.saving_id,
      v_cycle.principal + v_cycle.accrued_interest,
      'VND',
      v_cycle.product_name || ' — Matured',
      jsonb_build_object(
        'flow', 'savings_maturity',
        'cycleId', v_cycle.id,
        'providerId', v_cycle.provider_id,
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', v_prev_rate,
        'rateDifference', case when v_prev_rate is not null then v_cycle.locked_rate - v_prev_rate else 0 end,
        'principal', v_cycle.principal,
        'accruedInterest', v_cycle.accrued_interest,
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_preference,
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id
      )
    )
    on conflict (household_id, source_type, source_id) do update
    set
      status = 'pending',
      updated_at = timezone('utc', now()),
      title = excluded.title,
      amount = excluded.amount,
      context_json = excluded.context_json
    returning id into v_item_id;

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'maturedCount', v_count);
end;
$$;

grant execute on function public.detect_matured_savings(uuid) to authenticated;;
