# Phase 3 — Home content audit

Mandatory element table. Destinations for anything removed or deferred are listed.

| Element | Purpose | Data source | User question answered | Priority | Keep / Change / Remove |
| --- | --- | --- | --- | --- | --- |
| TopAppBar greeting + household name | Household orientation | `getHouseholdPreferences().householdName`, `homeGreetingPeriod()` | Where am I? Whose money is this? | P0 | **Change** — eyebrow is household identity, not a generic “Home” icon |
| Header meta (accounts · Inbox count) | Quiet household facts | `accountCount`, `openInboxCount` | Is anything waiting? | P0 | Keep |
| Offline / error / partial lanes | Recoverable state | Existing status model | Can I trust this view? | P0 | Keep |
| Financial hero number | Current-state total assets | `calculateMoneyAssetOverview` from Home dashboard + savings/investment summaries | How much does the household hold right now? | P0 | **Keep** — total across accounts, savings, and valued investments |
| Hero label + hint | Meaning of the number | i18n | Is this cash, jars, or investments? | P0 | **Change** — Total assets caption; partial coverage when needed |
| Privacy toggle | Hide amounts | Existing privacy provider | Can I look without exposing numbers? | P1 | Keep |
| Period control on hero | Switch month/quarter | Search param `period` | — | — | **Remove from hero** — control moved to period story (same behavior) |
| Net cash-flow strip | Period movement | `financialMetrics.netCashFlow` | Did we take in more than we spent? | P0 | **Change** — supporting, not a second hero |
| Inbox preview | Finishable attention | `openInboxCount` | Is there something I should deal with? | P0 | **Change** — whole pending surface → Inbox; no nested primary button |
| Plan pulse | Intention context | `activeJarCount`, `incomeAllocateMode` | What is the plan doing? | P1 | Keep (copy now says jars ≠ cash) |
| Cash-flow income/expense | Period movement detail | `financialMetrics.income/expense` | What came in vs went out? | P1 | Keep, below attention |
| Cash-flow chart | Trend over the period | `financialMetrics.trend` | How has income vs spending moved? | P2 | Keep — justified question; hidden when no activity |
| Spending breakdown | Scan largest expenses | `spendingCategories` (max 4) | Where did spending go? | P2 | Keep, capped; uncategorized → Inbox when allowed |
| View transactions | Path to full activity | `APP_PATH.MONEY_TRANSACTIONS` | Where is the full history? | P1 | **Change** — on-hero `HeroPillLink`, not a period-section action |
| Product summaries | Shortcuts + attention on Money products | Existing Home product adapters | Do savings/loans/debts need a look? | P2 | **Change** — demoted, retitled; not a net-worth block |
| Capture FAB | High-frequency create | `accountCount` | What can I do next? | P0 | Keep |
| Day-zero trio | First valid setup | Day-zero flag | What should I do first? | P0 | Keep (copy calmer) |
| Health chip | Setup score | `health` on dashboard | How complete is setup? | REMOVE/DEFER | **Deferred** — already unused; Health remains at `/health` |
| Recent `TransactionRow` list | Activity preview | Not on Home read model | What just happened? | — | **Deferred** — would need new dashboard fields; Transactions remains reachable |

## Removed / deferred destination map

| Item | Still reachable at |
| --- | --- |
| Total-assets mix | Home hero + Money hub allocation (accounts / savings / investments) |
| Health setup chip | `/health` |
| Full Inbox | `/inbox` (preview only on Home) |
| Full transactions | `/money/transactions` |
| Account inventory | `/money` |
| Jars / allocation | `/plan` |
| Savings / investments / loans / debts | `/money/savings`, `/money/investments`, `/money/loans`, `/money/debts` (rows still on Home) |
| Add transaction | FAB → `/money/transactions/new` |
| Add account | Day-zero / FAB when `accountCount === 0` → `/money` |
| Invite | Day-zero → `/together/invitations` |

No Home-only capability was deleted without a remaining path.
