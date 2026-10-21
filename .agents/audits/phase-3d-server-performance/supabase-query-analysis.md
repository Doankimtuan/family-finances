# Phase 3D — Supabase query analysis

## Target and row counts

Supabase MCP verified the named development/testing project before diagnostics. Before fixture setup, counts were: households 1, household members 2, accounts 3, transactions 11, Inbox items 3, jars 5, jar plans 1, jar-period snapshots 0, liabilities 0, loans 0, loan payments 0, loan schedule entries 0, recurring rules 0. The disposable E2E household raised the expected household/account/jar counts while the browser ran. After cleanup, every listed count returned to the pre-run value and the `E2E 23D1` household count was zero.

## Inbox plan and indexes

The authenticated Inbox page query is bounded to 26 rows and scopes by household, pending status, supported kinds, and unassigned-or-current-user assignment; it sorts by `created_at DESC, id DESC`. The Plan emergency banner uses a similarly scoped open-item query bounded to 25 rows.

The existing indexes include:

- `inbox_items_open_read_cursor_idx (household_id, status, created_at DESC, id DESC) WHERE status = 'pending'`
- `inbox_items_open_unread_idx (household_id, status) WHERE status = 'pending' AND read_at IS NULL`
- `idx_inbox_items_household_status (household_id, status, created_at DESC)`
- `jar_plans_household_idx (household_id)` and `jar_plans_jar_unique (jar_id)`
- `jar_period_rule_snapshots_household_period_idx (household_id, period_month)`

Read-only `EXPLAIN (ANALYZE, BUFFERS)` of the Inbox page predicate used `inbox_items_open_read_cursor_idx`, with 5 shared-buffer hits and 0.159 ms execution time. The synthetic household had no Inbox rows, so this verifies index selection and empty-queue execution only; it does not establish performance at production-scale cardinality. The planner kept kind and assignment checks as filters after the household index condition.

The prior Phase 3C handoff suggested another `(household_id, status, created_at DESC)` Inbox index. That exact general index already exists, and the more specific pending cursor index served the measured page query. No index migration is justified.

## Plan RPC execution

`get_plan_jar_budget_raw_inputs(p_now timestamptz)` is a stable, invoker-rights SQL function. It obtains the active household through `investment_active_household()`, selects current and previous period inputs, and returns jars, transactions, loan-payment IDs, recurring income, snapshots, and adjustments in one JSON value.

With the fixture user's JWT subject set only to scope the active-household function, read-only `EXPLAIN ANALYZE SELECT get_plan_jar_budget_raw_inputs(now())` completed in 25.008 ms and recorded 1,765 shared-buffer hits. The plan's function body is opaque in ordinary `EXPLAIN`; this elapsed value includes its execution on the tiny test database. The separate authenticated browser traces measured the PostgREST RPC request at 276–315 ms median on warm Plan transitions (route-specific p95 ranged to 623 ms). The difference is API/network time plus server path work, not evidence of a slow SQL execution.

The MCP SQL session is privileged. Its plans and timing are diagnostic only and are not used as proof of RLS behavior. The browser used ordinary authenticated app sessions.

## Database conclusion

The measured queue uses its existing cursor index, the Plan RPC executes in about 25 ms on this fixture, and relevant relations contain only a few rows. Historical sequential-scan counters on such small tables are not a tuning signal. No migration, index, RPC, RLS, or policy change is warranted by this evidence.

## Source of index definitions

The test project's live index catalog was read through Supabase MCP. The matching baseline definitions are also present in [the frozen schema migration](../../../supabase/migrations/20260825125516_v1_baseline.sql).
