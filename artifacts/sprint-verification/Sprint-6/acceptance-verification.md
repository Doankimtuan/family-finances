# Acceptance Verification — Sprint 6

## AC-HLT-01 — Health Read-Only Verification (REQ-HLT-01, BR-24)

> **GIVEN** any component in the Health domain executes,  
> **WHEN** score calculation, narrative generation, or trend synthesis runs,  
> **THEN** the operation makes ZERO write calls to database, API, or local state of any operational domain.

| Step | Verification | Result |
|------|--------------|--------|
| GIVEN Health executes | `getHealthDetail`, `getHealthOverview`, `buildHealthInsights`, `computeHealthPulse` | Present |
| WHEN score/insights run | Parallel reads from ledger/plan/inbox | Read-only |
| THEN zero writes | Source scan forbids `.insert/update/upsert/delete/rpc`, Supabase clients | **PASS** |
| THEN zero writes | No `modules/health/application/commands` | **PASS** |
| Automated rejection test | Proxy throws on write methods; ESLint `no-restricted-syntax` | **PASS** |
| Operational domain local state | Health does not mutate ledger/plan/inbox in-memory models at BC boundary | **PASS** |

**AC-HLT-01: PASS** (application-layer enforcement).

### Caveats (non-blocking for AC text)

- `asReadOnlySupabaseClient` is not used in Health read paths today (Health never opens Supabase — stronger than AC requires).
- No Postgres-level RO role (task breakdown item, not AC text).

---

## BR-14 — AI Non-Invention (no standalone GWT in Spec Sync AC list)

Inferred acceptance from story + constitution:

| Criterion | Result | Evidence |
|-----------|--------|----------|
| AI must not invent balances | **PASS** | `assertAiSuggestionGrounded`; insights counts-only |
| AI must not move money without approval | **PASS (unit)** | `assertNoAutonomousMoneyMove` |
| Suggestions auditable | **FAIL** | `recordAiAuditEvent` has zero call sites |
| User explicit confirmation for money actions | **NOT SHIPPED** | No assist UI (deferred) |

---

## ST-E06-003 — GA acceptance (from story catalog + DoD)

Story catalog claims **All ACs**. Sampling critical ACs from prior sprints:

| AC domain | Spot check | Sprint 6 regression proof |
|-----------|------------|---------------------------|
| AC-HLT-01 | Health RO | Constitutional tests — **PASS** |
| AC-CAL-01 (S5) | Calendar merge | Not in Sprint 6 CI scope — **not re-verified** |
| AC-RIT-* (S4) | Autolock / emergency ack | Not in Sprint 6 CI scope — **not re-verified** |
| WCAG / a11y (DoD) | Story DoD | No a11y job — **FAIL** |
| E2E journeys (testing strategy Tier 3) | Playwright | Specs exist; **not in CI** — **FAIL** |

**ST-E06-003 cannot satisfy “All ACs verified”.**

---

## Story-level AC summary

| Story | Board AC status |
|-------|-----------------|
| `ST-E06-001` | **AC-HLT-01 PASS** |
| `ST-E06-002` | **BR-14 guards PASS; audit FAIL** |
| `ST-E06-003` | **FAIL** vs catalog/DoD |
