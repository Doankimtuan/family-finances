-- One-wave Plan jar-budget raw inputs.
-- Financial formulas, rollover, and snapshot fallback stay in TypeScript.
create or replace function public.get_plan_jar_budget_raw_inputs(p_now timestamptz default now())
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with scoped_household as (
    select public.investment_active_household() as household_id
  ),
  settings as (
    select
      h.id as household_id,
      coalesce(h.timezone, 'Asia/Ho_Chi_Minh') as timezone,
      h.base_currency,
      h.month_close_mode,
      h.income_allocate_mode,
      h.qualifying_monthly_income
    from public.households h
    join scoped_household scoped on scoped.household_id = h.id
  ),
  periods as (
    select
      settings.*,
      date_trunc('month', p_now at time zone settings.timezone)::date
        as current_period_month
    from settings
  ),
  period_bounds as (
    select
      periods.*,
      (periods.current_period_month - interval '1 month')::date
        as previous_period_month
    from periods
  ),
  jar_rows as (
    select
      j.id,
      j.name,
      j.kind,
      j.sort_order,
      j.is_archived,
      j.is_paused,
      j.rollover_mode,
      jp.plan_kind,
      jp.percent_bps,
      jp.fixed_amount
    from public.jars j
    left join lateral (
      select
        p.plan_kind,
        p.percent_bps,
        p.fixed_amount
      from public.jar_plans p
      where p.jar_id = j.id
        and p.household_id = j.household_id
      order by p.created_at desc, p.id desc
      limit 1
    ) jp on true
    join period_bounds periods on periods.household_id = j.household_id
  ),
  period_transactions as (
    select
      case
        when t.transaction_date >= periods.current_period_month
         and t.transaction_date < periods.current_period_month + interval '1 month'
          then 'current'
        else 'previous'
      end as period_kind,
      t.transaction_date,
      t.created_at,
      jsonb_build_object(
        'id', t.id,
        'type', t.type,
        'amount', t.amount,
        'status', t.status,
        'jar_id', t.jar_id,
        'savings_event_kind', t.savings_event_kind,
        'reverses_transaction_id', t.reverses_transaction_id,
        'corrects_transaction_id', t.corrects_transaction_id,
        'is_reversal', t.is_reversal
      ) as row_data
    from public.transactions t
    join public.accounts a
      on a.id = t.account_id
     and a.household_id = t.household_id
     and a.financial_scope = 'household'
    join period_bounds periods on periods.household_id = t.household_id
    where t.household_id = periods.household_id
      and (
        (
          t.transaction_date >= periods.current_period_month
          and t.transaction_date < periods.current_period_month + interval '1 month'
        )
        or (
          t.transaction_date >= periods.previous_period_month
          and t.transaction_date < periods.current_period_month
        )
      )
  ),
  period_loan_payments as (
    select
      case
        when lp.paid_at >= periods.current_period_month
         and lp.paid_at < periods.current_period_month + interval '1 month'
          then 'current'
        else 'previous'
      end as period_kind,
      lp.transaction_id
    from public.loan_payments lp
    join period_bounds periods on periods.household_id = lp.household_id
    where lp.household_id = periods.household_id
      and (
        (
          lp.paid_at >= periods.current_period_month
          and lp.paid_at < periods.current_period_month + interval '1 month'
        )
        or (
          lp.paid_at >= periods.previous_period_month
          and lp.paid_at < periods.current_period_month
        )
      )
  ),
  recurring_income as (
    select
      r.id,
      r.name,
      r.direction,
      r.amount,
      r.frequency,
      r.interval_count,
      r.day_of_month,
      r.day_of_week,
      r.start_date,
      r.next_run_date,
      r.is_active
    from public.recurring_rules r
    join period_bounds periods on periods.household_id = r.household_id
    where r.household_id = periods.household_id
      and r.direction = 'income'
      and r.is_active = true
  ),
  snapshots as (
    select
      s.id,
      s.household_id,
      s.jar_id,
      s.period_month,
      s.jar_name,
      s.plan_kind,
      s.percent_bps,
      s.fixed_amount,
      s.rollover_mode,
      s.qualifying_income,
      s.qualifying_income_source,
      s.rule_budget,
      s.rollover_credit
    from public.jar_period_rule_snapshots s
    join period_bounds periods on periods.household_id = s.household_id
    where s.household_id = periods.household_id
      and s.period_month in (
        periods.current_period_month,
        periods.previous_period_month
      )
      and exists (
        select 1
        from jar_rows jars
        where jars.id = s.jar_id
          and jars.is_archived = false
          and jars.is_paused = false
      )
  ),
  adjustments as (
    select
      a.jar_id,
      a.period_month,
      a.amount
    from public.jar_period_adjustments a
    join period_bounds periods on periods.household_id = a.household_id
    where a.household_id = periods.household_id
      and a.period_month in (
        periods.current_period_month,
        periods.previous_period_month
      )
      and exists (
        select 1
        from jar_rows jars
        where jars.id = a.jar_id
          and jars.is_archived = false
          and jars.is_paused = false
      )
  )
  select jsonb_build_object(
    'household_id', periods.household_id,
    'timezone', periods.timezone,
    'base_currency', periods.base_currency,
    'month_close_mode', periods.month_close_mode,
    'income_allocate_mode', periods.income_allocate_mode,
    'qualifying_monthly_income', periods.qualifying_monthly_income,
    'current_period_month', periods.current_period_month,
    'previous_period_month', periods.previous_period_month,
    'jars', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', jars.id,
          'name', jars.name,
          'kind', jars.kind,
          'sort_order', jars.sort_order,
          'is_archived', jars.is_archived,
          'is_paused', jars.is_paused,
          'rollover_mode', jars.rollover_mode,
          'jar_plans', case
            when jars.plan_kind is null then null
            else jsonb_build_object(
              'plan_kind', jars.plan_kind,
              'percent_bps', jars.percent_bps,
              'fixed_amount', jars.fixed_amount
            )
          end
        )
        order by jars.sort_order asc, jars.id asc
      )
      from jar_rows jars
    ), '[]'::jsonb),
    'current_transactions', coalesce((
      select jsonb_agg(
        transactions.row_data
        order by transactions.transaction_date asc, transactions.created_at asc
      ) filter (where transactions.period_kind = 'current')
      from period_transactions transactions
    ), '[]'::jsonb),
    'previous_transactions', coalesce((
      select jsonb_agg(
        transactions.row_data
        order by transactions.transaction_date asc, transactions.created_at asc
      ) filter (where transactions.period_kind = 'previous')
      from period_transactions transactions
    ), '[]'::jsonb),
    'current_loan_payment_ids', coalesce((
      select jsonb_agg(payments.transaction_id order by payments.transaction_id)
      from period_loan_payments payments
      where payments.period_kind = 'current'
    ), '[]'::jsonb),
    'previous_loan_payment_ids', coalesce((
      select jsonb_agg(payments.transaction_id order by payments.transaction_id)
      from period_loan_payments payments
      where payments.period_kind = 'previous'
    ), '[]'::jsonb),
    'recurring_income', coalesce((
      select jsonb_agg(to_jsonb(income) order by income.id)
      from recurring_income income
    ), '[]'::jsonb),
    'snapshots', coalesce((
      select jsonb_agg(to_jsonb(snapshot) order by snapshot.jar_id, snapshot.period_month)
      from snapshots snapshot
    ), '[]'::jsonb),
    'adjustments', coalesce((
      select jsonb_agg(to_jsonb(adjustment) order by adjustment.jar_id, adjustment.period_month)
      from adjustments adjustment
    ), '[]'::jsonb)
  )
  from period_bounds periods;
$function$;

revoke all on function public.get_plan_jar_budget_raw_inputs(timestamptz) from public;
grant execute on function public.get_plan_jar_budget_raw_inputs(timestamptz) to authenticated;
