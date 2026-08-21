-- Debt 10E.1: make pre-tracking payments explicit so derived progress can
-- reconcile with the recorded payment history.

alter table public.liabilities
  add column if not exists opening_paid_amount numeric(18, 0) not null default 0;

update public.liabilities l
set opening_paid_amount = greatest(
  0,
  least(
    l.principal_amount,
    l.principal_amount - l.remaining_amount - coalesce(
      (
        select sum(dp.amount)
        from public.debt_payments dp
        where dp.liability_id = l.id
      ),
      0
    )
  )
);

alter table public.liabilities
  drop constraint if exists liabilities_opening_paid_amount_check,
  add constraint liabilities_opening_paid_amount_check
    check (opening_paid_amount >= 0 and opening_paid_amount <= principal_amount);
