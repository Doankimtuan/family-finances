-- Loan amortization engine: schedule table + create/pay RPCs

-- ---------------------------------------------------------------------------
-- Loan columns
-- ---------------------------------------------------------------------------
alter table public.loans
  add column if not exists repayment_method text;

alter table public.loans
  add column if not exists term_months int;

alter table public.loans
  add column if not exists first_payment_date date;

alter table public.loans
  add column if not exists total_interest numeric(18, 0);

alter table public.loans
  add column if not exists total_repayment numeric(18, 0);

update public.loans
set
  repayment_method = coalesce(repayment_method, 'fixed_monthly'),
  term_months = coalesce(
    term_months,
    greatest(
      1,
      case
        when monthly_payment > 0 then ceil(remaining_principal / monthly_payment)::int
        else 1
      end
    )
  ),
  first_payment_date = coalesce(first_payment_date, next_payment_date, start_date),
  total_interest = coalesce(total_interest, 0),
  total_repayment = coalesce(total_repayment, principal)
where true;

alter table public.loans
  alter column repayment_method set default 'fixed_monthly';

alter table public.loans
  alter column repayment_method set not null;

alter table public.loans
  alter column term_months set not null;

alter table public.loans drop constraint if exists loans_repayment_method_check;
alter table public.loans
  add constraint loans_repayment_method_check check (
    repayment_method in ('fixed_monthly', 'reducing_balance')
  );

alter table public.loans drop constraint if exists loans_term_months_positive;
alter table public.loans
  add constraint loans_term_months_positive check (term_months > 0);

alter table public.loans drop constraint if exists loans_status_check;
alter table public.loans
  add constraint loans_status_check check (
    status in ('active', 'completed', 'cancelled', 'defaulted', 'archived')
  );

-- ---------------------------------------------------------------------------
-- Schedule entries
-- ---------------------------------------------------------------------------
create table if not exists public.loan_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  sequence int not null,
  due_date date not null,
  principal_due numeric(18, 0) not null,
  interest_due numeric(18, 0) not null,
  total_due numeric(18, 0) not null,
  remaining_balance_after numeric(18, 0) not null,
  status text not null default 'upcoming',
  paid_at date,
  loan_payment_id uuid references public.loan_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_schedule_entries_sequence_positive check (sequence > 0),
  constraint loan_schedule_entries_amounts check (
    principal_due >= 0
    and interest_due >= 0
    and total_due = principal_due + interest_due
    and remaining_balance_after >= 0
  ),
  constraint loan_schedule_entries_status_check check (
    status in ('upcoming', 'paid', 'partial', 'waived')
  ),
  constraint loan_schedule_entries_loan_seq unique (loan_id, sequence)
);

create index if not exists idx_loan_schedule_loan
  on public.loan_schedule_entries (loan_id, sequence);

create index if not exists idx_loan_schedule_household_due
  on public.loan_schedule_entries (household_id, due_date)
  where status = 'upcoming';

alter table public.loan_schedule_entries enable row level security;

drop policy if exists loan_schedule_entries_select_member on public.loan_schedule_entries;
create policy loan_schedule_entries_select_member on public.loan_schedule_entries
  for select to authenticated
  using (public.is_household_member(household_id));

grant select on public.loan_schedule_entries to authenticated;

-- Forbid client deletes of loans that have payments (app also enforces)
revoke delete on public.loans from authenticated;

-- ---------------------------------------------------------------------------
-- Helper: insert schedule JSON into loan_schedule_entries
-- ---------------------------------------------------------------------------
create or replace function public._loan_insert_schedule_entries(
  p_household_id uuid,
  p_loan_id uuid,
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
  delete from public.loan_schedule_entries where loan_id = p_loan_id;

  for v_item in select * from jsonb_array_elements(p_entries)
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
-- create_loan_with_schedule
-- ---------------------------------------------------------------------------
create or replace function public.create_loan_with_schedule(
  p_name text,
  p_lender text,
  p_loan_type text,
  p_principal numeric,
  p_annual_interest_rate numeric,
  p_repayment_method text,
  p_term_months int,
  p_start_date date,
  p_first_payment_date date,
  p_monthly_payment numeric,
  p_total_interest numeric,
  p_total_repayment numeric,
  p_expected_end_date date,
  p_note text,
  p_currency char(3),
  p_schedule jsonb
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

  v_due_day := least(31, greatest(1, extract(day from coalesce(p_first_payment_date, p_start_date))::int));

  insert into public.loans (
    household_id,
    name,
    lender,
    loan_type,
    principal,
    remaining_principal,
    annual_interest_rate,
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

  perform public._loan_insert_schedule_entries(v_household_id, v_loan_id, coalesce(p_schedule, '[]'::jsonb));

  return jsonb_build_object('ok', true, 'loanId', v_loan_id);
end;
$$;

revoke all on function public.create_loan_with_schedule(
  text, text, text, numeric, numeric, text, int, date, date, numeric, numeric, numeric, date, text, char, jsonb
) from public;
grant execute on function public.create_loan_with_schedule(
  text, text, text, numeric, numeric, text, int, date, date, numeric, numeric, numeric, date, text, char, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- record_loan_payment (schedule-aware)
-- ---------------------------------------------------------------------------
drop function if exists public.record_loan_payment(uuid, uuid, numeric, numeric, date);

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
  v_upcoming_interest numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);
  if coalesce(p_mode, 'scheduled') not in ('scheduled', 'early_payoff') then
    raise exception 'Invalid payment mode';
  end if;

  select * into v_loan
  from public.loans l
  where l.id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

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

  if not found then
    raise exception 'Account not found';
  end if;

  if v_account.type = 'credit_card' then
    raise exception 'Loan payment cannot use a credit card account';
  end if;

  if p_mode = 'early_payoff' then
    select coalesce(sum(e.interest_due), 0) into v_upcoming_interest
    from public.loan_schedule_entries e
    where e.loan_id = p_loan_id
      and e.status in ('upcoming', 'partial');

    v_principal := v_loan.remaining_principal;
    v_interest := v_upcoming_interest;
    v_amount := v_principal + v_interest;
  else
    select * into v_entry
    from public.loan_schedule_entries e
    where e.loan_id = p_loan_id
      and e.status in ('upcoming', 'partial')
    order by e.sequence
    limit 1
    for update;

    if not found then
      raise exception 'No upcoming schedule entry';
    end if;

    v_principal := least(v_entry.principal_due, v_loan.remaining_principal);
    v_interest := v_entry.interest_due;
    v_amount := v_principal + v_interest;
  end if;

  if v_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    created_by
  )
  values (
    v_loan.household_id,
    p_account_id,
    'expense',
    v_amount,
    v_loan.currency,
    v_paid_at,
    'Loan payment: ' || v_loan.name,
    null,
    null,
    'posted',
    v_user_id
  )
  returning id into v_tx_id;

  insert into public.loan_payments (
    household_id,
    loan_id,
    account_id,
    transaction_id,
    amount,
    principal_paid,
    interest_paid,
    paid_at,
    created_by
  )
  values (
    v_loan.household_id,
    p_loan_id,
    p_account_id,
    v_tx_id,
    v_amount,
    v_principal,
    v_interest,
    v_paid_at,
    v_user_id
  )
  returning id into v_payment_id;

  v_remaining := greatest(0, v_loan.remaining_principal - v_principal);
  v_completed := v_remaining <= 0 or p_mode = 'early_payoff';

  if p_mode = 'early_payoff' then
    update public.loan_schedule_entries e
    set
      status = 'paid',
      paid_at = v_paid_at,
      loan_payment_id = v_payment_id,
      updated_at = timezone('utc', now())
    where e.loan_id = p_loan_id
      and e.status in ('upcoming', 'partial');
    v_next := null;
  else
    update public.loan_schedule_entries e
    set
      status = 'paid',
      paid_at = v_paid_at,
      loan_payment_id = v_payment_id,
      updated_at = timezone('utc', now())
    where e.id = v_entry.id;

    select e.due_date into v_next
    from public.loan_schedule_entries e
    where e.loan_id = p_loan_id
      and e.status = 'upcoming'
    order by e.sequence
    limit 1;
  end if;

  update public.loans l
  set
    remaining_principal = v_remaining,
    status = case when v_completed then 'completed' else 'active' end,
    next_payment_date = case when v_completed then null else v_next end,
    updated_at = timezone('utc', now())
  where l.id = p_loan_id;

  if v_completed then
    insert into public.inbox_items (
      household_id,
      kind,
      status,
      source_type,
      source_id,
      amount,
      currency,
      title,
      context_json
    )
    values (
      v_loan.household_id,
      'emi_complete',
      'pending',
      'guided',
      p_loan_id,
      v_loan.monthly_payment,
      v_loan.currency,
      v_loan.name,
      jsonb_build_object(
        'flow', 'loan_complete',
        'review_item_type', 'InstallmentComplete',
        'loan_id', p_loan_id,
        'principal', v_loan.principal
      )
    )
    on conflict (household_id, source_type, source_id) do update
      set
        status = 'pending',
        updated_at = timezone('utc', now()),
        title = excluded.title,
        context_json = excluded.context_json
    returning id into v_item_id;

    if v_item_id is null then
      select i.id into v_item_id
      from public.inbox_items i
      where i.household_id = v_loan.household_id
        and i.source_type = 'guided'
        and i.source_id = p_loan_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paymentId', v_payment_id,
    'transactionId', v_tx_id,
    'remainingPrincipal', v_remaining,
    'completed', v_completed,
    'inboxItemId', v_item_id,
    'amount', v_amount,
    'principalPaid', v_principal,
    'interestPaid', v_interest
  );
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, text, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Status transitions
-- ---------------------------------------------------------------------------
create or replace function public.set_loan_status(
  p_loan_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('cancelled', 'defaulted', 'archived', 'active') then
    raise exception 'Invalid loan status';
  end if;

  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found';
  end if;
  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_loan.status = 'completed' and p_status <> 'archived' then
    raise exception 'Completed loan can only be archived';
  end if;

  update public.loans
  set status = p_status, updated_at = timezone('utc', now())
  where id = p_loan_id;

  return jsonb_build_object('ok', true, 'loanId', p_loan_id, 'status', p_status);
end;
$$;

revoke all on function public.set_loan_status(uuid, text) from public;
grant execute on function public.set_loan_status(uuid, text) to authenticated;

comment on table public.loan_schedule_entries is
  'Amortization schedule for loans. Extension point for balloon/grace/rate periods (future).';

-- Backfill forward schedule for active loans missing entries (equal principal slices)
do $$
declare
  r record;
  v_seq int;
  v_balance numeric;
  v_principal_part numeric;
  v_due date;
  v_interest numeric;
begin
  for r in
    select l.*
    from public.loans l
    where l.status = 'active'
      and l.remaining_principal > 0
      and not exists (
        select 1 from public.loan_schedule_entries e where e.loan_id = l.id
      )
  loop
    v_balance := r.remaining_principal;
    v_due := coalesce(r.next_payment_date, r.first_payment_date, r.start_date);
    for v_seq in 1..r.term_months loop
      v_interest := 0;
      if r.annual_interest_rate is not null and r.annual_interest_rate > 0 then
        v_interest := round(v_balance * (r.annual_interest_rate / 12 / 100));
      end if;
      if v_seq = r.term_months then
        v_principal_part := v_balance;
      else
        v_principal_part := floor(r.remaining_principal / r.term_months);
        if v_principal_part > v_balance then
          v_principal_part := v_balance;
        end if;
      end if;
      v_balance := greatest(0, v_balance - v_principal_part);
      insert into public.loan_schedule_entries (
        household_id, loan_id, sequence, due_date,
        principal_due, interest_due, total_due, remaining_balance_after, status
      ) values (
        r.household_id, r.id, v_seq, v_due,
        v_principal_part, v_interest, v_principal_part + v_interest, v_balance, 'upcoming'
      );
      v_due := (v_due + interval '1 month')::date;
    end loop;
  end loop;
end;
$$;
