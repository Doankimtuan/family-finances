-- ============================================================================
-- 00033_drop_jar_reconciliation_rpc.sql
-- Remove deprecated jar reconciliation RPC without touching production data.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_jar_reconciliation_month(UUID, DATE);
