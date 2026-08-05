# Blocking Issues — Sprint 6

Must resolve before `v2.1-GA` product sign-off and before marking Sprint 6 stories **COMPLETE**.

---

## B1 — GA CI missing Playwright smoke

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Story | ST-E06-003 |
| Tasks | TSK-E06-003-FE, TSK-E06-003-QA |
| Rules | `testing-strategy.md` Tier 3; Sprint DoD automated regression |
| Symptom | 27 Playwright specs including `health-insights.smoke.spec.ts`; **not run on mainline CI** |
| Evidence | `.github/workflows/ci.yml` — only lint, typecheck, unit, constitution |
| Required outcome | Add CI job running at minimum smoke subset (health-insights, home-dashboard, plan-month-ritual, inbox-decisions) with credential skip handling documented |

---

## B2 — No Tier 2 integration proof for Health orchestration

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Story | ST-E06-001, ST-E06-003 |
| Tasks | TSK-E06-001-QA (integration facet), TSK-E06-003-BE |
| Rules | Story DoD: AC via integration/E2E; testing-strategy Tier 2 |
| Symptom | Constitutional tests prove static scan + proxy; **no test** exercises `getHealthDetail()` merged read path with mocked ledger/plan/inbox |
| Evidence | Only unit tests on sub-functions; no `get-health-detail` integration spec |
| Required outcome | One Vitest integration-style test asserting Health detail aggregates facts without calling write APIs; optionally assert guardrail insight present |

---

## B3 — AI audit logger not operational

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Story | ST-E06-002 |
| Tasks | TSK-E06-002-DB (partial), TSK-E06-002-BE |
| Rules | BR-14; story title “Audit Logger” |
| Symptom | `recordAiAuditEvent` defined in `ai-audit.ts` but **zero production call sites** |
| Evidence | Grep shows usage only in schema unit test; table exists remotely |
| Required outcome | Wire audit on at minimum: (1) `assertAiSuggestionGrounded` failure in `buildHealthInsights` → `POLICY_BLOCK`; (2) future-proof helper wrapping guard results. Log `surface: "health.insights"` |

---

## Non-blocking (tracked)

| ID | Issue |
|----|-------|
| N1 | Postgres Health-RO DB role (TD-S6-01 / KI-S6-01) |
| N2 | Bundle size CI job (TD-S6-04) |
| N3 | AI suggestion confirmation UI when assist surface ships (KI-S6-03) |
| N4 | `GET /api/v2/health/score` REST adapter vs RSC (traceability drift) |
| N5 | `asReadOnlySupabaseClient` unused — wire at platform read boundary or document |
| N6 | Sprint 5 formal re-verification after fixes-applied |
| N7 | Spec-track vs rewrite ST-E06-* ID collision (KI-S6-04) |

---

## Sprint / milestone readiness

| Question | Answer |
|----------|--------|
| Is `v2.1-GA` ready? | **No** until B1–B3 closed |
| Reopen Sprint 6? | **Yes — required-fix reopen** |
| Is execution FREEZE trustworthy? | **No** for GA purposes |
| Spec-track complete after fixes? | Yes — EPIC 6 is final Spec epic |
