# Fixes Applied — Sprint 5 Verification Blockers

Board required fixes from `artifacts/sprint-verification/Sprint-5/blocking-issues.md`.

| ID | Fix |
|----|-----|
| **B1** | Confirmed settlement path `record_installment_payment` creates `emi_complete` → `InstallmentComplete`; enriched `context_json.review_item_type`; calendar celebration deep-links pending inbox item when present |
| **B2** | Card dues use `nextDueRemaining` once (no synthetic outstanding repeats); liabilities emit single balloon; `installment_plans.due_day` + projection uses plan due day |
| **B3** | `tests/unit/plan-calendar.test.ts` three-domain merge AC-CAL-01 case + card/liability amount regressions |

Deep-link: installment/payoff events go to `APP_PATH.MONEY_CARDS` (not plan-id-as-card).
