-- ST-E05-003: Goals + recurring rules (AC-004, AC-006 / BR-04, BR-06)

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_amount numeric(18, 0) not null,
  funded_amount numeric(18, 0) not null default 0,
  target_date date,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_name_not_blank check (length(trim(name)) > 0),
  constraint goals_target_amount_positive check (target_amount > 0),
  constraint goals_funded_amount_nonnegative check (funded_amount >= 0),
  constraint goals_status_check check (status in ('active', 'paused', 'completed', 'cancelled'))
);

create index if not exists goals_household_status_idx
  on public.goals (household_id, status, created_at desc);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  -- BR-06: positive magnitude; direction is always contribute (inflow to intention)
  direction text not null default 'contribute',
  amount numeric(18, 0) not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint goal_contributions_direction_check check (direction in ('contribute')),
  constraint goal_contributions_amount_positive check (amount > 0 and amount = trunc(amount))
);

create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id, created_at desc);

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  -- BR-06: positive amount + explicit income|expense direction
  direction text not null,
  amount numeric(18, 0) not null,
  frequency text not null default 'monthly',
  interval_count int not null default 1,
  day_of_month int,
  day_of_week int,
  start_date date not null default (timezone('utc', now()))::date,
  next_run_date date,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_name_not_blank check (length(trim(name)) > 0),
  constraint recurring_rules_direction_check check (direction in ('income', 'expense')),
  constraint recurring_rules_amount_positive check (amount > 0 and amount = trunc(amount)),
  constraint recurring_rules_frequency_check check (frequency in ('weekly', 'monthly')),
  constraint recurring_rules_interval_positive check (interval_count > 0),
  constraint recurring_rules_day_of_month_check
    check (day_of_month is null or day_of_month between 1 and 31),
  constraint recurring_rules_day_of_week_check
    check (day_of_week is null or day_of_week between 0 and 6)
);

create index if not exists recurring_rules_household_active_idx
  on public.recurring_rules (household_id, is_active, next_run_date);

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.recurring_rules enable row level security;

drop policy if exists goals_select_member on public.goals;
create policy goals_select_member on public.goals
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists goals_insert_member on public.goals;
create policy goals_insert_member on public.goals
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists goals_update_member on public.goals;
create policy goals_update_member on public.goals
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists goals_delete_member on public.goals;
create policy goals_delete_member on public.goals
  for delete to authenticated
  using (public.is_household_member(household_id));

drop policy if exists goal_contributions_select_member on public.goal_contributions;
create policy goal_contributions_select_member on public.goal_contributions
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists goal_contributions_insert_member on public.goal_contributions;
create policy goal_contributions_insert_member on public.goal_contributions
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists recurring_rules_select_member on public.recurring_rules;
create policy recurring_rules_select_member on public.recurring_rules
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists recurring_rules_insert_member on public.recurring_rules;
create policy recurring_rules_insert_member on public.recurring_rules
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists recurring_rules_update_member on public.recurring_rules;
create policy recurring_rules_update_member on public.recurring_rules
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists recurring_rules_delete_member on public.recurring_rules;
create policy recurring_rules_delete_member on public.recurring_rules
  for delete to authenticated
  using (public.is_household_member(household_id));

grant select, insert, update, delete on public.goals to authenticated;
grant select, insert on public.goal_contributions to authenticated;
grant select, insert, update, delete on public.recurring_rules to authenticated;

-- Atomic contribute: positive amount only (BR-06)
create or replace function public.contribute_to_goal(
  p_goal_id uuid,
  p_amount numeric,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_goal public.goals%rowtype;
  v_contrib_id uuid;
  v_new_funded numeric(18, 0);
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select * into v_goal
  from public.goals g
  where g.id = p_goal_id
  for update;

  if not found then
    raise exception 'Goal not found';
  end if;

  if not public.is_household_member(v_goal.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_goal.status not in ('active', 'paused') then
    raise exception 'Goal is not open for contributions';
  end if;

  v_new_funded := v_goal.funded_amount + p_amount;

  insert into public.goal_contributions (
    household_id, goal_id, direction, amount, note, created_by
  ) values (
    v_goal.household_id, v_goal.id, 'contribute', p_amount,
    nullif(trim(coalesce(p_note, '')), ''), v_user_id
  )
  returning id into v_contrib_id;

  update public.goals g
  set funded_amount = v_new_funded,
      status = case
        when v_new_funded >= g.target_amount then 'completed'
        else g.status
      end,
      updated_at = now()
  where g.id = v_goal.id;

  return jsonb_build_object(
    'contribution_id', v_contrib_id,
    'goal_id', v_goal.id,
    'funded_amount', v_new_funded
  );
end;
$$;

revoke all on function public.contribute_to_goal(uuid, numeric, text) from public;
grant execute on function public.contribute_to_goal(uuid, numeric, text) to authenticated;
