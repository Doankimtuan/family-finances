create or replace function public.reallocate_jar_capacity(
  p_source_jar_id uuid,
  p_target_jar_id uuid,
  p_amount numeric,
  p_is_emergency boolean default false,
  p_intent_note text default null
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
  v_overspend_policy text;
  v_source public.jars%rowtype;
  v_target public.jars%rowtype;
  v_movement_id uuid;
  v_inbox_id uuid;
  v_note text;
  v_is_emergency boolean;
  v_tx_count_before bigint;
  v_tx_count_after bigint;
  v_partner record;
  v_partner_count int := 0;
  v_first_inbox_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_source_jar_id is null or p_target_jar_id is null
     or p_source_jar_id = p_target_jar_id then
    raise exception 'Distinct source and target jars required';
  end if;

  v_is_emergency := coalesce(p_is_emergency, false);
  v_note := nullif(trim(coalesce(p_intent_note, '')), '');

  if v_is_emergency and v_note is null then
    raise exception 'Emergency intent note required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  select h.base_currency, h.overspend_policy
  into v_currency, v_overspend_policy
  from public.households h
  where h.id = v_household_id;

  select * into v_source
  from public.jars j
  where j.id = p_source_jar_id
  for update;

  if not found
     or v_source.household_id <> v_household_id
     or v_source.is_archived
     or coalesce(v_source.is_paused, false) then
    raise exception 'Invalid source jar';
  end if;

  select * into v_target
  from public.jars j
  where j.id = p_target_jar_id
  for update;

  if not found
     or v_target.household_id <> v_household_id
     or v_target.is_archived
     or coalesce(v_target.is_paused, false) then
    raise exception 'Invalid target jar';
  end if;

  if coalesce(v_overspend_policy, 'warn') = 'block'
     and v_source.capacity_delta < p_amount then
    raise exception 'ERR_CAPACITY_BLOCKED';
  end if;

  select count(*) into v_tx_count_before
  from public.transactions t
  where t.household_id = v_household_id;

  insert into public.plan_movements (
    household_id, source_jar_id, target_jar_id, amount, is_emergency, intent_note, executed_by_user_id, ledger_impact
  ) values (
    v_household_id, p_source_jar_id, p_target_jar_id, p_amount, v_is_emergency, v_note, v_user_id, 0
  ) returning id into v_movement_id;

  update public.jars set capacity_delta = capacity_delta - p_amount, updated_at = timezone('utc', now()) where id = p_source_jar_id;
  update public.jars set capacity_delta = capacity_delta + p_amount, updated_at = timezone('utc', now()) where id = p_target_jar_id;

  if v_is_emergency then
    for v_partner in
      select hm.user_id from public.household_members hm
      where hm.household_id = v_household_id and hm.is_active = true and hm.user_id <> v_user_id
    loop
      insert into public.inbox_items (
        household_id, kind, status, source_type, source_id, amount, currency, title, context_json, assigned_to_user_id
      ) values (
        v_household_id, 'emergency_declaration', 'pending', 'plan_movement', v_movement_id, p_amount,
        coalesce(v_currency, 'VND'), 'Emergency reallocation declared',
        jsonb_build_object(
          'event', 'EmergencyDeclaredEvent', 'is_emergency', true, 'intent_note', v_note,
          'source_jar_id', p_source_jar_id, 'target_jar_id', p_target_jar_id,
          'executed_by_user_id', v_user_id, 'assigned_to_user_id', v_partner.user_id,
          'priority', 'high', 'channel', 'partner_inbox'
        ),
        v_partner.user_id
      ) returning id into v_inbox_id;
      v_partner_count := v_partner_count + 1;
      if v_first_inbox_id is null then v_first_inbox_id := v_inbox_id; end if;
    end loop;

    if v_partner_count = 0 then
      insert into public.inbox_items (
        household_id, kind, status, source_type, source_id, amount, currency, title, context_json, assigned_to_user_id
      ) values (
        v_household_id, 'emergency_declaration', 'pending', 'plan_movement', v_movement_id, p_amount,
        coalesce(v_currency, 'VND'), 'Emergency reallocation declared',
        jsonb_build_object(
          'event', 'EmergencyDeclaredEvent', 'is_emergency', true, 'intent_note', v_note,
          'source_jar_id', p_source_jar_id, 'target_jar_id', p_target_jar_id,
          'executed_by_user_id', v_user_id, 'priority', 'high', 'channel', 'solo_audit'
        ),
        v_user_id
      ) returning id into v_first_inbox_id;
    end if;
  end if;

  select count(*) into v_tx_count_after from public.transactions t where t.household_id = v_household_id;
  if v_tx_count_after <> v_tx_count_before then
    raise exception 'Plan movement must not create ledger transactions';
  end if;

  return jsonb_build_object(
    'plan_movement_id', v_movement_id,
    'source_jar_id', p_source_jar_id,
    'target_jar_id', p_target_jar_id,
    'amount', p_amount,
    'is_emergency', v_is_emergency,
    'inbox_item_id', v_first_inbox_id,
    'partner_notified_count', v_partner_count,
    'ledger_transactions_created', 0,
    'ledger_impact', 0
  );
end;
$$;

revoke all on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) from public;
grant execute on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) to authenticated;;
