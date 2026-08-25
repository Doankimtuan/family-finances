-- Force ledger/inbox mutations through security-definer RPCs (AC-005 / BR-04 / BR-05).
-- Direct INSERT/UPDATE/DELETE would skip enqueue rules and jar assignment.

drop policy if exists transactions_insert_member on public.transactions;
drop policy if exists transactions_update_member on public.transactions;
drop policy if exists transactions_delete_member on public.transactions;

drop policy if exists inbox_items_insert_member on public.inbox_items;
drop policy if exists inbox_items_update_member on public.inbox_items;

revoke insert, update, delete on public.transactions from authenticated;
revoke insert, update on public.inbox_items from authenticated;

grant select on public.transactions to authenticated;
grant select on public.inbox_items to authenticated;

-- Idempotent retries only surface pending inbox rows (resolved items must not redirect to Inbox).
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
grant execute on function public.record_transaction(uuid, text, numeric, date, text, uuid, uuid, text) to authenticated;;
