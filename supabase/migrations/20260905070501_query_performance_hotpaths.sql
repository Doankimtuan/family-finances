create index if not exists idx_transactions_household_date_created
  on public.transactions (household_id, transaction_date asc, created_at asc);

create or replace function public.get_investment_home_summary_inputs()
 returns table(holding_id uuid, asset_class text, instrument_id uuid, quantity numeric, remaining_total_cost_basis numeric, value_vnd numeric, valuation_date date, valuation_created_at timestamp with time zone, unit_price_vnd numeric, valuation_source text, realized_pnl numeric, investment_income numeric)
 language sql
 set search_path to 'public'
as $function$
  with household_operations as (
    select
      o.household_id,
      sum(o.realized_result_vnd) as realized_pnl,
      sum(case when o.income_kind is not null then o.executed_value_vnd else 0 end)
        as investment_income
    from public.investment_operations o
    where o.household_id = public.investment_active_household()
    group by o.household_id
  )
  select
    h.id,
    h.asset_class,
    h.instrument_id,
    h.quantity,
    h.remaining_total_cost_basis,
    latest.value_vnd,
    latest.valuation_date,
    latest.created_at,
    latest.unit_price_vnd,
    latest.source,
    coalesce(operations.realized_pnl, 0),
    coalesce(operations.investment_income, 0)
  from public.investment_holdings h
  left join lateral (
    select v.value_vnd, v.valuation_date, v.created_at, v.unit_price_vnd, v.source
    from public.investment_valuations v
    where v.household_id = h.household_id
      and v.holding_id = h.id
    order by v.valuation_date desc, v.created_at desc
    limit 1
  ) latest on true
  left join household_operations operations
    on operations.household_id = h.household_id
  where h.household_id = public.investment_active_household()
    and h.lifecycle_status <> 'exited'
    and h.quantity > 0;
$function$;

create or replace function public.enqueue_savings_maturity_cascade(p_household_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_cycle record;
  v_days_left int;
  v_cascade_day int;
  v_currency text;
  v_count int := 0;
  v_today date := timezone('utc', now())::date;
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
      sp.display_name as provider_name
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    left join public.saving_providers sp on sp.id = s.provider_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date in (
        v_today + 30,
        v_today + 14,
        v_today + 7,
        v_today + 3,
        v_today + 1
      )
  loop
    v_days_left := v_cycle.end_date - v_today;
    v_cascade_day := v_days_left;

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
        'providerName', coalesce(v_cycle.provider_name, ''),
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
$function$;
