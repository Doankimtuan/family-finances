-- PLAN 12 correction: qualify both Goal funding RLS policy references.
drop policy if exists goal_funding_links_insert_member on public.goal_funding_links;
create policy goal_funding_links_insert_member on public.goal_funding_links
  for insert to authenticated with check (
    public.is_household_member(goal_funding_links.household_id)
    and exists (
      select 1
      from public.goals g
      where g.id = goal_funding_links.goal_id
        and g.household_id = goal_funding_links.household_id
        and g.status in ('active', 'ready')
    )
  );
