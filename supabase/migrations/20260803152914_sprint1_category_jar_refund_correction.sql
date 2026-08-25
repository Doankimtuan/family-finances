-- Implementation Planning Sprint 1 (Spec v2.1):
-- ST-E01-001 BR-12 Category ↔ Jar N:1
-- ST-E01-002 BR-02 Refund linkage
-- ST-E01-003 BR-03 3-way correction audit chain

-- ---------------------------------------------------------------------------
-- Categories: jar_id FK (BR-12)
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists jar_id uuid references public.jars(id) on delete restrict;

comment on column public.categories.jar_id is
  'N:1 Category→Jar binding (BR-12). Required for household categories; null for system templates.';

create index if not exists categories_jar_id_idx
  on public.categories (jar_id)
  where jar_id is not null;

-- Backfill: ensure each household has a General spending jar, then bind
-- household categories before enforcing the mapping check.
insert into public.jars (household_id, name, kind, sort_order, is_archived, is_paused)
select h.id, 'General', 'spending', 0, false, false
from public.households h
where not exists (
  select 1
  from public.jars j
  where j.household_id = h.id
    and lower(j.name) = 'general'
    and j.is_archived = false
);

insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps, fixed_amount)
select j.household_id, j.id, 'percent', 0, 0
from public.jars j
where lower(j.name) = 'general'
  and not exists (
    select 1 from public.jar_plans jp where jp.jar_id = j.id
  );

update public.categories c
set jar_id = g.jar_id
from (
  select distinct on (j.household_id)
    j.household_id,
    j.id as jar_id
  from public.jars j
  where j.is_archived = false
  order by j.household_id,
    case when lower(j.name) = 'general' then 0 else 1 end,
    j.sort_order
) g
where c.household_id = g.household_id
  and c.is_system = false
  and c.jar_id is null;

alter table public.categories
  drop constraint if exists categories_jar_mapping_check;

alter table public.categories
  add constraint categories_jar_mapping_check check (
    (is_system = true and jar_id is null)
    or (is_system = false and jar_id is not null)
  );

-- ---------------------------------------------------------------------------
-- Transactions: audit links + status lifecycle (BR-02 / BR-03)
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column if not exists reverses_transaction_id uuid
    references public.transactions(id) on delete restrict;

alter table public.transactions
  add column if not exists corrects_transaction_id uuid
    references public.transactions(id) on delete restrict;

create index if not exists transactions_reverses_idx
  on public.transactions (reverses_transaction_id)
  where reverses_transaction_id is not null;

create index if not exists transactions_corrects_idx
  on public.transactions (corrects_transaction_id)
  where corrects_transaction_id is not null;

comment on column public.transactions.reverses_transaction_id is
  'Refund or reversal leg pointing at original (BR-02 / BR-03).';
comment on column public.transactions.corrects_transaction_id is
  'Correction leg pointing at original (BR-03).';

-- Expand status enum: migrate cleared→posted, pending→pending_mapping
alter table public.transactions
  drop constraint if exists transactions_status_check;

update public.transactions
set status = 'posted'
where status = 'cleared';

update public.transactions
set status = 'pending_mapping'
where status = 'pending';

alter table public.transactions
  alter column status set default 'posted';

alter table public.transactions
  add constraint transactions_status_check check (
    status in (
      'pending_mapping',
      'posted',
      'partially_refunded',
      'fully_refunded',
      'reversed'
    )
  );

-- BR-02: block hard deletes via RPC; revoke direct delete
revoke delete on public.transactions from authenticated;
drop policy if exists transactions_delete_member on public.transactions;

-- ---------------------------------------------------------------------------
-- create_category RPC (BR-12)
-- ---------------------------------------------------------------------------
create or replace function public.create_category(
  p_name text,
  p_kind text,
  p_jar_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_id uuid;
  v_jar_ok boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_kind not in ('income', 'expense') then
    raise exception 'Invalid category kind';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Category name required';
  end if;

  if p_jar_id is null then
    raise exception 'ERR_CATEGORY_UNMAPPED';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  select exists (
    select 1
    from public.jars j
    where j.id = p_jar_id
      and j.household_id = v_household_id
      and j.is_archived = false
      and j.is_paused = false
  ) into v_jar_ok;

  if not v_jar_ok then
    raise exception 'Invalid jar';
  end if;

  insert into public.categories (
    household_id, kind, name, is_system, is_active, sort_order, jar_id
  )
  values (
    v_household_id,
    p_kind,
    trim(p_name),
    false,
    true,
    100,
    p_jar_id
  )
  returning id into v_id;

  return jsonb_build_object('category_id', v_id);
exception
  when unique_violation then
    raise exception 'Category name already exists';
end;
$$;

revoke all on function public.create_category(text, text, uuid) from public;
grant execute on function public.create_category(text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- record_transaction: default posted + auto jar from category (BR-12)
-- ---------------------------------------------------------------------------
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
  v_jar_id uuid;
  v_category_jar uuid;
  v_status text;
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
        and i.status = 'pending'
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

  v_jar_id := p_jar_id;
  v_category_jar := null;

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

    select c.jar_id into v_category_jar
    from public.categories c
    where c.id = p_category_id;

    if v_jar_id is null and v_category_jar is not null then
      v_jar_id := v_category_jar;
    end if;
  end if;

  if v_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = v_jar_id
        and j.household_id = v_household_id
        and j.is_archived = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
  end if;

  v_status := case
    when p_type = 'expense' and v_jar_id is null then 'pending_mapping'
    else 'posted'
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
    v_jar_id,
    v_status,
    v_user_id,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_tx_id;

  if p_type = 'expense' and v_jar_id is null then
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

  if p_type = 'income'
     and v_jar_id is null
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
        'mode', v_income_mode
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

-- ---------------------------------------------------------------------------
-- refund_transaction (BR-02)
-- ---------------------------------------------------------------------------
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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select * into v_original
  from public.transactions t
  where t.id = p_original_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if not public.is_household_member(v_original.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_original.type <> 'expense' then
    raise exception 'Only expenses can be refunded';
  end if;

  if v_original.status not in ('posted', 'partially_refunded') then
    raise exception 'Transaction is not refundable';
  end if;

  select coalesce(sum(r.amount), 0) into v_prior
  from public.transactions r
  where r.reverses_transaction_id = v_original.id
    and r.status = 'posted';

  if v_prior + p_amount > v_original.amount then
    raise exception 'Refund exceeds original amount';
  end if;

  v_account_id := coalesce(p_account_id, v_original.account_id);

  if not exists (
    select 1
    from public.accounts a
    where a.id = v_account_id
      and a.household_id = v_original.household_id
      and a.is_archived = false
  ) then
    raise exception 'Account not found';
  end if;

  if v_prior + p_amount >= v_original.amount then
    v_status := 'fully_refunded';
  else
    v_status := 'partially_refunded';
  end if;

  v_note := nullif(trim(coalesce(p_note, '')), '');
  if v_note is null then
    v_note := 'Refund';
  end if;

  -- Income credit restores jar capacity (same jar as original expense)
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
    reverses_transaction_id,
    created_by
  )
  values (
    v_original.household_id,
    v_account_id,
    'income',
    p_amount,
    v_original.currency,
    coalesce(p_transaction_date, (timezone('utc', now()))::date),
    v_note,
    v_original.category_id,
    v_original.jar_id,
    'posted',
    v_original.id,
    v_user_id
  )
  returning id into v_refund_id;

  update public.transactions
  set status = v_status,
      updated_at = timezone('utc', now())
  where id = v_original.id;

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

-- ---------------------------------------------------------------------------
-- correct_transaction — atomic 3-way chain (BR-03)
-- ---------------------------------------------------------------------------
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
  v_category_ok boolean;
  v_jar_ok boolean;
  v_date date;
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

  select * into v_original
  from public.transactions t
  where t.id = p_original_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if not public.is_household_member(v_original.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_original.status not in ('posted', 'pending_mapping') then
    raise exception 'Transaction is not correctable';
  end if;

  if v_original.reverses_transaction_id is not null
     or v_original.corrects_transaction_id is not null then
    raise exception 'Cannot correct a refund or correction leg';
  end if;

  v_account_id := coalesce(p_account_id, v_original.account_id);
  v_category_id := coalesce(p_category_id, v_original.category_id);
  v_jar_id := coalesce(p_jar_id, v_original.jar_id);
  v_date := coalesce(p_transaction_date, v_original.transaction_date);

  if not exists (
    select 1
    from public.accounts a
    where a.id = v_account_id
      and a.household_id = v_original.household_id
      and a.is_archived = false
  ) then
    raise exception 'Account not found';
  end if;

  if v_category_id is not null then
    select exists (
      select 1
      from public.categories c
      where c.id = v_category_id
        and c.is_active = true
        and c.kind = p_type
        and (c.household_id is null or c.household_id = v_original.household_id)
    ) into v_category_ok;

    if not v_category_ok then
      raise exception 'Invalid category tag';
    end if;
  end if;

  if v_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = v_jar_id
        and j.household_id = v_original.household_id
        and j.is_archived = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
  end if;

  v_reversal_type := case
    when v_original.type = 'expense' then 'income'
    else 'expense'
  end;

  -- 1) Mark original Reversed
  update public.transactions
  set status = 'reversed',
      updated_at = timezone('utc', now())
  where id = v_original.id;

  -- 2) Reversal leg
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
    reverses_transaction_id,
    created_by
  )
  values (
    v_original.household_id,
    v_original.account_id,
    v_reversal_type,
    v_original.amount,
    v_original.currency,
    v_date,
    'Reversal',
    v_original.category_id,
    v_original.jar_id,
    'posted',
    v_original.id,
    v_user_id
  )
  returning id into v_reversal_id;

  -- 3) Correction leg
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
    corrects_transaction_id,
    created_by
  )
  values (
    v_original.household_id,
    v_account_id,
    p_type,
    p_amount,
    v_original.currency,
    v_date,
    coalesce(nullif(trim(coalesce(p_note, '')), ''), v_original.note),
    v_category_id,
    v_jar_id,
    'posted',
    v_original.id,
    v_user_id
  )
  returning id into v_correction_id;

  return jsonb_build_object(
    'original_transaction_id', v_original.id,
    'reversal_transaction_id', v_reversal_id,
    'correction_transaction_id', v_correction_id
  );
end;
$$;

revoke all on function public.correct_transaction(uuid, numeric, text, uuid, uuid, uuid, text, date) from public;
grant execute on function public.correct_transaction(uuid, numeric, text, uuid, uuid, uuid, text, date) to authenticated;

-- BR-02: hard delete blocked
create or replace function public.delete_transaction(
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Transactions are immutable';
end;
$$;;
