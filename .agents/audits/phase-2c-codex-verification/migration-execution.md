# Phase 2C — Migration Execution

## Authorized F4 migration

**Status:** Applied to the verified dev/test project; happy-path runtime execution PASS.

Before applying, Supabase MCP confirmed the project ref, loan-related tables and columns, missing helper signature, wrapper signature, and function ACLs. The existing migration [`20261021020424_loan_insert_schedule_entries.sql`](../../../supabase/migrations/20261021031855_loan_insert_schedule_entries.sql) was reviewed for its parent-household check, installment shape and arithmetic validation, `SECURITY INVOKER`, pinned `search_path`, and helper-only PostgreSQL grant. It creates/replaces the helper and does not rewrite existing financial rows.

Supabase MCP applied the authorized migration successfully. Remote migration history records the name `loan_insert_schedule_entries` at version `20261021031855`. The local source filename carries version `20261021020424`; this local/remote version mismatch is recorded as migration-history drift and must be reconciled before a routine CLI push. No migration repair or additional DDL was run.

After application, MCP confirmed:

- `create_loan_with_schedule(...)` exists, is owned by `postgres`, is `SECURITY DEFINER`, pins `search_path=public`, grants `authenticated`, and denies `anon`.
- `_loan_insert_schedule_entries(uuid,uuid,jsonb)` exists, is owned by `postgres`, is `SECURITY INVOKER`, pins `search_path=public`, and denies `authenticated` and `anon`.
- `_loan_insert_rate_periods(uuid,uuid,jsonb,uuid)` is owned by `postgres`, pins `search_path=public`, and denies API-role execution.
- The wrapper calls the unchecked creation routine, which invokes both helpers.

## PostgreSQL runtime cases

The valid API call created a two-installment VND 12,000,000 reducing-balance loan at 12%: principal 6,000,000 + interest 120,000, then principal 6,000,000 + interest 60,000. Total interest was 180,000 and repayment was 12,180,000. Both schedule rows persisted. Replaying the same idempotency key returned the same loan and did not add a loan or schedule row. Account B read the same loan and rows through authenticated access.

Each malformed case was sent through the authenticated public RPC and rejected before persistence; targeted checks found no matching loan row afterward:

| Input                             | Expected             | Observed                        | Result |
| --------------------------------- | -------------------- | ------------------------------- | ------ |
| Wrong principal total             | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Invalid interest scalar (`"NaN"`) | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Missing installment               | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Duplicate installment number      | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Fractional sequence               | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Nonnumeric JSON amount            | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Incorrect repayment total         | Reject and roll back | Rejected (`22023`); no loan row | PASS   |
| Invalid calendar date             | Reject and roll back | Rejected (`22008`); no loan row | PASS   |

The additional test for a structurally valid but policy-invalid schedule did **not** pass: the RPC accepted a zero-interest schedule for a 12% loan when its principal, totals, and balances reconciled internally. The test loan was removed by exact run scope. This is the unresolved financial integrity defect; see [RPC security](rpc-security.md) and [financial reconciliation](financial-reconciliation.md).

## Follow-up migration

The smallest follow-up was prepared locally in [`20261021033728_loan_schedule_policy_validation.sql`](../../../supabase/migrations/20261021040820_loan_schedule_policy_validation.sql). It recomputes each installment from the loan’s repayment method and rate strategy, and validates the initial rate-period rows against the loan terms before insertion. The targeted migration contract test, migration freeze validator, TypeScript check, and formatter pass.

The Phase 2C brief does not authorize this additional schema migration. It was not applied remotely, so its SQL has not been executed by PostgreSQL. No rollback was attempted for the applied F4 helper: dropping it would break the existing public wrapper. No production deployment was performed.

A final read-only `pg_get_functiondef` check confirmed the remote helper still contains the original internal-consistency-only shortcut and does not contain the local policy recomputation. The authenticated exploit therefore remains possible in the connected test project until the follow-up migration is separately authorized and applied.
