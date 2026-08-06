# Business Verification — Sprint 5

## Scope

Financial correctness for REQ-CAL-01 / BR-17 / BR-20 / BR-11 and Evolution 9 cash-flow warnings. Deficit must use **real cash**, not jar intention (BR-01 labeling).

---

## REQ-CAL-01 / BR-17 / BR-20 — Multi-domain schedule

| Check | Result | Evidence |
|-------|--------|----------|
| Recurring patterns projected | **PASS** | `projectRecurringEvents` |
| Card dues on calendar (BR-17 aggregate half) | **PASS** | `projectCardDueEvents` + `resolveBillingDueDate` |
| Installment schedules on calendar (BR-20) | **PARTIAL** | Events exist; due day forced to `1` in `get-household-calendar.ts` |
| Correct source tags | **PASS** (projection) | `CalendarEventSource.*` |
| BR-17 PaymentReminder generation | **NOT IN SCOPE of this pack** | Architecture: calendar does not write Inbox; remind path must exist elsewhere — not verified as Sprint 5 delivery |

---

## Cash-flow deficit (ST-E05-002 / Evolution 9)

| Check | Result | Notes |
|-------|--------|-------|
| Starting balance = real position | **PASS** | `getRealPosition().totalBalance` |
| Not jar intention | **PASS** | Constitution claim upheld |
| Running forecast algorithm | **PASS** (structure) | `buildCashFlowForecast` |
| Amounts safe for household decisions | **FAIL** | See material errors below |

### Material projection errors

1. **Installment dates** — `dueDay: 1` hardcoded (`get-household-calendar.ts`). Events land on wrong calendar days vs real EMI schedules (KI-S5-01 understated).
2. **Card synthetic dues** — each future month uses full `outstanding` again (KI-S5-02). Inflates outflows → false deficits.
3. **Liabilities** — `projectLiabilityEvents` pushes `remainingAmount` as the **monthly** amount. A 50M debt due day 10 becomes −50M every month in the forecast — catastrophic false deficit.

**Business verdict:** Deficit banner can fire for the wrong reasons. Do not treat ST-E05-002 as financially complete.

---

## BR-11 — Installment payoff notification

| Check | Result |
|-------|--------|
| Tag final remaining installment as milestone | **PASS** (projection) |
| Celebration / reallocation CTAs | **PARTIAL** — UI links to Inbox + Plan jars |
| Create typed `InstallmentComplete` ReviewItem | **FAIL** — no write path in calendar or Sprint 5 ledger/inbox commands |
| Trigger on actual final payoff (settlement) | **FAIL** — projection of last remaining payment only |

Task `TSK-E05-003-BE` explicitly required the ReviewItem handler. Architecture review admits deep-link-only. That is a Spec BR miss, not an acceptable substitute.

---

## Extra behavior

| Item | Board |
|------|-------|
| Liability domain on calendar | Additive beyond REQ-CAL-01 three sources — OK if amounts fixed |
| Deficit warnings vs PDB EO-03 R1 deferral | Explicit Spec Sync / pack override — allowed if accurate |

---

## Financial correctness score

**5.0 / 10**
