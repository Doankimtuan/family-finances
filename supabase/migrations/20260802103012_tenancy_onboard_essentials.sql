-- ST-E03-001: Tenancy essentials + seed tables for onboard ≤3 steps (REQ-012, REQ-014, BR-12)

create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency char(3) not null default 'VND',
  locale text not null default 'en-VN',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  overspend_policy text not null default 'warn',
  month_close_mode text not null default 'assisted',
  income_allocate_mode text not null default 'suggest',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_name_not_blank check (length(trim(name)) > 0),
  constraint households_overspend_policy_check
    check (overspend_policy in ('warn', 'block', 'allow_negative')),
  constraint households_month_close_mode_check
    check (month_close_mode in ('assisted', 'auto', 'manual')),
  constraint households_income_allocate_mode_check
    check (income_allocate_mode in ('off', 'suggest', 'auto'))
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_role_check check (role in ('partner', 'admin')),
  constraint household_members_unique unique (household_id, user_id)
);

create unique index if not exists household_members_one_active_per_user
  on public.household_members (user_id)
  where is_active = true;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  opening_balance numeric(18, 0) not null default 0,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_name_not_blank check (length(trim(name)) > 0),
  constraint accounts_type_check
    check (type in ('cash', 'checking', 'savings', 'ewallet', 'brokerage', 'other'))
);

create table if not exists public.jars (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  kind text not null default 'spending',
  sort_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jars_name_not_blank check (length(trim(name)) > 0),
  constraint jars_kind_check check (kind in ('spending', 'savings', 'buffer', 'income'))
);

create or replace function public.is_household_member(p_household_id uuid)
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
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

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
    is_active
  ) values (
    v_household_id,
    v_user_id,
    'admin',
    true
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

revoke all on function public.create_household_with_essentials(text, text, text, char, text, text) from public;
grant execute on function public.create_household_with_essentials(text, text, text, char, text, text)
  to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accounts enable row level security;
alter table public.jars enable row level security;

create policy households_select_member on public.households
  for select to authenticated
  using (public.is_household_member(id));

create policy households_update_member on public.households
  for update to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

create policy household_members_select_member on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

create policy accounts_select_member on public.accounts
  for select to authenticated
  using (public.is_household_member(household_id));

create policy accounts_insert_member on public.accounts
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy accounts_update_member on public.accounts
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy jars_select_member on public.jars
  for select to authenticated
  using (public.is_household_member(household_id));

create policy jars_insert_member on public.jars
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy jars_update_member on public.jars
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, update on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert, update on public.accounts to authenticated;
grant select, insert, update on public.jars to authenticated;
