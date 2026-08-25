-- Prerequisite for loan interest strategies: the next migration backfills this column.
alter table public.loans
  add column if not exists first_payment_date date;
