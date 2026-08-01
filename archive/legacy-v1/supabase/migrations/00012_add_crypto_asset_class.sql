-- ============================================================================
-- 00012_add_crypto_asset_class.sql
-- Modifies the assets table constraint to allow 'crypto' asset class.
-- ============================================================================

alter table public.assets
  drop constraint if exists assets_asset_class_check;

alter table public.assets
  add constraint assets_asset_class_check
  check (asset_class in ('cash_equivalent', 'gold', 'mutual_fund', 'stock', 'real_estate', 'savings_deposit', 'vehicle', 'crypto', 'other'));
