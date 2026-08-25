-- Expired pending invitations must not block a new invitation for the same email.
-- The list query intentionally excludes expired rows, so stale pending rows are
-- normalized before duplicate detection to keep write and read behavior aligned.

create or replace function public.create_household_invitation(p_email text)
returns table (invitation_id uuid, token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_member_count int;
  v_expires timestamptz;
  v_id uuid;
  v_token uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  -- The household lock serializes capacity checks with concurrent accepts.
  perform 1 from public.households h where h.id = v_household_id for update;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_household_id and hm.is_active = true;
  if v_member_count >= 10 then
    raise exception 'Household is full';
  end if;

  if exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id
      and hm.is_active = true
      and lower(coalesce(hm.email, '')) = v_email
  ) then
    raise exception 'Email already a member';
  end if;

  -- Expired rows are hidden from the pending list and must not block re-invite.
  update public.household_invitations i
  set status = 'expired', updated_at = now()
  where i.household_id = v_household_id
    and i.status = 'pending'
    and i.expires_at <= now()
    and lower(i.email) = v_email;

  if exists (
    select 1 from public.household_invitations i
    where i.household_id = v_household_id
      and i.status = 'pending'
      and i.expires_at > now()
      and lower(i.email) = v_email
  ) then
    raise exception 'Invite already pending';
  end if;

  v_expires := now() + interval '7 days';
  insert into public.household_invitations (
    household_id, email, invited_by, status, expires_at
  ) values (
    v_household_id, v_email, v_user_id, 'pending', v_expires
  )
  returning id, household_invitations.token, household_invitations.expires_at
  into v_id, v_token, v_expires;
  invitation_id := v_id;
  token := v_token;
  expires_at := v_expires;
  return next;
end;
$$;;
