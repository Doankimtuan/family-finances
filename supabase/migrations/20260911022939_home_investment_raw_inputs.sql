-- One-wave Home Investment read model.
-- SECURITY INVOKER preserves table RLS; this function returns raw inputs only.
create or replace function public.get_home_investment_raw_inputs()
returns table(
  holding_id uuid,
  asset_class text,
  instrument_id uuid,
  quantity numeric,
  remaining_total_cost_basis numeric,
  instrument_asset_class text,
  instrument_symbol text,
  instrument_name text,
  instrument_exchange text,
  instrument_currency text,
  instrument_pricing_mode text,
  instrument_auto_price_supported boolean,
  instrument_is_active boolean,
  instrument_metadata jsonb,
  price numeric,
  price_currency text,
  price_type text,
  price_date date,
  price_fetched_at timestamp with time zone,
  price_provider text,
  price_metadata jsonb,
  price_updated_at timestamp with time zone,
  fx_base_currency text,
  fx_quote_currency text,
  fx_rate numeric,
  fx_rate_date date,
  fx_fetched_at timestamp with time zone,
  fx_provider text,
  fx_updated_at timestamp with time zone,
  manual_value_vnd numeric,
  manual_valuation_date date,
  manual_created_at timestamp with time zone,
  manual_quantity numeric,
  manual_unit_price_vnd numeric,
  manual_source text,
  manual_input_currency text,
  manual_input_unit_price numeric,
  manual_input_total_value numeric,
  manual_input_rate_to_vnd numeric,
  manual_input_rate_date date,
  manual_input_rate_source text,
  realized_pnl numeric,
  investment_income numeric
)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with active_holdings as (
    select
      h.id,
      h.household_id,
      h.asset_class,
      h.instrument_id,
      h.quantity,
      h.remaining_total_cost_basis,
      h.created_at
    from public.investment_holdings h
    where h.household_id = public.investment_active_household()
      and h.lifecycle_status <> 'exited'
      and h.quantity > 0
  ),
  household_operations as (
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
    i.asset_class,
    i.symbol,
    i.name,
    i.exchange,
    i.currency,
    i.pricing_mode,
    i.auto_price_supported,
    i.is_active,
    i.metadata,
    p.price,
    p.currency,
    p.price_type,
    p.price_date,
    p.fetched_at,
    p.provider,
    p.metadata,
    p.updated_at,
    fx.base_currency,
    fx.quote_currency,
    fx.rate,
    fx.rate_date,
    fx.fetched_at,
    fx.provider,
    fx.updated_at,
    latest.value_vnd,
    latest.valuation_date,
    latest.created_at,
    latest.quantity,
    latest.unit_price_vnd,
    latest.source,
    latest.input_currency,
    latest.input_unit_price,
    latest.input_total_value,
    latest.input_rate_to_vnd,
    latest.input_rate_date,
    latest.input_rate_source,
    coalesce(operations.realized_pnl, 0),
    coalesce(operations.investment_income, 0)
  from active_holdings h
  left join public.market_instruments i
    on i.id = h.instrument_id
  left join public.market_instrument_prices p
    on p.instrument_id = h.instrument_id
  left join public.market_currency_rates fx
    on fx.base_currency = p.currency
   and fx.quote_currency = 'VND'
  left join lateral (
    select
      v.value_vnd,
      v.valuation_date,
      v.created_at,
      v.quantity,
      v.unit_price_vnd,
      v.source,
      v.input_currency,
      v.input_unit_price,
      v.input_total_value,
      v.input_rate_to_vnd,
      v.input_rate_date,
      v.input_rate_source
    from public.investment_valuations v
    where v.household_id = h.household_id
      and v.holding_id = h.id
    order by v.valuation_date desc, v.created_at desc
    limit 1
  ) latest on true
  left join household_operations operations
    on operations.household_id = h.household_id
  order by h.created_at asc;
$function$;

revoke all on function public.get_home_investment_raw_inputs() from public;
grant execute on function public.get_home_investment_raw_inputs() to authenticated;
