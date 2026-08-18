-- PROMPT 14B — Ownership schema foundation.
--
-- Contract (Prompt 14A, treated as final):
--   financial_scope = 'household' | 'personal'
--   owner_membership_id = household_members.id, NULL iff scope = household
--   V1 visibility = household-wide; write authority comes in 14C/14D.
--
-- Rollout invariant: schema capability may exist, application capability must
-- remain disabled. No production flow may create or change a personal row
-- until ownership-aware RLS (14C) and RPC guards (14D) exist.
--
-- 1. Six ownership roots carry the canonical pair: accounts, savings,
--    investment_holdings, loans, liabilities, goals. All other financial rows
--    inherit ownership from their parent (saving_cycles, loan_payments,
--    debt_payments, investment_operations/fees/valuations/events/lots, card
--    billing, goal_contributions/funding_links, transactions via account).
--    investment_accounts is a vestigial schema shell (never written by any
--    RPC or app flow) and is intentionally NOT an ownership root.
--
-- 2. Same-household owner integrity is enforced by a composite FK
--    (household_id, owner_membership_id) -> household_members(household_id, id).
--    The FK intentionally does NOT require is_active: ownership identity may
--    reference a member who later leaves; mutation authority (14C/14D) will
--    require active membership. Separation: ownership identity vs authority.
--
-- 3. Security gap closure: the five writable roots (accounts, savings, loans,
--    liabilities, goals) currently grant INSERT/UPDATE to authenticated with
--    membership-only RLS. Without a countermeasure, a crafted PostgREST
--    request could set financial_scope='personal' or change owner_membership_id
--    immediately. Supabase default privileges re-grant column access to
--    authenticated on every ADD COLUMN (verified live), so column REVOKE alone
--    is not durable. The authoritative lock is a BEFORE INSERT OR UPDATE
--    trigger (force_household_scope) that force-overrides the ownership pair
--    to household/null on every write; the column REVOKEs are kept as defense
--    in depth. No current application flow sets these columns, so nothing
--    breaks. 14C replaces the trigger lock with ownership-aware policies.

-- ---------------------------------------------------------------------------
-- 1. Ownership columns on the six roots
-- ---------------------------------------------------------------------------

alter table public.accounts
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

alter table public.savings
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

alter table public.investment_holdings
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

alter table public.loans
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

alter table public.liabilities
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

alter table public.goals
  add column if not exists financial_scope text not null default 'household',
  add column if not exists owner_membership_id uuid;

-- ---------------------------------------------------------------------------
-- 2. Scope CHECK constraints (canonical values, no enum — additive-friendly)
-- ---------------------------------------------------------------------------

alter table public.accounts drop constraint if exists accounts_financial_scope_check;
alter table public.accounts
  add constraint accounts_financial_scope_check
  check (financial_scope in ('household', 'personal'));

alter table public.savings drop constraint if exists savings_financial_scope_check;
alter table public.savings
  add constraint savings_financial_scope_check
  check (financial_scope in ('household', 'personal'));

alter table public.investment_holdings drop constraint if exists investment_holdings_financial_scope_check;
alter table public.investment_holdings
  add constraint investment_holdings_financial_scope_check
  check (financial_scope in ('household', 'personal'));

alter table public.loans drop constraint if exists loans_financial_scope_check;
alter table public.loans
  add constraint loans_financial_scope_check
  check (financial_scope in ('household', 'personal'));

alter table public.liabilities drop constraint if exists liabilities_financial_scope_check;
alter table public.liabilities
  add constraint liabilities_financial_scope_check
  check (financial_scope in ('household', 'personal'));

alter table public.goals drop constraint if exists goals_financial_scope_check;
alter table public.goals
  add constraint goals_financial_scope_check
  check (financial_scope in ('household', 'personal'));

-- ---------------------------------------------------------------------------
-- 3. Same-household owner integrity via composite FK
--
-- The composite FK target must be a unique key. household_members has a PK on
-- id only; the (household_id, id) pair is logically implied by the PK, so add
-- an explicit unique constraint to serve as the FK target.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.household_members'::regclass
      and conname = 'household_members_household_id_id_key'
  ) then
    alter table public.household_members
      add constraint household_members_household_id_id_key
      unique (household_id, id);
  end if;
end $$;

alter table public.accounts drop constraint if exists accounts_owner_membership_fk;
alter table public.accounts
  add constraint accounts_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

alter table public.savings drop constraint if exists savings_owner_membership_fk;
alter table public.savings
  add constraint savings_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

alter table public.investment_holdings drop constraint if exists investment_holdings_owner_membership_fk;
alter table public.investment_holdings
  add constraint investment_holdings_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

alter table public.loans drop constraint if exists loans_owner_membership_fk;
alter table public.loans
  add constraint loans_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

alter table public.liabilities drop constraint if exists liabilities_owner_membership_fk;
alter table public.liabilities
  add constraint liabilities_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

alter table public.goals drop constraint if exists goals_owner_membership_fk;
alter table public.goals
  add constraint goals_owner_membership_fk
  foreign key (household_id, owner_membership_id)
  references public.household_members (household_id, id);

-- ---------------------------------------------------------------------------
-- 4. Scope/owner pairing CHECK — no other state may exist
-- ---------------------------------------------------------------------------

alter table public.accounts drop constraint if exists accounts_scope_owner_pair_check;
alter table public.accounts
  add constraint accounts_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

alter table public.savings drop constraint if exists savings_scope_owner_pair_check;
alter table public.savings
  add constraint savings_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

alter table public.investment_holdings drop constraint if exists investment_holdings_scope_owner_pair_check;
alter table public.investment_holdings
  add constraint investment_holdings_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

alter table public.loans drop constraint if exists loans_scope_owner_pair_check;
alter table public.loans
  add constraint loans_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

alter table public.liabilities drop constraint if exists liabilities_scope_owner_pair_check;
alter table public.liabilities
  add constraint liabilities_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

alter table public.goals drop constraint if exists goals_scope_owner_pair_check;
alter table public.goals
  add constraint goals_scope_owner_pair_check
  check (
    (financial_scope = 'household' and owner_membership_id is null)
    or (financial_scope = 'personal' and owner_membership_id is not null)
  );

-- ---------------------------------------------------------------------------
-- 5. Existing-data backfill: every existing row is household-owned.
--    Deterministic, idempotent, and does not infer ownership from created_by,
--    email, or actor. New rows already default to 'household'/NULL.
-- ---------------------------------------------------------------------------

update public.accounts
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

update public.savings
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

update public.investment_holdings
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

update public.loans
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

update public.liabilities
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

update public.goals
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Interim lock: production flows must not create or change personal rows.
--
--    accounts, savings, loans, liabilities, goals currently grant
--    INSERT/UPDATE to authenticated with membership-only RLS. Two layers:
--
--    a) BEFORE INSERT OR UPDATE trigger (authoritative): force-overrides the
--       ownership pair to household/null on every write from any path. This is
--       durable even though Supabase default privileges re-grant column access
--       to authenticated on every ADD COLUMN (verified live: column REVOKE
--       alone is defeated by ALTER DEFAULT PRIVILEGES). The trigger is
--       privilege-independent and survives 14C until ownership-aware policies
--       replace it.
--
--    b) Column-level REVOKE (defense in depth): kept so the columns read as
--       locked in the ACL; not relied upon as the primary control.
--
--    investment_holdings is select-only to authenticated already (mutations
--    flow through security-definer RPCs), so it needs no interim lock.
--    14C replaces the trigger lock with proper ownership-aware policies.
-- ---------------------------------------------------------------------------

create or replace function public.force_household_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.financial_scope := 'household';
  new.owner_membership_id := null;
  return new;
end;
$$;

revoke all on function public.force_household_scope() from public;
grant execute on function public.force_household_scope() to authenticated;

drop trigger if exists accounts_force_household_scope_trg on public.accounts;
create trigger accounts_force_household_scope_trg
  before insert or update on public.accounts
  for each row execute function public.force_household_scope();

drop trigger if exists savings_force_household_scope_trg on public.savings;
create trigger savings_force_household_scope_trg
  before insert or update on public.savings
  for each row execute function public.force_household_scope();

drop trigger if exists loans_force_household_scope_trg on public.loans;
create trigger loans_force_household_scope_trg
  before insert or update on public.loans
  for each row execute function public.force_household_scope();

drop trigger if exists liabilities_force_household_scope_trg on public.liabilities;
create trigger liabilities_force_household_scope_trg
  before insert or update on public.liabilities
  for each row execute function public.force_household_scope();

drop trigger if exists goals_force_household_scope_trg on public.goals;
create trigger goals_force_household_scope_trg
  before insert or update on public.goals
  for each row execute function public.force_household_scope();

revoke insert (financial_scope, owner_membership_id) on public.accounts from authenticated;
revoke update (financial_scope, owner_membership_id) on public.accounts from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.savings from authenticated;
revoke update (financial_scope, owner_membership_id) on public.savings from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.loans from authenticated;
revoke update (financial_scope, owner_membership_id) on public.loans from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.liabilities from authenticated;
revoke update (financial_scope, owner_membership_id) on public.liabilities from authenticated;

revoke insert (financial_scope, owner_membership_id) on public.goals from authenticated;
revoke update (financial_scope, owner_membership_id) on public.goals from authenticated;

-- ---------------------------------------------------------------------------
-- 7. Indexes: ownership access will be filtered by scope/owner in 14C/14D.
--    Minimal indexes now (nullable owner columns are cheap to index).
-- ---------------------------------------------------------------------------

create index if not exists idx_accounts_financial_scope_owner
  on public.accounts (financial_scope, owner_membership_id)
  where owner_membership_id is not null;

create index if not exists idx_savings_financial_scope_owner
  on public.savings (financial_scope, owner_membership_id)
  where owner_membership_id is not null;

create index if not exists idx_investment_holdings_financial_scope_owner
  on public.investment_holdings (financial_scope, owner_membership_id)
  where owner_membership_id is not null;

create index if not exists idx_loans_financial_scope_owner
  on public.loans (financial_scope, owner_membership_id)
  where owner_membership_id is not null;

create index if not exists idx_liabilities_financial_scope_owner
  on public.liabilities (financial_scope, owner_membership_id)
  where owner_membership_id is not null;

create index if not exists idx_goals_financial_scope_owner
  on public.goals (financial_scope, owner_membership_id)
  where owner_membership_id is not null;
