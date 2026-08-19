-- Prompt 15B: close unintended SECURITY DEFINER execution.
--
-- Public-schema functions are owned by postgres in the linked project. The
-- live default ACL granted anon/authenticated to every new function, so this
-- migration hardens both existing functions and the creation default.

do $$
declare
  v_signature text;
begin
  for v_signature in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon',
      v_signature
    );
  end loop;
end;
$$;

-- Explicit anonymous API: invitation preview only. It is read-only and
-- token-scoped; all invitation mutation functions require auth.uid().
grant execute on function public.get_invitation_preview(uuid) to anon;

-- Internal-only SECURITY DEFINER functions. Parent RPCs and triggers execute
-- as their owner, so ordinary authenticated clients do not need direct ACLs.
do $$
declare
  v_signature text;
begin
  for v_signature in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname = any (
        array[
          '_loan_insert_rate_periods',
          '_loan_insert_schedule_entries',
          '_loan_replace_upcoming_schedule',
          'autolock_resolve_unmapped_for_period',
          'ensure_miscellaneous_jar',
          'enforce_goal_funding_link_integrity',
          'get_or_create_savings_product_account',
          'guard_cross_resource_mutation',
          'guard_financial_root_mutation',
          'guard_goal_funding_link_mutation',
          'guard_historical_jar_period_rule_snapshot',
          'guard_inbox_source_mutation',
          'guard_ownership_immutable',
          'guard_transaction_mutation',
          'prevent_owned_membership_delete',
          'assert_financial_mutation',
          'run_month_ritual_autolock_for_household',
          'run_month_ritual_autolock_worker_all'
        ]
      )
  loop
    execute format(
      'revoke execute on function %s from authenticated',
      v_signature
    );
  end loop;
end;
$$;

-- Future public-schema functions must opt in explicitly to client execution.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- P1 carried by 15A: pin the trigger function's role search path.
alter function public.transactions_set_is_reversal()
  set search_path = public;
