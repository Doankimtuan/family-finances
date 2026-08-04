-- Implementation Planning Sprint 2 (Spec v2.1):
-- ST-E02-001 BR-01 plan_movements ($0.00 ledger impact)
-- ST-E02-002 BR-07 is_emergency + intent_note
-- ST-E02-003 BR-13 partner emergency notification via Inbox

-- ---------------------------------------------------------------------------
-- Virtual jar capacity delta (intention only — never a bank balance)
-- ---------------------------------------------------------------------------
alter table public.jars
  add column if not exists capacity_delta numeric(18, 0) not null default 0;

comment on column public.jars.capacity_delta is
  'Virtual capacity adjustments from plan movements (BR-01). Not a ledger/bank balance.';

-- ---------------------------------------------------------------------------
-- plan_movements (BR-01 / EVO-06)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_movements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source_jar_id uuid not null references public.jars(id) on delete restrict,
  target_jar_id uuid not null references public.jars(id) on delete restrict,
  amount numeric(18, 0) not null,
  is_emergency boolean not null default false,
  intent_note text,
  executed_by_user_id uuid not null references auth.users(id) on delete restrict,
  ledger_impact numeric(18, 0) not null default 0,
  created_at timestamptz not null default now(),
  constraint plan_movements_amount_positive check (amount > 0),
  constraint plan_movements_distinct_jars check (source_jar_id <> target_jar_id),
  constraint plan_movements_zero_ledger_impact check (ledger_impact = 0),
  constraint plan_movements_emergency_note_check check (
    is_emergency = false
    or (intent_note is not null and length(trim(intent_note)) > 0)
  )
);

create index if not exists plan_movements_household_created_idx
  on public.plan_movements (household_id, created_at desc);

create index if not exists plan_movements_emergency_idx
  on public.plan_movements (household_id, created_at desc)
  where is_emergency = true;

alter table public.plan_movements enable row level security;

drop policy if exists plan_movements_select_member on public.plan_movements;
create policy plan_movements_select_member on public.plan_movements
  for select to authenticated
  using (public.is_household_member(household_id));

-- Mutations only via security-definer RPC
revoke insert, update, delete on public.plan_movements from authenticated;
grant select on public.plan_movements to authenticated;

-- ---------------------------------------------------------------------------
-- Inbox: emergency_declaration kind + plan_movement source (BR-13)
-- ---------------------------------------------------------------------------
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
      'emergency_declaration'
    )
  );

alter table public.inbox_items
  drop constraint if exists inbox_items_source_type_check;

alter table public.inbox_items
  add constraint inbox_items_source_type_check
  check (source_type in ('transaction', 'guided', 'plan_movement'));

-- ---------------------------------------------------------------------------
-- reallocate_jar_capacity RPC (BR-01 / BR-07 / BR-13)
-- ---------------------------------------------------------------------------
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
  v_source public.jars%rowtype;
  v_target public.jars%rowtype;
  v_movement_id uuid;
  v_inbox_id uuid;
  v_note text;
  v_is_emergency boolean;
  v_tx_count_before bigint;
  v_tx_count_after bigint;
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

  select h.base_currency into v_currency
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

  select count(*) into v_tx_count_before
  from public.transactions t
  where t.household_id = v_household_id;

  insert into public.plan_movements (
    household_id,
    source_jar_id,
    target_jar_id,
    amount,
    is_emergency,
    intent_note,
    executed_by_user_id,
    ledger_impact
  )
  values (
    v_household_id,
    p_source_jar_id,
    p_target_jar_id,
    p_amount,
    v_is_emergency,
    v_note,
    v_user_id,
    0
  )
  returning id into v_movement_id;

  update public.jars
  set capacity_delta = capacity_delta - p_amount,
      updated_at = timezone('utc', now())
  where id = p_source_jar_id;

  update public.jars
  set capacity_delta = capacity_delta + p_amount,
      updated_at = timezone('utc', now())
  where id = p_target_jar_id;

  if v_is_emergency then
    insert into public.inbox_items (
      household_id,
      kind,
      status,
      source_type,
      source_id,
      amount,
      currency,
      title,
      context_json
    )
    values (
      v_household_id,
      'emergency_declaration',
      'pending',
      'plan_movement',
      v_movement_id,
      p_amount,
      coalesce(v_currency, 'VND'),
      'Emergency reallocation declared',
      jsonb_build_object(
        'event', 'EmergencyDeclaredEvent',
        'is_emergency', true,
        'intent_note', v_note,
        'source_jar_id', p_source_jar_id,
        'target_jar_id', p_target_jar_id,
        'executed_by_user_id', v_user_id,
        'priority', 'high'
      )
    )
    returning id into v_inbox_id;
  end if;

  select count(*) into v_tx_count_after
  from public.transactions t
  where t.household_id = v_household_id;

  if v_tx_count_after <> v_tx_count_before then
    raise exception 'Plan movement must not create ledger transactions';
  end if;

  return jsonb_build_object(
    'plan_movement_id', v_movement_id,
    'source_jar_id', p_source_jar_id,
    'target_jar_id', p_target_jar_id,
    'amount', p_amount,
    'is_emergency', v_is_emergency,
    'inbox_item_id', v_inbox_id,
    'ledger_transactions_created', 0,
    'ledger_impact', 0
  );
end;
$$;

revoke all on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) from public;
grant execute on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) to authenticated;
