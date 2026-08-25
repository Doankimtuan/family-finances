-- MARKET 01: global market catalog and one current price per instrument.
-- Provider sync, history, snapshots, and valuation mutation are intentionally
-- out of scope.

create table public.market_instruments (
  id uuid primary key default gen_random_uuid(),
  asset_class text not null check (asset_class in ('crypto', 'stock', 'fund', 'gold', 'bond')),
  symbol text not null check (length(trim(symbol)) between 1 and 40),
  name text not null check (length(trim(name)) between 1 and 200),
  exchange text check (exchange is null or length(trim(exchange)) between 1 and 80),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  pricing_mode text not null default 'MANUAL'
    check (pricing_mode in ('UNIT_PRICE', 'NAV_PER_UNIT', 'BUYBACK_PRICE', 'TOTAL_VALUE', 'MANUAL')),
  auto_price_supported boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.market_instrument_sources (
  instrument_id uuid not null references public.market_instruments(id) on delete cascade,
  provider text not null check (provider in ('MANUAL', 'COINGECKO', 'VNSTOCK', 'FMARKET')),
  provider_instrument_id text not null check (length(trim(provider_instrument_id)) between 1 and 200),
  priority integer not null default 0 check (priority >= 0),
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  primary key (instrument_id, provider),
  unique (provider, provider_instrument_id)
);
create table public.market_instrument_prices (
  instrument_id uuid primary key references public.market_instruments(id) on delete cascade,
  price numeric(24, 8) not null check (price >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  price_type text not null check (price_type in ('LAST', 'NAV', 'BUYBACK', 'TOTAL_VALUE', 'MANUAL')),
  price_date date not null,
  fetched_at timestamptz not null,
  provider text not null check (provider in ('MANUAL', 'COINGECKO', 'VNSTOCK', 'FMARKET')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index market_instruments_asset_class_active_idx
  on public.market_instruments (asset_class, is_active);
create index market_instruments_symbol_search_idx
  on public.market_instruments (lower(symbol));
create index market_instrument_sources_lookup_idx
  on public.market_instrument_sources (instrument_id, priority);
alter table public.investment_holdings
  add column if not exists instrument_id uuid;
-- Older local migration histories used this column for the retired,
-- household-scoped investment_instruments table. Preserve that table, but do
-- not carry an unverified household instrument identity into the global market
-- catalog.
do $$
declare
  legacy_instruments oid := to_regclass('public.investment_instruments');
  foreign_key record;
begin
  if legacy_instruments is not null and exists (
    select 1
    from pg_constraint
    where conrelid = 'public.investment_holdings'::regclass
      and contype = 'f'
      and confrelid = legacy_instruments
  ) then
    update public.investment_holdings set instrument_id = null;
  end if;

  for foreign_key in
    select constraint_row.conname
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.investment_holdings'::regclass
      and constraint_row.contype = 'f'
      and constraint_row.confrelid <> 'public.market_instruments'::regclass
      and exists (
        select 1
        from unnest(constraint_row.conkey) as source_column(attnum)
        join pg_attribute attribute_row
          on attribute_row.attrelid = constraint_row.conrelid
         and attribute_row.attnum = source_column.attnum
        where attribute_row.attname = 'instrument_id'
      )
  loop
    execute format(
      'alter table public.investment_holdings drop constraint %I',
      foreign_key.conname
    );
  end loop;
end $$;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.investment_holdings'::regclass
      and conname = 'investment_holdings_instrument_id_fkey'
  ) then
    alter table public.investment_holdings
      add constraint investment_holdings_instrument_id_fkey
      foreign key (instrument_id)
      references public.market_instruments(id)
      on delete restrict;
  end if;
end $$;
create index investment_holdings_instrument_lookup_idx
  on public.investment_holdings (instrument_id)
  where instrument_id is not null;
alter table public.market_instruments enable row level security;
alter table public.market_instrument_sources enable row level security;
alter table public.market_instrument_prices enable row level security;
create policy market_instruments_select_authenticated
  on public.market_instruments for select to authenticated
  using (true);
create policy market_instrument_sources_select_authenticated
  on public.market_instrument_sources for select to authenticated
  using (true);
create policy market_instrument_prices_select_authenticated
  on public.market_instrument_prices for select to authenticated
  using (true);
revoke all on table
  public.market_instruments,
  public.market_instrument_sources,
  public.market_instrument_prices
from anon, authenticated;
grant select on table
  public.market_instruments,
  public.market_instrument_sources,
  public.market_instrument_prices
to authenticated;
grant select, insert, update, delete on table
  public.market_instruments,
  public.market_instrument_sources,
  public.market_instrument_prices
to service_role;
