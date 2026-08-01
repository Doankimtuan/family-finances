-- ============================================================================
-- 00039_savings_feature.sql
-- Savings feature schema, functions, scheduler, and supporting constraints.
-- ============================================================================

alter table public.transactions
  add column if not exists transaction_subtype text;

alter table public.transactions
  add column if not exists is_non_cash boolean not null default false;

alter table public.transactions
  add column if not exists related_savings_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_related_savings_fk'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_related_savings_fk
      foreign key (related_savings_id) references public.savings_accounts(id) on delete set null
      not valid;
  end if;
exception
  when undefined_table then
    null;
end
$$;

insert into public.categories (household_id, kind, name, is_system, is_active, sort_order)
values
  (null, 'expense', 'Savings Deposit', true, true, 990),
  (null, 'income', 'Savings Withdrawal', true, true, 991),
  (null, 'income', 'Savings Interest', true, true, 992),
  (null, 'expense', 'Savings Tax', true, true, 993),
  (null, 'expense', 'Savings Penalty', true, true, 994)
on conflict do nothing;

create table if not exists public.savings_rate_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  provider_name text not null,
  product_name text,
  savings_type text not null,
  interest_type text not null,
  term_mode text not null,
  term_days integer not null,
  annual_rate numeric(10,6) not null,
  early_withdrawal_rate numeric(10,6),
  tax_rate numeric(6,5) not null default 0,
  effective_from date not null,
  effective_to date,
  source text not null default 'manual',
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint savings_rate_history_savings_type_check check (savings_type in ('bank', 'third_party')),
  constraint savings_rate_history_interest_type_check check (interest_type in ('simple', 'compound_daily')),
  constraint savings_rate_history_term_mode_check check (term_mode in ('fixed', 'flexible')),
  constraint savings_rate_history_term_days_nonnegative check (term_days >= 0),
  constraint savings_rate_history_annual_rate_nonnegative check (annual_rate >= 0),
  constraint savings_rate_history_early_withdrawal_nonnegative check (early_withdrawal_rate is null or early_withdrawal_rate >= 0),
  constraint savings_rate_history_tax_bounds check (tax_rate between 0 and 1),
  constraint savings_rate_history_source_check check (source in ('manual', 'imported', 'system_renewal')),
  constraint savings_rate_history_effective_range_check check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id uuid references public.savings_accounts(id) on delete restrict,
  goal_id uuid references public.goals(id) on delete set null,
  savings_type text not null,
  provider_name text not null,
  product_name text,
  interest_type text not null,
  term_mode text not null,
  term_days integer not null default 0,
  principal_amount numeric(18,0) not null,
  current_principal_remaining numeric(18,0) not null,
  annual_rate numeric(10,6) not null,
  early_withdrawal_rate numeric(10,6),
  tax_rate numeric(6,5) not null default 0,
  start_date date not null,
  maturity_date date,
  primary_linked_account_id uuid not null references public.accounts(id) on delete restrict,
  linked_account_ids uuid[] not null default '{}'::uuid[],
  maturity_preference text,
  next_plan_config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  closed_at date,
  origin_rate_history_id uuid references public.savings_rate_history(id) on delete set null,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_accounts_savings_type_check check (savings_type in ('bank', 'third_party')),
  constraint savings_accounts_interest_type_check check (interest_type in ('simple', 'compound_daily')),
  constraint savings_accounts_term_mode_check check (term_mode in ('fixed', 'flexible')),
  constraint savings_accounts_term_days_nonnegative check (term_days >= 0),
  constraint savings_accounts_principal_positive check (principal_amount > 0),
  constraint savings_accounts_remaining_nonnegative check (current_principal_remaining >= 0),
  constraint savings_accounts_annual_rate_nonnegative check (annual_rate >= 0),
  constraint savings_accounts_early_withdrawal_nonnegative check (early_withdrawal_rate is null or early_withdrawal_rate >= 0),
  constraint savings_accounts_tax_bounds check (tax_rate between 0 and 1),
  constraint savings_accounts_maturity_preference_check check (maturity_preference is null or maturity_preference in ('renew_same', 'switch_plan', 'withdraw')),
  constraint savings_accounts_status_check check (status in ('active', 'maturing_soon', 'matured', 'withdrawn', 'renewed', 'cancelled')),
  constraint savings_accounts_date_shape_check check (
    (term_mode = 'flexible' and maturity_date is null)
    or
    (term_mode = 'fixed' and maturity_date is not null and maturity_date >= start_date)
  ),
  constraint savings_accounts_bank_shape_check check (
    (savings_type = 'bank' and interest_type = 'simple' and term_mode = 'fixed' and early_withdrawal_rate is not null)
    or
    (savings_type = 'third_party')
  )
);

create table if not exists public.savings_withdrawals (
  id uuid primary key default gen_random_uuid(),
  savings_account_id uuid not null references public.savings_accounts(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete cascade,
  withdrawal_date date not null,
  withdrawal_mode text not null,
  requested_principal_amount numeric(18,0) not null,
  gross_interest_amount numeric(18,0) not null default 0,
  tax_amount numeric(18,0) not null default 0,
  penalty_amount numeric(18,0) not null default 0,
  net_received_amount numeric(18,0) not null,
  destination_account_id uuid not null references public.accounts(id) on delete restrict,
  remaining_principal_after numeric(18,0) not null,
  principal_transaction_id uuid references public.transactions(id) on delete set null,
  interest_transaction_id uuid references public.transactions(id) on delete set null,
  tax_transaction_id uuid references public.transactions(id) on delete set null,
  penalty_transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint savings_withdrawals_mode_check check (withdrawal_mode in ('partial', 'full')),
  constraint savings_withdrawals_requested_positive check (requested_principal_amount > 0),
  constraint savings_withdrawals_interest_nonnegative check (gross_interest_amount >= 0),
  constraint savings_withdrawals_tax_nonnegative check (tax_amount >= 0),
  constraint savings_withdrawals_penalty_nonnegative check (penalty_amount >= 0),
  constraint savings_withdrawals_net_nonnegative check (net_received_amount >= 0),
  constraint savings_withdrawals_remaining_nonnegative check (remaining_principal_after >= 0)
);

create table if not exists public.savings_maturity_actions (
  id uuid primary key default gen_random_uuid(),
  savings_account_id uuid not null references public.savings_accounts(id) on delete restrict,
  household_id uuid not null references public.households(id) on delete cascade,
  action_date date not null,
  action_type text not null,
  execution_mode text not null,
  gross_principal_amount numeric(18,0) not null,
  gross_interest_amount numeric(18,0) not null default 0,
  tax_amount numeric(18,0) not null default 0,
  net_rollover_amount numeric(18,0) not null default 0,
  destination_account_id uuid references public.accounts(id) on delete restrict,
  child_savings_account_id uuid references public.savings_accounts(id) on delete restrict,
  applied_annual_rate numeric(10,6),
  applied_term_days integer,
  applied_interest_type text,
  selected_rate_history_id uuid references public.savings_rate_history(id) on delete set null,
  executed_by uuid references public.profiles(user_id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint savings_maturity_actions_type_check check (action_type in ('renew_same', 'switch_plan', 'withdraw')),
  constraint savings_maturity_actions_execution_mode_check check (execution_mode in ('manual', 'scheduled_auto')),
  constraint savings_maturity_actions_principal_nonnegative check (gross_principal_amount >= 0),
  constraint savings_maturity_actions_interest_nonnegative check (gross_interest_amount >= 0),
  constraint savings_maturity_actions_tax_nonnegative check (tax_amount >= 0),
  constraint savings_maturity_actions_rollover_nonnegative check (net_rollover_amount >= 0),
  constraint savings_maturity_actions_interest_type_check check (applied_interest_type is null or applied_interest_type in ('simple', 'compound_daily')),
  constraint savings_maturity_actions_term_days_nonnegative check (applied_term_days is null or applied_term_days >= 0)
);

create index if not exists idx_savings_accounts_household_status_maturity
  on public.savings_accounts (household_id, status, maturity_date);

create index if not exists idx_savings_accounts_household_type_provider
  on public.savings_accounts (household_id, savings_type, provider_name);

create index if not exists idx_savings_accounts_parent
  on public.savings_accounts (parent_id);

create index if not exists idx_savings_accounts_goal
  on public.savings_accounts (goal_id);

create index if not exists idx_savings_accounts_linked_account_ids
  on public.savings_accounts using gin (linked_account_ids);

create index if not exists idx_savings_rate_history_provider_effective
  on public.savings_rate_history (household_id, provider_name, effective_from desc);

create index if not exists idx_savings_rate_history_product_window
  on public.savings_rate_history (household_id, savings_type, term_mode, term_days, effective_from desc);

create index if not exists idx_savings_withdrawals_savings_date
  on public.savings_withdrawals (savings_account_id, withdrawal_date desc);

create index if not exists idx_savings_withdrawals_destination
  on public.savings_withdrawals (household_id, destination_account_id, withdrawal_date desc);

create unique index if not exists uq_savings_maturity_actions_parent
  on public.savings_maturity_actions (savings_account_id);

create index if not exists idx_savings_maturity_actions_household_date
  on public.savings_maturity_actions (household_id, action_date desc);

create index if not exists idx_savings_maturity_actions_child
  on public.savings_maturity_actions (child_savings_account_id);

drop trigger if exists trg_savings_accounts_set_updated_at on public.savings_accounts;
create trigger trg_savings_accounts_set_updated_at
before update on public.savings_accounts
for each row execute function public.set_updated_at();

alter table public.savings_rate_history enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.savings_withdrawals enable row level security;
alter table public.savings_maturity_actions enable row level security;

drop policy if exists savings_rate_history_select_member_policy on public.savings_rate_history;
create policy savings_rate_history_select_member_policy
on public.savings_rate_history
for select
using (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_rate_history_insert_member_policy on public.savings_rate_history;
create policy savings_rate_history_insert_member_policy
on public.savings_rate_history
for insert
with check (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_rate_history_update_member_policy on public.savings_rate_history;
create policy savings_rate_history_update_member_policy
on public.savings_rate_history
for update
using (public.is_household_member(savings_rate_history.household_id))
with check (public.is_household_member(savings_rate_history.household_id));

drop policy if exists savings_accounts_select_member_policy on public.savings_accounts;
create policy savings_accounts_select_member_policy
on public.savings_accounts
for select
using (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_insert_member_policy on public.savings_accounts;
create policy savings_accounts_insert_member_policy
on public.savings_accounts
for insert
with check (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_update_member_policy on public.savings_accounts;
create policy savings_accounts_update_member_policy
on public.savings_accounts
for update
using (public.is_household_member(savings_accounts.household_id))
with check (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_accounts_delete_member_policy on public.savings_accounts;
create policy savings_accounts_delete_member_policy
on public.savings_accounts
for delete
using (public.is_household_member(savings_accounts.household_id));

drop policy if exists savings_withdrawals_select_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_select_member_policy
on public.savings_withdrawals
for select
using (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_withdrawals_insert_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_insert_member_policy
on public.savings_withdrawals
for insert
with check (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_withdrawals_update_member_policy on public.savings_withdrawals;
create policy savings_withdrawals_update_member_policy
on public.savings_withdrawals
for update
using (public.is_household_member(savings_withdrawals.household_id))
with check (public.is_household_member(savings_withdrawals.household_id));

drop policy if exists savings_maturity_actions_select_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_select_member_policy
on public.savings_maturity_actions
for select
using (public.is_household_member(savings_maturity_actions.household_id));

drop policy if exists savings_maturity_actions_insert_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_insert_member_policy
on public.savings_maturity_actions
for insert
with check (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

drop policy if exists savings_maturity_actions_update_member_policy on public.savings_maturity_actions;
create policy savings_maturity_actions_update_member_policy
on public.savings_maturity_actions
for update
using (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (public.is_household_member(savings_maturity_actions.household_id) or coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'insights_type_check'
      and conrelid = 'public.insights'::regclass
  ) then
    alter table public.insights drop constraint insights_type_check;
  end if;

  alter table public.insights
    add constraint insights_type_check
    check (insight_type in ('spending_anomaly', 'goal_risk', 'debt_alert', 'savings_milestone', 'net_worth_change', 'savings_maturity_alert', 'custom'));
end
$$;

create or replace function public.calculate_savings_current_value(
  p_savings_id uuid,
  p_as_of_date date default current_date
)
returns table (
  principal numeric(18,0),
  accrued_interest numeric(18,0),
  tax_liability numeric(18,0),
  net_value numeric(18,0),
  days_elapsed integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.savings_accounts%rowtype;
  v_withdrawal public.savings_withdrawals%rowtype;
  v_cursor date;
  v_segment_end date;
  v_days integer;
  v_principal numeric(18,6);
  v_balance numeric(18,6);
  v_accrued numeric(18,6) := 0;
  v_total_days integer := 0;
  v_is_fixed boolean;
  v_growth numeric(18,10);
  v_current_balance numeric(18,6);
begin
  select *
  into v_account
  from public.savings_accounts
  where id = p_savings_id;

  if not found then
    raise exception 'Savings account not found: %', p_savings_id;
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.is_household_member(v_account.household_id) then
    raise exception 'Not authorized for savings account %', p_savings_id;
  end if;

  v_cursor := v_account.start_date;
  v_principal := v_account.principal_amount;
  v_balance := v_account.principal_amount;
  v_is_fixed := v_account.term_mode = 'fixed';

  for v_withdrawal in
    select *
    from public.savings_withdrawals
    where savings_account_id = p_savings_id
      and withdrawal_date <= p_as_of_date
    order by withdrawal_date asc, created_at asc
  loop
    v_segment_end := v_withdrawal.withdrawal_date;
    if v_is_fixed and v_account.maturity_date is not null then
      v_segment_end := least(v_segment_end, v_account.maturity_date);
    end if;

    v_days := greatest(0, v_segment_end - v_cursor);
    v_total_days := v_total_days + v_days;

    if v_account.interest_type = 'compound_daily' then
      v_growth := power((1 + (v_account.annual_rate / 365.0))::numeric, v_days);
      v_balance := v_balance * v_growth;
      v_accrued := greatest(v_balance - v_principal, 0);
      v_balance := greatest(v_balance - v_withdrawal.requested_principal_amount - v_withdrawal.gross_interest_amount, 0);
      v_principal := v_withdrawal.remaining_principal_after;
    else
      v_accrued := v_accrued + (v_principal * v_account.annual_rate * v_days / 365.0);
      v_accrued := greatest(v_accrued - v_withdrawal.gross_interest_amount, 0);
      v_principal := v_withdrawal.remaining_principal_after;
      v_balance := v_principal + v_accrued;
    end if;

    v_cursor := v_withdrawal.withdrawal_date;

    if v_principal <= 0 then
      exit;
    end if;
  end loop;

  if v_principal > 0 then
    v_segment_end := p_as_of_date;
    if v_is_fixed and v_account.maturity_date is not null then
      v_segment_end := least(v_segment_end, v_account.maturity_date);
    end if;

    v_days := greatest(0, v_segment_end - v_cursor);
    v_total_days := v_total_days + v_days;

    if v_account.interest_type = 'compound_daily' then
      v_growth := power((1 + (v_account.annual_rate / 365.0))::numeric, v_days);
      v_current_balance := v_balance * v_growth;
      v_accrued := greatest(v_current_balance - v_principal, 0);
    else
      v_accrued := v_accrued + (v_principal * v_account.annual_rate * v_days / 365.0);
    end if;
  end if;

  principal := round(v_principal)::numeric(18,0);
  accrued_interest := round(greatest(v_accrued, 0))::numeric(18,0);
  tax_liability := case
    when v_account.savings_type = 'third_party' then round(greatest(v_accrued, 0) * v_account.tax_rate)::numeric(18,0)
    else 0::numeric(18,0)
  end;
  net_value := case
    when v_account.savings_type = 'third_party'
      then round(greatest(v_principal + v_accrued - (greatest(v_accrued, 0) * v_account.tax_rate), 0))::numeric(18,0)
    else round(greatest(v_principal + v_accrued, 0))::numeric(18,0)
  end;
  days_elapsed := v_total_days;
  return next;
end;
$$;

create or replace function public.process_savings_maturity(
  p_savings_id uuid,
  p_action_date date default current_date,
  p_execution_mode text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.savings_accounts%rowtype;
  v_current record;
  v_action_id uuid := gen_random_uuid();
  v_child_id uuid;
  v_rate public.savings_rate_history%rowtype;
  v_action_type text;
  v_net_rollover numeric(18,0);
begin
  select *
  into v_parent
  from public.savings_accounts
  where id = p_savings_id
  for update;

  if not found then
    raise exception 'Savings account not found: %', p_savings_id;
  end if;

  if v_parent.term_mode <> 'fixed' then
    raise exception 'Only fixed-term savings can be matured.';
  end if;

  if v_parent.status in ('withdrawn', 'renewed', 'cancelled') then
    raise exception 'Savings account % already processed.', p_savings_id;
  end if;

  if exists (
    select 1
    from public.savings_maturity_actions
    where savings_account_id = p_savings_id
  ) then
    raise exception 'Savings account % already has a maturity action.', p_savings_id;
  end if;

  select *
  into v_current
  from public.calculate_savings_current_value(p_savings_id, coalesce(v_parent.maturity_date, p_action_date));

  v_action_type := coalesce(v_parent.maturity_preference, 'withdraw');
  v_net_rollover := v_current.principal + v_current.accrued_interest - v_current.tax_liability;

  insert into public.savings_maturity_actions (
    id,
    savings_account_id,
    household_id,
    action_date,
    action_type,
    execution_mode,
    gross_principal_amount,
    gross_interest_amount,
    tax_amount,
    net_rollover_amount,
    destination_account_id,
    executed_by
  ) values (
    v_action_id,
    v_parent.id,
    v_parent.household_id,
    p_action_date,
    v_action_type,
    p_execution_mode,
    v_current.principal,
    v_current.accrued_interest,
    v_current.tax_liability,
    v_net_rollover,
    v_parent.primary_linked_account_id,
    auth.uid()
  );

  if v_action_type in ('renew_same', 'switch_plan') then
    select *
    into v_rate
    from public.savings_rate_history
    where household_id = v_parent.household_id
      and provider_name = v_parent.provider_name
      and savings_type = v_parent.savings_type
      and term_mode = v_parent.term_mode
      and term_days = v_parent.term_days
      and effective_from <= p_action_date
      and (effective_to is null or effective_to >= p_action_date)
    order by effective_from desc, created_at desc
    limit 1;

    v_child_id := gen_random_uuid();

    insert into public.savings_accounts (
      id,
      household_id,
      parent_id,
      goal_id,
      savings_type,
      provider_name,
      product_name,
      interest_type,
      term_mode,
      term_days,
      principal_amount,
      current_principal_remaining,
      annual_rate,
      early_withdrawal_rate,
      tax_rate,
      start_date,
      maturity_date,
      primary_linked_account_id,
      linked_account_ids,
      maturity_preference,
      next_plan_config,
      status,
      origin_rate_history_id,
      notes,
      created_by
    ) values (
      v_child_id,
      v_parent.household_id,
      v_parent.id,
      v_parent.goal_id,
      v_parent.savings_type,
      v_parent.provider_name,
      v_parent.product_name,
      coalesce((v_parent.next_plan_config ->> 'interestType')::text, coalesce(v_rate.interest_type, v_parent.interest_type)),
      v_parent.term_mode,
      coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days)),
      v_net_rollover,
      v_net_rollover,
      coalesce((v_parent.next_plan_config ->> 'annualRate')::numeric, coalesce(v_rate.annual_rate, v_parent.annual_rate)),
      coalesce(v_rate.early_withdrawal_rate, v_parent.early_withdrawal_rate),
      coalesce((v_parent.next_plan_config ->> 'taxRate')::numeric, coalesce(v_rate.tax_rate, v_parent.tax_rate)),
      p_action_date,
      case
        when v_parent.term_mode = 'fixed'
          then p_action_date + coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days))
        else null
      end,
      coalesce((v_parent.next_plan_config ->> 'primaryLinkedAccountId')::uuid, v_parent.primary_linked_account_id),
      coalesce(
        (
          select array_agg(value::uuid)
          from jsonb_array_elements_text(coalesce(v_parent.next_plan_config -> 'linkedAccountIds', '[]'::jsonb))
        ),
        v_parent.linked_account_ids
      ),
      v_parent.maturity_preference,
      '{}'::jsonb,
      'active',
      v_rate.id,
      v_parent.notes,
      auth.uid()
    );

    update public.savings_accounts
    set status = 'renewed',
        closed_at = p_action_date
    where id = v_parent.id;

    update public.savings_maturity_actions
    set child_savings_account_id = v_child_id,
        applied_annual_rate = coalesce((v_parent.next_plan_config ->> 'annualRate')::numeric, coalesce(v_rate.annual_rate, v_parent.annual_rate)),
        applied_term_days = coalesce((v_parent.next_plan_config ->> 'termDays')::integer, coalesce(v_rate.term_days, v_parent.term_days)),
        applied_interest_type = coalesce((v_parent.next_plan_config ->> 'interestType')::text, coalesce(v_rate.interest_type, v_parent.interest_type)),
        selected_rate_history_id = v_rate.id
    where id = v_action_id;
  else
    update public.savings_accounts
    set status = 'withdrawn',
        closed_at = p_action_date,
        current_principal_remaining = 0
    where id = v_parent.id;
  end if;

  return v_action_id;
end;
$$;

create or replace function public.check_maturing_savings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('Asia/Ho_Chi_Minh', now())::date;
  v_row public.savings_accounts%rowtype;
begin
  for v_row in
    select *
    from public.savings_accounts
    where status in ('active', 'maturing_soon', 'matured')
      and term_mode = 'fixed'
      and maturity_date is not null
      and maturity_date between v_today and (v_today + 7)
  loop
    insert into public.insights (
      household_id,
      insight_type,
      severity,
      title,
      body,
      action_label,
      action_target,
      is_dismissed
    ) values (
      v_row.household_id,
      'savings_maturity_alert',
      case when v_row.maturity_date <= v_today then 'warning' else 'info' end,
      format('Savings matures soon: %s', v_row.provider_name),
      format('Savings %s is scheduled to mature on %s.', coalesce(v_row.product_name, v_row.provider_name), v_row.maturity_date),
      'Open Savings',
      '/money/savings',
      false
    )
    on conflict do nothing;

    update public.savings_accounts
    set status = case
      when maturity_date < v_today then 'matured'
      when maturity_date <= (v_today + 7) then 'maturing_soon'
      else status
    end
    where id = v_row.id;

    if v_row.maturity_preference = 'renew_same'
       and v_row.maturity_date <= v_today
       and not exists (
         select 1
         from public.savings_maturity_actions
         where savings_account_id = v_row.id
       ) then
      perform public.process_savings_maturity(v_row.id, v_today, 'scheduled_auto');
    end if;
  end loop;
end;
$$;

do $$
declare
  v_job record;
begin
  if to_regnamespace('cron') is null then
    raise notice 'cron schema missing; skipping savings cron job creation';
    return;
  end if;

  for v_job in
    select jobid
    from cron.job
    where jobname in ('savings_maturity_daily_v1')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(
    'savings_maturity_daily_v1',
    '0 0 * * *',
    $cmd$select public.check_maturing_savings();$cmd$
  );
end;
$$;
