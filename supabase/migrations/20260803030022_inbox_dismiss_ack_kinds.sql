-- ST-E06-002: dismiss / acknowledge + guided maturity & EMI kinds (AC-010, AC-011, BR-10, BR-11)

-- Guided ReviewItems are not always tied to a ledger transaction
alter table public.inbox_items
  drop constraint if exists inbox_items_source_id_fkey;

alter table public.inbox_items
  drop constraint if exists inbox_items_kind_check;

alter table public.inbox_items
  add constraint inbox_items_kind_check
  check (
    kind in (
      'unmapped_expense',
      'income_suggest',
      'savings_maturity',
      'emi_complete'
    )
  );

alter table public.inbox_items
  drop constraint if exists inbox_items_source_type_check;

alter table public.inbox_items
  add constraint inbox_items_source_type_check
  check (source_type in ('transaction', 'guided'));

alter table public.inbox_items
  drop constraint if exists inbox_items_status_check;

alter table public.inbox_items
  add constraint inbox_items_status_check
  check (status in ('pending', 'resolved', 'dismissed', 'acknowledged'));

-- AC-003: resolve only to Active jars (not paused / archived)
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

  if v_item.kind not in ('unmapped_expense', 'income_suggest') then
    raise exception 'Item cannot be resolved to a jar';
  end if;

  if v_item.source_type <> 'transaction' then
    raise exception 'Item has no ledger source';
  end if;

  select exists (
    select 1
    from public.jars j
    where j.id = p_jar_id
      and j.household_id = v_item.household_id
      and j.is_archived = false
      and coalesce(j.is_paused, false) = false
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

-- Dismiss pending ReviewItem (any partner — AC-020)
create or replace function public.dismiss_inbox_item(
  p_inbox_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
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

  update public.inbox_items i
  set status = 'dismissed',
      resolved_by = v_user_id,
      resolved_at = now(),
      context_json = coalesce(i.context_json, '{}'::jsonb) || jsonb_build_object('dismissed', true),
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'dismissed'
  );
end;
$$;

revoke all on function public.dismiss_inbox_item(uuid) from public;
grant execute on function public.dismiss_inbox_item(uuid) to authenticated;

-- Acknowledge guided maturity / EMI (BR-10 / BR-11) — intention/coach only
create or replace function public.acknowledge_inbox_item(
  p_inbox_item_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
  v_action text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_action := lower(trim(coalesce(p_action, '')));

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

  if v_item.kind = 'savings_maturity' then
    if v_action not in ('renew', 'switch', 'withdraw') then
      raise exception 'Invalid maturity action';
    end if;
  elsif v_item.kind = 'emi_complete' then
    if v_action not in ('celebrate', 'later') then
      raise exception 'Invalid EMI action';
    end if;
  else
    raise exception 'Item cannot be acknowledged';
  end if;

  update public.inbox_items i
  set status = 'acknowledged',
      resolved_by = v_user_id,
      resolved_at = now(),
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('ack_action', v_action),
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'acknowledged',
    'action', v_action
  );
end;
$$;

revoke all on function public.acknowledge_inbox_item(uuid, text) from public;
grant execute on function public.acknowledge_inbox_item(uuid, text) to authenticated;
