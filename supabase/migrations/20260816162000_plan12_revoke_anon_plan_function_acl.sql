-- PLAN 12 correction: Plan RPCs and trigger helpers must not be callable by anon.
revoke execute on function public.contribute_to_goal(uuid, numeric, text) from anon, public;
revoke execute on function public.enforce_goal_funding_link_integrity() from anon, public;
revoke execute on function public.guard_historical_jar_period_rule_snapshot() from anon, public;
revoke execute on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) from anon, public;
revoke execute on function public.reassign_goal_funding_source(uuid, uuid, uuid) from anon, public;
revoke execute on function public.change_goal_lifecycle(uuid, text) from anon, public;

grant execute on function public.contribute_to_goal(uuid, numeric, text) to authenticated;
grant execute on function public.reallocate_jar_capacity(uuid, uuid, numeric, boolean, text) to authenticated;
grant execute on function public.reassign_goal_funding_source(uuid, uuid, uuid) to authenticated;
grant execute on function public.change_goal_lifecycle(uuid, text) to authenticated;
