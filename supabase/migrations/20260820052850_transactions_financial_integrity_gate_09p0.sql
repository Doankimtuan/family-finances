-- ViNha Transactions 09P0: financial integrity and privacy gate.
-- Generic ledger actions are ordinary-only; product-owned writes stay atomic.

alter table public.transactions
  add column if not exists loan_payment_id uuid;

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (
  type in (
    'income',
    'expense',
    'liability_payment',
    'loan_interest',
    'transfer_out',
    'transfer_in',
    'investment_buy',
    'investment_sell_proceeds',
    'investment_income',
    'investment_fee',
    'debt_borrowing',
    'debt_lending',
    'debt_receivable_payment'
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_loan_payment_id_fkey'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_loan_payment_id_fkey
      foreign key (loan_payment_id)
      references public.loan_payments(id)
      on delete restrict;
  end if;
end
$$;

-- The card owner command calls the ordinary recorder inside the same database
-- transaction. Any billing failure rolls back the ledger row and inbox row too.
create or replace function public.record_card_transaction(
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_transaction_date date default null,
  p_note text default null,
  p_category_id uuid default null,
  p_jar_id uuid default null,
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
  v_effective date;
  v_account public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_recorded jsonb;
  v_transaction_id uuid;
  v_billing_month date;
  v_due_month date;
  v_due_date date;
  v_month public.card_billing_months%rowtype;
  v_statement_amount numeric;
  v_paid_amount numeric;
  v_signed_amount numeric;
  v_status text;
  v_outstanding numeric;
  v_due_day int;
  v_statement_day int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then
    raise exception 'Invalid transaction type';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.type = 'credit_card'
    and a.is_archived = false
  for update;
  if not found then raise exception 'Card not found'; end if;

  select * into v_settings
  from public.credit_card_settings s
  where s.account_id = p_account_id and s.household_id = v_household_id
  for update;
  if not found then raise exception 'Card settings not found'; end if;

  v_effective := coalesce(
    p_transaction_date,
    timezone('Asia/Ho_Chi_Minh', now())::date
  );
  v_statement_day := least(31, greatest(1, v_settings.statement_day));
  v_due_day := least(31, greatest(1, v_settings.due_day));

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_outstanding
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_account_id
    and m.status in ('open', 'partial');
  if p_type = 'expense' and v_outstanding + p_amount > v_settings.credit_limit then
    raise exception 'Credit limit exceeded';
  end if;

  v_recorded := public.record_transaction(
    p_account_id => p_account_id,
    p_type => p_type,
    p_amount => p_amount,
    p_transaction_date => v_effective,
    p_note => p_note,
    p_category_id => p_category_id,
    p_jar_id => p_jar_id,
    p_idempotency_key => p_idempotency_key
  );
  v_transaction_id := (v_recorded->>'transaction_id')::uuid;

  if exists (
    select 1 from public.card_billing_items i
    where i.transaction_id = v_transaction_id
  ) then
    return v_recorded;
  end if;

  v_signed_amount := case when p_type = 'income' then -abs(p_amount) else abs(p_amount) end;
  v_billing_month := date_trunc('month', v_effective)::date;
  if p_type = 'expense' and extract(day from v_effective)::int > v_statement_day then
    v_billing_month := (v_billing_month + interval '1 month')::date;
  elsif p_type = 'income' then
    select m.billing_month into v_billing_month
    from public.card_billing_months m
    where m.household_id = v_household_id
      and m.card_account_id = p_account_id
      and m.status <> 'settled'
    order by m.billing_month desc
    limit 1;
    v_billing_month := coalesce(v_billing_month, date_trunc('month', v_effective)::date);
  end if;

  v_due_month := case
    when v_due_day <= v_statement_day then (v_billing_month + interval '1 month')::date
    else v_billing_month
  end;
  v_due_date := make_date(
    extract(year from v_due_month)::int,
    extract(month from v_due_month)::int,
    least(
      v_due_day,
      extract(day from (date_trunc('month', v_due_month + interval '1 month') - interval '1 day'))::int
    )
  );

  select * into v_month
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_account_id
    and m.billing_month = v_billing_month
  for update;

  if not found then
    insert into public.card_billing_months (
      household_id, card_account_id, billing_month, statement_amount,
      paid_amount, due_date, status
    ) values (
      v_household_id, p_account_id, v_billing_month, greatest(0, v_signed_amount),
      0, v_due_date, case when v_signed_amount <= 0 then 'settled' else 'open' end
    ) returning * into v_month;
  else
    v_statement_amount := greatest(0, v_month.statement_amount + v_signed_amount);
    v_paid_amount := v_month.paid_amount;
    v_status := case
      when v_statement_amount <= 0 or v_paid_amount >= v_statement_amount then 'settled'
      when v_paid_amount > 0 then 'partial'
      else 'open'
    end;
    update public.card_billing_months
    set statement_amount = v_statement_amount,
        status = v_status,
        updated_at = timezone('utc', now())
    where id = v_month.id;
  end if;

  insert into public.card_billing_items (
    household_id, billing_month_id, card_account_id, transaction_id,
    description, amount, fee_amount, item_type, is_paid, is_converted_to_installment
  ) values (
    v_household_id, v_month.id, p_account_id, v_transaction_id,
    nullif(trim(coalesce(p_note, '')), ''), v_signed_amount, 0, 'standard', false, false
  );

  return v_recorded;
end;
$$;

revoke all on function public.record_card_transaction(uuid, text, numeric, date, text, uuid, uuid, text) from public;
grant execute on function public.record_card_transaction(uuid, text, numeric, date, text, uuid, uuid, text) to authenticated;

-- Generic refund/correction must never cross a product owner boundary.
create or replace function public.refund_transaction(
  p_original_transaction_id uuid,
  p_amount numeric,
  p_account_id uuid default null,
  p_note text default null,
  p_transaction_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_original public.transactions%rowtype;
  v_prior numeric;
  v_refund_id uuid;
  v_account_id uuid;
  v_status text;
  v_note text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_original from public.transactions t
  where t.id = p_original_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_original.household_id) then raise exception 'Forbidden'; end if;
  if v_original.type <> 'expense'
     or v_original.savings_event_kind is not null
     or exists (select 1 from public.accounts a where a.id = v_original.account_id and a.type = 'credit_card')
  then
    raise exception 'Transaction is not refundable';
  end if;
  if v_original.status not in ('posted', 'partially_refunded') then
    raise exception 'Transaction is not refundable';
  end if;
  if v_original.reverses_transaction_id is not null or v_original.corrects_transaction_id is not null then
    raise exception 'Transaction is not refundable';
  end if;
  select coalesce(sum(r.amount), 0) into v_prior
  from public.transactions r
  where r.reverses_transaction_id = v_original.id and r.status = 'posted';
  if v_prior + p_amount > v_original.amount then raise exception 'Refund exceeds original amount'; end if;
  v_account_id := coalesce(p_account_id, v_original.account_id);
  if not exists (
    select 1 from public.accounts a
    where a.id = v_account_id and a.household_id = v_original.household_id and a.is_archived = false
  ) then raise exception 'Account not found'; end if;
  v_status := case when v_prior + p_amount >= v_original.amount then 'fully_refunded' else 'partially_refunded' end;
  v_note := nullif(trim(coalesce(p_note, '')), '');
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, reverses_transaction_id, created_by
  ) values (
    v_original.household_id, v_account_id, 'income', p_amount, v_original.currency,
    coalesce(p_transaction_date, timezone('Asia/Ho_Chi_Minh', now())::date),
    coalesce(v_note, 'Refund'), v_original.category_id, v_original.jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_refund_id;
  update public.transactions set status = v_status, updated_at = timezone('utc', now()) where id = v_original.id;
  return jsonb_build_object(
    'refund_transaction_id', v_refund_id,
    'original_transaction_id', v_original.id,
    'original_status', v_status,
    'jar_id', v_original.jar_id,
    'capacity_restored', p_amount
  );
end;
$$;

revoke all on function public.refund_transaction(uuid, numeric, uuid, text, date) from public;
grant execute on function public.refund_transaction(uuid, numeric, uuid, text, date) to authenticated;

create or replace function public.correct_transaction(
  p_original_transaction_id uuid,
  p_amount numeric,
  p_type text,
  p_account_id uuid default null,
  p_category_id uuid default null,
  p_jar_id uuid default null,
  p_note text default null,
  p_transaction_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_original public.transactions%rowtype;
  v_reversal_id uuid;
  v_correction_id uuid;
  v_account_id uuid;
  v_category_id uuid;
  v_jar_id uuid;
  v_reversal_type text;
  v_date date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then raise exception 'Invalid transaction type'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_original from public.transactions t
  where t.id = p_original_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_original.household_id) then raise exception 'Forbidden'; end if;
  if v_original.type not in ('income', 'expense')
     or v_original.savings_event_kind is not null
     or exists (select 1 from public.accounts a where a.id = v_original.account_id and a.type = 'credit_card')
  then
    raise exception 'Transaction is not correctable';
  end if;
  if v_original.status not in ('posted', 'pending_mapping') then raise exception 'Transaction is not correctable'; end if;
  if v_original.reverses_transaction_id is not null or v_original.corrects_transaction_id is not null then
    raise exception 'Transaction is not correctable';
  end if;
  v_account_id := coalesce(p_account_id, v_original.account_id);
  v_category_id := coalesce(p_category_id, v_original.category_id);
  v_jar_id := coalesce(p_jar_id, v_original.jar_id);
  v_date := coalesce(p_transaction_date, v_original.transaction_date);
  if not exists (
    select 1 from public.accounts a
    where a.id = v_account_id and a.household_id = v_original.household_id and a.is_archived = false
  ) then raise exception 'Account not found'; end if;
  if v_category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = v_category_id and c.is_active = true and c.kind = p_type
      and (c.household_id is null or c.household_id = v_original.household_id)
  ) then raise exception 'Invalid category tag'; end if;
  if v_jar_id is not null and not exists (
    select 1 from public.jars j
    where j.id = v_jar_id and j.household_id = v_original.household_id and j.is_archived = false
  ) then raise exception 'Invalid jar'; end if;
  v_reversal_type := case when v_original.type = 'expense' then 'income' else 'expense' end;
  update public.transactions set status = 'reversed', updated_at = timezone('utc', now()) where id = v_original.id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, reverses_transaction_id, created_by
  ) values (
    v_original.household_id, v_original.account_id, v_reversal_type, v_original.amount,
    v_original.currency, v_date, 'Reversal', v_original.category_id, v_original.jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_reversal_id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, corrects_transaction_id, created_by
  ) values (
    v_original.household_id, v_account_id, p_type, p_amount, v_original.currency, v_date,
    coalesce(nullif(trim(coalesce(p_note, '')), ''), v_original.note), v_category_id, v_jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_correction_id;
  return jsonb_build_object(
    'original_transaction_id', v_original.id,
    'reversal_transaction_id', v_reversal_id,
    'correction_transaction_id', v_correction_id
  );
end;
$$;

revoke all on function public.correct_transaction(uuid, numeric, text, uuid, uuid, uuid, text, date) from public;
grant execute on function public.correct_transaction(uuid, numeric, text, uuid, uuid, uuid, text, date) to authenticated;

-- Loan payments keep the aggregate payment row and emit explicit cash components.
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
  v_interest_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  v_paid_at := coalesce(p_paid_at, timezone('Asia/Ho_Chi_Minh', now())::date);
  if coalesce(p_mode, 'scheduled') <> 'scheduled' then raise exception 'Only scheduled loan payment is allowed'; end if;
  select * into v_loan from public.loans l where l.id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if not public.is_household_member(v_loan.household_id) then raise exception 'Not a household member'; end if;
  if v_loan.status <> 'active' or v_loan.remaining_principal <= 0 then raise exception 'Loan already completed'; end if;
  select * into v_account from public.accounts a
  where a.id = p_account_id and a.household_id = v_loan.household_id and a.is_archived = false for update;
  if not found then raise exception 'Account not found'; end if;
  if v_account.type = 'credit_card' then raise exception 'Loan payment cannot use a credit card account'; end if;
  select * into v_entry from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('upcoming', 'partial')
  order by e.sequence limit 1 for update;
  if not found then raise exception 'No upcoming schedule entry'; end if;
  v_principal := least(v_entry.principal_due, v_loan.remaining_principal);
  v_interest := v_entry.interest_due;
  v_amount := v_principal + v_interest;
  if v_amount <= 0 then raise exception 'Invalid payment amount'; end if;

  if v_principal > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, status, created_by
    ) values (
      v_loan.household_id, p_account_id, 'liability_payment', v_principal,
      v_loan.currency, v_paid_at, 'posted', v_user_id
    ) returning id into v_tx_id;
  end if;
  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, status, created_by
    ) values (
      v_loan.household_id, p_account_id, 'loan_interest', v_interest,
      v_loan.currency, v_paid_at, 'posted', v_user_id
    ) returning id into v_interest_tx_id;
  end if;
  v_tx_id := coalesce(v_tx_id, v_interest_tx_id);

  insert into public.loan_payments (
    household_id, loan_id, account_id, transaction_id, amount,
    principal_paid, interest_paid, paid_at, created_by
  ) values (
    v_loan.household_id, p_loan_id, p_account_id, v_tx_id, v_amount,
    v_principal, v_interest, v_paid_at, v_user_id
  ) returning id into v_payment_id;
  update public.transactions set loan_payment_id = v_payment_id
  where id in (v_tx_id, v_interest_tx_id);

  v_remaining := greatest(0, v_loan.remaining_principal - v_principal);
  v_completed := v_remaining <= 0;
  update public.loan_schedule_entries
  set status = 'paid', paid_at = v_paid_at, loan_payment_id = v_payment_id, updated_at = timezone('utc', now())
  where id = v_entry.id;
  select e.due_date into v_next from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status = 'upcoming' order by e.sequence limit 1;
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
        p_context => jsonb_build_object('flow', 'loan_complete', 'loanId', p_loan_id, 'principal', v_loan.principal)
      ))->>'inbox_item_id'
    )::uuid;
  end if;
  return jsonb_build_object(
    'ok', true, 'paymentId', v_payment_id, 'transactionId', v_tx_id,
    'interestTransactionId', v_interest_tx_id, 'remainingPrincipal', v_remaining,
    'completed', v_completed, 'inboxItemId', v_item_id, 'amount', v_amount,
    'principalPaid', v_principal, 'interestPaid', v_interest, 'feePaid', 0,
    'sourceDelta', -v_amount, 'scheduleEntryId', v_entry.id
  );
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, text, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, text, date) to authenticated;
;
