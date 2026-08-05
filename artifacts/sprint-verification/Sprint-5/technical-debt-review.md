# Technical Debt Review — Sprint 5

## Pack-declared (validated)

| ID | Item | Board severity |
|----|------|----------------|
| TD-S5-01 | `next_due_date` on installment_plans | **Raise to High** — blocks correct BR-20 dates |
| TD-S5-02 | Month prev/next UX | Low–Medium |
| TD-S5-03 | REST calendar adapter | Medium vs Tech Spec |

## Pack known issues

| ID | Board |
|----|-------|
| KI-S5-01 due day=1 | **Blocking** under financial correctness (pack Medium — understated) |
| KI-S5-02 card outstanding repeat | **Raise to High** for deficit |
| KI-S5-03 no REST | Spec gap; P1 |

## Additional debt discovered

| ID | Item | Priority |
|----|------|----------|
| TD-V5-01 | BR-11 InstallmentComplete write path missing | **Critical** |
| TD-V5-02 | Liability monthly amount = full remaining balance | **Critical** |
| TD-V5-03 | Installment deep-link uses card path + plan id | High |
| TD-V5-04 | Event id source prefixes dual SoT | Low |
| TD-V5-05 | Unused `forecast` in UI | Low |
| TD-V5-06 | Spec Sync missing AC-CAL-01 GWT | High (SoT boards) |
| TD-V5-07 | Helper tests sold as integration AC proof | High |

## Debt score

**7.0 / 10** (higher = more debt)

## Maintainability score

**7.0 / 10** — structure clean; temporary due-day and liability math will rot trust quickly.
