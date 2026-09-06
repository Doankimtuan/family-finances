-- Preserve the existing authorization predicates while avoiding repeated JWT
-- evaluation and duplicate permissive-policy planning.
alter policy "household_invitations_select_member"
on public.household_invitations
using (
  is_household_member(household_id)
  or lower(email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
);

drop policy if exists "investment_events_select_12b"
on public.investment_events;

alter policy "investment_events_select"
on public.investment_events
using (
  (active_membership_id(household_id) is not null)
  or is_household_member(household_id)
);

drop policy if exists "investment_lots_select_12b"
on public.investment_lots;

alter policy "investment_lots_select"
on public.investment_lots
using (
  exists (
    select 1
    from investment_holdings h
    where h.id = investment_lots.position_id
      and active_membership_id(h.household_id) is not null
  )
  or is_household_member(household_id)
);
