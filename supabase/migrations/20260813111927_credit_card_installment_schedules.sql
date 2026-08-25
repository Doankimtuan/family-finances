-- Card purchase schedules are metadata only. The existing billing ledger remains
-- the source of truth for liability, statement totals, and available credit.
create table if not exists public.credit_card_installments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  card_account_id uuid not null references public.accounts(id) on delete restrict,
  description text not null,
  principal numeric(18, 0) not null,
  term_count integer not null,
  completed_terms integer not null default 0,
  start_date date not null,
  status text not null default 'active',
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_card_installments_description_not_blank
    check (length(trim(description)) > 0),
  constraint credit_card_installments_principal_positive
    check (principal > 0),
  constraint credit_card_installments_term_positive
    check (term_count > 0),
  constraint credit_card_installments_completed_range
    check (completed_terms >= 0 and completed_terms <= term_count),
  constraint credit_card_installments_status_check
    check (status in ('active', 'completed', 'cancelled'))
);

create index if not exists idx_credit_card_installments_card_status
  on public.credit_card_installments (card_account_id, status, start_date);

alter table public.credit_card_installments enable row level security;

create policy credit_card_installments_select_member
  on public.credit_card_installments for select to authenticated
  using (public.is_household_member(household_id));

create policy credit_card_installments_insert_member
  on public.credit_card_installments for insert to authenticated
  with check (public.is_household_member(household_id));

create policy credit_card_installments_update_member
  on public.credit_card_installments for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

grant select, insert, update on public.credit_card_installments to authenticated;;
