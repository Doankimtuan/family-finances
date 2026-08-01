-- ============================================================================
-- 00021_fix_installment_month_timezone.sql
-- Fix installment billing months shifted to previous month due to timezone
-- conversion in server action date formatting.
-- ============================================================================

DO $$
BEGIN
  -- 1) Collect malformed billing months (day != 1) that contain installment items.
  CREATE TEMP TABLE tmp_bad_installment_months ON COMMIT DROP AS
  SELECT
    cbm.id AS old_month_id,
    cbm.household_id,
    cbm.card_account_id,
    cbm.billing_month AS old_billing_month,
    DATE_TRUNC('month', (cbm.billing_month + INTERVAL '1 day'))::date AS fixed_billing_month
  FROM public.card_billing_months cbm
  WHERE EXTRACT(DAY FROM cbm.billing_month) <> 1
    AND EXISTS (
      SELECT 1
      FROM public.card_billing_items cbi
      WHERE cbi.billing_month_id = cbm.id
        AND cbi.item_type = 'installment'
    );

  -- 2) Ensure target (fixed) months exist.
  INSERT INTO public.card_billing_months (
    household_id,
    card_account_id,
    billing_month,
    statement_amount,
    paid_amount,
    due_date,
    status
  )
  SELECT
    t.household_id,
    t.card_account_id,
    t.fixed_billing_month,
    0,
    0,
    NULL,
    'open'
  FROM tmp_bad_installment_months t
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;

  -- 3) Move installment items to corrected billing months.
  UPDATE public.card_billing_items cbi
  SET billing_month_id = target.id
  FROM tmp_bad_installment_months t
  JOIN public.card_billing_months target
    ON target.card_account_id = t.card_account_id
   AND target.billing_month = t.fixed_billing_month
  WHERE cbi.billing_month_id = t.old_month_id
    AND cbi.item_type = 'installment';

  -- 4) Delete empty malformed months after item moves.
  DELETE FROM public.card_billing_months cbm
  USING tmp_bad_installment_months t
  WHERE cbm.id = t.old_month_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.card_billing_items cbi
      WHERE cbi.billing_month_id = cbm.id
    );

  -- 5) Align installment_plans.start_date to the first installment billing month.
  UPDATE public.installment_plans ip
  SET start_date = plan_months.first_billing_month
  FROM (
    SELECT
      cbi.installment_plan_id AS plan_id,
      MIN(cbm.billing_month) AS first_billing_month
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    WHERE cbi.item_type = 'installment'
      AND cbi.installment_plan_id IS NOT NULL
    GROUP BY cbi.installment_plan_id
  ) AS plan_months
  WHERE ip.id = plan_months.plan_id
    AND ip.start_date IS DISTINCT FROM plan_months.first_billing_month;

  -- 6) Recalculate statement_amount from billing items for all months.
  --    Converted standard items are excluded from statement totals.
  WITH recalculated AS (
    SELECT
      cbm.id AS month_id,
      COALESCE(
        SUM(
          CASE
            WHEN cbi.id IS NULL THEN 0
            WHEN cbi.is_converted_to_installment THEN 0
            ELSE COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0)
          END
        ),
        0
      )::NUMERIC(18,0) AS expected_statement_amount
    FROM public.card_billing_months cbm
    LEFT JOIN public.card_billing_items cbi ON cbi.billing_month_id = cbm.id
    GROUP BY cbm.id
  )
  UPDATE public.card_billing_months cbm
  SET
    statement_amount = recalculated.expected_statement_amount,
    paid_amount = LEAST(cbm.paid_amount, recalculated.expected_statement_amount),
    status = CASE
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) >= recalculated.expected_statement_amount
           AND recalculated.expected_statement_amount > 0 THEN 'settled'
      WHEN LEAST(cbm.paid_amount, recalculated.expected_statement_amount) > 0 THEN 'partial'
      ELSE 'open'
    END,
    updated_at = now()
  FROM recalculated
  WHERE cbm.id = recalculated.month_id;
END
$$;
