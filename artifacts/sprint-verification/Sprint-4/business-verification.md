# Business Verification — Sprint 4

## Scope

Financial / household-planning correctness for BR-08, BR-09, BR-12 (ritual gate), BR-15 (month-lock half), BR-23, and Month Lifecycle v2 Steps 1 / 3 / 4.

---

## BR-08 — Month Lock & 30-Day Auto-Lock

| Check | Result | Evidence |
|-------|--------|----------|
| Status transition to Spec `PendingReview` | **PARTIAL** | SQL sets `pending_review`; only when authenticated member opens `/plan/ritual` (or manually invokes RPC) |
| Daily background execution | **FAIL** | No pg_cron / Edge schedule; Tech Spec §2.1 requires 01:00 UTC |
| Lock January allocations after auto-lock | **FAIL** | See lock semantics below |
| Unmapped → Miscellaneous on lock | **PASS (conditional)** | `autolock_resolve_unmapped_for_period` → seeded `General` jar |

### Lock semantics (critical)

1. Autolock eligibility = `month_end + 30 ≤ today` (matches AC-RIT-01 date example in unit helper).
2. By that calendar date, `currentPeriodMonth()` is **already the next month(s)**.
3. All plan mutation commands call `assertPlanPeriodUnlocked(householdId)` → defaults to **current** period.
4. Grep shows `is_month_ritual_locked` defined in SQL but **never called** from application or other migrations’ mutation paths.
5. Therefore auto-locking January to `pending_review` does **not** prevent editing live jar plans / reallocations in March.

**Business verdict:** The evolution weakness (“edit January allocations in December”) is **not closed** by Sprint 4 as shipped. Status + BR-15 triage are useful; allocation immutability for auto-locked periods is not.

### Months without ritual rows

Worker creates `pending_review` for past months **only if** pending `unmapped_expense` inbox items exist. A neglected month with no ritual run and no unmapped inbox never locks — BR-08 intent incomplete.

---

## BR-15 — Unmapped on month lock

| Check | Result |
|-------|--------|
| Resolve pending unmapped for period to Misc jar | **PASS** (RPC path) |
| Spec “Miscellaneous Jar” naming | **PASS** via `MISCELLANEOUS_JAR_NAME = "General"` (seeded name) |
| Runs without user session | **FAIL** (requires `auth.uid()`) |

---

## BR-12 / EVO-01 — Divergence gate

| Check | Result |
|-------|--------|
| Surface unbound / archived-jar categories used in period | **PASS** (`listRitualDivergence`) |
| Block preview / approve / Quick Close | **PASS** (app gate + UI disable) |
| Equals AC-CAT-01 category-create GWT | **N/A** — different behavior; AC mapping in catalog is wrong |

---

## BR-09 / BR-23 — Assisted default & Quick Close

| Check | Result |
|-------|--------|
| Threshold 6 consecutive | **PASS** (`QUICK_CLOSE_CONSECUTIVE_RITUALS`) |
| Streak increment on approve | **PASS** |
| Unlock `month_close_mode = quick_close` | **PASS** |
| Autolock resets streak | **PASS** (SQL) |
| “Assisted-only” streak purity | **PARTIAL** — any approve increments; Quick Close also increments after unlock |
| Correction resets streak | **FAIL** — `correctMonthRitual` does not clear counter |
| 1-tap partner approval (lifecycle) | **FAIL / deferred** — KI-S4-03; same single-actor approve as Assisted |

---

## BR-07 / REQ-RIT-02 — Emergency reflection

| Check | Result |
|-------|--------|
| List `is_emergency` plan movements in period | **PASS** |
| Mandatory reflection before sign-off | **FAIL** — informational only; no acknowledge gate |
| Partner dialogue / shared reflection | **FAIL** — list of notes only |

---

## Financial correctness score

**4.0 / 10** — Strongest delivery is divergence blocking + Quick Close eligibility plumbing. Core BR-08 allocation lock for auto-locked past months fails the business test.
