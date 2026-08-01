-- Improve rpc_dashboard_monthly_trend to handle gaps without N+1 queries
-- This eliminates the need for fallback loops in the application layer

create or replace function public.rpc_dashboard_monthly_trend(
  p_household_id uuid default null,
  p_months integer default 6
)
returns table (
  household_id uuid,
  month date,
  net_worth numeric(18,0),
  income numeric(18,0),
  expense numeric(18,0),
  savings numeric(18,0),
  savings_rate numeric(8,6),
  emergency_months numeric(8,2),
  debt_service_ratio numeric(8,6)
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_months int;
  v_today date := current_date;
begin
  -- Resolve household_id
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());
  v_months := greatest(coalesce(p_months, 6), 1);

  -- Authorization check
  if v_household_id is null then
    return;
  end if;

  if not (
    coalesce(auth.role(), '') in ('service_role', 'supabase_admin')
    or public.is_household_member(v_household_id)
  ) then
    return;
  end if;

  -- Generate month series and left join with snapshots
  -- For missing months, compute values inline using existing snapshots when available
  return query
  with month_series as (
    select
      (date_trunc('month', v_today) - interval '1 month' * (gs.idx - 1))::date as month_date
    from generate_series(1, v_months) as gs(idx)
  ),
  -- Get existing snapshots
  existing_snapshots as (
    select
      mhs.household_id,
      mhs.month,
      mhs.net_worth,
      mhs.income,
      mhs.expense,
      mhs.savings,
      mhs.savings_rate,
      mhs.emergency_months,
      mhs.debt_service_ratio
    from public.monthly_household_snapshots mhs
    where mhs.household_id = v_household_id
    order by mhs.month desc
    limit v_months
  ),
  -- Compute monthly income/expense for all months
  monthly_flows as (
    select
      date_trunc('month', t.transaction_date)::date as flow_month,
      coalesce(sum(t.amount) filter (
        where t.type = 'income'
        and not t.is_non_cash
        and t.transaction_subtype is distinct from 'savings_principal_withdrawal'
      ), 0) as income,
      coalesce(sum(t.amount) filter (
        where t.type = 'expense'
        and not t.is_non_cash
        and t.transaction_subtype is distinct from 'savings_principal_deposit'
      ), 0) as expense
    from public.transactions t
    where t.household_id = v_household_id
    group by date_trunc('month', t.transaction_date)::date
  )
  select
    v_household_id as household_id,
    ms.month_date as month,
    -- Use existing snapshot if available, otherwise compute via rpc_dashboard_core
    coalesce(
      es.net_worth,
      (select core.net_worth from public.rpc_dashboard_core(v_household_id, ms.month_date) as core limit 1)
    ) as net_worth,
    coalesce(
      es.income,
      mf.income::numeric(18,0)
    ) as income,
    coalesce(
      es.expense,
      mf.expense::numeric(18,0)
    ) as expense,
    coalesce(
      es.savings,
      (coalesce(mf.income, 0) - coalesce(mf.expense, 0))::numeric(18,0)
    ) as savings,
    coalesce(
      es.savings_rate,
      case
        when coalesce(mf.income, 0) > 0
        then ((coalesce(mf.income, 0) - coalesce(mf.expense, 0))::numeric / mf.income::numeric)
        else null
      end
    ) as savings_rate,
    es.emergency_months,
    es.debt_service_ratio
  from month_series ms
  left join existing_snapshots es on es.month = ms.month_date
  left join monthly_flows mf on mf.flow_month = ms.month_date
  order by ms.month_date desc;
end;
$$;

grant execute on function public.rpc_dashboard_monthly_trend(uuid, integer) to authenticated, anon;
