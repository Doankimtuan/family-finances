-- MARKET 02: provider-backed catalog synchronization operational state.
-- Prices, price history, valuation, accounting, and scheduling remain out of scope.

create table public.market_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('COINGECKO', 'VNSTOCK', 'FMARKET')),
  started_at timestamptz not null,
  finished_at timestamptz,
  fetched_count integer not null default 0 check (fetched_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  error text,
  created_at timestamptz not null default now()
);
alter table public.market_sync_runs enable row level security;
revoke all on table public.market_sync_runs from anon, authenticated;
grant all on table public.market_sync_runs to service_role;
