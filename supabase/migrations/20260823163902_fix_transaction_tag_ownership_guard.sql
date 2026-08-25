-- transaction_tag_assignments has transaction_id, not source_account_id.
-- The ownership guard already validates the transaction's account above; do not
-- fall through to the unrelated source-account check.
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
;
