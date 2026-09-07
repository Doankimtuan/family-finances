create or replace function public.produce_inbox_item(
  p_household_id uuid,
  p_kind text,
  p_source_type text,
  p_source_id uuid,
  p_amount numeric,
  p_currency text,
  p_title text,
  p_context jsonb default '{}'::jsonb,
  p_assigned_to_user_id uuid default null,
  p_expires_at timestamp with time zone default null,
  p_suggested_jar_id uuid default null,
  p_suggested_category_id uuid default null,
  p_dedupe_extra text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_kind text[] := array[
    'unmapped_expense', 'income_suggest', 'savings_maturity',
    'early_withdrawal_confirmation', 'emi_complete',
    'emergency_declaration', 'loan_payment_attention',
    'debt_payment_attention'
  ];
  v_removed text[] := array[
    'savings_matured', 'renewal_required', 'penalty_warning',
    'rate_changed_suggestion', 'package_expired', 'payment_reminder'
  ];
  v_dedupe_key text;
  v_cycle_key text := 'none';
  v_item_id uuid;
  v_context jsonb;
  v_currency text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;
  if not p_kind = any(v_kind) then
    if p_kind = any(v_removed) then
      raise exception 'Removed Inbox kind cannot be produced';
    end if;
    raise exception 'Unknown Inbox kind';
  end if;
  if p_source_type is null or p_source_type not in ('transaction', 'guided', 'plan_movement') then
    raise exception 'Invalid Inbox source type';
  end if;
  if p_kind in ('unmapped_expense', 'income_suggest')
     and (p_source_type <> 'transaction' or p_source_id is null or p_amount is null) then
    raise exception 'Missing required source context';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation')
     and (p_source_type <> 'guided' or p_context->>'savingId' is null or p_context->>'cycleId' is null) then
    raise exception 'Missing savings context';
  end if;
  if p_kind in ('loan_payment_attention', 'debt_payment_attention')
     and (p_source_type <> 'guided' or p_source_id is null or p_amount is null
       or nullif(p_context->>'dueState', '') is null
       or nullif(p_context->>'dueDate', '') is null) then
    raise exception 'Missing due attention context';
  end if;
  if p_kind = 'emi_complete' and p_context is not null
     and p_context->>'installmentPlanId' is null
     and p_context->>'debtId' is null
     and p_context->>'loanId' is null then
    raise exception 'Missing installment/debt context';
  end if;
  if p_kind = 'emergency_declaration'
     and (p_source_type <> 'plan_movement' or nullif(trim(p_context->>'intentNote'), '') is null) then
    raise exception 'Emergency intent note required';
  end if;
  if p_kind not in ('emergency_declaration') and p_assigned_to_user_id is not null then
    raise exception 'Assignment is only valid for emergency declarations';
  end if;
  if p_kind = 'savings_maturity' and p_expires_at is null then
    p_expires_at := timezone('utc', now()) + interval '31 days';
  end if;
  if p_assigned_to_user_id is not null and not exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_assigned_to_user_id
      and hm.is_active = true
  ) then
    raise exception 'Invalid assignee';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_cycle_key := coalesce(p_context->>'cycleId', 'none');
  end if;

  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'VND'));
  v_dedupe_key := concat_ws(
    '|', p_kind, p_source_type, p_source_id::text,
    coalesce(nullif(p_context->>'cascadeDay', ''), 'none'),
    v_cycle_key, coalesce(p_assigned_to_user_id::text, 'none'),
    coalesce(p_dedupe_extra, '')
  );
  v_context := jsonb_build_object(
    'version', 1, 'kind', p_kind, 'data', coalesce(p_context, '{}'::jsonb)
  );

  if p_kind = 'savings_maturity' then
    select i.id into v_item_id
    from public.inbox_items i
    where i.household_id = p_household_id
      and i.kind = p_kind
      and i.source_type = p_source_type
      and i.source_id = p_source_id
      and i.assigned_to_user_id is not distinct from p_assigned_to_user_id
    order by i.created_at desc
    limit 1;

    if v_item_id is not null then
      update public.inbox_items
      set status = 'pending', amount = p_amount, currency = v_currency,
          title = coalesce(nullif(trim(p_title), ''), p_kind),
          context_json = v_context, expires_at = p_expires_at,
          suggested_jar_id = p_suggested_jar_id,
          suggested_category_id = p_suggested_category_id,
          dedupe_key = v_dedupe_key, resolved_by = null,
          resolved_at = null, auto_resolved = false, read_at = null,
          updated_at = timezone('utc', now())
      where id = v_item_id;
      return jsonb_build_object('inbox_item_id', v_item_id, 'idempotent', true);
    end if;
  end if;

  insert into public.inbox_items (
    household_id, kind, status, source_type, source_id, amount, currency,
    title, context_json, assigned_to_user_id, expires_at,
    suggested_jar_id, suggested_category_id, dedupe_key
  ) values (
    p_household_id, p_kind, 'pending', p_source_type, p_source_id,
    p_amount, v_currency, coalesce(nullif(trim(p_title), ''), p_kind),
    v_context, p_assigned_to_user_id, p_expires_at,
    p_suggested_jar_id, p_suggested_category_id, v_dedupe_key
  )
  on conflict (household_id, dedupe_key) where dedupe_key is not null
  do update set
    status = 'pending', updated_at = timezone('utc', now()),
    title = excluded.title, amount = excluded.amount,
    currency = excluded.currency, context_json = excluded.context_json,
    expires_at = excluded.expires_at,
    suggested_jar_id = excluded.suggested_jar_id,
    suggested_category_id = excluded.suggested_category_id
  where public.inbox_items.status = 'pending'
     or (p_kind = 'savings_maturity' and public.inbox_items.status = 'expired')
  returning id into v_item_id;

  if v_item_id is null then
    select id into v_item_id from public.inbox_items
    where household_id = p_household_id and dedupe_key = v_dedupe_key;
  end if;
  return jsonb_build_object('inbox_item_id', v_item_id, 'idempotent', v_item_id is not null);
end;
$function$;
