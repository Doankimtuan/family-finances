# Phase 3D — financial and RLS regression

## Financial integrity

The change reuses the `PlanPulse` derived from the same raw jar rows already used by the budget mapper. It does not modify qualifying income, monthly periods, jar rules, posted transactions, loan-payment treatment, balances, or mutation behavior. If the budget RPC cannot produce a summary, the page still calls the independent pulse read and preserves the prior fallback.

The focused budget tests assert the pulse jar identity and the Plan fallback/concurrency behavior (4 files, 22 tests). The full suite passed: 271 files and 1,882 tests, including existing financial lifecycle, ownership/RLS, and RPC ACL contracts. Phase 2D's authenticated loan and cross-household regression remains the latest runtime evidence for foreign-household reads/writes and RPC policy enforcement; see [Phase 2D cross-household security](../phase-2d-loan-integrity/cross-household-security.md).

## Auth and household boundary

The browser logged in as a scoped synthetic fixture user and opened the five app routes through the normal server session and active-membership gate. This optimization adds no query, RPC, or client-side data access path; it removes one duplicate query after the existing budget RPC has already scoped and returned its inputs. No service-role client is used by ordinary page reads.

Existing ownership/RLS and RPC contract tests passed. A new two-user cross-household browser denial case was not run because the access path and policies were unchanged. Privileged MCP SQL was used only for read-only plans, counts, and timing, never as RLS proof.

## Fixture and database integrity

The authorized test fixture created one synthetic auth user and household for browser reads. It was deleted through the fixture's ownership-checked cleanup. Supabase confirmed zero matching fixture households and restored counts: 1 household, 2 members, 3 accounts, 11 transactions, 3 Inbox items, 5 jars, 1 jar plan, 0 snapshots, and 0 loans or loan schedule rows. The benchmark created no financial transactions or ledger mutations. No migration was applied.

## Verdict

PASS for the changed read-model path and financial semantics. Existing access-control contracts remain green. No new database or RLS behavior is claimed.
