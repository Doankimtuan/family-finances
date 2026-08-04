# Testing Review — Sprint 4

## Claimed gates (execution pack)

| Gate | Claim | Board note |
|------|-------|------------|
| lint / typecheck | PASS | Not re-run by this board; accepted as pack claim |
| `npm test` 225 | PASS | Pack claim; focused suite inspected |
| Playwright ritual | Not run | Confirmed gap |

## Coverage vs task breakdown QA

| Task | Required | Actual |
|------|----------|--------|
| `TSK-E04-001-QA` | 30-day auto-lock → PendingReview | Unit date math only — **no RPC / DB transition test** |
| `TSK-E04-002-QA` | Gate blocks until mapping resolved | Constant string assert only — **no query/command test** |
| `TSK-E04-003-QA` | Quick Close unlocks after 6 | Threshold helper only — **no streak persistence test** |

## Pyramid vs `testing-strategy.md`

| Tier | Sprint 4 evidence | Board |
|------|-------------------|-------|
| 1 Unit | Helpers / constants | Thin PASS |
| 2 Integration | None for autolock / divergence / approve streak | **FAIL** |
| 3 E2E | Existing smoke unchanged; no QC / divergence / pending_review | **FAIL** |
| 4 Constitutional | No BR-08 lock constitutional test | **FAIL** |
| 5–6 a11y / security | None specific | Not claimed |

## Overclaims

- `stories-completed.md` presents RPC → pending_review as “acceptance evidence” without automated proof.
- `test-report.md` “i18n ritual message parity” is generic en/vi key parity, not ritual-specific assertions.

## Edge / failure / empty / loading

| Scenario | Covered? |
|----------|----------|
| Autolock due vs not due dates | Unit yes |
| Worker when no household | Untested |
| Divergence unbound / archived jar | Untested |
| Quick Close when streak < 6 | Untested (app returns code) |
| Pending review UI | Untested |
| Offline ritual actions | UI offline check exists; no automated test |
| Empty emergencies | UI hides section; no test |

## Testing score

**3.0 / 10**
