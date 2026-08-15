alter table public.investment_fees add column if not exists fee_asset text check (fee_asset is null or length(trim(fee_asset)) between 1 and 40);
