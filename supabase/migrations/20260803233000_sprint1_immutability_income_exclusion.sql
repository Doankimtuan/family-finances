-- Sprint 1 verification fixes (B1 / B2):
-- - Block in-place update_transaction (BR-02 / BR-03 immutability)
-- - Flag refund / reversal legs as is_reversal for income exclusion (REQ-JAR-01)

-- ---------------------------------------------------------------------------
-- is_reversal — exclude from monthly income, keep cash/jar capacity effects
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column if not exists is_reversal boolean not null default false;

comment on column public.transactions.is_reversal is
  'True for refund and correction-reversal legs. Affects cash/jar capacity but excluded from monthly income (BR-02 / REQ-JAR-01).';

create index if not exists transactions_is_reversal_idx
  on public.transactions (household_id, is_reversal)
  where is_reversal = true;

-- Backfill linked refund / reversal legs created before this column existed
update public.transactions
set is_reversal = true
where reverses_transaction_id is not null
  and is_reversal = false;

create or replace function public.transactions_set_is_reversal()
returns trigger
language plpgsql
as $$
begin
  if new.reverses_transaction_id is not null then
    new.is_reversal := true;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_set_is_reversal on public.transactions;
create trigger transactions_set_is_reversal
  before insert on public.transactions
  for each row
  execute function public.transactions_set_is_reversal();

-- ---------------------------------------------------------------------------
-- update_transaction — fail closed (use correct_transaction / refund_transaction)
-- ---------------------------------------------------------------------------
create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_transaction_date date default null,
  p_note text default null,
  p_category_id uuid default null,
  p_jar_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Transactions are immutable';
end;
$$;

revoke all on function public.update_transaction(uuid, uuid, text, numeric, date, text, uuid, uuid) from public;
grant execute on function public.update_transaction(uuid, uuid, text, numeric, date, text, uuid, uuid) to authenticated;
