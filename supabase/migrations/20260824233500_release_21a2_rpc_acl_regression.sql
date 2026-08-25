-- RELEASE 21A.2: invitation preview is the only anonymous RPC exception.
revoke all on function public.get_investment_home_summary_inputs() from public, anon;
grant execute on function public.get_investment_home_summary_inputs() to authenticated;

revoke all on function public.is_month_ritual_locked(uuid, date) from public, anon;
grant execute on function public.is_month_ritual_locked(uuid, date) to authenticated;

-- A clean public-schema replay must preserve service-role access for server-side
-- bootstrap and administrative data paths.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to service_role;

grant select, insert on public.goal_period_funded_snapshots to authenticated;
grant select, insert on public.jar_period_adjustments to authenticated;
grant select, insert on public.jar_period_rule_snapshots to authenticated;

revoke all on function public.enforce_active_jar_on_transaction() from public, anon, authenticated;
revoke all on function public.transactions_set_is_reversal() from public, anon, authenticated;
revoke all on function public.validate_credit_card_installment_source() from public, anon, authenticated;
revoke all on function public.validate_transaction_tag_assignment() from public, anon, authenticated;
