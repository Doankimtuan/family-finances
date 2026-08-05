-- Loan interest strategies: orthogonal to repayment method
-- Extension point for future benchmark/margin/review (do not add those columns now).

-- ---------------------------------------------------------------------------
-- Loan interest columns
-- ---------------------------------------------------------------------------
alter table public.loans
  add column if not exists interest_strategy text;

alter table public.loans
  add column if not exists promo_fixed_rate numeric(8, 4);

alter table public.loans
  add column if not exists promo_fixed_months int;

alter table public.loans
  add column if not exists promo_floating_rate numeric(8, 4);

alter table public.loans
  add column if not exists promo_rate_effective_on date;

update public.loans
set interest_strategy = coalesce(interest_strategy, 'fixed')
where interest_strategy is null;

alter table public.loans
  alter column interest_strategy set default 'fixed';

alter table public.loans
  alter column interest_strategy set not null;

alter table public.loans drop constraint if exists loans_interest_strategy_check;
alter table public.loans
  add constraint loans_interest_strategy_check check (
    interest_strategy in ('fixed', 'promo_fixed_to_floating', 'floating')
  );

alter table public.loans drop constraint if exists loans_promo_months_positive;
alter table public.loans
  add constraint loans_promo_months_positive check (
    promo_fixed_months is null or promo_fixed_months > 0
  );

-- ---------------------------------------------------------------------------
-- Interest rate period history (immutable append; extension point for future kinds)
-- ---------------------------------------------------------------------------
create table if not exists public.loan_interest_rate_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  sequence int not null,
  effective_from date not null,
  effective_to date,
  annual_rate numeric(8, 4) not null,
  kind text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint loan_interest_rate_periods_sequence_positive check (sequence > 0),
  constraint loan_interest_rate_periods_rate_nonneg check (annual_rate >= 0),
  constraint loan_interest_rate_periods_kind_check check (
    kind in ('fixed', 'promotional', 'floating')
  ),
  constraint loan_interest_rate_periods_range check (
    effective_to is null or effective_to > effective_from
  ),
  constraint loan_interest_rate_periods_loan_seq unique (loan_id, sequence)
);

comment on table public.loan_interest_rate_periods is
  'Immutable interest-rate timeline for loans. Extension point for benchmark+margin, review cadence, refinance (future).';

create index if not exists idx_loan_interest_rate_periods_loan
  on public.loan_interest_rate_periods (loan_id, sequence);

alter table public.loan_interest_rate_periods enable row level security;

drop policy if exists loan_interest_rate_periods_select_member
  on public.loan_interest_rate_periods;
create policy loan_interest_rate_periods_select_member
  on public.loan_interest_rate_periods
  for select to authenticated
  using (public.is_household_member(household_id));

grant select on public.loan_interest_rate_periods to authenticated;

-- Backfill one fixed period per existing loan
insert into public.loan_interest_rate_periods (
  household_id,
  loan_id,
  sequence,
  effective_from,
  effective_to,
  annual_rate,
  kind
)
select
  l.household_id,
  l.id,
  1,
  coalesce(l.first_payment_date, l.start_date),
  null,
  coalesce(l.annual_interest_rate, 0),
  'fixed'
from public.loans l
where not exists (
  select 1 from public.loan_interest_rate_periods p where p.loan_id = l.id
);

-- ---------------------------------------------------------------------------
-- Helper: insert rate periods from JSON
-- ---------------------------------------------------------------------------
create or replace function public._loan_insert_rate_periods(
  p_household_id uuid,
  p_loan_id uuid,
  p_periods jsonb,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  delete from public.loan_interest_rate_periods where loan_id = p_loan_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_periods, '[]'::jsonb))
  loop
    insert into public.loan_interest_rate_periods (
      household_id,
      loan_id,
      sequence,
      effective_from,
      effective_to,
      annual_rate,
      kind,
      note,
      created_by
    )
    values (
      p_household_id,
      p_loan_id,
      (v_item->>'sequence')::int,
      (v_item->>'effectiveFrom')::date,
      nullif(v_item->>'effectiveTo', '')::date,
      (v_item->>'annualRate')::numeric,
      coalesce(nullif(v_item->>'kind', ''), 'fixed'),
      nullif(v_item->>'note', ''),
      p_created_by
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Replace create_loan_with_schedule (add interest strategy + periods)
-- ---------------------------------------------------------------------------
drop function if exists public.create_loan_with_schedule(
  text, text, text, numeric, numeric, text, int, date, date, numeric, numeric, numeric, date, text, char, jsonb
);

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
  p_rate_periods jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_loan_id uuid;
  v_due_day int;
  v_strategy text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  if p_principal is null or p_principal <= 0 or p_term_months is null or p_term_months <= 0 then
    raise exception 'Invalid loan parameters';
  end if;

  if p_repayment_method not in ('fixed_monthly', 'reducing_balance') then
    raise exception 'Invalid repayment method';
  end if;

  v_strategy := coalesce(nullif(trim(p_interest_strategy), ''), 'fixed');
  if v_strategy not in ('fixed', 'promo_fixed_to_floating', 'floating') then
    raise exception 'Invalid interest strategy';
  end if;

  if v_strategy = 'promo_fixed_to_floating' and (
    p_promo_fixed_months is null or p_promo_fixed_months <= 0
  ) then
    raise exception 'Promo fixed months required';
  end if;

  v_due_day := least(
    31,
    greatest(1, extract(day from coalesce(p_first_payment_date, p_start_date))::int)
  );

  insert into public.loans (
    household_id,
    name,
    lender,
    loan_type,
    principal,
    remaining_principal,
    annual_interest_rate,
    interest_strategy,
    promo_fixed_rate,
    promo_fixed_months,
    promo_floating_rate,
    promo_rate_effective_on,
    start_date,
    expected_end_date,
    first_payment_date,
    repayment_frequency,
    repayment_method,
    term_months,
    monthly_payment,
    total_interest,
    total_repayment,
    next_payment_date,
    due_day,
    currency,
    status,
    note,
    created_by
  )
  values (
    v_household_id,
    trim(p_name),
    nullif(trim(coalesce(p_lender, '')), ''),
    coalesce(nullif(trim(p_loan_type), ''), 'other'),
    trunc(p_principal),
    trunc(p_principal),
    p_annual_interest_rate,
    v_strategy,
    p_promo_fixed_rate,
    p_promo_fixed_months,
    p_promo_floating_rate,
    p_promo_rate_effective_on,
    p_start_date,
    p_expected_end_date,
    coalesce(p_first_payment_date, p_start_date),
    'monthly',
    p_repayment_method,
    p_term_months,
    trunc(p_monthly_payment),
    trunc(coalesce(p_total_interest, 0)),
    trunc(coalesce(p_total_repayment, p_principal)),
    coalesce(p_first_payment_date, p_start_date),
    v_due_day,
    coalesce(p_currency, 'VND'),
    'active',
    nullif(trim(coalesce(p_note, '')), ''),
    v_user_id
  )
  returning id into v_loan_id;

  perform public._loan_insert_schedule_entries(
    v_household_id, v_loan_id, coalesce(p_schedule, '[]'::jsonb)
  );
  perform public._loan_insert_rate_periods(
    v_household_id, v_loan_id, coalesce(p_rate_periods, '[]'::jsonb), v_user_id
  );

  return jsonb_build_object('ok', true, 'loanId', v_loan_id);
end;
$$;

revoke all on function public.create_loan_with_schedule(
  text, text, text, numeric, numeric, text, text, numeric, int, numeric, date,
  int, date, date, numeric, numeric, numeric, date, text, char, jsonb, jsonb
) from public;
grant execute on function public.create_loan_with_schedule(
  text, text, text, numeric, numeric, text, text, numeric, int, numeric, date,
  int, date, date, numeric, numeric, numeric, date, text, char, jsonb, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Replace upcoming schedule only (paid rows preserved)
-- ---------------------------------------------------------------------------
create or replace function public._loan_replace_upcoming_schedule(
  p_loan_id uuid,
  p_household_id uuid,
  p_entries jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  delete from public.loan_schedule_entries
  where loan_id = p_loan_id
    and status in ('upcoming', 'partial');

  for v_item in select * from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb))
  loop
    insert into public.loan_schedule_entries (
      household_id,
      loan_id,
      sequence,
      due_date,
      principal_due,
      interest_due,
      total_due,
      remaining_balance_after,
      status
    )
    values (
      p_household_id,
      p_loan_id,
      (v_item->>'sequence')::int,
      (v_item->>'dueDate')::date,
      (v_item->>'principalDue')::numeric,
      (v_item->>'interestDue')::numeric,
      (v_item->>'totalDue')::numeric,
      (v_item->>'remainingBalanceAfter')::numeric,
      'upcoming'
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- update_loan_interest_rate (floating / post-promo floating segment)
-- ---------------------------------------------------------------------------
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
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_today := (timezone('utc', now()))::date;

  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found';
  end if;
  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;
  if v_loan.status <> 'active' then
    raise exception 'Loan is not active';
  end if;

  if v_loan.interest_strategy = 'fixed' then
    raise exception 'Fixed interest loans cannot change rate';
  end if;

  if v_loan.interest_strategy = 'promo_fixed_to_floating'
     and v_loan.promo_rate_effective_on is not null
     and v_today < v_loan.promo_rate_effective_on then
    raise exception 'Promo period has not ended';
  end if;

  if p_new_annual_rate is null or p_new_annual_rate < 0 then
    raise exception 'Invalid interest rate';
  end if;

  if p_effective_from is null then
    raise exception 'Effective from required';
  end if;

  update public.loan_interest_rate_periods
  set effective_to = p_effective_from
  where loan_id = p_loan_id
    and effective_to is null;

  select coalesce(max(sequence), 0) + 1 into v_seq
  from public.loan_interest_rate_periods
  where loan_id = p_loan_id;

  insert into public.loan_interest_rate_periods (
    household_id,
    loan_id,
    sequence,
    effective_from,
    effective_to,
    annual_rate,
    kind,
    note,
    created_by
  )
  values (
    v_loan.household_id,
    p_loan_id,
    v_seq,
    p_effective_from,
    null,
    p_new_annual_rate,
    'floating',
    nullif(trim(coalesce(p_note, '')), ''),
    v_user_id
  );

  perform public._loan_replace_upcoming_schedule(
    p_loan_id, v_loan.household_id, coalesce(p_upcoming_schedule, '[]'::jsonb)
  );

  update public.loans
  set
    annual_interest_rate = p_new_annual_rate,
    monthly_payment = coalesce(p_monthly_payment, monthly_payment),
    total_interest = coalesce(p_total_interest, total_interest),
    total_repayment = coalesce(p_total_repayment, total_repayment),
    expected_end_date = coalesce(p_expected_end_date, expected_end_date),
    next_payment_date = coalesce(p_next_payment_date, next_payment_date),
    updated_at = timezone('utc', now())
  where id = p_loan_id;

  return jsonb_build_object('ok', true, 'loanId', p_loan_id);
end;
$$;

revoke all on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) from public;
grant execute on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) to authenticated;
