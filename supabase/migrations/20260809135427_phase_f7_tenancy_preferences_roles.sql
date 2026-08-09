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

create policy household_configuration_events_select_member
  on public.household_configuration_events
  for select to authenticated
  using (public.is_household_member(household_id));

grant select on public.household_configuration_events to authenticated;

create or replace function public.update_household_preferences(
  p_locale text,
  p_timezone text,
  p_base_currency text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_before record;
  v_locale text := trim(coalesce(p_locale, ''));
  v_timezone text := trim(coalesce(p_timezone, ''));
  v_currency text := upper(trim(coalesce(p_base_currency, '')));
begin
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
  if v_locale not in ('en-VN', 'vi-VN') then
    raise exception 'Invalid locale';
  end if;
  if v_timezone <> 'Asia/Ho_Chi_Minh' then
    raise exception 'Invalid timezone';
  end if;
  if v_currency <> 'VND' then
    raise exception 'Invalid base currency';
  end if;

  select h.locale, h.timezone, h.base_currency
  into v_before
  from public.households h
  where h.id = v_household_id
  for update;

  if not found then
    raise exception 'Household not found';
  end if;

  if v_before.locale = v_locale
    and v_before.timezone = v_timezone
    and v_before.base_currency = v_currency then
    return v_household_id;
  end if;

  update public.households
  set locale = v_locale,
      timezone = v_timezone,
      base_currency = v_currency,
      updated_at = now()
  where id = v_household_id;

  insert into public.household_configuration_events (
    household_id,
    actor_user_id,
    event_type,
    payload
  ) values (
    v_household_id,
    v_user_id,
    'preferences.updated',
    jsonb_build_object(
      'before', jsonb_build_object(
        'locale', v_before.locale,
        'timezone', v_before.timezone,
        'base_currency', v_before.base_currency
      ),
      'after', jsonb_build_object(
        'locale', v_locale,
        'timezone', v_timezone,
        'base_currency', v_currency
      )
    )
  );

  return v_household_id;
end;
$$;

revoke all on function public.update_household_preferences(text, text, text)
  from public;
grant execute on function public.update_household_preferences(text, text, text)
  to authenticated;

create or replace function public.change_household_member_role(
  p_membership_id uuid,
  p_role text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_target public.household_members%rowtype;
  v_role text := lower(trim(coalesce(p_role, '')));
begin
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
  if v_role not in ('partner', 'admin') then
    raise exception 'Invalid household role';
  end if;

  select * into v_target
  from public.household_members hm
  where hm.id = p_membership_id
    and hm.household_id = v_household_id
    and hm.is_active = true
  for update;

  if not found then
    raise exception 'Member not found';
  end if;
  if v_target.role = v_role then
    return true;
  end if;

  update public.household_members
  set role = v_role,
      updated_at = now()
  where id = v_target.id;

  insert into public.household_configuration_events (
    household_id,
    actor_user_id,
    target_membership_id,
    event_type,
    payload
  ) values (
    v_household_id,
    v_user_id,
    v_target.id,
    'role.changed',
    jsonb_build_object(
      'before_role', v_target.role,
      'after_role', v_role
    )
  );

  return true;
end;
$$;

revoke all on function public.change_household_member_role(uuid, text)
  from public;
grant execute on function public.change_household_member_role(uuid, text)
  to authenticated;
