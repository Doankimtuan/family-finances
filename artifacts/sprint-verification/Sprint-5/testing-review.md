# Testing Review — Sprint 5

## Claimed gates (execution pack)

| Gate | Claim | Board note |
|------|-------|------------|
| lint / typecheck | PASS | Pack claim; not re-run |
| `npm test` 231 | PASS | Pack claim |
| Focused `plan-calendar.test.ts` | Yes | Inspected |
| i18n calendar keys | Claimed | Overstated — generic en/vi parity only |

## Coverage vs task QA

| Task | Required | Actual |
|------|----------|--------|
| `TSK-E05-001-QA` | Integration: 3 domains aggregate (AC-CAL-01) | Separate pure unit cases — **no** `getHouseholdCalendar` / DB integration |
| `TSK-E05-002-QA` | Unit: low balance warning on deficit date | **PASS** pure `buildCashFlowForecast` |
| `TSK-E05-003-QA` | Payoff triggers reallocation prompt | Milestone tagging unit only — **no** ReviewItem / CTA test |

## Pyramid

| Tier | Evidence | Board |
|------|----------|-------|
| 1 Unit | Domain projectors + deficit + route constant | Thin–moderate PASS |
| 2 Integration | Missing | **FAIL** |
| 3 E2E | No calendar Playwright | **FAIL** |
| 4 Constitutional | Real-cash labeling not auto-tested | Partial |

## Uncovered scenarios

| Scenario | Covered? |
|----------|----------|
| Merged recurring+card+installment in one projection call | No |
| Live query with ledger fixtures | No |
| Liability double-count / monthly amount bug | No |
| Installment dueDay=1 vs true schedule | No |
| Celebration UI / Inbox CTA | No |
| Empty calendar / unavailable | No automated |
| Month `?month=` navigation | No |
| Deficit banner in UI | No e2e |

## Testing score

**4.0 / 10**
