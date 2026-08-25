-- Credit card accounts + billing ledger (1B override; app-layer posting, no triggers)
-- Outstanding / utilization are NOT bank Balance (BR-01).

alter table public.accounts
  drop constraint if exists accounts_type_check;

alter table public.accounts
  add constraint accounts_type_check
  check (
    type in (
      'cash',
      'checking',
      'savings',
      'ewallet',
      'brokerage',
      'credit_card',
      'other'
    )
  );

create table if not exists public.credit_card_settings (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  credit_limit numeric(18, 0) not null,
  statement_day int not null default 25,
  due_day int not null default 15,
  linked_bank_account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_card_settings_limit_nonneg check (credit_limit >= 0),
  constraint credit_card_settings_statement_day check (
    statement_day >= 1 and statement_day <= 31
  ),
  constraint credit_card_settings_due_day check (due_day >= 1 and due_day <= 31)
);

create index if not exists idx_credit_card_settings_household
  on public.credit_card_settings (household_id);

create table if not exists public.card_billing_months (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  card_account_id uuid not null references public.accounts(id) on delete cascade,
  billing_month date not null,
  statement_amount numeric(18, 0) not null default 0,
  paid_amount numeric(18, 0) not null default 0,
  due_date date not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_billing_months_unique unique (card_account_id, billing_month),
  constraint card_billing_months_amounts check (
    statement_amount >= 0 and paid_amount >= 0
  ),
  constraint card_billing_months_status_check check (
    status in ('open', 'partial', 'settled')
  )
);

create index if not exists idx_card_billing_months_card
  on public.card_billing_months (card_account_id, status, billing_month);

create table if not exists public.card_billing_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  billing_month_id uuid not null references public.card_billing_months(id) on delete cascade,
  card_account_id uuid not null references public.accounts(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  installment_plan_id uuid references public.installment_plans(id) on delete set null,
  installment_sequence int,
  description text,
  amount numeric(18, 0) not null,
  fee_amount numeric(18, 0) not null default 0,
  item_type text not null default 'standard',
  is_paid boolean not null default false,
  is_converted_to_installment boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_billing_items_amount check (amount <> 0 or fee_amount <> 0),
  constraint card_billing_items_type_check check (
    item_type in ('standard', 'installment')
  )
);

create index if not exists idx_card_billing_items_month
  on public.card_billing_items (billing_month_id, created_at);

create index if not exists idx_card_billing_items_card
  on public.card_billing_items (card_account_id, created_at desc);

alter table public.installment_plans
  add column if not exists card_account_id uuid references public.accounts(id) on delete set null;

alter table public.installment_plans
  add column if not exists source_transaction_id uuid references public.transactions(id) on delete set null;

alter table public.installment_plans
  add column if not exists source_billing_item_id uuid references public.card_billing_items(id) on delete set null;

create index if not exists idx_installment_plans_card
  on public.installment_plans (card_account_id, status)
  where card_account_id is not null;

alter table public.credit_card_settings enable row level security;
alter table public.card_billing_months enable row level security;
alter table public.card_billing_items enable row level security;

create policy credit_card_settings_select_member on public.credit_card_settings
  for select to authenticated
  using (public.is_household_member(household_id));

create policy credit_card_settings_insert_member on public.credit_card_settings
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy credit_card_settings_update_member on public.credit_card_settings
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy card_billing_months_select_member on public.card_billing_months
  for select to authenticated
  using (public.is_household_member(household_id));

create policy card_billing_months_insert_member on public.card_billing_months
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy card_billing_months_update_member on public.card_billing_months
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy card_billing_items_select_member on public.card_billing_items
  for select to authenticated
  using (public.is_household_member(household_id));

create policy card_billing_items_insert_member on public.card_billing_items
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy card_billing_items_update_member on public.card_billing_items
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update on public.credit_card_settings to authenticated;
grant select, insert, update on public.card_billing_months to authenticated;
grant select, insert, update on public.card_billing_items to authenticated;;
