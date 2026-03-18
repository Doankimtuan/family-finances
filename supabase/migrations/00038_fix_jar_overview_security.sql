-- ============================================================================
-- 00038_fix_jar_overview_security.sql
-- Fix: set jar_monthly_overview view to use security invoker to clear Supabase warnings and enforce RLS securely
-- ============================================================================

ALTER VIEW public.jar_monthly_overview SET (security_invoker = true);
