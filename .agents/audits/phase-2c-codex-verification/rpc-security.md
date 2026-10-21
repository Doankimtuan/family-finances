# Phase 2C — RPC Security and Integrity

## Function permissions

Read-only Supabase MCP catalog inspection after applying the F4 helper migration returned:

| Function                                          | Owner / security               | `search_path` | authenticated | anon   |
| ------------------------------------------------- | ------------------------------ | ------------- | ------------- | ------ |
| `create_loan_with_schedule(...)`                  | `postgres`, `SECURITY DEFINER` | `public`      | execute       | denied |
| `_loan_insert_schedule_entries(uuid,uuid,jsonb)`  | `postgres`, `SECURITY INVOKER` | `public`      | denied        | denied |
| `_loan_insert_rate_periods(uuid,uuid,jsonb,uuid)` | `postgres`, `SECURITY DEFINER` | `public`      | denied        | denied |

The wrapper authenticates the caller, derives their household, and invokes PostgreSQL-only internal helpers. The authenticated direct helper call was rejected with `42501`. Anonymous invocation of the public wrapper was rejected with `42501`. These API-role calls were made with user/anonymous API contexts; catalog inspection alone was not treated as RLS evidence.

## Household access

Account A and Account B are distinct authenticated users in the same test household. Both opened the shared investment and loan through the application; Account B also read the 12 persisted loan installments. These allowed same-household reads passed in browser/API contexts.

Supabase MCP also inspected the deployed RLS policies. `loans_select_member` and `investment_holdings_select` allow reads only when `active_membership_id(household_id)` resolves; `loan_schedule_entries_select_member` checks the parent loan and its household membership. `investment_operations`, `investment_valuations`, and `transactions` use the same active-membership read predicate. `loans_insert_member` uses `can_mutate_financial_resource` in `WITH CHECK`; `loans_update_member` uses it in both `USING` and `WITH CHECK`. These definitions agree with the observed same-household access.

| Test                                                    | Expected                          | Observed                                                                                   | Result  |
| ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ | ------- |
| Authenticated direct call to internal schedule helper   | Deny API-role execution           | RPC returned `42501`.                                                                      | PASS    |
| Anonymous call to public loan wrapper                   | Deny unauthenticated creation     | RPC returned `42501`.                                                                      | PASS    |
| Account B reads Account A’s household loan and schedule | Permit shared household access    | Browser opened the shared loan; authenticated read returned all 12 rows.                   | PASS    |
| Account B reads the new shared investment               | Permit shared household access    | Browser detail showed the same 7,200,000 VND value and 800,000 VND realized gain.          | PASS    |
| Foreign-household denial                                | Deny a user outside the household | Not run: no second household exists, and creating one was outside the authorized boundary. | BLOCKED |

## Financial integrity exploit

The public authenticated loan RPC was sent a two-installment schedule for a VND 12,000,000 loan marked 12% annual fixed, reducing balance. Each installment paid VND 6,000,000 principal and zero interest; all totals and remaining balances reconciled internally. Expected: reject and roll back because interest must be computed from the loan rate. Observed: the existing helper accepted and persisted the schedule. **FAIL — confirmed policy-integrity vulnerability.** The run-scoped loan was deleted afterward; current loan and schedule counts are zero.

The local follow-up migration [`20261021033728_loan_schedule_policy_validation.sql`](../../../supabase/migrations/20261021040820_loan_schedule_policy_validation.sql) adds policy recomputation and matching rate-period checks. It was not deployed because the Phase 2C brief did not authorize further schema changes. Phase 2D later applied it to the authorized test project; see the [Phase 2D migration reconciliation](../phase-2d-loan-integrity/migration-reconciliation.md).

## Risk

Until the follow-up migration is authorized, reviewed, applied to the dev/test target, and exercised with the same manipulated schedule, authenticated direct RPC callers can persist schedules whose financial terms contradict the loan’s interest strategy. F4 is therefore not FIXED IN TEST and must not be considered production-fixed.
