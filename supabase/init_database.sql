-- ============================================================================
-- 00001_extensions.sql
-- Base extensions and shared utility trigger function.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
-- ============================================================================
-- 00002_core_schema.sql
-- Complete relational schema for household finance tracking.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Household identity and collaboration
-- --------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email citext not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Public profile metadata for each authenticated user.';

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency char(3) not null default 'VND',
  locale text not null default 'en-VN',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_name_not_blank check (length(trim(name)) > 0)
);
comment on table public.households is 'Root tenant boundary: all financial data belongs to one household.';

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null default 'partner',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  invited_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_role_check check (role in ('partner', 'admin')),
  constraint household_members_unique unique (household_id, user_id)
);
comment on table public.household_members is 'Many-to-many link between users and households for equal partner collaboration.';

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email citext not null,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid not null references public.profiles(user_id) on delete cascade,
  accepted_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_invitations_status_check check (status in ('pending', 'accepted', 'revoked', 'expired'))
);
comment on table public.household_invitations is 'Tracks invitation lifecycle for adding household partners securely.';

create table if not exists public.audit_events (
  id bigserial primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
comment on table public.audit_events is 'Immutable activity log for explainability and trust in financial edits.';

-- --------------------------------------------------------------------------
-- Cash flow and budgeting
-- --------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null,
  institution text,
  opening_balance numeric(18,0) not null default 0,
  opening_balance_date date not null default current_date,
  include_in_net_worth boolean not null default true,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_type_check check (type in ('cash', 'checking', 'savings', 'ewallet', 'brokerage', 'other'))
);
comment on table public.accounts is 'Authoritative containers for liquid cash and transactional balances.';

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  kind text not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  is_essential boolean not null default false,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_kind_check check (kind in ('income', 'expense')),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);
comment on table public.categories is 'Income/expense taxonomy with shared system defaults and household custom categories.';

create unique index if not exists categories_system_unique_name_kind
  on public.categories (kind, lower(name))
  where household_id is null;
create unique index if not exists categories_household_unique_name_kind
  on public.categories (household_id, kind, lower(name))
  where household_id is not null;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  type text not null,
  amount numeric(18,0) not null,
  currency char(3) not null default 'VND',
  transaction_date date not null,
  description text,
  category_id uuid references public.categories(id) on delete restrict,
  merchant text,
  paid_by_member_id uuid references public.profiles(user_id) on delete set null,
  counterparty_account_id uuid references public.accounts(id) on delete restrict,
  status text not null default 'cleared',
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_type_check check (type in ('income', 'expense', 'transfer')),
  constraint transactions_status_check check (status in ('cleared', 'pending')),
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_transfer_shape_check check (
    (type = 'transfer' and category_id is null and counterparty_account_id is not null and counterparty_account_id <> account_id)
    or
    (type in ('income', 'expense') and counterparty_account_id is null)
  )
);
comment on table public.transactions is 'Single source-of-truth ledger for household cash inflows, outflows, and transfers.';

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  template_json jsonb not null default '{}'::jsonb,
  frequency text not null,
  interval integer not null default 1,
  day_of_month integer,
  day_of_week integer,
  start_date date not null,
  end_date date,
  next_run_date date,
  is_active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_frequency_check check (frequency in ('weekly', 'monthly')),
  constraint recurring_rules_interval_positive check (interval > 0),
  constraint recurring_rules_day_of_month_check check (day_of_month is null or day_of_month between 1 and 31),
  constraint recurring_rules_day_of_week_check check (day_of_week is null or day_of_week between 0 and 6),
  constraint recurring_rules_date_range_check check (end_date is null or end_date >= start_date)
);
comment on table public.recurring_rules is 'Templates for expected recurring cash flow and reminder generation.';

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  planned_amount numeric(18,0) not null,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_budgets_month_check check (month = date_trunc('month', month)::date),
  constraint monthly_budgets_planned_amount_check check (planned_amount >= 0),
  constraint monthly_budgets_unique unique (household_id, month, category_id)
);
comment on table public.monthly_budgets is 'Per-category monthly planning baseline for budget-vs-actual analysis.';

-- --------------------------------------------------------------------------
-- Assets and valuation history
-- --------------------------------------------------------------------------

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  asset_class text not null,
  subtype text,
  unit_label text not null default 'unit',
  quantity numeric(20,6) not null default 0,
  acquisition_cost numeric(18,0),
  acquisition_date date,
  is_liquid boolean not null default false,
  include_in_net_worth boolean not null default true,
  is_archived boolean not null default false,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_asset_class_check check (asset_class in ('cash_equivalent', 'gold', 'mutual_fund', 'stock', 'real_estate', 'savings_deposit', 'vehicle', 'other')),
  constraint assets_quantity_nonnegative check (quantity >= 0),
  constraint assets_acquisition_cost_nonnegative check (acquisition_cost is null or acquisition_cost >= 0),
  constraint assets_household_pair_unique unique (id, household_id)
);
comment on table public.assets is 'Master register of non-account holdings (gold, funds, property, deposits, etc.).';

create table if not exists public.asset_quantity_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  household_id uuid not null,
  as_of_date date not null,
  quantity numeric(20,6) not null,
  source text not null default 'manual',
  note text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint asset_quantity_history_quantity_nonnegative check (quantity >= 0),
  constraint asset_quantity_history_source_check check (source in ('manual', 'imported', 'calculated')),
  constraint asset_quantity_history_unique unique (asset_id, as_of_date),
  constraint asset_quantity_history_asset_fk foreign key (asset_id, household_id)
    references public.assets(id, household_id) on delete cascade
);
comment on table public.asset_quantity_history is 'Daily/periodic unit counts so quantity changes are tracked independently from prices.';

create table if not exists public.asset_price_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  household_id uuid not null,
  as_of_date date not null,
  unit_price numeric(18,0) not null,
  price_currency char(3) not null default 'VND',
  source text not null default 'manual',
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint asset_price_history_unit_price_nonnegative check (unit_price >= 0),
  constraint asset_price_history_source_check check (source in ('manual', 'imported', 'calculated')),
  constraint asset_price_history_unique unique (asset_id, as_of_date),
  constraint asset_price_history_asset_fk foreign key (asset_id, household_id)
    references public.assets(id, household_id) on delete cascade
);
comment on table public.asset_price_history is 'Independent unit-price timeline for revaluable assets (gold, funds, property estimates).';

create table if not exists public.asset_cashflows (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  household_id uuid not null,
  flow_date date not null,
  flow_type text not null,
  amount numeric(18,0) not null,
  note text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint asset_cashflows_type_check check (flow_type in ('contribution', 'withdrawal', 'income', 'fee', 'tax')),
  constraint asset_cashflows_amount_positive check (amount > 0),
  constraint asset_cashflows_asset_fk foreign key (asset_id, household_id)
    references public.assets(id, household_id) on delete cascade
);
comment on table public.asset_cashflows is 'Cash movements tied to investments, enabling real return and contribution analysis.';

create table if not exists public.savings_deposit_terms (
  asset_id uuid primary key references public.assets(id) on delete cascade,
  principal_amount numeric(18,0) not null,
  annual_rate numeric(8,6) not null,
  compounding text not null,
  start_date date not null,
  maturity_date date not null,
  payout_account_id uuid references public.accounts(id) on delete set null,
  constraint savings_deposit_terms_principal_nonnegative check (principal_amount >= 0),
  constraint savings_deposit_terms_annual_rate_nonnegative check (annual_rate >= 0),
  constraint savings_deposit_terms_compounding_check check (compounding in ('simple', 'monthly', 'quarterly', 'at_maturity')),
  constraint savings_deposit_terms_date_check check (maturity_date >= start_date)
);
comment on table public.savings_deposit_terms is 'Subtype table for fixed-term deposits with maturity and interest settings.';

-- --------------------------------------------------------------------------
-- Liabilities and amortization detail
-- --------------------------------------------------------------------------

create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  liability_type text not null,
  lender_name text,
  principal_original numeric(18,0) not null,
  start_date date not null,
  term_months integer,
  repayment_method text,
  current_principal_outstanding numeric(18,0) not null,
  promo_rate_annual numeric(8,6),
  promo_months integer,
  floating_rate_margin numeric(8,6),
  next_payment_date date,
  include_in_net_worth boolean not null default true,
  is_active boolean not null default true,
  relationship_label text,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint liabilities_type_check check (liability_type in ('mortgage', 'personal_loan', 'car_loan', 'credit_card', 'family_loan', 'other')),
  constraint liabilities_repayment_method_check check (repayment_method is null or repayment_method in ('annuity', 'equal_principal', 'interest_only', 'flexible')),
  constraint liabilities_principal_original_positive check (principal_original > 0),
  constraint liabilities_current_nonnegative check (current_principal_outstanding >= 0),
  constraint liabilities_promo_rate_nonnegative check (promo_rate_annual is null or promo_rate_annual >= 0),
  constraint liabilities_promo_months_nonnegative check (promo_months is null or promo_months >= 0),
  constraint liabilities_term_positive check (term_months is null or term_months > 0),
  constraint liabilities_current_not_gt_original check (current_principal_outstanding <= principal_original),
  constraint liabilities_household_pair_unique unique (id, household_id)
);
comment on table public.liabilities is 'All debts, including formal loans and informal family loans, with payoff context.';

create table if not exists public.liability_rate_periods (
  id uuid primary key default gen_random_uuid(),
  liability_id uuid not null,
  household_id uuid not null,
  period_start date not null,
  period_end date,
  annual_rate numeric(8,6) not null,
  is_promotional boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint liability_rate_periods_rate_nonnegative check (annual_rate >= 0),
  constraint liability_rate_periods_date_range_check check (period_end is null or period_end >= period_start),
  constraint liability_rate_periods_unique unique (liability_id, period_start),
  constraint liability_rate_periods_liability_fk foreign key (liability_id, household_id)
    references public.liabilities(id, household_id) on delete cascade
);
comment on table public.liability_rate_periods is 'Explicit interest-rate timeline needed for promotional-to-floating mortgage modeling.';

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references public.profiles(user_id) on delete set null,
  scenario_type text not null,
  name text not null,
  base_snapshot_date date not null,
  assumptions_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenarios_type_check check (scenario_type in ('loan', 'purchase_timing', 'savings_projection', 'goal_modeling', 'debt_vs_invest')),
  constraint scenarios_status_check check (status in ('draft', 'saved', 'archived')),
  constraint scenarios_household_pair_unique unique (id, household_id)
);
comment on table public.scenarios is 'Saved what-if workspaces for major financial decisions with shared assumptions.';

create table if not exists public.liability_schedule_snapshots (
  id uuid primary key default gen_random_uuid(),
  liability_id uuid not null,
  household_id uuid not null,
  scenario_id uuid,
  generated_at timestamptz not null default now(),
  assumptions_json jsonb not null default '{}'::jsonb,
  schedule_json jsonb not null default '[]'::jsonb,
  constraint liability_schedule_snapshots_liability_fk foreign key (liability_id, household_id)
    references public.liabilities(id, household_id) on delete cascade,
  constraint liability_schedule_snapshots_scenario_fk foreign key (scenario_id, household_id)
    references public.scenarios(id, household_id) on delete set null
);
comment on table public.liability_schedule_snapshots is 'Stored amortization outputs for auditability and side-by-side debt strategy comparison.';

create table if not exists public.liability_payments (
  id uuid primary key default gen_random_uuid(),
  liability_id uuid not null,
  household_id uuid not null,
  payment_date date not null,
  scheduled_amount numeric(18,0),
  actual_amount numeric(18,0) not null,
  principal_component numeric(18,0) not null,
  interest_component numeric(18,0) not null,
  fee_component numeric(18,0) not null default 0,
  source_account_id uuid references public.accounts(id) on delete set null,
  entered_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint liability_payments_scheduled_nonnegative check (scheduled_amount is null or scheduled_amount >= 0),
  constraint liability_payments_actual_positive check (actual_amount > 0),
  constraint liability_payments_components_nonnegative check (principal_component >= 0 and interest_component >= 0 and fee_component >= 0),
  constraint liability_payments_components_le_actual check (principal_component + interest_component + fee_component <= actual_amount),
  constraint liability_payments_liability_fk foreign key (liability_id, household_id)
    references public.liabilities(id, household_id) on delete cascade
);
comment on table public.liability_payments is 'Actual debt payment ledger with principal/interest split to quantify payoff progress.';

-- --------------------------------------------------------------------------
-- Goals, score snapshots, insights, and reporting
-- --------------------------------------------------------------------------

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_type text not null,
  name text not null,
  target_amount numeric(18,0) not null,
  target_date date,
  start_date date not null default current_date,
  priority smallint not null default 3,
  status text not null default 'active',
  linked_asset_id uuid references public.assets(id) on delete set null,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_type_check check (goal_type in ('emergency_fund', 'property_purchase', 'vehicle', 'education', 'house_construction', 'retirement', 'custom')),
  constraint goals_target_amount_positive check (target_amount > 0),
  constraint goals_priority_check check (priority between 1 and 5),
  constraint goals_status_check check (status in ('active', 'paused', 'completed', 'cancelled')),
  constraint goals_household_pair_unique unique (id, household_id)
);
comment on table public.goals is 'Long-horizon household targets linking savings behavior to real-life outcomes.';

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  household_id uuid not null,
  contribution_date date not null,
  amount numeric(18,0) not null,
  source_account_id uuid references public.accounts(id) on delete set null,
  member_id uuid references public.profiles(user_id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint goal_contributions_amount_positive check (amount > 0),
  constraint goal_contributions_goal_fk foreign key (goal_id, household_id)
    references public.goals(id, household_id) on delete cascade
);
comment on table public.goal_contributions is 'Contribution event log used to compute goal progress, ETA, and partner participation.';

create table if not exists public.goal_snapshots (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  household_id uuid not null,
  snapshot_date date not null,
  funded_amount numeric(18,0) not null,
  progress_ratio numeric(8,6) not null,
  required_monthly numeric(18,0),
  eta_date date,
  on_track boolean not null default false,
  created_at timestamptz not null default now(),
  constraint goal_snapshots_funded_nonnegative check (funded_amount >= 0),
  constraint goal_snapshots_progress_nonnegative check (progress_ratio >= 0),
  constraint goal_snapshots_required_nonnegative check (required_monthly is null or required_monthly >= 0),
  constraint goal_snapshots_unique unique (goal_id, snapshot_date),
  constraint goal_snapshots_goal_fk foreign key (goal_id, household_id)
    references public.goals(id, household_id) on delete cascade
);
comment on table public.goal_snapshots is 'Monthly goal-state history so users can see trajectory, not only current status.';

create table if not exists public.health_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  snapshot_month date not null,
  overall_score numeric(5,2) not null,
  cashflow_score numeric(5,2) not null,
  emergency_score numeric(5,2) not null,
  debt_score numeric(5,2) not null,
  networth_score numeric(5,2) not null,
  goals_score numeric(5,2) not null,
  diversification_score numeric(5,2) not null,
  metrics_json jsonb not null default '{}'::jsonb,
  top_action text not null,
  created_at timestamptz not null default now(),
  constraint health_score_snapshots_month_check check (snapshot_month = date_trunc('month', snapshot_month)::date),
  constraint health_score_snapshots_bounds check (
    overall_score between 0 and 100
    and cashflow_score between 0 and 100
    and emergency_score between 0 and 100
    and debt_score between 0 and 100
    and networth_score between 0 and 100
    and goals_score between 0 and 100
    and diversification_score between 0 and 100
  ),
  constraint health_score_snapshots_unique unique (household_id, snapshot_month)
);
comment on table public.health_score_snapshots is 'Explainable monthly financial health snapshots with factor-level decomposition.';

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  insight_type text not null,
  severity text not null default 'info',
  title text not null,
  body text not null,
  action_label text,
  action_target text,
  is_dismissed boolean not null default false,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint insights_type_check check (insight_type in ('spending_anomaly', 'goal_risk', 'debt_alert', 'savings_milestone', 'net_worth_change', 'custom')),
  constraint insights_severity_check check (severity in ('info', 'warning', 'critical'))
);
comment on table public.insights is 'Action-oriented recommendations generated from household context and trends.';

create table if not exists public.scenario_results (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null,
  household_id uuid not null,
  computed_at timestamptz not null default now(),
  summary_json jsonb not null default '{}'::jsonb,
  timeseries_json jsonb not null default '[]'::jsonb,
  key_metrics_json jsonb not null default '{}'::jsonb,
  constraint scenario_results_scenario_fk foreign key (scenario_id, household_id)
    references public.scenarios(id, household_id) on delete cascade
);
comment on table public.scenario_results is 'Immutable outputs for decision-model runs so users can compare alternatives over time.';

create table if not exists public.monthly_household_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null,
  total_assets numeric(18,0) not null,
  total_liabilities numeric(18,0) not null,
  net_worth numeric(18,0) not null,
  income numeric(18,0) not null,
  expense numeric(18,0) not null,
  savings numeric(18,0) not null,
  savings_rate numeric(8,6),
  emergency_months numeric(8,2),
  debt_service_ratio numeric(8,6),
  created_at timestamptz not null default now(),
  constraint monthly_household_snapshots_month_check check (month = date_trunc('month', month)::date),
  constraint monthly_household_snapshots_unique unique (household_id, month)
);
comment on table public.monthly_household_snapshots is 'Materialized month-close metrics for fast dashboard and report rendering.';

-- --------------------------------------------------------------------------
-- Performance indexes
-- --------------------------------------------------------------------------

create index if not exists idx_household_members_user_active
  on public.household_members (user_id, is_active);
create index if not exists idx_household_members_household_active
  on public.household_members (household_id, is_active);
create index if not exists idx_household_invitations_household_status
  on public.household_invitations (household_id, status);
create index if not exists idx_household_invitations_email
  on public.household_invitations (email);
create index if not exists idx_audit_events_household_created
  on public.audit_events (household_id, created_at desc);

create index if not exists idx_accounts_household_archived
  on public.accounts (household_id, is_archived);
create index if not exists idx_categories_household_kind_active
  on public.categories (household_id, kind, is_active);
create index if not exists idx_transactions_household_date
  on public.transactions (household_id, transaction_date desc);
create index if not exists idx_transactions_household_category_date
  on public.transactions (household_id, category_id, transaction_date desc);
create index if not exists idx_transactions_household_account_date
  on public.transactions (household_id, account_id, transaction_date desc);
create index if not exists idx_recurring_rules_household_next_run
  on public.recurring_rules (household_id, next_run_date);
create index if not exists idx_monthly_budgets_household_month
  on public.monthly_budgets (household_id, month);

create index if not exists idx_assets_household_class_archived
  on public.assets (household_id, asset_class, is_archived);
create index if not exists idx_asset_quantity_history_household_date
  on public.asset_quantity_history (household_id, as_of_date);
create index if not exists idx_asset_quantity_history_asset_date
  on public.asset_quantity_history (asset_id, as_of_date desc);
create index if not exists idx_asset_price_history_household_date
  on public.asset_price_history (household_id, as_of_date);
create index if not exists idx_asset_price_history_asset_date
  on public.asset_price_history (asset_id, as_of_date desc);
create index if not exists idx_asset_cashflows_asset_date
  on public.asset_cashflows (asset_id, flow_date desc);
create index if not exists idx_savings_deposit_terms_maturity
  on public.savings_deposit_terms (maturity_date);

create index if not exists idx_liabilities_household_active_type
  on public.liabilities (household_id, is_active, liability_type);
create index if not exists idx_liability_rate_periods_liability_start
  on public.liability_rate_periods (liability_id, period_start);
create index if not exists idx_liability_payments_liability_date
  on public.liability_payments (liability_id, payment_date desc);
create index if not exists idx_liability_payments_household_date
  on public.liability_payments (household_id, payment_date desc);
create index if not exists idx_liability_schedule_snapshots_liability_generated
  on public.liability_schedule_snapshots (liability_id, generated_at desc);

create index if not exists idx_goals_household_status_target
  on public.goals (household_id, status, target_date);
create index if not exists idx_goal_contributions_goal_date
  on public.goal_contributions (goal_id, contribution_date desc);
create index if not exists idx_goal_snapshots_household_date
  on public.goal_snapshots (household_id, snapshot_date desc);

create index if not exists idx_health_score_household_month
  on public.health_score_snapshots (household_id, snapshot_month desc);
create index if not exists idx_insights_household_dismissed_generated
  on public.insights (household_id, is_dismissed, generated_at desc);

create index if not exists idx_scenarios_household_type_updated
  on public.scenarios (household_id, scenario_type, updated_at desc);
create index if not exists idx_scenario_results_scenario_computed
  on public.scenario_results (scenario_id, computed_at desc);
create index if not exists idx_monthly_household_snapshots_household_month
  on public.monthly_household_snapshots (household_id, month desc);
-- ============================================================================
-- 00003_functions_and_rls.sql
-- Auth sync triggers, helper functions, row-level security, realtime publication.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Auth/profile sync
-- --------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'New User'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id)
  do update
    set full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Access helper functions
-- --------------------------------------------------------------------------

create or replace function public.current_jwt_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
  );
$$;

create or replace function public.get_primary_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hm.household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
    and hm.is_active = true
  order by hm.joined_at asc
  limit 1;
$$;

-- --------------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------------

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_households_set_updated_at on public.households;
create trigger trg_households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

drop trigger if exists trg_household_members_set_updated_at on public.household_members;
create trigger trg_household_members_set_updated_at
before update on public.household_members
for each row execute function public.set_updated_at();

drop trigger if exists trg_household_invitations_set_updated_at on public.household_invitations;
create trigger trg_household_invitations_set_updated_at
before update on public.household_invitations
for each row execute function public.set_updated_at();

drop trigger if exists trg_accounts_set_updated_at on public.accounts;
create trigger trg_accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_set_updated_at on public.transactions;
create trigger trg_transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_recurring_rules_set_updated_at on public.recurring_rules;
create trigger trg_recurring_rules_set_updated_at
before update on public.recurring_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_monthly_budgets_set_updated_at on public.monthly_budgets;
create trigger trg_monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function public.set_updated_at();

drop trigger if exists trg_assets_set_updated_at on public.assets;
create trigger trg_assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_liabilities_set_updated_at on public.liabilities;
create trigger trg_liabilities_set_updated_at
before update on public.liabilities
for each row execute function public.set_updated_at();

drop trigger if exists trg_scenarios_set_updated_at on public.scenarios;
create trigger trg_scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_set_updated_at on public.goals;
create trigger trg_goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row-level security
-- --------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.audit_events enable row level security;

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.monthly_budgets enable row level security;

alter table public.assets enable row level security;
alter table public.asset_quantity_history enable row level security;
alter table public.asset_price_history enable row level security;
alter table public.asset_cashflows enable row level security;
alter table public.savings_deposit_terms enable row level security;

alter table public.liabilities enable row level security;
alter table public.liability_rate_periods enable row level security;
alter table public.liability_schedule_snapshots enable row level security;
alter table public.liability_payments enable row level security;

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.goal_snapshots enable row level security;
alter table public.health_score_snapshots enable row level security;
alter table public.insights enable row level security;

alter table public.scenarios enable row level security;
alter table public.scenario_results enable row level security;
alter table public.monthly_household_snapshots enable row level security;

-- Profiles
create policy profiles_select_policy
on public.profiles
for select
using (
  profiles.user_id = auth.uid()
  or exists (
    select 1
    from public.household_members me
    join public.household_members other
      on other.household_id = me.household_id
     and other.user_id = profiles.user_id
     and other.is_active = true
    where me.user_id = auth.uid()
      and me.is_active = true
  )
);

create policy profiles_insert_own_policy
on public.profiles
for insert
with check (profiles.user_id = auth.uid());

create policy profiles_update_own_policy
on public.profiles
for update
using (profiles.user_id = auth.uid())
with check (profiles.user_id = auth.uid());

-- Households
create policy households_select_member_policy
on public.households
for select
using (public.is_household_member(households.id));

create policy households_insert_creator_policy
on public.households
for insert
with check (households.created_by = auth.uid());

create policy households_update_member_policy
on public.households
for update
using (public.is_household_member(households.id))
with check (public.is_household_member(households.id));

-- Household members
create policy household_members_select_member_policy
on public.household_members
for select
using (public.is_household_member(household_members.household_id));

create policy household_members_insert_policy
on public.household_members
for insert
with check (
  public.is_household_member(household_members.household_id)
  or (
    household_members.user_id = auth.uid()
    and exists (
      select 1
      from public.household_invitations i
      where i.household_id = household_members.household_id
        and lower(i.email::text) = public.current_jwt_email()
        and i.status = 'pending'
        and i.expires_at > now()
    )
  )
);

create policy household_members_update_member_policy
on public.household_members
for update
using (public.is_household_member(household_members.household_id))
with check (public.is_household_member(household_members.household_id));

create policy household_members_delete_member_policy
on public.household_members
for delete
using (public.is_household_member(household_members.household_id));

-- Household invitations
create policy household_invitations_select_policy
on public.household_invitations
for select
using (
  public.is_household_member(household_invitations.household_id)
  or lower(household_invitations.email::text) = public.current_jwt_email()
);

create policy household_invitations_insert_policy
on public.household_invitations
for insert
with check (
  public.is_household_member(household_invitations.household_id)
  and household_invitations.invited_by = auth.uid()
);

create policy household_invitations_update_policy
on public.household_invitations
for update
using (
  public.is_household_member(household_invitations.household_id)
  or lower(household_invitations.email::text) = public.current_jwt_email()
)
with check (
  public.is_household_member(household_invitations.household_id)
  or (
    lower(household_invitations.email::text) = public.current_jwt_email()
    and household_invitations.status in ('accepted', 'expired')
  )
);

create policy household_invitations_delete_policy
on public.household_invitations
for delete
using (public.is_household_member(household_invitations.household_id));

-- Audit events
create policy audit_events_select_member_policy
on public.audit_events
for select
using (public.is_household_member(audit_events.household_id));

create policy audit_events_insert_member_policy
on public.audit_events
for insert
with check (
  public.is_household_member(audit_events.household_id)
  and audit_events.actor_user_id = auth.uid()
);

-- Accounts
create policy accounts_select_member_policy
on public.accounts
for select
using (public.is_household_member(accounts.household_id));
create policy accounts_insert_member_policy
on public.accounts
for insert
with check (public.is_household_member(accounts.household_id));
create policy accounts_update_member_policy
on public.accounts
for update
using (public.is_household_member(accounts.household_id))
with check (public.is_household_member(accounts.household_id));
create policy accounts_delete_member_policy
on public.accounts
for delete
using (public.is_household_member(accounts.household_id));

-- Categories (system + household)
create policy categories_select_policy
on public.categories
for select
using (
  categories.household_id is null
  or public.is_household_member(categories.household_id)
);

create policy categories_insert_household_policy
on public.categories
for insert
with check (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

create policy categories_update_household_policy
on public.categories
for update
using (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
)
with check (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

create policy categories_delete_household_policy
on public.categories
for delete
using (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

-- Transactions
create policy transactions_select_member_policy
on public.transactions
for select
using (public.is_household_member(transactions.household_id));
create policy transactions_insert_member_policy
on public.transactions
for insert
with check (public.is_household_member(transactions.household_id));
create policy transactions_update_member_policy
on public.transactions
for update
using (public.is_household_member(transactions.household_id))
with check (public.is_household_member(transactions.household_id));
create policy transactions_delete_member_policy
on public.transactions
for delete
using (public.is_household_member(transactions.household_id));

-- Recurring rules
create policy recurring_rules_select_member_policy
on public.recurring_rules
for select
using (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_insert_member_policy
on public.recurring_rules
for insert
with check (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_update_member_policy
on public.recurring_rules
for update
using (public.is_household_member(recurring_rules.household_id))
with check (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_delete_member_policy
on public.recurring_rules
for delete
using (public.is_household_member(recurring_rules.household_id));

-- Monthly budgets
create policy monthly_budgets_select_member_policy
on public.monthly_budgets
for select
using (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_insert_member_policy
on public.monthly_budgets
for insert
with check (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_update_member_policy
on public.monthly_budgets
for update
using (public.is_household_member(monthly_budgets.household_id))
with check (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_delete_member_policy
on public.monthly_budgets
for delete
using (public.is_household_member(monthly_budgets.household_id));

-- Assets
create policy assets_select_member_policy
on public.assets
for select
using (public.is_household_member(assets.household_id));
create policy assets_insert_member_policy
on public.assets
for insert
with check (public.is_household_member(assets.household_id));
create policy assets_update_member_policy
on public.assets
for update
using (public.is_household_member(assets.household_id))
with check (public.is_household_member(assets.household_id));
create policy assets_delete_member_policy
on public.assets
for delete
using (public.is_household_member(assets.household_id));

-- Asset quantity history
create policy asset_quantity_history_select_member_policy
on public.asset_quantity_history
for select
using (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_insert_member_policy
on public.asset_quantity_history
for insert
with check (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_update_member_policy
on public.asset_quantity_history
for update
using (public.is_household_member(asset_quantity_history.household_id))
with check (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_delete_member_policy
on public.asset_quantity_history
for delete
using (public.is_household_member(asset_quantity_history.household_id));

-- Asset price history
create policy asset_price_history_select_member_policy
on public.asset_price_history
for select
using (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_insert_member_policy
on public.asset_price_history
for insert
with check (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_update_member_policy
on public.asset_price_history
for update
using (public.is_household_member(asset_price_history.household_id))
with check (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_delete_member_policy
on public.asset_price_history
for delete
using (public.is_household_member(asset_price_history.household_id));

-- Asset cashflows
create policy asset_cashflows_select_member_policy
on public.asset_cashflows
for select
using (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_insert_member_policy
on public.asset_cashflows
for insert
with check (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_update_member_policy
on public.asset_cashflows
for update
using (public.is_household_member(asset_cashflows.household_id))
with check (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_delete_member_policy
on public.asset_cashflows
for delete
using (public.is_household_member(asset_cashflows.household_id));

-- Savings deposit terms (scoped via parent asset)
create policy savings_deposit_terms_select_member_policy
on public.savings_deposit_terms
for select
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_insert_member_policy
on public.savings_deposit_terms
for insert
with check (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_update_member_policy
on public.savings_deposit_terms
for update
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
)
with check (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_delete_member_policy
on public.savings_deposit_terms
for delete
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

-- Liabilities
create policy liabilities_select_member_policy
on public.liabilities
for select
using (public.is_household_member(liabilities.household_id));
create policy liabilities_insert_member_policy
on public.liabilities
for insert
with check (public.is_household_member(liabilities.household_id));
create policy liabilities_update_member_policy
on public.liabilities
for update
using (public.is_household_member(liabilities.household_id))
with check (public.is_household_member(liabilities.household_id));
create policy liabilities_delete_member_policy
on public.liabilities
for delete
using (public.is_household_member(liabilities.household_id));

-- Liability rate periods
create policy liability_rate_periods_select_member_policy
on public.liability_rate_periods
for select
using (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_insert_member_policy
on public.liability_rate_periods
for insert
with check (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_update_member_policy
on public.liability_rate_periods
for update
using (public.is_household_member(liability_rate_periods.household_id))
with check (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_delete_member_policy
on public.liability_rate_periods
for delete
using (public.is_household_member(liability_rate_periods.household_id));

-- Liability schedule snapshots
create policy liability_schedule_snapshots_select_member_policy
on public.liability_schedule_snapshots
for select
using (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_insert_member_policy
on public.liability_schedule_snapshots
for insert
with check (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_update_member_policy
on public.liability_schedule_snapshots
for update
using (public.is_household_member(liability_schedule_snapshots.household_id))
with check (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_delete_member_policy
on public.liability_schedule_snapshots
for delete
using (public.is_household_member(liability_schedule_snapshots.household_id));

-- Liability payments
create policy liability_payments_select_member_policy
on public.liability_payments
for select
using (public.is_household_member(liability_payments.household_id));
create policy liability_payments_insert_member_policy
on public.liability_payments
for insert
with check (public.is_household_member(liability_payments.household_id));
create policy liability_payments_update_member_policy
on public.liability_payments
for update
using (public.is_household_member(liability_payments.household_id))
with check (public.is_household_member(liability_payments.household_id));
create policy liability_payments_delete_member_policy
on public.liability_payments
for delete
using (public.is_household_member(liability_payments.household_id));

-- Goals
create policy goals_select_member_policy
on public.goals
for select
using (public.is_household_member(goals.household_id));
create policy goals_insert_member_policy
on public.goals
for insert
with check (public.is_household_member(goals.household_id));
create policy goals_update_member_policy
on public.goals
for update
using (public.is_household_member(goals.household_id))
with check (public.is_household_member(goals.household_id));
create policy goals_delete_member_policy
on public.goals
for delete
using (public.is_household_member(goals.household_id));

-- Goal contributions
create policy goal_contributions_select_member_policy
on public.goal_contributions
for select
using (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_insert_member_policy
on public.goal_contributions
for insert
with check (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_update_member_policy
on public.goal_contributions
for update
using (public.is_household_member(goal_contributions.household_id))
with check (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_delete_member_policy
on public.goal_contributions
for delete
using (public.is_household_member(goal_contributions.household_id));

-- Goal snapshots
create policy goal_snapshots_select_member_policy
on public.goal_snapshots
for select
using (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_insert_member_policy
on public.goal_snapshots
for insert
with check (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_update_member_policy
on public.goal_snapshots
for update
using (public.is_household_member(goal_snapshots.household_id))
with check (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_delete_member_policy
on public.goal_snapshots
for delete
using (public.is_household_member(goal_snapshots.household_id));

-- Health score snapshots
create policy health_score_snapshots_select_member_policy
on public.health_score_snapshots
for select
using (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_insert_member_policy
on public.health_score_snapshots
for insert
with check (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_update_member_policy
on public.health_score_snapshots
for update
using (public.is_household_member(health_score_snapshots.household_id))
with check (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_delete_member_policy
on public.health_score_snapshots
for delete
using (public.is_household_member(health_score_snapshots.household_id));

-- Insights
create policy insights_select_member_policy
on public.insights
for select
using (public.is_household_member(insights.household_id));
create policy insights_insert_member_policy
on public.insights
for insert
with check (public.is_household_member(insights.household_id));
create policy insights_update_member_policy
on public.insights
for update
using (public.is_household_member(insights.household_id))
with check (public.is_household_member(insights.household_id));
create policy insights_delete_member_policy
on public.insights
for delete
using (public.is_household_member(insights.household_id));

-- Scenarios
create policy scenarios_select_member_policy
on public.scenarios
for select
using (public.is_household_member(scenarios.household_id));
create policy scenarios_insert_member_policy
on public.scenarios
for insert
with check (public.is_household_member(scenarios.household_id));
create policy scenarios_update_member_policy
on public.scenarios
for update
using (public.is_household_member(scenarios.household_id))
with check (public.is_household_member(scenarios.household_id));
create policy scenarios_delete_member_policy
on public.scenarios
for delete
using (public.is_household_member(scenarios.household_id));

-- Scenario results
create policy scenario_results_select_member_policy
on public.scenario_results
for select
using (public.is_household_member(scenario_results.household_id));
create policy scenario_results_insert_member_policy
on public.scenario_results
for insert
with check (public.is_household_member(scenario_results.household_id));
create policy scenario_results_update_member_policy
on public.scenario_results
for update
using (public.is_household_member(scenario_results.household_id))
with check (public.is_household_member(scenario_results.household_id));
create policy scenario_results_delete_member_policy
on public.scenario_results
for delete
using (public.is_household_member(scenario_results.household_id));

-- Monthly household snapshots
create policy monthly_household_snapshots_select_member_policy
on public.monthly_household_snapshots
for select
using (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_insert_member_policy
on public.monthly_household_snapshots
for insert
with check (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_update_member_policy
on public.monthly_household_snapshots
for update
using (public.is_household_member(monthly_household_snapshots.household_id))
with check (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_delete_member_policy
on public.monthly_household_snapshots
for delete
using (public.is_household_member(monthly_household_snapshots.household_id));

-- --------------------------------------------------------------------------
-- Realtime publication for collaboration-critical tables
-- --------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'assets'
  ) then
    execute 'alter publication supabase_realtime add table public.assets';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'liabilities'
  ) then
    execute 'alter publication supabase_realtime add table public.liabilities';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'liability_payments'
  ) then
    execute 'alter publication supabase_realtime add table public.liability_payments';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goals'
  ) then
    execute 'alter publication supabase_realtime add table public.goals';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goal_contributions'
  ) then
    execute 'alter publication supabase_realtime add table public.goal_contributions';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'health_score_snapshots'
  ) then
    execute 'alter publication supabase_realtime add table public.health_score_snapshots';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'insights'
  ) then
    execute 'alter publication supabase_realtime add table public.insights';
  end if;
end $$;
-- ============================================================================
-- 00004_seed_reference_data.sql
-- System reference data shared by all households.
-- ============================================================================

insert into public.categories (id, household_id, kind, name, is_system, is_active, is_essential, icon, color, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', null, 'income',  'Salary',            true, true, false, 'wallet',         '#16a34a', 1),
  ('10000000-0000-0000-0000-000000000002', null, 'income',  'Bonus',             true, true, false, 'sparkles',       '#15803d', 2),
  ('10000000-0000-0000-0000-000000000003', null, 'income',  'Freelance',         true, true, false, 'briefcase',      '#0f766e', 3),
  ('10000000-0000-0000-0000-000000000004', null, 'income',  'Investment Income', true, true, false, 'line-chart',     '#0e7490', 4),
  ('10000000-0000-0000-0000-000000000005', null, 'income',  'Gift',              true, true, false, 'gift',           '#65a30d', 5),
  ('10000000-0000-0000-0000-000000000006', null, 'income',  'Rental Income',     true, true, false, 'home',           '#0f766e', 6),
  ('10000000-0000-0000-0000-000000000007', null, 'income',  'Other Income',      true, true, false, 'plus-circle',    '#334155', 7),
  ('20000000-0000-0000-0000-000000000001', null, 'expense', 'Groceries',         true, true, true,  'shopping-cart',  '#ef4444', 1),
  ('20000000-0000-0000-0000-000000000002', null, 'expense', 'Housing',           true, true, true,  'building-2',     '#f97316', 2),
  ('20000000-0000-0000-0000-000000000003', null, 'expense', 'Transportation',    true, true, true,  'car',            '#f59e0b', 3),
  ('20000000-0000-0000-0000-000000000004', null, 'expense', 'Utilities',         true, true, true,  'bolt',           '#eab308', 4),
  ('20000000-0000-0000-0000-000000000005', null, 'expense', 'Healthcare',        true, true, true,  'stethoscope',    '#84cc16', 5),
  ('20000000-0000-0000-0000-000000000006', null, 'expense', 'Education',         true, true, false, 'book-open',      '#0ea5e9', 6),
  ('20000000-0000-0000-0000-000000000007', null, 'expense', 'Entertainment',     true, true, false, 'film',           '#a855f7', 7),
  ('20000000-0000-0000-0000-000000000008', null, 'expense', 'Shopping',          true, true, false, 'shirt',          '#d946ef', 8),
  ('20000000-0000-0000-0000-000000000009', null, 'expense', 'Personal Care',     true, true, false, 'scissors',       '#ec4899', 9),
  ('20000000-0000-0000-0000-000000000010', null, 'expense', 'Family Support',    true, true, false, 'users',          '#f43f5e', 10),
  ('20000000-0000-0000-0000-000000000011', null, 'expense', 'Insurance',         true, true, true,  'shield-check',   '#64748b', 11),
  ('20000000-0000-0000-0000-000000000012', null, 'expense', 'Loan Payment',      true, true, true,  'landmark',       '#334155', 12),
  ('20000000-0000-0000-0000-000000000013', null, 'expense', 'Other Expense',     true, true, false, 'ellipsis',       '#94a3b8', 13)
on conflict (id) do nothing;
-- ============================================================================
-- 00006_dashboard_aggregates.sql
-- Dashboard aggregate functions/views for RPC access.
-- ============================================================================

create or replace function public.rpc_dashboard_core(
  p_household_id uuid default null,
  p_as_of_date date default current_date
)
returns table (
  household_id uuid,
  as_of_date date,
  month_start date,
  month_end date,
  total_assets numeric(18,0),
  total_liabilities numeric(18,0),
  net_worth numeric(18,0),
  monthly_income numeric(18,0),
  monthly_expense numeric(18,0),
  monthly_savings numeric(18,0),
  savings_rate numeric(10,6),
  emergency_months numeric(10,2),
  debt_service_ratio numeric(10,6)
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_month_start date;
  v_month_end date;
  v_account_assets numeric(18,0) := 0;
  v_non_account_assets numeric(18,0) := 0;
  v_total_assets numeric(18,0) := 0;
  v_total_liabilities numeric(18,0) := 0;
  v_monthly_income numeric(18,0) := 0;
  v_monthly_expense numeric(18,0) := 0;
  v_monthly_savings numeric(18,0) := 0;
  v_savings_rate numeric(10,6);
  v_liquid_assets numeric(18,0) := 0;
  v_avg_essential_expense numeric(18,2);
  v_emergency_months numeric(10,2);
  v_debt_service numeric(18,0) := 0;
  v_debt_service_ratio numeric(10,6);
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.is_household_member(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end := (v_month_start + interval '1 month - 1 day')::date;

  select coalesce(sum(
    case
      when a.type = 'income' then a.amount
      when a.type = 'expense' then -a.amount
      else 0
    end
  ), 0)::numeric(18,0)
  into v_account_assets
  from (
    select ac.id,
      ac.opening_balance as amount,
      'income'::text as type,
      ac.opening_balance_date as transaction_date
    from public.accounts ac
    where ac.household_id = v_household_id
      and ac.include_in_net_worth = true
      and ac.is_archived = false

    union all

    select t.account_id,
      t.amount,
      t.type,
      t.transaction_date
    from public.transactions t
    join public.accounts ac on ac.id = t.account_id
    where t.household_id = v_household_id
      and ac.include_in_net_worth = true
      and ac.is_archived = false
      and t.transaction_date <= p_as_of_date
  ) a;

  with latest_q as (
    select distinct on (aqh.asset_id)
      aqh.asset_id,
      aqh.quantity
    from public.asset_quantity_history aqh
    where aqh.household_id = v_household_id
      and aqh.as_of_date <= p_as_of_date
    order by aqh.asset_id, aqh.as_of_date desc
  ),
  latest_p as (
    select distinct on (aph.asset_id)
      aph.asset_id,
      aph.unit_price
    from public.asset_price_history aph
    where aph.household_id = v_household_id
      and aph.as_of_date <= p_as_of_date
    order by aph.asset_id, aph.as_of_date desc
  )
  select coalesce(sum(
    case
      when a.include_in_net_worth = false then 0
      else coalesce(lq.quantity, a.quantity) * coalesce(lp.unit_price, 0)
    end
  ), 0)::numeric(18,0)
  into v_non_account_assets
  from public.assets a
  left join latest_q lq on lq.asset_id = a.id
  left join latest_p lp on lp.asset_id = a.id
  where a.household_id = v_household_id
    and a.is_archived = false;

  v_total_assets := coalesce(v_account_assets, 0) + coalesce(v_non_account_assets, 0);

  select coalesce(sum(l.current_principal_outstanding), 0)::numeric(18,0)
  into v_total_liabilities
  from public.liabilities l
  where l.household_id = v_household_id
    and l.include_in_net_worth = true
    and l.is_active = true;

  select coalesce(sum(t.amount), 0)::numeric(18,0)
  into v_monthly_income
  from public.transactions t
  where t.household_id = v_household_id
    and t.type = 'income'
    and t.transaction_date between v_month_start and v_month_end;

  select coalesce(sum(t.amount), 0)::numeric(18,0)
  into v_monthly_expense
  from public.transactions t
  where t.household_id = v_household_id
    and t.type = 'expense'
    and t.transaction_date between v_month_start and v_month_end;

  v_monthly_savings := v_monthly_income - v_monthly_expense;

  if v_monthly_income > 0 then
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  else
    v_savings_rate := null;
  end if;

  with account_balances as (
    select
      ac.id,
      ac.opening_balance
      + coalesce(sum(
          case
            when t.type = 'income' then t.amount
            when t.type = 'expense' then -t.amount
            else 0
          end
        ), 0) as balance
    from public.accounts ac
    left join public.transactions t
      on t.account_id = ac.id
      and t.transaction_date <= p_as_of_date
      and t.household_id = v_household_id
    where ac.household_id = v_household_id
      and ac.is_archived = false
    group by ac.id, ac.opening_balance
  ),
  liquid_assets as (
    select coalesce(sum(greatest(ab.balance, 0)), 0)::numeric(18,0) as liquid_value
    from account_balances ab

    union all

    select coalesce(sum(
      case
        when a.is_liquid = true and a.is_archived = false
          then coalesce(lq.quantity, a.quantity) * coalesce(lp.unit_price, 0)
        else 0
      end
    ), 0)::numeric(18,0)
    from public.assets a
    left join lateral (
      select aqh.quantity
      from public.asset_quantity_history aqh
      where aqh.asset_id = a.id
        and aqh.household_id = v_household_id
        and aqh.as_of_date <= p_as_of_date
      order by aqh.as_of_date desc
      limit 1
    ) lq on true
    left join lateral (
      select aph.unit_price
      from public.asset_price_history aph
      where aph.asset_id = a.id
        and aph.household_id = v_household_id
        and aph.as_of_date <= p_as_of_date
      order by aph.as_of_date desc
      limit 1
    ) lp on true
    where a.household_id = v_household_id
  )
  select coalesce(sum(liquid_value), 0)::numeric(18,0)
  into v_liquid_assets
  from liquid_assets;

  with essential_by_month as (
    select
      date_trunc('month', t.transaction_date)::date as month_bucket,
      sum(t.amount)::numeric(18,2) as essential_expense
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.household_id = v_household_id
      and t.type = 'expense'
      and c.is_essential = true
      and t.transaction_date >= (v_month_start - interval '2 months')
      and t.transaction_date <= v_month_end
    group by 1
  )
  select avg(essential_expense)
  into v_avg_essential_expense
  from essential_by_month;

  if coalesce(v_avg_essential_expense, 0) > 0 then
    v_emergency_months := round((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  else
    v_emergency_months := null;
  end if;

  select coalesce(sum(lp.actual_amount), 0)::numeric(18,0)
  into v_debt_service
  from public.liability_payments lp
  where lp.household_id = v_household_id
    and lp.payment_date between v_month_start and v_month_end;

  if v_monthly_income > 0 then
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  else
    v_debt_service_ratio := null;
  end if;

  return query
  select
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_emergency_months,
    v_debt_service_ratio;
end;
$$;

create or replace function public.rpc_dashboard_monthly_trend(
  p_household_id uuid default null,
  p_months integer default 6
)
returns table (
  household_id uuid,
  month date,
  net_worth numeric(18,0),
  income numeric(18,0),
  expense numeric(18,0),
  savings numeric(18,0),
  savings_rate numeric(8,6),
  emergency_months numeric(8,2),
  debt_service_ratio numeric(8,6)
)
language sql
stable
security definer
set search_path = public
as $$
  with ctx as (
    select coalesce(p_household_id, public.get_primary_household_id()) as household_id
  ), authz as (
    select
      c.household_id
    from ctx c
    where c.household_id is not null
      and (
        coalesce(auth.role(), '') in ('service_role', 'supabase_admin')
        or public.is_household_member(c.household_id)
      )
  )
  select
    mhs.household_id,
    mhs.month,
    mhs.net_worth,
    mhs.income,
    mhs.expense,
    mhs.savings,
    mhs.savings_rate,
    mhs.emergency_months,
    mhs.debt_service_ratio
  from public.monthly_household_snapshots mhs
  join authz a on a.household_id = mhs.household_id
  order by mhs.month desc
  limit greatest(coalesce(p_months, 6), 1);
$$;

create or replace view public.v_dashboard_latest_monthly_snapshot
with (security_invoker = true)
as
select distinct on (mhs.household_id)
  mhs.household_id,
  mhs.month,
  mhs.total_assets,
  mhs.total_liabilities,
  mhs.net_worth,
  mhs.income,
  mhs.expense,
  mhs.savings,
  mhs.savings_rate,
  mhs.emergency_months,
  mhs.debt_service_ratio
from public.monthly_household_snapshots mhs
order by mhs.household_id, mhs.month desc;

grant execute on function public.rpc_dashboard_core(uuid, date) to authenticated, anon;
grant execute on function public.rpc_dashboard_monthly_trend(uuid, integer) to authenticated, anon;
-- ============================================================================
-- 00007_household_lifecycle_rls_fix.sql
-- Allow household creator to insert the first member (self) during setup.
-- ============================================================================

drop policy if exists household_members_insert_policy on public.household_members;

create policy household_members_insert_policy
on public.household_members
for insert
with check (
  public.is_household_member(household_members.household_id)
  or (
    household_members.user_id = auth.uid()
    and exists (
      select 1
      from public.household_invitations i
      where i.household_id = household_members.household_id
        and lower(i.email::text) = public.current_jwt_email()
        and i.status = 'pending'
        and i.expires_at > now()
    )
  )
  or (
    household_members.user_id = auth.uid()
    and household_members.invited_by = auth.uid()
    and exists (
      select 1
      from public.households h
      where h.id = household_members.household_id
        and h.created_by = auth.uid()
    )
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = household_members.household_id
    )
  )
);
-- ============================================================================
-- 00008_household_assumptions_settings.sql
-- Household-level planning assumptions for settings and forecasting.
-- ============================================================================

alter table public.households
  add column if not exists assumptions_inflation_annual numeric(6,4) not null default 0.0400,
  add column if not exists assumptions_cash_return_annual numeric(6,4) not null default 0.0300,
  add column if not exists assumptions_investment_return_annual numeric(6,4) not null default 0.1000,
  add column if not exists assumptions_property_growth_annual numeric(6,4) not null default 0.0500,
  add column if not exists assumptions_gold_growth_annual numeric(6,4) not null default 0.0400,
  add column if not exists assumptions_salary_growth_annual numeric(6,4) not null default 0.0700;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_inflation_range') then
    alter table public.households
      add constraint households_assumptions_inflation_range
      check (assumptions_inflation_annual >= 0 and assumptions_inflation_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_cash_return_range') then
    alter table public.households
      add constraint households_assumptions_cash_return_range
      check (assumptions_cash_return_annual >= 0 and assumptions_cash_return_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_investment_return_range') then
    alter table public.households
      add constraint households_assumptions_investment_return_range
      check (assumptions_investment_return_annual >= 0 and assumptions_investment_return_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_property_growth_range') then
    alter table public.households
      add constraint households_assumptions_property_growth_range
      check (assumptions_property_growth_annual >= 0 and assumptions_property_growth_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_gold_growth_range') then
    alter table public.households
      add constraint households_assumptions_gold_growth_range
      check (assumptions_gold_growth_annual >= 0 and assumptions_gold_growth_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_salary_growth_range') then
    alter table public.households
      add constraint households_assumptions_salary_growth_range
      check (assumptions_salary_growth_annual >= 0 and assumptions_salary_growth_annual <= 1.0000);
  end if;
end
$$;

comment on column public.households.assumptions_inflation_annual is 'Annual inflation assumption (decimal fraction) for real-return and planning models.';
comment on column public.households.assumptions_cash_return_annual is 'Annual expected return for cash/savings deposits (decimal fraction).';
comment on column public.households.assumptions_investment_return_annual is 'Annual expected return for market investments (decimal fraction).';
comment on column public.households.assumptions_property_growth_annual is 'Annual expected property/land appreciation assumption (decimal fraction).';
comment on column public.households.assumptions_gold_growth_annual is 'Annual expected gold price growth assumption (decimal fraction).';
comment on column public.households.assumptions_salary_growth_annual is 'Annual expected household income growth assumption (decimal fraction).';
-- ============================================================================
-- 00008_household_lifecycle_rpc.sql
-- Robust household bootstrap RPC for authenticated users.
-- ============================================================================

create or replace function public.create_household_with_owner(
  p_name text,
  p_base_currency char(3) default 'VND',
  p_locale text default 'en-VN',
  p_timezone text default 'Asia/Ho_Chi_Minh'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Household name must be at least 2 characters';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.user_id = v_user_id
      and hm.is_active = true
  ) then
    raise exception 'User already belongs to a household';
  end if;

  insert into public.households (
    name,
    base_currency,
    locale,
    timezone,
    created_by
  ) values (
    trim(p_name),
    coalesce(p_base_currency, 'VND'),
    coalesce(nullif(trim(p_locale), ''), 'en-VN'),
    coalesce(nullif(trim(p_timezone), ''), 'Asia/Ho_Chi_Minh'),
    v_user_id
  )
  returning id into v_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    is_active,
    invited_by
  ) values (
    v_household_id,
    v_user_id,
    'partner',
    true,
    v_user_id
  );

  return v_household_id;
end;
$$;

grant execute on function public.create_household_with_owner(text, char(3), text, text)
to authenticated;
-- ============================================================================
-- 00009_goal_cashflow_directions.sql
-- Adds inflow/outflow direction and explicit destination account to goal flows.
-- ============================================================================

alter table public.goal_contributions
  add column if not exists flow_type text not null default 'inflow';

alter table public.goal_contributions
  add column if not exists destination_account_id uuid references public.accounts(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'goal_contributions_flow_type_check'
      and conrelid = 'public.goal_contributions'::regclass
  ) then
    alter table public.goal_contributions
      add constraint goal_contributions_flow_type_check
      check (flow_type in ('inflow', 'outflow'));
  end if;
end
$$;

alter table public.goal_contributions
  drop constraint if exists goal_contributions_flow_shape_check;

alter table public.goal_contributions
  add constraint goal_contributions_flow_shape_check
  check (
    (flow_type = 'inflow' and source_account_id is not null and destination_account_id is null)
    or
    (flow_type = 'outflow' and source_account_id is null and destination_account_id is not null)
  ) not valid;

create index if not exists idx_goal_contributions_source_account
  on public.goal_contributions (household_id, source_account_id, contribution_date desc);

create index if not exists idx_goal_contributions_destination_account
  on public.goal_contributions (household_id, destination_account_id, contribution_date desc);
-- ============================================================================
-- 00012_add_crypto_asset_class.sql
-- Modifies the assets table constraint to allow 'crypto' asset class.
-- ============================================================================

alter table public.assets
  drop constraint if exists assets_asset_class_check;

alter table public.assets
  add constraint assets_asset_class_check
  check (asset_class in ('cash_equivalent', 'gold', 'mutual_fund', 'stock', 'real_estate', 'savings_deposit', 'vehicle', 'crypto', 'other'));
-- ============================================================================
-- 00013_asset_cashflow_directions.sql
-- Adds explicit double-entry columns to asset cashflows.
-- ============================================================================

alter table public.asset_cashflows
  add column if not exists source_account_id uuid references public.accounts(id) on delete set null;

alter table public.asset_cashflows
  add column if not exists destination_account_id uuid references public.accounts(id) on delete set null;

alter table public.asset_cashflows
  drop constraint if exists asset_cashflows_flow_shape_check;

alter table public.asset_cashflows
  add constraint asset_cashflows_flow_shape_check
  check (
    (flow_type in ('contribution', 'fee', 'tax') and source_account_id is not null and destination_account_id is null)
    or
    (flow_type in ('withdrawal', 'income') and source_account_id is null and destination_account_id is not null)
  ) not valid;

create index if not exists idx_asset_cashflows_source_account
  on public.asset_cashflows (household_id, source_account_id, flow_date desc);

create index if not exists idx_asset_cashflows_destination_account
  on public.asset_cashflows (household_id, destination_account_id, flow_date desc);
-- ============================================================================
-- 00014_credit_card_installments.sql
-- Support for deferred-payment accounts (Credit Cards) and Installment Plans.
-- ============================================================================

-- 1. Extend accounts.type to include 'credit_card'
ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check 
  CHECK (type IN ('cash', 'checking', 'savings', 'ewallet', 'brokerage', 'credit_card', 'other'));

-- 2. Create credit_card_settings table
CREATE TABLE IF NOT EXISTS public.credit_card_settings (
  account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_limit NUMERIC(18,0) DEFAULT 0,
  statement_day INTEGER NOT NULL DEFAULT 25,
  due_day INTEGER NOT NULL DEFAULT 15,
  linked_bank_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  auto_pay BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_card_settings_days_check CHECK (statement_day BETWEEN 1 AND 31 AND due_day BETWEEN 1 AND 31)
);

COMMENT ON TABLE public.credit_card_settings IS 'Metadata for credit card accounts including limits and billing cycles.';

-- Enable RLS for credit_card_settings
ALTER TABLE public.credit_card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view card settings for their households"
  ON public.credit_card_settings
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage card settings for their households"
  ON public.credit_card_settings
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    )
  );

-- 3. Create installment_plans table
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  liability_id UUID REFERENCES public.liabilities(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  original_amount NUMERIC(18,0) NOT NULL,
  conversion_fee NUMERIC(18,0) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,0) NOT NULL,
  num_installments INTEGER NOT NULL,
  monthly_amount NUMERIC(18,0) NOT NULL,
  annual_rate NUMERIC(8,6) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  paid_installments INTEGER NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(18,0) NOT NULL,
  source_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT installment_plans_status_check CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT installment_plans_amount_positive CHECK (original_amount > 0),
  CONSTRAINT installment_plans_num_positive CHECK (num_installments > 0)
);

COMMENT ON TABLE public.installment_plans IS 'Tracks large purchases converted into fixed monthly installments on a credit card.';

-- Enable RLS for installment_plans
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installment plans for their households"
  ON public.installment_plans
  FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage installment plans for their households"
  ON public.installment_plans
  FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 4. Trigger for updated_at
CREATE TRIGGER set_updated_at_credit_card_settings
  BEFORE UPDATE ON public.credit_card_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_installment_plans
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================================
-- 00015_card_billing.sql
-- Advanced Billing Cycle Management for Credit Cards (Type 1 & Type 2)
-- ============================================================================

-- 1. Extend liabilities table with due date and payment account
ALTER TABLE public.liabilities
  ADD COLUMN IF NOT EXISTS due_day INTEGER,
  ADD COLUMN IF NOT EXISTS linked_payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.liabilities.due_day IS 'The day of the month when payment for this liability is typically due.';
COMMENT ON COLUMN public.liabilities.linked_payment_account_id IS 'The default account used to pay this liability.';

-- 2. Create card_billing_months table (Type 1 Aggregation)
CREATE TABLE IF NOT EXISTS public.card_billing_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,       -- First day of the month for this cycle (e.g., 2025-03-01)
  statement_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  due_date DATE,                     -- Calculated actual due date for this cycle
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_account_id, billing_month),
  CONSTRAINT cbm_status_check CHECK (status IN ('open', 'partial', 'settled'))
);

COMMENT ON TABLE public.card_billing_months IS 'Aggregated billing cycles for credit cards.';

-- 3. Create card_billing_items table (Line items for each month)
CREATE TABLE IF NOT EXISTS public.card_billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  billing_month_id UUID NOT NULL REFERENCES public.card_billing_months(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  installment_plan_id UUID REFERENCES public.installment_plans(id) ON DELETE SET NULL,
  installment_sequence INTEGER,      -- 1 to N
  description TEXT NOT NULL,
  amount NUMERIC(18,0) NOT NULL,
  fee_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'standard',
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cbi_type_check CHECK (item_type IN ('standard', 'installment'))
);

COMMENT ON TABLE public.card_billing_items IS 'Line items within a billing cycle, linking transactions or installments to months.';

-- 4. Update installment_plans metadata
ALTER TABLE public.installment_plans
  ADD COLUMN IF NOT EXISTS conversion_fee_rate NUMERIC(8,6) DEFAULT 0;

-- 5. Enable RLS and Policies for new tables

ALTER TABLE public.card_billing_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_billing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view billing months for their households"
  ON public.card_billing_months FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage billing months for their households"
  ON public.card_billing_months FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view billing items for their households"
  ON public.card_billing_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage billing items for their households"
  ON public.card_billing_items FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 6. Trigger for updated_at on card_billing_months
CREATE TRIGGER set_updated_at_card_billing_months
  BEFORE UPDATE ON public.card_billing_months
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. RPC for manual billing amount updates (useful for server actions)
CREATE OR REPLACE FUNCTION public.increment_statement_amount(month_id UUID, inc NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.card_billing_months
  SET statement_amount = statement_amount + inc,
      updated_at = now()
  WHERE id = month_id;
END;
$$;

-- 8. Automated Trigger for Type 1 Transactions (Standard Card Purchases)
-- When a transaction is posted to a credit card account, auto-assign to a billing month.
CREATE OR REPLACE FUNCTION public.handle_credit_card_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_is_credit_card BOOLEAN;
  v_statement_day INTEGER;
  v_billing_month DATE;
  v_billing_month_id UUID;
BEGIN
  -- 1. Check if the account is a credit card
  SELECT household_id, (type = 'credit_card')
  INTO v_household_id, v_is_credit_card
  FROM public.accounts WHERE id = NEW.account_id;

  IF NOT v_is_credit_card OR v_is_credit_card IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Only handle expenses/income (Type 1 standard items)
  -- Transfers are handled during settlement (FIFO)
  IF NEW.type NOT IN ('expense', 'income') THEN
    RETURN NEW;
  END IF;

  -- 3. Get statement day
  SELECT statement_day INTO v_statement_day
  FROM public.credit_card_settings WHERE account_id = NEW.account_id;
  
  v_statement_day := COALESCE(v_statement_day, 25);

  -- 4. Calculate billing month
  -- If transaction day > statement_day, it falls into next month's cycle
  IF EXTRACT(DAY FROM NEW.transaction_date) > v_statement_day THEN
    v_billing_month := (NEW.transaction_date + INTERVAL '1 month')::DATE;
  ELSE
    v_billing_month := NEW.transaction_date;
  END IF;
  
  v_billing_month := DATE_TRUNC('month', v_billing_month)::DATE;

  -- 5. Upsert billing month
  INSERT INTO public.card_billing_months (household_id, card_account_id, billing_month)
  VALUES (v_household_id, NEW.account_id, v_billing_month)
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;
  
  SELECT id INTO v_billing_month_id 
  FROM public.card_billing_months 
  WHERE card_account_id = NEW.account_id AND billing_month = v_billing_month;

  -- 6. Insert billing item (Type 1)
  INSERT INTO public.card_billing_items (
    household_id, card_account_id, billing_month_id, transaction_id, 
    description, amount, item_type
  )
  VALUES (
    v_household_id, NEW.account_id, v_billing_month_id, NEW.id,
    NEW.description, NEW.amount, 'standard'
  );

  -- 7. Update total statement_amount
  UPDATE public.card_billing_months
  SET statement_amount = statement_amount + (CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE -NEW.amount END)
  WHERE id = v_billing_month_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_credit_card_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_credit_card_transaction();
-- ============================================================================
-- 00016_fix_billing_trigger.sql
-- Fix null description in card_billing_items + improved trigger logic
-- ============================================================================

-- 1. Allow description to have a default empty string to prevent NOT NULL violations
--    when a transaction has no description text
ALTER TABLE public.card_billing_items
  ALTER COLUMN description SET DEFAULT '';

-- 3. Re-create the credit card transaction trigger with a COALESCE fix
--    so NULL descriptions from transactions don't violate the constraint.
CREATE OR REPLACE FUNCTION public.handle_credit_card_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_is_credit_card BOOLEAN;
  v_statement_day INTEGER;
  v_billing_month DATE;
  v_billing_month_id UUID;
  v_description TEXT;
BEGIN
  -- 1. Check if the account is a credit card
  SELECT household_id, (type = 'credit_card')
  INTO v_household_id, v_is_credit_card
  FROM public.accounts WHERE id = NEW.account_id;

  IF NOT v_is_credit_card OR v_is_credit_card IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Only handle expenses (card spending); skip income and transfers
  IF NEW.type NOT IN ('expense', 'income') THEN
    RETURN NEW;
  END IF;

  -- 3. Get statement day from settings (default 25 if not configured)
  SELECT statement_day INTO v_statement_day
  FROM public.credit_card_settings WHERE account_id = NEW.account_id;
  
  v_statement_day := COALESCE(v_statement_day, 25);

  -- 4. Calculate billing month based on statement day
  IF EXTRACT(DAY FROM NEW.transaction_date) > v_statement_day THEN
    v_billing_month := (NEW.transaction_date + INTERVAL '1 month')::DATE;
  ELSE
    v_billing_month := NEW.transaction_date;
  END IF;
  
  v_billing_month := DATE_TRUNC('month', v_billing_month)::DATE;

  -- 5. Upsert billing month record
  INSERT INTO public.card_billing_months (household_id, card_account_id, billing_month)
  VALUES (v_household_id, NEW.account_id, v_billing_month)
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;
  
  SELECT id INTO v_billing_month_id 
  FROM public.card_billing_months 
  WHERE card_account_id = NEW.account_id AND billing_month = v_billing_month;

  -- 6. Build description with fallback for NULL / empty descriptions
  v_description := COALESCE(
    NULLIF(TRIM(NEW.description), ''),
    'Giao dịch thẻ ' || TO_CHAR(NEW.transaction_date, 'DD/MM/YYYY')
  );

  -- 7. Insert billing item (Type 1 - standard)
  INSERT INTO public.card_billing_items (
    household_id, card_account_id, billing_month_id, transaction_id, 
    description, amount, item_type
  )
  VALUES (
    v_household_id, NEW.account_id, v_billing_month_id, NEW.id,
    v_description, NEW.amount, 'standard'
  );

  -- 8. Update statement_amount for this billing cycle
  UPDATE public.card_billing_months
  SET 
    statement_amount = statement_amount + (
      CASE 
        WHEN NEW.type = 'expense' THEN NEW.amount 
        ELSE -NEW.amount 
      END
    ),
    updated_at = now()
  WHERE id = v_billing_month_id;

  RETURN NEW;
END;
$$;
-- ============================================================================
-- 00017_installment_conversion.sql
-- Add tracking for billing items converted to installment plans
-- ============================================================================

-- 1. Mark a billing item as "converted to installment" so it no longer
--    counts toward the monthly total in its original form.
ALTER TABLE public.card_billing_items
  ADD COLUMN IF NOT EXISTS is_converted_to_installment BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.card_billing_items.is_converted_to_installment
  IS 'True when this standard item has been converted to an installment plan. The original amount is replaced by N monthly installment records.';
-- ============================================================================
-- 00018_fix_dashboard_cc_expense.sql
-- Fix monthly_expense calculation to handle credit card accounts correctly.
--
-- Problem:
--   The original rpc_dashboard_core sums ALL expense transactions, including
--   those on credit card accounts. For credit cards:
--   - The full transaction amount is stored in `transactions` when spending
--   - If converted to installment, only the monthly installment should count
--   - Even for non-converted items, the expense "belongs" to the billing cycle
--     month (governed by statement_day), not the transaction date
--
-- Solution:
--   1. Exclude expense transactions on credit_card accounts from the standard
--      expense sum (they are tracked in card_billing_items instead).
--   2. Add the sum of card_billing_items for the current billing month that
--      falls within the calendar month being reported.
--      - Converts items count only their monthly installment amount
--      - Standard items count their full amount
--      - Converted-to-installment items (is_converted_to_installment=true) 
--        are excluded (the installment records replace them)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_dashboard_core(
  p_household_id uuid DEFAULT NULL,
  p_as_of_date   date DEFAULT current_date
)
RETURNS TABLE (
  household_id        uuid,
  as_of_date          date,
  month_start         date,
  month_end           date,
  total_assets        numeric(18,0),
  total_liabilities   numeric(18,0),
  net_worth           numeric(18,0),
  monthly_income      numeric(18,0),
  monthly_expense     numeric(18,0),
  monthly_savings     numeric(18,0),
  savings_rate        numeric(10,6),
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id           uuid;
  v_month_start            date;
  v_month_end              date;
  v_account_assets         numeric(18,0) := 0;
  v_non_account_assets     numeric(18,0) := 0;
  v_total_assets           numeric(18,0) := 0;
  v_total_liabilities      numeric(18,0) := 0;
  v_monthly_income         numeric(18,0) := 0;
  v_monthly_expense        numeric(18,0) := 0;
  v_cc_expense             numeric(18,0) := 0;
  v_non_cc_expense         numeric(18,0) := 0;
  v_monthly_savings        numeric(18,0) := 0;
  v_savings_rate           numeric(10,6);
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end   := (v_month_start + interval '1 month - 1 day')::date;

  -- ── Net worth via accounts ──────────────────────────────────────────────────
  SELECT COALESCE(SUM(
    CASE
      WHEN a.type = 'income' THEN a.amount
      WHEN a.type = 'expense' THEN -a.amount
      ELSE 0
    END
  ), 0)::numeric(18,0)
  INTO v_account_assets
  FROM (
    SELECT ac.id,
           ac.opening_balance AS amount,
           'income'::text     AS type,
           ac.opening_balance_date AS transaction_date
    FROM public.accounts ac
    WHERE ac.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false

    UNION ALL

    SELECT t.account_id, t.amount, t.type, t.transaction_date
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false
      AND t.transaction_date <= p_as_of_date
  ) a;

  -- ── Non-account (physical) assets ─────────────────────────────────────────
  WITH latest_q AS (
    SELECT DISTINCT ON (aqh.asset_id)
      aqh.asset_id, aqh.quantity
    FROM public.asset_quantity_history aqh
    WHERE aqh.household_id = v_household_id
      AND aqh.as_of_date <= p_as_of_date
    ORDER BY aqh.asset_id, aqh.as_of_date DESC
  ),
  latest_p AS (
    SELECT DISTINCT ON (aph.asset_id)
      aph.asset_id, aph.unit_price
    FROM public.asset_price_history aph
    WHERE aph.household_id = v_household_id
      AND aph.as_of_date <= p_as_of_date
    ORDER BY aph.asset_id, aph.as_of_date DESC
  )
  SELECT COALESCE(SUM(
    CASE WHEN a.include_in_net_worth = false THEN 0
         ELSE COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
    END
  ), 0)::numeric(18,0)
  INTO v_non_account_assets
  FROM public.assets a
  LEFT JOIN latest_q lq ON lq.asset_id = a.id
  LEFT JOIN latest_p lp ON lp.asset_id = a.id
  WHERE a.household_id = v_household_id
    AND a.is_archived = false;

  v_total_assets := COALESCE(v_account_assets, 0) + COALESCE(v_non_account_assets, 0);

  -- ── Liabilities ────────────────────────────────────────────────────────────
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- ── Monthly income ─────────────────────────────────────────────────────────
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- ── Monthly expense: NON-credit-card accounts ──────────────────────────────
  -- Standard accounts: sum expense transactions as before
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'          -- exclude CC accounts
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- ── Monthly expense: Credit card accounts via billing items ────────────────
  -- For credit cards, use card_billing_items for the billing months that
  -- overlap the current calendar month. This ensures:
  --   • Converted-to-installment items are excluded (replaced by installment rows)
  --   • Installment items contribute only their monthly_amount
  --   • Standard items contribute their full amount
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    -- The billing month falls within the current calendar month
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    -- Exclude items whose original transaction was converted to installments
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- ── Liquid assets ──────────────────────────────────────────────────────────
  WITH account_balances AS (
    SELECT
      ac.id,
      ac.opening_balance
      + COALESCE(SUM(
          CASE
            WHEN t.type = 'income'  THEN  t.amount
            WHEN t.type = 'expense' THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON  t.account_id = ac.id
      AND t.transaction_date <= p_as_of_date
      AND t.household_id = v_household_id
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
    GROUP BY ac.id, ac.opening_balance
  ),
  liquid_assets AS (
    SELECT COALESCE(SUM(GREATEST(ab.balance, 0)), 0)::numeric(18,0) AS liquid_value
    FROM account_balances ab

    UNION ALL

    SELECT COALESCE(SUM(
      CASE
        WHEN a.is_liquid = true AND a.is_archived = false
          THEN COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
        ELSE 0
      END
    ), 0)::numeric(18,0)
    FROM public.assets a
    LEFT JOIN LATERAL (
      SELECT aqh.quantity
      FROM public.asset_quantity_history aqh
      WHERE aqh.asset_id = a.id
        AND aqh.household_id = v_household_id
        AND aqh.as_of_date <= p_as_of_date
      ORDER BY aqh.as_of_date DESC
      LIMIT 1
    ) lq ON true
    LEFT JOIN LATERAL (
      SELECT aph.unit_price
      FROM public.asset_price_history aph
      WHERE aph.asset_id = a.id
        AND aph.household_id = v_household_id
        AND aph.as_of_date <= p_as_of_date
      ORDER BY aph.as_of_date DESC
      LIMIT 1
    ) lp ON true
    WHERE a.household_id = v_household_id
  )
  SELECT COALESCE(SUM(liquid_value), 0)::numeric(18,0)
  INTO v_liquid_assets
  FROM liquid_assets;

  -- ── Emergency fund months ──────────────────────────────────────────────────
  WITH essential_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- ── Debt service ratio ─────────────────────────────────────────────────────
  SELECT COALESCE(SUM(lp.actual_amount), 0)::numeric(18,0)
  INTO v_debt_service
  FROM public.liability_payments lp
  WHERE lp.household_id = v_household_id
    AND lp.payment_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  ELSE
    v_debt_service_ratio := NULL;
  END IF;

  -- ── Return ─────────────────────────────────────────────────────────────────
  RETURN QUERY
  SELECT
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_emergency_months,
    v_debt_service_ratio;
END;
$$;
-- ============================================================================
-- 00019_sync_installment_progress.sql  
-- One-time sync: update installment_plans.paid_installments and 
-- remaining_amount based on currently paid card_billing_items.
-- Run once after deploying the settle fix.
-- ============================================================================

DO $$
DECLARE
  plan_rec RECORD;
  paid_count   INT;
  paid_total   NUMERIC;
BEGIN
  FOR plan_rec IN
    SELECT id, total_amount, num_installments
    FROM public.installment_plans
    WHERE status = 'active'
  LOOP
    -- Count paid installment items for this plan
    SELECT
      COUNT(*)::int,
      COALESCE(SUM(amount + fee_amount), 0)
    INTO paid_count, paid_total
    FROM public.card_billing_items
    WHERE installment_plan_id = plan_rec.id
      AND item_type = 'installment'
      AND is_paid = true;

    UPDATE public.installment_plans
    SET
      paid_installments = paid_count,
      remaining_amount  = GREATEST(0, plan_rec.total_amount - paid_total),
      status = CASE
                 WHEN paid_count >= plan_rec.num_installments THEN 'completed'
                 ELSE 'active'
               END
    WHERE id = plan_rec.id;

  END LOOP;
END;
$$;
-- ============================================================================
-- 00021_fix_installment_month_timezone.sql
-- Fix installment billing months shifted to previous month due to timezone
-- conversion in server action date formatting.
-- ============================================================================

DO $$
BEGIN
  -- 1) Collect malformed billing months (day != 1) that contain installment items.
  CREATE TEMP TABLE tmp_bad_installment_months ON COMMIT DROP AS
  SELECT
    cbm.id AS old_month_id,
    cbm.household_id,
    cbm.card_account_id,
    cbm.billing_month AS old_billing_month,
    DATE_TRUNC('month', (cbm.billing_month + INTERVAL '1 day'))::date AS fixed_billing_month
  FROM public.card_billing_months cbm
  WHERE EXTRACT(DAY FROM cbm.billing_month) <> 1
    AND EXISTS (
      SELECT 1
      FROM public.card_billing_items cbi
      WHERE cbi.billing_month_id = cbm.id
        AND cbi.item_type = 'installment'
    );

  -- 2) Ensure target (fixed) months exist.
  INSERT INTO public.card_billing_months (
    household_id,
    card_account_id,
    billing_month,
    statement_amount,
    paid_amount,
    due_date,
    status
  )
  SELECT
    t.household_id,
    t.card_account_id,
    t.fixed_billing_month,
    0,
    0,
    NULL,
    'open'
  FROM tmp_bad_installment_months t
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;

  -- 3) Move installment items to corrected billing months.
  UPDATE public.card_billing_items cbi
  SET billing_month_id = target.id
  FROM tmp_bad_installment_months t
  JOIN public.card_billing_months target
    ON target.card_account_id = t.card_account_id
   AND target.billing_month = t.fixed_billing_month
  WHERE cbi.billing_month_id = t.old_month_id
    AND cbi.item_type = 'installment';

  -- 4) Delete empty malformed months after item moves.
  DELETE FROM public.card_billing_months cbm
  USING tmp_bad_installment_months t
  WHERE cbm.id = t.old_month_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.card_billing_items cbi
      WHERE cbi.billing_month_id = cbm.id
    );

  -- 5) Align installment_plans.start_date to the first installment billing month.
  UPDATE public.installment_plans ip
  SET start_date = plan_months.first_billing_month
  FROM (
    SELECT
      cbi.installment_plan_id AS plan_id,
      MIN(cbm.billing_month) AS first_billing_month
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    WHERE cbi.item_type = 'installment'
      AND cbi.installment_plan_id IS NOT NULL
    GROUP BY cbi.installment_plan_id
  ) AS plan_months
  WHERE ip.id = plan_months.plan_id
    AND ip.start_date IS DISTINCT FROM plan_months.first_billing_month;

  -- 6) Recalculate statement_amount from billing items for all months.
  --    Converted standard items are excluded from statement totals.
  WITH recalculated AS (
    SELECT
      cbm.id AS month_id,
      COALESCE(
        SUM(
          CASE
            WHEN cbi.id IS NULL THEN 0
            WHEN cbi.is_converted_to_installment THEN 0
            ELSE COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0)
          END
        ),
        0
      )::NUMERIC(18,0) AS expected_statement_amount
    FROM public.card_billing_months cbm
    LEFT JOIN public.card_billing_items cbi ON cbi.billing_month_id = cbm.id
    GROUP BY cbm.id
  )
  UPDATE public.card_billing_months cbm
  SET
    statement_amount = recalculated.expected_statement_amount,
    paid_amount = LEAST(cbm.paid_amount, recalculated.expected_statement_amount),
    status = CASE
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) >= recalculated.expected_statement_amount
           AND recalculated.expected_statement_amount > 0 THEN 'settled'
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) > 0 THEN 'partial'
      ELSE 'open'
    END,
    updated_at = now()
  FROM recalculated
  WHERE cbm.id = recalculated.month_id;
END
$$;
-- ============================================================================
-- 00022_financial_jars.sql
-- Financial jars: schema, RLS, monthly overview, and one-time seed migration
-- ============================================================================

-- 1) Core tables ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jar_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_definitions_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT jar_definitions_unique_household_slug UNIQUE (household_id, slug)
);

CREATE TABLE IF NOT EXISTS public.jar_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  target_mode TEXT NOT NULL DEFAULT 'fixed',
  target_value NUMERIC(18,0) NOT NULL DEFAULT 0,
  computed_target_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_monthly_targets_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_monthly_targets_mode_check CHECK (target_mode IN ('fixed', 'percent')),
  CONSTRAINT jar_monthly_targets_nonnegative_check CHECK (target_value >= 0 AND computed_target_amount >= 0),
  CONSTRAINT jar_monthly_targets_unique UNIQUE (jar_id, month)
);

CREATE TABLE IF NOT EXISTS public.jar_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  month DATE NOT NULL,
  entry_type TEXT NOT NULL,
  amount NUMERIC(18,0) NOT NULL,
  note TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual',
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.monthly_budgets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_ledger_entries_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_ledger_entries_type_check CHECK (entry_type IN ('allocate', 'withdraw', 'adjust')),
  CONSTRAINT jar_ledger_entries_source_check CHECK (source_kind IN ('manual', 'migration_seed', 'system')),
  CONSTRAINT jar_ledger_entries_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_jar_definitions_household_active
  ON public.jar_definitions (household_id, is_archived, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jar_targets_household_month
  ON public.jar_monthly_targets (household_id, month);

CREATE INDEX IF NOT EXISTS idx_jar_ledger_household_month
  ON public.jar_ledger_entries (household_id, month, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_jar_ledger_jar_month
  ON public.jar_ledger_entries (jar_id, month, created_at DESC);

-- 2) updated_at trigger ----------------------------------------------------------
DROP TRIGGER IF EXISTS trg_jar_definitions_set_updated_at ON public.jar_definitions;
CREATE TRIGGER trg_jar_definitions_set_updated_at
  BEFORE UPDATE ON public.jar_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jar_monthly_targets_set_updated_at ON public.jar_monthly_targets;
CREATE TRIGGER trg_jar_monthly_targets_set_updated_at
  BEFORE UPDATE ON public.jar_monthly_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS -------------------------------------------------------------------------
ALTER TABLE public.jar_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view jar definitions for their households" ON public.jar_definitions;
CREATE POLICY "Users can view jar definitions for their households"
  ON public.jar_definitions FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar definitions for their households" ON public.jar_definitions;
CREATE POLICY "Users can manage jar definitions for their households"
  ON public.jar_definitions FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view jar targets for their households" ON public.jar_monthly_targets;
CREATE POLICY "Users can view jar targets for their households"
  ON public.jar_monthly_targets FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar targets for their households" ON public.jar_monthly_targets;
CREATE POLICY "Users can manage jar targets for their households"
  ON public.jar_monthly_targets FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view jar ledger for their households" ON public.jar_ledger_entries;
CREATE POLICY "Users can view jar ledger for their households"
  ON public.jar_ledger_entries FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar ledger for their households" ON public.jar_ledger_entries;
CREATE POLICY "Users can manage jar ledger for their households"
  ON public.jar_ledger_entries FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 4) Overview view ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.jar_monthly_overview WITH (security_invoker = true) AS
WITH ledger AS (
  SELECT
    e.household_id,
    e.jar_id,
    e.month,
    COALESCE(SUM(CASE WHEN e.entry_type = 'allocate' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS allocated_amount,
    COALESCE(SUM(CASE WHEN e.entry_type = 'withdraw' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS withdrawn_amount,
    COALESCE(SUM(
      CASE
        WHEN e.entry_type = 'withdraw' THEN -e.amount
        ELSE e.amount
      END
    ), 0)::NUMERIC(18,0) AS net_amount
  FROM public.jar_ledger_entries e
  GROUP BY e.household_id, e.jar_id, e.month
),
targets AS (
  SELECT
    t.household_id,
    t.jar_id,
    t.month,
    COALESCE(t.computed_target_amount, 0)::NUMERIC(18,0) AS target_amount
  FROM public.jar_monthly_targets t
)
SELECT
  d.household_id,
  d.id AS jar_id,
  d.name,
  d.slug,
  d.color,
  d.icon,
  COALESCE(t.month, l.month, date_trunc('month', now())::date) AS month,
  COALESCE(t.target_amount, 0)::NUMERIC(18,0) AS target_amount,
  COALESCE(l.allocated_amount, 0)::NUMERIC(18,0) AS allocated_amount,
  COALESCE(l.withdrawn_amount, 0)::NUMERIC(18,0) AS withdrawn_amount,
  COALESCE(l.net_amount, 0)::NUMERIC(18,0) AS net_amount,
  CASE
    WHEN COALESCE(t.target_amount, 0) <= 0 THEN 0::NUMERIC(8,4)
    ELSE LEAST(1::NUMERIC, GREATEST(0::NUMERIC, COALESCE(l.net_amount, 0) / t.target_amount))::NUMERIC(8,4)
  END AS coverage_ratio
FROM public.jar_definitions d
LEFT JOIN targets t ON t.jar_id = d.id
LEFT JOIN ledger l ON l.jar_id = d.id AND l.month = t.month
WHERE d.is_archived = false;

-- 5) Seed default 6 jars + seed targets/ledger from existing data ----------------
DO $$
DECLARE
  v_month DATE := date_trunc('month', now())::date;
BEGIN
  -- Ensure default jars for every household
  INSERT INTO public.jar_definitions (
    household_id, name, slug, color, icon, sort_order, is_system_default, is_archived
  )
  SELECT h.id, j.name, j.slug, j.color, j.icon, j.sort_order, true, false
  FROM public.households h
  CROSS JOIN (
    VALUES
      ('Nhu cầu thiết yếu', 'necessities', '#2563EB', 'house', 10),
      ('Giáo dục', 'education', '#0EA5E9', 'book-open', 20),
      ('Tự do tài chính', 'financial-freedom', '#16A34A', 'trending-up', 30),
      ('Tiết kiệm dài hạn', 'long-term-savings', '#7C3AED', 'piggy-bank', 40),
      ('Hưởng thụ', 'play', '#F59E0B', 'party-popper', 50),
      ('Cho đi', 'give', '#DC2626', 'heart-handshake', 60)
  ) AS j(name, slug, color, icon, sort_order)
  ON CONFLICT DO NOTHING;

  -- Seed current month targets from monthly_budgets (idempotent by jar_id+month)
  WITH budget_rollup AS (
    SELECT
      mb.household_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END AS target_slug,
      SUM(mb.planned_amount)::NUMERIC(18,0) AS target_amount
    FROM public.monthly_budgets mb
    JOIN public.categories c ON c.id = mb.category_id
    WHERE mb.month = v_month
    GROUP BY mb.household_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END
  )
  INSERT INTO public.jar_monthly_targets (
    household_id, jar_id, month, target_mode, target_value, computed_target_amount
  )
  SELECT
    r.household_id,
    jd.id,
    v_month,
    'fixed',
    r.target_amount,
    r.target_amount
  FROM budget_rollup r
  JOIN public.jar_definitions jd
    ON jd.household_id = r.household_id
   AND jd.slug = r.target_slug
  ON CONFLICT (jar_id, month) DO NOTHING;

  -- Seed current balances from active goals via adjust entries
  WITH goal_bal AS (
    SELECT
      g.household_id,
      CASE WHEN g.goal_type = 'emergency_fund' THEN 'long-term-savings' ELSE 'financial-freedom' END AS target_slug,
      SUM(
        COALESCE(
          CASE
            WHEN gc.flow_type = 'outflow' THEN -gc.amount
            ELSE gc.amount
          END,
          0
        )
      )::NUMERIC(18,0) AS funded
    FROM public.goals g
    LEFT JOIN public.goal_contributions gc ON gc.goal_id = g.id
    WHERE g.status = 'active'
    GROUP BY g.household_id,
      CASE WHEN g.goal_type = 'emergency_fund' THEN 'long-term-savings' ELSE 'financial-freedom' END
  )
  INSERT INTO public.jar_ledger_entries (
    household_id, jar_id, entry_date, month, entry_type, amount, note, source_kind
  )
  SELECT
    gb.household_id,
    jd.id,
    v_month,
    v_month,
    'adjust',
    gb.funded,
    'Khởi tạo từ mục tiêu đang hoạt động',
    'migration_seed'
  FROM goal_bal gb
  JOIN public.jar_definitions jd
    ON jd.household_id = gb.household_id
   AND jd.slug = gb.target_slug
  WHERE gb.funded > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.jar_ledger_entries e
      WHERE e.household_id = gb.household_id
        AND e.jar_id = jd.id
        AND e.month = v_month
        AND e.entry_type = 'adjust'
        AND e.source_kind = 'migration_seed'
        AND e.note = 'Khởi tạo từ mục tiêu đang hoạt động'
    );
END
$$;

COMMENT ON TABLE public.jar_definitions IS 'Household-defined virtual financial jars (envelope buckets).';
COMMENT ON TABLE public.jar_monthly_targets IS 'Monthly target plans for each jar, either fixed VND or percent-based.';
COMMENT ON TABLE public.jar_ledger_entries IS 'Virtual ledger events for jar allocations/withdrawals/adjustments.';
COMMENT ON VIEW public.jar_monthly_overview IS 'Per-jar monthly summary with target, net allocated balance, and coverage ratio.';
-- ============================================================================
-- 00023_translate_default_jars_vi.sql
-- Translate default system jar names to Vietnamese for existing households.
-- ============================================================================

UPDATE public.jar_definitions
SET name = CASE slug
  WHEN 'necessities' THEN 'Nhu cầu thiết yếu'
  WHEN 'education' THEN 'Giáo dục'
  WHEN 'financial-freedom' THEN 'Tự do tài chính'
  WHEN 'long-term-savings' THEN 'Tiết kiệm dài hạn'
  WHEN 'play' THEN 'Hưởng thụ'
  WHEN 'give' THEN 'Cho đi'
  ELSE name
END,
updated_at = now()
WHERE is_system_default = true
  AND slug IN (
    'necessities',
    'education',
    'financial-freedom',
    'long-term-savings',
    'play',
    'give'
  );

-- Normalize legacy migration note to Vietnamese for consistency
UPDATE public.jar_ledger_entries
SET note = 'Khởi tạo từ mục tiêu đang hoạt động'
WHERE source_kind = 'migration_seed'
  AND note = 'Seeded from active goals';
-- ============================================================================
-- 00024_sync_card_billing_items_with_transaction_edits.sql
-- Backfill for credit-card transaction edits:
--   - Sync standard card_billing_items.amount/description/account/month with
--     source transactions.
--   - Recompute statement_amount / paid_amount / status in card_billing_months.
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  v_statement_day INTEGER;
  v_effective_month DATE;
  v_target_month_id UUID;
BEGIN
  FOR rec IN
    SELECT
      cbi.id AS billing_item_id,
      cbi.household_id,
      cbi.card_account_id AS old_card_account_id,
      cbi.billing_month_id AS old_billing_month_id,
      cbi.item_type,
      cbi.is_converted_to_installment,
      cbi.amount AS old_amount,
      cbi.description AS old_description,
      tx.id AS transaction_id,
      tx.account_id AS tx_account_id,
      tx.amount AS tx_amount,
      tx.type AS tx_type,
      tx.transaction_date AS tx_date,
      tx.description AS tx_description
    FROM public.card_billing_items cbi
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    WHERE cbi.transaction_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
  LOOP
    -- 1) Determine target billing month from transaction date + statement_day
    SELECT statement_day INTO v_statement_day
    FROM public.credit_card_settings
    WHERE account_id = rec.tx_account_id;

    v_statement_day := COALESCE(v_statement_day, 25);

    IF EXTRACT(DAY FROM rec.tx_date) > v_statement_day THEN
      v_effective_month := (rec.tx_date + INTERVAL '1 month')::DATE;
    ELSE
      v_effective_month := rec.tx_date;
    END IF;

    v_effective_month := DATE_TRUNC('month', v_effective_month)::DATE;

    INSERT INTO public.card_billing_months (
      household_id,
      card_account_id,
      billing_month
    )
    VALUES (
      rec.household_id,
      rec.tx_account_id,
      v_effective_month
    )
    ON CONFLICT (card_account_id, billing_month) DO NOTHING;

    SELECT id INTO v_target_month_id
    FROM public.card_billing_months
    WHERE card_account_id = rec.tx_account_id
      AND billing_month = v_effective_month;

    -- 2) Sync billing item with latest transaction data
    UPDATE public.card_billing_items
    SET
      card_account_id = rec.tx_account_id,
      billing_month_id = v_target_month_id,
      amount = rec.tx_amount,
      description = COALESCE(NULLIF(TRIM(rec.tx_description), ''), rec.old_description)
    WHERE id = rec.billing_item_id;
  END LOOP;

  -- 3) Recompute statement totals from current billing items
  WITH recalculated AS (
    SELECT
      cbm.id AS month_id,
      COALESCE(
        SUM(
          CASE
            WHEN cbi.id IS NULL THEN 0
            WHEN cbi.is_converted_to_installment THEN 0
            ELSE
              CASE
                WHEN cbi.transaction_id IS NOT NULL THEN
                  CASE
                    WHEN tx.type = 'income' THEN -(COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
                    ELSE (COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
                  END
                ELSE
                  (COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
              END
          END
        ),
        0
      )::NUMERIC(18,0) AS expected_statement_amount
    FROM public.card_billing_months cbm
    LEFT JOIN public.card_billing_items cbi ON cbi.billing_month_id = cbm.id
    LEFT JOIN public.transactions tx ON tx.id = cbi.transaction_id
    GROUP BY cbm.id
  )
  UPDATE public.card_billing_months cbm
  SET
    statement_amount = recalculated.expected_statement_amount,
    paid_amount = LEAST(cbm.paid_amount, recalculated.expected_statement_amount),
    status = CASE
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) >= recalculated.expected_statement_amount
           AND recalculated.expected_statement_amount > 0 THEN 'settled'
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) > 0 THEN 'partial'
      ELSE 'open'
    END,
    updated_at = now()
  FROM recalculated
  WHERE cbm.id = recalculated.month_id;
END
$$;
-- ============================================================================
-- 00025_fix_essential_spending_cc_source.sql
-- Ensure essential expense aggregation uses card_billing_items for credit cards
-- in rpc_dashboard_core, matching the cc source-of-truth introduced in 00018.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_dashboard_core(
  p_household_id uuid DEFAULT NULL,
  p_as_of_date   date DEFAULT current_date
)
RETURNS TABLE (
  household_id        uuid,
  as_of_date          date,
  month_start         date,
  month_end           date,
  total_assets        numeric(18,0),
  total_liabilities   numeric(18,0),
  net_worth           numeric(18,0),
  monthly_income      numeric(18,0),
  monthly_expense     numeric(18,0),
  monthly_savings     numeric(18,0),
  savings_rate        numeric(10,6),
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id           uuid;
  v_month_start            date;
  v_month_end              date;
  v_account_assets         numeric(18,0) := 0;
  v_non_account_assets     numeric(18,0) := 0;
  v_total_assets           numeric(18,0) := 0;
  v_total_liabilities      numeric(18,0) := 0;
  v_monthly_income         numeric(18,0) := 0;
  v_monthly_expense        numeric(18,0) := 0;
  v_cc_expense             numeric(18,0) := 0;
  v_non_cc_expense         numeric(18,0) := 0;
  v_monthly_savings        numeric(18,0) := 0;
  v_savings_rate           numeric(10,6);
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end   := (v_month_start + interval '1 month - 1 day')::date;

  -- Net worth via accounts
  SELECT COALESCE(SUM(
    CASE
      WHEN a.type = 'income' THEN a.amount
      WHEN a.type = 'expense' THEN -a.amount
      ELSE 0
    END
  ), 0)::numeric(18,0)
  INTO v_account_assets
  FROM (
    SELECT ac.id,
           ac.opening_balance AS amount,
           'income'::text     AS type,
           ac.opening_balance_date AS transaction_date
    FROM public.accounts ac
    WHERE ac.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false

    UNION ALL

    SELECT t.account_id, t.amount, t.type, t.transaction_date
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false
      AND t.transaction_date <= p_as_of_date
  ) a;

  -- Non-account (physical) assets
  WITH latest_q AS (
    SELECT DISTINCT ON (aqh.asset_id)
      aqh.asset_id, aqh.quantity
    FROM public.asset_quantity_history aqh
    WHERE aqh.household_id = v_household_id
      AND aqh.as_of_date <= p_as_of_date
    ORDER BY aqh.asset_id, aqh.as_of_date DESC
  ),
  latest_p AS (
    SELECT DISTINCT ON (aph.asset_id)
      aph.asset_id, aph.unit_price
    FROM public.asset_price_history aph
    WHERE aph.household_id = v_household_id
      AND aph.as_of_date <= p_as_of_date
    ORDER BY aph.asset_id, aph.as_of_date DESC
  )
  SELECT COALESCE(SUM(
    CASE WHEN a.include_in_net_worth = false THEN 0
         ELSE COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
    END
  ), 0)::numeric(18,0)
  INTO v_non_account_assets
  FROM public.assets a
  LEFT JOIN latest_q lq ON lq.asset_id = a.id
  LEFT JOIN latest_p lp ON lp.asset_id = a.id
  WHERE a.household_id = v_household_id
    AND a.is_archived = false;

  v_total_assets := COALESCE(v_account_assets, 0) + COALESCE(v_non_account_assets, 0);

  -- Liabilities
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- Monthly income
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: non-credit-card accounts
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: credit card accounts via billing items
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- Liquid assets
  WITH account_balances AS (
    SELECT
      ac.id,
      ac.opening_balance
      + COALESCE(SUM(
          CASE
            WHEN t.type = 'income'  THEN  t.amount
            WHEN t.type = 'expense' THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON  t.account_id = ac.id
      AND t.transaction_date <= p_as_of_date
      AND t.household_id = v_household_id
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
    GROUP BY ac.id, ac.opening_balance
  ),
  liquid_assets AS (
    SELECT COALESCE(SUM(GREATEST(ab.balance, 0)), 0)::numeric(18,0) AS liquid_value
    FROM account_balances ab

    UNION ALL

    SELECT COALESCE(SUM(
      CASE
        WHEN a.is_liquid = true AND a.is_archived = false
          THEN COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
        ELSE 0
      END
    ), 0)::numeric(18,0)
    FROM public.assets a
    LEFT JOIN LATERAL (
      SELECT aqh.quantity
      FROM public.asset_quantity_history aqh
      WHERE aqh.asset_id = a.id
        AND aqh.household_id = v_household_id
        AND aqh.as_of_date <= p_as_of_date
      ORDER BY aqh.as_of_date DESC
      LIMIT 1
    ) lq ON true
    LEFT JOIN LATERAL (
      SELECT aph.unit_price
      FROM public.asset_price_history aph
      WHERE aph.asset_id = a.id
        AND aph.household_id = v_household_id
        AND aph.as_of_date <= p_as_of_date
      ORDER BY aph.as_of_date DESC
      LIMIT 1
    ) lp ON true
    WHERE a.household_id = v_household_id
  )
  SELECT COALESCE(SUM(liquid_value), 0)::numeric(18,0)
  INTO v_liquid_assets
  FROM liquid_assets;

  -- Emergency fund months (3-month essential average)
  -- Card essential expense must come from card_billing_items, not raw card transactions.
  WITH essential_non_cc_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND ac.type <> 'credit_card'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  ),
  essential_cc_by_month AS (
    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1

    UNION ALL

    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1
  ),
  essential_by_month AS (
    SELECT month_bucket, SUM(essential_expense)::numeric(18,2) AS essential_expense
    FROM (
      SELECT month_bucket, essential_expense FROM essential_non_cc_by_month
      UNION ALL
      SELECT month_bucket, essential_expense FROM essential_cc_by_month
    ) src
    GROUP BY month_bucket
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- Debt service ratio
  SELECT COALESCE(SUM(lp.actual_amount), 0)::numeric(18,0)
  INTO v_debt_service
  FROM public.liability_payments lp
  WHERE lp.household_id = v_household_id
    AND lp.payment_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  ELSE
    v_debt_service_ratio := NULL;
  END IF;

  RETURN QUERY
  SELECT
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_emergency_months,
    v_debt_service_ratio;
END;
$$;
-- ============================================================================
-- 00026_add_savings_rate_trend_fields.sql
-- Add savings rate 6-month average and month-over-month delta to rpc_dashboard_core.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_dashboard_core(uuid, date);

CREATE OR REPLACE FUNCTION public.rpc_dashboard_core(
  p_household_id uuid DEFAULT NULL,
  p_as_of_date   date DEFAULT current_date
)
RETURNS TABLE (
  household_id        uuid,
  as_of_date          date,
  month_start         date,
  month_end           date,
  total_assets        numeric(18,0),
  total_liabilities   numeric(18,0),
  net_worth           numeric(18,0),
  monthly_income      numeric(18,0),
  monthly_expense     numeric(18,0),
  monthly_savings     numeric(18,0),
  savings_rate        numeric(10,6),
  savings_rate_6mo_avg numeric(10,6),
  savings_rate_mom_delta numeric(10,6),
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id           uuid;
  v_month_start            date;
  v_month_end              date;
  v_account_assets         numeric(18,0) := 0;
  v_non_account_assets     numeric(18,0) := 0;
  v_total_assets           numeric(18,0) := 0;
  v_total_liabilities      numeric(18,0) := 0;
  v_monthly_income         numeric(18,0) := 0;
  v_monthly_expense        numeric(18,0) := 0;
  v_cc_expense             numeric(18,0) := 0;
  v_non_cc_expense         numeric(18,0) := 0;
  v_monthly_savings        numeric(18,0) := 0;
  v_savings_rate           numeric(10,6);
  v_savings_rate_6mo_avg   numeric(10,6);
  v_prev_month_savings_rate numeric(10,6);
  v_savings_rate_mom_delta numeric(10,6);
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end   := (v_month_start + interval '1 month - 1 day')::date;

  -- Net worth via accounts
  SELECT COALESCE(SUM(
    CASE
      WHEN a.type = 'income' THEN a.amount
      WHEN a.type = 'expense' THEN -a.amount
      ELSE 0
    END
  ), 0)::numeric(18,0)
  INTO v_account_assets
  FROM (
    SELECT ac.id,
           ac.opening_balance AS amount,
           'income'::text     AS type,
           ac.opening_balance_date AS transaction_date
    FROM public.accounts ac
    WHERE ac.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false

    UNION ALL

    SELECT t.account_id, t.amount, t.type, t.transaction_date
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false
      AND t.transaction_date <= p_as_of_date
  ) a;

  -- Non-account (physical) assets
  WITH latest_q AS (
    SELECT DISTINCT ON (aqh.asset_id)
      aqh.asset_id, aqh.quantity
    FROM public.asset_quantity_history aqh
    WHERE aqh.household_id = v_household_id
      AND aqh.as_of_date <= p_as_of_date
    ORDER BY aqh.asset_id, aqh.as_of_date DESC
  ),
  latest_p AS (
    SELECT DISTINCT ON (aph.asset_id)
      aph.asset_id, aph.unit_price
    FROM public.asset_price_history aph
    WHERE aph.household_id = v_household_id
      AND aph.as_of_date <= p_as_of_date
    ORDER BY aph.asset_id, aph.as_of_date DESC
  )
  SELECT COALESCE(SUM(
    CASE WHEN a.include_in_net_worth = false THEN 0
         ELSE COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
    END
  ), 0)::numeric(18,0)
  INTO v_non_account_assets
  FROM public.assets a
  LEFT JOIN latest_q lq ON lq.asset_id = a.id
  LEFT JOIN latest_p lp ON lp.asset_id = a.id
  WHERE a.household_id = v_household_id
    AND a.is_archived = false;

  v_total_assets := COALESCE(v_account_assets, 0) + COALESCE(v_non_account_assets, 0);

  -- Liabilities
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- Monthly income
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: non-credit-card accounts
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: credit card accounts via billing items
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- Savings rate trend fields (current + prior 5 months and MoM delta)
  WITH month_offsets AS (
    SELECT generate_series(0, 5) AS month_offset
  ),
  month_windows AS (
    SELECT
      mo.month_offset,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval)::date AS month_start,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval + interval '1 month - 1 day')::date AS month_end
    FROM month_offsets mo
  ),
  income_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_income
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'income'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    GROUP BY mw.month_offset
  ),
  non_cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.accounts ac ON ac.id = t.account_id
    WHERE ac.id IS NULL OR ac.type <> 'credit_card'
    GROUP BY mw.month_offset
  ),
  cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.card_billing_months cbm
      ON cbm.household_id = v_household_id
      AND cbm.billing_month BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.card_billing_items cbi
      ON cbi.billing_month_id = cbm.id
      AND cbi.household_id = v_household_id
      AND cbi.is_converted_to_installment = false
    GROUP BY mw.month_offset
  ),
  monthly_rates AS (
    SELECT
      mw.month_offset,
      CASE
        WHEN COALESCE(ibm.monthly_income, 0) > 0 THEN
          (
            COALESCE(ibm.monthly_income, 0)
            - COALESCE(nem.monthly_expense, 0)
            - COALESCE(cem.monthly_expense, 0)
          ) / ibm.monthly_income
        ELSE NULL
      END::numeric(10,6) AS savings_rate
    FROM month_windows mw
    LEFT JOIN income_by_month ibm ON ibm.month_offset = mw.month_offset
    LEFT JOIN non_cc_expense_by_month nem ON nem.month_offset = mw.month_offset
    LEFT JOIN cc_expense_by_month cem ON cem.month_offset = mw.month_offset
  )
  SELECT
    ROUND(AVG(mr.savings_rate)::numeric, 6)::numeric(10,6),
    MAX(CASE WHEN mr.month_offset = 1 THEN mr.savings_rate END)::numeric(10,6)
  INTO v_savings_rate_6mo_avg, v_prev_month_savings_rate
  FROM monthly_rates mr;

  IF v_savings_rate IS NOT NULL AND v_prev_month_savings_rate IS NOT NULL THEN
    v_savings_rate_mom_delta := (v_savings_rate - v_prev_month_savings_rate)::numeric(10,6);
  ELSE
    v_savings_rate_mom_delta := NULL;
  END IF;

  -- Liquid assets
  WITH account_balances AS (
    SELECT
      ac.id,
      ac.opening_balance
      + COALESCE(SUM(
          CASE
            WHEN t.type = 'income'  THEN  t.amount
            WHEN t.type = 'expense' THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON  t.account_id = ac.id
      AND t.transaction_date <= p_as_of_date
      AND t.household_id = v_household_id
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
    GROUP BY ac.id, ac.opening_balance
  ),
  liquid_assets AS (
    SELECT COALESCE(SUM(GREATEST(ab.balance, 0)), 0)::numeric(18,0) AS liquid_value
    FROM account_balances ab

    UNION ALL

    SELECT COALESCE(SUM(
      CASE
        WHEN a.is_liquid = true AND a.is_archived = false
          THEN COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
        ELSE 0
      END
    ), 0)::numeric(18,0)
    FROM public.assets a
    LEFT JOIN LATERAL (
      SELECT aqh.quantity
      FROM public.asset_quantity_history aqh
      WHERE aqh.asset_id = a.id
        AND aqh.household_id = v_household_id
        AND aqh.as_of_date <= p_as_of_date
      ORDER BY aqh.as_of_date DESC
      LIMIT 1
    ) lq ON true
    LEFT JOIN LATERAL (
      SELECT aph.unit_price
      FROM public.asset_price_history aph
      WHERE aph.asset_id = a.id
        AND aph.household_id = v_household_id
        AND aph.as_of_date <= p_as_of_date
      ORDER BY aph.as_of_date DESC
      LIMIT 1
    ) lp ON true
    WHERE a.household_id = v_household_id
  )
  SELECT COALESCE(SUM(liquid_value), 0)::numeric(18,0)
  INTO v_liquid_assets
  FROM liquid_assets;

  -- Emergency fund months (3-month essential average)
  -- Card essential expense must come from card_billing_items, not raw card transactions.
  WITH essential_non_cc_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND ac.type <> 'credit_card'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  ),
  essential_cc_by_month AS (
    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1

    UNION ALL

    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1
  ),
  essential_by_month AS (
    SELECT month_bucket, SUM(essential_expense)::numeric(18,2) AS essential_expense
    FROM (
      SELECT month_bucket, essential_expense FROM essential_non_cc_by_month
      UNION ALL
      SELECT month_bucket, essential_expense FROM essential_cc_by_month
    ) src
    GROUP BY month_bucket
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- Debt service ratio
  SELECT COALESCE(SUM(lp.actual_amount), 0)::numeric(18,0)
  INTO v_debt_service
  FROM public.liability_payments lp
  WHERE lp.household_id = v_household_id
    AND lp.payment_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  ELSE
    v_debt_service_ratio := NULL;
  END IF;

  RETURN QUERY
  SELECT
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_savings_rate_6mo_avg,
    v_savings_rate_mom_delta,
    v_emergency_months,
    v_debt_service_ratio;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_dashboard_core(uuid, date) TO authenticated, anon;
-- ============================================================================
-- 00027_jar_coverage_ratio.sql
-- Add essential-expense coverage metric to jar_monthly_overview.
-- jar_coverage_ratio_percent = essential_jar_allocated / essential_expenses * 100
-- ============================================================================

CREATE OR REPLACE VIEW public.jar_monthly_overview WITH (security_invoker = true) AS
WITH ledger AS (
  SELECT
    e.household_id,
    e.jar_id,
    e.month,
    COALESCE(SUM(CASE WHEN e.entry_type = 'allocate' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS allocated_amount,
    COALESCE(SUM(CASE WHEN e.entry_type = 'withdraw' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS withdrawn_amount,
    COALESCE(SUM(
      CASE
        WHEN e.entry_type = 'withdraw' THEN -e.amount
        ELSE e.amount
      END
    ), 0)::NUMERIC(18,0) AS net_amount
  FROM public.jar_ledger_entries e
  GROUP BY e.household_id, e.jar_id, e.month
),
targets AS (
  SELECT
    t.household_id,
    t.jar_id,
    t.month,
    COALESCE(t.computed_target_amount, 0)::NUMERIC(18,0) AS target_amount
  FROM public.jar_monthly_targets t
),
base_rows AS (
  SELECT
    d.household_id,
    d.id AS jar_id,
    d.name,
    d.slug,
    d.color,
    d.icon,
    COALESCE(t.month, l.month, date_trunc('month', now())::date) AS month,
    COALESCE(t.target_amount, 0)::NUMERIC(18,0) AS target_amount,
    COALESCE(l.allocated_amount, 0)::NUMERIC(18,0) AS allocated_amount,
    COALESCE(l.withdrawn_amount, 0)::NUMERIC(18,0) AS withdrawn_amount,
    COALESCE(l.net_amount, 0)::NUMERIC(18,0) AS net_amount,
    CASE
      WHEN COALESCE(t.target_amount, 0) <= 0 THEN 0::NUMERIC(8,4)
      ELSE LEAST(1::NUMERIC, GREATEST(0::NUMERIC, COALESCE(l.net_amount, 0) / t.target_amount))::NUMERIC(8,4)
    END AS coverage_ratio
  FROM public.jar_definitions d
  LEFT JOIN targets t ON t.jar_id = d.id
  LEFT JOIN ledger l ON l.jar_id = d.id AND l.month = t.month
  WHERE d.is_archived = false
),
essential_non_cc_by_month AS (
  SELECT
    t.household_id,
    date_trunc('month', t.transaction_date)::date AS month,
    COALESCE(SUM(t.amount), 0)::NUMERIC(18,0) AS essential_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  JOIN public.categories c ON c.id = t.category_id
  WHERE t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND c.is_essential = true
  GROUP BY t.household_id, date_trunc('month', t.transaction_date)::date
),
essential_cc_standard_by_month AS (
  SELECT
    cbi.household_id,
    cbm.billing_month::date AS month,
    COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::NUMERIC(18,0) AS essential_cc_standard_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  JOIN public.transactions tx ON tx.id = cbi.transaction_id
  JOIN public.categories c ON c.id = tx.category_id
  WHERE cbi.item_type = 'standard'
    AND cbi.is_converted_to_installment = false
    AND c.is_essential = true
  GROUP BY cbi.household_id, cbm.billing_month::date
),
essential_cc_installment_by_month AS (
  SELECT
    cbi.household_id,
    cbm.billing_month::date AS month,
    COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::NUMERIC(18,0) AS essential_cc_installment_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
  JOIN public.transactions tx ON tx.id = ip.source_transaction_id
  JOIN public.categories c ON c.id = tx.category_id
  WHERE cbi.item_type = 'installment'
    AND c.is_essential = true
  GROUP BY cbi.household_id, cbm.billing_month::date
),
essential_expense_by_month AS (
  SELECT
    br.household_id,
    br.month,
    (
      COALESCE(en.essential_non_cc_expense, 0)
      + COALESCE(es.essential_cc_standard_expense, 0)
      + COALESCE(ei.essential_cc_installment_expense, 0)
    )::NUMERIC(18,0) AS essential_expenses
  FROM (
    SELECT DISTINCT household_id, month
    FROM base_rows
  ) br
  LEFT JOIN essential_non_cc_by_month en
    ON en.household_id = br.household_id
   AND en.month = br.month
  LEFT JOIN essential_cc_standard_by_month es
    ON es.household_id = br.household_id
   AND es.month = br.month
  LEFT JOIN essential_cc_installment_by_month ei
    ON ei.household_id = br.household_id
   AND ei.month = br.month
),
essential_jar_allocated_by_month AS (
  SELECT
    br.household_id,
    br.month,
    COALESCE(SUM(br.allocated_amount), 0)::NUMERIC(18,0) AS essential_jar_allocated
  FROM base_rows br
  WHERE br.slug = 'necessities'
  GROUP BY br.household_id, br.month
)
SELECT
  br.household_id,
  br.jar_id,
  br.name,
  br.slug,
  br.color,
  br.icon,
  br.month,
  br.target_amount,
  br.allocated_amount,
  br.withdrawn_amount,
  br.net_amount,
  br.coverage_ratio,
  COALESCE(ee.essential_expenses, 0)::NUMERIC(18,0) AS essential_expenses,
  CASE
    WHEN COALESCE(ee.essential_expenses, 0) <= 0 THEN NULL::NUMERIC(10,2)
    ELSE ROUND((COALESCE(eja.essential_jar_allocated, 0)::NUMERIC / ee.essential_expenses::NUMERIC) * 100, 2)::NUMERIC(10,2)
  END AS jar_coverage_ratio_percent
FROM base_rows br
LEFT JOIN essential_expense_by_month ee
  ON ee.household_id = br.household_id
 AND ee.month = br.month
LEFT JOIN essential_jar_allocated_by_month eja
  ON eja.household_id = br.household_id
 AND eja.month = br.month;
-- ============================================================================
-- 00028_jar_reconciliation_ledger.sql
-- Add monthly jar/category reconciliation ledger and deterministic recompute RPC.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jar_reconciliation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  actual_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  allocated_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  gap_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_reconciliation_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_reconciliation_nonnegative_check CHECK (actual_amount >= 0 AND allocated_amount >= 0),
  CONSTRAINT jar_reconciliation_unique UNIQUE (household_id, month, category_id, jar_id)
);

CREATE INDEX IF NOT EXISTS idx_jar_recon_household_month
  ON public.jar_reconciliation_entries (household_id, month, gap_amount DESC);

DROP TRIGGER IF EXISTS trg_jar_reconciliation_set_updated_at ON public.jar_reconciliation_entries;
CREATE TRIGGER trg_jar_reconciliation_set_updated_at
  BEFORE UPDATE ON public.jar_reconciliation_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jar_reconciliation_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view jar reconciliation for their households" ON public.jar_reconciliation_entries;
CREATE POLICY "Users can view jar reconciliation for their households"
  ON public.jar_reconciliation_entries FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar reconciliation for their households" ON public.jar_reconciliation_entries;
CREATE POLICY "Users can manage jar reconciliation for their households"
  ON public.jar_reconciliation_entries FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.rpc_jar_reconciliation_month(
  p_household_id UUID DEFAULT NULL,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  month DATE,
  category_id UUID,
  jar_id UUID,
  actual_amount NUMERIC,
  allocated_amount NUMERIC,
  gap_amount NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  DELETE FROM public.jar_reconciliation_entries
  WHERE household_id = v_household_id
    AND month = v_month;

  WITH expense_non_cc AS (
    SELECT
      t.category_id,
      SUM(t.amount)::NUMERIC(18,0) AS amount
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date >= v_month
      AND t.transaction_date < (v_month + interval '1 month')
    GROUP BY t.category_id
  ),
  expense_cc_standard AS (
    SELECT
      tx.category_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= v_month
      AND cbm.billing_month < (v_month + interval '1 month')
    GROUP BY tx.category_id
  ),
  expense_cc_installment AS (
    SELECT
      tx.category_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= v_month
      AND cbm.billing_month < (v_month + interval '1 month')
    GROUP BY tx.category_id
  ),
  category_actual AS (
    SELECT
      x.category_id,
      SUM(x.amount)::NUMERIC(18,0) AS actual_amount
    FROM (
      SELECT category_id, amount FROM expense_non_cc
      UNION ALL
      SELECT category_id, amount FROM expense_cc_standard
      UNION ALL
      SELECT category_id, amount FROM expense_cc_installment
    ) x
    GROUP BY x.category_id
  ),
  category_jar_map AS (
    SELECT
      c.id AS category_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END AS jar_slug
    FROM public.categories c
    WHERE c.household_id = v_household_id OR c.household_id IS NULL
  ),
  mapped AS (
    SELECT
      ca.category_id,
      jd.id AS jar_id,
      ca.actual_amount
    FROM category_actual ca
    JOIN category_jar_map cjm ON cjm.category_id = ca.category_id
    JOIN public.jar_definitions jd
      ON jd.household_id = v_household_id
     AND jd.slug = cjm.jar_slug
     AND jd.is_archived = false
  ),
  jar_allocated AS (
    SELECT
      e.jar_id,
      COALESCE(SUM(e.amount), 0)::NUMERIC(18,0) AS allocated_amount
    FROM public.jar_ledger_entries e
    WHERE e.household_id = v_household_id
      AND e.month = v_month
      AND e.entry_type = 'allocate'
    GROUP BY e.jar_id
  ),
  jar_actual_total AS (
    SELECT
      m.jar_id,
      COALESCE(SUM(m.actual_amount), 0)::NUMERIC(18,0) AS total_actual_amount
    FROM mapped m
    GROUP BY m.jar_id
  ),
  distributed AS (
    SELECT
      m.category_id,
      m.jar_id,
      m.actual_amount,
      CASE
        WHEN COALESCE(jat.total_actual_amount, 0) > 0 THEN
          ROUND(COALESCE(ja.allocated_amount, 0)::NUMERIC * (m.actual_amount::NUMERIC / jat.total_actual_amount::NUMERIC), 0)::NUMERIC(18,0)
        ELSE 0::NUMERIC(18,0)
      END AS allocated_amount
    FROM mapped m
    LEFT JOIN jar_allocated ja ON ja.jar_id = m.jar_id
    LEFT JOIN jar_actual_total jat ON jat.jar_id = m.jar_id
  )
  INSERT INTO public.jar_reconciliation_entries (
    household_id,
    month,
    category_id,
    jar_id,
    actual_amount,
    allocated_amount,
    gap_amount
  )
  SELECT
    v_household_id,
    v_month,
    d.category_id,
    d.jar_id,
    d.actual_amount,
    d.allocated_amount,
    (d.actual_amount - d.allocated_amount)::NUMERIC(18,0) AS gap_amount
  FROM distributed d;

  RETURN QUERY
  SELECT
    jre.id,
    jre.household_id,
    jre.month,
    jre.category_id,
    jre.jar_id,
    jre.actual_amount,
    jre.allocated_amount,
    jre.gap_amount,
    jre.created_at,
    jre.updated_at
  FROM public.jar_reconciliation_entries jre
  WHERE jre.household_id = v_household_id
    AND jre.month = v_month
  ORDER BY jre.gap_amount DESC, jre.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_jar_reconciliation_month(UUID, DATE) TO authenticated, anon;
-- ============================================================================
-- 00029_cashflow_forecast_rpc.sql
-- Deterministic 90-day cash flow forecast.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_cashflow_forecast_90d(
  p_household_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT current_date,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  forecast_date DATE,
  opening_balance NUMERIC(18,0),
  inflow NUMERIC(18,0),
  outflow NUMERIC(18,0),
  closing_balance NUMERIC(18,0),
  risk_flag TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_days INTEGER;
  v_opening_balance NUMERIC(18,0) := 0;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_start_date := COALESCE(p_start_date, current_date);
  v_days := LEAST(GREATEST(COALESCE(p_days, 90), 1), 365);
  v_end_date := (v_start_date + (v_days - 1) * INTERVAL '1 day')::DATE;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  -- Opening balance as of day before forecast start.
  WITH account_balances AS (
    SELECT
      ac.id,
      (
        ac.opening_balance
        + COALESCE(SUM(
          CASE
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = ac.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.counterparty_account_id = ac.id THEN t.amount
            ELSE 0
          END
        ), 0)
      )::NUMERIC(18,0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.transaction_date < v_start_date
      AND (t.account_id = ac.id OR t.counterparty_account_id = ac.id)
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
      AND ac.type IN ('cash', 'checking', 'savings', 'ewallet', 'brokerage')
    GROUP BY ac.id, ac.opening_balance
  )
  SELECT COALESCE(SUM(balance), 0)::NUMERIC(18,0)
  INTO v_opening_balance
  FROM account_balances;

  RETURN QUERY
  WITH RECURSIVE
  calendar AS (
    SELECT gs::DATE AS forecast_date
    FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day') gs
  ),
  recurring_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'income'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS inflow,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'expense'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN public.recurring_rules rr
      ON rr.household_id = v_household_id
      AND rr.is_active = true
      AND c.forecast_date >= rr.start_date
      AND (rr.end_date IS NULL OR c.forecast_date <= rr.end_date)
      AND (
        (
          rr.frequency = 'monthly'
          AND rr.day_of_month IS NOT NULL
          AND EXTRACT(DAY FROM c.forecast_date)::INT = rr.day_of_month
          AND (
            (
              (EXTRACT(YEAR FROM c.forecast_date)::INT * 12 + EXTRACT(MONTH FROM c.forecast_date)::INT)
              -
              (EXTRACT(YEAR FROM rr.start_date)::INT * 12 + EXTRACT(MONTH FROM rr.start_date)::INT)
            ) % GREATEST(rr.interval, 1)
          ) = 0
        )
        OR
        (
          rr.frequency = 'weekly'
          AND rr.day_of_week IS NOT NULL
          AND EXTRACT(DOW FROM c.forecast_date)::INT = rr.day_of_week
          AND (
            FLOOR((c.forecast_date - rr.start_date) / 7)::INT % GREATEST(rr.interval, 1)
          ) = 0
        )
      )
    GROUP BY c.forecast_date
  ),
  liability_base AS (
    SELECT
      l.id,
      LEAST(
        GREATEST(
          COALESCE(
            l.due_day,
            EXTRACT(DAY FROM l.next_payment_date)::INT,
            1
          ),
          1
        ),
        28
      ) AS due_day,
      GREATEST(
        COALESCE(
          ROUND(AVG(COALESCE(lp.scheduled_amount, lp.actual_amount))),
          CASE
            WHEN COALESCE(l.term_months, 0) > 0
              THEN ROUND(l.current_principal_outstanding / l.term_months)
            ELSE NULL
          END,
          0
        ),
        0
      )::NUMERIC(18,0) AS due_amount,
      l.next_payment_date
    FROM public.liabilities l
    LEFT JOIN public.liability_payments lp
      ON lp.liability_id = l.id
      AND lp.household_id = l.household_id
      AND lp.payment_date >= (v_start_date - INTERVAL '6 months')
      AND lp.payment_date < v_start_date
    WHERE l.household_id = v_household_id
      AND l.is_active = true
      AND l.current_principal_outstanding > 0
    GROUP BY l.id, l.due_day, l.next_payment_date, l.current_principal_outstanding, l.term_months
  ),
  liability_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(lb.due_amount), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN liability_base lb
      ON EXTRACT(DAY FROM c.forecast_date)::INT = lb.due_day
      AND (lb.next_payment_date IS NULL OR c.forecast_date >= lb.next_payment_date)
    GROUP BY c.forecast_date
  ),
  card_due_daily AS (
    SELECT
      cbm.due_date AS forecast_date,
      COALESCE(SUM(GREATEST(cbm.statement_amount - cbm.paid_amount, 0)), 0)::NUMERIC(18,0) AS outflow
    FROM public.card_billing_months cbm
    WHERE cbm.household_id = v_household_id
      AND cbm.due_date IS NOT NULL
      AND cbm.due_date BETWEEN v_start_date AND v_end_date
      AND cbm.status <> 'settled'
    GROUP BY cbm.due_date
  ),
  daily_flows AS (
    SELECT
      c.forecast_date,
      COALESCE(rd.inflow, 0)::NUMERIC(18,0) AS inflow,
      (
        COALESCE(rd.outflow, 0)
        + COALESCE(ld.outflow, 0)
        + COALESCE(cd.outflow, 0)
      )::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN recurring_daily rd ON rd.forecast_date = c.forecast_date
    LEFT JOIN liability_daily ld ON ld.forecast_date = c.forecast_date
    LEFT JOIN card_due_daily cd ON cd.forecast_date = c.forecast_date
  ),
  running AS (
    SELECT
      d.forecast_date,
      v_opening_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (v_opening_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM daily_flows d
    WHERE d.forecast_date = v_start_date

    UNION ALL

    SELECT
      d.forecast_date,
      r.closing_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (r.closing_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM running r
    JOIN daily_flows d ON d.forecast_date = (r.forecast_date + INTERVAL '1 day')::DATE
  )
  SELECT
    r.forecast_date,
    r.opening_balance,
    r.inflow,
    r.outflow,
    r.closing_balance,
    CASE
      WHEN r.closing_balance < 0 THEN 'negative_balance'
      ELSE NULL
    END::TEXT AS risk_flag
  FROM running r
  ORDER BY r.forecast_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER) TO authenticated, anon;
-- ============================================================================
-- 00030_cashflow_confidence_bands.sql
-- Add confidence bands to 90-day cash flow forecast and assumptions table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cashflow_forecast_assumptions (
  household_id UUID PRIMARY KEY REFERENCES public.households(id) ON DELETE CASCADE,
  lookback_days INTEGER NOT NULL DEFAULT 180,
  uncertainty_multiplier NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cashflow_forecast_assumptions_lookback_range CHECK (lookback_days BETWEEN 30 AND 365),
  CONSTRAINT cashflow_forecast_assumptions_uncertainty_range CHECK (uncertainty_multiplier >= 0.1000 AND uncertainty_multiplier <= 5.0000)
);

DROP TRIGGER IF EXISTS trg_cashflow_forecast_assumptions_set_updated_at ON public.cashflow_forecast_assumptions;
CREATE TRIGGER trg_cashflow_forecast_assumptions_set_updated_at
  BEFORE UPDATE ON public.cashflow_forecast_assumptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cashflow_forecast_assumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view cashflow forecast assumptions for their households" ON public.cashflow_forecast_assumptions;
CREATE POLICY "Users can view cashflow forecast assumptions for their households"
  ON public.cashflow_forecast_assumptions FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage cashflow forecast assumptions for their households" ON public.cashflow_forecast_assumptions;
CREATE POLICY "Users can manage cashflow forecast assumptions for their households"
  ON public.cashflow_forecast_assumptions FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

INSERT INTO public.cashflow_forecast_assumptions (household_id)
SELECT h.id
FROM public.households h
ON CONFLICT (household_id) DO NOTHING;

DROP FUNCTION IF EXISTS public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER);

CREATE OR REPLACE FUNCTION public.rpc_cashflow_forecast_90d(
  p_household_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT current_date,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  forecast_date DATE,
  opening_balance NUMERIC(18,0),
  inflow NUMERIC(18,0),
  outflow NUMERIC(18,0),
  closing_balance NUMERIC(18,0),
  p10_closing_balance NUMERIC(18,0),
  p50_closing_balance NUMERIC(18,0),
  p90_closing_balance NUMERIC(18,0),
  risk_flag TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_days INTEGER;
  v_opening_balance NUMERIC(18,0) := 0;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_start_date := COALESCE(p_start_date, current_date);
  v_days := LEAST(GREATEST(COALESCE(p_days, 90), 1), 365);
  v_end_date := (v_start_date + (v_days - 1) * INTERVAL '1 day')::DATE;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  WITH account_balances AS (
    SELECT
      ac.id,
      (
        ac.opening_balance
        + COALESCE(SUM(
          CASE
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = ac.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.counterparty_account_id = ac.id THEN t.amount
            ELSE 0
          END
        ), 0)
      )::NUMERIC(18,0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.transaction_date < v_start_date
      AND (t.account_id = ac.id OR t.counterparty_account_id = ac.id)
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
      AND ac.type IN ('cash', 'checking', 'savings', 'ewallet', 'brokerage')
    GROUP BY ac.id, ac.opening_balance
  )
  SELECT COALESCE(SUM(balance), 0)::NUMERIC(18,0)
  INTO v_opening_balance
  FROM account_balances;

  RETURN QUERY
  WITH RECURSIVE
  assumptions AS (
    SELECT
      COALESCE(cfa.lookback_days, 180) AS lookback_days,
      COALESCE(cfa.uncertainty_multiplier, 1.0000) AS uncertainty_multiplier
    FROM public.cashflow_forecast_assumptions cfa
    WHERE cfa.household_id = v_household_id

    UNION ALL

    SELECT 180, 1.0000
    WHERE NOT EXISTS (
      SELECT 1 FROM public.cashflow_forecast_assumptions cfa WHERE cfa.household_id = v_household_id
    )
  ),
  calendar AS (
    SELECT gs::DATE AS forecast_date
    FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day') gs
  ),
  recurring_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'income'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS inflow,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'expense'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN public.recurring_rules rr
      ON rr.household_id = v_household_id
      AND rr.is_active = true
      AND c.forecast_date >= rr.start_date
      AND (rr.end_date IS NULL OR c.forecast_date <= rr.end_date)
      AND (
        (
          rr.frequency = 'monthly'
          AND rr.day_of_month IS NOT NULL
          AND EXTRACT(DAY FROM c.forecast_date)::INT = rr.day_of_month
          AND (
            (
              (EXTRACT(YEAR FROM c.forecast_date)::INT * 12 + EXTRACT(MONTH FROM c.forecast_date)::INT)
              -
              (EXTRACT(YEAR FROM rr.start_date)::INT * 12 + EXTRACT(MONTH FROM rr.start_date)::INT)
            ) % GREATEST(rr.interval, 1)
          ) = 0
        )
        OR
        (
          rr.frequency = 'weekly'
          AND rr.day_of_week IS NOT NULL
          AND EXTRACT(DOW FROM c.forecast_date)::INT = rr.day_of_week
          AND (
            FLOOR((c.forecast_date - rr.start_date) / 7)::INT % GREATEST(rr.interval, 1)
          ) = 0
        )
      )
    GROUP BY c.forecast_date
  ),
  liability_base AS (
    SELECT
      l.id,
      LEAST(
        GREATEST(
          COALESCE(
            l.due_day,
            EXTRACT(DAY FROM l.next_payment_date)::INT,
            1
          ),
          1
        ),
        28
      ) AS due_day,
      GREATEST(
        COALESCE(
          ROUND(AVG(COALESCE(lp.scheduled_amount, lp.actual_amount))),
          CASE
            WHEN COALESCE(l.term_months, 0) > 0
              THEN ROUND(l.current_principal_outstanding / l.term_months)
            ELSE NULL
          END,
          0
        ),
        0
      )::NUMERIC(18,0) AS due_amount,
      l.next_payment_date
    FROM public.liabilities l
    LEFT JOIN public.liability_payments lp
      ON lp.liability_id = l.id
      AND lp.household_id = l.household_id
      AND lp.payment_date >= (v_start_date - INTERVAL '6 months')
      AND lp.payment_date < v_start_date
    WHERE l.household_id = v_household_id
      AND l.is_active = true
      AND l.current_principal_outstanding > 0
    GROUP BY l.id, l.due_day, l.next_payment_date, l.current_principal_outstanding, l.term_months
  ),
  liability_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(lb.due_amount), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN liability_base lb
      ON EXTRACT(DAY FROM c.forecast_date)::INT = lb.due_day
      AND (lb.next_payment_date IS NULL OR c.forecast_date >= lb.next_payment_date)
    GROUP BY c.forecast_date
  ),
  card_due_daily AS (
    SELECT
      cbm.due_date AS forecast_date,
      COALESCE(SUM(GREATEST(cbm.statement_amount - cbm.paid_amount, 0)), 0)::NUMERIC(18,0) AS outflow
    FROM public.card_billing_months cbm
    WHERE cbm.household_id = v_household_id
      AND cbm.due_date IS NOT NULL
      AND cbm.due_date BETWEEN v_start_date AND v_end_date
      AND cbm.status <> 'settled'
    GROUP BY cbm.due_date
  ),
  daily_flows AS (
    SELECT
      c.forecast_date,
      COALESCE(rd.inflow, 0)::NUMERIC(18,0) AS inflow,
      (
        COALESCE(rd.outflow, 0)
        + COALESCE(ld.outflow, 0)
        + COALESCE(cd.outflow, 0)
      )::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN recurring_daily rd ON rd.forecast_date = c.forecast_date
    LEFT JOIN liability_daily ld ON ld.forecast_date = c.forecast_date
    LEFT JOIN card_due_daily cd ON cd.forecast_date = c.forecast_date
  ),
  historical_net AS (
    SELECT
      dt.day_date,
      COALESCE(SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS net_flow
    FROM (
      SELECT gs::DATE AS day_date
      FROM assumptions a,
      LATERAL generate_series(
        v_start_date - (a.lookback_days * INTERVAL '1 day'),
        v_start_date - INTERVAL '1 day',
        INTERVAL '1 day'
      ) gs
    ) dt
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.transaction_date = dt.day_date
    GROUP BY dt.day_date
  ),
  historical_stats AS (
    SELECT
      COALESCE(STDDEV_SAMP(net_flow), 0)::NUMERIC AS daily_net_stddev,
      (SELECT uncertainty_multiplier FROM assumptions LIMIT 1)::NUMERIC AS uncertainty_multiplier
    FROM historical_net
  ),
  running AS (
    SELECT
      d.forecast_date,
      1::INT AS day_index,
      v_opening_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (v_opening_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM daily_flows d
    WHERE d.forecast_date = v_start_date

    UNION ALL

    SELECT
      d.forecast_date,
      r.day_index + 1,
      r.closing_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (r.closing_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM running r
    JOIN daily_flows d ON d.forecast_date = (r.forecast_date + INTERVAL '1 day')::DATE
  )
  SELECT
    r.forecast_date,
    r.opening_balance,
    r.inflow,
    r.outflow,
    r.closing_balance,
    ROUND(
      r.closing_balance
      - (1.28155 * hs.daily_net_stddev * SQRT(r.day_index::NUMERIC) * hs.uncertainty_multiplier),
      0
    )::NUMERIC(18,0) AS p10_closing_balance,
    ROUND(r.closing_balance, 0)::NUMERIC(18,0) AS p50_closing_balance,
    ROUND(
      r.closing_balance
      + (1.28155 * hs.daily_net_stddev * SQRT(r.day_index::NUMERIC) * hs.uncertainty_multiplier),
      0
    )::NUMERIC(18,0) AS p90_closing_balance,
    CASE
      WHEN r.closing_balance < 0 THEN 'negative_balance'
      ELSE NULL
    END::TEXT AS risk_flag
  FROM running r
  CROSS JOIN historical_stats hs
  ORDER BY r.forecast_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER) TO authenticated, anon;
-- ============================================================================
-- 00031_tdsr_metric.sql
-- Add total debt service ratio (TDSR) to rpc_dashboard_core.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_dashboard_core(uuid, date);

CREATE OR REPLACE FUNCTION public.rpc_dashboard_core(
  p_household_id uuid DEFAULT NULL,
  p_as_of_date   date DEFAULT current_date
)
RETURNS TABLE (
  household_id        uuid,
  as_of_date          date,
  month_start         date,
  month_end           date,
  total_assets        numeric(18,0),
  total_liabilities   numeric(18,0),
  net_worth           numeric(18,0),
  monthly_income      numeric(18,0),
  monthly_expense     numeric(18,0),
  monthly_savings     numeric(18,0),
  savings_rate        numeric(10,6),
  savings_rate_6mo_avg numeric(10,6),
  savings_rate_mom_delta numeric(10,6),
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6),
  tdsr_percent        numeric(10,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id           uuid;
  v_month_start            date;
  v_month_end              date;
  v_account_assets         numeric(18,0) := 0;
  v_non_account_assets     numeric(18,0) := 0;
  v_total_assets           numeric(18,0) := 0;
  v_total_liabilities      numeric(18,0) := 0;
  v_monthly_income         numeric(18,0) := 0;
  v_monthly_expense        numeric(18,0) := 0;
  v_cc_expense             numeric(18,0) := 0;
  v_non_cc_expense         numeric(18,0) := 0;
  v_monthly_savings        numeric(18,0) := 0;
  v_savings_rate           numeric(10,6);
  v_savings_rate_6mo_avg   numeric(10,6);
  v_prev_month_savings_rate numeric(10,6);
  v_savings_rate_mom_delta numeric(10,6);
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
  v_card_installment_due   numeric(18,0) := 0;
  v_card_min_due           numeric(18,0) := 0;
  v_tdsr_percent           numeric(10,2);
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end   := (v_month_start + interval '1 month - 1 day')::date;

  -- Net worth via accounts
  SELECT COALESCE(SUM(
    CASE
      WHEN a.type = 'income' THEN a.amount
      WHEN a.type = 'expense' THEN -a.amount
      ELSE 0
    END
  ), 0)::numeric(18,0)
  INTO v_account_assets
  FROM (
    SELECT ac.id,
           ac.opening_balance AS amount,
           'income'::text     AS type,
           ac.opening_balance_date AS transaction_date
    FROM public.accounts ac
    WHERE ac.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false

    UNION ALL

    SELECT t.account_id, t.amount, t.type, t.transaction_date
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false
      AND t.transaction_date <= p_as_of_date
  ) a;

  -- Non-account (physical) assets
  WITH latest_q AS (
    SELECT DISTINCT ON (aqh.asset_id)
      aqh.asset_id, aqh.quantity
    FROM public.asset_quantity_history aqh
    WHERE aqh.household_id = v_household_id
      AND aqh.as_of_date <= p_as_of_date
    ORDER BY aqh.asset_id, aqh.as_of_date DESC
  ),
  latest_p AS (
    SELECT DISTINCT ON (aph.asset_id)
      aph.asset_id, aph.unit_price
    FROM public.asset_price_history aph
    WHERE aph.household_id = v_household_id
      AND aph.as_of_date <= p_as_of_date
    ORDER BY aph.asset_id, aph.as_of_date DESC
  )
  SELECT COALESCE(SUM(
    CASE WHEN a.include_in_net_worth = false THEN 0
         ELSE COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
    END
  ), 0)::numeric(18,0)
  INTO v_non_account_assets
  FROM public.assets a
  LEFT JOIN latest_q lq ON lq.asset_id = a.id
  LEFT JOIN latest_p lp ON lp.asset_id = a.id
  WHERE a.household_id = v_household_id
    AND a.is_archived = false;

  v_total_assets := COALESCE(v_account_assets, 0) + COALESCE(v_non_account_assets, 0);

  -- Liabilities
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- Monthly income
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: non-credit-card accounts
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: credit card accounts via billing items
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- Savings rate trend fields (current + prior 5 months and MoM delta)
  WITH month_offsets AS (
    SELECT generate_series(0, 5) AS month_offset
  ),
  month_windows AS (
    SELECT
      mo.month_offset,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval)::date AS month_start,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval + interval '1 month - 1 day')::date AS month_end
    FROM month_offsets mo
  ),
  income_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_income
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'income'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    GROUP BY mw.month_offset
  ),
  non_cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.accounts ac ON ac.id = t.account_id
    WHERE ac.id IS NULL OR ac.type <> 'credit_card'
    GROUP BY mw.month_offset
  ),
  cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.card_billing_months cbm
      ON cbm.household_id = v_household_id
      AND cbm.billing_month BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.card_billing_items cbi
      ON cbi.billing_month_id = cbm.id
      AND cbi.household_id = v_household_id
      AND cbi.is_converted_to_installment = false
    GROUP BY mw.month_offset
  ),
  monthly_rates AS (
    SELECT
      mw.month_offset,
      CASE
        WHEN COALESCE(ibm.monthly_income, 0) > 0 THEN
          (
            COALESCE(ibm.monthly_income, 0)
            - COALESCE(nem.monthly_expense, 0)
            - COALESCE(cem.monthly_expense, 0)
          ) / ibm.monthly_income
        ELSE NULL
      END::numeric(10,6) AS savings_rate
    FROM month_windows mw
    LEFT JOIN income_by_month ibm ON ibm.month_offset = mw.month_offset
    LEFT JOIN non_cc_expense_by_month nem ON nem.month_offset = mw.month_offset
    LEFT JOIN cc_expense_by_month cem ON cem.month_offset = mw.month_offset
  )
  SELECT
    ROUND(AVG(mr.savings_rate)::numeric, 6)::numeric(10,6),
    MAX(CASE WHEN mr.month_offset = 1 THEN mr.savings_rate END)::numeric(10,6)
  INTO v_savings_rate_6mo_avg, v_prev_month_savings_rate
  FROM monthly_rates mr;

  IF v_savings_rate IS NOT NULL AND v_prev_month_savings_rate IS NOT NULL THEN
    v_savings_rate_mom_delta := (v_savings_rate - v_prev_month_savings_rate)::numeric(10,6);
  ELSE
    v_savings_rate_mom_delta := NULL;
  END IF;

  -- Liquid assets
  WITH account_balances AS (
    SELECT
      ac.id,
      ac.opening_balance
      + COALESCE(SUM(
          CASE
            WHEN t.type = 'income'  THEN  t.amount
            WHEN t.type = 'expense' THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON  t.account_id = ac.id
      AND t.transaction_date <= p_as_of_date
      AND t.household_id = v_household_id
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
    GROUP BY ac.id, ac.opening_balance
  ),
  liquid_assets AS (
    SELECT COALESCE(SUM(GREATEST(ab.balance, 0)), 0)::numeric(18,0) AS liquid_value
    FROM account_balances ab

    UNION ALL

    SELECT COALESCE(SUM(
      CASE
        WHEN a.is_liquid = true AND a.is_archived = false
          THEN COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
        ELSE 0
      END
    ), 0)::numeric(18,0)
    FROM public.assets a
    LEFT JOIN LATERAL (
      SELECT aqh.quantity
      FROM public.asset_quantity_history aqh
      WHERE aqh.asset_id = a.id
        AND aqh.household_id = v_household_id
        AND aqh.as_of_date <= p_as_of_date
      ORDER BY aqh.as_of_date DESC
      LIMIT 1
    ) lq ON true
    LEFT JOIN LATERAL (
      SELECT aph.unit_price
      FROM public.asset_price_history aph
      WHERE aph.asset_id = a.id
        AND aph.household_id = v_household_id
        AND aph.as_of_date <= p_as_of_date
      ORDER BY aph.as_of_date DESC
      LIMIT 1
    ) lp ON true
    WHERE a.household_id = v_household_id
  )
  SELECT COALESCE(SUM(liquid_value), 0)::numeric(18,0)
  INTO v_liquid_assets
  FROM liquid_assets;

  -- Emergency fund months (3-month essential average)
  -- Card essential expense must come from card_billing_items, not raw card transactions.
  WITH essential_non_cc_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND ac.type <> 'credit_card'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  ),
  essential_cc_by_month AS (
    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1

    UNION ALL

    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1
  ),
  essential_by_month AS (
    SELECT month_bucket, SUM(essential_expense)::numeric(18,2) AS essential_expense
    FROM (
      SELECT month_bucket, essential_expense FROM essential_non_cc_by_month
      UNION ALL
      SELECT month_bucket, essential_expense FROM essential_cc_by_month
    ) src
    GROUP BY month_bucket
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- Debt service ratio
  SELECT COALESCE(SUM(lp.actual_amount), 0)::numeric(18,0)
  INTO v_debt_service
  FROM public.liability_payments lp
  WHERE lp.household_id = v_household_id
    AND lp.payment_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  ELSE
    v_debt_service_ratio := NULL;
  END IF;

  -- Monthly card installment obligations (current billing month)
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_card_installment_due
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbi.item_type = 'installment'
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end;

  -- Card minimum due proxy: 5% of remaining statement amount for open/partial statements due this month
  SELECT COALESCE(
    SUM(
      ROUND(
        GREATEST(cbm.statement_amount - cbm.paid_amount, 0)::numeric * 0.05,
        0
      )
    ),
    0
  )::numeric(18,0)
  INTO v_card_min_due
  FROM public.card_billing_months cbm
  WHERE cbm.household_id = v_household_id
    AND cbm.status <> 'settled'
    AND cbm.due_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_tdsr_percent := ROUND(
      ((v_debt_service + v_card_installment_due + v_card_min_due)::numeric / v_monthly_income::numeric) * 100,
      2
    )::numeric(10,2);
  ELSE
    v_tdsr_percent := NULL;
  END IF;

  RETURN QUERY
  SELECT
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_savings_rate_6mo_avg,
    v_savings_rate_mom_delta,
    v_emergency_months,
    v_debt_service_ratio,
    v_tdsr_percent;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_dashboard_core(uuid, date) TO authenticated, anon;
-- ============================================================================
-- 00032_drop_cashflow_forecast_rpc.sql
-- Remove deprecated cash-flow forecast RPC without touching production data.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER);
-- ============================================================================
-- 00033_drop_jar_reconciliation_rpc.sql
-- Remove deprecated jar reconciliation RPC without touching production data.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_jar_reconciliation_month(UUID, DATE);
-- ============================================================================
-- 00034_spending_jar_category_map.sql
-- Spending jar category mapping (expense category -> jar) + fallback jar bootstrap.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.spending_jar_category_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT spending_jar_category_map_unique UNIQUE (household_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_spending_jar_map_household_jar
  ON public.spending_jar_category_map (household_id, jar_id);

CREATE INDEX IF NOT EXISTS idx_spending_jar_map_household_category
  ON public.spending_jar_category_map (household_id, category_id);

DROP TRIGGER IF EXISTS trg_spending_jar_category_map_set_updated_at ON public.spending_jar_category_map;
CREATE TRIGGER trg_spending_jar_category_map_set_updated_at
  BEFORE UPDATE ON public.spending_jar_category_map
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.spending_jar_category_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view spending jar category map for their households" ON public.spending_jar_category_map;
CREATE POLICY "Users can view spending jar category map for their households"
  ON public.spending_jar_category_map FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage spending jar category map for their households" ON public.spending_jar_category_map;
CREATE POLICY "Users can manage spending jar category map for their households"
  ON public.spending_jar_category_map FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- Ensure a per-household fallback spending jar for unmapped categories.
INSERT INTO public.jar_definitions (
  household_id,
  name,
  slug,
  color,
  icon,
  sort_order,
  is_system_default,
  is_archived
)
SELECT
  h.id,
  'Unassigned',
  'unassigned',
  '#64748B',
  'archive',
  999,
  true,
  false
FROM public.households h
ON CONFLICT (household_id, slug) DO NOTHING;
-- ============================================================================
-- 00035_spending_jar_analytics_rpc.sql
-- Spending jar analytics RPCs: summary, history, transaction list, category breakdown.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_monthly_summary(
  p_household_id UUID DEFAULT NULL,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  jar_id UUID,
  jar_name TEXT,
  month DATE,
  monthly_limit NUMERIC(18,0),
  monthly_spent NUMERIC(18,0),
  usage_percent NUMERIC(10,2),
  alert_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(t.amount)::NUMERIC(18,0) AS amount
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_standard AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_installment AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  spent_by_jar AS (
    SELECT resolved_jar_id AS jar_id, SUM(amount)::NUMERIC(18,0) AS monthly_spent
    FROM (
      SELECT * FROM non_cc
      UNION ALL
      SELECT * FROM cc_standard
      UNION ALL
      SELECT * FROM cc_installment
    ) u
    GROUP BY resolved_jar_id
  ),
  limits AS (
    SELECT
      t.jar_id,
      COALESCE(t.computed_target_amount, 0)::NUMERIC(18,0) AS monthly_limit
    FROM public.jar_monthly_targets t
    WHERE t.household_id = v_household_id
      AND t.month = v_month
  )
  SELECT
    j.id AS jar_id,
    j.name AS jar_name,
    v_month AS month,
    COALESCE(l.monthly_limit, 0)::NUMERIC(18,0) AS monthly_limit,
    COALESCE(s.monthly_spent, 0)::NUMERIC(18,0) AS monthly_spent,
    CASE
      WHEN COALESCE(l.monthly_limit, 0) <= 0 THEN NULL::NUMERIC(10,2)
      ELSE ROUND((COALESCE(s.monthly_spent, 0)::NUMERIC / l.monthly_limit::NUMERIC) * 100, 2)::NUMERIC(10,2)
    END AS usage_percent,
    CASE
      WHEN COALESCE(l.monthly_limit, 0) <= 0 THEN 'normal'
      WHEN (COALESCE(s.monthly_spent, 0)::NUMERIC / NULLIF(l.monthly_limit::NUMERIC, 0)) * 100 > 100 THEN 'exceeded'
      WHEN (COALESCE(s.monthly_spent, 0)::NUMERIC / NULLIF(l.monthly_limit::NUMERIC, 0)) * 100 >= 80 THEN 'warning'
      ELSE 'normal'
    END::TEXT AS alert_level
  FROM public.jar_definitions j
  LEFT JOIN limits l ON l.jar_id = j.id
  LEFT JOIN spent_by_jar s ON s.jar_id = j.id
  WHERE j.household_id = v_household_id
    AND j.is_archived = false
  ORDER BY j.sort_order ASC, j.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_history_months(
  p_household_id UUID DEFAULT NULL,
  p_jar_id UUID DEFAULT NULL,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  jar_id UUID,
  jar_name TEXT,
  month DATE,
  monthly_limit NUMERIC(18,0),
  monthly_spent NUMERIC(18,0),
  usage_percent NUMERIC(10,2),
  alert_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_months INTEGER;
  v_ref_month DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_months := LEAST(GREATEST(COALESCE(p_months, 12), 1), 24);
  v_ref_month := date_trunc('month', now())::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT (v_ref_month - (gs.idx || ' months')::interval)::date AS month_start
    FROM generate_series(0, v_months - 1) AS gs(idx)
  )
  SELECT
    s.jar_id,
    s.jar_name,
    s.month,
    s.monthly_limit,
    s.monthly_spent,
    s.usage_percent,
    s.alert_level
  FROM months m
  CROSS JOIN LATERAL public.rpc_spending_jar_monthly_summary(v_household_id, m.month_start) s
  WHERE p_jar_id IS NULL OR s.jar_id = p_jar_id
  ORDER BY s.month DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_month_transactions(
  p_household_id UUID,
  p_jar_id UUID,
  p_month DATE DEFAULT date_trunc('month', now())::date,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entry_id TEXT,
  source_type TEXT,
  entry_date DATE,
  description TEXT,
  category_id UUID,
  category_name TEXT,
  amount NUMERIC(18,0)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
  v_limit INTEGER;
  v_offset INTEGER;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;
  IF p_jar_id IS NULL THEN
    RAISE EXCEPTION 'Jar id is required';
  END IF;
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      t.id::TEXT AS entry_id,
      'transaction'::TEXT AS source_type,
      t.transaction_date AS entry_date,
      COALESCE(t.description, c.name, 'Expense')::TEXT AS description,
      t.category_id,
      c.name::TEXT AS category_name,
      t.amount::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
  ),
  cc_standard AS (
    SELECT
      cbi.id::TEXT AS entry_id,
      'card_standard'::TEXT AS source_type,
      cbm.billing_month::DATE AS entry_date,
      COALESCE(cbi.description, c.name, 'Card expense')::TEXT AS description,
      tx.category_id,
      c.name::TEXT AS category_name,
      (cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
  ),
  cc_installment AS (
    SELECT
      cbi.id::TEXT AS entry_id,
      'card_installment'::TEXT AS source_type,
      cbm.billing_month::DATE AS entry_date,
      COALESCE(cbi.description, c.name, ip.description, 'Installment')::TEXT AS description,
      tx.category_id,
      c.name::TEXT AS category_name,
      (cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
  ),
  all_rows AS (
    SELECT * FROM non_cc
    UNION ALL
    SELECT * FROM cc_standard
    UNION ALL
    SELECT * FROM cc_installment
  )
  SELECT
    r.entry_id,
    r.source_type,
    r.entry_date,
    r.description,
    r.category_id,
    r.category_name,
    r.amount
  FROM all_rows r
  WHERE r.resolved_jar_id = p_jar_id
  ORDER BY r.entry_date DESC, r.entry_id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_month_category_breakdown(
  p_household_id UUID,
  p_jar_id UUID,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  amount NUMERIC(18,0)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;
  IF p_jar_id IS NULL THEN
    RAISE EXCEPTION 'Jar id is required';
  END IF;
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      t.category_id,
      c.name::TEXT AS category_name,
      SUM(t.amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
    GROUP BY t.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_standard AS (
    SELECT
      tx.category_id,
      c.name::TEXT AS category_name,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY tx.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_installment AS (
    SELECT
      tx.category_id,
      c.name::TEXT AS category_name,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY tx.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  all_rows AS (
    SELECT * FROM non_cc
    UNION ALL
    SELECT * FROM cc_standard
    UNION ALL
    SELECT * FROM cc_installment
  )
  SELECT
    r.category_id,
    COALESCE(r.category_name, 'Uncategorized')::TEXT AS category_name,
    SUM(r.amount)::NUMERIC(18,0) AS amount
  FROM all_rows r
  WHERE r.resolved_jar_id = p_jar_id
  GROUP BY r.category_id, COALESCE(r.category_name, 'Uncategorized')
  ORDER BY amount DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_monthly_summary(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_history_months(UUID, UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_month_transactions(UUID, UUID, DATE, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_month_category_breakdown(UUID, UUID, DATE) TO authenticated, anon;
-- ============================================================================
-- 00036_spending_jar_backfill_12m.sql
-- Backfill category->jar map for expense categories used in the last 12 months.
-- Missing mappings are routed to fallback 'unassigned' jar.
-- ============================================================================

WITH fallback AS (
  SELECT
    h.id AS household_id,
    jd.id AS jar_id
  FROM public.households h
  JOIN public.jar_definitions jd
    ON jd.household_id = h.id
   AND jd.slug = 'unassigned'
   AND jd.is_archived = false
),
recent_expense_categories AS (
  SELECT DISTINCT
    t.household_id,
    t.category_id
  FROM public.transactions t
  WHERE t.type = 'expense'
    AND t.category_id IS NOT NULL
    AND t.transaction_date >= (date_trunc('month', now())::date - interval '12 months')
)
INSERT INTO public.spending_jar_category_map (
  household_id,
  category_id,
  jar_id
)
SELECT
  r.household_id,
  r.category_id,
  f.jar_id
FROM recent_expense_categories r
JOIN fallback f ON f.household_id = r.household_id
ON CONFLICT (household_id, category_id) DO NOTHING;
-- ============================================================================
-- 00037_spending_jar_mapping_trigger.sql
-- Ensure expense transactions always have a category->jar mapping (fallback to unassigned).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_spending_jar_mapping_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fallback_jar_id UUID;
BEGIN
  IF NEW.type <> 'expense' OR NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT jd.id
  INTO v_fallback_jar_id
  FROM public.jar_definitions jd
  WHERE jd.household_id = NEW.household_id
    AND jd.slug = 'unassigned'
    AND jd.is_archived = false
  LIMIT 1;

  IF v_fallback_jar_id IS NULL THEN
    INSERT INTO public.jar_definitions (
      household_id,
      name,
      slug,
      color,
      icon,
      sort_order,
      is_system_default,
      is_archived,
      created_by
    )
    VALUES (
      NEW.household_id,
      'Unassigned',
      'unassigned',
      '#64748B',
      'archive',
      999,
      true,
      false,
      NEW.created_by
    )
    ON CONFLICT (household_id, slug) DO NOTHING;

    SELECT jd.id
    INTO v_fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = NEW.household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1;
  END IF;

  INSERT INTO public.spending_jar_category_map (
    household_id,
    category_id,
    jar_id,
    created_by
  )
  VALUES (
    NEW.household_id,
    NEW.category_id,
    v_fallback_jar_id,
    NEW.created_by
  )
  ON CONFLICT (household_id, category_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_spending_jar_mapping_on_transaction ON public.transactions;
CREATE TRIGGER trg_ensure_spending_jar_mapping_on_transaction
  AFTER INSERT OR UPDATE OF type, category_id
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_spending_jar_mapping_on_transaction();
-- ============================================================================
-- 00038_fix_jar_overview_security.sql
-- Fix: set jar_monthly_overview view to use security invoker to clear Supabase warnings and enforce RLS securely
-- ============================================================================

ALTER VIEW public.jar_monthly_overview SET (security_invoker = true);
-- ============================================================================
-- 00039_savings_feature.sql
-- Savings feature schema, functions, scheduler, and supporting constraints.
-- ============================================================================

alter table public.transactions
  add column if not exists transaction_subtype text;

alter table public.transactions
  add column if not exists is_non_cash boolean not null default false;

alter table public.transactions
  add column if not exists related_savings_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_related_savings_fk'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_related_savings_fk
      foreign key (related_savings_id) references public.savings_accounts(id) on delete set null
      not valid;
  end if;
exception
  when undefined_table then
    null;
end
$$;

insert into public.categories (household_id, kind, name, is_system, is_active, sort_order)
values
  (null, 'expense', 'Savings Deposit', true, true, 990),
  (null, 'income', 'Savings Withdrawal', true, true, 991),
  (null, 'income', 'Savings Interest', true, true, 992),
  (null, 'expense', 'Savings Tax', true, true, 993),
  (null, 'expense', 'Savings Penalty', true, true, 994)
on conflict do nothing;

create table if not exists public.savings_rate_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  provider_name text not null,
  product_name text,
  savings_type text not null,
  interest_type text not null,
  term_mode text not null,
  term_days integer not null,
  annual_rate numeric(10,6) not null,
  early_withdrawal_rate numeric(10,6),
  tax_rate numeric(6,5) not null default 0,
  effective_from date not null,
  effective_to date,
  source text not null default 'manual',
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint savings_rate_history_savings_type_check check (savings_type in ('bank', 'third_party')),
  constraint savings_rate_history_interest_type_check check (interest_type in ('simple', 'compound_daily')),
  constraint savings_rate_history_term_mode_check check (term_mode in ('fixed', 'flexible')),
  constraint savings_rate_history_term_days_nonnegative check (term_days >= 0),
  constraint savings_rate_history_annual_rate_nonnegative check (annual_rate >= 0),
  constraint savings_rate_history_early_withdrawal_nonnegative check (early_withdrawal_rate is null or early_withdrawal_rate >= 0),
  constraint savings_rate_history_tax_bounds check (tax_rate between 0 and 1),
  constraint savings_rate_history_source_check check (source in ('manual', 'imported', 'system_renewal')),
  constraint savings_rate_history_effective_range_check check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id uuid references public.savings_accounts(id) on delete restrict,
  goal_id uuid references public.goals(id) on delete set null,
  savings_type text not null,
  provider_name text not null,
  product_name text,
  interest_type text not null,
  term_mode text not null,
  term_days integer not null default 0,
  principal_amount numeric(18,0) not null,
  current_principal_remaining numeric(18,0) not null,
  annual_rate numeric(10,6) not null,
  early_withdrawal_rate numeric(10,6),
  tax_rate numeric(6,5) not null default 0,
  start_date date not null,
  maturity_date date,
  primary_linked_account_id uuid not null references public.accounts(id) on delete restrict,
  linked_account_ids uuid[] not null default '{}'::uuid[],
  maturity_preference text,
  next_plan_config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  closed_at date,
  origin_rate_history_id uuid references public.savings_rate_history(id) on delete set null,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_accounts_savings_type_check check (savings_type in ('bank', 'third_party')),
  constraint savings_accounts_interest_type_check check (interest_type in ('simple', 'compound_daily')),
  constraint savings_accounts_term_mode_check check (term_mode in ('fixed', 'flexible')),
  constraint savings_accounts_term_days_nonnegative check (term_days >= 0),
  constraint savings_accounts_principal_positive check (principal_amount > 0),
  constraint savings_accounts_remaining_nonnegative check (current_principal_remaining >= 0),
  constraint savings_accounts_annual_rate_nonnegative check (annual_rate >= 0),
  constraint savings_accounts_early_withdrawal_nonnegative check (early_withdrawal_rate is null or early_withdrawal_rate >= 0),
  constraint savings_accounts_tax_bounds check (tax_rate between 0 and 1),
  constraint savings_accounts_maturity_preference_check check (maturity_preference is null or maturity_preference in ('renew_same', 'switch_plan', 'withdraw')),
  constraint savings_accounts_status_check check (status in ('active', 'maturing_soon', 'matured', 'withdrawn', 'renewed', 'cancelled')),
  constraint savings_accounts_date_shape_check check (
    (term_mode = 'flexible' and maturity_date is null)
    or
    (term_mode = 'fixed' and maturity_date is not null and maturity_date >= start_date)
  ),
  constraint savings_accounts_bank_shape_check check (
    (savings_type = 'bank' and interest_type = 'simple' and term_mode = 'fixed' and early_withdrawal_rate is not null)
    or
    (savings_type = 'third_party')
  )
);

create table if not exists public.savings_withdrawals (
  id uuid primary key default gen_random_uuid(),
  savings_account_id uuid not null references public.savings_accounts(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete cascade,
  withdrawal_date date not null,
  withdrawal_mode text not null,
  requested_principal_amount numeric(18,0) not null,
  gross_interest_amount numeric(18,0) not null default 0,
  tax_amount numeric(18,0) not null default 0,
  penalty_amount numeric(18,0) not null default 0,
  net_received_amount numeric(18,0) not null,
  destination_account_id uuid not null references public.accounts(id) on delete restrict,
  remaining_principal_after numeric(18,0) not null,
  principal_transaction_id uuid references public.transactions(id) on delete set null,
  interest_transaction_id uuid references public.transactions(id) on delete set null,
  tax_transaction_id uuid references public.transactions(id) on delete set null,
  penalty_transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint savings_withdrawals_mode_check check (withdrawal_mode in ('partial', 'full')),
  constraint savings_withdrawals_requested_positive check (requested_principal_amount > 0),
  constraint savings_withdrawals_interest_nonnegative check (gross_interest_amount >= 0),
  constraint savings_withdrawals_tax_nonnegative check (tax_amount >= 0),
  constraint savings_withdrawals_penalty_nonnegative check (penalty_amount >= 0),
  constraint savings_withdrawals_net_nonnegative check (net_received_amount >= 0),
  constraint savings_withdrawals_remaining_nonnegative check (remaining_principal_after >= 0)
);

create table if not exists public.savings_maturity_actions (
  id uuid primary key default gen_random_uuid(),
  savings_account_id uuid not null references public.savings_accounts(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete cascade,
  action_date date not null,
  action_type text not null,
  execution_mode text not null,
  gross_principal_amount numeric(18,0) not null,
  gross_interest_amount numeric(18,0) not null default 0,
  tax_amount numeric(18,0) not null default 0,
  net_rollover_amount numeric(18,0) not null default 0,
  destination_account_id uuid references public.accounts(id) on delete restrict,
  child_savings_account_id uuid references public.savings_accounts(id) on delete restrict,
  applied_annual_rate numeric(10,6),
  applied_term_days integer,
  applied_interest_type text,
  selected_rate_history_id uuid references public.savings_rate_history(id) on delete set null,
  executed_by uuid references public.profiles(user_id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint savings_maturity_actions_type_check check (action_type in ('renew_same', 'switch_plan', 'withdraw')),
  constraint savings_maturity_actions_execution_mode_check check (execution_mode in ('manual', 'scheduled_auto')),
  constraint savings_maturity_actions_principal_nonnegative check (gross_principal_amount >= 0),
  constraint savings_maturity_actions_interest_nonnegative check (gross_interest_amount >= 0),
  constraint savings_maturity_actions_tax_nonnegative check (tax_amount >= 0),
  constraint savings_maturity_actions_rollover_nonnegative check (net_rollover_amount >= 0),
  constraint savings_maturity_actions_interest_type_check check (applied_interest_type is null or applied_interest_type in ('simple', 'compound_daily')),
  constraint savings_maturity_actions_term_days_nonnegative check (applied_term_days is null or applied_term_days >= 0)
);

create index if not exists idx_savings_accounts_household_status_maturity
  on public.savings_accounts (household_id, status, maturity_date);

create index if not exists idx_savings_accounts_household_type_provider
  on public.savings_accounts (household_id, savings_type, provider_name);

create index if not exists idx_savings_accounts_parent
  on public.savings_accounts (parent_id);

create index if not exists idx_savings_accounts_goal
  on public.savings_accounts (goal_id);

create index if not exists idx_savings_accounts_linked_account_ids
  on public.savings_accounts using gin (linked_account_ids);

create index if not exists idx_savings_rate_history_provider_effective
  on public.savings_rate_history (household_id, provider_name, effective_from desc);

create index if not exists idx_savings_rate_history_product_window
  on public.savings_rate_history (household_id, savings_type, term_mode, term_days, effective_from desc);

create index if not exists idx_savings_withdrawals_savings_date
  on public.savings_withdrawals (savings_account_id, withdrawal_date desc);

create index if not exists idx_savings_withdrawals_destination
  on public.savings_withdrawals (household_id, destination_account_id, withdrawal_date desc);

create unique index if not exists uq_savings_maturity_actions_parent
  on public.savings_maturity_actions (savings_account_id);

create index if not exists idx_savings_maturity_actions_household_date
  on public.savings_maturity_actions (household_id, action_date desc);

create index if not exists idx_savings_maturity_actions_child
  on public.savings_maturity_actions (child_savings_account_id);

drop trigger if exists trg_savings_accounts_set_updated_at on public.savings_accounts;
create trigger trg_savings_accounts_set_updated_at
before update on public.savings_accounts
for each row execute function public.set_updated_at();

alter table public.savings_rate_history enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.savings_withdrawals enable row level security;
alter table public.savings_maturity_actions enable row level security;

drop policy if exists savings_rate_history_select_member_policy on public.savings_rate_history;
create policy savings_rate_history_select_member_policy
on public.savings_rate_history
for select
using (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_rate_history_insert_member_policy on public.savings_rate_history;
create policy savings_rate_history_insert_member_policy
on public.savings_rate_history
for insert
with check (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_rate_history_update_member_policy on public.savings_rate_history;
create policy savings_rate_history_update_member_policy
on public.savings_rate_history
for update
using (public.is_household_member(savings_rate_history.household_id))
with check (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_accounts_select_member_policy on public.savings_accounts;
create policy savings_accounts_select_member_policy
on public.savings_accounts
for select
using (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_insert_member_policy on public.savings_accounts;
create policy savings_accounts_insert_member_policy
on public.savings_accounts
for insert
with check (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_update_member_policy on public.savings_accounts;
create policy savings_accounts_update_member_policy
on public.savings_accounts
for update
using (public.is_household_member(savings_accounts.household_id))
with check (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_delete_member_policy on public.savings_accounts;
create policy savings_accounts_delete_member_policy
on public.savings_accounts
for delete
using (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_withdrawals_select_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_select_member_policy
on public.savings_withdrawals
for select
using (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_withdrawals_insert_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_insert_member_policy
on public.savings_withdrawals
for insert
with check (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_withdrawals_update_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_update_member_policy
on public.savings_withdrawals
for update
using (public.is_household_member(savings_withdrawals.household_id))
with check (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_maturity_actions_select_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_select_member_policy
on public.savings_maturity_actions
for select
using (public.is_household_member(savings_maturity_actions.household_id));

drop policy if exists savings_maturity_actions_insert_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_insert_member_policy
on public.savings_maturity_actions
for insert
with check (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

drop policy if exists savings_maturity_actions_update_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_update_member_policy
on public.savings_maturity_actions
for update
using (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'insights_type_check'
      and conrelid = 'public.insights'::regclass
  ) then
    alter table public.insights drop constraint insights_type_check;
  end if;

  alter table public.insights
    add constraint insights_type_check
    check (insight_type in ('spending_anomaly', 'goal_risk', 'debt_alert', 'savings_milestone', 'net_worth_change', 'savings_maturity_alert', 'custom'));
end
$$;

create or replace function public.calculate_savings_current_value(
  p_savings_id uuid,
  p_as_of_date date default current_date
)
returns table (
  principal numeric(18,0),
  accrued_interest numeric(18,0),
  tax_liability numeric(18,0),
  net_value numeric(18,0),
  days_elapsed integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.savings_accounts%rowtype;
  v_withdrawal public.savings_withdrawals%rowtype;
  v_cursor date;
  v_segment_end date;
  v_days integer;
  v_principal numeric(18,6);
  v_balance numeric(18,6);
  v_accrued numeric(18,6) := 0;
  v_total_days integer := 0;
  v_is_fixed boolean;
  v_growth numeric(18,10);
  v_current_balance numeric(18,6);
begin
  select *
  into v_account
  from public.savings_accounts
  where id = p_savings_id;

  if not found then
    raise exception 'Savings account not found: %', p_savings_id;
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.is_household_member(v_account.household_id) then
    raise exception 'Not authorized for savings account %', p_savings_id;
  end if;

  v_cursor := v_account.start_date;
  v_principal := v_account.principal_amount;
  v_balance := v_account.principal_amount;
  v_is_fixed := v_account.term_mode = 'fixed';

  for v_withdrawal in
    select *
    from public.savings_withdrawals
    where savings_account_id = p_savings_id
      and withdrawal_date <= p_as_of_date
    order by withdrawal_date asc, created_at asc
  loop
    v_segment_end := v_withdrawal.withdrawal_date;
    if v_is_fixed and v_account.maturity_date is not null then
      v_segment_end := least(v_segment_end, v_account.maturity_date);
    end if;

    v_days := greatest(0, v_segment_end - v_cursor);
    v_total_days := v_total_days + v_days;

    if v_account.interest_type = 'compound_daily' then
      v_growth := power((1 + (v_account.annual_rate / 365.0))::numeric, v_days);
      v_balance := v_balance * v_growth;
      v_accrued := greatest(v_balance - v_principal, 0);
      v_balance := greatest(v_balance - v_withdrawal.requested_principal_amount - v_withdrawal.gross_interest_amount, 0);
      v_principal := v_withdrawal.remaining_principal_after;
    else
      v_accrued := v_accrued + (v_principal * v_account.annual_rate * v_days / 365.0);
      v_accrued := greatest(v_accrued - v_withdrawal.gross_interest_amount, 0);
      v_principal := v_withdrawal.remaining_principal_after;
      v_balance := v_principal + v_accrued;
    end if;

    v_cursor := v_withdrawal.withdrawal_date;

    if v_principal <= 0 then
      exit;
    end if;
  end loop;

  if v_principal > 0 then
    v_segment_end := p_as_of_date;
    if v_is_fixed and v_account.maturity_date is not null then
      v_segment_end := least(v_segment_end, v_account.maturity_date);
    end if;

    v_days := greatest(0, v_segment_end - v_cursor);
    v_total_days := v_total_days + v_days;

    if v_account.interest_type = 'compound_daily' then
      v_growth := power((1 + (v_account.annual_rate / 365.0))::numeric, v_days);
      v_current_balance := v_balance * v_growth;
      v_accrued := greatest(v_current_balance - v_principal, 0);
    else
      v_accrued := v_accrued + (v_principal * v_account.annual_rate * v_days / 365.0);
    end if;
  end if;

  principal := round(v_principal)::numeric(18,0);
  accrued_interest := round(greatest(v_accrued, 0))::numeric(18,0);
  tax_liability := case
    when v_account.savings_type = 'third_party' then round(greatest(v_accrued, 0) * v_account.tax_rate)::numeric(18,0)
    else 0::numeric(18,0)
  end;
  net_value := case
    when v_account.savings_type = 'third_party'
      then round(greatest(v_principal + v_accrued - (greatest(v_accrued, 0) * v_account.tax_rate), 0))::numeric(18,0)
    else round(greatest(v_principal + v_accrued, 0))::numeric(18,0)
  end;
  days_elapsed := v_total_days;
  return next;
end;
$$;

create or replace function public.process_savings_maturity(
  p_savings_id uuid,
  p_action_date date default current_date,
  p_execution_mode text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.savings_accounts%rowtype;
  v_current record;
  v_action_id uuid := gen_random_uuid();
  v_child_id uuid;
  v_rate public.savings_rate_history%rowtype;
  v_action_type text;
  v_net_rollover numeric(18,0);
begin
  select *
  into v_parent
  from public.savings_accounts
  where id = p_savings_id
  for update;

  if not found then
    raise exception 'Savings account not found: %', p_savings_id;
  end if;

  if v_parent.term_mode <> 'fixed' then
    raise exception 'Only fixed-term savings can be matured.';
  end if;

  if v_parent.status in ('withdrawn', 'renewed', 'cancelled') then
    raise exception 'Savings account % already processed.', p_savings_id;
  end if;

  if exists (
    select 1
    from public.savings_maturity_actions
    where savings_account_id = p_savings_id
  ) then
    raise exception 'Savings account % already has a maturity action.', p_savings_id;
  end if;

  select *
  into v_current
  from public.calculate_savings_current_value(p_savings_id, coalesce(v_parent.maturity_date, p_action_date));

  v_action_type := coalesce(v_parent.maturity_preference, 'withdraw');
  v_net_rollover := v_current.principal + v_current.accrued_interest - v_current.tax_liability;

  insert into public.savings_maturity_actions (
    id,
    savings_account_id,
    household_id,
    action_date,
    action_type,
    execution_mode,
    gross_principal_amount,
    gross_interest_amount,
    tax_amount,
    net_rollover_amount,
    destination_account_id,
    executed_by
  ) values (
    v_action_id,
    v_parent.id,
    v_parent.household_id,
    p_action_date,
    v_action_type,
    p_execution_mode,
    v_current.principal,
    v_current.accrued_interest,
    v_current.tax_liability,
    v_net_rollover,
    v_parent.primary_linked_account_id,
    auth.uid()
  );

  if v_action_type in ('renew_same', 'switch_plan') then
    select *
    into v_rate
    from public.savings_rate_history
    where household_id = v_parent.household_id
      and provider_name = v_parent.provider_name
      and savings_type = v_parent.savings_type
      and term_mode = v_parent.term_mode
      and term_days = v_parent.term_days
      and effective_from <= p_action_date
      and (effective_to is null or effective_to >= p_action_date)
    order by effective_from desc, created_at desc
    limit 1;

    v_child_id := gen_random_uuid();

    insert into public.savings_accounts (
      id,
      household_id,
      parent_id,
      goal_id,
      savings_type,
      provider_name,
      product_name,
      interest_type,
      term_mode,
      term_days,
      principal_amount,
      current_principal_remaining,
      annual_rate,
      early_withdrawal_rate,
      tax_rate,
      start_date,
      maturity_date,
      primary_linked_account_id,
      linked_account_ids,
      maturity_preference,
      next_plan_config,
      status,
      origin_rate_history_id,
      notes,
      created_by
    ) values (
      v_child_id,
      v_parent.household_id,
      v_parent.id,
      v_parent.goal_id,
      v_parent.savings_type,
      v_parent.provider_name,
      v_parent.product_name,
      coalesce((v_parent.next_plan_config ->> 'interestType')::text, coalesce(v_rate.interest_type, v_parent.interest_type)),
      v_parent.term_mode,
      coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days)),
      v_net_rollover,
      v_net_rollover,
      coalesce((v_parent.next_plan_config ->> 'annualRate')::numeric, coalesce(v_rate.annual_rate, v_parent.annual_rate)),
      coalesce(v_rate.early_withdrawal_rate, v_parent.early_withdrawal_rate),
      coalesce((v_parent.next_plan_config ->> 'taxRate')::numeric, coalesce(v_rate.tax_rate, v_parent.tax_rate)),
      p_action_date,
      case
        when v_parent.term_mode = 'fixed'
          then p_action_date + coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days))
        else null
      end,
      coalesce((v_parent.next_plan_config ->> 'primaryLinkedAccountId')::uuid, v_parent.primary_linked_account_id),
      coalesce(
        (
          select array_agg(value::uuid)
          from jsonb_array_elements_text(coalesce(v_parent.next_plan_config -> 'linkedAccountIds', '[]'::jsonb))
        ),
        v_parent.linked_account_ids
      ),
      v_parent.maturity_preference,
      '{}'::jsonb,
      'active',
      v_rate.id,
      v_parent.notes,
      auth.uid()
    );

    update public.savings_accounts
    set status = 'renewed',
        closed_at = p_action_date
    where id = v_parent.id;

    update public.savings_maturity_actions
    set child_savings_account_id = v_child_id,
        applied_annual_rate = coalesce((v_parent.next_plan_config ->> 'annualRate')::numeric, coalesce(v_rate.annual_rate, v_parent.annual_rate)),
        applied_term_days = coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days)),
        applied_interest_type = coalesce((v_parent.next_plan_config ->> 'interestType')::text, coalesce(v_rate.interest_type, v_parent.interest_type)),
        selected_rate_history_id = v_rate.id
    where id = v_action_id;
  else
    update public.savings_accounts
    set status = 'withdrawn',
        closed_at = p_action_date,
        current_principal_remaining = 0
    where id = v_parent.id;
  end if;

  return v_action_id;
end;
$$;

create or replace function public.check_maturing_savings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('Asia/Ho_Chi_Minh', now())::date;
  v_row public.savings_accounts%rowtype;
begin
  for v_row in
    select *
    from public.savings_accounts
    where status in ('active', 'maturing_soon', 'matured')
      and term_mode = 'fixed'
      and maturity_date is not null
      and maturity_date between v_today and (v_today + 7)
  loop
    insert into public.insights (
      household_id,
      insight_type,
      severity,
      title,
      body,
      action_label,
      action_target,
      is_dismissed
    ) values (
      v_row.household_id,
      'savings_maturity_alert',
      case when v_row.maturity_date <= v_today then 'warning' else 'info' end,
      format('Savings matures soon: %s', v_row.provider_name),
      format('Savings %s is scheduled to mature on %s.', coalesce(v_row.product_name, v_row.provider_name), v_row.maturity_date),
      'Open Savings',
      '/money/savings',
      false
    )
    on conflict do nothing;

    update public.savings_accounts
    set status = case
      when maturity_date < v_today then 'matured'
      when maturity_date <= (v_today + 7) then 'maturing_soon'
      else status
    end
    where id = v_row.id;

    if v_row.maturity_preference = 'renew_same'
       and v_row.maturity_date <= v_today
       and not exists (
         select 1
         from public.savings_maturity_actions
         where savings_account_id = v_row.id
       ) then
      perform public.process_savings_maturity(v_row.id, v_today, 'scheduled_auto');
    end if;
  end loop;
end;
$$;

do $$
declare
  v_job record;
begin
  if to_regnamespace('cron') is null then
    raise notice 'cron schema missing; skipping savings cron job creation';
    return;
  end if;

  for v_job in
    select jobid
    from cron.job
    where jobname in ('savings_maturity_daily_v1')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(
    'savings_maturity_daily_v1',
    '0 0 * * *',
    $cmd$select public.check_maturing_savings();$cmd$
  );
end;
$$;
-- ============================================================================
-- 00040_rebuild_jars_intent_layer.sql
-- Rebuild jars as a financial intent layer linked to transactions and savings.
-- ============================================================================

create table if not exists public.jars (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  name text not null,
  slug text not null,
  color text,
  icon text,
  jar_type text not null default 'custom',
  monthly_strategy text not null default 'none',
  spend_policy text not null default 'flexible',
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jars_name_not_blank check (length(trim(name)) > 0),
  constraint jars_household_slug_unique unique (household_id, slug),
  constraint jars_type_check check (jar_type in (
    'essential',
    'investment',
    'long_term_saving',
    'education',
    'play',
    'give',
    'custom'
  )),
  constraint jars_monthly_strategy_check check (monthly_strategy in ('none', 'fixed', 'percent', 'hybrid')),
  constraint jars_spend_policy_check check (spend_policy in ('flexible', 'invest_only', 'long_term_only', 'must_spend', 'give_only'))
);

create table if not exists public.jar_month_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete cascade,
  month date not null,
  fixed_amount numeric(18,0) not null default 0,
  income_percent numeric(8,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_month_plans_unique unique (jar_id, month),
  constraint jar_month_plans_month_check check (month = date_trunc('month', month)::date),
  constraint jar_month_plans_fixed_nonnegative check (fixed_amount >= 0),
  constraint jar_month_plans_percent_bounds check (income_percent >= 0 and income_percent <= 100)
);

create table if not exists public.jar_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete cascade,
  rule_type text not null,
  category_id uuid references public.categories(id) on delete cascade,
  transaction_subtype text,
  savings_type text,
  priority integer not null default 100,
  confidence text not null default 'high',
  is_active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_rules_type_check check (rule_type in (
    'expense_category',
    'income_default',
    'income_category',
    'savings_source',
    'savings_destination',
    'transaction_subtype'
  )),
  constraint jar_rules_confidence_check check (confidence in ('high', 'suggested')),
  constraint jar_rules_savings_type_check check (savings_type is null or savings_type in ('bank', 'third_party'))
);

create table if not exists public.jar_review_queue (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  movement_date date not null,
  month date not null,
  amount numeric(18,0) not null,
  currency text not null default 'VND',
  status text not null default 'pending',
  suggested_allocations jsonb not null default '[]'::jsonb,
  context_json jsonb not null default '{}'::jsonb,
  resolved_allocations jsonb,
  resolved_by uuid references public.profiles(user_id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_review_queue_unique unique (household_id, source_type, source_id),
  constraint jar_review_queue_month_check check (month = date_trunc('month', month)::date),
  constraint jar_review_queue_amount_positive check (amount > 0),
  constraint jar_review_queue_status_check check (status in ('pending', 'resolved', 'dismissed')),
  constraint jar_review_queue_source_type_check check (source_type in (
    'income_transaction',
    'expense_transaction',
    'transfer_transaction',
    'savings_create',
    'savings_withdraw',
    'savings_mature',
    'asset_buy',
    'asset_sell',
    'investment_buy',
    'investment_sell',
    'manual_adjustment'
  ))
);

create table if not exists public.jar_movements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete restrict,
  review_queue_id uuid references public.jar_review_queue(id) on delete set null,
  movement_date date not null,
  month date not null,
  amount numeric(18,0) not null,
  balance_delta smallint not null,
  location_from text,
  location_to text,
  source_type text not null,
  source_id uuid not null,
  source_line_key text not null default 'default',
  related_transaction_id uuid references public.transactions(id) on delete set null,
  related_savings_id uuid references public.savings_accounts(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_movements_month_check check (month = date_trunc('month', month)::date),
  constraint jar_movements_amount_positive check (amount > 0),
  constraint jar_movements_balance_delta_check check (balance_delta in (-1, 0, 1)),
  constraint jar_movements_locations_check check (
    location_from is null or location_from in ('external', 'cash', 'savings', 'investment', 'asset', 'expense')
  ),
  constraint jar_movements_locations_to_check check (
    location_to is null or location_to in ('external', 'cash', 'savings', 'investment', 'asset', 'expense')
  ),
  constraint jar_movements_source_type_check check (source_type in (
    'income_transaction',
    'expense_transaction',
    'transfer_transaction',
    'savings_create',
    'savings_withdraw',
    'savings_mature',
    'asset_buy',
    'asset_sell',
    'investment_buy',
    'investment_sell',
    'manual_adjustment'
  )),
  constraint jar_movements_unique_source_line unique (household_id, jar_id, source_type, source_id, source_line_key)
);

alter table public.savings_accounts
  add column if not exists source_jar_id uuid references public.jars(id) on delete set null;

alter table public.savings_withdrawals
  add column if not exists destination_jar_id uuid references public.jars(id) on delete set null;

alter table public.savings_maturity_actions
  add column if not exists destination_jar_id uuid references public.jars(id) on delete set null;

create index if not exists idx_jars_household_active
  on public.jars (household_id, is_archived, sort_order, created_at desc);

create index if not exists idx_jar_month_plans_household_month
  on public.jar_month_plans (household_id, month);

create index if not exists idx_jar_rules_household_type
  on public.jar_rules (household_id, rule_type, priority, is_active);

create index if not exists idx_jar_rules_category
  on public.jar_rules (household_id, category_id)
  where category_id is not null;

create index if not exists idx_jar_review_queue_household_status
  on public.jar_review_queue (household_id, status, movement_date desc);

create index if not exists idx_jar_movements_household_month
  on public.jar_movements (household_id, month, movement_date desc);

create index if not exists idx_jar_movements_jar_date
  on public.jar_movements (jar_id, movement_date desc, created_at desc);

create or replace view public.jar_current_balances with (security_invoker = true) as
select
  j.household_id,
  j.id as jar_id,
  coalesce(sum(case when m.balance_delta = 1 then m.amount else 0 end), 0)::numeric(18,0) as total_inflow,
  coalesce(sum(case when m.balance_delta = -1 then m.amount else 0 end), 0)::numeric(18,0) as total_outflow,
  coalesce(sum((m.amount * m.balance_delta)::numeric), 0)::numeric(18,0) as current_balance,
  coalesce(sum(case when m.location_to = 'cash' then m.amount when m.location_from = 'cash' then -m.amount else 0 end), 0)::numeric(18,0) as held_in_cash,
  coalesce(sum(case when m.location_to = 'savings' then m.amount when m.location_from = 'savings' then -m.amount else 0 end), 0)::numeric(18,0) as held_in_savings,
  coalesce(sum(case when m.location_to = 'investment' then m.amount when m.location_from = 'investment' then -m.amount else 0 end), 0)::numeric(18,0) as held_in_investments,
  coalesce(sum(case when m.location_to = 'asset' then m.amount when m.location_from = 'asset' then -m.amount else 0 end), 0)::numeric(18,0) as held_in_assets
from public.jars j
left join public.jar_movements m
  on m.jar_id = j.id
where j.is_archived = false
group by j.household_id, j.id;

create or replace view public.jar_balances_monthly with (security_invoker = true) as
select
  j.household_id,
  j.id as jar_id,
  months.month,
  coalesce(sum(case when m.balance_delta = 1 then m.amount else 0 end), 0)::numeric(18,0) as inflow_amount,
  coalesce(sum(case when m.balance_delta = -1 then m.amount else 0 end), 0)::numeric(18,0) as outflow_amount,
  coalesce(sum((m.amount * m.balance_delta)::numeric), 0)::numeric(18,0) as net_change,
  coalesce(max(p.fixed_amount), 0)::numeric(18,0) as fixed_target_amount,
  coalesce(max(p.income_percent), 0)::numeric(8,2) as income_percent_target
from public.jars j
cross join (
  select generate_series(
    date_trunc('month', now())::date - interval '11 months',
    date_trunc('month', now())::date,
    interval '1 month'
  )::date as month
) months
left join public.jar_movements m
  on m.jar_id = j.id
 and m.month = months.month
left join public.jar_month_plans p
  on p.jar_id = j.id
 and p.month = months.month
where j.is_archived = false
group by j.household_id, j.id, months.month;

drop trigger if exists trg_jars_set_updated_at on public.jars;
create trigger trg_jars_set_updated_at
before update on public.jars
for each row execute function public.set_updated_at();

drop trigger if exists trg_jar_month_plans_set_updated_at on public.jar_month_plans;
create trigger trg_jar_month_plans_set_updated_at
before update on public.jar_month_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_jar_rules_set_updated_at on public.jar_rules;
create trigger trg_jar_rules_set_updated_at
before update on public.jar_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_jar_review_queue_set_updated_at on public.jar_review_queue;
create trigger trg_jar_review_queue_set_updated_at
before update on public.jar_review_queue
for each row execute function public.set_updated_at();

drop trigger if exists trg_jar_movements_set_updated_at on public.jar_movements;
create trigger trg_jar_movements_set_updated_at
before update on public.jar_movements
for each row execute function public.set_updated_at();

alter table public.jars enable row level security;
alter table public.jar_month_plans enable row level security;
alter table public.jar_rules enable row level security;
alter table public.jar_review_queue enable row level security;
alter table public.jar_movements enable row level security;

drop policy if exists jars_select_member_policy on public.jars;
create policy jars_select_member_policy
on public.jars for select
using (public.is_household_member(jars.household_id));

drop policy if exists jars_manage_member_policy on public.jars;
create policy jars_manage_member_policy
on public.jars for all
using (public.is_household_member(jars.household_id))
with check (public.is_household_member(jars.household_id));

drop policy if exists jar_month_plans_select_member_policy on public.jar_month_plans;
create policy jar_month_plans_select_member_policy
on public.jar_month_plans for select
using (public.is_household_member(jar_month_plans.household_id));

drop policy if exists jar_month_plans_manage_member_policy on public.jar_month_plans;
create policy jar_month_plans_manage_member_policy
on public.jar_month_plans for all
using (public.is_household_member(jar_month_plans.household_id))
with check (public.is_household_member(jar_month_plans.household_id));

drop policy if exists jar_rules_select_member_policy on public.jar_rules;
create policy jar_rules_select_member_policy
on public.jar_rules for select
using (public.is_household_member(jar_rules.household_id));

drop policy if exists jar_rules_manage_member_policy on public.jar_rules;
create policy jar_rules_manage_member_policy
on public.jar_rules for all
using (public.is_household_member(jar_rules.household_id))
with check (public.is_household_member(jar_rules.household_id));

drop policy if exists jar_review_queue_select_member_policy on public.jar_review_queue;
create policy jar_review_queue_select_member_policy
on public.jar_review_queue for select
using (public.is_household_member(jar_review_queue.household_id));

drop policy if exists jar_review_queue_manage_member_policy on public.jar_review_queue;
create policy jar_review_queue_manage_member_policy
on public.jar_review_queue for all
using (public.is_household_member(jar_review_queue.household_id))
with check (public.is_household_member(jar_review_queue.household_id));

drop policy if exists jar_movements_select_member_policy on public.jar_movements;
create policy jar_movements_select_member_policy
on public.jar_movements for select
using (public.is_household_member(jar_movements.household_id));

drop policy if exists jar_movements_manage_member_policy on public.jar_movements;
create policy jar_movements_manage_member_policy
on public.jar_movements for all
using (public.is_household_member(jar_movements.household_id))
with check (public.is_household_member(jar_movements.household_id));

-- ============================================================================
-- END OF DATABASE INITIALIZATION SCRIPT
-- ============================================================================
-- Total migrations included: 37
-- Excluded migrations:
--   - 00005_seed_demo_household.sql (demo data - run manually if needed)
--   - 00010_ai_insights_foundation.sql (F18 AI pipeline - removed)
--   - 00011_ai_scheduler_cron.sql (F18 AI pipeline - removed)
--   - 00020_disable_cron_schedule.sql (F18 AI pipeline - removed)
-- Generated: Production-ready clean database schema
-- ============================================================================
