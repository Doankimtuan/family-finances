# ST-E04-001 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-001 real position entry | Hub `Balance` + accounts preview from `getRealPosition` | PASS |
| AC-001 account list/detail | `/money/accounts`, `/money/accounts/[id]` | PASS |
| BR-01 Balance = ledger only | Sum of account `opening_balance` (not jars) | PASS |
| AC-018 / BR-15 offline fail-closed | `useOnlineStatus` disables capture + add; banner | PASS |
| Auth + membership gate | Unauth → login; no membership → onboard | PASS |
| i18n en/vi | `messages/{en,vi}/money.json` | PASS |

## Verdict

**ACCEPTED** for ST-E04-001. Next story: `ST-E04-002`.
