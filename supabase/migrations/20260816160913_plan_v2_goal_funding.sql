-- PLAN 08: Goal funding links with exclusive whole-source ownership.
alter table public.goals
  drop constraint if exists goals_status_check;
alter table public.goals
  add constraint goals_status_check
    check (status in ('active', 'paused', 'ready', 'completed', 'cancelled'));
alter table public.goals
  add column if not exists goal_type text not null default 'save_up',
  add column if not exists initial_principal_snapshot numeric(18, 0),
  add column if not exists legacy_funded_amount numeric(18, 0);
alter table public.goals
  drop constraint if exists goals_goal_type_check;
alter table public.goals
  add constraint goals_goal_type_check
    check (goal_type in ('save_up', 'invest', 'payoff'));
alter table public.goals
  drop constraint if exists goals_initial_principal_snapshot_nonnegative;
alter table public.goals
  add constraint goals_initial_principal_snapshot_nonnegative
    check (initial_principal_snapshot is null or initial_principal_snapshot >= 0);
alter table public.goals
  drop constraint if exists goals_legacy_funded_amount_nonnegative;
alter table public.goals
  add constraint goals_legacy_funded_amount_nonnegative
    check (legacy_funded_amount is null or legacy_funded_amount >= 0);
update public.goals
set legacy_funded_amount = funded_amount
where legacy_funded_amount is null;
comment on column public.goals.funded_amount is
  'Legacy manual progress. Active Goal funding links are the primary derived value.';

create table if not exists public.goal_funding_links (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  source_kind text not null,
  saving_id uuid references public.savings(id) on delete restrict,
  account_id uuid references public.accounts(id) on delete restrict,
  holding_id uuid references public.investment_holdings(id) on delete restrict,
  loan_id uuid references public.loans(id) on delete restrict,
  debt_id uuid references public.liabilities(id) on delete restrict,
  initial_principal_snapshot numeric(18, 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  linked_by uuid references auth.users(id) on delete set null,
  unlinked_at timestamptz,
  unlinked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint goal_funding_links_source_kind_check check (
    source_kind in ('saving', 'savings_account', 'holding', 'loan', 'debt')
  ),
  constraint goal_funding_links_source_shape_check check (
    (source_kind = 'saving' and saving_id is not null and account_id is null and holding_id is null and loan_id is null and debt_id is null)
    or (source_kind = 'savings_account' and saving_id is null and account_id is not null and holding_id is null and loan_id is null and debt_id is null)
    or (source_kind = 'holding' and saving_id is null and account_id is null and holding_id is not null and loan_id is null and debt_id is null)
    or (source_kind = 'loan' and saving_id is null and account_id is null and holding_id is null and loan_id is not null and debt_id is null)
    or (source_kind = 'debt' and saving_id is null and account_id is null and holding_id is null and loan_id is null and debt_id is not null)
  ),
  constraint goal_funding_links_unlink_shape_check check (
    is_active or unlinked_at is not null
  ),
  constraint goal_funding_links_initial_principal_nonnegative check (
    initial_principal_snapshot is null or initial_principal_snapshot >= 0
  )
);
create index if not exists goal_funding_links_goal_active_idx
  on public.goal_funding_links (goal_id, created_at desc)
  where is_active = true;
create unique index if not exists goal_funding_links_active_saving_unique
  on public.goal_funding_links (saving_id)
  where is_active = true and saving_id is not null;
create unique index if not exists goal_funding_links_active_account_unique
  on public.goal_funding_links (account_id)
  where is_active = true and account_id is not null;
create unique index if not exists goal_funding_links_active_holding_unique
  on public.goal_funding_links (holding_id)
  where is_active = true and holding_id is not null;
create unique index if not exists goal_funding_links_active_loan_unique
  on public.goal_funding_links (loan_id)
  where is_active = true and loan_id is not null;
create unique index if not exists goal_funding_links_active_debt_unique
  on public.goal_funding_links (debt_id)
  where is_active = true and debt_id is not null;

alter table public.goal_funding_links enable row level security;
drop policy if exists goal_funding_links_select_member on public.goal_funding_links;
create policy goal_funding_links_select_member on public.goal_funding_links
  for select to authenticated using (public.is_household_member(household_id));
drop policy if exists goal_funding_links_insert_member on public.goal_funding_links;
create policy goal_funding_links_insert_member on public.goal_funding_links
  for insert to authenticated with check (
    public.is_household_member(household_id)
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.household_id = household_id
        and g.status in ('active', 'ready')
    )
  );
drop policy if exists goal_funding_links_update_member on public.goal_funding_links;
create policy goal_funding_links_update_member on public.goal_funding_links
  for update to authenticated using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
grant select, insert, update on public.goal_funding_links to authenticated;

-- Legacy manual progress stays available only for Goals with no active links.
create or replace function public.contribute_to_goal(
  p_goal_id uuid,
  p_amount numeric,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_goal public.goals%rowtype;
  v_contrib_id uuid;
  v_new_funded numeric(18, 0);
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_goal from public.goals g where g.id = p_goal_id for update;
  if not found then raise exception 'Goal not found'; end if;
  if not public.is_household_member(v_goal.household_id) then raise exception 'Forbidden'; end if;
  if exists (select 1 from public.goal_funding_links l where l.goal_id = v_goal.id and l.is_active) then
    raise exception 'Linked goals derive progress from Money sources';
  end if;
  if v_goal.status not in ('active', 'paused', 'ready') then
    raise exception 'Goal is not open for contributions';
  end if;
  v_new_funded := v_goal.funded_amount + p_amount;
  insert into public.goal_contributions (household_id, goal_id, direction, amount, note, created_by)
  values (v_goal.household_id, v_goal.id, 'contribute', p_amount, nullif(trim(coalesce(p_note, '')), ''), v_user_id)
  returning id into v_contrib_id;
  update public.goals
  set funded_amount = v_new_funded,
      legacy_funded_amount = v_new_funded,
      status = case when v_new_funded >= target_amount then 'ready' when status = 'ready' then 'active' else status end,
      updated_at = now()
  where id = v_goal.id;
  return jsonb_build_object('contribution_id', v_contrib_id, 'goal_id', v_goal.id, 'funded_amount', v_new_funded);
end;
$$;
revoke all on function public.contribute_to_goal(uuid, numeric, text) from public;
grant execute on function public.contribute_to_goal(uuid, numeric, text) to authenticated;

-- Application validation is authoritative; this trigger adds database tenancy and
-- semantic protection for direct authenticated writes. Partial unique indexes
-- above resolve concurrent attempts to claim the same whole source.
create or replace function public.enforce_goal_funding_link_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal_household uuid;
  v_goal_type text;
  v_source_household uuid;
begin
  select household_id, goal_type into v_goal_household, v_goal_type
  from public.goals where id = new.goal_id;
  if v_goal_household is null or v_goal_household <> new.household_id then
    raise exception 'Goal and funding source must belong to the same household';
  end if;
  if (v_goal_type = 'payoff' and new.source_kind not in ('loan', 'debt'))
     or (v_goal_type <> 'payoff' and new.source_kind in ('loan', 'debt')) then
    raise exception 'Funding source is incompatible with Goal type';
  end if;
  if new.source_kind = 'saving' then
    select household_id into v_source_household from public.savings where id = new.saving_id;
  elsif new.source_kind = 'savings_account' then
    select household_id into v_source_household from public.accounts where id = new.account_id;
  elsif new.source_kind = 'holding' then
    select household_id into v_source_household from public.investment_holdings where id = new.holding_id;
  elsif new.source_kind = 'loan' then
    select household_id into v_source_household from public.loans where id = new.loan_id;
  elsif new.source_kind = 'debt' then
    select household_id into v_source_household from public.liabilities where id = new.debt_id;
  end if;
  if v_source_household is null or v_source_household <> new.household_id then
    raise exception 'Funding source belongs to another household';
  end if;
  if not new.is_active and new.unlinked_at is null then new.unlinked_at := now(); end if;
  if new.is_active then new.unlinked_at := null; end if;
  return new;
end;
$$;
drop trigger if exists goal_funding_links_integrity on public.goal_funding_links;
create trigger goal_funding_links_integrity
before insert or update on public.goal_funding_links
for each row execute function public.enforce_goal_funding_link_integrity();
revoke all on function public.enforce_goal_funding_link_integrity() from public;
grant execute on function public.enforce_goal_funding_link_integrity() to authenticated;
;
