-- ============================================================================
-- 00032_drop_cashflow_forecast_rpc.sql
-- Remove deprecated cash-flow forecast RPC without touching production data.
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_cashflow_forecast_90d(UUID, DATE, INTEGER);
