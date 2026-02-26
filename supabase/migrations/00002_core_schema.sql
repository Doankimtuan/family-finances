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
