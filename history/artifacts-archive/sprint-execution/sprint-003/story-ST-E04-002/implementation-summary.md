# ST-E04-002 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E04-002` |
| Title | Add transaction capture <15s |
| Sprint | S3 / `sprint-003` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E04-002_20260802T115200Z` |
| Date | `2026-08-02T11:52:00Z` |

## Delivered

| Task | Result |
|------|--------|
| Capture form | PASS — `/money/transactions/new` (+ `/money/add` alias) |
| Positive amount + direction | PASS — BR-06 expense/income radios |
| Category tags (not Categories nav) | PASS — system tags in form (AC-016) |
| Unmapped expense → Inbox | PASS — `inbox_items.unmapped_expense` (BR-05/AC-005) |
| Suggest income path → Inbox | PASS — `income_suggest` when mode Suggest/Auto (BR-04) |
| Offline fail-closed | PASS — banner + disabled save (AC-018) |
| Keyboard a11y | PASS — labels, ≥44px targets, focus rings (AC-019) |
| Idempotency | PASS — `idempotency_key` on `record_transaction` |
| Real position updates | PASS — opening ± cleared txs |
| Inbox resolve-to-jar | PASS — minimal assign Active jar |
| Tests | PASS — unit capture + e2e smoke |

## Key paths

- `supabase/migrations/20260802130000_ledger_transactions_inbox.sql`
- `modules/ledger/application/commands/record-transaction.ts`
- `modules/ledger/application/queries/list-transactions.ts`
- `modules/inbox/application/review-items.ts`
- `app/[locale]/(product)/money/transactions/{new,capture-transaction-form,actions}*`
- `app/[locale]/(product)/inbox/*`
- `messages/{en,vi}/{money,inbox}.json`
- `tests/unit/ledger-capture.test.ts`
- `tests/e2e/money-capture.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (113) |
| e2e money-capture + money-hub | PASS (4 passed, 2 skipped) |
| build | PASS (`/money/transactions/new`, `/inbox`) |
