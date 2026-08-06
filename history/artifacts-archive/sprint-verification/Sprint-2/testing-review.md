# Testing Review — Sprint 2

## Gate re-verification (this board)

| Gate | Result |
|------|--------|
| `tests/unit/sprint2-plan-movements.test.ts` (+ related) | **14/14 PASS** |
| Full `npm test` | **40 files / 206 tests PASS** |
| Lint / typecheck (pack claim) | Accepted; focused suite green |

## What tests prove

| File | Actual tier | Proves |
|------|-------------|--------|
| `sprint2-plan-movements.test.ts` | **Pure unit** | Schema accept/reject; `applyCapacityDelta` math; warn bypass policy; constant strings |
| `plan-pulse.test.ts` | Unit | `capacityDelta` mapping |
| `inbox-queue.test.ts` | Unit | Kind constant |

**No** command-layer mock of `reallocate_jar_capacity`.  
**No** DB integration.  
**No** Playwright reallocate/emergency path (`plan-jars.smoke` does not commit a movement).

## Against Story DoD & Testing Strategy

| Requirement | Met? |
|-------------|------|
| GWT via integration or E2E | **No** |
| Tier 2: DB plan movement + zero ledger | **No** |
| Tier 3: emergency notification E2E | **No** |
| Tier 4: BR-01 constitutional automated | **Partial** — design only |
| TSK-E02-001-QA bank balance untouched | **No** |
| TSK-E02-003-QA partner notification E2E | **No** |

## Critical meta-issue

Pack `stories-completed.md` cites unit file as AC evidence. Those tests never commit a reallocation. Same “policy sold as AC proof” failure mode as Sprint 1.

## Testing score input

**4.0 / 10**
