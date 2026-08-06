# ST-E04-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E04-001` |
| Title | Money hub and accounts list/detail |
| Sprint | S3 / `sprint-003` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E04-001_20260802T114500Z` |
| Date | `2026-08-02T11:45:00Z` |

## Delivered

| Task | Result |
|------|--------|
| Money hub (real position) | PASS — `/money` Balance = ledger opening balances only (BR-01) |
| Accounts list + add | PASS — `/money/accounts` + inline create |
| Account detail | PASS — `/money/accounts/[id]` |
| Offline fail-closed (AC-018) | PASS — banner + disabled capture/add when offline |
| Capture entry stub | PASS — `/money/add` stub (full form = ST-E04-002) |
| Tests | PASS — unit ledger-accounts + money-hub e2e smoke |

## Key paths

- `modules/ledger/application/{account-types,queries,commands,index}.ts`
- `app/[locale]/(product)/money/{page,accounts,add}/*`
- `shared/patterns/{balance,quick-action,transaction-row}.tsx`
- `shared/hooks/use-online-status.ts`
- `messages/{en,vi}/money.json`
- `tests/unit/ledger-accounts.test.ts`
- `tests/e2e/money-hub.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (108) |
| e2e money-hub smoke | PASS (2 passed, 1 skipped — credentials) |
| build | PASS (`/money`, `/money/accounts`, `/money/accounts/[id]`, `/money/add`) |
