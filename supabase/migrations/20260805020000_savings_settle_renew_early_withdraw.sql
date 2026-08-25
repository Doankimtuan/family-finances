-- Savings Domain Evolution follow-on: settle / renew / early-withdraw RPCs,
-- accrued interest on detect, BR-10 cascade source keys, acknowledge kinds.

-- ---------------------------------------------------------------------------
-- 1. Inbox unique source: allow kind + cascadeDay differentiation (BR-10)
-- ---------------------------------------------------------------------------
alter table public.inbox_items
  drop constraint if exists inbox_items_unique_source;
drop index if exists public.inbox_items_unique_source;
drop index if exists public.inbox_items_unique_source_kind_cascade;
alter table public.inbox_items
  add column if not exists cascade_day_key text
  generated always as (coalesce(context_json->>'cascadeDay', '')) stored;
create unique index if not exists inbox_items_unique_source_kind_cascade
  on public.inbox_items (
    household_id,
    source_type,
    source_id,
    kind,
    cascade_day_key
  );
-- ---------------------------------------------------------------------------
-- 2. Helper: simple interest (actual/365), whole currency units
-- ---------------------------------------------------------------------------
create or replace function public.savings_simple_interest(
  p_principal numeric,
  p_annual_rate numeric,
  p_days int
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    floor(
      coalesce(p_principal, 0)
        * coalesce(p_annual_rate, 0)
        / 100
        * greatest(coalesce(p_days, 0), 0)
        / 365
    )
  );
$$;
-- ---------------------------------------------------------------------------
-- 3. Helper: household currency
-- ---------------------------------------------------------------------------
create or replace function public.household_base_currency(p_household_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select upper(h.base_currency)
      from public.households h
      where h.id = p_household_id
    ),
    'VND'
  );
$$;
-- ---------------------------------------------------------------------------
-- 4. Replace detect_matured_savings — persist accrued + rich context
-- ---------------------------------------------------------------------------
create or replace function public.detect_matured_savings(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle record;
  v_days int;
  v_accrued numeric;
  v_prev_rate numeric;
  v_provider_name text;
  v_item_id uuid;
  v_count int := 0;
  v_currency text;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_currency := public.household_base_currency(p_household_id);

  for v_cycle in
    select
      sc.*,
      s.provider_id,
      s.product_name,
      s.product_snapshot,
      s.renewal_preference,
      s.settlement_account_id,
      s.household_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date <= (timezone('utc', now()))::date
    for update of sc
  loop
    v_days := greatest(
      (v_cycle.end_date - v_cycle.start_date),
      0
    );
    v_accrued := public.savings_simple_interest(
      v_cycle.principal,
      v_cycle.locked_rate,
      v_days
    );

    update public.saving_cycles
    set
      status = 'matured',
      accrued_interest = v_accrued
    where id = v_cycle.id;

    update public.savings
    set status = 'matured', updated_at = timezone('utc', now())
    where id = v_cycle.saving_id;

    select sc2.locked_rate into v_prev_rate
    from public.saving_cycles sc2
    where sc2.saving_id = v_cycle.saving_id
      and sc2.cycle_number = v_cycle.cycle_number - 1
    limit 1;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    insert into public.inbox_items (
      household_id, kind, status, source_type, source_id,
      amount, currency, title, context_json
    )
    values (
      p_household_id,
      'savings_matured',
      'pending',
      'guided',
      v_cycle.saving_id,
      v_cycle.principal + v_accrued,
      v_currency,
      coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
      jsonb_build_object(
        'flow', 'savings_maturity',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'providerId', v_cycle.provider_id,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', v_prev_rate,
        'rateDifference', case
          when v_prev_rate is not null then v_cycle.locked_rate - v_prev_rate
          else 0
        end,
        'principal', v_cycle.principal,
        'accruedInterest', v_accrued,
        'estimatedInterest', v_accrued,
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_preference,
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id,
        'recommendedPackages', '[]'::jsonb
      )
    )
    on conflict (household_id, source_type, source_id, kind, cascade_day_key)
    do update
    set
      status = 'pending',
      updated_at = timezone('utc', now()),
      title = excluded.title,
      amount = excluded.amount,
      context_json = excluded.context_json
    returning id into v_item_id;

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'maturedCount', v_count);
end;
$$;
grant execute on function public.detect_matured_savings(uuid) to authenticated;
-- ---------------------------------------------------------------------------
-- 5. BR-10 cascade enqueue (30 / 14 / 7) — distinct cascadeDay in unique key
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_savings_maturity_cascade(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle record;
  v_days_left int;
  v_cascade_day int;
  v_currency text;
  v_count int := 0;
  v_provider_name text;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_currency := public.household_base_currency(p_household_id);

  for v_cycle in
    select
      sc.*,
      s.provider_id,
      s.product_name,
      s.product_snapshot,
      s.renewal_preference,
      s.settlement_account_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date > (timezone('utc', now()))::date
  loop
    v_days_left := (v_cycle.end_date - (timezone('utc', now()))::date);

    if v_days_left in (30, 14, 7) then
      v_cascade_day := v_days_left;
    elsif v_days_left < 7 and v_days_left > 0 then
      -- keep nearest bucket as 7-day reminder if already inside window
      v_cascade_day := 7;
    else
      continue;
    end if;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    insert into public.inbox_items (
      household_id, kind, status, source_type, source_id,
      amount, currency, title, context_json
    )
    values (
      p_household_id,
      'savings_maturity',
      'pending',
      'guided',
      v_cycle.saving_id,
      v_cycle.principal,
      v_currency,
      coalesce(v_cycle.product_name, 'Saving')
        || ' — Matures in '
        || v_cascade_day
        || ' days',
      jsonb_build_object(
        'flow', 'savings_maturity_cascade',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'cascadeDay', v_cascade_day,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', null,
        'rateDifference', 0,
        'principal', v_cycle.principal,
        'accruedInterest', coalesce(v_cycle.accrued_interest, 0),
        'estimatedInterest', coalesce(v_cycle.accrued_interest, 0),
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_preference,
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id,
        'recommendedPackages', '[]'::jsonb
      )
    )
    on conflict (household_id, source_type, source_id, kind, cascade_day_key)
    do update
    set
      updated_at = timezone('utc', now()),
      title = excluded.title,
      context_json = excluded.context_json
    where inbox_items.status = 'pending';

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'cascadeCount', v_count);
end;
$$;
grant execute on function public.enqueue_savings_maturity_cascade(uuid) to authenticated;
-- ---------------------------------------------------------------------------
-- 6. acknowledge_inbox_item — savings_matured / renewal / early withdraw
--     (ack only — never moves money)
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
  v_saving_id uuid;
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

  if v_item.kind in (
    'savings_maturity',
    'savings_matured',
    'renewal_required'
  ) then
    if v_action not in (
      'renew',
      'switch',
      'withdraw',
      'confirm_configured',
      'choose_package',
      'change_settlement',
      'remind_tomorrow',
      'dismiss'
    ) then
      raise exception 'Invalid maturity action';
    end if;
  elsif v_item.kind = 'early_withdrawal_confirmation' then
    if v_action not in ('confirm', 'cancel', 'dismiss') then
      raise exception 'Invalid early withdrawal action';
    end if;
  elsif v_item.kind = 'emi_complete' then
    if v_action not in ('celebrate', 'later') then
      raise exception 'Invalid EMI action';
    end if;
  else
    raise exception 'Item cannot be acknowledged';
  end if;

  update public.inbox_items i
  set status = case
        when v_action in ('dismiss', 'cancel') then 'dismissed'
        when v_action = 'remind_tomorrow' then 'pending'
        else 'acknowledged'
      end,
      resolved_by = case
        when v_action = 'remind_tomorrow' then null
        else v_user_id
      end,
      resolved_at = case
        when v_action = 'remind_tomorrow' then null
        else now()
      end,
      due_at = case
        when v_action = 'remind_tomorrow'
          then (timezone('utc', now()) + interval '1 day')
        else i.due_at
      end,
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('ack_action', v_action),
      updated_at = now()
  where i.id = v_item.id;

  -- BR-21: cancel cascade siblings for this saving
  if v_item.kind in (
    'savings_maturity',
    'savings_matured',
    'renewal_required'
  ) and v_action not in ('remind_tomorrow') then
    v_saving_id := coalesce(
      (v_item.context_json->>'savingId')::uuid,
      v_item.source_id
    );

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
        and i.kind in (
          'savings_maturity',
          'savings_matured',
          'renewal_required'
        )
        and i.status = 'pending'
        and i.source_type = v_item.source_type
        and (
          i.source_id = v_item.source_id
          or i.source_id = v_saving_id
          or (i.context_json->>'savingId')::uuid = v_saving_id
        )
      returning i.id
    )
    select count(*)::integer into v_cancelled from cancelled;
  end if;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', case
      when v_action in ('dismiss', 'cancel') then 'dismissed'
      when v_action = 'remind_tomorrow' then 'pending'
      else 'acknowledged'
    end,
    'action', v_action,
    'cascade_cancelled_count', v_cancelled
  );
end;
$$;
revoke all on function public.acknowledge_inbox_item(uuid, text) from public;
grant execute on function public.acknowledge_inbox_item(uuid, text) to authenticated;
-- ---------------------------------------------------------------------------
-- 7. settle_saving_cycle — withdraw everything after maturity confirmation
-- ---------------------------------------------------------------------------
create or replace function public.settle_saving_cycle(
  p_cycle_id uuid,
  p_settlement_account_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_interest numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_currency text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id
  for update;

  if not found then
    raise exception 'Cycle not found';
  end if;

  if v_cycle.status <> 'matured' then
    raise exception 'Cycle must be matured to settle';
  end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id
  for update;

  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);

  if not exists (
    select 1 from public.accounts a
    where a.id = v_settlement_id
      and a.household_id = v_saving.household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid settlement account';
  end if;

  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;
  v_interest := coalesce(v_cycle.accrued_interest, 0);
  v_net := v_cycle.principal + v_interest;

  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency,
      transaction_date, note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency,
      v_today, 'Interest: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_saving.household_id, v_product_account_id, 'expense', v_net, v_currency,
    v_today, 'Settle saving: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_out_tx;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_saving.household_id, v_settlement_id, 'income', v_net, v_currency,
    v_today, 'Saving settlement: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_in_tx;

  update public.saving_cycles
  set
    status = 'rolled',
    settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object(
      'action', 'withdraw',
      'principalReturned', v_cycle.principal,
      'interestReturned', v_interest,
      'penaltyApplied', 0,
      'netAmount', v_net,
      'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id
    )
  where id = v_cycle.id;

  update public.savings
  set status = 'closed', updated_at = timezone('utc', now())
  where id = v_saving.id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'cycleId', v_cycle.id,
    'netAmount', v_net,
    'settlementTransactionId', v_in_tx
  );
end;
$$;
grant execute on function public.settle_saving_cycle(uuid, uuid) to authenticated;
-- ---------------------------------------------------------------------------
-- 8. renew_saving_cycle — roll principal+interest or principal only
-- ---------------------------------------------------------------------------
create or replace function public.renew_saving_cycle(
  p_cycle_id uuid,
  p_action text,
  p_package_snapshot jsonb,
  p_locked_rate numeric,
  p_cycle_start_date date,
  p_cycle_end_date date,
  p_settlement_account_id uuid default null,
  p_product_snapshot jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_interest numeric;
  v_new_principal numeric;
  v_action text;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_new_cycle_id uuid;
  v_currency text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_action := lower(trim(coalesce(p_action, '')));
  if v_action not in ('roll_principal_interest', 'roll_principal_only') then
    raise exception 'Invalid renew action';
  end if;

  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id
  for update;

  if not found then
    raise exception 'Cycle not found';
  end if;

  if v_cycle.status <> 'matured' then
    raise exception 'Cycle must be matured to renew';
  end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id
  for update;

  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  if p_package_snapshot is null or p_locked_rate is null then
    raise exception 'Package snapshot and locked rate required';
  end if;

  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;
  v_interest := coalesce(v_cycle.accrued_interest, 0);

  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency,
      transaction_date, note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency,
      v_today, 'Interest: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  if v_action = 'roll_principal_interest' then
    v_new_principal := v_cycle.principal + v_interest;

    update public.saving_cycles
    set
      status = 'rolled',
      settlement_result = jsonb_build_object(
        'action', 'roll_principal_interest',
        'principalReturned', 0,
        'interestReturned', 0,
        'penaltyApplied', 0,
        'netAmount', 0,
        'settledAt', timezone('utc', now()),
        'settledToAccountId', v_settlement_id
      )
    where id = v_cycle.id;
  else
    -- roll principal only: pay interest out to settlement
    v_new_principal := v_cycle.principal;

    if v_interest > 0 then
      if not exists (
        select 1 from public.accounts a
        where a.id = v_settlement_id
          and a.household_id = v_saving.household_id
          and a.is_archived = false
      ) then
        raise exception 'Invalid settlement account';
      end if;

      insert into public.transactions (
        household_id, account_id, type, amount, currency,
        transaction_date, note, status, created_by, source
      )
      values (
        v_saving.household_id, v_product_account_id, 'expense', v_interest, v_currency,
        v_today, 'Interest payout: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
      )
      returning id into v_out_tx;

      insert into public.transactions (
        household_id, account_id, type, amount, currency,
        transaction_date, note, status, created_by, source
      )
      values (
        v_saving.household_id, v_settlement_id, 'income', v_interest, v_currency,
        v_today, 'Interest from saving: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
      )
      returning id into v_in_tx;
    end if;

    update public.saving_cycles
    set
      status = 'rolled',
      settlement_transaction_id = v_in_tx,
      settlement_result = jsonb_build_object(
        'action', 'roll_principal_only',
        'principalReturned', 0,
        'interestReturned', v_interest,
        'penaltyApplied', 0,
        'netAmount', v_interest,
        'settledAt', timezone('utc', now()),
        'settledToAccountId', v_settlement_id
      )
    where id = v_cycle.id;
  end if;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status
  )
  values (
    v_saving.id,
    v_cycle.cycle_number + 1,
    p_cycle_start_date,
    p_cycle_end_date,
    v_new_principal,
    p_locked_rate,
    p_package_snapshot,
    'active'
  )
  returning id into v_new_cycle_id;

  update public.savings
  set
    status = 'active',
    product_snapshot = coalesce(p_product_snapshot, product_snapshot),
    updated_at = timezone('utc', now())
  where id = v_saving.id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'previousCycleId', v_cycle.id,
    'cycleId', v_new_cycle_id,
    'principal', v_new_principal,
    'action', v_action
  );
end;
$$;
grant execute on function public.renew_saving_cycle(
  uuid, text, jsonb, numeric, date, date, uuid, jsonb
) to authenticated;
-- ---------------------------------------------------------------------------
-- 9. early_withdraw_saving — close active cycle with penalty preview amounts
-- ---------------------------------------------------------------------------
create or replace function public.early_withdraw_saving(
  p_cycle_id uuid,
  p_principal numeric,
  p_accrued_interest numeric,
  p_eligible_interest numeric,
  p_penalty_amount numeric,
  p_net_returned numeric,
  p_penalty_strategy text,
  p_settlement_account_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_eligible numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_ew_id uuid;
  v_currency text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id
  for update;

  if not found then
    raise exception 'Cycle not found';
  end if;

  if v_cycle.status <> 'active' then
    raise exception 'Only active cycles can be withdrawn early';
  end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id
  for update;

  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);

  if not exists (
    select 1 from public.accounts a
    where a.id = v_settlement_id
      and a.household_id = v_saving.household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid settlement account';
  end if;

  v_eligible := greatest(coalesce(p_eligible_interest, 0), 0);
  v_net := greatest(coalesce(p_net_returned, p_principal + v_eligible), 0);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;

  if v_eligible > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency,
      transaction_date, note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_eligible, v_currency,
      v_today, 'Early interest: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_saving.household_id, v_product_account_id, 'expense', v_net, v_currency,
    v_today, 'Early withdraw: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_out_tx;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_saving.household_id, v_settlement_id, 'income', v_net, v_currency,
    v_today, 'Early withdraw settlement: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_in_tx;

  update public.saving_cycles
  set
    status = 'early_closed',
    accrued_interest = coalesce(p_accrued_interest, 0),
    settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object(
      'action', 'withdraw',
      'principalReturned', p_principal,
      'interestReturned', v_eligible,
      'penaltyApplied', coalesce(p_penalty_amount, 0),
      'netAmount', v_net,
      'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id
    )
  where id = v_cycle.id;

  update public.savings
  set status = 'early_closed', updated_at = timezone('utc', now())
  where id = v_saving.id;

  insert into public.early_withdrawals (
    cycle_id, saving_id, principal, accrued_interest,
    eligible_interest, penalty_amount, net_returned,
    penalty_strategy, settlement_transaction_id, executed_by
  )
  values (
    v_cycle.id, v_saving.id, p_principal, coalesce(p_accrued_interest, 0),
    v_eligible, coalesce(p_penalty_amount, 0), v_net,
    coalesce(p_penalty_strategy, 'no_interest'), v_in_tx, v_user_id
  )
  returning id into v_ew_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'cycleId', v_cycle.id,
    'earlyWithdrawalId', v_ew_id,
    'netReturned', v_net,
    'settlementTransactionId', v_in_tx
  );
end;
$$;
grant execute on function public.early_withdraw_saving(
  uuid, numeric, numeric, numeric, numeric, numeric, text, uuid
) to authenticated;
-- ---------------------------------------------------------------------------
-- 10. Legacy metadata backfill (no ledger txs — BR-01 safe)
-- ---------------------------------------------------------------------------
create or replace function public.backfill_legacy_savings_accounts(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_manual_id uuid;
  v_package_id uuid;
  v_package record;
  v_saving_id uuid;
  v_count int := 0;
  v_funding uuid;
  v_snapshot jsonb;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  select id into v_manual_id
  from public.saving_providers
  where provider_key = 'manual'
  limit 1;

  if v_manual_id is null then
    return jsonb_build_object('ok', false, 'error', 'manual_provider_missing');
  end if;

  select * into v_package
  from public.saving_packages
  where provider_id = v_manual_id
  order by duration_days
  limit 1;

  select a.id into v_funding
  from public.accounts a
  where a.household_id = p_household_id
    and a.is_archived = false
    and a.type <> 'credit_card'
    and a.type <> 'savings_product'
  order by a.created_at
  limit 1;

  if v_funding is null then
    return jsonb_build_object('ok', false, 'error', 'no_funding_account');
  end if;

  for v_row in
    select *
    from public.savings_accounts sa
    where sa.household_id = p_household_id
      and sa.status in ('active', 'matured')
      and not exists (
        select 1 from public.savings s
        where s.household_id = p_household_id
          and s.product_snapshot->>'legacySavingsAccountId' = sa.id::text
      )
  loop
    v_snapshot := jsonb_build_object(
      'providerId', v_manual_id,
      'productName', v_row.name,
      'packageName', coalesce(v_package.package_name, 'Legacy'),
      'depositTermDays', coalesce(v_package.duration_days, 30),
      'annualInterestRate', coalesce(v_package.annual_interest_rate, 0),
      'interestCalculationMethod', 'simple',
      'settlementRule', 'withdraw_everything',
      'renewalPreference', 'manual_review',
      'penaltyStrategy', 'no_interest',
      'providerRules', '{}'::jsonb,
      'legacyImport', true,
      'legacySavingsAccountId', v_row.id
    );

    insert into public.savings (
      household_id, status, funding_account_id, settlement_account_id,
      provider_id, product_name, product_snapshot, renewal_preference, created_by
    )
    values (
      p_household_id,
      case when v_row.status = 'matured' then 'matured' else 'active' end,
      v_funding,
      v_funding,
      v_manual_id,
      v_row.name,
      v_snapshot,
      'manual_review',
      v_row.created_by
    )
    returning id into v_saving_id;

    insert into public.saving_cycles (
      saving_id, cycle_number, start_date, end_date,
      principal, locked_rate, package_snapshot, accrued_interest, status
    )
    values (
      v_saving_id,
      1,
      coalesce(v_row.created_at::date, (timezone('utc', now()))::date),
      v_row.maturity_date,
      v_row.principal_amount,
      coalesce(v_package.annual_interest_rate, 0),
      jsonb_build_object(
        'packageName', coalesce(v_package.package_name, 'Legacy'),
        'durationDays', coalesce(v_package.duration_days, 30),
        'annualInterestRate', coalesce(v_package.annual_interest_rate, 0),
        'settlementRules', '["withdraw_everything"]'::jsonb,
        'penaltyRules', '[]'::jsonb,
        'renewableAvailable', true,
        'minAmount', null,
        'maxAmount', null
      ),
      0,
      case when v_row.status = 'matured' then 'matured' else 'active' end
    );

    -- Soft-close legacy row so strangler stops dual-active listing
    update public.savings_accounts
    set status = 'closed', updated_at = timezone('utc', now())
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'migratedCount', v_count);
end;
$$;
grant execute on function public.backfill_legacy_savings_accounts(uuid) to authenticated;
-- ---------------------------------------------------------------------------
-- 11. Patch create_saving_with_transfer to use household currency
-- ---------------------------------------------------------------------------
create or replace function public.create_saving_with_transfer(
  p_funding_account_id uuid,
  p_principal numeric,
  p_provider_id uuid,
  p_product_name text,
  p_product_snapshot jsonb,
  p_renewal_preference text,
  p_settlement_account_id uuid,
  p_cycle_start_date date,
  p_cycle_end_date date,
  p_package_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_product_account_id uuid;
  v_saving_id uuid;
  v_cycle_id uuid;
  v_funding_tx_id uuid;
  v_receiving_tx_id uuid;
  v_today date;
  v_currency text;
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

  if p_principal is null or p_principal <= 0 then
    raise exception 'Principal must be positive';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_funding_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid funding account';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_settlement_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid settlement account';
  end if;

  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);
  v_currency := public.household_base_currency(v_household_id);
  v_today := (timezone('utc', now()))::date;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, p_funding_account_id, 'expense', p_principal, v_currency,
    v_today, 'Fund saving: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_funding_tx_id;

  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, v_product_account_id, 'income', p_principal, v_currency,
    v_today, 'Saving funded: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_receiving_tx_id;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id,
    provider_id, product_name, product_snapshot, renewal_preference, created_by
  )
  values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id,
    p_provider_id, p_product_name, p_product_snapshot, p_renewal_preference, v_user_id
  )
  returning id into v_saving_id;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status, funding_transaction_id
  )
  values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date,
    p_principal, (p_product_snapshot->>'annualInterestRate')::numeric,
    p_package_snapshot,
    'active', v_funding_tx_id
  )
  returning id into v_cycle_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving_id,
    'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id
  );
end;
$$;
grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb
) to authenticated;
