-- PROMPT 13D — Inbox integration hardening.
-- Per-kind reopen policy + cycle-scoped dedupe for savings kinds.
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
  p_expires_at timestamptz default null,
  p_suggested_jar_id uuid default null,
  p_suggested_category_id uuid default null,
  p_dedupe_extra text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canonical_kinds text[] := array[
    'unmapped_expense',
    'income_suggest',
    'savings_maturity',
    'early_withdrawal_confirmation',
    'emi_complete',
    'emergency_declaration'
  ];
  v_removed_kinds text[] := array[
    'savings_matured',
    'renewal_required',
    'penalty_warning',
    'rate_changed_suggestion',
    'package_expired',
    'payment_reminder'
  ];
  v_dedupe_key text;
  v_cascade_day text;
  v_cycle_key text;
  v_item_id uuid;
  v_currency_norm text;
  v_context_envelope jsonb;
  v_assigned uuid;
  v_new_status text;
  v_refresh_condition text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  if not p_kind = any(v_canonical_kinds) then
    if p_kind = any(v_removed_kinds) then
      raise exception 'Removed Inbox kind cannot be produced';
    end if;
    raise exception 'Unknown Inbox kind';
  end if;

  if p_source_type is null or p_source_type not in ('transaction', 'guided', 'plan_movement') then
    raise exception 'Invalid Inbox source type';
  end if;

  if p_kind = 'unmapped_expense' or p_kind = 'income_suggest' then
    if p_source_type <> 'transaction' then
      raise exception 'Invalid source type for kind';
    end if;
    if p_source_id is null or p_amount is null then
      raise exception 'Missing required source context';
    end if;
  elsif p_kind = 'savings_maturity' then
    if p_source_type <> 'guided' then
      raise exception 'Invalid source type for kind';
    end if;
    if p_context is null
       or p_context->>'savingId' is null
       or p_context->>'cycleId' is null then
      raise exception 'Missing savings maturity context';
    end if;
    if p_expires_at is null then
      p_expires_at := timezone('utc', now()) + interval '31 days';
    end if;
  elsif p_kind = 'early_withdrawal_confirmation' then
    if p_source_type <> 'guided' then
      raise exception 'Invalid source type for kind';
    end if;
    if p_context is null
       or p_context->>'savingId' is null
       or p_context->>'cycleId' is null then
      raise exception 'Missing early withdrawal context';
    end if;
  elsif p_kind = 'emi_complete' then
    if p_source_type <> 'guided' then
      raise exception 'Invalid source type for kind';
    end if;
    if p_context is not null
       and p_context->>'installmentPlanId' is null
       and p_context->>'debtId' is null
       and p_context->>'loanId' is null then
      raise exception 'Missing installment/debt context';
    end if;
  elsif p_kind = 'emergency_declaration' then
    if p_source_type <> 'plan_movement' then
      raise exception 'Invalid source type for kind';
    end if;
    if p_context is null or nullif(trim(p_context->>'intentNote'), '') is null then
      raise exception 'Emergency intent note required';
    end if;
  end if;

  v_assigned := p_assigned_to_user_id;
  if p_kind <> 'emergency_declaration' and v_assigned is not null then
    raise exception 'Assignment is only valid for emergency declarations';
  end if;
  if v_assigned is not null and not exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = v_assigned
      and hm.is_active = true
  ) then
    raise exception 'Invalid assignee';
  end if;

  v_cascade_day := coalesce(p_context->>'cascadeDay', '');

  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_cycle_key := coalesce(p_context->>'cycleId', 'none');
  else
    v_cycle_key := 'none';
  end if;

  v_currency_norm := upper(coalesce(nullif(trim(p_currency), ''), 'VND'));

  v_dedupe_key := concat_ws(
    '|',
    p_kind,
    p_source_type,
    p_source_id::text,
    coalesce(nullif(v_cascade_day, ''), 'none'),
    v_cycle_key,
    coalesce(v_assigned::text, 'none'),
    coalesce(p_dedupe_extra, '')
  );

  v_context_envelope := jsonb_build_object(
    'version', 1,
    'kind', p_kind,
    'data', coalesce(p_context, '{}'::jsonb)
  );

  v_new_status := 'pending';
  if p_kind = 'emi_complete' then
    v_refresh_condition := 'status = ''pending''';
  elsif p_kind = 'savings_maturity' then
    v_refresh_condition := 'status in (''pending'', ''expired'')';
  else
    v_refresh_condition := 'status = ''pending''';
  end if;

  execute format(
    'insert into public.inbox_items (
       household_id, kind, status, source_type, source_id,
       amount, currency, title, context_json,
       assigned_to_user_id, expires_at, suggested_jar_id, suggested_category_id,
       dedupe_key
     )
     values (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9,
       $10, $11, $12, $13,
       $14
     )
     on conflict (household_id, dedupe_key) where dedupe_key is not null
     do update
     set
       status = excluded.status,
       updated_at = timezone(''utc'', now()),
       title = excluded.title,
       amount = excluded.amount,
       currency = excluded.currency,
       context_json = excluded.context_json,
       expires_at = excluded.expires_at,
       suggested_jar_id = excluded.suggested_jar_id,
       suggested_category_id = excluded.suggested_category_id
     where inbox_items.%s
     returning id'
  , v_refresh_condition)
  into v_item_id
  using
    p_household_id, p_kind, v_new_status, p_source_type, p_source_id,
    p_amount, v_currency_norm, coalesce(nullif(trim(p_title), ''), p_kind),
    v_context_envelope,
    v_assigned, p_expires_at, p_suggested_jar_id, p_suggested_category_id,
    v_dedupe_key;

  if v_item_id is null then
    select i.id into v_item_id
    from public.inbox_items i
    where i.household_id = p_household_id
      and i.dedupe_key = v_dedupe_key
    limit 1;
  end if;

  return jsonb_build_object(
    'inbox_item_id', v_item_id,
    'idempotent', v_item_id is not null
  );
end;
$$;

revoke all on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) from public;
grant execute on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) to authenticated;;
