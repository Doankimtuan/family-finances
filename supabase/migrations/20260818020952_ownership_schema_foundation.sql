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
  where owner_membership_id is not null;;
