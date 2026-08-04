# Blocking Issues — Sprint 1

These **must** be resolved before Sprint 2 starts and before marking Sprint 1 stories COMPLETE / FREEZE as authoritative.

---

## B1 — Legacy mutate-in-place defeats BR-02 / BR-03

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | BR-02, BR-03, Story ST-E01-003 permanence |
| Symptom | Posted transactions can still be rewritten without audit chain |
| Evidence | `modules/ledger/application/commands/update-transaction.ts` calls `update_transaction`; UI `app/.../transactions/[id]/page.tsx` Legacy edit; grant in `20260802140000_ledger_transaction_update_delete.sql`; Sprint 1 migration does not revoke; unit test asserts success |
| Required outcome | Authenticated clients cannot change financial fields in place; Correct/Refund are the only money-change paths |

---

## B2 — Refund / reversal income exclusion missing

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | ST-E01-002 business value; REQ-JAR-01 intent; Business Evolution refund lifecycle S2; financial meaning |
| Symptom | Refunds inserted as `type='income'` with no `is_reversal` (or equivalent) and no consumer exclusion |
| Evidence | `supabase/migrations/20260803220000_sprint1_category_jar_refund_correction.sql` refund insert `'income'`; correction reversal also income-shaped; no ledger filter excluding `reverses_transaction_id` from income totals |
| Required outcome | Refunds/reversals restore jar capacity **and** are excluded from monthly income aggregations / allocate-income inputs |

---

## B3 — AC GWT not verified at Integration/E2E tier

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** (Story DoD) |
| Rules | `definition-of-done.md` Story DoD; testing-strategy Tier 2 |
| Symptom | Pack claims AC coverage; tests mock RPC / exercise policy only |
| Evidence | `tests/unit/sprint1-core-contracts.integration.test.ts` `vi.mock` Supabase; no Playwright for refund/correct/category |
| Required outcome | At least one live DB (or SQL contract) test per AC-CAT-01 / AC-TRN-01 / AC-TRN-02 proving persisted fields + statuses; preferred plus minimal Playwright smoke |

---

## B4 — Migration / staging not verified

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** (Sprint DoD) |
| Rules | Sprint DoD “Staging deployment verified” |
| Symptom | SQL in repo; not applied/verified this session |
| Evidence | `artifacts/sprint-execution/Sprint-1/known-issues.md` item 1 |
| Required outcome | Apply `20260803220000_sprint1_category_jar_refund_correction.sql` to target env; smoke refund/correct/category against live DB |

---

## Non-blocking (tracked, not Sprint-2 start blockers alone)

- TD-S1-02 system category null jar  
- Audit chain not expander  
- No inline jar create on category form (REQ-CAT-02 OR already satisfied)  
- Roadmap EO-04 vs Implementation Planning sequencing (process)  
- Form/query string duplication  

---

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 2 start? | **No** until B1–B4 closed |
| Reopen Sprint 1? | **Yes — required-fix reopen**, not full redesign |
| Freeze pack trustworthy as COMPLETE? | **No** — supersede status after fixes |
