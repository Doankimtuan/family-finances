-- Canonical schedule table required by loan RPCs and payment safety migrations.
create table if not exists public.loan_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  sequence int not null,
  due_date date not null,
  principal_due numeric(18, 0) not null,
  interest_due numeric(18, 0) not null default 0,
  total_due numeric(18, 0) not null,
  remaining_balance_after numeric(18, 0) not null,
  status text not null default 'upcoming',
  paid_at date,
  loan_payment_id uuid references public.loan_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_schedule_entries_sequence_positive check (sequence > 0),
  constraint loan_schedule_entries_amounts_nonnegative check (
    principal_due >= 0 and interest_due >= 0 and total_due >= 0 and remaining_balance_after >= 0
  ),
  constraint loan_schedule_entries_status_check check (
    status in ('upcoming', 'paid', 'partial', 'waived')
  ),
  constraint loan_schedule_entries_unique_sequence unique (loan_id, sequence)
);

create index if not exists idx_loan_schedule_entries_loan
  on public.loan_schedule_entries (loan_id, sequence);

alter table public.loan_schedule_entries enable row level security;
grant select on public.loan_schedule_entries to authenticated;
