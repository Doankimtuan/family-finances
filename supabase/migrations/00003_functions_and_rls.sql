-- ============================================================================
-- 00003_functions_and_rls.sql
-- Auth sync triggers, helper functions, row-level security, realtime publication.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Auth/profile sync
-- --------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'New User'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id)
  do update
    set full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Access helper functions
-- --------------------------------------------------------------------------

create or replace function public.current_jwt_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
  );
$$;

create or replace function public.get_primary_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hm.household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
    and hm.is_active = true
  order by hm.joined_at asc
  limit 1;
$$;

-- --------------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------------

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_households_set_updated_at on public.households;
create trigger trg_households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

drop trigger if exists trg_household_members_set_updated_at on public.household_members;
create trigger trg_household_members_set_updated_at
before update on public.household_members
for each row execute function public.set_updated_at();

drop trigger if exists trg_household_invitations_set_updated_at on public.household_invitations;
create trigger trg_household_invitations_set_updated_at
before update on public.household_invitations
for each row execute function public.set_updated_at();

drop trigger if exists trg_accounts_set_updated_at on public.accounts;
create trigger trg_accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_set_updated_at on public.transactions;
create trigger trg_transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_recurring_rules_set_updated_at on public.recurring_rules;
create trigger trg_recurring_rules_set_updated_at
before update on public.recurring_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_monthly_budgets_set_updated_at on public.monthly_budgets;
create trigger trg_monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function public.set_updated_at();

drop trigger if exists trg_assets_set_updated_at on public.assets;
create trigger trg_assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_liabilities_set_updated_at on public.liabilities;
create trigger trg_liabilities_set_updated_at
before update on public.liabilities
for each row execute function public.set_updated_at();

drop trigger if exists trg_scenarios_set_updated_at on public.scenarios;
create trigger trg_scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_set_updated_at on public.goals;
create trigger trg_goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row-level security
-- --------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.audit_events enable row level security;

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.monthly_budgets enable row level security;

alter table public.assets enable row level security;
alter table public.asset_quantity_history enable row level security;
alter table public.asset_price_history enable row level security;
alter table public.asset_cashflows enable row level security;
alter table public.savings_deposit_terms enable row level security;

alter table public.liabilities enable row level security;
alter table public.liability_rate_periods enable row level security;
alter table public.liability_schedule_snapshots enable row level security;
alter table public.liability_payments enable row level security;

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.goal_snapshots enable row level security;
alter table public.health_score_snapshots enable row level security;
alter table public.insights enable row level security;

alter table public.scenarios enable row level security;
alter table public.scenario_results enable row level security;
alter table public.monthly_household_snapshots enable row level security;

-- Profiles
create policy profiles_select_policy
on public.profiles
for select
using (
  profiles.user_id = auth.uid()
  or exists (
    select 1
    from public.household_members me
    join public.household_members other
      on other.household_id = me.household_id
     and other.user_id = profiles.user_id
     and other.is_active = true
    where me.user_id = auth.uid()
      and me.is_active = true
  )
);

create policy profiles_insert_own_policy
on public.profiles
for insert
with check (profiles.user_id = auth.uid());

create policy profiles_update_own_policy
on public.profiles
for update
using (profiles.user_id = auth.uid())
with check (profiles.user_id = auth.uid());

-- Households
create policy households_select_member_policy
on public.households
for select
using (public.is_household_member(households.id));

create policy households_insert_creator_policy
on public.households
for insert
with check (households.created_by = auth.uid());

create policy households_update_member_policy
on public.households
for update
using (public.is_household_member(households.id))
with check (public.is_household_member(households.id));

-- Household members
create policy household_members_select_member_policy
on public.household_members
for select
using (public.is_household_member(household_members.household_id));

create policy household_members_insert_policy
on public.household_members
for insert
with check (
  public.is_household_member(household_members.household_id)
  or (
    household_members.user_id = auth.uid()
    and exists (
      select 1
      from public.household_invitations i
      where i.household_id = household_members.household_id
        and lower(i.email::text) = public.current_jwt_email()
        and i.status = 'pending'
        and i.expires_at > now()
    )
  )
);

create policy household_members_update_member_policy
on public.household_members
for update
using (public.is_household_member(household_members.household_id))
with check (public.is_household_member(household_members.household_id));

create policy household_members_delete_member_policy
on public.household_members
for delete
using (public.is_household_member(household_members.household_id));

-- Household invitations
create policy household_invitations_select_policy
on public.household_invitations
for select
using (
  public.is_household_member(household_invitations.household_id)
  or lower(household_invitations.email::text) = public.current_jwt_email()
);

create policy household_invitations_insert_policy
on public.household_invitations
for insert
with check (
  public.is_household_member(household_invitations.household_id)
  and household_invitations.invited_by = auth.uid()
);

create policy household_invitations_update_policy
on public.household_invitations
for update
using (
  public.is_household_member(household_invitations.household_id)
  or lower(household_invitations.email::text) = public.current_jwt_email()
)
with check (
  public.is_household_member(household_invitations.household_id)
  or (
    lower(household_invitations.email::text) = public.current_jwt_email()
    and household_invitations.status in ('accepted', 'expired')
  )
);

create policy household_invitations_delete_policy
on public.household_invitations
for delete
using (public.is_household_member(household_invitations.household_id));

-- Audit events
create policy audit_events_select_member_policy
on public.audit_events
for select
using (public.is_household_member(audit_events.household_id));

create policy audit_events_insert_member_policy
on public.audit_events
for insert
with check (
  public.is_household_member(audit_events.household_id)
  and audit_events.actor_user_id = auth.uid()
);

-- Accounts
create policy accounts_select_member_policy
on public.accounts
for select
using (public.is_household_member(accounts.household_id));
create policy accounts_insert_member_policy
on public.accounts
for insert
with check (public.is_household_member(accounts.household_id));
create policy accounts_update_member_policy
on public.accounts
for update
using (public.is_household_member(accounts.household_id))
with check (public.is_household_member(accounts.household_id));
create policy accounts_delete_member_policy
on public.accounts
for delete
using (public.is_household_member(accounts.household_id));

-- Categories (system + household)
create policy categories_select_policy
on public.categories
for select
using (
  categories.household_id is null
  or public.is_household_member(categories.household_id)
);

create policy categories_insert_household_policy
on public.categories
for insert
with check (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

create policy categories_update_household_policy
on public.categories
for update
using (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
)
with check (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

create policy categories_delete_household_policy
on public.categories
for delete
using (
  categories.household_id is not null
  and categories.is_system = false
  and public.is_household_member(categories.household_id)
);

-- Transactions
create policy transactions_select_member_policy
on public.transactions
for select
using (public.is_household_member(transactions.household_id));
create policy transactions_insert_member_policy
on public.transactions
for insert
with check (public.is_household_member(transactions.household_id));
create policy transactions_update_member_policy
on public.transactions
for update
using (public.is_household_member(transactions.household_id))
with check (public.is_household_member(transactions.household_id));
create policy transactions_delete_member_policy
on public.transactions
for delete
using (public.is_household_member(transactions.household_id));

-- Recurring rules
create policy recurring_rules_select_member_policy
on public.recurring_rules
for select
using (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_insert_member_policy
on public.recurring_rules
for insert
with check (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_update_member_policy
on public.recurring_rules
for update
using (public.is_household_member(recurring_rules.household_id))
with check (public.is_household_member(recurring_rules.household_id));
create policy recurring_rules_delete_member_policy
on public.recurring_rules
for delete
using (public.is_household_member(recurring_rules.household_id));

-- Monthly budgets
create policy monthly_budgets_select_member_policy
on public.monthly_budgets
for select
using (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_insert_member_policy
on public.monthly_budgets
for insert
with check (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_update_member_policy
on public.monthly_budgets
for update
using (public.is_household_member(monthly_budgets.household_id))
with check (public.is_household_member(monthly_budgets.household_id));
create policy monthly_budgets_delete_member_policy
on public.monthly_budgets
for delete
using (public.is_household_member(monthly_budgets.household_id));

-- Assets
create policy assets_select_member_policy
on public.assets
for select
using (public.is_household_member(assets.household_id));
create policy assets_insert_member_policy
on public.assets
for insert
with check (public.is_household_member(assets.household_id));
create policy assets_update_member_policy
on public.assets
for update
using (public.is_household_member(assets.household_id))
with check (public.is_household_member(assets.household_id));
create policy assets_delete_member_policy
on public.assets
for delete
using (public.is_household_member(assets.household_id));

-- Asset quantity history
create policy asset_quantity_history_select_member_policy
on public.asset_quantity_history
for select
using (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_insert_member_policy
on public.asset_quantity_history
for insert
with check (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_update_member_policy
on public.asset_quantity_history
for update
using (public.is_household_member(asset_quantity_history.household_id))
with check (public.is_household_member(asset_quantity_history.household_id));
create policy asset_quantity_history_delete_member_policy
on public.asset_quantity_history
for delete
using (public.is_household_member(asset_quantity_history.household_id));

-- Asset price history
create policy asset_price_history_select_member_policy
on public.asset_price_history
for select
using (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_insert_member_policy
on public.asset_price_history
for insert
with check (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_update_member_policy
on public.asset_price_history
for update
using (public.is_household_member(asset_price_history.household_id))
with check (public.is_household_member(asset_price_history.household_id));
create policy asset_price_history_delete_member_policy
on public.asset_price_history
for delete
using (public.is_household_member(asset_price_history.household_id));

-- Asset cashflows
create policy asset_cashflows_select_member_policy
on public.asset_cashflows
for select
using (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_insert_member_policy
on public.asset_cashflows
for insert
with check (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_update_member_policy
on public.asset_cashflows
for update
using (public.is_household_member(asset_cashflows.household_id))
with check (public.is_household_member(asset_cashflows.household_id));
create policy asset_cashflows_delete_member_policy
on public.asset_cashflows
for delete
using (public.is_household_member(asset_cashflows.household_id));

-- Savings deposit terms (scoped via parent asset)
create policy savings_deposit_terms_select_member_policy
on public.savings_deposit_terms
for select
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_insert_member_policy
on public.savings_deposit_terms
for insert
with check (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_update_member_policy
on public.savings_deposit_terms
for update
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
)
with check (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

create policy savings_deposit_terms_delete_member_policy
on public.savings_deposit_terms
for delete
using (
  exists (
    select 1 from public.assets a
    where a.id = savings_deposit_terms.asset_id
      and public.is_household_member(a.household_id)
  )
);

-- Liabilities
create policy liabilities_select_member_policy
on public.liabilities
for select
using (public.is_household_member(liabilities.household_id));
create policy liabilities_insert_member_policy
on public.liabilities
for insert
with check (public.is_household_member(liabilities.household_id));
create policy liabilities_update_member_policy
on public.liabilities
for update
using (public.is_household_member(liabilities.household_id))
with check (public.is_household_member(liabilities.household_id));
create policy liabilities_delete_member_policy
on public.liabilities
for delete
using (public.is_household_member(liabilities.household_id));

-- Liability rate periods
create policy liability_rate_periods_select_member_policy
on public.liability_rate_periods
for select
using (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_insert_member_policy
on public.liability_rate_periods
for insert
with check (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_update_member_policy
on public.liability_rate_periods
for update
using (public.is_household_member(liability_rate_periods.household_id))
with check (public.is_household_member(liability_rate_periods.household_id));
create policy liability_rate_periods_delete_member_policy
on public.liability_rate_periods
for delete
using (public.is_household_member(liability_rate_periods.household_id));

-- Liability schedule snapshots
create policy liability_schedule_snapshots_select_member_policy
on public.liability_schedule_snapshots
for select
using (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_insert_member_policy
on public.liability_schedule_snapshots
for insert
with check (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_update_member_policy
on public.liability_schedule_snapshots
for update
using (public.is_household_member(liability_schedule_snapshots.household_id))
with check (public.is_household_member(liability_schedule_snapshots.household_id));
create policy liability_schedule_snapshots_delete_member_policy
on public.liability_schedule_snapshots
for delete
using (public.is_household_member(liability_schedule_snapshots.household_id));

-- Liability payments
create policy liability_payments_select_member_policy
on public.liability_payments
for select
using (public.is_household_member(liability_payments.household_id));
create policy liability_payments_insert_member_policy
on public.liability_payments
for insert
with check (public.is_household_member(liability_payments.household_id));
create policy liability_payments_update_member_policy
on public.liability_payments
for update
using (public.is_household_member(liability_payments.household_id))
with check (public.is_household_member(liability_payments.household_id));
create policy liability_payments_delete_member_policy
on public.liability_payments
for delete
using (public.is_household_member(liability_payments.household_id));

-- Goals
create policy goals_select_member_policy
on public.goals
for select
using (public.is_household_member(goals.household_id));
create policy goals_insert_member_policy
on public.goals
for insert
with check (public.is_household_member(goals.household_id));
create policy goals_update_member_policy
on public.goals
for update
using (public.is_household_member(goals.household_id))
with check (public.is_household_member(goals.household_id));
create policy goals_delete_member_policy
on public.goals
for delete
using (public.is_household_member(goals.household_id));

-- Goal contributions
create policy goal_contributions_select_member_policy
on public.goal_contributions
for select
using (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_insert_member_policy
on public.goal_contributions
for insert
with check (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_update_member_policy
on public.goal_contributions
for update
using (public.is_household_member(goal_contributions.household_id))
with check (public.is_household_member(goal_contributions.household_id));
create policy goal_contributions_delete_member_policy
on public.goal_contributions
for delete
using (public.is_household_member(goal_contributions.household_id));

-- Goal snapshots
create policy goal_snapshots_select_member_policy
on public.goal_snapshots
for select
using (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_insert_member_policy
on public.goal_snapshots
for insert
with check (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_update_member_policy
on public.goal_snapshots
for update
using (public.is_household_member(goal_snapshots.household_id))
with check (public.is_household_member(goal_snapshots.household_id));
create policy goal_snapshots_delete_member_policy
on public.goal_snapshots
for delete
using (public.is_household_member(goal_snapshots.household_id));

-- Health score snapshots
create policy health_score_snapshots_select_member_policy
on public.health_score_snapshots
for select
using (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_insert_member_policy
on public.health_score_snapshots
for insert
with check (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_update_member_policy
on public.health_score_snapshots
for update
using (public.is_household_member(health_score_snapshots.household_id))
with check (public.is_household_member(health_score_snapshots.household_id));
create policy health_score_snapshots_delete_member_policy
on public.health_score_snapshots
for delete
using (public.is_household_member(health_score_snapshots.household_id));

-- Insights
create policy insights_select_member_policy
on public.insights
for select
using (public.is_household_member(insights.household_id));
create policy insights_insert_member_policy
on public.insights
for insert
with check (public.is_household_member(insights.household_id));
create policy insights_update_member_policy
on public.insights
for update
using (public.is_household_member(insights.household_id))
with check (public.is_household_member(insights.household_id));
create policy insights_delete_member_policy
on public.insights
for delete
using (public.is_household_member(insights.household_id));

-- Scenarios
create policy scenarios_select_member_policy
on public.scenarios
for select
using (public.is_household_member(scenarios.household_id));
create policy scenarios_insert_member_policy
on public.scenarios
for insert
with check (public.is_household_member(scenarios.household_id));
create policy scenarios_update_member_policy
on public.scenarios
for update
using (public.is_household_member(scenarios.household_id))
with check (public.is_household_member(scenarios.household_id));
create policy scenarios_delete_member_policy
on public.scenarios
for delete
using (public.is_household_member(scenarios.household_id));

-- Scenario results
create policy scenario_results_select_member_policy
on public.scenario_results
for select
using (public.is_household_member(scenario_results.household_id));
create policy scenario_results_insert_member_policy
on public.scenario_results
for insert
with check (public.is_household_member(scenario_results.household_id));
create policy scenario_results_update_member_policy
on public.scenario_results
for update
using (public.is_household_member(scenario_results.household_id))
with check (public.is_household_member(scenario_results.household_id));
create policy scenario_results_delete_member_policy
on public.scenario_results
for delete
using (public.is_household_member(scenario_results.household_id));

-- Monthly household snapshots
create policy monthly_household_snapshots_select_member_policy
on public.monthly_household_snapshots
for select
using (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_insert_member_policy
on public.monthly_household_snapshots
for insert
with check (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_update_member_policy
on public.monthly_household_snapshots
for update
using (public.is_household_member(monthly_household_snapshots.household_id))
with check (public.is_household_member(monthly_household_snapshots.household_id));
create policy monthly_household_snapshots_delete_member_policy
on public.monthly_household_snapshots
for delete
using (public.is_household_member(monthly_household_snapshots.household_id));

-- --------------------------------------------------------------------------
-- Realtime publication for collaboration-critical tables
-- --------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'assets'
  ) then
    execute 'alter publication supabase_realtime add table public.assets';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'liabilities'
  ) then
    execute 'alter publication supabase_realtime add table public.liabilities';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'liability_payments'
  ) then
    execute 'alter publication supabase_realtime add table public.liability_payments';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goals'
  ) then
    execute 'alter publication supabase_realtime add table public.goals';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goal_contributions'
  ) then
    execute 'alter publication supabase_realtime add table public.goal_contributions';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'health_score_snapshots'
  ) then
    execute 'alter publication supabase_realtime add table public.health_score_snapshots';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'insights'
  ) then
    execute 'alter publication supabase_realtime add table public.insights';
  end if;
end $$;
