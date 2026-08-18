-- PROMPT 14F — Together membership lifecycle.
--
-- Membership rows are historical ownership identities. Leaving/removing a
-- member deactivates the row, clears Inbox attention assigned to that user,
-- and never transfers or deletes personal financial resources.

alter table public.household_members
  add column if not exists left_at timestamptz,
  add column if not exists removed_by uuid references auth.users(id) on delete set null;

create index if not exists idx_household_members_household_active
  on public.household_members (household_id, is_active);

create or replace function public.prevent_owned_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.accounts where owner_membership_id = old.id)
    or exists (select 1 from public.savings where owner_membership_id = old.id)
    or exists (select 1 from public.investment_holdings where owner_membership_id = old.id)
    or exists (select 1 from public.loans where owner_membership_id = old.id)
    or exists (select 1 from public.liabilities where owner_membership_id = old.id)
    or exists (select 1 from public.goals where owner_membership_id = old.id)
  then
    raise exception 'Membership owns financial resources and cannot be deleted';
  end if;
  return old;
end;
$$;

drop trigger if exists household_members_prevent_owned_delete_trg
  on public.household_members;
create trigger household_members_prevent_owned_delete_trg
before delete on public.household_members
for each row execute function public.prevent_owned_membership_delete();

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
  if v_member_count >= 2 then
    raise exception 'Household already has two partners';
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

create or replace function public.revoke_household_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid() and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select i.status into v_status
  from public.household_invitations i
  where i.id = p_invitation_id and i.household_id = v_household_id
  for update;
  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_status = 'revoked' then
    return true;
  end if;
  if v_status <> 'pending' then
    raise exception 'Invitation not pending';
  end if;

  update public.household_invitations
  set status = 'revoked', updated_at = now()
  where id = p_invitation_id;
  return true;
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
  if v_member_count >= 2 then
    raise exception 'Household already has two partners';
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
$$;

create or replace function public.leave_household()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.household_members%rowtype;
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_member
  from public.household_members hm
  where hm.household_id = v_household_id and hm.user_id = v_user_id
    and hm.is_active = true
  for update;

  if v_member.role = 'admin' and not exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id
      and hm.is_active = true
      and hm.role = 'admin'
      and hm.id <> v_member.id
  ) then
    raise exception 'Admin continuity required before leaving';
  end if;

  update public.household_members
  set is_active = false, left_at = now(), removed_by = null, updated_at = now()
  where id = v_member.id;

  update public.inbox_items
  set assigned_to_user_id = null, updated_at = now()
  where household_id = v_household_id and assigned_to_user_id = v_user_id;
  return true;
end;
$$;

create or replace function public.remove_household_member(p_membership_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_actor public.household_members%rowtype;
  v_target public.household_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_actor
  from public.household_members hm
  where hm.household_id = v_household_id and hm.user_id = v_user_id
    and hm.is_active = true
  for update;
  if v_actor.role <> 'admin' then
    raise exception 'Admin role required';
  end if;

  select * into v_target
  from public.household_members hm
  where hm.id = p_membership_id and hm.household_id = v_household_id
    and hm.is_active = true
  for update;
  if not found or v_target.id = v_actor.id or v_target.role <> 'partner' then
    raise exception 'Member not found';
  end if;

  update public.household_members
  set is_active = false, left_at = now(), removed_by = v_user_id, updated_at = now()
  where id = v_target.id;

  update public.inbox_items
  set assigned_to_user_id = null, updated_at = now()
  where household_id = v_household_id and assigned_to_user_id = v_target.user_id;
  return true;
end;
$$;

-- Role changes may not create an active household with no Admin.
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
  where hm.user_id = v_user_id and hm.is_active = true
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
  where hm.id = p_membership_id and hm.household_id = v_household_id
    and hm.is_active = true
  for update;
  if not found then
    raise exception 'Member not found';
  end if;
  if v_target.role = v_role then
    return true;
  end if;
  if v_target.role = 'admin' and v_role = 'partner' and not exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id and hm.is_active = true
      and hm.role = 'admin' and hm.id <> v_target.id
  ) then
    raise exception 'Admin continuity required before changing role';
  end if;

  update public.household_members
  set role = v_role, updated_at = now()
  where id = v_target.id;

  insert into public.household_configuration_events (
    household_id, actor_user_id, target_membership_id, event_type, payload
  ) values (
    v_household_id, v_user_id, v_target.id, 'role.changed',
    jsonb_build_object(
      'before_role', v_target.role,
      'after_role', v_role
    )
  );
  return true;
end;
$$;

revoke all on function public.leave_household() from public;
revoke all on function public.remove_household_member(uuid) from public;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.remove_household_member(uuid) to authenticated;

comment on function public.leave_household() is
  'Deactivates the caller membership without deleting ownership identity or '
  'transferring personal resources. Admin continuity is required.';
comment on function public.remove_household_member(uuid) is
  'Admin-only Partner removal. Deactivates the membership and preserves all '
  'financial ownership rows for read-only historical visibility.';
