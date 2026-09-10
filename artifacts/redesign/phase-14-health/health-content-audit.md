# Phase 14 — Health content audit

## Current Health purpose

Health is a **secondary, read-only** surface. It answers:

> What do the numbers already in ViNha tell me about my financial situation, without turning that information into advice?

It is not Home, Money, a score product, a coach, or a sixth tab.

## Canonical routes

| Surface | Path | Helper |
| --- | --- | --- |
| Health overview | `/health` | `APP_PATH.HEALTH` |
| Health insights | `/health/insights` | `APP_PATH.HEALTH_INSIGHTS` |

No nested query contract on the Health routes themselves. Source links append existing `origin` + `factor` keys (`HEALTH_SOURCE_QUERY`) when leaving Health.

Unauthenticated access redirects to `APP_PATH.LOGIN`. Missing membership redirects to `APP_PATH.ONBOARD`.

## Existing read models (reused, not duplicated)

Overview: `getHealthOverview()` → subset of `getHealthDetail()`.

Detail: `getHealthDetail()` reads in parallel:

- `getRealPosition()` (ledger accounts)
- `getPlanPulse()` (active jars)
- `listOpenInboxItems()`
- `listRecentTransactions(8)`

If any source read is `null`, Health returns `null` (load error). Counts are not invented.

## Existing metrics and exact meanings

| Fact | Meaning | Kind | Owner |
| --- | --- | --- | --- |
| `accountCount` | Number of recorded accounts in real position | Count of current-state records, not a balance | Ledger `getRealPosition` |
| `activeJarCount` | Number of Active plan jars | Intention coverage, not cash | Plan `getPlanPulse` |
| `openInboxCount` | Number of open Inbox items | Attention load | Inbox `listOpenInboxItems` |
| `recentTransactionCount` | Recent cleared ledger moves (detail/insights only) | Movement coverage | Ledger `listRecentTransactions(8)` |
| `hasEmiCompletePending` | Whether an EMI-complete Inbox item is open | Existing Inbox kind | Inbox |
| `completeness.visibleSourceCount` / `totalSourceCount` | How many of the four source areas currently have any recorded fact | Coverage metadata (`HEALTH_SOURCE_TOTAL` = 4) | `assessHealthPulse` |
| `completeness.missingAccounts` / `missingPlan` | Whether accounts or active jars are absent | Coverage flags | `assessHealthPulse` |

Health **does not** display account balances, jar amounts, or transaction amounts. Those remain on owning surfaces.

## Existing calculations (unchanged)

`computeHealthPulse` is the existing household-pulse heuristic:

- Base 35
- +25 if `accountCount > 0`
- +25 if `activeJarCount > 0`
- +15 if Inbox is empty, else +8 if `openInboxCount <= 2`
- Clamped 0–100
- Level: `starting` (<55), `steady` (≥55), `strong` (≥80)

`assessHealthPulse` still withholds the pulse when:

- no visible facts (`NO_VISIBLE_FACTS`, `health: null`)
- accounts or plan missing (`PARTIAL`, `health: null`)

This phase **did not** change thresholds, formulas, or when a pulse is emitted.

## Score / rating

An existing **household pulse** (0–100 + Starting/Steady/Strong) already exists for Home + Health (AC-015).

Presentation now explains it as a setup + Inbox-load pulse, not a credit rating, net-worth score, or financial advice. No second score was added. No ring, no gamification.

## Recommendation / advice behavior

`buildHealthInsights` already emits grounded **notices** (`InsightKind`) and **coverage scenarios** (`ScenarioKind`). Those kinds, params (counts only), and source mapping are unchanged.

Presentation copy was rewritten to describe recorded facts instead of coaching (“finish setup”, “you should”, “keep momentum”).

Always-on `ai_guardrail` remains: Health must not invent balances or move money.

## Source / context relationships

| Fact | Source kind | Route |
| --- | --- | --- |
| Accounts count | `HealthSourceKind.ACCOUNTS` | `APP_PATH.MONEY_ACCOUNTS` |
| Plan jars | `HealthSourceKind.PLAN_JARS` | `APP_PATH.PLAN_JARS` |
| Inbox load | `HealthSourceKind.INBOX` | `APP_PATH.INBOX` |
| Recent activity | `HealthSourceKind.TRANSACTIONS` | `APP_PATH.MONEY_TRANSACTIONS` |
| EMI complete | Inbox | `APP_PATH.INBOX` |

Insights keep `origin=/health/insights`. Overview fact links use `origin=/health`. Query key names are unchanged.

## Data coverage limitations

Health only sees recorded ViNha facts in four areas: accounts, plan jars, Inbox, recent activity. It does not claim a complete household picture. Missing sources stay missing; they are not shown as `0` cash.

Live session observed populated coverage: 4 of 4 source areas, pulse 85 / Strong.

## Terminology decisions

| Use | Avoid |
| --- | --- |
| Household pulse | Financial health score, credit score, net worth |
| Recorded coverage / recorded facts | “You should set up…” |
| Open Inbox items | “Inbox needs attention” as a command |
| Coverage scenarios | “If you add a jar you should…” |
| Facts stay grounded | Assist/AI as a coach |

## Hard rejects

- No new Health score, ratio, forecast, or recommendation engine
- No Net Worth / Total Money / Free to Spend / Ready to Assign / Age of Money
- No Health tab (five tabs unchanged)
- No Health mutations
- No mock/seeded financial data
- No change to `computeHealthPulse` / `assessHealthPulse` / `buildHealthInsights`
- `.agents/design-system.md` not modified
