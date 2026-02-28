-- ============================================================================
-- 00013_asset_cashflow_directions.sql
-- Adds explicit double-entry columns to asset cashflows.
-- ============================================================================

alter table public.asset_cashflows
  add column if not exists source_account_id uuid references public.accounts(id) on delete set null;

alter table public.asset_cashflows
  add column if not exists destination_account_id uuid references public.accounts(id) on delete set null;

alter table public.asset_cashflows
  drop constraint if exists asset_cashflows_flow_shape_check;

alter table public.asset_cashflows
  add constraint asset_cashflows_flow_shape_check
  check (
    (flow_type in ('contribution', 'fee', 'tax') and source_account_id is not null and destination_account_id is null)
    or
    (flow_type in ('withdrawal', 'income') and source_account_id is null and destination_account_id is not null)
  ) not valid;

create index if not exists idx_asset_cashflows_source_account
  on public.asset_cashflows (household_id, source_account_id, flow_date desc);

create index if not exists idx_asset_cashflows_destination_account
  on public.asset_cashflows (household_id, destination_account_id, flow_date desc);
