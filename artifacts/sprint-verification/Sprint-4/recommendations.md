# Recommendations — Sprint 4

File-level guidance only. This board does **not** implement fixes.

---

## R1 — Schedule the worker (closes B1)

| Action | Path |
|--------|------|
| Add cron/Edge schedule invoking autolock for **all** households | New migration or Edge function; do **not** rely on `auth.uid()` of a browsing user |
| Keep page-open sweep as **fallback**, not primary | `app/[locale]/(product)/plan/ritual/page.tsx` |
| Align worker identity with Tech Spec §2.1 | `supabase/migrations/20260804150000_sprint4_month_ritual_maturity.sql` (or follow-up migration) |

---

## R2 — Make PendingReview actually lock allocations (closes B2)

| Action | Path |
|--------|------|
| Decide product model: historical period gate vs period-scoped plans | Architecture note — then implement |
| Use or delete `is_month_ritual_locked` | Migration SQL + call from plan write RPCs **or** from `assert-plan-unlocked.ts` for relevant periods |
| Ensure auto-locked past months cannot be ignored by current-only checks | `modules/plan/application/assert-plan-unlocked.ts`; all `commands/*` that mutate jars/plans |
| Optionally add period selector so users can correct pending_review months | `get-month-ritual.ts`, ritual UI |

Also extend worker to lock past months **without** requiring unmapped inbox items (create `pending_review` run for any due unapproved/missing ritual).

---

## R3 — Tests (closes B3)

| Test | Suggested location |
|------|-------------------|
| RPC autolock: draft January + clock March 2 → `pending_review` | `tests/unit` integration or `tests/integration/` against local Supabase |
| Unmapped resolve → General jar_id | Same |
| `listRitualDivergence` unbound + archived jar | Unit with mocked client **or** DB fixture |
| `previewMonthRitual` returns `ritual_divergence` | Command integration |
| Streak 5 approve → eligible; Quick Close rejected at 5 | Command + household column |
| Playwright: divergence blocks CTA; pending-review banner | Extend `tests/e2e/plan-month-ritual.smoke.spec.ts` |

Assert via constants (`RitualStatus.PENDING_REVIEW`), not fresh literals.

---

## R4 — Mandatory emergency reflection (closes B4)

| Action | Path |
|--------|------|
| Persist `emergencies_acknowledged_at` (or equivalent) on ritual run | Migration + `month-ritual.ts` approve path |
| Gate approve / Quick Close when `emergencies.length > 0` and not acknowledged | `month-ritual.ts` + `ritual-wizard.tsx` |
| Show empty Step 3 “no emergencies” confirmation when count is 0 | Wizard |

---

## R5 — Non-blocking hygiene

| Action | Path |
|--------|------|
| Deep-link divergence items to category/jar mapping | `ritual-wizard.tsx` + `app-path.ts` |
| Reset `consecutive_completed_rituals` on correct | `correctMonthRitual` |
| Fail-closed on lock query errors | `assert-plan-unlocked.ts` |
| Stop swallowing divergence errors as `[]` | `ritual-gates.ts` |
| Fix stale `ST-E05-004` comment | `plan/ritual/page.tsx` |
| Drive SQL eligibility using shared documented formula matching `isRitualAutolockDue` | SQL + TS comment or shared test vectors |

---

## R6 — Spec / catalog cleanup (SoT boards, not this board)

- Add dedicated ACs for REQ-RIT-02 / REQ-RIT-03 **or** rematerialize story catalog AC IDs.
- Do not map ST-E04-002 → AC-CAT-01 or ST-E04-003 → AC-JAR-02 without Spec amendment.
- Update traceability away from `modules/month-ritual/` if Constitution keeps Ritual in `modules/plan`.
