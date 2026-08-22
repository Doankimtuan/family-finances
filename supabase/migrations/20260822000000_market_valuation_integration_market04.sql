-- MARKET 04: current FX rates for read-time VND valuation.
-- Native market prices remain in market_instrument_prices. No FX history.

create table public.market_currency_rates (
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  quote_currency text not null check (quote_currency ~ '^[A-Z]{3}$'),
  rate numeric(24, 8) not null check (rate > 0),
  rate_date date not null,
  fetched_at timestamptz not null,
  provider text not null check (provider in ('FRANKFURTER')),
  updated_at timestamptz not null default now(),
  primary key (base_currency, quote_currency),
  check (base_currency <> quote_currency)
);

alter table public.market_currency_rates enable row level security;

create policy market_currency_rates_select_authenticated
  on public.market_currency_rates for select to authenticated
  using (true);

revoke all on table public.market_currency_rates from anon, authenticated;
grant select on table public.market_currency_rates to authenticated;
grant select, insert, update, delete on table public.market_currency_rates to service_role;
