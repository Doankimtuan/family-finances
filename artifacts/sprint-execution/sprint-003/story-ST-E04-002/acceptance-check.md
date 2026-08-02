# ST-E04-002 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-005 unmapped → Inbox ReviewItem | Expense without jar creates `inbox_items`; resolve assigns Active jar | PASS |
| AC-006 positive magnitude + direction | Form radios + `amount > 0` constraint / Zod | PASS |
| AC-016 tags not Categories nav | Tags on capture form; no Categories tab | PASS |
| AC-018 offline block | Client online gate + offline banner | PASS |
| AC-019 keyboard a11y | Field labels, radio/button focus rings, min-h-11 | PASS |
| BR-04 Suggest path | Unmapped income under Suggest/Auto → Inbox | PASS |
| BR-15 / BR-06 | Online mutations; positive amounts | PASS |

## Verdict

**ACCEPTED** for ST-E04-002. Next story: `ST-E04-003`.
