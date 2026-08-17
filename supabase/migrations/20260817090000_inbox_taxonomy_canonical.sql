-- PROMPT 13A — Freeze canonical Inbox taxonomy (single decision queue).
--
-- KEEP (canonical): unmapped_expense, income_suggest, savings_maturity,
--   early_withdrawal_confirmation, emi_complete, emergency_declaration.
-- REMOVED: penalty_warning, rate_changed_suggestion, package_expired
--   (constraint-only kinds, never produced by any RPC).
-- MERGED into savings_maturity: savings_matured, renewal_required.
-- MOVED OUT OF INBOX: payment_reminder (no actionable outcome contract; the
--   only producer enqueue_payment_reminder is unused by app code).

-- 1. Tighten the inbox_items kind CHECK to the canonical set.
alter table public.inbox_items
  drop constraint if exists inbox_items_kind_check;

alter table public.inbox_items
  add constraint inbox_items_kind_check
  check (
    kind in (
      'unmapped_expense',
      'income_suggest',
      'savings_maturity',
      'early_withdrawal_confirmation',
      'emi_complete',
      'emergency_declaration'
    )
  );

-- 2. History: merge legacy savings_matured / renewal_required rows onto the
--    canonical savings_maturity kind (keeps history readable; the read layer
--    maps these already, so this is a consistency backfill).
update public.inbox_items
set kind = 'savings_maturity',
    context_json = coalesce(context_json, '{}'::jsonb)
      || jsonb_build_object('legacyKind', kind),
    updated_at = now()
where kind in ('savings_matured', 'renewal_required');

-- 3. Removed kinds: move surviving rows out of the active queue. They are not
--    canonical Inbox items and must never be actioned; archival preserves the
--    historical record.
update public.inbox_items
set status = 'archived',
    updated_at = now(),
    context_json = coalesce(context_json, '{}'::jsonb)
      || jsonb_build_object('removedByTaxonomy', true)
where kind in (
  'penalty_warning',
  'rate_changed_suggestion',
  'package_expired',
  'payment_reminder'
);

-- 4. acknowledge_inbox_item — canonical kinds only. The previous version
--    accepted legacy savings kinds; the contract now accepts one maturity
--    kind plus early-withdrawal and EMI-complete.
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
  v_new_status text;
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

  v_new_status := case
    when v_action in ('dismiss', 'cancel') then 'dismissed'
    when v_action = 'remind_tomorrow' then 'pending'
    else 'acknowledged'
  end;

  update public.inbox_items i
  set status = v_new_status,
      resolved_by = case
        when v_action = 'remind_tomorrow' then null
        else v_user_id
      end,
      resolved_at = case
        when v_action = 'remind_tomorrow' then null
        else now()
      end,
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('ack_action', v_action),
      updated_at = now()
  where i.id = v_item.id;

  -- BR-21: cancel sibling cascade reminders for the same saving.
  if v_item.kind = 'savings_maturity' and v_action <> 'remind_tomorrow' then
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
        and i.kind = 'savings_maturity'
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
    'status', v_new_status,
    'action', v_action,
    'cascade_cancelled_count', v_cancelled
  );
end;
$$;

revoke all on function public.acknowledge_inbox_item(uuid, text) from public;
grant execute on function public.acknowledge_inbox_item(uuid, text) to authenticated;

-- 5. resolve_inbox_item_to_jar — canonical kind guard only.
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

-- 6. auto_resolve_inbox_item — canonical kind guard only.
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

-- 7. enqueue_savings_maturity_cascade — write the canonical savings_maturity
--    kind instead of a legacy savings_maturity/savings_matured split.
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
      s.renewal_policy,
      s.renewal_config,
      s.settlement_account_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date > (timezone('utc', now()))::date
  loop
    v_days_left := (v_cycle.end_date - (timezone('utc', now()))::date);

    if v_days_left in (30, 14, 7, 3, 1) then
      v_cascade_day := v_days_left;
    else
      continue;
    end if;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving')
        || ' — Matures in '
        || v_cascade_day
        || ' days',
      p_context => jsonb_build_object(
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
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id,
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', 'none',
        'renewalConfidence', 0,
        'warnings', '[]'::jsonb
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'cascadeCount', v_count);
end;
$$;

revoke all on function public.enqueue_savings_maturity_cascade(uuid) from public;
grant execute on function public.enqueue_savings_maturity_cascade(uuid) to authenticated;

-- 8. detect_matured_savings — write the canonical savings_maturity kind.
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
  v_suggested text;
  v_confidence numeric;
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
      s.renewal_policy,
      s.renewal_config,
      s.settlement_account_id,
      s.household_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date <= (timezone('utc', now()))::date
    for update of sc
  loop
    v_days := greatest((v_cycle.end_date - v_cycle.start_date), 0);
    v_accrued := public.savings_simple_interest(
      v_cycle.principal,
      v_cycle.locked_rate,
      v_days
    );

    update public.saving_cycles
    set status = 'matured', accrued_interest = v_accrued
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

    v_suggested := case v_cycle.renewal_policy
      when 'always_ask' then 'none'
      when 'use_saved_preference' then
        case when coalesce(v_cycle.renewal_config->>'preferredSettlementRule', '') = 'withdraw_everything'
          then 'withdraw'
          else 'confirm_configured'
        end
      when 'auto_renew_until_cancelled' then 'confirm_configured'
      when 'one_time_renewal' then 'confirm_configured'
      else 'none'
    end;

    v_confidence := case v_cycle.renewal_policy
      when 'always_ask' then 0
      when 'use_saved_preference' then 0.7
      when 'auto_renew_until_cancelled' then 0.9
      when 'one_time_renewal' then 0.85
      else 0
    end;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal + v_accrued,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
      p_context => jsonb_build_object(
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
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'settlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        ),
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', v_suggested,
        'renewalConfidence', v_confidence,
        'warnings', '[]'::jsonb,
        'preselectedPackageId', v_cycle.renewal_config->>'preferredPackageId',
        'preselectedSettlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'preselectedSettlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        )
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'maturedCount', v_count);
end;
$$;

revoke all on function public.detect_matured_savings(uuid) from public;
grant execute on function public.detect_matured_savings(uuid) to authenticated;
