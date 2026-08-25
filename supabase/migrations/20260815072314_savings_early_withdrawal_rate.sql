-- Prompt 08.2.1: persist a product-owned annual rate for custom early withdrawal.
-- NULL means the selected policy does not use a custom rate.
alter table public.saving_packages
  add column if not exists early_settlement_rate_percent numeric(8,4);

alter table public.saving_packages
  drop constraint if exists saving_packages_early_rate_check;

alter table public.saving_packages
  add constraint saving_packages_early_rate_check
  check (early_settlement_rate_percent is null or early_settlement_rate_percent between 0 and 100);

update public.saving_packages
set early_settlement_rate_percent = null
where early_settlement_rule <> 'CUSTOM_RATE';
;
