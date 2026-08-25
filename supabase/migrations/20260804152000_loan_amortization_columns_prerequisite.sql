-- Loan amortization columns are consumed by the interest-strategy RPCs and
-- application read model before the later loan gate migrations run.
alter table public.loans
  add column if not exists repayment_method text not null default 'fixed_monthly',
  add column if not exists term_months integer,
  add column if not exists total_interest numeric(18, 0) not null default 0,
  add column if not exists total_repayment numeric(18, 0) not null default 0;
