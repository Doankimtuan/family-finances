-- Savings Renewal Policy Evolution
-- Rename preference → policy, add renewal_config + renewal_decision,
-- cascade 30/14/7/3/1, enrich detect context.

-- ---------------------------------------------------------------------------
-- 1. Column rename + new values
-- ---------------------------------------------------------------------------
alter table public.savings
  rename column renewal_preference to renewal_policy;

alter table public.savings
  drop constraint if exists savings_renewal_preference_check;

update public.savings
set renewal_policy = case renewal_policy
  when 'manual_review' then 'always_ask'
  when 'auto_renew_same_package' then 'auto_renew_until_cancelled'
  when 'auto_renew_selected_package' then 'auto_renew_until_cancelled'
  when 'withdraw_everything' then 'use_saved_preference'
  else renewal_policy
end
where renewal_policy in (
  'manual_review',
  'auto_renew_same_package',
  'auto_renew_selected_package',
  'withdraw_everything'
);

alter table public.savings
  alter column renewal_policy set default 'always_ask';

alter table public.savings
  add constraint savings_renewal_policy_check check (
    renewal_policy in (
      'always_ask',
      'use_saved_preference',
      'auto_renew_until_cancelled',
      'one_time_renewal'
    )
  );

alter table public.savings
  add column if not exists renewal_config jsonb not null default '{}'::jsonb;

-- Seed renewal_config for rows migrated from withdraw_everything preference
update public.savings
set renewal_config = jsonb_build_object(
  'preferredPackageId', null,
  'preferredSettlementRule', 'withdraw_everything',
  'preferredSettlementAccountId', null
)
where renewal_policy = 'use_saved_preference'
  and (renewal_config = '{}'::jsonb or renewal_config is null);

alter table public.saving_cycles
  add column if not exists renewal_decision jsonb;

-- ---------------------------------------------------------------------------
-- 2. Cascade days: BR-10 30/14/7 + escalation 3/1
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
-- 3. detect_matured_savings — use renewal_policy + config
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
-- 4. create_saving_with_transfer — accept renewal_policy + renewal_config
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
  p_package_snapshot jsonb,
  p_renewal_config jsonb default '{}'::jsonb
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
  v_policy text;
  v_config jsonb;
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

  v_policy := case p_renewal_preference
    when 'manual_review' then 'always_ask'
    when 'auto_renew_same_package' then 'auto_renew_until_cancelled'
    when 'auto_renew_selected_package' then 'auto_renew_until_cancelled'
    when 'withdraw_everything' then 'use_saved_preference'
    when 'always_ask' then 'always_ask'
    when 'use_saved_preference' then 'use_saved_preference'
    when 'auto_renew_until_cancelled' then 'auto_renew_until_cancelled'
    when 'one_time_renewal' then 'one_time_renewal'
    else 'always_ask'
  end;

  v_config := coalesce(p_renewal_config, '{}'::jsonb);
  if v_policy = 'use_saved_preference' and v_config = '{}'::jsonb then
    v_config := jsonb_build_object(
      'preferredPackageId', null,
      'preferredSettlementRule', 'withdraw_everything',
      'preferredSettlementAccountId', p_settlement_account_id
    );
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
    provider_id, product_name, product_snapshot, renewal_policy,
    renewal_config, created_by
  )
  values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id,
    p_provider_id, p_product_name, p_product_snapshot, v_policy,
    v_config, v_user_id
  )
  returning id into v_saving_id;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status, funding_transaction_id
  )
  values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date,
    p_principal,
    coalesce(
      (p_product_snapshot->>'annualInterestRate')::numeric,
      (p_package_snapshot->>'annualInterestRate')::numeric,
      0
    ),
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
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb
) to authenticated;

-- Keep old signature callable by wrapping (optional overload via default)
grant execute on function public.create_saving_with_transfer(
  uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Helper: apply one-time renewal revert + write renewal_decision
-- ---------------------------------------------------------------------------
create or replace function public.record_saving_renewal_decision(
  p_cycle_id uuid,
  p_renewal_decision jsonb,
  p_revert_one_time boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
begin
  select * into v_cycle from public.saving_cycles where id = p_cycle_id;
  if not found then
    raise exception 'Cycle not found';
  end if;

  select * into v_saving from public.savings where id = v_cycle.saving_id;
  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  update public.saving_cycles
  set renewal_decision = p_renewal_decision
  where id = p_cycle_id
    and renewal_decision is null;

  if p_revert_one_time and v_saving.renewal_policy = 'one_time_renewal' then
    update public.savings
    set
      renewal_policy = 'always_ask',
      renewal_config = '{}'::jsonb,
      updated_at = timezone('utc', now())
    where id = v_saving.id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.record_saving_renewal_decision(uuid, jsonb, boolean) to authenticated;
