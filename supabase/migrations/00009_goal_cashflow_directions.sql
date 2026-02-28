-- ============================================================================
-- 00009_goal_cashflow_directions.sql
-- Adds inflow/outflow direction and explicit destination account to goal flows.
-- ============================================================================

alter table public.goal_contributions
  add column if not exists flow_type text not null default 'inflow';

alter table public.goal_contributions
  add column if not exists destination_account_id uuid references public.accounts(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'goal_contributions_flow_type_check'
      and conrelid = 'public.goal_contributions'::regclass
  ) then
    alter table public.goal_contributions
      add constraint goal_contributions_flow_type_check
      check (flow_type in ('inflow', 'outflow'));
  end if;
end
$$;

alter table public.goal_contributions
  drop constraint if exists goal_contributions_flow_shape_check;

alter table public.goal_contributions
  add constraint goal_contributions_flow_shape_check
  check (
    (flow_type = 'inflow' and source_account_id is not null and destination_account_id is null)
    or
    (flow_type = 'outflow' and source_account_id is null and destination_account_id is not null)
  ) not valid;

create index if not exists idx_goal_contributions_source_account
  on public.goal_contributions (household_id, source_account_id, contribution_date desc);

create index if not exists idx_goal_contributions_destination_account
  on public.goal_contributions (household_id, destination_account_id, contribution_date desc);
