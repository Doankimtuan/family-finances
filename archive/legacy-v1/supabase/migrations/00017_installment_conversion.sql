-- ============================================================================
-- 00017_installment_conversion.sql
-- Add tracking for billing items converted to installment plans
-- ============================================================================

-- 1. Mark a billing item as "converted to installment" so it no longer
--    counts toward the monthly total in its original form.
ALTER TABLE public.card_billing_items
  ADD COLUMN IF NOT EXISTS is_converted_to_installment BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.card_billing_items.is_converted_to_installment
  IS 'True when this standard item has been converted to an installment plan. The original amount is replaced by N monthly installment records.';
