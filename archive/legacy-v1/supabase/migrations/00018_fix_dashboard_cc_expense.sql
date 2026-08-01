-- ============================================================================
-- 00018_fix_dashboard_cc_expense.sql
-- Fix monthly_expense calculation to handle credit card accounts correctly.
--
-- Problem:
--   The original rpc_dashboard_core sums ALL expense transactions, including
--   those on credit card accounts. For credit cards:
--   - The full transaction amount is stored in `transactions` when spending
--   - If converted to installment, only the monthly installment should count
--   - Even for non-converted items, the expense "belongs" to the billing cycle
--     month (governed by statement_day), not the transaction date
--
-- Solution:
--   1. Exclude expense transactions on credit_card accounts from the standard
--      expense sum (they are tracked in card_billing_items instead).
--   2. Add the sum of card_billing_items for the current billing month that
--      falls within the calendar month being reported.
--      - Converts items count only their monthly installment amount
--      - Standard items count their full amount
--      - Converted-to-installment items (is_converted_to_installment=true) 
--        are excluded (the installment records replace them)
-- ============================================================================

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
  emergency_months    numeric(10,2),
  debt_service_ratio  numeric(10,6)
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
  v_liquid_assets          numeric(18,0) := 0;
  v_avg_essential_expense  numeric(18,2);
  v_emergency_months       numeric(10,2);
  v_debt_service           numeric(18,0) := 0;
  v_debt_service_ratio     numeric(10,6);
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

  -- ── Net worth via accounts ──────────────────────────────────────────────────
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

  -- ── Non-account (physical) assets ─────────────────────────────────────────
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

  -- ── Liabilities ────────────────────────────────────────────────────────────
  SELECT COALESCE(SUM(l.current_principal_outstanding), 0)::numeric(18,0)
  INTO v_total_liabilities
  FROM public.liabilities l
  WHERE l.household_id = v_household_id
    AND l.include_in_net_worth = true
    AND l.is_active = true;

  -- ── Monthly income ─────────────────────────────────────────────────────────
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_monthly_income
  FROM public.transactions t
  WHERE t.household_id = v_household_id
    AND t.type = 'income'
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- ── Monthly expense: NON-credit-card accounts ──────────────────────────────
  -- Standard accounts: sum expense transactions as before
  SELECT COALESCE(SUM(t.amount), 0)::numeric(18,0)
  INTO v_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  WHERE t.household_id = v_household_id
    AND t.type = 'expense'
    AND ac.type <> 'credit_card'          -- exclude CC accounts
    AND t.transaction_date BETWEEN v_month_start AND v_month_end;

  -- ── Monthly expense: Credit card accounts via billing items ────────────────
  -- For credit cards, use card_billing_items for the billing months that
  -- overlap the current calendar month. This ensures:
  --   • Converted-to-installment items are excluded (replaced by installment rows)
  --   • Installment items contribute only their monthly_amount
  --   • Standard items contribute their full amount
  SELECT COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::numeric(18,0)
  INTO v_cc_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  WHERE cbi.household_id = v_household_id
    -- The billing month falls within the current calendar month
    AND cbm.billing_month BETWEEN v_month_start AND v_month_end
    -- Exclude items whose original transaction was converted to installments
    AND cbi.is_converted_to_installment = false;

  v_monthly_expense  := v_non_cc_expense + v_cc_expense;
  v_monthly_savings  := v_monthly_income - v_monthly_expense;

  IF v_monthly_income > 0 THEN
    v_savings_rate := v_monthly_savings::numeric / v_monthly_income::numeric;
  ELSE
    v_savings_rate := NULL;
  END IF;

  -- ── Liquid assets ──────────────────────────────────────────────────────────
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

  -- ── Emergency fund months ──────────────────────────────────────────────────
  WITH essential_by_month AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS month_bucket,
      SUM(t.amount)::numeric(18,2) AS essential_expense
    FROM public.transactions t
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND c.is_essential = true
      AND t.transaction_date >= (v_month_start - interval '2 months')
      AND t.transaction_date <= v_month_end
    GROUP BY 1
  )
  SELECT AVG(essential_expense)
  INTO v_avg_essential_expense
  FROM essential_by_month;

  IF COALESCE(v_avg_essential_expense, 0) > 0 THEN
    v_emergency_months := ROUND((v_liquid_assets / v_avg_essential_expense)::numeric, 2);
  ELSE
    v_emergency_months := NULL;
  END IF;

  -- ── Debt service ratio ─────────────────────────────────────────────────────
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

  -- ── Return ─────────────────────────────────────────────────────────────────
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
    v_emergency_months,
    v_debt_service_ratio;
END;
$$;
