# Test Report — Sprint 1

| Gate | Result |
|------|--------|
| Unit tests (`npm test`) | **PASS** — 38 files / 194 tests |
| Typecheck (`npm run typecheck`) | **PASS** |
| Lint (`npm run lint`) | **PASS** |
| Sprint 1 focused tests | **PASS** — `sprint1-core-contracts*.test.ts` (12) |
| E2E Playwright | Not run this sprint (no new e2e specs; smoke suite unchanged) |

## New / updated tests

| File | Coverage |
|------|----------|
| `tests/unit/sprint1-core-contracts.test.ts` | AC-CAT-01, AC-TRN-01, AC-TRN-02 domain policies |
| `tests/unit/sprint1-core-contracts.integration.test.ts` | createCategory / refund / correct command↔RPC mapping |
| `tests/unit/ledger-transaction-edit.test.ts` | Delete blocked under BR-02 |
| `tests/unit/ledger-capture.test.ts` | Account mock aligned with capture gate |

## Business scenarios verified (unit/policy)

1. Category without jar → rejected
2. Refund $50 of $150 → partially refunded + capacity 50
3. Correct $100 expense → $10 → Reversed + reversal 100 income + correction 10 expense; net legs +90
