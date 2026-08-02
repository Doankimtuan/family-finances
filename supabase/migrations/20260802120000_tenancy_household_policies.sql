-- ST-E03-003: Partner-visible household policy updates + audit (AC-007, AC-009, AC-013, AC-020)

create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
      and hm.role = 'admin'
  );
$$;

revoke all on function public.is_household_admin(uuid) from public;
grant execute on function public.is_household_admin(uuid) to authenticated;

create table if not exists public.household_policy_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null default 'policy.updated',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint household_policy_events_type_check
    check (event_type in ('policy.updated'))
);

create index if not exists idx_household_policy_events_household_created
  on public.household_policy_events (household_id, created_at desc);

alter table public.household_policy_events enable row level security;

create policy household_policy_events_select_member on public.household_policy_events
  for select to authenticated
  using (public.is_household_member(household_id));

grant select on public.household_policy_events to authenticated;

-- Members may still read households; policy mutations go through admin RPC.
drop policy if exists households_update_member on public.households;

create or replace function public.update_household_policies(
  p_overspend_policy text,
  p_month_close_mode text,
  p_income_allocate_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_before record;
  v_overspend text;
  v_month_close text;
  v_income text;
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
    raise exception 'No active household';
  end if;

  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  v_overspend := lower(trim(coalesce(p_overspend_policy, '')));
  v_month_close := lower(trim(coalesce(p_month_close_mode, '')));
  v_income := lower(trim(coalesce(p_income_allocate_mode, '')));

  if v_overspend not in ('warn', 'block', 'allow_negative') then
    raise exception 'Invalid overspend policy';
  end if;
  if v_month_close not in ('assisted', 'auto', 'manual') then
    raise exception 'Invalid month close mode';
  end if;
  if v_income not in ('off', 'suggest', 'auto') then
    raise exception 'Invalid income allocate mode';
  end if;

  select
    h.overspend_policy,
    h.month_close_mode,
    h.income_allocate_mode
  into v_before
  from public.households h
  where h.id = v_household_id
  for update;

  if not found then
    raise exception 'Household not found';
  end if;

  if v_before.overspend_policy = v_overspend
    and v_before.month_close_mode = v_month_close
    and v_before.income_allocate_mode = v_income then
    return v_household_id;
  end if;

  update public.households
  set
    overspend_policy = v_overspend,
    month_close_mode = v_month_close,
    income_allocate_mode = v_income,
    updated_at = now()
  where id = v_household_id;

  insert into public.household_policy_events (
    household_id,
    actor_user_id,
    event_type,
    payload
  ) values (
    v_household_id,
    v_user_id,
    'policy.updated',
    jsonb_build_object(
      'before', jsonb_build_object(
        'overspend_policy', v_before.overspend_policy,
        'month_close_mode', v_before.month_close_mode,
        'income_allocate_mode', v_before.income_allocate_mode
      ),
      'after', jsonb_build_object(
        'overspend_policy', v_overspend,
        'month_close_mode', v_month_close,
        'income_allocate_mode', v_income
      )
    )
  );

  return v_household_id;
end;
$$;

revoke all on function public.update_household_policies(text, text, text) from public;
grant execute on function public.update_household_policies(text, text, text) to authenticated;
