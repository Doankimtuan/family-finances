-- ============================================================================
-- 00028_jar_reconciliation_ledger.sql
-- Add monthly jar/category reconciliation ledger and deterministic recompute RPC.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jar_reconciliation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  actual_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  allocated_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  gap_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_reconciliation_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_reconciliation_nonnegative_check CHECK (actual_amount >= 0 AND allocated_amount >= 0),
  CONSTRAINT jar_reconciliation_unique UNIQUE (household_id, month, category_id, jar_id)
);

CREATE INDEX IF NOT EXISTS idx_jar_recon_household_month
  ON public.jar_reconciliation_entries (household_id, month, gap_amount DESC);

DROP TRIGGER IF EXISTS trg_jar_reconciliation_set_updated_at ON public.jar_reconciliation_entries;
CREATE TRIGGER trg_jar_reconciliation_set_updated_at
  BEFORE UPDATE ON public.jar_reconciliation_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jar_reconciliation_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view jar reconciliation for their households" ON public.jar_reconciliation_entries;
CREATE POLICY "Users can view jar reconciliation for their households"
  ON public.jar_reconciliation_entries FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar reconciliation for their households" ON public.jar_reconciliation_entries;
CREATE POLICY "Users can manage jar reconciliation for their households"
  ON public.jar_reconciliation_entries FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.rpc_jar_reconciliation_month(
  p_household_id UUID DEFAULT NULL,
  p_month DATE DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  month DATE,
  category_id UUID,
  jar_id UUID,
  actual_amount NUMERIC,
  allocated_amount NUMERIC,
  gap_amount NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month DATE;
BEGIN
  v_household_id := COALESCE(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'No household available for current user';
  END IF;

  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_admin')
     AND NOT public.is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not authorized for household %', v_household_id;
  END IF;

  DELETE FROM public.jar_reconciliation_entries
  WHERE household_id = v_household_id
    AND month = v_month;

  WITH expense_non_cc AS (
    SELECT
      t.category_id,
      SUM(t.amount)::NUMERIC(18,0) AS amount
    FROM public.transactions t
    JOIN public.accounts ac ON ac.id = t.account_id
    WHERE t.household_id = v_household_id
      AND t.type = 'expense'
      AND t.category_id IS NOT NULL
      AND ac.type <> 'credit_card'
      AND t.transaction_date >= v_month
      AND t.transaction_date < (v_month + interval '1 month')
    GROUP BY t.category_id
  ),
  expense_cc_standard AS (
    SELECT
      tx.category_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.transactions tx ON tx.id = cbi.transaction_id
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'standard'
      AND cbi.is_converted_to_installment = false
      AND cbm.billing_month >= v_month
      AND cbm.billing_month < (v_month + interval '1 month')
    GROUP BY tx.category_id
  ),
  expense_cc_installment AS (
    SELECT
      tx.category_id,
      SUM(cbi.amount + cbi.fee_amount)::NUMERIC(18,0) AS amount
    FROM public.card_billing_items cbi
    JOIN public.card_billing_months cbm ON cbm.id = cbi.billing_month_id
    JOIN public.installment_plans ip ON ip.id = cbi.installment_plan_id
    JOIN public.transactions tx ON tx.id = ip.source_transaction_id
    WHERE cbi.household_id = v_household_id
      AND tx.category_id IS NOT NULL
      AND cbi.item_type = 'installment'
      AND cbm.billing_month >= v_month
      AND cbm.billing_month < (v_month + interval '1 month')
    GROUP BY tx.category_id
  ),
  category_actual AS (
    SELECT
      x.category_id,
      SUM(x.amount)::NUMERIC(18,0) AS actual_amount
    FROM (
      SELECT category_id, amount FROM expense_non_cc
      UNION ALL
      SELECT category_id, amount FROM expense_cc_standard
      UNION ALL
      SELECT category_id, amount FROM expense_cc_installment
    ) x
    GROUP BY x.category_id
  ),
  category_jar_map AS (
    SELECT
      c.id AS category_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END AS jar_slug
    FROM public.categories c
    WHERE c.household_id = v_household_id OR c.household_id IS NULL
  ),
  mapped AS (
    SELECT
      ca.category_id,
      jd.id AS jar_id,
      ca.actual_amount
    FROM category_actual ca
    JOIN category_jar_map cjm ON cjm.category_id = ca.category_id
    JOIN public.jar_definitions jd
      ON jd.household_id = v_household_id
     AND jd.slug = cjm.jar_slug
     AND jd.is_archived = false
  ),
  jar_allocated AS (
    SELECT
      e.jar_id,
      COALESCE(SUM(e.amount), 0)::NUMERIC(18,0) AS allocated_amount
    FROM public.jar_ledger_entries e
    WHERE e.household_id = v_household_id
      AND e.month = v_month
      AND e.entry_type = 'allocate'
    GROUP BY e.jar_id
  ),
  jar_actual_total AS (
    SELECT
      m.jar_id,
      COALESCE(SUM(m.actual_amount), 0)::NUMERIC(18,0) AS total_actual_amount
    FROM mapped m
    GROUP BY m.jar_id
  ),
  distributed AS (
    SELECT
      m.category_id,
      m.jar_id,
      m.actual_amount,
      CASE
        WHEN COALESCE(jat.total_actual_amount, 0) > 0 THEN
          ROUND(COALESCE(ja.allocated_amount, 0)::NUMERIC * (m.actual_amount::NUMERIC / jat.total_actual_amount::NUMERIC), 0)::NUMERIC(18,0)
        ELSE 0::NUMERIC(18,0)
      END AS allocated_amount
    FROM mapped m
    LEFT JOIN jar_allocated ja ON ja.jar_id = m.jar_id
    LEFT JOIN jar_actual_total jat ON jat.jar_id = m.jar_id
  )
  INSERT INTO public.jar_reconciliation_entries (
    household_id,
    month,
    category_id,
    jar_id,
    actual_amount,
    allocated_amount,
    gap_amount
  )
  SELECT
    v_household_id,
    v_month,
    d.category_id,
    d.jar_id,
    d.actual_amount,
    d.allocated_amount,
    (d.actual_amount - d.allocated_amount)::NUMERIC(18,0) AS gap_amount
  FROM distributed d;

  RETURN QUERY
  SELECT
    jre.id,
    jre.household_id,
    jre.month,
    jre.category_id,
    jre.jar_id,
    jre.actual_amount,
    jre.allocated_amount,
    jre.gap_amount,
    jre.created_at,
    jre.updated_at
  FROM public.jar_reconciliation_entries jre
  WHERE jre.household_id = v_household_id
    AND jre.month = v_month
  ORDER BY jre.gap_amount DESC, jre.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_jar_reconciliation_month(UUID, DATE) TO authenticated, anon;
