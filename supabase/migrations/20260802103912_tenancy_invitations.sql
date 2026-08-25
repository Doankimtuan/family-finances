-- ST-E03-002: Household invitations + member email snapshots (REQ-012, AC-012, AC-020)

alter table public.household_members
  add column if not exists email text,
  add column if not exists display_name text;

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_invitations_email_not_blank check (length(trim(email)) > 2),
  constraint household_invitations_status_check
    check (status in ('pending', 'accepted', 'revoked', 'expired', 'declined'))
);

create index if not exists idx_household_invitations_household_status
  on public.household_invitations (household_id, status);

create index if not exists idx_household_invitations_email_lower
  on public.household_invitations (lower(email));

create unique index if not exists household_invitations_one_pending_email_per_household
  on public.household_invitations (household_id, lower(email))
  where status = 'pending';

update public.household_members hm
set email = u.email
from auth.users u
where hm.user_id = u.id
  and hm.email is null
  and u.email is not null;

create or replace function public.create_household_with_essentials(
  p_name text,
  p_account_name text default 'Cash',
  p_plan_preset text default 'balanced',
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
  v_account_name text;
  v_preset text;
  v_email text;
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

  select u.email into v_email from auth.users u where u.id = v_user_id;

  v_account_name := nullif(trim(coalesce(p_account_name, '')), '');
  if v_account_name is null then
    v_account_name := 'Cash';
  end if;

  v_preset := lower(trim(coalesce(p_plan_preset, 'balanced')));
  if v_preset not in ('balanced', 'simple') then
    v_preset := 'balanced';
  end if;

  insert into public.households (
    name,
    base_currency,
    locale,
    timezone,
    overspend_policy,
    month_close_mode,
    income_allocate_mode,
    created_by
  ) values (
    trim(p_name),
    coalesce(p_base_currency, 'VND'),
    coalesce(nullif(trim(p_locale), ''), 'en-VN'),
    coalesce(nullif(trim(p_timezone), ''), 'Asia/Ho_Chi_Minh'),
    'warn',
    'assisted',
    'suggest',
    v_user_id
  )
  returning id into v_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    is_active,
    email
  ) values (
    v_household_id,
    v_user_id,
    'admin',
    true,
    v_email
  );

  insert into public.accounts (
    household_id,
    name,
    type,
    created_by
  ) values (
    v_household_id,
    v_account_name,
    'cash',
    v_user_id
  );

  if v_preset = 'simple' then
    insert into public.jars (household_id, name, kind, sort_order) values
      (v_household_id, 'Needs', 'spending', 1),
      (v_household_id, 'Wants', 'spending', 2),
      (v_household_id, 'Savings', 'savings', 3);
  else
    insert into public.jars (household_id, name, kind, sort_order) values
      (v_household_id, 'Essentials', 'spending', 1),
      (v_household_id, 'Lifestyle', 'spending', 2),
      (v_household_id, 'Buffer', 'buffer', 3),
      (v_household_id, 'Savings', 'savings', 4);
  end if;

  return v_household_id;
end;
$$;

create or replace function public.create_household_invitation(p_email text)
returns table (invitation_id uuid, token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_email text;
  v_member_count int;
  v_expires timestamptz;
  v_id uuid;
  v_token uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
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

  if v_member_count >= 2 then
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

  if exists (
    select 1
    from public.household_invitations i
    where i.household_id = v_household_id
      and i.status = 'pending'
      and lower(i.email) = v_email
  ) then
    raise exception 'Invite already pending';
  end if;

  v_expires := now() + interval '7 days';

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
    'pending',
    v_expires
  )
  returning id, token, expires_at
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
  v_user_id uuid;
  v_household_id uuid;
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

  update public.household_invitations i
  set status = 'revoked',
      updated_at = now()
  where i.id = p_invitation_id
    and i.household_id = v_household_id
    and i.status = 'pending';

  if not found then
    raise exception 'Invitation not found';
  end if;

  return true;
end;
$$;

create or replace function public.get_invitation_preview(p_token uuid)
returns table (
  household_name text,
  invite_email text,
  status text,
  expires_at timestamptz,
  is_expired boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    h.name,
    i.email,
    i.status,
    i.expires_at,
    (i.expires_at <= now() or i.status = 'expired') as is_expired
  from public.household_invitations i
  join public.households h on h.id = i.household_id
  where i.token = p_token
  limit 1;
end;
$$;

create or replace function public.accept_household_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_invite public.household_invitations%rowtype;
  v_member_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email into v_email from auth.users u where u.id = v_user_id;
  if v_email is null then
    raise exception 'Email required';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.user_id = v_user_id
      and hm.is_active = true
  ) then
    raise exception 'User already belongs to a household';
  end if;

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

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_invite.household_id
    and hm.is_active = true;

  if v_member_count >= 2 then
    raise exception 'Household already has two partners';
  end if;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    is_active,
    email
  ) values (
    v_invite.household_id,
    v_user_id,
    'partner',
    true,
    lower(v_email)
  );

  update public.household_invitations
  set status = 'accepted',
      accepted_by = v_user_id,
      updated_at = now()
  where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

create or replace function public.decline_household_invitation(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_invite public.household_invitations%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email into v_email from auth.users u where u.id = v_user_id;

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

  if v_email is null or lower(v_invite.email) <> lower(v_email) then
    raise exception 'Email mismatch';
  end if;

  update public.household_invitations
  set status = 'declined',
      updated_at = now()
  where id = v_invite.id;

  return true;
end;
$$;

revoke all on function public.create_household_invitation(text) from public;
revoke all on function public.revoke_household_invitation(uuid) from public;
revoke all on function public.get_invitation_preview(uuid) from public;
revoke all on function public.accept_household_invitation(uuid) from public;
revoke all on function public.decline_household_invitation(uuid) from public;

grant execute on function public.create_household_invitation(text) to authenticated;
grant execute on function public.revoke_household_invitation(uuid) to authenticated;
grant execute on function public.get_invitation_preview(uuid) to authenticated, anon;
grant execute on function public.accept_household_invitation(uuid) to authenticated;
grant execute on function public.decline_household_invitation(uuid) to authenticated;

alter table public.household_invitations enable row level security;

create policy household_invitations_select_member on public.household_invitations
  for select to authenticated
  using (
    public.is_household_member(household_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

grant select on public.household_invitations to authenticated;;
