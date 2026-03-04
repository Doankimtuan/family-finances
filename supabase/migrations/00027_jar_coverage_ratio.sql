-- ============================================================================
-- 00027_jar_coverage_ratio.sql
-- Add essential-expense coverage metric to jar_monthly_overview.
-- jar_coverage_ratio_percent = essential_jar_allocated / essential_expenses * 100
-- ============================================================================

CREATE OR REPLACE VIEW public.jar_monthly_overview AS
WITH ledger AS (
  SELECT
    e.household_id,
    e.jar_id,
    e.month,
    COALESCE(SUM(CASE WHEN e.entry_type = 'allocate' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS allocated_amount,
    COALESCE(SUM(CASE WHEN e.entry_type = 'withdraw' THEN e.amount ELSE 0 END), 0)::NUMERIC(18,0) AS withdrawn_amount,
    COALESCE(SUM(
      CASE
        WHEN e.entry_type = 'withdraw' THEN -e.amount
        ELSE e.amount
      END
    ), 0)::NUMERIC(18,0) AS net_amount
  FROM public.jar_ledger_entries e
  GROUP BY e.household_id, e.jar_id, e.month
),
targets AS (
  SELECT
    t.household_id,
    t.jar_id,
    t.month,
    COALESCE(t.computed_target_amount, 0)::NUMERIC(18,0) AS target_amount
  FROM public.jar_monthly_targets t
),
base_rows AS (
  SELECT
    d.household_id,
    d.id AS jar_id,
    d.name,
    d.slug,
    d.color,
    d.icon,
    COALESCE(t.month, l.month, date_trunc('month', now())::date) AS month,
    COALESCE(t.target_amount, 0)::NUMERIC(18,0) AS target_amount,
    COALESCE(l.allocated_amount, 0)::NUMERIC(18,0) AS allocated_amount,
    COALESCE(l.withdrawn_amount, 0)::NUMERIC(18,0) AS withdrawn_amount,
    COALESCE(l.net_amount, 0)::NUMERIC(18,0) AS net_amount,
    CASE
      WHEN COALESCE(t.target_amount, 0) <= 0 THEN 0::NUMERIC(8,4)
      ELSE LEAST(1::NUMERIC, GREATEST(0::NUMERIC, COALESCE(l.net_amount, 0) / t.target_amount))::NUMERIC(8,4)
    END AS coverage_ratio
  FROM public.jar_definitions d
  LEFT JOIN targets t ON t.jar_id = d.id
  LEFT JOIN ledger l ON l.jar_id = d.id AND l.month = t.month
  WHERE d.is_archived = false
),
essential_non_cc_by_month AS (
  SELECT
    t.household_id,
    date_trunc('month', t.transaction_date)::date AS month,
    COALESCE(SUM(t.amount), 0)::NUMERIC(18,0) AS essential_non_cc_expense
  FROM public.transactions t
  JOIN public.accounts ac ON ac.id = t.account_id
  JOIN public.categories c ON c.id = t.category_id
  WHERE t.type = 'expense'
    AND ac.type <> 'credit_card'
    AND c.is_essential = true
  GROUP BY t.household_id, date_trunc('month', t.transaction_date)::date
),
essential_cc_standard_by_month AS (
  SELECT
    cbi.household_id,
    cbm.billing_month::date AS month,
    COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::NUMERIC(18,0) AS essential_cc_standard_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  JOIN public.transactions tx ON tx.id = cbi.transaction_id
  JOIN public.categories c ON c.id = tx.category_id
  WHERE cbi.item_type = 'standard'
    AND cbi.is_converted_to_installment = false
    AND c.is_essential = true
  GROUP BY cbi.household_id, cbm.billing_month::date
),
essential_cc_installment_by_month AS (
  SELECT
    cbi.household_id,
    cbm.billing_month::date AS month,
    COALESCE(SUM(cbi.amount + cbi.fee_amount), 0)::NUMERIC(18,0) AS essential_cc_installment_expense
  FROM public.card_billing_items cbi
  JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
  JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
  JOIN public.transactions tx ON tx.id = ip.source_transaction_id
  JOIN public.categories c ON c.id = tx.category_id
  WHERE cbi.item_type = 'installment'
    AND c.is_essential = true
  GROUP BY cbi.household_id, cbm.billing_month::date
),
essential_expense_by_month AS (
  SELECT
    br.household_id,
    br.month,
    (
      COALESCE(en.essential_non_cc_expense, 0)
      + COALESCE(es.essential_cc_standard_expense, 0)
      + COALESCE(ei.essential_cc_installment_expense, 0)
    )::NUMERIC(18,0) AS essential_expenses
  FROM (
    SELECT DISTINCT household_id, month
    FROM base_rows
  ) br
  LEFT JOIN essential_non_cc_by_month en
    ON en.household_id = br.household_id
   AND en.month = br.month
  LEFT JOIN essential_cc_standard_by_month es
    ON es.household_id = br.household_id
   AND es.month = br.month
  LEFT JOIN essential_cc_installment_by_month ei
    ON ei.household_id = br.household_id
   AND ei.month = br.month
),
essential_jar_allocated_by_month AS (
  SELECT
    br.household_id,
    br.month,
    COALESCE(SUM(br.allocated_amount), 0)::NUMERIC(18,0) AS essential_jar_allocated
  FROM base_rows br
  WHERE br.slug = 'necessities'
  GROUP BY br.household_id, br.month
)
SELECT
  br.household_id,
  br.jar_id,
  br.name,
  br.slug,
  br.color,
  br.icon,
  br.month,
  br.target_amount,
  br.allocated_amount,
  br.withdrawn_amount,
  br.net_amount,
  br.coverage_ratio,
  COALESCE(ee.essential_expenses, 0)::NUMERIC(18,0) AS essential_expenses,
  CASE
    WHEN COALESCE(ee.essential_expenses, 0) <= 0 THEN NULL::NUMERIC(10,2)
    ELSE ROUND((COALESCE(eja.essential_jar_allocated, 0)::NUMERIC / ee.essential_expenses::NUMERIC) * 100, 2)::NUMERIC(10,2)
  END AS jar_coverage_ratio_percent
FROM base_rows br
LEFT JOIN essential_expense_by_month ee
  ON ee.household_id = br.household_id
 AND ee.month = br.month
LEFT JOIN essential_jar_allocated_by_month eja
  ON eja.household_id = br.household_id
 AND eja.month = br.month;
