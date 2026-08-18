-- Implementation Planning Sprint 3 (Spec v2.1):
-- ST-E03-001 Typed ReviewItem discriminators (payment_reminder + status lifecycle)
-- ST-E03-002 Pattern metadata on transactions + auto-resolve support
-- ST-E03-003 expires_at + staleness worker + BR-21 cascade cancel

-- ---------------------------------------------------------------------------
-- inbox_items: expiration / auto-resolve metadata (BR-15)
-- ---------------------------------------------------------------------------
alter table public.inbox_items
  add column if not exists expires_at timestamptz,
  add column if not exists auto_resolved boolean not null default false,
  add column if not exists confidence_score numeric(4, 3),
  add column if not exists suggested_category_id uuid references public.categories(id) on delete set null;

comment on column public.inbox_items.expires_at is
  'PaymentReminder due+7d expiration (BR-15). Null = no temporal expiry.';
comment on column public.inbox_items.auto_resolved is
  'True when resolved by pattern/merchant policy (BR-16), not human.';
comment on column public.inbox_items.confidence_score is
  'Pattern/merchant match confidence 0..1; auto-resolve when >= 0.900.';

alter table public.inbox_items
  drop constraint if exists inbox_items_confidence_score_check;

alter table public.inbox_items
  add constraint inbox_items_confidence_score_check
  check (
    confidence_score is null
    or (confidence_score >= 0 and confidence_score <= 1)
  );

alter table public.inbox_items
  drop constraint if exists inbox_items_kind_check;

alter table public.inbox_items
  add constraint inbox_items_kind_check
  check (
    kind in (
      'unmapped_expense',
      'income_suggest',
      'savings_maturity',
      'emi_complete',
      'emergency_declaration',
      'payment_reminder'
    )
  );

alter table public.inbox_items
  drop constraint if exists inbox_items_status_check;

alter table public.inbox_items
  add constraint inbox_items_status_check
  check (
    status in (
      'pending',
      'resolved',
      'dismissed',
      'acknowledged',
      'auto_resolved',
      'expired',
      'archived'
    )
  );

create index if not exists inbox_items_expires_pending_idx
  on public.inbox_items (expires_at)
  where status = 'pending' and expires_at is not null;

create index if not exists inbox_items_archived_idx
  on public.inbox_items (household_id, status, created_at desc)
  where status in ('expired', 'auto_resolved', 'archived', 'resolved', 'dismissed', 'acknowledged');

-- ---------------------------------------------------------------------------
-- transactions: pattern metadata (REQ-TRN-03 / BR-16)
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column if not exists source text not null default 'manual',
  add column if not exists pattern_id uuid;

alter table public.transactions
  drop constraint if exists transactions_source_check;

alter table public.transactions
  add constraint transactions_source_check
  check (source in ('manual', 'bank_feed', 'recurring_pattern'));

comment on column public.transactions.source is
  'Provenance: manual | bank_feed | recurring_pattern (REQ-TRN-03).';
comment on column public.transactions.pattern_id is
  'Optional recurring pattern id when source = recurring_pattern.';

-- ---------------------------------------------------------------------------
-- Auto-resolve high-confidence inbox items (BR-16)
-- ---------------------------------------------------------------------------
create or replace function public.auto_resolve_inbox_item(
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
  v_jar_id uuid;
  v_threshold numeric := 0.900;
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
    return jsonb_build_object(
      'inbox_item_id', v_item.id,
      'status', v_item.status,
      'auto_resolved', v_item.auto_resolved
    );
  end if;

  if v_item.kind not in ('unmapped_expense', 'income_suggest') then
    raise exception 'Item kind cannot be auto-resolved';
  end if;

  if v_item.confidence_score is null or v_item.confidence_score < v_threshold then
    raise exception 'Confidence below auto-resolve threshold';
  end if;

  v_jar_id := v_item.suggested_jar_id;
  if v_jar_id is null then
    raise exception 'Suggested jar required for auto-resolve';
  end if;

  -- Reuse jar resolve path semantics
  perform public.resolve_inbox_item_to_jar(p_inbox_item_id, v_jar_id);

  update public.inbox_items i
  set status = 'auto_resolved',
      auto_resolved = true,
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'auto_resolved',
    'auto_resolved', true,
    'jar_id', v_jar_id,
    'confidence_score', v_item.confidence_score
  );
end;
$$;

revoke all on function public.auto_resolve_inbox_item(uuid) from public;
grant execute on function public.auto_resolve_inbox_item(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Staleness worker: expire payment reminders past expires_at (BR-15)
-- ---------------------------------------------------------------------------
create or replace function public.run_inbox_staleness_worker()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_expired_count integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  with expired as (
    update public.inbox_items i
    set status = 'expired',
        updated_at = now(),
        context_json = coalesce(i.context_json, '{}'::jsonb)
          || jsonb_build_object(
            'expired_by', 'InboxStalenessWorker',
            'expired_at', timezone('utc', now())
          )
    where i.household_id = v_household_id
      and i.status = 'pending'
      and i.kind = 'payment_reminder'
      and i.expires_at is not null
      and i.expires_at <= timezone('utc', now())
    returning i.id
  )
  select count(*)::integer into v_expired_count from expired;

  return jsonb_build_object(
    'household_id', v_household_id,
    'expired_count', v_expired_count
  );
end;
$$;

revoke all on function public.run_inbox_staleness_worker() from public;
grant execute on function public.run_inbox_staleness_worker() to authenticated;

-- ---------------------------------------------------------------------------
-- BR-21: maturity ack cancels sibling cascade timers for same source
-- ---------------------------------------------------------------------------
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
  v_cancelled integer := 0;
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

  -- Cancel pending maturity cascade siblings (30/14/7 day timers) — BR-21
  if v_item.kind = 'savings_maturity' then
    with cancelled as (
      update public.inbox_items i
      set status = 'archived',
          updated_at = now(),
          context_json = coalesce(i.context_json, '{}'::jsonb)
            || jsonb_build_object(
              'cascade_cancelled', true,
              'cancelled_by_inbox_item_id', v_item.id,
              'cancelled_at', timezone('utc', now())
            )
      where i.household_id = v_item.household_id
        and i.id <> v_item.id
        and i.kind = 'savings_maturity'
        and i.status = 'pending'
        and i.source_type = v_item.source_type
        and i.source_id = v_item.source_id
      returning i.id
    )
    select count(*)::integer into v_cancelled from cancelled;
  end if;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'acknowledged',
    'action', v_action,
    'cascade_cancelled_count', v_cancelled
  );
end;
$$;

revoke all on function public.acknowledge_inbox_item(uuid, text) from public;
grant execute on function public.acknowledge_inbox_item(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Enqueue payment reminder helper (BR-17) for card due dates
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_payment_reminder(
  p_source_type text,
  p_source_id uuid,
  p_amount numeric,
  p_currency char(3),
  p_title text,
  p_due_at timestamptz,
  p_context jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_id uuid;
  v_expires timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_due_at is null then
    raise exception 'Due date required';
  end if;

  -- BR-15: expire 7 days after due date
  v_expires := p_due_at + interval '7 days';

  insert into public.inbox_items (
    household_id,
    kind,
    status,
    source_type,
    source_id,
    amount,
    currency,
    title,
    expires_at,
    context_json
  )
  values (
    v_household_id,
    'payment_reminder',
    'pending',
    case
      when coalesce(nullif(trim(p_source_type), ''), 'guided')
        in ('transaction', 'guided', 'plan_movement')
      then coalesce(nullif(trim(p_source_type), ''), 'guided')
      else 'guided'
    end,
    p_source_id,
    p_amount,
    coalesce(p_currency, 'VND'),
    coalesce(nullif(trim(p_title), ''), 'Payment reminder'),
    v_expires,
    coalesce(p_context, '{}'::jsonb)
      || jsonb_build_object(
        'event', 'PaymentReminderCreated',
        'due_at', p_due_at,
        'expires_at', v_expires
      )
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.enqueue_payment_reminder(text, uuid, numeric, char, text, timestamptz, jsonb) from public;
grant execute on function public.enqueue_payment_reminder(text, uuid, numeric, char, text, timestamptz, jsonb) to authenticated;
