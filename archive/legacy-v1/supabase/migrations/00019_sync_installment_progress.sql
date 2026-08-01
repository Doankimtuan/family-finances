-- ============================================================================
-- 00019_sync_installment_progress.sql  
-- One-time sync: update installment_plans.paid_installments and 
-- remaining_amount based on currently paid card_billing_items.
-- Run once after deploying the settle fix.
-- ============================================================================

DO $$
DECLARE
  plan_rec RECORD;
  paid_count   INT;
  paid_total   NUMERIC;
BEGIN
  FOR plan_rec IN
    SELECT id, total_amount, num_installments
    FROM public.installment_plans
    WHERE status = 'active'
  LOOP
    -- Count paid installment items for this plan
    SELECT
      COUNT(*)::int,
      COALESCE(SUM(amount + fee_amount), 0)
    INTO paid_count, paid_total
    FROM public.card_billing_items
    WHERE installment_plan_id = plan_rec.id
      AND item_type = 'installment'
      AND is_paid = true;

    UPDATE public.installment_plans
    SET
      paid_installments = paid_count,
      remaining_amount  = GREATEST(0, plan_rec.total_amount - paid_total),
      status = CASE
                 WHEN paid_count >= plan_rec.num_installments THEN 'completed'
                 ELSE 'active'
               END
    WHERE id = plan_rec.id;

  END LOOP;
END;
$$;
