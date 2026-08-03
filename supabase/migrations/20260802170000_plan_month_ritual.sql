-- ST-E05-004: Month Ritual runs — Assisted preview → approve → lock (AC-008, AC-009)

create table if not exists public.month_ritual_runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  -- First day of the ritual period (UTC month)
  period_month date not null,
  status text not null default 'draft',
  mode text not null default 'assisted',
  preview_json jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  correction_note text,
  corrected_by uuid references auth.users(id) on delete set null,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint month_ritual_runs_unique unique (household_id, period_month),
  constraint month_ritual_runs_month_check
    check (period_month = date_trunc('month', period_month)::date),
  constraint month_ritual_runs_status_check
    check (status in ('draft', 'previewed', 'approved', 'corrected')),
  constraint month_ritual_runs_mode_check
    check (mode in ('assisted', 'auto', 'manual'))
);

create index if not exists month_ritual_runs_household_status_idx
  on public.month_ritual_runs (household_id, status, period_month desc);

alter table public.month_ritual_runs enable row level security;

drop policy if exists month_ritual_runs_select_member on public.month_ritual_runs;
create policy month_ritual_runs_select_member on public.month_ritual_runs
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists month_ritual_runs_insert_member on public.month_ritual_runs;
create policy month_ritual_runs_insert_member on public.month_ritual_runs
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists month_ritual_runs_update_member on public.month_ritual_runs;
create policy month_ritual_runs_update_member on public.month_ritual_runs
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update on public.month_ritual_runs to authenticated;

-- BR-08: approved ritual locks normal plan movements for that period
create or replace function public.is_month_ritual_locked(
  p_household_id uuid,
  p_period_month date default date_trunc('month', timezone('utc', now()))::date
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.month_ritual_runs r
    where r.household_id = p_household_id
      and r.period_month = date_trunc('month', p_period_month)::date
      and r.status = 'approved'
  );
$$;

revoke all on function public.is_month_ritual_locked(uuid, date) from public;
grant execute on function public.is_month_ritual_locked(uuid, date) to authenticated;
