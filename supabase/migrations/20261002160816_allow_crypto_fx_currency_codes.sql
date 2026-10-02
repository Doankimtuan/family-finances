alter table public.market_currency_rates
  drop constraint if exists market_currency_rates_base_currency_check;

alter table public.market_currency_rates
  add constraint market_currency_rates_base_currency_check
  check (base_currency ~ '^[A-Z]{3,4}$');
