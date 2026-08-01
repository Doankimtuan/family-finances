-- ============================================================================
-- 00036_spending_jar_backfill_12m.sql
-- Backfill category->jar map for expense categories used in the last 12 months.
-- Missing mappings are routed to fallback 'unassigned' jar.
-- ============================================================================

WITH fallback AS (
  SELECT
    h.id AS household_id,
    jd.id AS jar_id
  FROM public.households h
  JOIN public.jar_definitions jd
    ON jd.household_id = h.id
   AND jd.slug = 'unassigned'
   AND jd.is_archived = false
),
recent_expense_categories AS (
  SELECT DISTINCT
    t.household_id,
    t.category_id
  FROM public.transactions t
  WHERE t.type = 'expense'
    AND t.category_id IS NOT NULL
    AND t.transaction_date >= (date_trunc('month', now())::date - interval '12 months')
)
INSERT INTO public.spending_jar_category_map (
  household_id,
  category_id,
  jar_id
)
SELECT
  r.household_id,
  r.category_id,
  f.jar_id
FROM recent_expense_categories r
JOIN fallback f ON f.household_id = r.household_id
ON CONFLICT (household_id, category_id) DO NOTHING;
