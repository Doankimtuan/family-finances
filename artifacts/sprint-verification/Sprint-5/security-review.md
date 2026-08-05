# Security Review — Sprint 5

## AuthN / AuthZ

| Control | Finding |
|---------|---------|
| Calendar page | Session + membership redirect — **PASS** |
| Data access | Via existing ledger/plan list queries (RLS-backed pattern) — **PASS** assumed |
| Writes | Calendar path is **read-only** — reduces write attack surface — **PASS** |
| Input | `month` searchParam validated with regex — **PASS** (basic) |

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| No new RPCs / security definer | Low | Good |
| Over-disclosure of debt/card amounts on calendar | Low | Household members expected |
| XSS via event titles | Low | React text escaping |
| Sensitive: outstanding balances in UI | Acceptable for product |

## SQL safety

No new SQL in Sprint 5. Client queries via Supabase helpers.

## Security score

**7.5 / 10**
