# Module Ownership

Every screen has exactly one owner. A screen may read or display data from another module, but the owner is responsible for route, page composition, local UI, dialogs, forms, and navigation contract.

## Ownership Matrix

| Module | Responsibilities | Owned entities | Owned routes | Dependencies | Forbidden dependencies |
|---|---|---|---|---|---|
| `home` | Household orientation, dashboard composition, next action routing. | Dashboard view models only. | `/home` | Reads tenancy context and approved application summaries. | Must not own money/plan/inbox/together actions. |
| `tenancy` | Auth, household identity, members, invitations, policies, preferences, onboarding, account lifecycle, route constants. | User, household, membership, invitation, policy, preference. | Auth routes, invite routes, `/together`, `/together/*`, `/together/onboard`. | Platform/Supabase; may read plan constants for policy UI if needed. | Must not own ledger/plan/savings/health business actions. |
| `ledger` | Financial reality: accounts, transactions, categories, debts, loans, money product inventory where ledger owns truth. | Account, transaction, category, debt, loan, credit-card compatibility state. | `/money`, `/money/accounts*`, `/money/transactions*`, `/money/products/debts*`, `/money/products/loans*`. | Tenancy auth/membership guard; may coordinate with inbox through app actions. | Must not own plan allocation, health scoring, or household policy routes. |
| `savings` | Savings lifecycle and savings product screens within Money Products. | Saving, saving cycle, provider/package, renewal preference/policy UI. | `/money/products/savings*`. | Ledger for funding/money truth; tenancy guard; inbox for maturity review handoff. | Must not directly own transaction history or plan screens. |
| `plan` | Household intentions: jars, goals, recurring, calendar, ritual. | Jar, goal, recurring rule, calendar projection, ritual. | `/plan`, `/plan/jars*`, `/plan/goals*`, `/plan/recurring*`, `/plan/calendar`, `/plan/ritual`. | Tenancy guard; ledger read APIs where existing app requires financial context; inbox for emergency/review signals. | Must not own ledger money capture or savings lifecycle screens. |
| `inbox` | Review queue, review detail, review decisions. | Review item, queue filters, decision panel state. | `/inbox`, `/inbox/[id]`. | May coordinate with ledger, plan, savings, tenancy through typed app actions. | Must not become a second home for owner detail pages. |
| `health` | Read-only household health and insights. | Health overview, health insight view models. | `/health`, `/health/insights`. | Reads approved module summaries; platform AI guardrails if used. | Must not mutate money, plan, inbox, savings, or tenancy state. |
| `platform` | Infrastructure, route handlers, Supabase, maintenance, observability, AI policy. | Infrastructure-only concerns. | API/auth route handlers and system support. | All modules may depend on platform adapters through approved application APIs. | Must not own product screens. |
| `shared-kernel` | Shared cross-domain contracts only when truly active. | Stable shared contracts. | None. | Imported by modules only when necessary. | Must not become a utility dumping ground. |

## Owned UI

### `home`

- Owned UI: Home dashboard sections, dashboard summary widgets, next action launchers.
- Owned dialogs/forms: none by default.
- Owned components: home-local cards and summaries that do not belong to a domain entity.

### `tenancy`

- Owned UI: Auth screens, invite screens, onboard wizard, together household panels, member list, invitations panel, policies/preferences/settings forms.
- Owned dialogs/forms: login, register, forgot password, invite, onboarding, invitation creation, policies, preferences, account lifecycle confirmations.
- Owned components: household member cards, invitation controls, settings panels.

### `ledger`

- Owned UI: Money overview, account list/detail, transaction list/detail, debt/loan product list/detail, money action flows.
- Owned dialogs/forms: create account, create transaction, edit/correct/refund transaction, create/pay debt, create/pay/edit/close loan.
- Owned components: account card, transaction row, debt card, loan card, money product row, money history filters.

### `savings`

- Owned UI: savings list/detail/new/renewal/early-withdraw.
- Owned dialogs/forms: create saving wizard, renewal policy editor, early withdraw form.
- Owned components: saving card, saving cycle row, savings provider selector, savings maturity summary.

### `plan`

- Owned UI: plan overview, jar/goal/recurring/calendar/ritual screens.
- Owned dialogs/forms: create jar/category, reallocate jar, create/update goal, contribute to goal, create/edit recurring, ritual wizard.
- Owned components: jar card, goal card, recurring row, calendar view, ritual progress.

### `inbox`

- Owned UI: queue, filters/tabs, review detail, decision panel.
- Owned dialogs/forms: review decision confirmation where needed.
- Owned components: review card, review queue tabs, decision panel.

### `health`

- Owned UI: overview, insights, health score/summary surfaces.
- Owned dialogs/forms: none by default.
- Owned components: health card, insight card, health trend summary.

## Dependency Rules

- UI ownership follows route ownership.
- A screen may display a foreign entity only as read-only context unless the foreign module exposes an explicit action entry.
- Cross-module mutation must be routed through the owning module's application API.
- Inbox decisions may trigger owner-module actions, but Inbox still owns the review screen.
- Health is read-only.
- Home is an aggregator, not a mutation owner.

