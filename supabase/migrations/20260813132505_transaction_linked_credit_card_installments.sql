-- ViNha card installments are local agreement trackers linked to one existing
-- card purchase. They do not post another expense or principal liability.

create table if not exists public.credit_card_installment_legacy_archive (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  legacy_installment_id uuid not null unique,
  legacy_payload jsonb not null,
  archived_reason text not null,
  archived_at timestamptz not null default now()
);

alter table public.credit_card_installment_legacy_archive enable row level security;
create policy credit_card_installment_legacy_archive_select_member
  on public.credit_card_installment_legacy_archive for select to authenticated
  using (public.is_household_member(household_id));
create policy credit_card_installment_legacy_archive_insert_member
  on public.credit_card_installment_legacy_archive for insert to authenticated
  with check (public.is_household_member(household_id));
grant select, insert on public.credit_card_installment_legacy_archive to authenticated;

-- A legacy standalone row has no safe source transaction to infer. Archive it
-- rather than keeping a second active model or fabricating financial history.
insert into public.credit_card_installment_legacy_archive (
  household_id,
  legacy_installment_id,
  legacy_payload,
  archived_reason
)
select
  household_id,
  id,
  to_jsonb(credit_card_installments),
  'Standalone tracker retired: source purchase unavailable for safe migration'
from public.credit_card_installments
on conflict (legacy_installment_id) do nothing;

delete from public.credit_card_installments;

alter table public.credit_card_installments
  drop constraint if exists credit_card_installments_description_not_blank,
  drop constraint if exists credit_card_installments_completed_range,
  drop constraint if exists credit_card_installments_status_check,
  drop column if exists completed_terms,
  drop column if exists start_date,
  alter column description drop not null,
  add column if not exists source_transaction_id uuid references public.transactions(id) on delete restrict,
  add column if not exists origin text not null default 'post_purchase',
  add column if not exists first_expected_date date,
  add column if not exists program text not null default 'zero_interest_zero_fee',
  add column if not exists calculation_source text not null default 'derived',
  add column if not exists conversion_fee_type text not null default 'none',
  add column if not exists conversion_fee_rate_bps integer,
  add column if not exists conversion_fee_amount numeric(18, 0) not null default 0,
  add column if not exists fee_timing text not null default 'first_expected_period',
  add column if not exists flat_interest_rate_bps integer,
  add column if not exists total_interest_amount numeric(18, 0) not null default 0,
  add column if not exists quoted_total_repayment numeric(18, 0);

alter table public.credit_card_installments
  alter column source_transaction_id set not null,
  alter column first_expected_date set not null,
  alter column origin drop default,
  alter column program drop default,
  alter column calculation_source drop default,
  alter column conversion_fee_type drop default,
  alter column conversion_fee_amount drop default,
  alter column fee_timing drop default,
  alter column status set default 'active';

alter table public.credit_card_installments
  add constraint credit_card_installments_source_transaction_unique
    unique (source_transaction_id),
  add constraint credit_card_installments_origin_check
    check (origin in ('post_purchase', 'partner_merchant', 'other')),
  add constraint credit_card_installments_program_check
    check (program in (
      'zero_interest_zero_fee',
      'zero_interest_with_conversion_fee',
      'flat_interest_without_conversion_fee',
      'flat_interest_with_conversion_fee',
      'bank_quoted'
    )),
  add constraint credit_card_installments_calculation_source_check
    check (calculation_source in ('derived', 'bank_quoted')),
  add constraint credit_card_installments_fee_type_check
    check (conversion_fee_type in ('none', 'fixed', 'percentage')),
  add constraint credit_card_installments_fee_timing_check
    check (fee_timing in (
      'first_expected_period',
      'spread_across_periods',
      'included_in_bank_quote'
    )),
  add constraint credit_card_installments_status_check
    check (status in ('active', 'stopped', 'review_required', 'completed')),
  add constraint credit_card_installments_cost_amounts_nonnegative
    check (
      conversion_fee_amount >= 0
      and total_interest_amount >= 0
      and (conversion_fee_rate_bps is null or conversion_fee_rate_bps >= 0)
      and (flat_interest_rate_bps is null or flat_interest_rate_bps >= 0)
      and (quoted_total_repayment is null or quoted_total_repayment >= principal)
    );

create index if not exists idx_credit_card_installments_card_status_expected
  on public.credit_card_installments (card_account_id, status, first_expected_date);

create table if not exists public.credit_card_installment_schedule (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  installment_id uuid not null references public.credit_card_installments(id) on delete cascade,
  installment_number integer not null,
  expected_date date not null,
  principal_amount numeric(18, 0) not null,
  conversion_fee_amount numeric(18, 0) not null default 0,
  interest_amount numeric(18, 0) not null default 0,
  total_amount numeric(18, 0) not null,
  status text not null default 'expected',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_card_installment_schedule_unique unique (installment_id, installment_number),
  constraint credit_card_installment_schedule_number_positive check (installment_number > 0),
  constraint credit_card_installment_schedule_costs_nonnegative check (
    principal_amount >= 0
    and conversion_fee_amount >= 0
    and interest_amount >= 0
    and total_amount = principal_amount + conversion_fee_amount + interest_amount
  ),
  constraint credit_card_installment_schedule_status_check
    check (status in ('expected', 'confirmed')),
  constraint credit_card_installment_schedule_confirmation_check
    check (
      (status = 'expected' and confirmed_at is null)
      or (status = 'confirmed' and confirmed_at is not null)
    )
);

create index if not exists idx_credit_card_installment_schedule_installment
  on public.credit_card_installment_schedule (installment_id, installment_number);

alter table public.credit_card_installment_schedule enable row level security;
create policy credit_card_installment_schedule_select_member
  on public.credit_card_installment_schedule for select to authenticated
  using (public.is_household_member(household_id));
create policy credit_card_installment_schedule_insert_member
  on public.credit_card_installment_schedule for insert to authenticated
  with check (public.is_household_member(household_id));
create policy credit_card_installment_schedule_update_member
  on public.credit_card_installment_schedule for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
grant select, insert, update on public.credit_card_installment_schedule to authenticated;

create policy credit_card_installments_delete_member
  on public.credit_card_installments for delete to authenticated
  using (public.is_household_member(household_id));
grant delete on public.credit_card_installments to authenticated;

-- Enforce that the source is a positive expense on the same active credit card.
create or replace function public.validate_credit_card_installment_source()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_source public.transactions%rowtype;
  v_card public.accounts%rowtype;
begin
  select * into v_source from public.transactions where id = new.source_transaction_id;
  if not found then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  select * into v_card from public.accounts where id = new.card_account_id;
  if not found then
    raise exception 'Invalid credit card installment card account';
  end if;
  if v_source.household_id <> new.household_id
    or v_source.account_id <> new.card_account_id
    or v_source.type <> 'expense'
    or v_source.amount <= 0
    or v_source.reverses_transaction_id is not null
    or v_source.corrects_transaction_id is not null
    or v_card.household_id <> new.household_id
    or v_card.type <> 'credit_card'
    or v_card.is_archived then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_credit_card_installment_source_trigger on public.credit_card_installments;
create trigger validate_credit_card_installment_source_trigger
  before insert or update of source_transaction_id, card_account_id, household_id
  on public.credit_card_installments
  for each row execute function public.validate_credit_card_installment_source();
;
