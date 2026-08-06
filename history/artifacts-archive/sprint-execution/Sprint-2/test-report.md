# Test Report — Sprint 2

| Gate | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | **PASS** |
| Typecheck | `npm run typecheck` | **PASS** |
| Unit tests | `npm test` | **PASS** — 40 files / **206** tests |

## Sprint 2 coverage added

| File | Focus |
|------|--------|
| `tests/unit/sprint2-plan-movements.test.ts` | AC-JAR-01 zero ledger impact; capacity deltas; AC-JAR-02 warn bypass + intent note; Inbox kind / event constants |
| `tests/unit/plan-pulse.test.ts` | `capacityDelta` mapping without inventing `balance` |
| `tests/unit/inbox-queue.test.ts` | `EMERGENCY_DECLARATION` kind constant |

## Not run (optional / out of sprint gate)

- Full Playwright E2E against live credentials
- Live RPC smoke against remote (migration applied; command path unit-covered)

## Notes

- Story gates were run after each story increment; final gate re-run before pack freeze.
