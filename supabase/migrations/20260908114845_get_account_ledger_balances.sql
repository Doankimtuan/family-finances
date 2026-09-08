-- Server-side ledger balances for liquid/product accounts.
-- Formula matches applyTransactionDeltas (CREDIT add, DEBIT subtract)
-- over TRANSACTION_BALANCE_STATUS_VALUES. Do not change independently.

create or replace function public.get_account_ledger_balances(p_account_ids uuid[])
returns table(account_id uuid, balance numeric)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select
    a.id,
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
    and p_account_ids is not null
    and a.id = any(p_account_ids)
  group by a.id, a.opening_balance
$function$;

revoke all on function public.get_account_ledger_balances(uuid[]) from public;
grant execute on function public.get_account_ledger_balances(uuid[]) to authenticated;
