-- Loans 11B: P0 financial integrity gate.
-- Idempotency is scoped by operation table and household. Fee support remains deferred.

alter table public.loans
  add column if not exists idempotency_key text;

create unique index if not exists loans_household_idempotency_unique
  on public.loans (household_id, idempotency_key)
  where idempotency_key is not null;

alter table public.loan_payments
  add column if not exists idempotency_key text;

create unique index if not exists loan_payments_household_idempotency_unique
  on public.loan_payments (household_id, idempotency_key)
  where idempotency_key is not null;

alter function public.create_loan_with_schedule(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,
  date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text
) rename to _create_loan_with_schedule_unchecked_11b;

create or replace function public.create_loan_with_schedule(
  p_name text,
  p_lender text,
  p_loan_type text,
  p_principal numeric,
  p_annual_interest_rate numeric,
  p_repayment_method text,
  p_interest_strategy text,
  p_promo_fixed_rate numeric,
  p_promo_fixed_months int,
  p_promo_floating_rate numeric,
  p_promo_rate_effective_on date,
  p_term_months int,
  p_start_date date,
  p_first_payment_date date,
  p_monthly_payment numeric,
  p_total_interest numeric,
  p_total_repayment numeric,
  p_expected_end_date date,
  p_note text,
  p_currency char(3),
  p_schedule jsonb,
  p_rate_periods jsonb,
  p_financial_scope text default 'household',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_existing public.loans%rowtype;
  v_result jsonb;
  v_key text;
begin
  select hm.household_id
    into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
    and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_key is null then
    raise exception 'Idempotency key required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_household_id::text || ':loan:create:' || v_key, 0)
  );

  select * into v_existing
  from public.loans l
  where l.household_id = v_household_id
    and l.idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'loanId', v_existing.id,
      'idempotentReplay', true
    );
  end if;

  v_result := public._create_loan_with_schedule_unchecked_11b(
    p_name, p_lender, p_loan_type, p_principal, p_annual_interest_rate,
    p_repayment_method, p_interest_strategy, p_promo_fixed_rate,
    p_promo_fixed_months, p_promo_floating_rate, p_promo_rate_effective_on,
    p_term_months, p_start_date, p_first_payment_date, p_monthly_payment,
    p_total_interest, p_total_repayment, p_expected_end_date, p_note,
    p_currency, p_schedule, p_rate_periods, p_financial_scope
  );

  update public.loans
  set idempotency_key = v_key
  where id = (v_result->>'loanId')::uuid
    and household_id = v_household_id;

  return v_result || jsonb_build_object('idempotentReplay', false);
end;
$$;

revoke all on function public._create_loan_with_schedule_unchecked_11b(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,
  date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text
) from public, anon, authenticated;

revoke all on function public.create_loan_with_schedule(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,
  date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text,text
) from public, anon;
grant execute on function public.create_loan_with_schedule(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,
  date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text,text
) to authenticated;

alter function public.record_loan_payment(uuid, uuid, text, date)
  rename to _record_loan_payment_unchecked_11b;

create or replace function public.record_loan_payment(
  p_loan_id uuid,
  p_account_id uuid,
  p_mode text default 'scheduled',
  p_paid_at date default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_key text;
  v_existing public.loan_payments%rowtype;
  v_result jsonb;
  v_remaining numeric;
  v_status text;
  v_schedule_entry_id uuid;
  v_interest_transaction_id uuid;
  v_transaction_ids jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id
    into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_key is null then
    raise exception 'Idempotency key required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_household_id::text || ':loan:payment:' || v_key, 0)
  );

  select * into v_existing
  from public.loan_payments lp
  where lp.household_id = v_household_id
    and lp.idempotency_key = v_key;
  if found then
    select l.remaining_principal, l.status
      into v_remaining, v_status
    from public.loans l
    where l.id = v_existing.loan_id
      and l.household_id = v_household_id;
    select e.id into v_schedule_entry_id
    from public.loan_schedule_entries e
    where e.loan_payment_id = v_existing.id
    order by e.sequence
    limit 1;
    select t.id into v_interest_transaction_id
    from public.transactions t
    where t.loan_payment_id = v_existing.id
      and t.type = 'loan_interest'
    order by t.created_at
    limit 1;
    select coalesce(jsonb_agg(t.id order by t.created_at), '[]'::jsonb)
      into v_transaction_ids
    from public.transactions t
    where t.loan_payment_id = v_existing.id;
    return jsonb_build_object(
      'ok', true,
      'paymentId', v_existing.id,
      'transactionId', v_existing.transaction_id,
      'interestTransactionId', v_interest_transaction_id,
      'transactionIds', v_transaction_ids,
      'remainingPrincipal', v_remaining,
      'completed', v_status = 'completed',
      'amount', v_existing.amount,
      'principalPaid', v_existing.principal_paid,
      'interestPaid', v_existing.interest_paid,
      'sourceDelta', -v_existing.amount,
      'scheduleEntryId', v_schedule_entry_id,
      'idempotentReplay', true
    );
  end if;

  v_result := public._record_loan_payment_unchecked_11b(
    p_loan_id, p_account_id, p_mode, p_paid_at
  );

  update public.loan_payments
  set idempotency_key = v_key
  where id = (v_result->>'paymentId')::uuid
    and household_id = v_household_id;

  select coalesce(jsonb_agg(t.id order by t.created_at), '[]'::jsonb)
    into v_transaction_ids
  from public.transactions t
  where t.loan_payment_id = (v_result->>'paymentId')::uuid;

  return (v_result - 'feePaid') || jsonb_build_object(
    'transactionIds', v_transaction_ids,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public._record_loan_payment_unchecked_11b(
  uuid, uuid, text, date
) from public, anon, authenticated;

revoke all on function public.record_loan_payment(
  uuid, uuid, text, date, text
) from public, anon;
grant execute on function public.record_loan_payment(
  uuid, uuid, text, date, text
) to authenticated;
