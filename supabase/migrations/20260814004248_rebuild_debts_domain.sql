-- Direction-aware Debt domain: borrowed liabilities and lent receivables.
-- Principal borrowing/lending and principal settlements are neutral ledger events,
-- never ordinary income or expense. Multi-record movements are atomic RPCs.

alter table public.liabilities
  add column if not exists direction text not null default 'borrowed',
  add column if not exists creation_mode text not null default 'existing_balance',
  add column if not exists start_date date not null default (timezone('utc', now()))::date,
  add column if not exists due_date date,
  add column if not exists status text not null default 'active',
  add column if not exists origin_account_id uuid references public.accounts(id) on delete restrict,
  add column if not exists origin_transaction_id uuid references public.transactions(id) on delete restrict,
  add column if not exists idempotency_key text;

alter table public.liabilities
  drop constraint if exists liabilities_direction_check,
  drop constraint if exists liabilities_creation_mode_check,
  drop constraint if exists liabilities_status_check,
  add constraint liabilities_direction_check check (direction in ('borrowed', 'lent')),
  add constraint liabilities_creation_mode_check check (creation_mode in ('existing_balance', 'money_moved')),
  add constraint liabilities_status_check check (status in ('active', 'completed', 'archived'));

create unique index if not exists liabilities_household_idempotency_unique
  on public.liabilities (household_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists liabilities_origin_transaction_unique
  on public.liabilities (origin_transaction_id)
  where origin_transaction_id is not null;

create index if not exists idx_liabilities_household_direction_status_due
  on public.liabilities (household_id, direction, status, due_date nulls last);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  liability_id uuid not null references public.liabilities(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  amount numeric(18, 0) not null,
  payment_direction text not null,
  effective_date date not null,
  note text,
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint debt_payments_amount_positive check (amount > 0),
  constraint debt_payments_direction_check check (payment_direction in ('repay_borrowed', 'receive_lent')),
  constraint debt_payments_transaction_unique unique (transaction_id)
);

create unique index if not exists debt_payments_household_idempotency_unique
  on public.debt_payments (household_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_debt_payments_liability_effective
  on public.debt_payments (liability_id, effective_date desc, created_at desc);

alter table public.debt_payments enable row level security;
drop policy if exists debt_payments_select_member on public.debt_payments;
create policy debt_payments_select_member on public.debt_payments
  for select to authenticated
  using (public.is_household_member(household_id));
grant select on public.debt_payments to authenticated;

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (
  type in (
    'income',
    'expense',
    'liability_payment',
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

create or replace function public.create_debt(
  p_name text,
  p_counterparty text,
  p_direction text,
  p_creation_mode text,
  p_principal_amount numeric,
  p_start_date date default null,
  p_due_date date default null,
  p_note text default null,
  p_account_id uuid default null,
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
  v_account public.accounts%rowtype;
  v_existing public.liabilities%rowtype;
  v_debt_id uuid;
  v_transaction_id uuid;
  v_effective_date date;
  v_transaction_type text;
  v_idempotency_key text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Debt name is required';
  end if;
  if nullif(trim(coalesce(p_counterparty, '')), '') is null then
    raise exception 'Counterparty is required';
  end if;
  if p_direction not in ('borrowed', 'lent') then
    raise exception 'Invalid debt direction';
  end if;
  if p_creation_mode not in ('existing_balance', 'money_moved') then
    raise exception 'Invalid debt creation mode';
  end if;
  if p_principal_amount is null or p_principal_amount <= 0 or p_principal_amount <> trunc(p_principal_amount) then
    raise exception 'Principal must be a positive whole number';
  end if;
  if p_due_date is not null and p_start_date is not null and p_due_date < p_start_date then
    raise exception 'Due date must not precede start date';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;
  select coalesce(h.base_currency, 'VND') into v_currency
  from public.households h
  where h.id = v_household_id;

  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_idempotency_key is not null then
    select * into v_existing
    from public.liabilities l
    where l.household_id = v_household_id
      and l.idempotency_key = v_idempotency_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'debtId', v_existing.id,
        'transactionId', v_existing.origin_transaction_id,
        'idempotentReplay', true
      );
    end if;
  end if;

  v_effective_date := coalesce(p_start_date, (timezone('utc', now()))::date);
  if p_creation_mode = 'money_moved' then
    if p_account_id is null then
      raise exception 'Account is required when money moves';
    end if;
    select * into v_account
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and a.type <> 'credit_card'
    for update;
    if not found then
      raise exception 'Account not found or not eligible';
    end if;
    v_transaction_type := case
      when p_direction = 'borrowed' then 'debt_borrowing'
      else 'debt_lending'
    end;
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
      v_account.id,
      v_transaction_type,
      p_principal_amount,
      v_currency,
      v_effective_date,
      nullif(trim(coalesce(p_note, '')), ''),
      null,
      null,
      'posted',
      case when v_idempotency_key is null then null else v_idempotency_key || ':transaction' end,
      v_user_id
    )
    returning id into v_transaction_id;
  end if;

  insert into public.liabilities (
    household_id,
    name,
    creditor,
    principal_amount,
    remaining_amount,
    currency,
    due_day,
    note,
    is_archived,
    created_by,
    direction,
    creation_mode,
    start_date,
    due_date,
    status,
    origin_account_id,
    origin_transaction_id,
    idempotency_key
  )
  values (
    v_household_id,
    trim(p_name),
    trim(p_counterparty),
    p_principal_amount,
    p_principal_amount,
    v_currency,
    null,
    nullif(trim(coalesce(p_note, '')), ''),
    false,
    v_user_id,
    p_direction,
    p_creation_mode,
    v_effective_date,
    p_due_date,
    'active',
    case when p_creation_mode = 'money_moved' then p_account_id else null end,
    v_transaction_id,
    v_idempotency_key
  )
  returning id into v_debt_id;

  return jsonb_build_object(
    'ok', true,
    'debtId', v_debt_id,
    'transactionId', v_transaction_id,
    'idempotentReplay', false
  );
end;
$$;

create or replace function public.record_debt_payment(
  p_debt_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_effective_date date default null,
  p_note text default null,
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
  v_debt public.liabilities%rowtype;
  v_account public.accounts%rowtype;
  v_existing public.debt_payments%rowtype;
  v_effective_date date;
  v_idempotency_key text;
  v_transaction_type text;
  v_payment_direction text;
  v_transaction_id uuid;
  v_payment_id uuid;
  v_remaining numeric;
  v_completed boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Payment must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;
  select coalesce(h.base_currency, 'VND') into v_currency
  from public.households h
  where h.id = v_household_id;

  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_idempotency_key is not null then
    select * into v_existing
    from public.debt_payments dp
    where dp.household_id = v_household_id
      and dp.idempotency_key = v_idempotency_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'debtId', v_existing.liability_id,
        'transactionId', v_existing.transaction_id,
        'paymentId', v_existing.id,
        'amount', v_existing.amount,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_debt
  from public.liabilities l
  where l.id = p_debt_id
    and l.household_id = v_household_id
  for update;
  if not found then
    raise exception 'Debt not found';
  end if;
  if v_debt.status <> 'active' or v_debt.is_archived or v_debt.remaining_amount <= 0 then
    raise exception 'Debt cannot receive a payment';
  end if;
  if p_amount > v_debt.remaining_amount then
    raise exception 'Amount exceeds remaining balance';
  end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
    and a.type <> 'credit_card'
  for update;
  if not found then
    raise exception 'Account not found or not eligible';
  end if;

  v_effective_date := coalesce(p_effective_date, (timezone('utc', now()))::date);
  v_transaction_type := case
    when v_debt.direction = 'borrowed' then 'liability_payment'
    else 'debt_receivable_payment'
  end;
  v_payment_direction := case
    when v_debt.direction = 'borrowed' then 'repay_borrowed'
    else 'receive_lent'
  end;

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
    v_account.id,
    v_transaction_type,
    p_amount,
    v_currency,
    v_effective_date,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when v_idempotency_key is null then null else v_idempotency_key || ':transaction' end,
    v_user_id
  )
  returning id into v_transaction_id;

  insert into public.debt_payments (
    household_id,
    liability_id,
    account_id,
    transaction_id,
    amount,
    payment_direction,
    effective_date,
    note,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    v_debt.id,
    v_account.id,
    v_transaction_id,
    p_amount,
    v_payment_direction,
    v_effective_date,
    nullif(trim(coalesce(p_note, '')), ''),
    v_idempotency_key,
    v_user_id
  )
  returning id into v_payment_id;

  v_remaining := v_debt.remaining_amount - p_amount;
  v_completed := v_remaining = 0;
  update public.liabilities
  set
    remaining_amount = v_remaining,
    status = case when v_completed then 'completed' else 'active' end,
    is_archived = false,
    updated_at = timezone('utc', now())
  where id = v_debt.id;

  return jsonb_build_object(
    'ok', true,
    'debtId', v_debt.id,
    'transactionId', v_transaction_id,
    'paymentId', v_payment_id,
    'amount', p_amount,
    'remainingAmount', v_remaining,
    'completed', v_completed,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text) from public;
revoke all on function public.record_debt_payment(uuid, uuid, numeric, date, text, text) from public;
grant execute on function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text) to authenticated;
grant execute on function public.record_debt_payment(uuid, uuid, numeric, date, text, text) to authenticated;
