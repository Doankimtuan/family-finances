# Consistency Report

## Phase A Issues Addressed

| Phase A issue | IA response |
|---|---|
| Money has deepest route tree. | Group Money into Overview, Accounts, Transactions, Products, and Actions. |
| Plan has five subareas without second-level nav. | Define Plan secondary navigation: Overview, Jars, Goals, Recurring, Calendar, Ritual. |
| Health is product-facing but outside bottom nav. | Keep Health secondary; define Home/contextual/deep-link entry points. |
| Route taxonomy is implicit. | Define canonical route taxonomy and route patterns. |
| Compatibility routes remain. | Make them redirect-only and remove from navigational model. |
| Shared patterns catch-all. | Define component ownership tiers and module ownership targets. |
| Product-specific shared cards. | Assign entity cards to owning modules. |
| Forms lack workflow-level structure. | Define create/edit/action ownership and route rules. |
| Repeated auth/session gates. | Assign guard responsibility to shell/route policy in future phases; do not make every screen invent it. |
| App routes import multiple modules directly. | Establish screen owner as orchestrator and require typed dependencies. |

## Design Principle Check

| Principle | Result |
|---|---|
| Simple enough for first-time users. | Five tabs map to household, money reality, planning, review work, and household management. |
| Scalable for 5+ years. | Future financial areas fit under Money Products; Health/Settings remain secondary. |
| Every screen has exactly one responsibility. | Screen catalog assigns one purpose and one owner per screen. |
| Every module owns one bounded context. | Module ownership matrix preserves bounded-context responsibilities. |
| No duplicated entry points. | Compatibility routes are redirect-only; capture has one canonical route. |
| Navigation follows user mental models. | Reality is Money; intention is Plan; decisions are Inbox; people/settings are Together. |
| Bottom navigation stays minimal. | Bottom nav remains five items. |
| Avoid deep navigation whenever possible. | Product depth target is three levels, with object actions as controlled exceptions. |
| Money-related flows feel predictable. | Money uses consistent overview/list/detail/new/action taxonomy. |
| Household-first remains product identity. | Home and Together frame household context; settings stay household-owned. |

## Current-to-Target Route Consistency

| Current route | Canonical target | Status |
|---|---|---|
| `/home` | `/home` | Keep |
| `/money` | `/money` | Keep |
| `/money/accounts` | `/money/accounts` | Keep |
| `/money/accounts/[id]` | `/money/accounts/[id]` | Keep |
| `/money/add` | `/money/transactions/new` | Redirect-only |
| `/money/transactions/new` | `/money/transactions/new` | Keep |
| `/money/transactions/[id]/edit` | `/money/transactions/[id]/edit` | Keep |
| `/money/transactions/[id]/refund` | `/money/transactions/[id]/refund` | Keep |
| `/money/transactions/[id]/correct` | `/money/transactions/[id]/correct` | Keep |
| `/money/debts` | `/money/products/debts` | Migrate |
| `/money/loans` | `/money/products/loans` | Migrate |
| `/money/savings` | `/money/products/savings` | Migrate |
| `/money/cards` | `/money/products/loans` | Redirect-only |
| `/plan` | `/plan` | Keep |
| `/plan/jars` | `/plan/jars` | Keep |
| `/plan/goals` | `/plan/goals` | Keep |
| `/plan/recurring` | `/plan/recurring` | Keep |
| `/plan/calendar` | `/plan/calendar` | Keep |
| `/plan/ritual` | `/plan/ritual` | Keep |
| `/inbox` | `/inbox` | Keep |
| `/together` | `/together` | Keep |
| `/together/preferences` | `/together/preferences` or `/together/settings/preferences` | Keep as first-class if frequent |
| `/health` | `/health` | Keep secondary |

## Open IA Decisions for Later Phases

- Whether Policies and Preferences remain direct Together routes or nest under `/together/settings`.
- Whether Money Products gets its own intermediate screen or appears as a section inside Money Overview.
- Which create flows are full-page versus sheet presentation.
- Whether Health Insights later expands into reports/trends/scenarios.

