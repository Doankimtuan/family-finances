create or replace function public.update_loan_interest_rate(
  p_loan_id uuid,
  p_new_annual_rate numeric,
  p_effective_from date,
  p_note text default null,
  p_upcoming_schedule jsonb default '[]'::jsonb,
  p_monthly_payment numeric default null,
  p_total_interest numeric default null,
  p_total_repayment numeric default null,
  p_expected_end_date date default null,
  p_next_payment_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_seq int;
  v_today date;
  v_paid_on_or_after int;
  v_unpaid_on_or_after int;
  v_before_count int;
  v_after_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  v_today := (timezone('utc', now()))::date;

  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if not public.is_household_member(v_loan.household_id) then raise exception 'Not a household member'; end if;
  if v_loan.status <> 'active' then raise exception 'Loan is not active'; end if;
  if v_loan.interest_strategy = 'fixed' then raise exception 'Fixed interest loans cannot change rate'; end if;
  if v_loan.interest_strategy = 'promo_fixed_to_floating'
     and v_loan.promo_rate_effective_on is not null
     and v_today < v_loan.promo_rate_effective_on then
    raise exception 'Promo period has not ended';
  end if;
  if p_new_annual_rate is null or p_new_annual_rate < 0 then raise exception 'Invalid interest rate'; end if;
  if p_effective_from is null then raise exception 'Effective from required'; end if;
  if p_effective_from <= v_today then raise exception 'Effective date must be in the future'; end if;

  select count(*) into v_paid_on_or_after from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('paid', 'waived') and e.due_date >= p_effective_from;
  if v_paid_on_or_after > 0 then raise exception 'Effective date would rewrite historical periods'; end if;

  select count(*) into v_unpaid_on_or_after from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('upcoming', 'partial') and e.due_date >= p_effective_from;
  if v_unpaid_on_or_after = 0 then raise exception 'Effective date must align to an unpaid period'; end if;

  select count(*) into v_before_count from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('upcoming', 'partial');

  update public.loan_interest_rate_periods set effective_to = p_effective_from
  where loan_id = p_loan_id and effective_to is null;

  select coalesce(max(sequence), 0) + 1 into v_seq from public.loan_interest_rate_periods where loan_id = p_loan_id;

  insert into public.loan_interest_rate_periods (
    household_id, loan_id, sequence, effective_from, effective_to, annual_rate, kind, note, created_by
  ) values (
    v_loan.household_id, p_loan_id, v_seq, p_effective_from, null, p_new_annual_rate, 'floating',
    nullif(trim(coalesce(p_note, '')), ''), v_user_id
  );

  perform public._loan_replace_upcoming_schedule(
    p_loan_id, v_loan.household_id, coalesce(p_upcoming_schedule, '[]'::jsonb)
  );

  select count(*) into v_after_count from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('upcoming', 'partial');

  update public.loans set
    annual_interest_rate = p_new_annual_rate,
    monthly_payment = coalesce(p_monthly_payment, monthly_payment),
    total_interest = coalesce(p_total_interest, total_interest),
    total_repayment = coalesce(p_total_repayment, total_repayment),
    expected_end_date = coalesce(p_expected_end_date, expected_end_date),
    next_payment_date = coalesce(p_next_payment_date, next_payment_date),
    updated_at = timezone('utc', now())
  where id = p_loan_id;

  return jsonb_build_object(
    'ok', true, 'loanId', p_loan_id, 'effectiveFrom', p_effective_from, 'newRate', p_new_annual_rate,
    'futureEntriesBefore', v_before_count, 'futureEntriesAfter', v_after_count, 'historicalUnchanged', true
  );
end;
$$;

revoke all on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) from public;
grant execute on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) to authenticated;;
