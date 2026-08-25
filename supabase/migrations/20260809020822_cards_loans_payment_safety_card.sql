-- Phase F5 part 1: liability_payment type + card payment schema
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'liability_payment'));

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
grant select on public.card_payment_applications to authenticated;;
