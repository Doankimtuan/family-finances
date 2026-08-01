-- ============================================================================
-- 00037_spending_jar_mapping_trigger.sql
-- Ensure expense transactions always have a category->jar mapping (fallback to unassigned).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_spending_jar_mapping_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fallback_jar_id UUID;
BEGIN
  IF NEW.type <> 'expense' OR NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT jd.id
  INTO v_fallback_jar_id
  FROM public.jar_definitions jd
  WHERE jd.household_id = NEW.household_id
    AND jd.slug = 'unassigned'
    AND jd.is_archived = false
  LIMIT 1;

  IF v_fallback_jar_id IS NULL THEN
    INSERT INTO public.jar_definitions (
      household_id,
      name,
      slug,
      color,
      icon,
      sort_order,
      is_system_default,
      is_archived,
      created_by
    )
    VALUES (
      NEW.household_id,
      'Unassigned',
      'unassigned',
      '#64748B',
      'archive',
      999,
      true,
      false,
      NEW.created_by
    )
    ON CONFLICT (household_id, slug) DO NOTHING;

    SELECT jd.id
    INTO v_fallback_jar_id
    FROM public.jar_definitions jd
    WHERE jd.household_id = NEW.household_id
      AND jd.slug = 'unassigned'
      AND jd.is_archived = false
    LIMIT 1;
  END IF;

  INSERT INTO public.spending_jar_category_map (
    household_id,
    category_id,
    jar_id,
    created_by
  )
  VALUES (
    NEW.household_id,
    NEW.category_id,
    v_fallback_jar_id,
    NEW.created_by
  )
  ON CONFLICT (household_id, category_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_spending_jar_mapping_on_transaction ON public.transactions;
CREATE TRIGGER trg_ensure_spending_jar_mapping_on_transaction
  AFTER INSERT OR UPDATE OF type, category_id
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_spending_jar_mapping_on_transaction();
