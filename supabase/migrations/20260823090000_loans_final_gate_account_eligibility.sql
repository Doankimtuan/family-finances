-- Loans 11F: enforce the same payment-source contract at the database boundary.

create or replace function public.guard_loan_payment_account_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.accounts%rowtype;
begin
  if auth.uid() is null then
    return new;
  end if;

  select * into v_account
  from public.accounts
  where id = new.account_id
    and household_id = new.household_id
    and is_archived = false
  for update;

  if not found then
    raise exception 'account_not_found';
  end if;

  if v_account.type not in ('cash', 'checking', 'savings', 'ewallet', 'other') then
    raise exception 'loan_payment_account_not_eligible';
  end if;

  perform public.assert_financial_mutation(
    v_account.household_id,
    v_account.financial_scope,
    v_account.owner_membership_id
  );
  return new;
end;
$$;

revoke all on function public.guard_loan_payment_account_eligibility() from public, anon;
grant execute on function public.guard_loan_payment_account_eligibility() to authenticated;

drop trigger if exists loan_payment_account_eligibility on public.loan_payments;
create trigger loan_payment_account_eligibility
before insert on public.loan_payments
for each row execute function public.guard_loan_payment_account_eligibility();
