-- PLAN 07/08: Monthly Review status semantics and historical Goal snapshots.
-- Jar rule snapshots are defined by the earlier rollover/adjustment migration;
-- this migration owns Review metadata and Goal snapshot history only.
alter table public.month_ritual_runs
  add column if not exists review_status text;
comment on column public.month_ritual_runs.review_status is
  'Plan V2 optional review mark: not_started | viewed | marked_reviewed. Never locks Plan.';
update public.month_ritual_runs
set review_status = case
  when status in ('approved', 'pending_review') then 'marked_reviewed'
  when status = 'previewed' then 'viewed'
  else 'not_started'
end
where review_status is null;
alter table public.month_ritual_runs
  alter column review_status set default 'not_started';
alter table public.month_ritual_runs
  drop constraint if exists month_ritual_runs_review_status_check;
alter table public.month_ritual_runs
  add constraint month_ritual_runs_review_status_check
  check (review_status in ('not_started', 'viewed', 'marked_reviewed'));

create table if not exists public.goal_period_funded_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  period_month date not null,
  funded_amount numeric(18, 0) not null default 0,
  created_at timestamptz not null default now(),
  constraint goal_period_funded_snapshots_unique unique (goal_id, period_month)
);
alter table public.goal_period_funded_snapshots enable row level security;
drop policy if exists goal_period_funded_snapshots_select_member on public.goal_period_funded_snapshots;
create policy goal_period_funded_snapshots_select_member
  on public.goal_period_funded_snapshots
  for select
  to authenticated
  using (public.is_household_member(household_id));
drop policy if exists goal_period_funded_snapshots_insert_member on public.goal_period_funded_snapshots;
create policy goal_period_funded_snapshots_insert_member
  on public.goal_period_funded_snapshots
  for insert
  to authenticated
  with check (public.is_household_member(household_id));
comment on table public.goal_period_funded_snapshots is
  'Historical Goal funding report values. Linked Goal values are derived at capture time; this table is not a live source of truth.';
;
