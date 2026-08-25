-- PLAN 03: explicit Plan-owned expected income base for percentage Jar rules.
-- This is an envelope-planning input, not a Money account balance or posted
-- income snapshot. NULL means the calculation engine uses its documented
-- recurring-income / posted-income fallback chain.
alter table public.households
  add column if not exists qualifying_monthly_income numeric(18, 0);

alter table public.households
  drop constraint if exists households_qualifying_monthly_income_check;

alter table public.households
  add constraint households_qualifying_monthly_income_check
  check (
    qualifying_monthly_income is null
    or (
      qualifying_monthly_income >= 0
      and qualifying_monthly_income = trunc(qualifying_monthly_income)
    )
  );

comment on column public.households.qualifying_monthly_income is
  'Plan V2 expected monthly income base for percentage Jar rules; NULL uses recurring then posted qualifying-income fallback.';
;
