-- ============================================================================
-- 00006_dashboard_aggregates.sql
-- Dashboard aggregate functions/views for RPC access.
-- ============================================================================

create or replace function public.rpc_dashboard_core(
  p_household_id uuid default null,
  p_as_of_date date default current_date
)
returns table (
  household_id uuid,
  as_of_date date,
  month_start date,
  month_end date,
  total_assets numeric(18,0),
  total_liabilities numeric(18,0),
  net_worth numeric(18,0),
  monthly_income numeric(18,0),
  monthly_expense numeric(18,0),
  monthly_savings numeric(18,0),
  savings_rate numeric(10,6),
  emergency_months numeric(10,2),
  debt_service_ratio numeric(10,6)
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_month_start date;
  v_month_end date;
  v_account_assets numeric(18,0) := 0;
  v_non_account_assets numeric(18,0) := 0;
  v_total_assets numeric(18,0) := 0;
  v_total_liabilities numeric(18,0) := 0;
  v_monthly_income numeric(18,0) := 0;
  v_monthly_expense numeric(18,0) := 0;
  v_monthly_savings numeric(18,0) := 0;
  v_savings_rate numeric(10,6);
  v_liquid_assets numeric(18,0) := 0;
  v_avg_essential_expense numeric(18,2);
  v_emergency_months numeric(10,2);
  v_debt_service numeric(18,0) := 0;
  v_debt_service_ratio numeric(10,6);
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.is_household_member(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end := (v_month_start + interval '1 month - 1 day')::date;

  select coalesce(sum(
    case
      when a.type = 'income' then a.amount
      when a.type = 'expense' then -a.amount
      else 0
    end
  ), 0)::numeric(18,0)
  into v_account_assets
  from (
    select ac.id,
      ac.opening_balance as amount,
      'income'::text as type,
      ac.opening_balance_date as transaction_date
    from public.accounts ac
    where ac.household_id = v_household_id
      and ac.include_in_net_worth = true
      and ac.is_archived = false

    union all

    select t.account_id,
      t.amount,
      t.type,
      t.transaction_date
    from public.transactions t
    join public.accounts ac on ac.id = t.account_id
    where t.household_id = v_household_id
      and ac.include_in_net_worth = true
      and ac.is_archived = false
      and t.transaction_date <= p_as_of_date
  ) a;

  with latest_q as (
    select distinct on (aqh.asset_id)
      aqh.asset_id,
      aqh.quantity
    from public.asset_quantity_history aqh
    where aqh.household_id = v_household_id
      and aqh.as_of_date <= p_as_of_date
    order by aqh.asset_id, aqh.as_of_date desc
  ),
  latest_p as (
    select distinct on (aph.asset_id)
      aph.asset_id,
      aph.unit_price
    from public.asset_price_history aph
    where aph.household_id = v_household_id
      and aph.as_of_date <= p_as_of_date
    order by aph.asset_id, aph.as_of_date desc
  )
  select coalesce(sum(
    case
      when a.include_in_net_worth = false then 0
      else coalesce(lq.quantity, a.quantity) * coalesce(lp.unit_price, 0)
    end
  ), 0)::numeric(18,0)
  into v_non_account_assets
  from public.assets a
  left join latest_q lq on lq.asset_id = a.id
  left join latest_p lp on lp.asset_id = a.id
  where a.household_id = v_household_id
    and a.is_archived = false;

  v_total_assets := coalesce(v_account_assets, 0) + coalesce(v_non_account_assets, 0);

  select coalesce(sum(l.current_principal_outstanding), 0)::numeric(18,0)
  into v_total_liabilities
  from public.liabilities l
  where l.household_id = v_household_id
    and l.include_in_net_worth = true
    and l.is_active = true;

  select coalesce(sum(t.amount), 0)::numeric(18,0)
  into v_monthly_income
  from public.transactions t
  where t.household_id = v_household_id
    and t.type = 'income'
    and t.transaction_date between v_month_start and v_month_end;

  select coalesce(sum(t.amount), 0)::numeric(18,0)
  into v_monthly_expense
  from public.transactions t
  where t.household_id = v_household_id
    and t.type = 'expense'
    and t.transaction_date between v_month_start and v_month_end;

  v_monthly_savings := v_monthly_income - v_monthly_expense;

  if v_monthly_income > 0 then
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  else
    v_savings_rate := null;
  end if;

  with account_balances as (
    select
      ac.id,
      ac.opening_balance
      + coalesce(sum(
          case
            when t.type = 'income' then t.amount
            when t.type = 'expense' then -t.amount
            else 0
          end
        ), 0) as balance
    from public.accounts ac
    left join public.transactions t
      on t.account_id = ac.id
      and t.transaction_date <= p_as_of_date
      and t.household_id = v_household_id
    where ac.household_id = v_household_id
      and ac.is_archived = false
    group by ac.id, ac.opening_balance
  ),
  liquid_assets as (
    select coalesce(sum(greatest(ab.balance, 0)), 0)::numeric(18,0) as liquid_value
    from account_balances ab

    union all

    select coalesce(sum(
      case
        when a.is_liquid = true and a.is_archived = false
          then coalesce(lq.quantity, a.quantity) * coalesce(lp.unit_price, 0)
        else 0
      end
    ), 0)::numeric(18,0)
    from public.assets a
    left join lateral (
      select aqh.quantity
      from public.asset_quantity_history aqh
      where aqh.asset_id = a.id
        and aqh.household_id = v_household_id
        and aqh.as_of_date <= p_as_of_date
      order by aqh.as_of_date desc
      limit 1
    ) lq on true
    left join lateral (
      select aph.unit_price
      from public.asset_price_history aph
      where aph.asset_id = a.id
        and aph.household_id = v_household_id
        and aph.as_of_date <= p_as_of_date
      order by aph.as_of_date desc
      limit 1
    ) lp on true
    where a.household_id = v_household_id
  )
  select coalesce(sum(liquid_value), 0)::numeric(18,0)
  into v_liquid_assets
  from liquid_assets;

  with essential_by_month as (
    select
      date_trunc('month', t.transaction_date)::date as month_bucket,
      sum(t.amount)::numeric(18,2) as essential_expense
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.household_id = v_household_id
      and t.type = 'expense'
      and c.is_essential = true
      and t.transaction_date >= (v_month_start - interval '2 months')
      and t.transaction_date <= v_month_end
    group by 1
  )
  select avg(essential_expense)
  into v_avg_essential_expense
  from essential_by_month;

  if coalesce(v_avg_essential_expense, 0) > 0 then
    v_emergency_months := round((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  else
    v_emergency_months := null;
  end if;

  select coalesce(sum(lp.actual_amount), 0)::numeric(18,0)
  into v_debt_service
  from public.liability_payments lp
  where lp.household_id = v_household_id
    and lp.payment_date between v_month_start and v_month_end;

  if v_monthly_income > 0 then
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  else
    v_debt_service_ratio := null;
  end if;

  return query
  select
    v_household_id,
    p_as_of_date,
    v_month_start,
    v_month_end,
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities)::numeric(18,0),
    v_monthly_income,
    v_monthly_expense,
    v_monthly_savings,
    v_savings_rate,
    v_emergency_months,
    v_debt_service_ratio;
end;
$$;

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
language sql
stable
security definer
set search_path = public
as $$
  with ctx as (
    select coalesce(p_household_id, public.get_primary_household_id()) as household_id
  ), authz as (
    select
      c.household_id
    from ctx c
    where c.household_id is not null
      and (
        coalesce(auth.role(), '') in ('service_role', 'supabase_admin')
        or public.is_household_member(c.household_id)
      )
  )
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
  join authz a on a.household_id = mhs.household_id
  order by mhs.month desc
  limit greatest(coalesce(p_months, 6), 1);
$$;

create or replace view public.v_dashboard_latest_monthly_snapshot
with (security_invoker = true)
as
select distinct on (mhs.household_id)
  mhs.household_id,
  mhs.month,
  mhs.total_assets,
  mhs.total_liabilities,
  mhs.net_worth,
  mhs.income,
  mhs.expense,
  mhs.savings,
  mhs.savings_rate,
  mhs.emergency_months,
  mhs.debt_service_ratio
from public.monthly_household_snapshots mhs
order by mhs.household_id, mhs.month desc;

grant execute on function public.rpc_dashboard_core(uuid, date) to authenticated, anon;
grant execute on function public.rpc_dashboard_monthly_trend(uuid, integer) to authenticated, anon;
