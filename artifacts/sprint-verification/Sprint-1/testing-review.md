# Testing Review — Sprint 1

## Gate re-verification (this board)

| Command | Result |
|---------|--------|
| Focused Sprint 1 + edit tests | **17/17 PASS** |
| Full `npm test` | **38 files / 194 tests PASS** |
| Typecheck / lint (execution claim) | Accepted as reported; not re-run exhaustively beyond unit |

## What tests actually prove

| File | Tier (claimed) | Actual tier | Proves |
|------|----------------|-------------|--------|
| `sprint1-core-contracts.test.ts` | Unit | **Unit / policy** | Zod reject; status math; chain builder; net +90 |
| `sprint1-core-contracts.integration.test.ts` | Integration | **Mocked command** | RPC payload mapping with `vi.mock` Supabase — **not DB** |
| `ledger-transaction-edit.test.ts` | Regression | Unit | Hard delete blocked; **also asserts mutate RPC still works** |

## Against Story DoD & Testing Strategy

| Requirement | Met? |
|-------------|------|
| GWT AC via automated integration **or** E2E | **No** |
| Tier 2: DB transactions / 3-way chain persistence | **No** |
| Tier 3: refund linking E2E | **No** (acknowledged TD-S1-03) |
| Tier 4: BR-01 / BR-24 constitutional | BR-24 informal PASS; BR-01 N/A |
| ≥90% line coverage claim | **Unproven** (no coverage report in pack) |

## Edge / failure / empty coverage gaps

| Scenario | Covered? |
|----------|----------|
| Category without jar | Policy yes / UI no |
| Refund exceeds original | SQL raises; no automated test |
| Correct non-correctable status | SQL/UI gate; weak automated coverage |
| Empty jar list on category form | Not observed |
| Loading/pending form states | Present in UI; not tested |
| Migration backfill `cleared`→`posted` | Untested against staging |

## Critical meta-issue

`ledger-transaction-edit.test.ts` **locks in** the anti-Spec mutate path by expecting `update_transaction` success. Until that test flips to “blocked / redirected to correct,” the suite encodes the wrong financial law.

## Testing score input

**4.5 / 10**
