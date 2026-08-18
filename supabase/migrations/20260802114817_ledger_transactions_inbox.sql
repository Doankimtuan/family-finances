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

-- System category tags (AC-016): tags inside Money, not a nav item
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

create or replace function public.record_transaction(
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_transaction_date date default (timezone('utc', now()))::date,
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
  v_currency char(3);
  v_income_mode text;
  v_existing_id uuid;
  v_tx_id uuid;
  v_inbox_id uuid;
  v_jar_ok boolean;
  v_category_ok boolean;
  v_title text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('income', 'expense') then
    raise exception 'Invalid transaction type';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select t.id into v_existing_id
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = trim(p_idempotency_key)
    limit 1;

    if v_existing_id is not null then
      select i.id into v_inbox_id
      from public.inbox_items i
      where i.household_id = v_household_id
        and i.source_type = 'transaction'
        and i.source_id = v_existing_id
      limit 1;

      return jsonb_build_object(
        'transaction_id', v_existing_id,
        'inbox_item_id', v_inbox_id,
        'idempotent', true
      );
    end if;
  end if;

  if not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
  ) then
    raise exception 'Account not found';
  end if;

  select h.base_currency, h.income_allocate_mode
  into v_currency, v_income_mode
  from public.households h
  where h.id = v_household_id;

  if p_category_id is not null then
    select exists (
      select 1
      from public.categories c
      where c.id = p_category_id
        and c.is_active = true
        and c.kind = p_type
        and (c.household_id is null or c.household_id = v_household_id)
    ) into v_category_ok;

    if not v_category_ok then
      raise exception 'Invalid category tag';
    end if;
  end if;

  if p_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = p_jar_id
        and j.household_id = v_household_id
        and j.is_archived = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
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
    created_by,
    idempotency_key
  )
  values (
    v_household_id,
    p_account_id,
    p_type,
    p_amount,
    coalesce(v_currency, 'VND'),
    coalesce(p_transaction_date, (timezone('utc', now()))::date),
    nullif(trim(coalesce(p_note, '')), ''),
    p_category_id,
    p_jar_id,
    v_user_id,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_tx_id;

  -- BR-05: unmapped expense → Inbox ReviewItem
  if p_type = 'expense' and p_jar_id is null then
    v_title := coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Unmapped expense');
    insert into public.inbox_items (
      household_id, kind, source_type, source_id, amount, currency, title, context_json
    )
    values (
      v_household_id,
      'unmapped_expense',
      'transaction',
      v_tx_id,
      p_amount,
      coalesce(v_currency, 'VND'),
      v_title,
      jsonb_build_object('reason', 'unmapped_expense')
    )
    returning id into v_inbox_id;
  end if;

  -- BR-04 Suggest path: unmapped income under Suggest|Auto → Inbox
  if p_type = 'income'
     and p_jar_id is null
     and coalesce(v_income_mode, 'suggest') in ('suggest', 'auto')
  then
    v_title := coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Place income');
    insert into public.inbox_items (
      household_id, kind, source_type, source_id, amount, currency, title, context_json
    )
    values (
      v_household_id,
      'income_suggest',
      'transaction',
      v_tx_id,
      p_amount,
      coalesce(v_currency, 'VND'),
      v_title,
      jsonb_build_object(
        'reason', 'income_suggest',
        'income_allocate_mode', coalesce(v_income_mode, 'suggest')
      )
    )
    returning id into v_inbox_id;
  end if;

  return jsonb_build_object(
    'transaction_id', v_tx_id,
    'inbox_item_id', v_inbox_id,
    'idempotent', false
  );
end;
$$;

revoke all on function public.record_transaction(uuid, text, numeric, date, text, uuid, uuid, text) from public;
grant execute on function public.record_transaction(uuid, text, numeric, date, text, uuid, uuid, text) to authenticated;

create or replace function public.resolve_inbox_item_to_jar(
  p_inbox_item_id uuid,
  p_jar_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
  v_jar_ok boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item
  from public.inbox_items i
  where i.id = p_inbox_item_id
  for update;

  if not found then
    raise exception 'Inbox item not found';
  end if;

  if not public.is_household_member(v_item.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_item.status <> 'pending' then
    return jsonb_build_object('inbox_item_id', v_item.id, 'status', v_item.status);
  end if;

  select exists (
    select 1
    from public.jars j
    where j.id = p_jar_id
      and j.household_id = v_item.household_id
      and j.is_archived = false
  ) into v_jar_ok;

  if not v_jar_ok then
    raise exception 'Invalid jar';
  end if;

  update public.transactions t
  set jar_id = p_jar_id,
      updated_at = now()
  where t.id = v_item.source_id
    and t.household_id = v_item.household_id;

  update public.inbox_items i
  set status = 'resolved',
      resolved_jar_id = p_jar_id,
      resolved_by = v_user_id,
      resolved_at = now(),
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'resolved',
    'jar_id', p_jar_id
  );
end;
$$;

revoke all on function public.resolve_inbox_item_to_jar(uuid, uuid) from public;
grant execute on function public.resolve_inbox_item_to_jar(uuid, uuid) to authenticated;
