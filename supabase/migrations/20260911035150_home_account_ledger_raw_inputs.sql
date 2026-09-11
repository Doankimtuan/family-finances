-- Home-only raw account position inputs.
-- Keeps ledger arithmetic in SQL and ownership/status mapping in the existing
-- application layer while removing the account-id dependent HTTP wave.

create or replace function public.get_home_account_ledger_raw_inputs()
returns table(
  account_id uuid,
  account_name text,
  account_type text,
  opening_balance numeric,
  is_archived boolean,
  financial_scope text,
  owner_membership_id uuid,
  owner_membership_is_active boolean,
  balance numeric
)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with account_positions as (
    select
      a.id,
      a.name,
      a.type,
      a.opening_balance,
      a.is_archived,
      a.financial_scope,
      a.owner_membership_id,
      a.created_at,
      a.opening_balance + coalesce(sum(
        case
          when t.type in (
            'income',
            'debt_borrowing',
            'debt_receivable_payment',
            'transfer_in',
            'investment_sell_proceeds',
            'investment_income'
          ) then t.amount
          when t.type in (
            'expense',
            'debt_lending',
            'liability_payment',
            'loan_interest',
            'transfer_out',
            'investment_buy',
            'investment_fee'
          ) then -t.amount
          else 0
        end
      ), 0) as balance
    from public.accounts a
    left join public.transactions t
      on t.account_id = a.id
     and t.household_id = a.household_id
     and t.status in (
       'pending_mapping',
       'posted',
       'partially_refunded',
       'fully_refunded',
       'reversed'
     )
    where a.household_id = public.investment_active_household()
      and a.is_archived = false
      and a.type in (
        'cash',
        'checking',
        'savings',
        'ewallet',
        'brokerage',
        'other'
      )
    group by
      a.id,
      a.name,
      a.type,
      a.opening_balance,
      a.is_archived,
      a.financial_scope,
      a.owner_membership_id,
      a.created_at
  )
  select
    positions.id,
    positions.name,
    positions.type,
    positions.opening_balance,
    positions.is_archived,
    positions.financial_scope,
    positions.owner_membership_id,
    case
      when positions.owner_membership_id is null then true
      else exists (
        select 1
        from public.household_members owner_membership
        where owner_membership.id = positions.owner_membership_id
          and owner_membership.household_id = public.investment_active_household()
          and owner_membership.is_active = true
      )
    end,
    positions.balance
  from account_positions positions
  order by positions.created_at asc;
$function$;

revoke all on function public.get_home_account_ledger_raw_inputs() from public;
grant execute on function public.get_home_account_ledger_raw_inputs() to authenticated;
