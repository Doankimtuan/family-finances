-- ============================================================================
-- 00034_spending_jar_category_map.sql
-- Spending jar category mapping (expense category -> jar) + fallback jar bootstrap.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.spending_jar_category_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT spending_jar_category_map_unique UNIQUE (household_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_spending_jar_map_household_jar
  ON public.spending_jar_category_map (household_id, jar_id);

CREATE INDEX IF NOT EXISTS idx_spending_jar_map_household_category
  ON public.spending_jar_category_map (household_id, category_id);

DROP TRIGGER IF EXISTS trg_spending_jar_category_map_set_updated_at ON public.spending_jar_category_map;
CREATE TRIGGER trg_spending_jar_category_map_set_updated_at
  BEFORE UPDATE ON public.spending_jar_category_map
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.spending_jar_category_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view spending jar category map for their households" ON public.spending_jar_category_map;
CREATE POLICY "Users can view spending jar category map for their households"
  ON public.spending_jar_category_map FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage spending jar category map for their households" ON public.spending_jar_category_map;
CREATE POLICY "Users can manage spending jar category map for their households"
  ON public.spending_jar_category_map FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- Ensure a per-household fallback spending jar for unmapped categories.
INSERT INTO public.jar_definitions (
  household_id,
  name,
  slug,
  color,
  icon,
  sort_order,
  is_system_default,
  is_archived
)
SELECT
  h.id,
  'Unassigned',
  'unassigned',
  '#64748B',
  'archive',
  999,
  true,
  false
FROM public.households h
ON CONFLICT (household_id, slug) DO NOTHING;
