-- ============================================================================
-- 00035_spending_jar_analytics_rpc.sql
-- Spending jar analytics RPCs: summary, history, transaction list, category breakdown.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_monthly_summary(
  p_household_id UUID DEFAULT NULL,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  jar_id UUID,
  jar_name TEXT,
  month DATE,
  monthly_limit NUMERIC(18,0),
  monthly_spent NUMERIC(18,0),
  usage_percent NUMERIC(10,2),
  alert_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(t.amount)::NUMERIC(18,0) AS amount
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_standard AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_installment AS (
    SELECT
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  spent_by_jar AS (
    SELECT resolved_jar_id AS jar_id, SUM(amount)::NUMERIC(18,0) AS monthly_spent
    FROM (
      SELECT * FROM non_cc
      UNION ALL
      SELECT * FROM cc_standard
      UNION ALL
      SELECT * FROM cc_installment
    ) u
    GROUP BY resolved_jar_id
  ),
  limits AS (
    SELECT
      t.jar_id,
      COALESCE(t.computed_target_amount, 0)::NUMERIC(18,0) AS monthly_limit
    FROM public.jar_monthly_targets t
    WHERE t.household_id = v_household_id
      AND t.month = v_month
  )
  SELECT
    j.id AS jar_id,
    j.name AS jar_name,
    v_month AS month,
    COALESCE(l.monthly_limit, 0)::NUMERIC(18,0) AS monthly_limit,
    COALESCE(s.monthly_spent, 0)::NUMERIC(18,0) AS monthly_spent,
    CASE
      WHEN COALESCE(l.monthly_limit, 0) <= 0 THEN NULL::NUMERIC(10,2)
      ELSE ROUND((COALESCE(s.monthly_spent, 0)::NUMERIC / l.monthly_limit::NUMERIC) * 100, 2)::NUMERIC(10,2)
    END AS usage_percent,
    CASE
      WHEN COALESCE(l.monthly_limit, 0) <= 0 THEN 'normal'
      WHEN (COALESCE(s.monthly_spent, 0)::NUMERIC / NULLIF(l.monthly_limit::NUMERIC, 0)) * 100 > 100 THEN 'exceeded'
      WHEN (COALESCE(s.monthly_spent, 0)::NUMERIC / NULLIF(l.monthly_limit::NUMERIC, 0)) * 100 >= 80 THEN 'warning'
      ELSE 'normal'
    END::TEXT AS alert_level
  FROM public.jar_definitions j
  LEFT JOIN limits l ON l.jar_id = j.id
  LEFT JOIN spent_by_jar s ON s.jar_id = j.id
  WHERE j.household_id = v_household_id
    AND j.is_archived = false
  ORDER BY j.sort_order ASC, j.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_history_months(
  p_household_id UUID DEFAULT NULL,
  p_jar_id UUID DEFAULT NULL,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  jar_id UUID,
  jar_name TEXT,
  month DATE,
  monthly_limit NUMERIC(18,0),
  monthly_spent NUMERIC(18,0),
  usage_percent NUMERIC(10,2),
  alert_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_months INTEGER;
  v_ref_month DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_months := LEAST(GREATEST(COALESCE(p_months, 12), 1), 24);
  v_ref_month := date_trunc('month', now())::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT (v_ref_month - (gs.idx || ' months')::interval)::date AS month_start
    FROM generate_series(0, v_months - 1) AS gs(idx)
  )
  SELECT
    s.jar_id,
    s.jar_name,
    s.month,
    s.monthly_limit,
    s.monthly_spent,
    s.usage_percent,
    s.alert_level
  FROM months m
  CROSS JOIN LATERAL public.rpc_spending_jar_monthly_summary(v_household_id, m.month_start) s
  WHERE p_jar_id IS NULL OR s.jar_id = p_jar_id
  ORDER BY s.month DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_month_transactions(
  p_household_id UUID,
  p_jar_id UUID,
  p_month DATE DEFAULT date_trunc('month', now())::date,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entry_id TEXT,
  source_type TEXT,
  entry_date DATE,
  description TEXT,
  category_id UUID,
  category_name TEXT,
  amount NUMERIC(18,0)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
  v_limit INTEGER;
  v_offset INTEGER;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;
  IF p_jar_id IS NULL THEN
    RAISE EXCEPTION 'Jar id is required';
  END IF;
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      t.id::TEXT AS entry_id,
      'transaction'::TEXT AS source_type,
      t.transaction_date AS entry_date,
      COALESCE(t.description, c.name, 'Expense')::TEXT AS description,
      t.category_id,
      c.name::TEXT AS category_name,
      t.amount::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
  ),
  cc_standard AS (
    SELECT
      cbi.id::TEXT AS entry_id,
      'card_standard'::TEXT AS source_type,
      cbm.billing_month::DATE AS entry_date,
      COALESCE(cbi.description, c.name, 'Card expense')::TEXT AS description,
      tx.category_id,
      c.name::TEXT AS category_name,
      (cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
  ),
  cc_installment AS (
    SELECT
      cbi.id::TEXT AS entry_id,
      'card_installment'::TEXT AS source_type,
      cbm.billing_month::DATE AS entry_date,
      COALESCE(cbi.description, c.name, ip.description, 'Installment')::TEXT AS description,
      tx.category_id,
      c.name::TEXT AS category_name,
      (cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
  ),
  all_rows AS (
    SELECT * FROM non_cc
    UNION ALL
    SELECT * FROM cc_standard
    UNION ALL
    SELECT * FROM cc_installment
  )
  SELECT
    r.entry_id,
    r.source_type,
    r.entry_date,
    r.description,
    r.category_id,
    r.category_name,
    r.amount
  FROM all_rows r
  WHERE r.resolved_jar_id = p_jar_id
  ORDER BY r.entry_date DESC, r.entry_id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_spending_jar_month_category_breakdown(
  p_household_id UUID,
  p_jar_id UUID,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  amount NUMERIC(18,0)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
  v_month_end DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;
  v_month_end := (v_month + interval '1 month - 1 day')::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;
  IF p_jar_id IS NULL THEN
    RAISE EXCEPTION 'Jar id is required';
  END IF;
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  RETURN QUERY
  WITH fallback AS (
    SELECT jd.id AS fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = v_household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1
  ),
  non_cc AS (
    SELECT
      t.category_id,
      c.name::TEXT AS category_name,
      SUM(t.amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = t.household_id
      AND m.category_id = t.category_id
    CROSS JOIN fallback f
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date BETWEEN v_month AND v_month_end
    GROUP BY t.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_standard AS (
    SELECT
      tx.category_id,
      c.name::TEXT AS category_name,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY tx.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  cc_installment AS (
    SELECT
      tx.category_id,
      c.name::TEXT AS category_name,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount,
      COALESCE(m.jar_id, f.fallback_jar_id) AS resolved_jar_id
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    JOIN public.categories c ON c.id = tx.category_id
    LEFT JOIN public.spending_jar_category_map m
      ON m.household_id = cbi.household_id
      AND m.category_id = tx.category_id
    CROSS JOIN fallback f
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month BETWEEN v_month AND v_month_end
    GROUP BY tx.category_id, c.name, COALESCE(m.jar_id, f.fallback_jar_id)
  ),
  all_rows AS (
    SELECT * FROM non_cc
    UNION ALL
    SELECT * FROM cc_standard
    UNION ALL
    SELECT * FROM cc_installment
  )
  SELECT
    r.category_id,
    COALESCE(r.category_name, 'Uncategorized')::TEXT AS category_name,
    SUM(r.amount)::NUMERIC(18,0) AS amount
  FROM all_rows r
  WHERE r.resolved_jar_id = p_jar_id
  GROUP BY r.category_id, COALESCE(r.category_name, 'Uncategorized')
  ORDER BY amount DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_monthly_summary(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_history_months(UUID, UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_month_transactions(UUID, UUID, DATE, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_spending_jar_month_category_breakdown(UUID, UUID, DATE) TO authenticated, anon;
