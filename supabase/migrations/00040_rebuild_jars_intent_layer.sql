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
