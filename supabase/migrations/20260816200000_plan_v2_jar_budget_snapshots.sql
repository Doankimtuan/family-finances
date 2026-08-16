-- PLAN 05 can run independently of the optional Review migration. If that
-- migration already created the aligned table, this is a no-op.
create table if not exists public.jar_period_rule_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  jar_id uuid not null references public.jars(id) on delete cascade,
  period_month date not null,
  jar_name text not null,
  plan_kind text not null,
  percent_bps int not null default 0,
  fixed_amount numeric(18, 0) not null default 0,
  rollover_mode text not null default 'reset',
  created_at timestamptz not null default now(),
  constraint jar_period_rule_snapshots_plan05_period_check check (period_month = date_trunc('month', period_month)::date),
  constraint jar_period_rule_snapshots_plan05_unique unique (jar_id, period_month)
);

alter table public.jar_period_rule_snapshots enable row level security;
drop policy if exists jar_period_rule_snapshots_select_member on public.jar_period_rule_snapshots;
create policy jar_period_rule_snapshots_select_member on public.jar_period_rule_snapshots
  for select to authenticated using (public.is_household_member(household_id));
drop policy if exists jar_period_rule_snapshots_insert_member on public.jar_period_rule_snapshots;
create policy jar_period_rule_snapshots_insert_member on public.jar_period_rule_snapshots
  for insert to authenticated with check (public.is_household_member(household_id));
-- PLAN 05: stable Jar budget snapshots and period-scoped reallocation.
-- This migration is intentionally not applied by this task.
-- It extends the aligned jar_period_rule_snapshots prototype created by PLAN 04.

alter table public.plan_movements
  add column if not exists period_month date,
  add column if not exists reason text;

create index if not exists plan_movements_household_period_idx
  on public.plan_movements (household_id, period_month, created_at desc);

comment on column public.plan_movements.period_month is
  'Planning month affected by this virtual movement; never a Money transaction date.';
comment on column public.plan_movements.reason is
  'Optional human-readable reason for a Plan-only budget reallocation.';

alter table public.jar_period_rule_snapshots
  add column if not exists qualifying_income numeric(18, 0) not null default 0,
  add column if not exists qualifying_income_source text not null default 'none',
  add column if not exists rule_budget numeric(18, 0) not null default 0,
  add column if not exists rollover_credit numeric(18, 0) not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.jar_period_rule_snapshots
  drop constraint if exists jar_period_rule_snapshots_income_source_check;
alter table public.jar_period_rule_snapshots
  add constraint jar_period_rule_snapshots_income_source_check
  check (qualifying_income_source in ('configured', 'recurring_fallback', 'posted_fallback', 'none'));
alter table public.jar_period_rule_snapshots
  drop constraint if exists jar_period_rule_snapshots_nonnegative_values_check;
alter table public.jar_period_rule_snapshots
  add constraint jar_period_rule_snapshots_nonnegative_values_check
  check (
    percent_bps >= 0 and percent_bps <= 10000
    and fixed_amount >= 0
    and qualifying_income >= 0
    and rule_budget >= 0
    and rollover_credit >= 0
  );

create index if not exists jar_period_rule_snapshots_household_period_idx
  on public.jar_period_rule_snapshots (household_id, period_month);

drop policy if exists jar_period_rule_snapshots_update_member on public.jar_period_rule_snapshots;
create policy jar_period_rule_snapshots_update_member
  on public.jar_period_rule_snapshots for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
grant update on public.jar_period_rule_snapshots to authenticated;

create or replace function public.guard_historical_jar_period_rule_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_current_period date;
begin
  select coalesce(h.timezone, 'Asia/Ho_Chi_Minh') into v_timezone
  from public.households h
  where h.id = old.household_id;
  v_current_period := to_char(timezone(v_timezone, now()), 'YYYY-MM-01')::date;
  if old.period_month < v_current_period and row_to_json(old)::text <> row_to_json(new)::text then
    raise exception 'Historical Jar period snapshots are immutable';
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_guard_historical_jar_period_rule_snapshot on public.jar_period_rule_snapshots;
create trigger trg_guard_historical_jar_period_rule_snapshot
before update on public.jar_period_rule_snapshots
for each row execute function public.guard_historical_jar_period_rule_snapshot();

-- Replace the legacy RPC implementation. The function -- Replace the legacy RPC implementation. The function -- Replace the ents and audit rows.
create or replace function public.reallocate_jar_capacity(
  p_source_jar_id uuid,
  p_target_jar_id uuid,
  p_amount numeric,
  p_is_emergency boolean default false,
  p_intent_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_period date;
  v_timezone text;
  v_source_snapshot public.jar_period_rule_snapshots%rowtype;
  v_target_snapshot public.jar_period_rule_snapshots%rowtype;
  v_source_adjustment numeric := 0;
  v_source_spent numeric := 0;
  v_source_remaining numeric := 0;
  v_movement_id uuid;
  v_note text := nullif(trim(coalesce(p_intent_note, '')), '');
  v_is_emergency boolean := coalesce(p_is_emergency, false);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  if p_source_jar_id is null or p_target_jar_id is null or p_source_jar_id = p_target_jar_id then
    raise exception 'Distinct source and target jars required';
  end if;
  if v_is_emergency and v_note is null then
    raise exception 'Emergency intent note required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  order by hm.household_id
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  select coalesce(h.timezone, 'Asia/Ho_Chi_Minh') into v_timezone
  from public.households h where h.id = v_household_id;
  v_period := to_char(timezone(v_timezone, now()), 'YYYY-MM-01')::date;

  if p_source_jar_id < p_target_jar_id then
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
  else
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
  end if;

  if not exists (
    select 1 from public.jars
    where id = p_source_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid source jar'; end if;
  if not exists (
    select 1 from public.jars
    where id = p_target_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid target jar'; end if;

  select * into v_source_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_source_jar_id and period_month = v_period
  for update;
  select * into v_target_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_target_jar_id and period_month = v_period
  for update;
  if not found or v_source_snapshot.id is null or v_target_snapshot.id is null then
    raise exception 'Jar budget snapshot required';
  end if;

  select coalesce(sum(a.amount), 0) into v_source_adjustment
  from public.jar_period_adjustments a
  where a.household_id = v_household_id and a.jar_id = p_source_jar_id and a.period_month = v_period;

  select coalesce(sum(case
    when t.status = 'reversed' then 0
    when coalesce(t.is_reversal, false) or t.reverses_transaction_id is not null then
      case when t.type in ('income', 'expense', 'investment_buy', 'investment_fee', 'liability_payment') then -t.amount else 0 end
    when t.type in ('expense', 'investment_buy', 'investment_fee') then t.amount
    when t.type = 'liability_payment' and exists (
      select 1 from public.loan_payments lp where lp.transaction_id = t.id
    ) then t.amount
    when t.type in ('transfer_out', 'transfer_in')
      and upper(coalesce(t.savings_event_kind, '')) like '%PLACEMENT%' then t.amount
    else 0
  end), 0) into v_source_spent
  from public.transactions t
  where t.household_id = v_household_id and t.jar_id = p_source_jar_id
    and t.transaction_date >= v_period
    and t.transaction_date < (v_period + interval '1 month')::date;

  v_source_remaining := greatest(0,
    v_source_snapshot.rule_budget
    + v_source_snapshot.rollover_credit
    + v_source_adjustment
    - v_source_spent
  );
  if p_amount > v_source_remaining then
    raise exception 'ERR_INSUFFICIENT_REALLOCATABLE_BUDGET';
  end if;

  insert into public.plan_movements (
    household_id, source_jar_id, target_jar_id, amount, is_emergency,
    intent_note, executed_by_user_id, ledger_impact, period_month, reason
  ) values (
    v_household_id, p_source_jar_id, p_target_jar_id, p_amount, v_is_emergency,
    v_note, v_user_id, 0, v_period, v_note
  ) returning id into v_movement_id;

  insert into public.jar_period_adjustments (
    household_id, jar_id, period_month, amount, plan_movement_id, note, created_by
  ) values
    (v_household_id, p_source_jar_id, v_period, -p_amount, v_movement_id, 'reallocate_out', v_user_id),
    (v_household_id, p_target_jar_id, v_period, p_amount, v_movement_id, 'reallocate_in', v_user_id);

  return jsonb_build_object(
    'plan_movement_id', v_movement_id,
    'source_jar_id', p_source_jar_id,
    'target_jar_id', p_target_jar_id,
    'amount', p_amount,
    'period_month', v_period,
    'is_emergency', v_is_emergency,
    'inbox_item_id', null,
    'ledger_transactions_created', 0,
    'ledger_impact', 0
  );
end;
$$;

revoke all on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) from public;
grant execute on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) to authenticated;
