-- ============================================================================
-- 00024_sync_card_billing_items_with_transaction_edits.sql
-- Backfill for credit-card transaction edits:
--   - Sync standard card_billing_items.amount/description/account/month with
--     source transactions.
--   - Recompute statement_amount / paid_amount / status in card_billing_months.
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  v_statement_day INTEGER;
  v_effective_month DATE;
  v_target_month_id UUID;
BEGIN
  FOR rec IN
    SELECT
      cbi.id AS billing_item_id,
      cbi.household_id,
      cbi.card_account_id AS old_card_account_id,
      cbi.billing_month_id AS old_billing_month_id,
      cbi.item_type,
      cbi.is_converted_to_installment,
      cbi.amount AS old_amount,
      cbi.description AS old_description,
      tx.id AS transaction_id,
      tx.account_id AS tx_account_id,
      tx.amount AS tx_amount,
      tx.type AS tx_type,
      tx.transaction_date AS tx_date,
      tx.description AS tx_description
    FROM public.card_billing_items cbi
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    WHERE cbi.transaction_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
  LOOP
    -- 1) Determine target billing month from transaction date + statement_day
    SELECT statement_day INTO v_statement_day
    FROM public.credit_card_settings
    WHERE account_id = rec.tx_account_id;

    v_statement_day := COALESCE(v_statement_day, 25);

    IF EXTRACT(DAY FROM rec.tx_date) > v_statement_day THEN
      v_effective_month := (rec.tx_date + INTERVAL '1 month')::DATE;
    ELSE
      v_effective_month := rec.tx_date;
    END IF;

    v_effective_month := DATE_TRUNC('month', v_effective_month)::DATE;

    INSERT INTO public.card_billing_months (
      household_id,
      card_account_id,
      billing_month
    )
    VALUES (
      rec.household_id,
      rec.tx_account_id,
      v_effective_month
    )
    ON CONFLICT (card_account_id, billing_month) DO NOTHING;

    SELECT id INTO v_target_month_id
    FROM public.card_billing_months
    WHERE card_account_id = rec.tx_account_id
      AND billing_month = v_effective_month;

    -- 2) Sync billing item with latest transaction data
    UPDATE public.card_billing_items
    SET
      card_account_id = rec.tx_account_id,
      billing_month_id = v_target_month_id,
      amount = rec.tx_amount,
      description = COALESCE(NULLIF(TRIM(rec.tx_description), ''), rec.old_description)
    WHERE id = rec.billing_item_id;
  END LOOP;

  -- 3) Recompute statement totals from current billing items
  WITH recalculated AS (
    SELECT
      cbm.id AS month_id,
      COALESCE(
        SUM(
          CASE
            WHEN cbi.id IS NULL THEN 0
            WHEN cbi.is_converted_to_installment THEN 0
            ELSE
              CASE
                WHEN cbi.transaction_id IS NOT NULL THEN
                  CASE
                    WHEN tx.type = 'income' THEN -(COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
                    ELSE (COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
                  END
                ELSE
                  (COALESCE(cbi.amount, 0) + COALESCE(cbi.fee_amount, 0))
              END
          END
        ),
        0
      )::NUMERIC(18,0) AS expected_statement_amount
    FROM public.card_billing_months cbm
    LEFT JOIN public.card_billing_items cbi ON cbi.billing_month_id = cbm.id
    LEFT JOIN public.transactions tx ON tx.id = cbi.transaction_id
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
