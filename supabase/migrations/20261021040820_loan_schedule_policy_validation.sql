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
  v_annual_rate numeric;
  v_monthly_rate numeric;
  v_rate_factor numeric;
  v_remaining_periods integer;
  v_monthly_payment numeric := 0;
  v_last_rate numeric;
  v_expected_interest numeric;
  v_expected_principal numeric;
  v_expected_balance numeric;
  v_reducing_principal numeric;
  v_is_reducing boolean;
  v_promo_switch_date date;
begin
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
  v_is_reducing := v_loan.repayment_method = 'reducing_balance';
  v_reducing_principal := round(v_loan.principal / v_loan.term_months);
  v_promo_switch_date := case
    when v_loan.promo_rate_effective_on >= v_loan.first_payment_date
      then v_loan.promo_rate_effective_on
    when v_loan.promo_fixed_months > 0
      then (v_loan.first_payment_date + (v_loan.promo_fixed_months * interval '1 month'))::date
    else null
  end;

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

    v_annual_rate := case
      when v_loan.interest_strategy = 'promo_fixed_to_floating'
           and v_due_date >= v_promo_switch_date
        then greatest(coalesce(v_loan.promo_floating_rate, 0), 0)
      when v_loan.interest_strategy = 'promo_fixed_to_floating'
        then greatest(coalesce(v_loan.promo_fixed_rate, 0), 0)
      else greatest(coalesce(v_loan.annual_interest_rate, 0), 0)
    end;
    v_monthly_rate := v_annual_rate / 1200;
    v_remaining_periods := v_loan.term_months - v_expected_sequence + 1;

    if not v_is_reducing and v_last_rate is distinct from v_annual_rate then
      if v_monthly_rate = 0 then
        v_monthly_payment := round(v_previous_balance / v_remaining_periods);
      else
        v_rate_factor := power(1 + v_monthly_rate, v_remaining_periods);
        v_monthly_payment := round(
          (v_previous_balance * v_monthly_rate * v_rate_factor)
          / (v_rate_factor - 1)
        );
      end if;
    end if;

    v_expected_interest := round(v_previous_balance * v_monthly_rate);
    if v_is_reducing then
      v_expected_principal := case
        when v_expected_sequence = v_loan.term_months then v_previous_balance
        else least(v_reducing_principal, v_previous_balance)
      end;
    else
      v_expected_principal := least(
        v_previous_balance,
        greatest(0, v_monthly_payment - v_expected_interest)
      );
      if v_expected_sequence = v_loan.term_months then
        v_expected_principal := v_previous_balance;
      end if;
    end if;
    v_expected_balance := greatest(0, v_previous_balance - v_expected_principal);

    if v_interest_due is distinct from v_expected_interest
       or v_principal_due is distinct from v_expected_principal
       or v_total_due is distinct from v_expected_principal + v_expected_interest
       or v_remaining_balance is distinct from v_expected_balance
       or (v_expected_sequence = 1
           and v_loan.monthly_payment is distinct from v_expected_principal + v_expected_interest) then
      raise exception using errcode = '22023', message = 'Invalid loan schedule';
    end if;

    v_principal_total := v_principal_total + v_principal_due;
    v_interest_total := v_interest_total + v_interest_due;
    v_repayment_total := v_repayment_total + v_total_due;
    v_previous_balance := v_remaining_balance;
    v_last_rate := v_annual_rate;
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

CREATE OR REPLACE FUNCTION public._loan_insert_rate_periods(
  p_household_id uuid,
  p_loan_id uuid,
  p_periods jsonb,
  p_created_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_item jsonb;
  v_loan public.loans%rowtype;
  v_sequence integer := 1;
  v_sequence_value numeric;
  v_effective_from date;
  v_effective_to date;
  v_annual_rate numeric;
  v_kind text;
  v_expected_rate numeric;
  v_expected_kind text;
  v_switch_date date;
  v_expected_period_count integer;
begin
  if jsonb_typeof(p_periods) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Invalid loan rate periods';
  end if;

  select l.* into v_loan
  from public.loans l
  where l.id = p_loan_id
    and l.household_id = p_household_id;
  if not found then
    raise exception using errcode = '23503', message = 'Loan rate-period parent mismatch';
  end if;

  v_switch_date := case
    when v_loan.promo_rate_effective_on >= v_loan.first_payment_date
      then v_loan.promo_rate_effective_on
    when v_loan.promo_fixed_months > 0
      then (v_loan.first_payment_date + (v_loan.promo_fixed_months * interval '1 month'))::date
    else null
  end;
  v_expected_period_count := case
    when v_loan.interest_strategy = 'promo_fixed_to_floating' then 2
    else 1
  end;
  if jsonb_array_length(p_periods) <> v_expected_period_count then
    raise exception using errcode = '22023', message = 'Invalid loan rate periods';
  end if;

  for v_item in
    select value from jsonb_array_elements(p_periods) as periods(value)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'sequence') is distinct from 'number'
       or jsonb_typeof(v_item->'effectiveFrom') is distinct from 'string'
       or jsonb_typeof(v_item->'annualRate') is distinct from 'number'
       or jsonb_typeof(v_item->'kind') is distinct from 'string'
       or (v_item->'effectiveTo' is not null
           and jsonb_typeof(v_item->'effectiveTo') not in ('null', 'string')) then
      raise exception using errcode = '22023', message = 'Invalid loan rate periods';
    end if;

    v_sequence_value := (v_item->>'sequence')::numeric;
    if v_sequence_value <> trunc(v_sequence_value)
       or v_sequence_value <> v_sequence then
      raise exception using errcode = '22023', message = 'Invalid loan rate periods';
    end if;
    v_effective_from := (v_item->>'effectiveFrom')::date;
    v_effective_to := nullif(v_item->>'effectiveTo', '')::date;
    v_annual_rate := (v_item->>'annualRate')::numeric;
    v_kind := v_item->>'kind';

    if v_loan.interest_strategy = 'promo_fixed_to_floating' and v_sequence = 1 then
      v_expected_rate := greatest(coalesce(v_loan.promo_fixed_rate, 0), 0);
      v_expected_kind := 'promotional';
      if v_effective_from is distinct from v_loan.first_payment_date
         or v_effective_to is distinct from v_switch_date then
        raise exception using errcode = '22023', message = 'Invalid loan rate periods';
      end if;
    elsif v_loan.interest_strategy = 'promo_fixed_to_floating' then
      v_expected_rate := greatest(coalesce(v_loan.promo_floating_rate, 0), 0);
      v_expected_kind := 'floating';
      if v_effective_from is distinct from v_switch_date
         or v_effective_to is not null then
        raise exception using errcode = '22023', message = 'Invalid loan rate periods';
      end if;
    else
      v_expected_rate := greatest(coalesce(v_loan.annual_interest_rate, 0), 0);
      v_expected_kind := case
        when v_loan.interest_strategy = 'floating' then 'floating'
        else 'fixed'
      end;
      if v_effective_from is distinct from v_loan.first_payment_date
         or v_effective_to is not null then
        raise exception using errcode = '22023', message = 'Invalid loan rate periods';
      end if;
    end if;

    if v_annual_rate is distinct from v_expected_rate
       or v_kind is distinct from v_expected_kind then
      raise exception using errcode = '22023', message = 'Invalid loan rate periods';
    end if;
    v_sequence := v_sequence + 1;
  end loop;

  delete from public.loan_interest_rate_periods where loan_id = p_loan_id;
  for v_item in select value from jsonb_array_elements(p_periods) as periods(value)
  loop
    insert into public.loan_interest_rate_periods (
      household_id, loan_id, sequence, effective_from, effective_to,
      annual_rate, kind, note, created_by
    )
    values (
      p_household_id, p_loan_id, (v_item->>'sequence')::int,
      (v_item->>'effectiveFrom')::date,
      nullif(v_item->>'effectiveTo', '')::date,
      (v_item->>'annualRate')::numeric,
      v_item->>'kind', nullif(v_item->>'note', ''), p_created_by
    );
  end loop;
end;
$function$;

REVOKE ALL ON FUNCTION public._loan_insert_rate_periods(uuid, uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._loan_insert_rate_periods(uuid, uuid, jsonb, uuid)
  TO postgres;
