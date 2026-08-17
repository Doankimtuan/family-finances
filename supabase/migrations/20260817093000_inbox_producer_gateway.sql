-- PROMPT 13B — Canonical Inbox producer gateway.
--
-- One Inbox-owned boundary through which source domains create Inbox items.
-- Source domains stop inserting into public.inbox_items directly; they call
-- public.produce_inbox_item(...) with semantic inputs only.
--
-- Canonical kinds (Prompt 13A): unmapped_expense, income_suggest,
--   savings_maturity, early_withdrawal_confirmation, emi_complete,
--   emergency_declaration.
-- Removed/legacy kinds are rejected at the boundary.

-- 1. Add a stable dedupe key column. The gateway computes it from semantic
--    inputs (kind + source + cascade day) so producers no longer need to know
--    about cascade_day_key or unique index shapes.
alter table public.inbox_items
  add column if not exists dedupe_key text;

create unique index if not exists inbox_items_dedupe_key_unique
  on public.inbox_items (household_id, dedupe_key)
  where dedupe_key is not null;

comment on column public.inbox_items.dedupe_key is
  'Canonical idempotency key computed by produce_inbox_item (Prompt 13B).';

-- Backfill dedupe_key for existing rows so the unique index stays consistent.
update public.inbox_items i
set dedupe_key = concat_ws(
  '|',
  i.kind,
  i.source_type,
  i.source_id,
  coalesce(i.context_json->>'cascadeDay', ''),
  coalesce(i.assigned_to_user_id::text, '')
)
where i.dedupe_key is null;

-- Drop the previous bespoke unique index; the gateway dedupe_key replaces it.
drop index if exists public.inbox_items_unique_source_kind_cascade;

-- 2. Canonical context envelope version constant (used by the gateway).
--    The envelope is { version: 1, kind, data: {...} }. Data carries only
--    source-owned fields; normalized columns stay authoritative.

-- 3. The gateway itself.
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
  v_item_id uuid;
  v_currency_norm text;
  v_context_envelope jsonb;
  v_assigned uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Membership: the actor must belong to the target household.
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  -- Canonical kind gate.
  if not p_kind = any(v_canonical_kinds) then
    if p_kind = any(v_removed_kinds) then
      raise exception 'Removed Inbox kind cannot be produced';
    end if;
    raise exception 'Unknown Inbox kind';
  end if;

  -- Source type normalization + validation.
  if p_source_type is null or p_source_type not in ('transaction', 'guided', 'plan_movement') then
    raise exception 'Invalid Inbox source type';
  end if;

  -- Kind-specific required context (minimum contract).
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

  -- Assignment: only emergency declarations may target a member; the target
  -- must be an active member of the household.
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
  v_currency_norm := upper(coalesce(nullif(trim(p_currency), ''), 'VND'));

  -- Dedupe identity: household + kind + source_type + source_id +
  -- cascade day (savings) + assignee (emergency). Empty cascade/assignee
  -- are folded to a stable sentinel so the key is deterministic.
  v_dedupe_key := concat_ws(
    '|',
    p_kind,
    p_source_type,
    p_source_id::text,
    coalesce(nullif(v_cascade_day, ''), 'none'),
    coalesce(v_assigned::text, 'none'),
    coalesce(p_dedupe_extra, '')
  );

  v_context_envelope := jsonb_build_object(
    'version', 1,
    'kind', p_kind,
    'data', coalesce(p_context, '{}'::jsonb)
  );

  insert into public.inbox_items (
    household_id, kind, status, source_type, source_id,
    amount, currency, title, context_json,
    assigned_to_user_id, expires_at, suggested_jar_id, suggested_category_id,
    dedupe_key
  )
  values (
    p_household_id, p_kind, 'pending', p_source_type, p_source_id,
    p_amount, v_currency_norm, coalesce(nullif(trim(p_title), ''), p_kind),
    v_context_envelope,
    v_assigned, p_expires_at, p_suggested_jar_id, p_suggested_category_id,
    v_dedupe_key
  )
  on conflict (household_id, dedupe_key) where dedupe_key is not null
  do update
  set
    status = 'pending',
    updated_at = timezone('utc', now()),
    title = excluded.title,
    amount = excluded.amount,
    currency = excluded.currency,
    context_json = excluded.context_json,
    expires_at = excluded.expires_at,
    suggested_jar_id = excluded.suggested_jar_id,
    suggested_category_id = excluded.suggested_category_id
  returning id into v_item_id;

  return jsonb_build_object(
    'inbox_item_id', v_item_id,
    'idempotent', false
  );
end;
$$;

revoke all on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) from public;
grant execute on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) to authenticated;

-- 4. Staleness worker: also expire canonical savings_maturity items whose
--    active window has passed (Prompt 13A 31-day window). Keep the existing
--    payment-reminder expiry clause harmless (no canonical rows exist).
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
