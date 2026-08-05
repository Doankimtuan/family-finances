-- Loan domain evolution: installment_plans → loans + loan_payments
-- Removes credit-card coupling from the Loan bounded context.

-- Detach Card billing links before reshaping loans
update public.card_billing_items
set
  installment_plan_id = null,
  updated_at = timezone('utc', now())
where installment_plan_id is not null;

-- Drop card-origin FKs on installment plans
alter table public.installment_plans
  drop column if exists card_account_id;

alter table public.installment_plans
  drop column if exists source_transaction_id;

alter table public.installment_plans
  drop column if exists source_billing_item_id;

-- Rename table
alter table if exists public.installment_plans rename to loans;

-- Rename policies / indexes that still reference old names where possible
alter index if exists idx_installment_plans_household
  rename to idx_loans_household;

drop index if exists idx_installment_plans_card;

-- Column renames / additions
alter table public.loans rename column total_amount to principal;
alter table public.loans rename column installment_amount to monthly_payment;
alter table public.loans rename column card_label to lender;

alter table public.loans
  add column if not exists remaining_principal numeric(18, 0);

alter table public.loans
  add column if not exists loan_type text;

alter table public.loans
  add column if not exists annual_interest_rate numeric(8, 4);

alter table public.loans
  add column if not exists start_date date;

alter table public.loans
  add column if not exists expected_end_date date;

alter table public.loans
  add column if not exists repayment_frequency text;

alter table public.loans
  add column if not exists next_payment_date date;

-- Backfill remaining_principal from legacy counters
update public.loans
set remaining_principal = greatest(
  0,
  principal - (coalesce(paid_installments, 0) * monthly_payment)
)
where remaining_principal is null;

update public.loans
set remaining_principal = 0
where status = 'completed' and remaining_principal is distinct from 0;

update public.loans
set loan_type = 'other'
where loan_type is null;

update public.loans
set start_date = coalesce(start_date, created_at::date)
where start_date is null;

update public.loans
set repayment_frequency = 'monthly'
where repayment_frequency is null;

-- next_payment_date from due_day when still active
update public.loans l
set next_payment_date = (
  case
    when l.status = 'completed' then null
    else (
      select d::date
      from generate_series(
        timezone('utc', now())::date,
        (timezone('utc', now())::date + interval '62 days')::date,
        interval '1 day'
      ) as d
      where extract(day from d)::int = least(31, greatest(1, coalesce(l.due_day, 1)))
      order by d
      limit 1
    )
  end
)
where next_payment_date is null;

alter table public.loans
  alter column remaining_principal set not null;

alter table public.loans
  alter column loan_type set not null;

alter table public.loans
  alter column loan_type set default 'other';

alter table public.loans
  alter column start_date set not null;

alter table public.loans
  alter column repayment_frequency set not null;

alter table public.loans
  alter column repayment_frequency set default 'monthly';

-- Drop legacy counter columns
alter table public.loans drop column if exists paid_installments;
alter table public.loans drop column if exists num_installments;

-- Refresh constraints (drop old installment_* names if present)
alter table public.loans drop constraint if exists installment_plans_name_not_blank;
alter table public.loans drop constraint if exists installment_plans_amounts_positive;
alter table public.loans drop constraint if exists installment_plans_counts;
alter table public.loans drop constraint if exists installment_plans_status_check;
alter table public.loans drop constraint if exists installment_plans_due_day_range;
alter table public.loans drop constraint if exists loans_name_not_blank;
alter table public.loans drop constraint if exists loans_amounts_positive;
alter table public.loans drop constraint if exists loans_remaining_range;
alter table public.loans drop constraint if exists loans_status_check;
alter table public.loans drop constraint if exists loans_loan_type_check;
alter table public.loans drop constraint if exists loans_frequency_check;
alter table public.loans drop constraint if exists loans_due_day_range;
alter table public.loans drop constraint if exists loans_interest_nonneg;

alter table public.loans
  add constraint loans_name_not_blank check (length(trim(name)) > 0);

alter table public.loans
  add constraint loans_amounts_positive check (
    principal > 0 and monthly_payment > 0
  );

alter table public.loans
  add constraint loans_remaining_range check (
    remaining_principal >= 0 and remaining_principal <= principal
  );

alter table public.loans
  add constraint loans_status_check check (
    status in ('active', 'completed')
  );

alter table public.loans
  add constraint loans_loan_type_check check (
    loan_type in (
      'bank_loan',
      'personal_loan',
      'family_loan',
      'friend_loan',
      'store_financing',
      'bnpl',
      'tuition',
      'medical',
      'vehicle',
      'home',
      'other'
    )
  );

alter table public.loans
  add constraint loans_frequency_check check (
    repayment_frequency in ('monthly')
  );

alter table public.loans
  add constraint loans_due_day_range check (
    due_day is null or (due_day >= 1 and due_day <= 31)
  );

alter table public.loans
  add constraint loans_interest_nonneg check (
    annual_interest_rate is null or annual_interest_rate >= 0
  );

comment on table public.loans is
  'Scheduled loan / installment obligations (Loan BC). Not credit-card installments.';

comment on column public.loans.lender is
  'Counterparty / lender name. Replaces former card_label.';

-- Recreate RLS policies under loans_* names
drop policy if exists installment_plans_select_member on public.loans;
drop policy if exists installment_plans_insert_member on public.loans;
drop policy if exists installment_plans_update_member on public.loans;
drop policy if exists loans_select_member on public.loans;
drop policy if exists loans_insert_member on public.loans;
drop policy if exists loans_update_member on public.loans;

alter table public.loans enable row level security;

create policy loans_select_member on public.loans
  for select to authenticated
  using (public.is_household_member(household_id));

create policy loans_insert_member on public.loans
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy loans_update_member on public.loans
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update on public.loans to authenticated;

-- Payment history
create table if not exists public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  amount numeric(18, 0) not null,
  principal_paid numeric(18, 0) not null,
  interest_paid numeric(18, 0) not null default 0,
  paid_at date not null default (timezone('utc', now()))::date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint loan_payments_amounts_positive check (
    amount > 0 and principal_paid >= 0 and interest_paid >= 0
  ),
  constraint loan_payments_split check (principal_paid + interest_paid = amount)
);

create index if not exists idx_loan_payments_loan
  on public.loan_payments (loan_id, paid_at desc);

create index if not exists idx_loan_payments_household
  on public.loan_payments (household_id, paid_at desc);

alter table public.loan_payments enable row level security;

drop policy if exists loan_payments_select_member on public.loan_payments;
drop policy if exists loan_payments_insert_member on public.loan_payments;

create policy loan_payments_select_member on public.loan_payments
  for select to authenticated
  using (public.is_household_member(household_id));

create policy loan_payments_insert_member on public.loan_payments
  for insert to authenticated
  with check (public.is_household_member(household_id));

grant select, insert on public.loan_payments to authenticated;

-- Replace counter-only payment RPC with transactional loan payment
drop function if exists public.record_installment_payment(uuid);

create or replace function public.record_loan_payment(
  p_loan_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_interest_paid numeric default 0,
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
  v_amount numeric;
  v_interest numeric;
  v_principal numeric;
  v_paid_at date;
  v_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_amount := trunc(p_amount);
  v_interest := trunc(coalesce(p_interest_paid, 0));
  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);

  if v_amount is null or v_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  if v_interest < 0 or v_interest > v_amount then
    raise exception 'Invalid interest portion';
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

  if v_loan.status = 'completed' or v_loan.remaining_principal <= 0 then
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

  -- Credit cards are payment instruments for Card BC — Loan payments debit liquid accounts
  if v_account.type = 'credit_card' then
    raise exception 'Loan payment cannot use a credit card account';
  end if;

  v_principal := v_amount - v_interest;
  if v_principal > v_loan.remaining_principal then
    raise exception 'Principal portion exceeds remaining principal';
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

  v_remaining := v_loan.remaining_principal - v_principal;
  v_completed := v_remaining <= 0;

  if v_completed then
    v_next := null;
  elsif v_loan.repayment_frequency = 'monthly' then
    v_next := (coalesce(v_loan.next_payment_date, v_paid_at) + interval '1 month')::date;
  else
    v_next := (coalesce(v_loan.next_payment_date, v_paid_at) + interval '1 month')::date;
  end if;

  update public.loans l
  set
    remaining_principal = greatest(0, v_remaining),
    status = case when v_completed then 'completed' else 'active' end,
    next_payment_date = v_next,
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
    'remainingPrincipal', greatest(0, v_remaining),
    'completed', v_completed,
    'inboxItemId', v_item_id
  );
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, numeric, numeric, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, numeric, numeric, date) to authenticated;
