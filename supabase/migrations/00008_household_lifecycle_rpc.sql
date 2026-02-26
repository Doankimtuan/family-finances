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
