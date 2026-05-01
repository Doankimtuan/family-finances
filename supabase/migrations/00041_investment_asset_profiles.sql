-- ============================================================================
-- 00041_investment_asset_profiles.sql
-- Adds a flexible metadata column to assets and a class-specific profile table
-- for investment asset management (real estate, mutual funds, gold, crypto).
-- ============================================================================

-- 1. Add metadata jsonb column to assets for class-specific fields
alter table public.assets
  add column if not exists metadata jsonb default '{}'::jsonb;

-- 2. Add optional valuation_method hint
alter table public.assets
  add column if not exists valuation_method text default 'manual';

-- 3. Add target allocation % for portfolio rebalancing (nullable)
alter table public.assets
  add column if not exists target_allocation_pct numeric(5,2) default null;

-- 4. Add risk_level enum-like text
alter table public.assets
  add column if not exists risk_level text default null;

-- 5. Constraints for new columns
alter table public.assets
  drop constraint if exists assets_valuation_method_check;
alter table public.assets
  add constraint assets_valuation_method_check
  check (valuation_method in ('manual', 'api', 'appraisal', 'calculated'));

alter table public.assets
  drop constraint if exists assets_risk_level_check;
alter table public.assets
  add constraint assets_risk_level_check
  check (risk_level is null or risk_level in ('low', 'medium', 'high', 'very_high'));

alter table public.assets
  drop constraint if exists assets_target_allocation_pct_check;
alter table public.assets
  add constraint assets_target_allocation_pct_check
  check (target_allocation_pct is null or (target_allocation_pct >= 0 and target_allocation_pct <= 100));

-- 6. Update init_database.sql equivalent: the jsonb column and new columns
-- are backward-compatible; existing rows get '{}' metadata and 'manual' valuation_method.

comment on column public.assets.metadata is 'Flexible JSON for class-specific fields: address, fund_code, symbol, purity, wallet, etc.';
comment on column public.assets.valuation_method is 'How this asset is valued: manual, api, appraisal, or calculated.';
comment on column public.assets.target_allocation_pct is 'Target portfolio allocation percentage for rebalancing analysis.';
comment on column public.assets.risk_level is 'Subjective risk classification: low, medium, high, very_high.';
