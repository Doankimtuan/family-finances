-- ============================================================================
-- 00046_jar_final_architecture_foundation.sql
-- Phase 1 — Domain & Schema Refactor for production jar budgeting.
--
-- Adds:
--   1. jar_category_rules (authoritative category→jar mapping)
--   2. jar_events (immutable domain event log)
--   3. jar_monthly_snapshots (closed-month reporting)
--   4. jar_month_close_runs (month-close orchestration)
--   5. jar_household_policies (per-household budgeting policies)
--   6. Enhanced jar_movements (movement_type, idempotency_key, reversal support)
--   7. priority column on jar_month_plans
--   8. Backfill from legacy jar_rules + spending_jar_category_map
--   9. Indexes, RLS, and triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. jar_category_rules — authoritative single-source category→jar mapping
-- ---------------------------------------------------------------------------
create table if not exists public.jar_category_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete restrict,
  assignment_type text not null default 'manual',
  confidence text not null default 'high',
  is_active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  updated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_category_rules_unique unique (household_id, category_id),
  constraint jar_category_rules_assignment_type_check check (assignment_type in ('manual', 'auto_migrated_v2_rule', 'auto_migrated_legacy_spending')),
  constraint jar_category_rules_confidence_check check (confidence in ('high', 'suggested'))
);

-- ---------------------------------------------------------------------------
-- 2. jar_events — immutable domain event log
-- ---------------------------------------------------------------------------
create table if not exists public.jar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid references public.jars(id) on delete set null,
  event_type text not null,
  source_type text,
  source_id text,
  idempotency_key text,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  constraint jar_events_unique_idempotency unique (household_id, idempotency_key),
  constraint jar_events_type_check check (event_type in (
    'allocation.auto_resolved',
    'allocation.review_created',
    'allocation.manual_resolved',
    'jar.created',
    'jar.updated',
    'jar.archived',
    'jar.transfer_created',
    'month_close.previewed',
    'month_close.approved',
    'overspend.covered',
    'rule.changed',
    'rule.bulk_updated',
    'correction.created',
    'snapshot.generated'
  ))
);

-- ---------------------------------------------------------------------------
-- 3. jar_monthly_snapshots — immutable closed-month reporting state
-- ---------------------------------------------------------------------------
create table if not exists public.jar_monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete restrict,
  month date not null,
  opening_balance numeric(18,0) not null default 0,
  planned_amount numeric(18,0) not null default 0,
  allocated_amount numeric(18,0) not null default 0,
  spent_amount numeric(18,0) not null default 0,
  transfer_in_amount numeric(18,0) not null default 0,
  transfer_out_amount numeric(18,0) not null default 0,
  rollover_in_amount numeric(18,0) not null default 0,
  rollover_out_amount numeric(18,0) not null default 0,
  overspend_cover_in_amount numeric(18,0) not null default 0,
  overspend_cover_out_amount numeric(18,0) not null default 0,
  correction_amount numeric(18,0) not null default 0,
  closing_balance_before_rollover numeric(18,0) not null default 0,
  closing_balance numeric(18,0) not null default 0,
  closed_at timestamptz not null,
  closed_by uuid references public.profiles(user_id) on delete set null,
  source_close_run_id uuid,
  constraint jar_monthly_snapshots_unique unique (household_id, jar_id, month),
  constraint jar_monthly_snapshots_month_check check (month = date_trunc('month', month)::date)
);

-- ---------------------------------------------------------------------------
-- 4. jar_month_close_runs — month-close orchestration records
-- ---------------------------------------------------------------------------
create table if not exists public.jar_month_close_runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null,
  status text not null default 'draft',
  preview_json jsonb not null default '{}'::jsonb,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint jar_month_close_runs_unique unique (household_id, month),
  constraint jar_month_close_runs_month_check check (month = date_trunc('month', month)::date),
  constraint jar_month_close_runs_status_check check (status in ('draft', 'processing', 'approved', 'failed'))
);

-- Add FK from snapshots to close runs after both tables exist
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jar_monthly_snapshots_close_run_fk'
  ) then
    alter table public.jar_monthly_snapshots
      add constraint jar_monthly_snapshots_close_run_fk
      foreign key (source_close_run_id)
      references public.jar_month_close_runs(id)
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. jar_household_policies — per-household budgeting policies
-- ---------------------------------------------------------------------------
create table if not exists public.jar_household_policies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  overspend_policy text not null default 'warn',
  income_auto_allocate text not null default 'off',
  expense_auto_allocate text not null default 'off',
  month_close_mode text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_household_policies_unique unique (household_id),
  constraint jar_household_policies_overspend_check check (overspend_policy in ('warn', 'block', 'allow_negative')),
  constraint jar_household_policies_income_check check (income_auto_allocate in ('off', 'suggest', 'auto_high_confidence')),
  constraint jar_household_policies_expense_check check (expense_auto_allocate in ('off', 'auto_mapped_only')),
  constraint jar_household_policies_close_mode_check check (month_close_mode in ('manual', 'assisted'))
);

-- ---------------------------------------------------------------------------
-- 6. Enhance jar_movements — movement_type, idempotency, reversal support
-- ---------------------------------------------------------------------------
alter table public.jar_movements
  add column if not exists movement_type text,
  add column if not exists idempotency_key text,
  add column if not exists reversed_by uuid references public.jar_movements(id) on delete set null,
  add column if not exists reversal_reason text;

-- Validate movement_type values for new rows (existing rows remain unvalidated)
alter table public.jar_movements
  add constraint jar_movements_type_check check (
    movement_type is null or movement_type in (
      'allocation_income',
      'allocation_manual',
      'expense_spend',
      'jar_transfer_out',
      'jar_transfer_in',
      'rollover_carry_forward',
      'rollover_sweep_out',
      'rollover_sweep_in',
      'overspend_cover_out',
      'overspend_cover_in',
      'correction_in',
      'correction_out',
      'snapshot_opening'
    )
  ) not valid;

-- Unique idempotency key per household (partial index for non-null keys)
create unique index if not exists jar_movements_idempotency_key_idx
  on public.jar_movements(household_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 7. Add priority to jar_month_plans
-- ---------------------------------------------------------------------------
alter table public.jar_month_plans
  add column if not exists priority integer not null default 100;

-- ---------------------------------------------------------------------------
-- 8. Backfill jar_category_rules from legacy sources
-- ---------------------------------------------------------------------------

-- 8a. Backfill from active v2 jar_rules (expense_category rules)
insert into public.jar_category_rules (
  household_id,
  category_id,
  jar_id,
  assignment_type,
  confidence,
  is_active,
  created_by,
  created_at,
  updated_at
)
select
  jr.household_id,
  jr.category_id,
  jr.jar_id,
  'auto_migrated_v2_rule',
  jr.confidence,
  jr.is_active,
  jr.created_by,
  jr.created_at,
  jr.updated_at
from public.jar_rules jr
where jr.rule_type = 'expense_category'
  and jr.category_id is not null
  and jr.is_active = true
  and not exists (
    select 1 from public.jar_category_rules jcr
    where jcr.household_id = jr.household_id
      and jcr.category_id = jr.category_id
  )
on conflict (household_id, category_id) do nothing;

-- 8b. Backfill from legacy spending_jar_category_map where no v2 rule exists
--     Join through jar_definitions.slug = jars.slug to resolve jar_id
insert into public.jar_category_rules (
  household_id,
  category_id,
  jar_id,
  assignment_type,
  confidence,
  is_active,
  created_by,
  created_at,
  updated_at
)
select
  sm.household_id,
  sm.category_id,
  j.id as jar_id,
  'auto_migrated_legacy_spending',
  'high',
  true,
  sm.created_by,
  sm.created_at,
  sm.updated_at
from public.spending_jar_category_map sm
join public.jar_definitions jd on jd.id = sm.jar_id
join public.jars j on j.household_id = sm.household_id and j.slug = jd.slug
where not exists (
  select 1 from public.jar_category_rules jcr
  where jcr.household_id = sm.household_id
    and jcr.category_id = sm.category_id
)
  and j.is_archived = false
  and j.deleted_at is null
on conflict (household_id, category_id) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_jar_category_rules_lookup
  on public.jar_category_rules(household_id, category_id)
  where is_active = true;

create index if not exists idx_jar_category_rules_jar
  on public.jar_category_rules(household_id, jar_id)
  where is_active = true;

create index if not exists idx_jar_events_household_time
  on public.jar_events(household_id, occurred_at desc);

create index if not exists idx_jar_events_jar_time
  on public.jar_events(jar_id, occurred_at desc)
  where jar_id is not null;

create index if not exists idx_jar_monthly_snapshots_household_month
  on public.jar_monthly_snapshots(household_id, month);

create index if not exists idx_jar_monthly_snapshots_jar_month
  on public.jar_monthly_snapshots(jar_id, month);

create index if not exists idx_jar_month_close_runs_household_status
  on public.jar_month_close_runs(household_id, status);

create index if not exists idx_jar_movements_household_month_type
  on public.jar_movements(household_id, month, movement_type)
  where movement_type is not null;

create index if not exists idx_jar_movements_jar_month_type
  on public.jar_movements(jar_id, month, movement_type)
  where movement_type is not null;

-- ---------------------------------------------------------------------------
-- 10. Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists trg_jar_category_rules_set_updated_at on public.jar_category_rules;
create trigger trg_jar_category_rules_set_updated_at
  before update on public.jar_category_rules
  for each row execute function public.set_updated_at();

drop trigger if exists trg_jar_household_policies_set_updated_at on public.jar_household_policies;
create trigger trg_jar_household_policies_set_updated_at
  before update on public.jar_household_policies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. RLS
-- ---------------------------------------------------------------------------
alter table public.jar_category_rules enable row level security;
alter table public.jar_events enable row level security;
alter table public.jar_monthly_snapshots enable row level security;
alter table public.jar_month_close_runs enable row level security;
alter table public.jar_household_policies enable row level security;

-- jar_category_rules
drop policy if exists jar_category_rules_select_policy on public.jar_category_rules;
create policy jar_category_rules_select_policy
  on public.jar_category_rules for select
  using (public.check_household_access(household_id));

drop policy if exists jar_category_rules_insert_policy on public.jar_category_rules;
create policy jar_category_rules_insert_policy
  on public.jar_category_rules for insert
  with check (public.check_household_access(household_id));

drop policy if exists jar_category_rules_update_policy on public.jar_category_rules;
create policy jar_category_rules_update_policy
  on public.jar_category_rules for update
  using (public.check_household_access(household_id))
  with check (public.check_household_access(household_id));

drop policy if exists jar_category_rules_delete_policy on public.jar_category_rules;
create policy jar_category_rules_delete_policy
  on public.jar_category_rules for delete
  using (public.check_household_access(household_id));

-- jar_events (append-only for members; only service_role can insert programmatically)
drop policy if exists jar_events_select_policy on public.jar_events;
create policy jar_events_select_policy
  on public.jar_events for select
  using (public.check_household_access(household_id));

drop policy if exists jar_events_insert_policy on public.jar_events;
create policy jar_events_insert_policy
  on public.jar_events for insert
  with check (public.check_household_access(household_id));

-- jar_monthly_snapshots (read-only for members after close)
drop policy if exists jar_monthly_snapshots_select_policy on public.jar_monthly_snapshots;
create policy jar_monthly_snapshots_select_policy
  on public.jar_monthly_snapshots for select
  using (public.check_household_access(household_id));

drop policy if exists jar_monthly_snapshots_insert_policy on public.jar_monthly_snapshots;
create policy jar_monthly_snapshots_insert_policy
  on public.jar_monthly_snapshots for insert
  with check (public.check_household_access(household_id));

-- jar_month_close_runs
drop policy if exists jar_month_close_runs_select_policy on public.jar_month_close_runs;
create policy jar_month_close_runs_select_policy
  on public.jar_month_close_runs for select
  using (public.check_household_access(household_id));

drop policy if exists jar_month_close_runs_insert_policy on public.jar_month_close_runs;
create policy jar_month_close_runs_insert_policy
  on public.jar_month_close_runs for insert
  with check (public.check_household_access(household_id));

drop policy if exists jar_month_close_runs_update_policy on public.jar_month_close_runs;
create policy jar_month_close_runs_update_policy
  on public.jar_month_close_runs for update
  using (public.check_household_access(household_id))
  with check (public.check_household_access(household_id));

-- jar_household_policies
drop policy if exists jar_household_policies_select_policy on public.jar_household_policies;
create policy jar_household_policies_select_policy
  on public.jar_household_policies for select
  using (public.check_household_access(household_id));

drop policy if exists jar_household_policies_insert_policy on public.jar_household_policies;
create policy jar_household_policies_insert_policy
  on public.jar_household_policies for insert
  with check (public.check_household_access(household_id));

drop policy if exists jar_household_policies_update_policy on public.jar_household_policies;
create policy jar_household_policies_update_policy
  on public.jar_household_policies for update
  using (public.check_household_access(household_id))
  with check (public.check_household_access(household_id));
