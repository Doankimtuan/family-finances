# Blocking Issues — Sprint 5

Must resolve before Sprint 6 starts and before marking Sprint 5 stories COMPLETE.

---

## B1 — BR-11 InstallmentComplete ReviewItem not created

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | BR-11; ST-E05-003; TSK-E05-003-BE |
| Symptom | Calendar tags `payoff_milestone` and deep-links Inbox; no typed ReviewItem write |
| Evidence | `calendar-view.tsx` CTAs; architecture-review “does not write Inbox”; no Sprint 5 create path for `InstallmentComplete` |
| Required outcome | On final installment payoff (settlement), insert typed `InstallmentComplete` ReviewItem enabling reallocation triage — not merely a projected calendar badge |

---

## B2 — Cash-flow / schedule amounts financially incorrect

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | ST-E05-002 deficit intent; BR-20; Evolution 9 cash-flow warnings; BR-01 labeling is necessary but not sufficient |
| Symptom | Wrong dates and inflated outflows drive false deficits |
| Evidence | `get-household-calendar.ts` `dueDay: 1`; `projectCardDueEvents` repeats `outstanding`; `projectLiabilityEvents` uses `remainingAmount` monthly |
| Required outcome | (1) Real installment due dates (schema or reliable derivation); (2) card monthly amount = expected payment / remaining bill, not full outstanding each month; (3) liability monthly outflow = payment amount (or omit full balance from monthly forecast) |

---

## B3 — Definition-of-Done tests missing

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | `testing-strategy.md` Tier 2–3; TSK-E05-001-QA / 003-QA |
| Symptom | Pure projector units sold as AC-CAL-01 / story complete |
| Evidence | `tests/unit/plan-calendar.test.ts`; no e2e under `tests/e2e` for calendar; no `getHouseholdCalendar` integration |
| Required outcome | At least one automated test proving merged recurring + card_due + installment in one projection/query path; one UI or e2e path for deficit banner and/or payoff celebration; regression for liability/card amount rules after B2 |

---

## Non-blocking (tracked)

| ID | Issue |
|----|-------|
| N1 | Spec Sync missing AC-CAL-01 GWT — Spec boards must publish or rematerialize |
| N2 | No `GET /api/v2/calendar/events` (KI-S5-03 / TD-S5-03) — amend Spec or add thin adapter |
| N3 | Month prev/next UX (TD-S5-02) |
| N4 | Installment/payoff `moneyCardPath(planId)` deep-link correctness |
| N5 | Celebration modal vs inline alert |
| N6 | Prior Sprint 4 verification still 🟡 — coordinate reopen order |

---

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 6 start? | **No** until B1–B3 closed |
| Reopen Sprint 5? | **Yes — required-fix reopen** |
| Freeze pack trustworthy as COMPLETE? | **No** |
