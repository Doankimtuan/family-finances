-- ============================================================================
-- 00029_cashflow_forecast_rpc.sql
-- Deterministic 90-day cash flow forecast.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_cashflow_forecast_90d(
  p_household_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT current_date,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  forecast_date DATE,
  opening_balance NUMERIC(18,0),
  inflow NUMERIC(18,0),
  outflow NUMERIC(18,0),
  closing_balance NUMERIC(18,0),
  risk_flag TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_days INTEGER;
  v_opening_balance NUMERIC(18,0) := 0;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_start_date := COALESCE(p_start_date, current_date);
  v_days := LEAST(GREATEST(COALESCE(p_days, 90), 1), 365);
  v_end_date := (v_start_date + (v_days - 1) * INTERVAL '1 day')::DATE;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  -- Opening balance as of day before forecast start.
  WITH account_balances AS (
    SELECT
      ac.id,
      (
        ac.opening_balance
        + COALESCE(SUM(
          CASE
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = ac.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.counterparty_account_id = ac.id THEN t.amount
            ELSE 0
          END
        ), 0)
      )::NUMERIC(18,0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.transaction_date < v_start_date
      AND (t.account_id = ac.id OR t.counterparty_account_id = ac.id)
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
      AND ac.type IN ('cash', 'checking', 'savings', 'ewallet', 'brokerage')
    GROUP BY ac.id, ac.opening_balance
  )
  SELECT COALESCE(SUM(balance), 0)::NUMERIC(18,0)
  INTO v_opening_balance
  FROM account_balances;

  RETURN QUERY
  WITH RECURSIVE
  calendar AS (
    SELECT gs::DATE AS forecast_date
    FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day') gs
  ),
  recurring_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'income'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS inflow,
      COALESCE(SUM(
        CASE WHEN (rr.template_json->>'type') = 'expense'
          THEN COALESCE(NULLIF(rr.template_json->>'amount', '')::NUMERIC, 0)
          ELSE 0
        END
      ), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN public.recurring_rules rr
      ON rr.household_id = v_household_id
      AND rr.is_active = true
      AND c.forecast_date >= rr.start_date
      AND (rr.end_date IS NULL OR c.forecast_date <= rr.end_date)
      AND (
        (
          rr.frequency = 'monthly'
          AND rr.day_of_month IS NOT NULL
          AND EXTRACT(DAY FROM c.forecast_date)::INT = rr.day_of_month
          AND (
            (
              (EXTRACT(YEAR FROM c.forecast_date)::INT * 12 + EXTRACT(MONTH FROM c.forecast_date)::INT)
              -
              (EXTRACT(YEAR FROM rr.start_date)::INT * 12 + EXTRACT(MONTH FROM rr.start_date)::INT)
            ) % GREATEST(rr.interval, 1)
          ) = 0
        )
        OR
        (
          rr.frequency = 'weekly'
          AND rr.day_of_week IS NOT NULL
          AND EXTRACT(DOW FROM c.forecast_date)::INT = rr.day_of_week
          AND (
            FLOOR((c.forecast_date - rr.start_date) / 7)::INT % GREATEST(rr.interval, 1)
          ) = 0
        )
      )
    GROUP BY c.forecast_date
  ),
  liability_base AS (
    SELECT
      l.id,
      LEAST(
        GREATEST(
          COALESCE(
            l.due_day,
            EXTRACT(DAY FROM l.next_payment_date)::INT,
            1
          ),
          1
        ),
        28
      ) AS due_day,
      GREATEST(
        COALESCE(
          ROUND(AVG(COALESCE(lp.scheduled_amount, lp.actual_amount))),
          CASE
            WHEN COALESCE(l.term_months, 0) > 0
              THEN ROUND(l.current_principal_outstanding / l.term_months)
            ELSE NULL
          END,
          0
        ),
        0
      )::NUMERIC(18,0) AS due_amount,
      l.next_payment_date
    FROM public.liabilities l
    LEFT JOIN public.liability_payments lp
      ON lp.liability_id = l.id
      AND lp.household_id = l.household_id
      AND lp.payment_date >= (v_start_date - INTERVAL '6 months')
      AND lp.payment_date < v_start_date
    WHERE l.household_id = v_household_id
      AND l.is_active = true
      AND l.current_principal_outstanding > 0
    GROUP BY l.id, l.due_day, l.next_payment_date, l.current_principal_outstanding, l.term_months
  ),
  liability_daily AS (
    SELECT
      c.forecast_date,
      COALESCE(SUM(lb.due_amount), 0)::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN liability_base lb
      ON EXTRACT(DAY FROM c.forecast_date)::INT = lb.due_day
      AND (lb.next_payment_date IS NULL OR c.forecast_date >= lb.next_payment_date)
    GROUP BY c.forecast_date
  ),
  card_due_daily AS (
    SELECT
      cbm.due_date AS forecast_date,
      COALESCE(SUM(GREATEST(cbm.statement_amount - cbm.paid_amount, 0)), 0)::NUMERIC(18,0) AS outflow
    FROM public.card_billing_months cbm
    WHERE cbm.household_id = v_household_id
      AND cbm.due_date IS NOT NULL
      AND cbm.due_date BETWEEN v_start_date AND v_end_date
      AND cbm.status <> 'settled'
    GROUP BY cbm.due_date
  ),
  daily_flows AS (
    SELECT
      c.forecast_date,
      COALESCE(rd.inflow, 0)::NUMERIC(18,0) AS inflow,
      (
        COALESCE(rd.outflow, 0)
        + COALESCE(ld.outflow, 0)
        + COALESCE(cd.outflow, 0)
      )::NUMERIC(18,0) AS outflow
    FROM calendar c
    LEFT JOIN recurring_daily rd ON rd.forecast_date = c.forecast_date
    LEFT JOIN liability_daily ld ON ld.forecast_date = c.forecast_date
    LEFT JOIN card_due_daily cd ON cd.forecast_date = c.forecast_date
  ),
  running AS (
    SELECT
      d.forecast_date,
      v_opening_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (v_opening_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM daily_flows d
    WHERE d.forecast_date = v_start_date

    UNION ALL

    SELECT
      d.forecast_date,
      r.closing_balance::NUMERIC(18,0) AS opening_balance,
      d.inflow,
      d.outflow,
      (r.closing_balance + d.inflow - d.outflow)::NUMERIC(18,0) AS closing_balance
    FROM running r
    JOIN daily_flows d ON d.forecast_date = (r.forecast_date + INTERVAL '1 day')::DATE
  )
  SELECT
    r.forecast_date,
    r.opening_balance,
    r.inflow,
    r.outflow,
    r.closing_balance,
    CASE
      WHEN r.closing_balance < 0 THEN 'negative_balance'
      ELSE NULL
    END::TEXT AS risk_flag
  FROM running r
  ORDER BY r.forecast_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER) TO authenticated, anon;
