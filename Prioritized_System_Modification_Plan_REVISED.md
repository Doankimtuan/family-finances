# Revised Task List (Data-Safe)

This revision removes:
- `rpc_cashflow_forecast_90d`
- all Financial Jar functions/workflows
- all cash-flow forecast functions/workflows
- all insights-related functions/workflows
- all financial-health-related functions/workflows

## Non-Negotiable Data Safety Rules
- Do **not** `DROP TABLE`, `TRUNCATE`, or delete production financial records.
- Do **not** migrate or rewrite historical transactions, billing, liabilities, goals, or snapshots.
- Use **feature flags + route/API deactivation first**, then remove code paths.
- If a DB function must be removed, remove only executable objects (function/view), not transactional data.

## Revised Priority Tasks

### TASK-R001 — Add Kill-Switch Flags for Removed Modules (P1)
- Add env/config flags to disable `jars`, `cashflow_forecast`, `insights`, `financial_health`.
- Wire flags in route guards and UI navigation.
- Acceptance: disabled modules are unreachable from nav and direct route access.

### TASK-R002 — Disable Cash-Flow Forecast API and UI Entry Points (P1)
- Remove/disable `app/api/cash-flow/forecast/route.ts` usage and forecast card rendering in `app/cash-flow/page.tsx`.
- Keep existing non-forecast cash-flow baseline form intact.
- Acceptance: `/cash-flow` still works; no forecast fetch is triggered.

### TASK-R003 — Remove `rpc_cashflow_forecast_90d` Callers, Then Drop Function (P1)
- Create migration to drop `public.rpc_cashflow_forecast_90d(uuid,date,integer)` **after** callers are removed.
- Keep all source tables and data (`transactions`, `recurring_rules`, `card_billing_months`, etc.) untouched.
- Acceptance: no app code references the RPC; DB function no longer exists.

### TASK-R004 — Disable Financial Jar Mutations and Hide Jar Module (P1)
- Disable jar routes/components/actions (`app/jars/*`, jar forms/actions) behind feature flag.
- Remove jar links from dashboard/navigation.
- Acceptance: no jar write action can execute; existing jar data remains unchanged in DB.

### TASK-R005 — Remove Jar Reconciliation Function Calls (P1)
- Remove caller paths for `rpc_jar_reconciliation_month` and related UI triggers.
- Optionally drop the RPC function via migration only (keep tables/data).
- Acceptance: no runtime call to jar reconciliation RPC.

### TASK-R006 — Disable Insights APIs and UI Surfaces (P1)
- Remove/hide usage of `app/api/insights/check/route.ts`, `app/api/ai-insights/*`, and dashboard insights panel rendering.
- Keep AI/insight tables as historical records; no destructive data operation.
- Acceptance: no insight API is called from active UI routes.

### TASK-R007 — Disable Financial Health Computation Hooks (P1)
- Remove calls to `calculateAndPersistHealthSnapshot` from dashboard/API paths.
- Ensure dashboard loads without health payload dependency.
- Acceptance: dashboard works with `health` omitted/null, no runtime error.

### TASK-R008 — Clean Contracts/Types for Removed Modules (P2)
- Update `lib/dashboard/types.ts`, API response contracts, and components to remove disabled module fields.
- Remove dead imports/usages.
- Acceptance: lint/build passes with no references to disabled modules.

### TASK-R009 — Add Regression Guardrails for “No Data Impact” (P2)
- Add tests asserting no mutation/deletion of production financial tables during module deactivation.
- Verify disabled routes return controlled response (404/feature-disabled).
- Acceptance: tests pass and prove data retention.

## Retained Functional Tasks (Still In Scope)

### TASK-R010 — Keep TASK-001 (Essential Spending Source Fix)
- Retain and execute as-is.

### TASK-R011 — Keep TASK-002 (Savings Rate 6M Avg + MoM)
- Retain and execute as-is.

### TASK-R012 — Keep TASK-007 (TDSR Metric)
- Retain and execute as-is.

### TASK-R013 — Keep TASK-008 (Liquidity Ratio)
- Retain and execute as-is.

### TASK-R014 — Keep TASK-009 (Gold Valuation)
- Retain and execute as-is.

### TASK-R015 — Keep TASK-010 (Mortgage Transition Modeler)
- Retain and execute as-is.

### TASK-R016 — Keep TASK-012 (Installment Overload Aggregate)
- Retain and execute as-is.

### TASK-R017 — Keep TASK-013 (Installment Lifetime Cost Disclosure)
- Retain and execute as-is.

### TASK-R018 — Keep TASK-015 (Remove `remaining_amount`)
- Retain and execute as-is.

### TASK-R019 — Keep TASK-016 (Cashback Simplification)
- Retain and execute as-is.

## Tasks Removed from Original Plan
- Original TASK-003, TASK-004 (Financial Jars)
- Original TASK-005, TASK-006 (Cash-flow Forecast)
- Original TASK-011, TASK-014 (Jar/Insights behavioral loops)
- Original TASK-017, TASK-018, TASK-019 (Insights/AI module)
- Original TASK-020 (Guardrails tied to removed modules; replaced by TASK-R009)

## Recommended Execution Order (First 8)
1. TASK-R001
2. TASK-R002
3. TASK-R004
4. TASK-R006
5. TASK-R007
6. TASK-R003
7. TASK-R005
8. TASK-R009
