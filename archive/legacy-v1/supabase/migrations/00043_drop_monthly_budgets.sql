-- Migration: Drop monthly_budgets table
-- Reason: Budgets feature has been removed in favor of Goals and Jars
-- Date: 2026-05-04

-- First, drop the foreign key reference from jar_ledger_entries
ALTER TABLE public.jar_ledger_entries
DROP CONSTRAINT IF EXISTS jar_ledger_entries_budget_id_fkey;

-- Drop the column if it exists (it may not exist in all environments)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jar_ledger_entries' AND column_name = 'budget_id'
  ) THEN
    ALTER TABLE public.jar_ledger_entries DROP COLUMN budget_id;
  END IF;
END $$;

-- Drop trigger on monthly_budgets
DROP TRIGGER IF EXISTS trg_monthly_budgets_set_updated_at ON public.monthly_budgets;

-- Drop RLS policies on monthly_budgets
DROP POLICY IF EXISTS monthly_budgets_select_member_policy ON public.monthly_budgets;
DROP POLICY IF EXISTS monthly_budgets_insert_member_policy ON public.monthly_budgets;
DROP POLICY IF EXISTS monthly_budgets_update_member_policy ON public.monthly_budgets;
DROP POLICY IF EXISTS monthly_budgets_delete_member_policy ON public.monthly_budgets;

-- Disable RLS on monthly_budgets (before dropping)
ALTER TABLE IF EXISTS public.monthly_budgets DISABLE ROW LEVEL SECURITY;

-- Drop indexes on monthly_budgets
DROP INDEX IF EXISTS idx_monthly_budgets_household_month;

-- Finally, drop the table
DROP TABLE IF EXISTS public.monthly_budgets;
