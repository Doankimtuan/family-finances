-- PROMPT 14C — Ownership-aware RLS (guarded for live DB state).
-- See supabase/migrations/20260818150000_ownership_aware_rls.sql for the
-- canonical file. This applies the identical SQL.

-- ---------------------------------------------------------------------------
-- 1. Authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.active_membership_id(p_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hm.id
  from public.household_members hm
  where hm.household_id = p_household_id
    and hm.user_id = auth.uid()
    and hm.is_active = true
  limit 1;
$$;

revoke all on function public.active_membership_id(uuid) from public;
grant execute on function public.active_membership_id(uuid) to authenticated;

create or replace function public.can_mutate_financial_resource(
  p_household_id uuid,
  p_financial_scope text,
  p_owner_membership_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.active_membership_id(p_household_id) is not null
    and (
      p_financial_scope = 'household'
      or (
        p_financial_scope = 'personal'
        and public.active_membership_id(p_household_id) = p_owner_membership_id
      )
    );
$$;

revoke all on function public.can_mutate_financial_resource(uuid, text, uuid) from public;
grant execute on function public.can_mutate_financial_resource(uuid, text, uuid) to authenticated;

create or replace function public.is_resource_owner(
  p_household_id uuid,
  p_owner_membership_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner_membership_id is not null
    and public.active_membership_id(p_household_id) = p_owner_membership_id;
$$;

revoke all on function public.is_resource_owner(uuid, uuid) from public;
grant execute on function public.is_resource_owner(uuid, uuid) to authenticated;

create or replace function public.can_admin_cleanup(p_household_id uuid)
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
      and hm.role = 'admin'
  );
$$;

revoke all on function public.can_admin_cleanup(uuid) from public;
grant execute on function public.can_admin_cleanup(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Ownership immutability trigger
-- ---------------------------------------------------------------------------

create or replace function public.guard_ownership_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.financial_scope is distinct from old.financial_scope
     or new.owner_membership_id is distinct from old.owner_membership_id then
    raise exception 'Ownership is immutable: financial_scope and owner_membership_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_ownership_immutable() from public;
grant execute on function public.guard_ownership_immutable() to authenticated;

drop trigger if exists guard_ownership_immutable_trg on public.accounts;
create trigger guard_ownership_immutable_trg
  before update on public.accounts
  for each row execute function public.guard_ownership_immutable();

drop trigger if exists guard_ownership_immutable_trg on public.savings;
create trigger guard_ownership_immutable_trg
  before update on public.savings
  for each row execute function public.guard_ownership_immutable();

drop trigger if exists guard_ownership_immutable_trg on public.loans;
create trigger guard_ownership_immutable_trg
  before update on public.loans
  for each row execute function public.guard_ownership_immutable();

drop trigger if exists guard_ownership_immutable_trg on public.liabilities;
create trigger guard_ownership_immutable_trg
  before update on public.liabilities
  for each row execute function public.guard_ownership_immutable();

drop trigger if exists guard_ownership_immutable_trg on public.goals;
create trigger guard_ownership_immutable_trg
  before update on public.goals
  for each row execute function public.guard_ownership_immutable();

-- ---------------------------------------------------------------------------
-- 3. Ownership-aware RLS policies
-- ---------------------------------------------------------------------------

drop policy if exists accounts_select_member on public.accounts;
drop policy if exists accounts_insert_member on public.accounts;
drop policy if exists accounts_update_member on public.accounts;

create policy accounts_select_member on public.accounts
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy accounts_insert_member on public.accounts
  for insert to authenticated
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy accounts_update_member on public.accounts
  for update to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  )
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

drop policy if exists transactions_select_member on public.transactions;
drop policy if exists transactions_insert_member on public.transactions;
drop policy if exists transactions_update_member on public.transactions;
drop policy if exists transactions_delete_member on public.transactions;

create policy transactions_select_member on public.transactions
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy transactions_insert_member on public.transactions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy transactions_update_member on public.transactions
  for update to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy transactions_delete_member on public.transactions
  for delete to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

drop policy if exists savings_select_member on public.savings;
drop policy if exists savings_insert_member on public.savings;
drop policy if exists savings_update_member on public.savings;

create policy savings_select_member on public.savings
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy savings_insert_member on public.savings
  for insert to authenticated
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy savings_update_member on public.savings
  for update to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  )
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

drop policy if exists saving_cycles_select_member on public.saving_cycles;
drop policy if exists saving_cycles_insert_member on public.saving_cycles;
drop policy if exists saving_cycles_update_member on public.saving_cycles;

create policy saving_cycles_select_member on public.saving_cycles
  for select to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = saving_cycles.saving_id
        and public.active_membership_id(s.household_id) is not null
    )
  );

create policy saving_cycles_insert_member on public.saving_cycles
  for insert to authenticated
  with check (
    exists (
      select 1 from public.savings s
      where s.id = saving_cycles.saving_id
        and public.can_mutate_financial_resource(
          s.household_id, s.financial_scope, s.owner_membership_id
        )
    )
  );

create policy saving_cycles_update_member on public.saving_cycles
  for update to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = saving_cycles.saving_id
        and public.can_mutate_financial_resource(
          s.household_id, s.financial_scope, s.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.savings s
      where s.id = saving_cycles.saving_id
        and public.can_mutate_financial_resource(
          s.household_id, s.financial_scope, s.owner_membership_id
        )
    )
  );

drop policy if exists early_withdrawals_select_member on public.early_withdrawals;
drop policy if exists early_withdrawals_insert_member on public.early_withdrawals;

create policy early_withdrawals_select_member on public.early_withdrawals
  for select to authenticated
  using (
    exists (
      select 1 from public.savings s
      where s.id = early_withdrawals.saving_id
        and public.active_membership_id(s.household_id) is not null
    )
  );

create policy early_withdrawals_insert_member on public.early_withdrawals
  for insert to authenticated
  with check (
    exists (
      select 1 from public.savings s
      where s.id = early_withdrawals.saving_id
        and public.can_mutate_financial_resource(
          s.household_id, s.financial_scope, s.owner_membership_id
        )
    )
  );

drop policy if exists loans_select_member on public.loans;
drop policy if exists loans_insert_member on public.loans;
drop policy if exists loans_update_member on public.loans;

create policy loans_select_member on public.loans
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy loans_insert_member on public.loans
  for insert to authenticated
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy loans_update_member on public.loans
  for update to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  )
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

drop policy if exists loan_payments_select_member on public.loan_payments;
drop policy if exists loan_payments_insert_member on public.loan_payments;

create policy loan_payments_select_member on public.loan_payments
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy loan_payments_insert_member on public.loan_payments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.loans l
      where l.id = loan_payments.loan_id
        and public.can_mutate_financial_resource(
          l.household_id, l.financial_scope, l.owner_membership_id
        )
    )
  );

drop policy if exists loan_schedule_entries_select_member on public.loan_schedule_entries;
create policy loan_schedule_entries_select_member on public.loan_schedule_entries
  for select to authenticated
  using (
    exists (
      select 1 from public.loans l
      where l.id = loan_schedule_entries.loan_id
        and public.active_membership_id(l.household_id) is not null
    )
  );

drop policy if exists loan_interest_rate_periods_select_member
  on public.loan_interest_rate_periods;
create policy loan_interest_rate_periods_select_member
  on public.loan_interest_rate_periods
  for select to authenticated
  using (
    exists (
      select 1 from public.loans l
      where l.id = loan_interest_rate_periods.loan_id
        and public.active_membership_id(l.household_id) is not null
    )
  );

drop policy if exists liabilities_select_member on public.liabilities;
drop policy if exists liabilities_insert_member on public.liabilities;
drop policy if exists liabilities_update_member on public.liabilities;

create policy liabilities_select_member on public.liabilities
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy liabilities_insert_member on public.liabilities
  for insert to authenticated
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy liabilities_update_member on public.liabilities
  for update to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  )
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

drop policy if exists debt_payments_select_member on public.debt_payments;
create policy debt_payments_select_member on public.debt_payments
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

drop policy if exists goals_select_member on public.goals;
drop policy if exists goals_insert_member on public.goals;
drop policy if exists goals_update_member on public.goals;
drop policy if exists goals_delete_member on public.goals;

create policy goals_select_member on public.goals
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy goals_insert_member on public.goals
  for insert to authenticated
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy goals_update_member on public.goals
  for update to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  )
  with check (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

create policy goals_delete_member on public.goals
  for delete to authenticated
  using (
    public.can_mutate_financial_resource(
      household_id, financial_scope, owner_membership_id
    )
  );

drop policy if exists goal_contributions_select_member on public.goal_contributions;
drop policy if exists goal_contributions_insert_member on public.goal_contributions;

create policy goal_contributions_select_member on public.goal_contributions
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy goal_contributions_insert_member on public.goal_contributions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id
        and public.can_mutate_financial_resource(
          g.household_id, g.financial_scope, g.owner_membership_id
        )
    )
  );

drop policy if exists goal_funding_links_select_member on public.goal_funding_links;
drop policy if exists goal_funding_links_insert_member on public.goal_funding_links;
drop policy if exists goal_funding_links_update_member on public.goal_funding_links;

create policy goal_funding_links_select_member on public.goal_funding_links
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

create policy goal_funding_links_insert_member on public.goal_funding_links
  for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and exists (
      select 1 from public.goals g
      where g.id = goal_funding_links.goal_id
        and g.household_id = goal_funding_links.household_id
        and g.status in ('active', 'ready')
        and public.can_mutate_financial_resource(
          g.household_id, g.financial_scope, g.owner_membership_id
        )
    )
  );

create policy goal_funding_links_update_member on public.goal_funding_links
  for update to authenticated
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_funding_links.goal_id
        and public.can_mutate_financial_resource(
          g.household_id, g.financial_scope, g.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_funding_links.goal_id
        and public.can_mutate_financial_resource(
          g.household_id, g.financial_scope, g.owner_membership_id
        )
    )
  );

drop policy if exists credit_card_settings_select_member on public.credit_card_settings;
drop policy if exists credit_card_settings_insert_member on public.credit_card_settings;
drop policy if exists credit_card_settings_update_member on public.credit_card_settings;

create policy credit_card_settings_select_member on public.credit_card_settings
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_settings.account_id
        and public.active_membership_id(a.household_id) is not null
    )
  );

create policy credit_card_settings_insert_member on public.credit_card_settings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_settings.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy credit_card_settings_update_member on public.credit_card_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_settings.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_settings.account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

drop policy if exists card_billing_months_select_member on public.card_billing_months;
drop policy if exists card_billing_months_insert_member on public.card_billing_months;
drop policy if exists card_billing_months_update_member on public.card_billing_months;

create policy card_billing_months_select_member on public.card_billing_months
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_months.card_account_id
        and public.active_membership_id(a.household_id) is not null
    )
  );

create policy card_billing_months_insert_member on public.card_billing_months
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_months.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy card_billing_months_update_member on public.card_billing_months
  for update to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_months.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_months.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

drop policy if exists card_billing_items_select_member on public.card_billing_items;
drop policy if exists card_billing_items_insert_member on public.card_billing_items;
drop policy if exists card_billing_items_update_member on public.card_billing_items;

create policy card_billing_items_select_member on public.card_billing_items
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_items.card_account_id
        and public.active_membership_id(a.household_id) is not null
    )
  );

create policy card_billing_items_insert_member on public.card_billing_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_items.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy card_billing_items_update_member on public.card_billing_items
  for update to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_items.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = card_billing_items.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

drop policy if exists card_payments_select_member on public.card_payments;
create policy card_payments_select_member on public.card_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = card_payments.card_account_id
        and public.active_membership_id(a.household_id) is not null
    )
  );

drop policy if exists card_payment_applications_select_member
  on public.card_payment_applications;
create policy card_payment_applications_select_member
  on public.card_payment_applications
  for select to authenticated
  using (
    exists (
      select 1 from public.card_payments cp
      where cp.id = card_payment_applications.card_payment_id
        and exists (
          select 1 from public.accounts a
          where a.id = cp.card_account_id
            and public.active_membership_id(a.household_id) is not null
        )
    )
  );

drop policy if exists credit_card_installment_schedule_select_member
  on public.credit_card_installment_schedule;
create policy credit_card_installment_schedule_select_member
  on public.credit_card_installment_schedule
  for select to authenticated
  using (
    exists (
      select 1 from public.credit_card_installments ci
      where ci.id = credit_card_installment_schedule.installment_id
        and exists (
          select 1 from public.accounts a
          where a.id = ci.card_account_id
            and public.active_membership_id(a.household_id) is not null
        )
    )
  );

drop policy if exists credit_card_installment_schedule_insert_member
  on public.credit_card_installment_schedule;
create policy credit_card_installment_schedule_insert_member
  on public.credit_card_installment_schedule
  for insert to authenticated
  with check (
    exists (
      select 1 from public.credit_card_installments ci
      where ci.id = credit_card_installment_schedule.installment_id
        and exists (
          select 1 from public.accounts a
          where a.id = ci.card_account_id
            and public.can_mutate_financial_resource(
              a.household_id, a.financial_scope, a.owner_membership_id
            )
        )
    )
  );

drop policy if exists credit_card_installment_schedule_update_member
  on public.credit_card_installment_schedule;
create policy credit_card_installment_schedule_update_member
  on public.credit_card_installment_schedule
  for update to authenticated
  using (
    exists (
      select 1 from public.credit_card_installments ci
      where ci.id = credit_card_installment_schedule.installment_id
        and exists (
          select 1 from public.accounts a
          where a.id = ci.card_account_id
            and public.can_mutate_financial_resource(
              a.household_id, a.financial_scope, a.owner_membership_id
            )
        )
    )
  )
  with check (
    exists (
      select 1 from public.credit_card_installments ci
      where ci.id = credit_card_installment_schedule.installment_id
        and exists (
          select 1 from public.accounts a
          where a.id = ci.card_account_id
            and public.can_mutate_financial_resource(
              a.household_id, a.financial_scope, a.owner_membership_id
            )
        )
    )
  );

drop policy if exists credit_card_installments_select_member on public.credit_card_installments;
drop policy if exists credit_card_installments_insert_member on public.credit_card_installments;
drop policy if exists credit_card_installments_update_member on public.credit_card_installments;
drop policy if exists credit_card_installments_delete_member on public.credit_card_installments;

create policy credit_card_installments_select_member on public.credit_card_installments
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_installments.card_account_id
        and public.active_membership_id(a.household_id) is not null
    )
  );

create policy credit_card_installments_insert_member on public.credit_card_installments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_installments.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy credit_card_installments_update_member on public.credit_card_installments
  for update to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_installments.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_installments.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

create policy credit_card_installments_delete_member on public.credit_card_installments
  for delete to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = credit_card_installments.card_account_id
        and public.can_mutate_financial_resource(
          a.household_id, a.financial_scope, a.owner_membership_id
        )
    )
  );

drop policy if exists investment_holdings_select on public.investment_holdings;
create policy investment_holdings_select on public.investment_holdings
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

drop policy if exists investment_operations_select on public.investment_operations;
create policy investment_operations_select on public.investment_operations
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

drop policy if exists investment_fees_select on public.investment_fees;
create policy investment_fees_select on public.investment_fees
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

drop policy if exists investment_valuations_select on public.investment_valuations;
create policy investment_valuations_select on public.investment_valuations
  for select to authenticated
  using (public.active_membership_id(household_id) is not null);

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'investment_events') then
    drop policy if exists investment_events_select on public.investment_events;
    create policy investment_events_select on public.investment_events
      for select to authenticated
      using (public.active_membership_id(household_id) is not null);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'investment_lots') then
    drop policy if exists investment_lots_select on public.investment_lots;
    create policy investment_lots_select on public.investment_lots
      for select to authenticated
      using (
        exists (
          select 1 from public.investment_holdings h
          where h.id = investment_lots.position_id
            and public.active_membership_id(h.household_id) is not null
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Narrow Admin operational-cleanup RPC
-- ---------------------------------------------------------------------------

create or replace function public.admin_archive_financial_resource(
  p_resource_type text,
  p_resource_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_row_found boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;

  if p_resource_type not in ('account', 'liability', 'loan', 'saving', 'goal') then
    return jsonb_build_object('ok', false, 'reason', 'unsupported_type');
  end if;

  if p_resource_type = 'account' then
    select household_id into v_household_id
    from public.accounts
    where id = p_resource_id and is_archived = false;
    v_row_found := found;
  elsif p_resource_type = 'liability' then
    select household_id into v_household_id
    from public.liabilities
    where id = p_resource_id and is_archived = false;
    v_row_found := found;
  elsif p_resource_type = 'loan' then
    select household_id into v_household_id
    from public.loans
    where id = p_resource_id and status <> 'archived';
    v_row_found := found;
  elsif p_resource_type = 'saving' then
    select household_id into v_household_id
    from public.savings
    where id = p_resource_id and status not in ('early_closed', 'closed');
    v_row_found := found;
  elsif p_resource_type = 'goal' then
    select household_id into v_household_id
    from public.goals
    where id = p_resource_id and status <> 'cancelled';
    v_row_found := found;
  end if;

  if not v_row_found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not public.can_admin_cleanup(v_household_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  if p_resource_type = 'account' then
    update public.accounts set is_archived = true where id = p_resource_id;
  elsif p_resource_type = 'liability' then
    update public.liabilities set is_archived = true where id = p_resource_id;
  elsif p_resource_type = 'loan' then
    update public.loans set status = 'archived' where id = p_resource_id;
  elsif p_resource_type = 'saving' then
    update public.savings set status = 'closed' where id = p_resource_id;
  elsif p_resource_type = 'goal' then
    update public.goals set status = 'cancelled' where id = p_resource_id;
  end if;

  return jsonb_build_object('ok', true, 'resource_type', p_resource_type);
end;
$$;

revoke all on function public.admin_archive_financial_resource(text, uuid) from public;
grant execute on function public.admin_archive_financial_resource(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Remove the 14B interim lock — REPLACED by ownership-aware policies above.
-- ---------------------------------------------------------------------------

drop trigger if exists accounts_force_household_scope_trg on public.accounts;
drop trigger if exists savings_force_household_scope_trg on public.savings;
drop trigger if exists loans_force_household_scope_trg on public.loans;
drop trigger if exists liabilities_force_household_scope_trg on public.liabilities;
drop trigger if exists goals_force_household_scope_trg on public.goals;

drop function if exists public.force_household_scope();

-- ---------------------------------------------------------------------------
-- 6. Grants + defense-in-depth column REVOKEs
-- ---------------------------------------------------------------------------

revoke insert (financial_scope, owner_membership_id) on public.accounts from authenticated;
revoke update (financial_scope, owner_membership_id) on public.accounts from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.savings from authenticated;
revoke update (financial_scope, owner_membership_id) on public.savings from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.loans from authenticated;
revoke update (financial_scope, owner_membership_id) on public.loans from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.liabilities from authenticated;
revoke update (financial_scope, owner_membership_id) on public.liabilities from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.goals from authenticated;
revoke update (financial_scope, owner_membership_id) on public.goals from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.investment_holdings from authenticated;
revoke update (financial_scope, owner_membership_id) on public.investment_holdings from authenticated;

-- ---------------------------------------------------------------------------
-- 7. Indexes for parent-join lookups in RLS
-- ---------------------------------------------------------------------------

create index if not exists idx_saving_cycles_saving on public.saving_cycles (saving_id);
create index if not exists idx_early_withdrawals_saving on public.early_withdrawals (saving_id);
create index if not exists idx_loan_payments_loan on public.loan_payments (loan_id);
create index if not exists idx_loan_schedule_entries_loan on public.loan_schedule_entries (loan_id);
create index if not exists idx_loan_interest_rate_periods_loan on public.loan_interest_rate_periods (loan_id);
create index if not exists idx_debt_payments_liability on public.debt_payments (liability_id);
create index if not exists idx_goal_contributions_goal on public.goal_contributions (goal_id);
create index if not exists idx_goal_funding_links_goal on public.goal_funding_links (goal_id);
create index if not exists idx_credit_card_settings_account on public.credit_card_settings (account_id);
create index if not exists idx_card_billing_months_card on public.card_billing_months (card_account_id);
create index if not exists idx_card_billing_items_card on public.card_billing_items (card_account_id);
create index if not exists idx_card_payments_card on public.card_payments (card_account_id);
create index if not exists idx_card_payment_applications_payment on public.card_payment_applications (card_payment_id);
create index if not exists idx_credit_card_installments_card on public.credit_card_installments (card_account_id);
create index if not exists idx_credit_card_installment_schedule_installment on public.credit_card_installment_schedule (installment_id);
create index if not exists idx_investment_operations_holding on public.investment_operations (source_holding_id, destination_holding_id);
create index if not exists idx_investment_fees_operation on public.investment_fees (operation_id);
create index if not exists idx_investment_valuations_holding on public.investment_valuations (holding_id);

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'investment_events') then
    create index if not exists idx_investment_events_holding on public.investment_events (position_id);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'investment_lots') then
    create index if not exists idx_investment_lots_holding on public.investment_lots (position_id);
  end if;
end $$;;
