# ST-E06-001 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-005 / BR-05 ReviewItems resolvable to Active jar | Detail resolve panel → `resolve_inbox_item_to_jar` | PASS |
| AC-020 partners equal daily Inbox | `assertMoneyActionAllowed` (member, not admin-only); partner note on queue/detail | PASS |
| Blueprint hierarchy | Filter by kind → ReviewCard list → open card | PASS |
| Screens | `inbox.queue`, open path to `inbox.review-detail` | PASS |
| i18n en/vi | inbox.json | PASS |

## Verdict

**ACCEPTED** for ST-E06-001. Next story: `ST-E06-002`.
