# Requirement Verification — Sprint 5

Trace: Story → REQ / BR → Implementation.

---

## ST-E05-001 → REQ-CAL-01

| REQ / BR | Statement | Implementation | Board |
|----------|-----------|----------------|-------|
| **REQ-CAL-01** | Aggregate RecurringPattern, Card dues, Installment dues | `getHouseholdCalendar` + pure projectors | **PARTIAL** — aggregation yes; installment dates inaccurate |
| **BR-17** (calendar half) | Card dues aggregate on Household Financial Calendar | `projectCardDueEvents` | **PASS** |
| **BR-20** | Debt payment schedules on calendar | `projectInstallmentEvents` | **PARTIAL** (due day=1) |
| Tech Spec API | `GET /api/v2/calendar/events` | RSC query only | **FAIL vs literal Spec**; pack lists as non-goal |

---

## ST-E05-002 → REQ-CAL-01 (+ Evolution cash-flow warning)

| Requirement | Implementation | Board |
|-------------|----------------|-------|
| Calendar UI for aggregated events | `/plan/calendar` grid + day list | **PASS** (current month UX) |
| Early deficit warning when scheduled bills exceed expected balances | `buildCashFlowForecast` + banners | **PARTIAL** — UI present; inputs unreliable (business B2) |
| Spec Sync AC ID | Claims AC-CAL-01 | **AC body missing** in Spec Sync |

No dedicated Spec Sync REQ for deficit; Evolution overview + story catalog carry the intent.

---

## ST-E05-003 → BR-11, BR-20, REQ-CAL-01

| REQ / BR | Implementation | Board |
|----------|----------------|-------|
| **BR-20** | Installments on calendar | **PARTIAL** |
| **BR-11** | `InstallmentComplete` ReviewItem for reallocation | **FAIL** |
| Celebration / triage surface | Inline CTAs to Inbox / jars | **PARTIAL** — UX only |
| Catalog AC-CAL-01 | Does not GWT ReviewItem write | Story over-attributed to wrong AC |

---

## Missing / deferred vs tasks

| Task | Outcome |
|------|---------|
| `TSK-E05-001-BE` REST events API | Deferred (KI-S5-03) |
| `TSK-E05-001-FE` client store | Substituted with RSC props |
| `TSK-E05-001-DB` SQL projection | Substituted with pure TS (acceptable arch) |
| `TSK-E05-003-BE` InstallmentComplete handler | **Missing** |

---

## Requirement score

**5.8 / 10**
