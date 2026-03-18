-- ============================================================================
-- 00022_financial_jars.sql
-- Financial jars: schema, RLS, monthly overview, and one-time seed migration
-- ============================================================================

-- 1) Core tables ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jar_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_definitions_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT jar_definitions_unique_household_slug UNIQUE (household_id, slug)
);

CREATE TABLE IF NOT EXISTS public.jar_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  target_mode TEXT NOT NULL DEFAULT 'fixed',
  target_value NUMERIC(18,0) NOT NULL DEFAULT 0,
  computed_target_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_monthly_targets_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_monthly_targets_mode_check CHECK (target_mode IN ('fixed', 'percent')),
  CONSTRAINT jar_monthly_targets_nonnegative_check CHECK (target_value >= 0 AND computed_target_amount >= 0),
  CONSTRAINT jar_monthly_targets_unique UNIQUE (jar_id, month)
);

CREATE TABLE IF NOT EXISTS public.jar_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jar_definitions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  month DATE NOT NULL,
  entry_type TEXT NOT NULL,
  amount NUMERIC(18,0) NOT NULL,
  note TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual',
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.monthly_budgets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jar_ledger_entries_month_check CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT jar_ledger_entries_type_check CHECK (entry_type IN ('allocate', 'withdraw', 'adjust')),
  CONSTRAINT jar_ledger_entries_source_check CHECK (source_kind IN ('manual', 'migration_seed', 'system')),
  CONSTRAINT jar_ledger_entries_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_jar_definitions_household_active
  ON public.jar_definitions (household_id, is_archived, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jar_targets_household_month
  ON public.jar_monthly_targets (household_id, month);

CREATE INDEX IF NOT EXISTS idx_jar_ledger_household_month
  ON public.jar_ledger_entries (household_id, month, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_jar_ledger_jar_month
  ON public.jar_ledger_entries (jar_id, month, created_at DESC);

-- 2) updated_at trigger ----------------------------------------------------------
DROP TRIGGER IF EXISTS trg_jar_definitions_set_updated_at ON public.jar_definitions;
CREATE TRIGGER trg_jar_definitions_set_updated_at
  BEFORE UPDATE ON public.jar_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jar_monthly_targets_set_updated_at ON public.jar_monthly_targets;
CREATE TRIGGER trg_jar_monthly_targets_set_updated_at
  BEFORE UPDATE ON public.jar_monthly_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS -------------------------------------------------------------------------
ALTER TABLE public.jar_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view jar definitions for their households" ON public.jar_definitions;
CREATE POLICY "Users can view jar definitions for their households"
  ON public.jar_definitions FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar definitions for their households" ON public.jar_definitions;
CREATE POLICY "Users can manage jar definitions for their households"
  ON public.jar_definitions FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view jar targets for their households" ON public.jar_monthly_targets;
CREATE POLICY "Users can view jar targets for their households"
  ON public.jar_monthly_targets FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar targets for their households" ON public.jar_monthly_targets;
CREATE POLICY "Users can manage jar targets for their households"
  ON public.jar_monthly_targets FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view jar ledger for their households" ON public.jar_ledger_entries;
CREATE POLICY "Users can view jar ledger for their households"
  ON public.jar_ledger_entries FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage jar ledger for their households" ON public.jar_ledger_entries;
CREATE POLICY "Users can manage jar ledger for their households"
  ON public.jar_ledger_entries FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 4) Overview view ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.jar_monthly_overview WITH (security_invoker = true) AS
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
)
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
WHERE d.is_archived = false;

-- 5) Seed default 6 jars + seed targets/ledger from existing data ----------------
DO $$
DECLARE
  v_month DATE := date_trunc('month', now())::date;
BEGIN
  -- Ensure default jars for every household
  INSERT INTO public.jar_definitions (
    household_id, name, slug, color, icon, sort_order, is_system_default, is_archived
  )
  SELECT h.id, j.name, j.slug, j.color, j.icon, j.sort_order, true, false
  FROM public.households h
  CROSS JOIN (
    VALUES
      ('Nhu cầu thiết yếu', 'necessities', '#2563EB', 'house', 10),
      ('Giáo dục', 'education', '#0EA5E9', 'book-open', 20),
      ('Tự do tài chính', 'financial-freedom', '#16A34A', 'trending-up', 30),
      ('Tiết kiệm dài hạn', 'long-term-savings', '#7C3AED', 'piggy-bank', 40),
      ('Hưởng thụ', 'play', '#F59E0B', 'party-popper', 50),
      ('Cho đi', 'give', '#DC2626', 'heart-handshake', 60)
  ) AS j(name, slug, color, icon, sort_order)
  ON CONFLICT DO NOTHING;

  -- Seed current month targets from monthly_budgets (idempotent by jar_id+month)
  WITH budget_rollup AS (
    SELECT
      mb.household_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END AS target_slug,
      SUM(mb.planned_amount)::NUMERIC(18,0) AS target_amount
    FROM public.monthly_budgets mb
    JOIN public.categories c ON c.id = mb.category_id
    WHERE mb.month = v_month
    GROUP BY mb.household_id,
      CASE
        WHEN lower(c.name) LIKE ANY (ARRAY['%học%', '%education%', '%school%', '%đào tạo%']) THEN 'education'
        WHEN lower(c.name) LIKE ANY (ARRAY['%giải trí%', '%entertain%', '%du lịch%', '%ăn ngoài%', '%shopping%', '%mua sắm%']) THEN 'play'
        ELSE 'necessities'
      END
  )
  INSERT INTO public.jar_monthly_targets (
    household_id, jar_id, month, target_mode, target_value, computed_target_amount
  )
  SELECT
    r.household_id,
    jd.id,
    v_month,
    'fixed',
    r.target_amount,
    r.target_amount
  FROM budget_rollup r
  JOIN public.jar_definitions jd
    ON jd.household_id = r.household_id
   AND jd.slug = r.target_slug
  ON CONFLICT (jar_id, month) DO NOTHING;

  -- Seed current balances from active goals via adjust entries
  WITH goal_bal AS (
    SELECT
      g.household_id,
      CASE WHEN g.goal_type = 'emergency_fund' THEN 'long-term-savings' ELSE 'financial-freedom' END AS target_slug,
      SUM(
        COALESCE(
          CASE
            WHEN gc.flow_type = 'outflow' THEN -gc.amount
            ELSE gc.amount
          END,
          0
        )
      )::NUMERIC(18,0) AS funded
    FROM public.goals g
    LEFT JOIN public.goal_contributions gc ON gc.goal_id = g.id
    WHERE g.status = 'active'
    GROUP BY g.household_id,
      CASE WHEN g.goal_type = 'emergency_fund' THEN 'long-term-savings' ELSE 'financial-freedom' END
  )
  INSERT INTO public.jar_ledger_entries (
    household_id, jar_id, entry_date, month, entry_type, amount, note, source_kind
  )
  SELECT
    gb.household_id,
    jd.id,
    v_month,
    v_month,
    'adjust',
    gb.funded,
    'Khởi tạo từ mục tiêu đang hoạt động',
    'migration_seed'
  FROM goal_bal gb
  JOIN public.jar_definitions jd
    ON jd.household_id = gb.household_id
   AND jd.slug = gb.target_slug
  WHERE gb.funded > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.jar_ledger_entries e
      WHERE e.household_id = gb.household_id
        AND e.jar_id = jd.id
        AND e.month = v_month
        AND e.entry_type = 'adjust'
        AND e.source_kind = 'migration_seed'
        AND e.note = 'Khởi tạo từ mục tiêu đang hoạt động'
    );
END
$$;

COMMENT ON TABLE public.jar_definitions IS 'Household-defined virtual financial jars (envelope buckets).';
COMMENT ON TABLE public.jar_monthly_targets IS 'Monthly target plans for each jar, either fixed VND or percent-based.';
COMMENT ON TABLE public.jar_ledger_entries IS 'Virtual ledger events for jar allocations/withdrawals/adjustments.';
COMMENT ON VIEW public.jar_monthly_overview IS 'Per-jar monthly summary with target, net allocated balance, and coverage ratio.';
