CREATE OR REPLACE FUNCTION public._loan_insert_schedule_entries(
  p_household_id uuid,
  p_loan_id uuid,
  p_entries jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
declare
  v_item jsonb;
  v_loan public.loans%rowtype;
  v_expected_sequence integer := 1;
  v_sequence integer;
  v_sequence_value numeric;
  v_due_date date;
  v_principal_due numeric;
  v_interest_due numeric;
  v_total_due numeric;
  v_remaining_balance numeric;
  v_principal_total numeric := 0;
  v_interest_total numeric := 0;
  v_repayment_total numeric := 0;
  v_previous_balance numeric;
begin
  -- shortcut: checks internal consistency only; recompute policy when direct RPC callers need policy-level validation.
  if jsonb_typeof(p_entries) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Invalid loan schedule';
  end if;

  select l.* into v_loan
  from public.loans l
  where l.id = p_loan_id
    and l.household_id = p_household_id;
  if not found then
    raise exception using errcode = '23503', message = 'Loan schedule parent mismatch';
  end if;

  if v_loan.term_months is null
     or v_loan.term_months <= 0
     or jsonb_array_length(p_entries) <> v_loan.term_months then
    raise exception using errcode = '22023', message = 'Invalid loan schedule';
  end if;

  v_previous_balance := v_loan.principal;
  for v_item in
    select value from jsonb_array_elements(p_entries) as entries(value)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'sequence') is distinct from 'number'
       or jsonb_typeof(v_item->'dueDate') is distinct from 'string'
       or jsonb_typeof(v_item->'principalDue') is distinct from 'number'
       or jsonb_typeof(v_item->'interestDue') is distinct from 'number'
       or jsonb_typeof(v_item->'totalDue') is distinct from 'number'
       or jsonb_typeof(v_item->'remainingBalanceAfter')
          is distinct from 'number' then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    v_sequence_value := (v_item->>'sequence')::numeric;
    if v_sequence_value <> trunc(v_sequence_value) then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    v_sequence := v_sequence_value::integer;
    v_due_date := (v_item->>'dueDate')::date;
    v_principal_due := (v_item->>'principalDue')::numeric;
    v_interest_due := (v_item->>'interestDue')::numeric;
    v_total_due := (v_item->>'totalDue')::numeric;
    v_remaining_balance := (v_item->>'remainingBalanceAfter')::numeric;

    if v_sequence is distinct from v_expected_sequence
       or v_due_date is null
       or v_principal_due is null
       or v_interest_due is null
       or v_total_due is null
       or v_remaining_balance is null then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    if v_principal_due < 0
       or v_interest_due < 0
       or v_total_due < 0
       or v_remaining_balance < 0
       or v_principal_due <> trunc(v_principal_due)
       or v_interest_due <> trunc(v_interest_due)
       or v_total_due <> trunc(v_total_due)
       or v_remaining_balance <> trunc(v_remaining_balance)
       or v_total_due is distinct from v_principal_due + v_interest_due
       or v_remaining_balance is distinct from v_previous_balance - v_principal_due then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    if v_due_date is distinct from (
      v_loan.first_payment_date
      + ((v_expected_sequence - 1) * interval '1 month')
    )::date then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    v_principal_total := v_principal_total + v_principal_due;
    v_interest_total := v_interest_total + v_interest_due;
    v_repayment_total := v_repayment_total + v_total_due;
    v_previous_balance := v_remaining_balance;
    v_expected_sequence := v_expected_sequence + 1;
  end loop;

  if v_previous_balance <> 0
     or v_principal_total is distinct from v_loan.principal
     or v_interest_total is distinct from v_loan.total_interest
     or v_repayment_total is distinct from v_loan.total_repayment
     or v_loan.total_repayment is distinct from v_loan.principal + v_loan.total_interest then
    raise exception using errcode = '22023', message = 'Invalid loan schedule';
  end if;

  for v_item in
    select value from jsonb_array_elements(p_entries) as entries(value)
  loop
    insert into public.loan_schedule_entries (
      household_id,
      loan_id,
      sequence,
      due_date,
      principal_due,
      interest_due,
      total_due,
      remaining_balance_after
    )
    values (
      p_household_id,
      p_loan_id,
      (v_item->>'sequence')::int,
      (v_item->>'dueDate')::date,
      (v_item->>'principalDue')::numeric,
      (v_item->>'interestDue')::numeric,
      (v_item->>'totalDue')::numeric,
      (v_item->>'remainingBalanceAfter')::numeric
    );
  end loop;
end;
$function$;

REVOKE ALL ON FUNCTION public._loan_insert_schedule_entries(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._loan_insert_schedule_entries(uuid, uuid, jsonb)
  TO postgres;
