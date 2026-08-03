-- ST-E05-002: Jar Active|Paused|Archived state + jar_plans (AC-003, AC-004, BR-03, BR-04)

alter table public.jars
  add column if not exists is_paused boolean not null default false;

comment on column public.jars.is_paused is
  'Paused jars are non-targets for allocation (BR-03). Archived wins over paused.';

create index if not exists jars_household_active_idx
  on public.jars (household_id, sort_order)
  where is_archived = false and is_paused = false;

create table if not exists public.jar_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete cascade,
  plan_kind text not null default 'percent',
  percent_bps int not null default 0,
  fixed_amount numeric(18, 0) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jar_plans_kind_check check (plan_kind in ('percent', 'fixed')),
  constraint jar_plans_percent_bps_check check (percent_bps >= 0 and percent_bps <= 10000),
  constraint jar_plans_fixed_amount_check check (fixed_amount >= 0),
  constraint jar_plans_jar_unique unique (jar_id)
);

create index if not exists jar_plans_household_idx
  on public.jar_plans (household_id);

alter table public.jar_plans enable row level security;

drop policy if exists jar_plans_select_member on public.jar_plans;
create policy jar_plans_select_member on public.jar_plans
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists jar_plans_insert_member on public.jar_plans;
create policy jar_plans_insert_member on public.jar_plans
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists jar_plans_update_member on public.jar_plans;
create policy jar_plans_update_member on public.jar_plans
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists jar_plans_delete_member on public.jar_plans;
create policy jar_plans_delete_member on public.jar_plans
  for delete to authenticated
  using (public.is_household_member(household_id));

grant select, insert, update, delete on public.jar_plans to authenticated;

-- BR-03: allocation targets must be Active (not paused, not archived)
create or replace function public.enforce_active_jar_on_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.jar_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.jars j
    where j.id = new.jar_id
      and j.household_id = new.household_id
      and j.is_archived = false
      and j.is_paused = false
  ) then
    raise exception 'Invalid jar';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_transactions_active_jar on public.transactions;
create trigger trg_transactions_active_jar
  before insert or update of jar_id on public.transactions
  for each row
  execute function public.enforce_active_jar_on_transaction();

-- Seed Suggest-friendly default percent plans for existing jars without a plan
insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps, fixed_amount)
select
  j.household_id,
  j.id,
  'percent',
  case lower(j.name)
    when 'essentials' then 5000
    when 'needs' then 5000
    when 'lifestyle' then 3000
    when 'wants' then 3000
    when 'buffer' then 1000
    when 'savings' then 1000
    else
      case j.kind
        when 'spending' then 2500
        when 'buffer' then 1000
        when 'savings' then 2000
        else 0
      end
  end,
  0
from public.jars j
where not exists (
  select 1 from public.jar_plans jp where jp.jar_id = j.id
)
on conflict (jar_id) do nothing;

-- Onboard seeds jar_plans after jars (Suggest default at household already)
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

  v_account_name := nullif(trim(coalesce(p_account_name, '')), '');
  if v_account_name is null then
    v_account_name := 'Cash';
  end if;

  v_preset := lower(trim(coalesce(p_plan_preset, 'balanced')));
  if v_preset not in ('balanced', 'simple') then
    v_preset := 'balanced';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = v_user_id;

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

    insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps)
    select v_household_id, j.id, 'percent',
      case j.name
        when 'Needs' then 5000
        when 'Wants' then 3000
        when 'Savings' then 2000
        else 0
      end
    from public.jars j
    where j.household_id = v_household_id;
  else
    insert into public.jars (household_id, name, kind, sort_order) values
      (v_household_id, 'Essentials', 'spending', 1),
      (v_household_id, 'Lifestyle', 'spending', 2),
      (v_household_id, 'Buffer', 'buffer', 3),
      (v_household_id, 'Savings', 'savings', 4);

    insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps)
    select v_household_id, j.id, 'percent',
      case j.name
        when 'Essentials' then 5000
        when 'Lifestyle' then 3000
        when 'Buffer' then 1000
        when 'Savings' then 1000
        else 0
      end
    from public.jars j
    where j.household_id = v_household_id;
  end if;

  return v_household_id;
end;
$$;

revoke all on function public.create_household_with_essentials(text, text, text, char, text, text) from public;
grant execute on function public.create_household_with_essentials(text, text, text, char, text, text)
  to authenticated;
