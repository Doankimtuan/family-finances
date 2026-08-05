# Business Verification — Sprint 6

## Scope

EPIC 6 enforces **BR-24** (Health-RO), **BR-14** (AI non-invention), and claims **GA hardening** across all business rules.

## BR-24 — Health Read-Only Policy

| Check | Result | Evidence |
|-------|--------|----------|
| Health never writes ledger/jars | **PASS** | `getHealthDetail()` only calls read queries: `getRealPosition`, `getPlanPulse`, `listOpenInboxItems`, `listRecentTransactions` |
| Health never persists scores | **PASS** | No DB tables or insert paths under `modules/health/` |
| Health cannot trigger money movement | **PASS** | No command imports; ESLint blocks `commands/**` |
| Mathematical DB RO connection | **DEFERRED** | No Postgres SELECT-only role; app-level enforcement only (KI-S6-01) |

**Financial correctness:** Health score is derived from **counts** (`accountCount`, `activeJarCount`, `openInboxCount`) in `computeHealthPulse` — not invented balances. Insights use counts-only ICU params via `assertAiSuggestionGrounded({ countsOnly: true })`.

## BR-14 — AI Non-Invention Policy

| Check | Result | Evidence |
|-------|--------|----------|
| Suggestions grounded in verified facts | **PASS** | `buildHealthInsights` gates every insight/scenario |
| No invented amounts in Health copy | **PASS** | Params are numeric counts only; `AI_GUARDRAIL` insight always present |
| No autonomous money moves | **PASS (library)** | `assertNoAutonomousMoneyMove` exists and tested |
| Audit trail for suggestions/approvals | **PARTIAL** | Table + RPC exist; **no production call sites** |
| Explicit user confirmation before money action | **N/A / DEFERRED** | No LLM assist surface; task `TSK-E06-002-FE` not shipped |

## BR-01 — Real Ledger ≠ Virtual Jars

Health reads real position and plan pulse separately — no merge. **PASS** (unchanged; not regressed).

## GA / “All BRs” claim (ST-E06-003)

Story catalog assigns ST-E06-003 **All BRs (BR-01 through BR-24)**. Sprint 6 did **not** re-audit or regression-test every BR end-to-end. Constitutional tests cover BR-24/BR-14 slices only.

**Business verdict:** Core Health-RO and AI-guard **intent is correct**. GA “all rules verified” claim is **not substantiated**.

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Future dev adds Supabase to Health | Medium | Proxy exists but is **not wired**; reliance on lint + scan |
| Audit gap on policy blocks | Medium | Blocks are silent in `ai_audit_logs` |
| Overstated GA readiness | High | Product may sign off `v2.1-GA` prematurely |

## Business score contribution

**7.5 / 10** — Strong BR-24/BR-14 foundation; audit integration and GA breadth gaps prevent full pass.
