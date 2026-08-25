-- ST-E04-002: Ledger transactions + category tags + Inbox review enqueue (AC-005/006/016/018)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  kind text not null,
  name text not null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_kind_check check (kind in ('income', 'expense')),
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_system_household_null check (
    (is_system = true and household_id is null)
    or (is_system = false and household_id is not null)
  )
);

create unique index if not exists categories_system_unique_name_kind
  on public.categories (kind, lower(name))
  where household_id is null;

create unique index if not exists categories_household_unique_name_kind
  on public.categories (household_id, kind, lower(name))
  where household_id is not null;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  type text not null,
  amount numeric(18, 0) not null,
  currency char(3) not null default 'VND',
  transaction_date date not null default (timezone('utc', now()))::date,
  note text,
  category_id uuid references public.categories(id) on delete set null,
  jar_id uuid references public.jars(id) on delete set null,
  status text not null default 'cleared',
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_type_check check (type in ('income', 'expense')),
  constraint transactions_status_check check (status in ('cleared', 'pending')),
  constraint transactions_amount_positive check (amount > 0)
);

create unique index if not exists transactions_household_idempotency_unique
  on public.transactions (household_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_transactions_household_created
  on public.transactions (household_id, created_at desc);

create index if not exists idx_transactions_account_created
  on public.transactions (account_id, created_at desc);

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  source_type text not null default 'transaction',
  source_id uuid not null references public.transactions(id) on delete cascade,
  amount numeric(18, 0) not null,
  currency char(3) not null default 'VND',
  title text not null,
  suggested_jar_id uuid references public.jars(id) on delete set null,
  context_json jsonb not null default '{}'::jsonb,
  resolved_jar_id uuid references public.jars(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inbox_items_kind_check check (kind in ('unmapped_expense', 'income_suggest')),
  constraint inbox_items_status_check check (status in ('pending', 'resolved', 'dismissed')),
  constraint inbox_items_source_type_check check (source_type in ('transaction')),
  constraint inbox_items_amount_positive check (amount > 0),
  constraint inbox_items_unique_source unique (household_id, source_type, source_id)
);

create index if not exists idx_inbox_items_household_status
  on public.inbox_items (household_id, status, created_at desc);

insert into public.categories (kind, name, is_system, sort_order)
select v.kind, v.name, true, v.sort_order
from (
  values
    ('expense', 'Food', 10),
    ('expense', 'Transport', 20),
    ('expense', 'Home', 30),
    ('expense', 'Health', 40),
    ('expense', 'Other', 90),
    ('income', 'Salary', 10),
    ('income', 'Bonus', 20),
    ('income', 'Other', 90)
) as v(kind, name, sort_order)
where not exists (
  select 1
  from public.categories c
  where c.household_id is null
    and c.kind = v.kind
    and lower(c.name) = lower(v.name)
);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.inbox_items enable row level security;

create policy categories_select_member on public.categories
  for select to authenticated
  using (
    household_id is null
    or public.is_household_member(household_id)
  );

create policy categories_insert_member on public.categories
  for insert to authenticated
  with check (
    household_id is not null
    and is_system = false
    and public.is_household_member(household_id)
  );

create policy transactions_select_member on public.transactions
  for select to authenticated
  using (public.is_household_member(household_id));

create policy transactions_insert_member on public.transactions
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy transactions_update_member on public.transactions
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy inbox_items_select_member on public.inbox_items
  for select to authenticated
  using (public.is_household_member(household_id));

create policy inbox_items_insert_member on public.inbox_items
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy inbox_items_update_member on public.inbox_items
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert on public.categories to authenticated;
grant select, insert, update on public.transactions to authenticated;
grant select, insert, update on public.inbox_items to authenticated;
;
