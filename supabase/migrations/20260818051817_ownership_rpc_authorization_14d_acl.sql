-- PROMPT 14D — ownership-aware authorization for SECURITY DEFINER mutations.
--
-- SECURITY DEFINER RPCs bypass table RLS. These transaction-local BEFORE
-- triggers are the shared enforcement point for every RPC and direct write:
-- roots validate the resource being changed; child guards validate every
-- financial resource involved in a cross-resource mutation.
--
-- auth.uid() is intentionally used only for authenticated request paths.
-- Internal workers run without a JWT and retain their existing trusted path.

create or replace function public.assert_financial_mutation(
  p_household_id uuid,
  p_financial_scope text,
  p_owner_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.can_mutate_financial_resource(
       p_household_id, p_financial_scope, p_owner_membership_id
     ) then
    raise exception 'not_allowed';
  end if;
end;
$$;

revoke all on function public.assert_financial_mutation(uuid, text, uuid) from public;
revoke all on function public.assert_financial_mutation(uuid, text, uuid) from anon;
grant execute on function public.assert_financial_mutation(uuid, text, uuid) to authenticated;

create or replace function public.guard_financial_root_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_cleanup boolean := false;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    perform public.assert_financial_mutation(
      new.household_id, new.financial_scope, new.owner_membership_id
    );
    return new;
  end if;

  if tg_table_name = 'accounts' then
    v_cleanup := coalesce((v_old->>'is_archived')::boolean, false) = false
      and coalesce((v_new->>'is_archived')::boolean, false) = true;
  elsif tg_table_name = 'liabilities' then
    v_cleanup := coalesce((v_old->>'is_archived')::boolean, false) = false
      and coalesce((v_new->>'is_archived')::boolean, false) = true;
  elsif tg_table_name = 'loans' then
    v_cleanup := (v_old->>'status') <> 'archived'
      and (v_new->>'status') = 'archived';
  elsif tg_table_name = 'savings' then
    v_cleanup := (v_old->>'status') not in ('early_closed', 'closed')
      and (v_new->>'status') in ('early_closed', 'closed');
  elsif tg_table_name = 'goals' then
    v_cleanup := (v_old->>'status') <> 'cancelled'
      and (v_new->>'status') = 'cancelled';
  end if;

  if v_cleanup and public.can_admin_cleanup(old.household_id) then
    return new;
  end if;

  perform public.assert_financial_mutation(
    old.household_id, old.financial_scope, old.owner_membership_id
  );
  return new;
end;
$$;

revoke all on function public.guard_financial_root_mutation() from public;
revoke all on function public.guard_financial_root_mutation() from anon;
grant execute on function public.guard_financial_root_mutation() to authenticated;

create or replace function public.guard_transaction_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.accounts%rowtype;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op <> 'INSERT' then
    select * into v_account from public.accounts where id = old.account_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(
      v_account.household_id, v_account.financial_scope, v_account.owner_membership_id
    );
  end if;

  if tg_op <> 'DELETE' then
    select * into v_account from public.accounts where id = new.account_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(
      v_account.household_id, v_account.financial_scope, v_account.owner_membership_id
    );
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.guard_transaction_mutation() from public;
revoke all on function public.guard_transaction_mutation() from anon;
grant execute on function public.guard_transaction_mutation() to authenticated;

create or replace function public.guard_cross_resource_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_household_id uuid;
  v_scope text;
  v_owner uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_table_name in ('loan_payments', 'loan_schedule_entries', 'loan_interest_rate_periods') then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.loans where id = (v_row->>'loan_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    if tg_table_name = 'loan_payments' then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.accounts where id = (v_row->>'account_id')::uuid for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
  elsif tg_table_name = 'debt_payments' then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.liabilities where id = (v_row->>'liability_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = (v_row->>'account_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'card_payments' then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = (v_row->>'card_account_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name in ('card_billing_months', 'card_billing_items', 'credit_card_settings') then
    v_id := coalesce((v_row->>'card_account_id')::uuid, (v_row->>'account_id')::uuid);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = v_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'transaction_tag_assignments' then
    select a.household_id, a.financial_scope, a.owner_membership_id into v_household_id, v_scope, v_owner
    from public.transactions t join public.accounts a on a.id = t.account_id
    where t.id = (v_row->>'transaction_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = (v_row->>'source_account_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name in ('investment_valuations', 'investment_operations', 'investment_fees') then
    v_id := coalesce((v_row->>'holding_id')::uuid, (v_row->>'source_holding_id')::uuid, (v_row->>'fee_holding_id')::uuid);
    if v_id is not null then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.investment_holdings where id = v_id for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
    if tg_table_name = 'investment_fees' and v_id is null then
      select o.source_holding_id into v_id from public.investment_operations o
      where o.id = (v_row->>'operation_id')::uuid;
      if v_id is not null then
        select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
        from public.investment_holdings where id = v_id for update;
        if not found then raise exception 'resource_not_found'; end if;
        perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
      end if;
    end if;
    if tg_table_name in ('investment_operations', 'investment_fees') then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.accounts where id = (v_row->>'cash_account_id')::uuid for update;
      if found then perform public.assert_financial_mutation(v_household_id, v_scope, v_owner); end if;
    end if;
    if tg_table_name = 'investment_operations' and (v_row->>'destination_holding_id') is not null then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.investment_holdings where id = (v_row->>'destination_holding_id')::uuid for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
  elsif tg_table_name in ('goal_contributions', 'goal_period_funded_snapshots') then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.goals where id = (v_row->>'goal_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'saving_cycles' or tg_table_name = 'early_withdrawals' then
    v_id := coalesce((v_row->>'saving_id')::uuid, (v_row->>'saving_id')::uuid);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.savings where id = v_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.guard_cross_resource_mutation() from public;
revoke all on function public.guard_cross_resource_mutation() from anon;
grant execute on function public.guard_cross_resource_mutation() to authenticated;

create or replace function public.guard_goal_funding_link_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v jsonb := to_jsonb(coalesce(new, old));
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  select g.household_id, g.financial_scope, g.owner_membership_id into r
  from public.goals g where g.id = (v->>'goal_id')::uuid for update;
  if not found then raise exception 'resource_not_found'; end if;
  perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);

  if (v->>'account_id') is not null then
    select a.household_id, a.financial_scope, a.owner_membership_id into r
    from public.accounts a where a.id = (v->>'account_id')::uuid for update;
  elsif (v->>'saving_id') is not null then
    select s.household_id, s.financial_scope, s.owner_membership_id into r
    from public.savings s where s.id = (v->>'saving_id')::uuid for update;
  elsif (v->>'holding_id') is not null then
    select h.household_id, h.financial_scope, h.owner_membership_id into r
    from public.investment_holdings h where h.id = (v->>'holding_id')::uuid for update;
  elsif (v->>'loan_id') is not null then
    select l.household_id, l.financial_scope, l.owner_membership_id into r
    from public.loans l where l.id = (v->>'loan_id')::uuid for update;
  elsif (v->>'debt_id') is not null then
    select d.household_id, d.financial_scope, d.owner_membership_id into r
    from public.liabilities d where d.id = (v->>'debt_id')::uuid for update;
  end if;
  if found then
    perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);
    if r.financial_scope <> (select g.financial_scope from public.goals g where g.id = (v->>'goal_id')::uuid) then
      raise exception 'cross_scope_not_allowed';
    end if;
    if r.financial_scope = 'personal'
       and r.owner_membership_id <> (select g.owner_membership_id from public.goals g where g.id = (v->>'goal_id')::uuid) then
      raise exception 'cross_owner_transfer_not_allowed';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.guard_goal_funding_link_mutation() from public;
revoke all on function public.guard_goal_funding_link_mutation() from anon;
grant execute on function public.guard_goal_funding_link_mutation() to authenticated;

create or replace function public.guard_inbox_source_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb := to_jsonb(coalesce(new, old));
  v_id uuid;
  r record;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then return new; end if;
  if (v->>'kind') in ('unmapped_expense', 'income_suggest') and (v->>'source_type') = 'transaction' then
    select a.household_id, a.financial_scope, a.owner_membership_id into r
    from public.transactions t join public.accounts a on a.id = t.account_id
    where t.id = (v->>'source_id')::uuid for update;
  elsif (v->>'kind') in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_id := coalesce((v->'context_json'->>'savingId')::uuid, (v->>'source_id')::uuid);
    select household_id, financial_scope, owner_membership_id into r
    from public.savings where id = v_id for update;
  else
    return coalesce(new, old);
  end if;
  if not found then raise exception 'resource_not_found'; end if;
  perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);
  return coalesce(new, old);
end;
$$;

revoke all on function public.guard_inbox_source_mutation() from public;
revoke all on function public.guard_inbox_source_mutation() from anon;
grant execute on function public.guard_inbox_source_mutation() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['accounts','savings','investment_holdings','loans','liabilities','goals'] loop
    execute format('drop trigger if exists ownership_rpc_root_guard on public.%I', t);
    execute format('create trigger ownership_rpc_root_guard before insert or update on public.%I for each row execute function public.guard_financial_root_mutation()', t);
  end loop;
end $$;

drop trigger if exists ownership_rpc_transaction_guard on public.transactions;
create trigger ownership_rpc_transaction_guard before insert or update or delete on public.transactions
for each row execute function public.guard_transaction_mutation();

do $$
declare
  t text;
begin
  foreach t in array array['loan_payments','loan_schedule_entries','loan_interest_rate_periods','debt_payments','card_payments','card_billing_months','card_billing_items','credit_card_settings','transaction_tag_assignments','investment_operations','investment_fees','investment_valuations','goal_contributions','goal_period_funded_snapshots','saving_cycles','early_withdrawals'] loop
    execute format('drop trigger if exists ownership_rpc_cross_resource_guard on public.%I', t);
    execute format('create trigger ownership_rpc_cross_resource_guard before insert or update or delete on public.%I for each row execute function public.guard_cross_resource_mutation()', t);
  end loop;
end $$;

drop trigger if exists ownership_rpc_goal_funding_guard on public.goal_funding_links;
create trigger ownership_rpc_goal_funding_guard before insert or update or delete on public.goal_funding_links
for each row execute function public.guard_goal_funding_link_mutation();

drop trigger if exists ownership_rpc_inbox_source_guard on public.inbox_items;
create trigger ownership_rpc_inbox_source_guard before update on public.inbox_items
for each row execute function public.guard_inbox_source_mutation();

comment on function public.assert_financial_mutation(uuid, text, uuid) is
  '14D canonical RPC guard: active household member; household resources are partner-equal, personal resources are owner-write-only.';

-- Plan remains household-only: personal account transactions are excluded from
-- posted-income, jar consumption, monthly review and ritual divergence reads.
;
