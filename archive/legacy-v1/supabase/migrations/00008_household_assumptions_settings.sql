-- ============================================================================
-- 00008_household_assumptions_settings.sql
-- Household-level planning assumptions for settings and forecasting.
-- ============================================================================

alter table public.households
  add column if not exists assumptions_inflation_annual numeric(6,4) not null default 0.0400,
  add column if not exists assumptions_cash_return_annual numeric(6,4) not null default 0.0300,
  add column if not exists assumptions_investment_return_annual numeric(6,4) not null default 0.1000,
  add column if not exists assumptions_property_growth_annual numeric(6,4) not null default 0.0500,
  add column if not exists assumptions_gold_growth_annual numeric(6,4) not null default 0.0400,
  add column if not exists assumptions_salary_growth_annual numeric(6,4) not null default 0.0700;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_inflation_range') then
    alter table public.households
      add constraint households_assumptions_inflation_range
      check (assumptions_inflation_annual >= 0 and assumptions_inflation_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_cash_return_range') then
    alter table public.households
      add constraint households_assumptions_cash_return_range
      check (assumptions_cash_return_annual >= 0 and assumptions_cash_return_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_investment_return_range') then
    alter table public.households
      add constraint households_assumptions_investment_return_range
      check (assumptions_investment_return_annual >= 0 and assumptions_investment_return_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_property_growth_range') then
    alter table public.households
      add constraint households_assumptions_property_growth_range
      check (assumptions_property_growth_annual >= 0 and assumptions_property_growth_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_gold_growth_range') then
    alter table public.households
      add constraint households_assumptions_gold_growth_range
      check (assumptions_gold_growth_annual >= 0 and assumptions_gold_growth_annual <= 1.0000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'households_assumptions_salary_growth_range') then
    alter table public.households
      add constraint households_assumptions_salary_growth_range
      check (assumptions_salary_growth_annual >= 0 and assumptions_salary_growth_annual <= 1.0000);
  end if;
end
$$;

comment on column public.households.assumptions_inflation_annual is 'Annual inflation assumption (decimal fraction) for real-return and planning models.';
comment on column public.households.assumptions_cash_return_annual is 'Annual expected return for cash/savings deposits (decimal fraction).';
comment on column public.households.assumptions_investment_return_annual is 'Annual expected return for market investments (decimal fraction).';
comment on column public.households.assumptions_property_growth_annual is 'Annual expected property/land appreciation assumption (decimal fraction).';
comment on column public.households.assumptions_gold_growth_annual is 'Annual expected gold price growth assumption (decimal fraction).';
comment on column public.households.assumptions_salary_growth_annual is 'Annual expected household income growth assumption (decimal fraction).';
