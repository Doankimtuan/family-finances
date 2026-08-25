-- RELEASE 21A.2: invitation preview is the only anonymous RPC exception.
revoke all on function public.get_investment_home_summary_inputs() from public, anon;
grant execute on function public.get_investment_home_summary_inputs() to authenticated;

revoke all on function public.is_month_ritual_locked(uuid, date) from public, anon;
grant execute on function public.is_month_ritual_locked(uuid, date) to authenticated;
