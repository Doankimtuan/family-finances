-- ============================================================================
-- 00031_tdsr_metric.sql
-- Add total debt service ratio (TDSR) to rpc_dashboard_core.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_dashboard_core(uuid, date);

CREATE OR REPLACE FUNCTION public.rpc_dashboard_core(
  p_household_id uuid DEFAULT NULL,
  p_as_of_date   date DEFAULT current_date
)
RETURNS TABLE (
  household_id        uuid,
  as_of_date          date,
  month_start         date,
  month_end           date,
  total_assets        numeric(18,0),
  total_liabilities   numeric(18,0),
  net_worth           numeric(18,0),
  monthly_income      numeric(18,0),
  monthly_expense     numeric(18,0),
  monthly_savings     numeric(18,0),
  savings_rate        numeric(10,6),
  savings_rate_6mo_avg numeric(10,6),
  savings_rate_mom_delta numeric(10,6),
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6),
  tdsr_percent        numeric(10,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id           uuid;
  v_month_start            date;
  v_month_end              date;
  v_account_assets         numeric(18,0) := 0;
  v_non_account_assets     numeric(18,0) := 0;
  v_total_assets           numeric(18,0) := 0;
  v_total_liabilities      numeric(18,0) := 0;
  v_monthly_income         numeric(18,0) := 0;
  v_monthly_expense        numeric(18,0) := 0;
  v_cc_expense             numeric(18,0) := 0;
  v_non_cc_expense         numeric(18,0) := 0;
  v_monthly_savings        numeric(18,0) := 0;
  v_savings_rate           numeric(10,6);
  v_savings_rate_6mo_avg   numeric(10,6);
  v_prev_month_savings_rate numeric(10,6);
  v_savings_rate_mom_delta numeric(10,6);
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
  v_card_installment_due   numeric(18,0) := 0;
  v_card_min_due           numeric(18,0) := 0;
  v_tdsr_percent           numeric(10,2);
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  v_month_start := date_trunc('month', p_as_of_date)::date;
  v_month_end   := (v_month_start + interval '1 month - 1 day')::date;

  -- Net worth via accounts
  SELECT COALESCE(SUM(
    CASE
      WHEN a.type = 'income' THEN a.amount
      WHEN a.type = 'expense' THEN -a.amount
      ELSE 0
    END
  ), 0)::numeric(18,0)
  INTO v_account_assets
  FROM (
    SELECT ac.id,
           ac.opening_balance AS amount,
           'income'::text     AS type,
           ac.opening_balance_date AS transaction_date
    FROM public.accounts ac
    WHERE ac.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false

    UNION ALL

    SELECT t.account_id, t.amount, t.type, t.transaction_date
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND ac.include_in_net_worth = true
      AND ac.is_archived = false
      AND t.transaction_date <= p_as_of_date
  ) a;

  -- Non-account (physical) assets
  WITH latest_q AS (
    SELECT DISTINCT ON (aqh.asset_id)
      aqh.asset_id, aqh.quantity
    FROM public.asset_quantity_history aqh
    WHERE aqh.household_id = v_household_id
      AND aqh.as_of_date <= p_as_of_date
    ORDER BY aqh.asset_id, aqh.as_of_date DESC
  ),
  latest_p AS (
    SELECT DISTINCT ON (aph.asset_id)
      aph.asset_id, aph.unit_price
    FROM public.asset_price_history aph
    WHERE aph.household_id = v_household_id
      AND aph.as_of_date <= p_as_of_date
    ORDER BY aph.asset_id, aph.as_of_date DESC
  )
  SELECT COALESCE(SUM(
    CASE WHEN a.include_in_net_worth = false THEN 0
         ELSE COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
    END
  ), 0)::numeric(18,0)
  INTO v_non_account_assets
  FROM public.assets a
  LEFT JOIN latest_q lq ON lq.asset_id = a.id
  LEFT JOIN latest_p lp ON lp.asset_id = a.id
  WHERE a.household_id = v_household_id
    AND a.is_archived = false;

  v_total_assets := COALESCE(v_account_assets, 0) + COALESCE(v_non_account_assets, 0);

  -- Liabilities
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- Monthly income
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: non-credit-card accounts
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- Monthly expense: credit card accounts via billing items
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- Savings rate trend fields (current + prior 5 months and MoM delta)
  WITH month_offsets AS (
    SELECT generate_series(0, 5) AS month_offset
  ),
  month_windows AS (
    SELECT
      mo.month_offset,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval)::date AS month_start,
      (date_trunc('month', v_month_start) - (mo.month_offset || ' months')::interval + interval '1 month - 1 day')::date AS month_end
    FROM month_offsets mo
  ),
  income_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_income
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'income'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    GROUP BY mw.month_offset
  ),
  non_cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(t.amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.transactions t
      ON t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.transaction_date BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.accounts ac ON ac.id = t.account_id
    WHERE ac.id IS NULL OR ac.type <> 'credit_card'
    GROUP BY mw.month_offset
  ),
  cc_expense_by_month AS (
    SELECT
      mw.month_offset,
      COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,2) AS monthly_expense
    FROM month_windows mw
    LEFT JOIN public.card_billing_months cbm
      ON cbm.household_id = v_household_id
      AND cbm.billing_month BETWEEN mw.month_start AND mw.month_end
    LEFT JOIN public.card_billing_items cbi
      ON cbi.billing_month_id = cbm.id
      AND cbi.household_id = v_household_id
      AND cbi.is_converted_to_installment = false
    GROUP BY mw.month_offset
  ),
  monthly_rates AS (
    SELECT
      mw.month_offset,
      CASE
        WHEN COALESCE(ibm.monthly_income, 0) > 0 THEN
          (
            COALESCE(ibm.monthly_income, 0)
            - COALESCE(nem.monthly_expense, 0)
            - COALESCE(cem.monthly_expense, 0)
          ) / ibm.monthly_income
        ELSE NULL
      END::numeric(10,6) AS savings_rate
    FROM month_windows mw
    LEFT JOIN income_by_month ibm ON ibm.month_offset = mw.month_offset
    LEFT JOIN non_cc_expense_by_month nem ON nem.month_offset = mw.month_offset
    LEFT JOIN cc_expense_by_month cem ON cem.month_offset = mw.month_offset
  )
  SELECT
    ROUND(AVG(mr.savings_rate)::numeric, 6)::numeric(10,6),
    MAX(CASE WHEN mr.month_offset = 1 THEN mr.savings_rate END)::numeric(10,6)
  INTO v_savings_rate_6mo_avg, v_prev_month_savings_rate
  FROM monthly_rates mr;

  IF v_savings_rate IS NOT NULL AND v_prev_month_savings_rate IS NOT NULL THEN
    v_savings_rate_mom_delta := (v_savings_rate - v_prev_month_savings_rate)::numeric(10,6);
  ELSE
    v_savings_rate_mom_delta := NULL;
  END IF;

  -- Liquid assets
  WITH account_balances AS (
    SELECT
      ac.id,
      ac.opening_balance
      + COALESCE(SUM(
          CASE
            WHEN t.type = 'income'  THEN  t.amount
            WHEN t.type = 'expense' THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
    FROM public.accounts ac
    LEFT JOIN public.transactions t
      ON  t.account_id = ac.id
      AND t.transaction_date <= p_as_of_date
      AND t.household_id = v_household_id
    WHERE ac.household_id = v_household_id
      AND ac.is_archived = false
    GROUP BY ac.id, ac.opening_balance
  ),
  liquid_assets AS (
    SELECT COALESCE(SUM(GREATEST(ab.balance, 0)), 0)::numeric(18,0) AS liquid_value
    FROM account_balances ab

    UNION ALL

    SELECT COALESCE(SUM(
      CASE
        WHEN a.is_liquid = true AND a.is_archived = false
          THEN COALESCE(lq.quantity, a.quantity) * COALESCE(lp.unit_price, 0)
        ELSE 0
      END
    ), 0)::numeric(18,0)
    FROM public.assets a
    LEFT JOIN LATERAL (
      SELECT aqh.quantity
      FROM public.asset_quantity_history aqh
      WHERE aqh.asset_id = a.id
        AND aqh.household_id = v_household_id
        AND aqh.as_of_date <= p_as_of_date
      ORDER BY aqh.as_of_date DESC
      LIMIT 1
    ) lq ON true
    LEFT JOIN LATERAL (
      SELECT aph.unit_price
      FROM public.asset_price_history aph
      WHERE aph.asset_id = a.id
        AND aph.household_id = v_household_id
        AND aph.as_of_date <= p_as_of_date
      ORDER BY aph.as_of_date DESC
      LIMIT 1
    ) lp ON true
    WHERE a.household_id = v_household_id
  )
  SELECT COALESCE(SUM(liquid_value), 0)::numeric(18,0)
  INTO v_liquid_assets
  FROM liquid_assets;

  -- Emergency fund months (3-month essential average)
  -- Card essential expense must come from card_billing_items, not raw card transactions.
  WITH essential_non_cc_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND ac.type <> 'credit_card'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  ),
  essential_cc_by_month AS (
    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1

    UNION ALL

    SELECT
      cbm.billing_month::date AS month_bucket,
      SUM(cbi.amount + cbi.fee_amount)::numeric(18,2) AS essential_expense
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    WHERE cbi.household_id = v_household_id
      AND c.is_essential = true
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= (v_month_start - interval '2 months')
      AND cbm.billing_month <= v_month_end
    GROUP BY 1
  ),
  essential_by_month AS (
    SELECT month_bucket, SUM(essential_expense)::numeric(18,2) AS essential_expense
    FROM (
      SELECT month_bucket, essential_expense FROM essential_non_cc_by_month
      UNION ALL
      SELECT month_bucket, essential_expense FROM essential_cc_by_month
    ) src
    GROUP BY month_bucket
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- Debt service ratio
  SELECT COALESCE(SUM(lp.actual_amount), 0)::numeric(18,0)
  INTO v_debt_service
  FROM public.liability_payments lp
  WHERE lp.household_id = v_household_id
    AND lp.payment_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_debt_service_ratio := v_debt_service::numeric / v_monthly_income::numeric;
  ELSE
    v_debt_service_ratio := NULL;
  END IF;

  -- Monthly card installment obligations (current billing month)
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_card_installment_due
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    AND cbi.item_type = 'installment'
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end;

  -- Card minimum due proxy: 5% of remaining statement amount for open/partial statements due this month
  SELECT COALESCE(
    SUM(
      ROUND(
        GREATEST(cbm.statement_amount - cbm.paid_amount, 0)::numeric * 0.05,
        0
      )
    ),
    0
  )::numeric(18,0)
  INTO v_card_min_due
  FROM public.card_billing_months cbm
  WHERE cbm.household_id = v_household_id
    AND cbm.status <> 'settled'
    AND cbm.due_date BETWEEN v_month_start AND v_month_end;

  IF v_monthly_income > 0 THEN
    v_tdsr_percent := ROUND(
      ((v_debt_service + v_card_installment_due + v_card_min_due)::numeric / v_monthly_income::numeric) * 100,
      2
    )::numeric(10,2);
  ELSE
    v_tdsr_percent := NULL;
  END IF;

  RETURN QUERY
  SELECT
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
    v_savings_rate_6mo_avg,
    v_savings_rate_mom_delta,
    v_emergency_months,
    v_debt_service_ratio,
    v_tdsr_percent;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_dashboard_core(uuid, date) TO authenticated, anon;
