-- 14F deployment repair: role transfer preserves the existing tenancy
-- configuration event contract even when the legacy table is absent remotely.

create table if not exists public.household_configuration_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_membership_id uuid references public.household_members(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint household_configuration_events_type_check
    check (event_type in ('preferences.updated', 'role.changed'))
);
create index if not exists idx_household_configuration_events_household_created
  on public.household_configuration_events (household_id, created_at desc);
alter table public.household_configuration_events enable row level security;
drop policy if exists household_configuration_events_select_member
  on public.household_configuration_events;
create policy household_configuration_events_select_member
  on public.household_configuration_events
  for select to authenticated
  using (public.is_household_member(household_id));
grant select on public.household_configuration_events to authenticated;
