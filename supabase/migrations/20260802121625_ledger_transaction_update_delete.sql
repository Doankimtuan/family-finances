grant delete on public.transactions to authenticated;

drop policy if exists transactions_delete_member on public.transactions;
create policy transactions_delete_member on public.transactions
  for delete to authenticated
  using (public.is_household_member(household_id));

create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_transaction_date date default null,
  p_note text default null,
  p_category_id uuid default null,
  p_jar_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_tx public.transactions%rowtype;
  v_jar_ok boolean;
  v_category_ok boolean;
  v_inbox_id uuid;
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

  select * into v_tx
  from public.transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if not public.is_household_member(v_tx.household_id) then
    raise exception 'Forbidden';
  end if;

  v_household_id := v_tx.household_id;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_account_id and a.household_id = v_household_id and a.is_archived = false
  ) then
    raise exception 'Account not found';
  end if;

  if p_category_id is not null then
    select exists (
      select 1 from public.categories c
      where c.id = p_category_id and c.is_active = true and c.kind = p_type
        and (c.household_id is null or c.household_id = v_household_id)
    ) into v_category_ok;
    if not v_category_ok then raise exception 'Invalid category tag'; end if;
  end if;

  if p_jar_id is not null then
    select exists (
      select 1 from public.jars j
      where j.id = p_jar_id and j.household_id = v_household_id and j.is_archived = false
    ) into v_jar_ok;
    if not v_jar_ok then raise exception 'Invalid jar'; end if;
  end if;

  update public.transactions t
  set account_id = p_account_id, type = p_type, amount = p_amount,
      transaction_date = coalesce(p_transaction_date, t.transaction_date),
      note = nullif(trim(coalesce(p_note, '')), ''),
      category_id = p_category_id, jar_id = p_jar_id, updated_at = now()
  where t.id = v_tx.id;

  if p_jar_id is not null then
    update public.inbox_items i
    set status = 'resolved', resolved_jar_id = p_jar_id, resolved_by = v_user_id,
        resolved_at = now(), updated_at = now()
    where i.household_id = v_household_id and i.source_type = 'transaction'
      and i.source_id = v_tx.id and i.status = 'pending'
    returning i.id into v_inbox_id;
  end if;

  return jsonb_build_object('transaction_id', v_tx.id, 'inbox_item_id', v_inbox_id);
end;
$$;

revoke all on function public.update_transaction(uuid, uuid, text, numeric, date, text, uuid, uuid) from public;
grant execute on function public.update_transaction(uuid, uuid, text, numeric, date, text, uuid, uuid) to authenticated;

create or replace function public.delete_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tx public.transactions%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_tx from public.transactions t where t.id = p_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_tx.household_id) then raise exception 'Forbidden'; end if;

  delete from public.transactions t where t.id = v_tx.id;
  return jsonb_build_object('transaction_id', v_tx.id, 'deleted', true);
end;
$$;

revoke all on function public.delete_transaction(uuid) from public;
grant execute on function public.delete_transaction(uuid) to authenticated;;
