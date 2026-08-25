-- Together household capacity increase.
-- Keep invitation creation and acceptance serialized by the existing household
-- row lock while raising the active-member limit from two to ten.

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
  if exists (
    select 1 from public.household_invitations i
    where i.household_id = v_household_id
      and i.status = 'pending'
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
$$;

create or replace function public.accept_household_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_household_id uuid;
  v_invite public.household_invitations%rowtype;
  v_existing public.household_members%rowtype;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  select u.email into v_email from auth.users u where u.id = v_user_id;
  if v_email is null then
    raise exception 'Email required';
  end if;

  -- Lock the household before the invitation and membership rows. Every
  -- capacity-changing lifecycle path takes this lock in the same order.
  select i.household_id into v_household_id
  from public.household_invitations i
  where i.token = p_token;
  if not found then
    raise exception 'Invitation not found';
  end if;
  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_invite
  from public.household_invitations i
  where i.token = p_token
  for update;
  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'Invitation not pending';
  end if;
  if v_invite.expires_at <= now() then
    update public.household_invitations
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    raise exception 'Invitation expired';
  end if;
  if lower(v_invite.email) <> lower(v_email) then
    raise exception 'Email mismatch';
  end if;
  if exists (
    select 1 from public.household_members hm
    where hm.user_id = v_user_id and hm.is_active = true
  ) then
    raise exception 'User already belongs to a household';
  end if;

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_invite.household_id and hm.is_active = true;
  if v_member_count >= 10 then
    raise exception 'Household is full';
  end if;

  select * into v_existing
  from public.household_members hm
  where hm.household_id = v_invite.household_id and hm.user_id = v_user_id
  for update;

  if found then
    update public.household_members
    set role = 'partner', is_active = true, joined_at = now(), left_at = null,
        removed_by = null, email = lower(v_email), updated_at = now()
    where id = v_existing.id;
  else
    insert into public.household_members (
      household_id, user_id, role, is_active, email
    ) values (
      v_invite.household_id, v_user_id, 'partner', true, lower(v_email)
    );
  end if;

  update public.household_invitations
  set status = 'accepted', accepted_by = v_user_id, updated_at = now()
  where id = v_invite.id;
  return v_invite.household_id;
end;
$$;;
