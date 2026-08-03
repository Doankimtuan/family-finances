-- Fix: expired pending invites must not block re-invite (ST-E03).
-- create_household_invitation previously matched status=pending only.

create or replace function public.create_household_invitation(p_email text)
returns table (invitation_id uuid, token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_household_id uuid;
  v_member_count int;
  v_id uuid;
  v_token uuid;
  v_expires timestamptz;
  c_invite_ttl interval := interval '7 days';
  c_status_pending text := 'pending';
  c_status_expired text := 'expired';
  c_max_partners int := 2;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_email := lower(trim(p_email));
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Invalid email';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'No active household';
  end if;

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_household_id
    and hm.is_active = true;

  if v_member_count >= c_max_partners then
    raise exception 'Household already has two partners';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.household_id = v_household_id
      and hm.is_active = true
      and lower(coalesce(hm.email, '')) = v_email
  ) then
    raise exception 'Email already a member';
  end if;

  -- Mark stale pending rows expired so they no longer block UX or re-invite.
  update public.household_invitations i
  set status = c_status_expired,
      updated_at = now()
  where i.household_id = v_household_id
    and i.status = c_status_pending
    and i.expires_at <= now()
    and lower(i.email) = v_email;

  if exists (
    select 1
    from public.household_invitations i
    where i.household_id = v_household_id
      and i.status = c_status_pending
      and i.expires_at > now()
      and lower(i.email) = v_email
  ) then
    raise exception 'Invite already pending';
  end if;

  v_expires := now() + c_invite_ttl;

  insert into public.household_invitations (
    household_id,
    email,
    invited_by,
    status,
    expires_at
  ) values (
    v_household_id,
    v_email,
    v_user_id,
    c_status_pending,
    v_expires
  )
  returning
    public.household_invitations.id,
    public.household_invitations.token,
    public.household_invitations.expires_at
  into v_id, v_token, v_expires;

  invitation_id := v_id;
  token := v_token;
  expires_at := v_expires;
  return next;
end;
$$;
