-- HOME 14C.1: latest valuation and operation aggregates for the Home read model.
create or replace function public.get_investment_home_summary_inputs()
returns table (
  holding_id uuid,
  asset_class text,
  instrument_id uuid,
  quantity numeric,
  remaining_total_cost_basis numeric,
  value_vnd numeric,
  valuation_date date,
  valuation_created_at timestamptz,
  unit_price_vnd numeric,
  valuation_source text,
  realized_pnl numeric,
  investment_income numeric
)
language sql
security invoker
set search_path = public
as $$
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
  left join lateral (
    select
      sum(o.realized_result_vnd) as realized_pnl,
      sum(case when o.income_kind is not null then o.executed_value_vnd else 0 end)
        as investment_income
    from public.investment_operations o
    where o.household_id = h.household_id
  ) operations on true
  where h.household_id = public.investment_active_household()
    and h.lifecycle_status <> 'exited'
    and h.quantity > 0;
$$;

grant execute on function public.get_investment_home_summary_inputs() to authenticated;
grant execute on function public.investment_active_household() to authenticated;
