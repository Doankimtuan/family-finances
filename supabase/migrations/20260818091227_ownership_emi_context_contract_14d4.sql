-- Fix the deployed loan completion producer contract.
-- produce_inbox_item accepts camelCase loanId context; the gateway was sending
-- snake_case loan_id, so a valid owner final payment rolled back as invalid.

create or replace function public.record_loan_payment(
  p_loan_id uuid,
  p_account_id uuid,
  p_mode text default 'scheduled',
  p_paid_at date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_account public.accounts%rowtype;
  v_entry public.loan_schedule_entries%rowtype;
  v_amount numeric;
  v_principal numeric;
  v_interest numeric;
  v_paid_at date;
  v_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);
  if coalesce(p_mode, 'scheduled') <> 'scheduled' then
    raise exception 'Only scheduled loan payment is allowed';
  end if;

  select * into v_loan from public.loans l where l.id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;
  if v_loan.status <> 'active' or v_loan.remaining_principal <= 0 then
    raise exception 'Loan already completed';
  end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_loan.household_id
    and a.is_archived = false
  for update;
  if not found then raise exception 'Account not found'; end if;
  if v_account.type = 'credit_card' then
    raise exception 'Loan payment cannot use a credit card account';
  end if;

  select * into v_entry
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial')
  order by e.sequence
  limit 1
  for update;
  if not found then raise exception 'No upcoming schedule entry'; end if;

  v_principal := least(v_entry.principal_due, v_loan.remaining_principal);
  v_interest := v_entry.interest_due;
  v_amount := v_principal + v_interest;
  if v_amount <= 0 then raise exception 'Invalid payment amount'; end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date,
    note, category_id, jar_id, status, created_by
  ) values (
    v_loan.household_id, p_account_id, 'liability_payment', v_amount,
    v_loan.currency, v_paid_at, null, null, null, 'posted', v_user_id
  ) returning id into v_tx_id;

  insert into public.loan_payments (
    household_id, loan_id, account_id, transaction_id, amount,
    principal_paid, interest_paid, paid_at, created_by
  ) values (
    v_loan.household_id, p_loan_id, p_account_id, v_tx_id, v_amount,
    v_principal, v_interest, v_paid_at, v_user_id
  ) returning id into v_payment_id;

  v_remaining := greatest(0, v_loan.remaining_principal - v_principal);
  v_completed := v_remaining <= 0;

  update public.loan_schedule_entries
  set status = 'paid', paid_at = v_paid_at, loan_payment_id = v_payment_id,
      updated_at = timezone('utc', now())
  where id = v_entry.id;

  select e.due_date into v_next
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status = 'upcoming'
  order by e.sequence limit 1;

  update public.loans
  set remaining_principal = v_remaining,
      status = case when v_completed then 'completed' else 'active' end,
      next_payment_date = case when v_completed then null else v_next end,
      updated_at = timezone('utc', now())
  where id = p_loan_id;

  if v_completed then
    v_item_id := (
      select (public.produce_inbox_item(
        p_household_id => v_loan.household_id,
        p_kind => 'emi_complete',
        p_source_type => 'guided',
        p_source_id => p_loan_id,
        p_amount => v_loan.monthly_payment,
        p_currency => v_loan.currency,
        p_title => v_loan.name,
        p_context => jsonb_build_object(
          'flow', 'loan_complete',
          'loanId', p_loan_id,
          'principal', v_loan.principal
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  return jsonb_build_object(
    'ok', true, 'paymentId', v_payment_id, 'transactionId', v_tx_id,
    'remainingPrincipal', v_remaining, 'completed', v_completed,
    'inboxItemId', v_item_id, 'amount', v_amount,
    'principalPaid', v_principal, 'interestPaid', v_interest, 'feePaid', 0,
    'sourceDelta', -v_amount, 'scheduleEntryId', v_entry.id
  );
end;
$$;
revoke all on function public.record_loan_payment(uuid, uuid, text, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, text, date) to authenticated;
