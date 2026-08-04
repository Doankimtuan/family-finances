# Blocking Issues — Sprint 4

Must resolve before Sprint 5 starts and before marking Sprint 4 stories COMPLETE.

---

## B1 — No daily background worker (AC-RIT-01 WHEN / Tech Spec §2.1)

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | AC-RIT-01; Tech Spec v2.1 §2.1 (01:00 UTC); TSK-E04-001-BE “scheduled background worker”; REQ-RIT-01 |
| Symptom | Autolock only when a member opens `/plan/ritual` |
| Evidence | `app/.../plan/ritual/page.tsx` `void runMonthRitualAutolockWorker()`; KI-S4-01; no `cron.schedule` in Sprint 4 migration |
| Required outcome | Scheduled invocation (pg_cron / Edge / platform cron) calling a **service-safe** worker that covers all due households without requiring UI traffic |

---

## B2 — Auto-lock does not lock Jar allocations for the locked period (AC-RIT-01 THEN / BR-08)

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | AC-RIT-01 THEN; BR-08; Month Lifecycle v2 Step 4 “locking all Jar allocations and category mappings against retro-active editing” |
| Symptom | By the time January is due for auto-lock, current period is March; plan mutations only assert current period; past `pending_review` unused |
| Evidence | `assert-plan-unlocked.ts` defaults `currentPeriodMonth()`; all plan commands omit past period; `is_month_ritual_locked` never called from app |
| Required outcome | Define and enforce period-correct immutability: either (a) plan mutations blocked when **any** open historical period is `pending_review`/`approved` without correction, or (b) period-scoped plan versions with writes gated by that period’s ritual status — plus wire SQL helper or equivalent into write paths. Board will not waive AC-RIT-01 unilaterally. |

---

## B3 — AC / DoD tests missing for all three stories

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | `testing-strategy.md` Tier 2–3; TSK-E04-001-QA / 002-QA / 003-QA |
| Symptom | Helper unit tests sold as AC proof |
| Evidence | `tests/unit/plan-month-ritual.test.ts`; no integration for RPC; e2e smoke unchanged |
| Required outcome | At least: (1) integration/RPC test: due period → `pending_review` + unmapped resolve count; (2) divergence blocks preview; (3) streak 5→6 unlocks Quick Close path (DB or integration) |

---

## B4 — REQ-RIT-02 mandatory emergency reflection unmet

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** (story ST-E04-003) |
| Rules | REQ-RIT-02; EVO-06 “prompts both partners to review” |
| Symptom | Emergency list optional; approve/Quick Close not gated |
| Evidence | `ritual-wizard.tsx` emergency section only if `emergencies.length > 0`; no acknowledge flag |
| Required outcome | Hard gate or explicit acknowledge before Assisted approve / Quick Close when emergencies exist (product-minimal: checkbox / “reviewed” flag persisted) |

---

## Related carryover (not Sprint 4 sole ownership)

| ID | Issue | Note |
|----|-------|------|
| Sprint 2 B2 | AC-JAR-02 partner device notification | Catalog maps AC-JAR-02 onto ST-E04-003 — still open; Spec amend or ship channel |
| TD-V4-02 | Months with no ritual & no unmapped never lock | Fix with B1/B2 worker semantics |

---

## Non-blocking (tracked)

- Divergence deep-link (KI-S4-02 / TD-S4-02)
- Quick Close dual-approve (KI-S4-03) — Spec preference; Alpha may match Assisted
- Richer autolock preview_json (TD-S4-03)
- Correction should reset streak (recommend with B fixes)
- Fail-open `assertPlanPeriodUnlocked` (fix with B2)

---

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 5 start? | **No** until B1–B4 closed |
| Reopen Sprint 4? | **Yes — required-fix reopen** |
| Freeze pack trustworthy as COMPLETE? | **No** |
