-- One-row Home savings read model.
-- SECURITY INVOKER preserves savings/saving_cycles RLS for the caller.
create or replace function public.get_home_savings_summary()
returns table(
  active_count bigint,
  principal numeric,
  upcoming_maturity_count bigint,
  action_required_count bigint,
  nearest_maturity_date date
)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with current_cycles as (
    select distinct on (sc.saving_id)
      sc.saving_id,
      sc.status,
      sc.cycle_number,
      sc.end_date,
      sc.principal
    from public.savings s
    join public.saving_cycles sc on sc.saving_id = s.id
    where s.status not in ('closed', 'early_closed')
      and sc.status in ('active', 'matured')
      and public.active_membership_id(s.household_id) is not null
    order by
      sc.saving_id,
      case when sc.status = 'active' then 0 else 1 end,
      sc.cycle_number desc
  )
  select
    count(*) filter (where status = 'active') as active_count,
    coalesce(sum(principal) filter (where status = 'active'), 0) as principal,
    count(*) filter (where status = 'active') as upcoming_maturity_count,
    count(*) filter (where status = 'matured') as action_required_count,
    min(end_date) filter (where status = 'active') as nearest_maturity_date
  from current_cycles;
$function$;

revoke all on function public.get_home_savings_summary() from public;
grant execute on function public.get_home_savings_summary() to authenticated;
