-- PLAN 05: Jar rollover mode and period budget adjustments.
-- capacity_delta remains only for V1 migration/history compatibility; V2 uses
-- jar_period_adjustments as its period-scoped source of truth.
alter table public.jars
  add column if not exists rollover_mode text not null default 'reset';
alter table public.jars
  drop constraint if exists jars_rollover_mode_check;
alter table public.jars
  add constraint jars_rollover_mode_check
  check (rollover_mode in ('reset', 'carry'));
comment on column public.jars.rollover_mode is
  'Plan V2: reset = rule only next month; carry = rule + unused remaining. Not a bank balance.';
comment on column public.jars.capacity_delta is
  'Deprecated V1 compatibility field. Plan V2 runtime never reads or writes this field; migration history may convert it once into jar_period_adjustments.';
update public.jars
set rollover_mode = 'carry'
where kind in ('buffer', 'savings')
  and rollover_mode = 'reset';

create table if not exists public.jar_period_adjustments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete cascade,
  period_month date not null,
  amount numeric(18, 0) not null,
  plan_movement_id uuid null references public.plan_movements(id) on delete set null,
  note text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint jar_period_adjustments_period_month_check
    check (period_month = date_trunc('month', period_month)::date)
);
create index if not exists jar_period_adjustments_jar_period_idx
  on public.jar_period_adjustments (household_id, jar_id, period_month);
create index if not exists jar_period_adjustments_period_idx
  on public.jar_period_adjustments (household_id, period_month);
comment on table public.jar_period_adjustments is
  'Plan V2 signed period budget adjustments (virtual). Replaces unbounded live capacity_delta meaning.';
alter table public.jar_period_adjustments enable row level security;
drop policy if exists jar_period_adjustments_select_member on public.jar_period_adjustments;
create policy jar_period_adjustments_select_member
  on public.jar_period_adjustments
  for select to authenticated
  using (public.is_household_member(household_id));
drop policy if exists jar_period_adjustments_insert_member on public.jar_period_adjustments;
create policy jar_period_adjustments_insert_member
  on public.jar_period_adjustments
  for insert to authenticated
  with check (public.is_household_member(household_id));

-- Convert each non-zero legacy value once into the household-local current period.
insert into public.jar_period_adjustments (
  household_id,
  jar_id,
  period_month,
  amount,
  note
)
select
  j.household_id,
  j.id,
  date_trunc(
    'month',
    timezone(coalesce(nullif(h.timezone, ''), 'Asia_Ho_Chi_Minh'), now())
  )::date,
  j.capacity_delta,
  'migrated_from_capacity_delta'
from public.jars j
join public.households h on h.id = j.household_id
where j.capacity_delta <> 0
  and not exists (
    select 1
    from public.jar_period_adjustments a
    where a.jar_id = j.id
      and a.period_month = date_trunc(
        'month',
        timezone(coalesce(nullif(h.timezone, ''), 'Asia_Ho_Chi_Minh'), now())
      )::date
      and a.note = 'migrated_from_capacity_delta'
  );
