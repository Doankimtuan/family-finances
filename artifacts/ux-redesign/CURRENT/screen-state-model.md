# Screen State Model

## Universal States

| State | UX behavior |
|---|---|
| Initial loading | Skeleton or clear loading copy; no success implication. |
| Refreshing | Preserve current data; show subtle refresh indicator. |
| Ready | One primary action, clear current facts. |
| Empty | Explain why empty and offer the next valid action. |
| Partial data | Show available facts and missing-fact recovery. |
| Validation error | Inline field error plus summary/jump when needed. |
| Permission denied | Explain access limit and route to Together/helpful owner. |
| Recoverable error | Preserve previous state and offer retry/contact/change input. |
| Non-recoverable error | Safe system state with route out. |
| Offline/read-only | Allow review; block unsafe mutations with queued/retry guidance only when supported. |
| Success | Receipt plus return destination. |
| Stale data | Label freshness, source, and refresh/review path. |

## Canonical Screen State Requirements

| Screen group | Empty state | Partial/stale state | Offline behavior | Success behavior |
|---|---|---|---|---|
| Home | Three essentials: add account, choose starter plan, invite partner. | Hide/soften Health until enough facts. | Show cached dashboard if available. | Route to completed setup/action target. |
| Money Overview | Add first account or capture first transaction. | Label stale balances/unknown products. | Read-only money view. | Receipt then detail/list. |
| Transactions | Explain no movement yet; offer capture. | Missing category goes to Inbox/review context. | Browse cached; block posting. | Transaction detail. |
| Accounts | Add first money container. | Account needs verification/opening fact. | Read-only. | Account detail. |
| Cards/Loans/Savings | Explain no tracked product; offer create only when supported. | Missing due, maturity, rate, value, or source facts. | Read-only; block payments/settlements. | Product detail with receipt. |
| Investments | No pressure to invest; say no holdings tracked. | Show stale/unknown value source, Under Review when uncertain. | Read-only; block valuation/exit. | Investment detail with not-cash receipt. |
| Plan | Starter plan guidance. | Divergence or unlocked period callout. | Read-only; block mutation. | Plan/Jar/Goal detail. |
| Inbox | No decisions needed. | Stale review item asks user to refresh/review source. | Read-only queue; block resolve unless safe. | Return to queue position or source. |
| Together | Invite or manage household. | Pending invites/member permission state. | Read-only settings. | Same screen with saved state. |
| Health | Need more facts from Money/Plan. | Show completeness and stale source facts. | Read-only cached insights. | Source navigation only. |

## Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Generic empty/error states are insufficient for finance. | Users do not know safe next step. | Owner-specific empty/recovery states. | All canonical screens | P1 |
| Stale/partial financial facts are easy to miss. | Users over-trust old data. | Always label source/freshness and route to review. | Health, Investments, Money Products | P0 |

