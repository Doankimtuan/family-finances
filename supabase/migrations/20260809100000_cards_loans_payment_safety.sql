-- Phase F5: atomic card liability payment + loan payment/rate safety gates.
-- Card payment is not income/expense. Early payoff mutation disabled.
-- Future rate updates reject historical/paid-period rewrites.

-- ---------------------------------------------------------------------------
-- 1. Extend transactions.type for liability_payment
-- ---------------------------------------------------------------------------
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'liability_payment'));

-- ---------------------------------------------------------------------------
-- 2. Card payment + application link tables
-- ---------------------------------------------------------------------------
create table if not exists public.card_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  card_account_id uuid not null references public.accounts(id) on delete restrict,
  source_account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  amount numeric(18, 0) not null,
  applied_amount numeric(18, 0) not null,
  remaining_due_after numeric(18, 0) not null,
  effective_date date not null,
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint card_payments_amount_positive check (amount > 0),
  constraint card_payments_applied_nonneg check (applied_amount >= 0),
  constraint card_payments_applied_le_amount check (applied_amount <= amount),
  constraint card_payments_remaining_nonneg check (remaining_due_after >= 0),
  constraint card_payments_transaction_unique unique (transaction_id)
);

create unique index if not exists card_payments_household_idempotency_unique
  on public.card_payments (household_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_card_payments_card
  on public.card_payments (card_account_id, created_at desc);

create table if not exists public.card_payment_applications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  card_payment_id uuid not null references public.card_payments(id) on delete cascade,
  billing_month_id uuid not null references public.card_billing_months(id) on delete restrict,
  applied_amount numeric(18, 0) not null,
  created_at timestamptz not null default now(),
  constraint card_payment_applications_amount_positive check (applied_amount > 0),
  constraint card_payment_applications_unique unique (card_payment_id, billing_month_id)
);

create index if not exists idx_card_payment_applications_month
  on public.card_payment_applications (billing_month_id);

alter table public.card_payments enable row level security;
alter table public.card_payment_applications enable row level security;

drop policy if exists card_payments_select_member on public.card_payments;
create policy card_payments_select_member on public.card_payments
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists card_payment_applications_select_member
  on public.card_payment_applications;
create policy card_payment_applications_select_member
  on public.card_payment_applications
  for select to authenticated
  using (public.is_household_member(household_id));

grant select on public.card_payments to authenticated;
grant select on public.card_payment_applications to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Atomic settle_card_payment RPC
-- ---------------------------------------------------------------------------
create or replace function public.settle_card_payment(
  p_card_account_id uuid,
  p_source_account_id uuid,
  p_amount numeric,
  p_effective_date date default null,
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
  v_currency char(3);
  v_effective date;
  v_existing public.card_payments%rowtype;
  v_card public.accounts%rowtype;
  v_source public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_month record;
  v_outstanding numeric := 0;
  v_left numeric;
  v_applied_total numeric := 0;
  v_due numeric;
  v_apply numeric;
  v_new_paid numeric;
  v_new_status text;
  v_tx_id uuid;
  v_payment_id uuid;
  v_remaining_after numeric := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_card_account_id = p_source_account_id then
    raise exception 'Invalid accounts';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  select h.base_currency into v_currency
  from public.households h
  where h.id = v_household_id;

  v_currency := coalesce(v_currency, 'VND');
  v_effective := coalesce(p_effective_date, (timezone('utc', now()))::date);

  if p_idempotency_key is not null then
    select * into v_existing
    from public.card_payments cp
    where cp.household_id = v_household_id
      and cp.idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'ok', true,
        'transactionId', v_existing.transaction_id,
        'paymentId', v_existing.id,
        'sourceDelta', -v_existing.amount,
        'appliedAmount', v_existing.applied_amount,
        'remainingDue', v_existing.remaining_due_after,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_card
  from public.accounts a
  where a.id = p_card_account_id
    and a.household_id = v_household_id
    and a.type = 'credit_card'
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  select * into v_source
  from public.accounts a
  where a.id = p_source_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if v_source.type = 'credit_card' then
    raise exception 'Source cannot be a credit card';
  end if;

  select * into v_settings
  from public.credit_card_settings s
  where s.account_id = p_card_account_id
    and s.household_id = v_household_id;

  if not found then
    raise exception 'Card settings not found';
  end if;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_outstanding
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  if v_outstanding <= 0 then
    raise exception 'No remaining due';
  end if;

  -- Approved overpayment rule: payment cannot exceed remaining due.
  if p_amount > v_outstanding then
    raise exception 'Amount exceeds remaining due';
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
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    p_source_account_id,
    'liability_payment',
    p_amount,
    v_currency,
    v_effective,
    null,
    null,
    null,
    'posted',
    null,
    v_user_id
  )
  returning id into v_tx_id;

  insert into public.card_payments (
    household_id,
    card_account_id,
    source_account_id,
    transaction_id,
    amount,
    applied_amount,
    remaining_due_after,
    effective_date,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    p_card_account_id,
    p_source_account_id,
    v_tx_id,
    p_amount,
    0,
    v_outstanding,
    v_effective,
    p_idempotency_key,
    v_user_id
  )
  returning id into v_payment_id;

  v_left := p_amount;

  for v_month in
    select *
    from public.card_billing_months m
    where m.household_id = v_household_id
      and m.card_account_id = p_card_account_id
      and m.status in ('open', 'partial')
    order by m.billing_month asc
    for update
  loop
    exit when v_left <= 0;
    v_due := greatest(0, v_month.statement_amount - v_month.paid_amount);
    continue when v_due <= 0;

    v_apply := least(v_left, v_due);
    v_new_paid := v_month.paid_amount + v_apply;
    v_new_status := case
      when v_new_paid >= v_month.statement_amount then 'settled'
      when v_new_paid > 0 then 'partial'
      else 'open'
    end;

    update public.card_billing_months
    set
      paid_amount = v_new_paid,
      status = v_new_status,
      updated_at = timezone('utc', now())
    where id = v_month.id;

    insert into public.card_payment_applications (
      household_id,
      card_payment_id,
      billing_month_id,
      applied_amount
    )
    values (
      v_household_id,
      v_payment_id,
      v_month.id,
      v_apply
    );

    if v_new_status = 'settled' then
      update public.card_billing_items
      set
        is_paid = true,
        updated_at = timezone('utc', now())
      where billing_month_id = v_month.id
        and is_converted_to_installment = false;
    end if;

    v_left := v_left - v_apply;
    v_applied_total := v_applied_total + v_apply;
  end loop;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_remaining_after
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  update public.card_payments
  set
    applied_amount = v_applied_total,
    remaining_due_after = v_remaining_after
  where id = v_payment_id;

  return jsonb_build_object(
    'ok', true,
    'transactionId', v_tx_id,
    'paymentId', v_payment_id,
    'sourceDelta', -p_amount,
    'appliedAmount', v_applied_total,
    'remainingDue', v_remaining_after,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.settle_card_payment(uuid, uuid, numeric, date, text) from public;
grant execute on function public.settle_card_payment(uuid, uuid, numeric, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. record_loan_payment: scheduled only + liability_payment type
-- ---------------------------------------------------------------------------
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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);

  -- Mutating early payoff is not authorized in F5.
  if coalesce(p_mode, 'scheduled') <> 'scheduled' then
    raise exception 'Only scheduled loan payment is allowed';
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
    'liability_payment',
    v_amount,
    v_loan.currency,
    v_paid_at,
    null,
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
  v_completed := v_remaining <= 0;

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

  update public.loans l
  set
    remaining_principal = v_remaining,
    status = case when v_completed then 'completed' else 'active' end,
    next_payment_date = case when v_completed then null else v_next end,
    updated_at = timezone('utc', now())
  where l.id = p_loan_id;

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
          'loan_id', p_loan_id,
          'principal', v_loan.principal
        )
      ))->>'inbox_item_id'
    )::uuid;
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
    'interestPaid', v_interest,
    'feePaid', 0,
    'sourceDelta', -v_amount,
    'scheduleEntryId', v_entry.id
  );
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, text, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. update_loan_interest_rate: future unpaid boundary only
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
  v_paid_on_or_after int;
  v_unpaid_on_or_after int;
  v_before_count int;
  v_after_count int;
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

  -- Strictly future effective boundary.
  if p_effective_from <= v_today then
    raise exception 'Effective date must be in the future';
  end if;

  select count(*) into v_paid_on_or_after
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('paid', 'waived')
    and e.due_date >= p_effective_from;

  if v_paid_on_or_after > 0 then
    raise exception 'Effective date would rewrite historical periods';
  end if;

  select count(*) into v_unpaid_on_or_after
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial')
    and e.due_date >= p_effective_from;

  if v_unpaid_on_or_after = 0 then
    raise exception 'Effective date must align to an unpaid period';
  end if;

  select count(*) into v_before_count
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial');

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

  -- Rebuild only unpaid entries (paid/waived preserved by helper).
  perform public._loan_replace_upcoming_schedule(
    p_loan_id, v_loan.household_id, coalesce(p_upcoming_schedule, '[]'::jsonb)
  );

  select count(*) into v_after_count
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial');

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

  return jsonb_build_object(
    'ok', true,
    'loanId', p_loan_id,
    'effectiveFrom', p_effective_from,
    'newRate', p_new_annual_rate,
    'futureEntriesBefore', v_before_count,
    'futureEntriesAfter', v_after_count,
    'historicalUnchanged', true
  );
end;
$$;

revoke all on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) from public;
grant execute on function public.update_loan_interest_rate(
  uuid, numeric, date, text, jsonb, numeric, numeric, numeric, date, date
) to authenticated;
