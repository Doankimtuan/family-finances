# Routing Philosophy

## Goals

- Every route has one responsibility.
- Every route belongs to one owner.
- No duplicated entry points.
- Detail and action routes are predictable.
- Modal and sheet presentation does not create parallel navigation.
- URLs describe product meaning, not implementation structure.

## Route Taxonomy

| Type | Pattern | Example |
|---|---|---|
| Product hub | `/<section>` | `/money` |
| Secondary list | `/<section>/<collection>` | `/money/accounts` |
| Product subgroup | `/<section>/<group>` | `/money/products` |
| Detail | `/<section>/<collection>/<id>` | `/money/accounts/[id]` |
| Create | `/<section>/<collection>/new` | `/money/transactions/new` |
| Edit | `/<section>/<collection>/<id>/edit` | `/money/transactions/[id]/edit` |
| Object action | `/<section>/<collection>/<id>/<action>` | `/money/transactions/[id]/refund` |
| Review queue | `/inbox` | `/inbox` |
| Review detail | `/inbox/[id]` | `/inbox/[id]` |
| Settings | `/together/settings/<topic>` | `/together/settings/preferences` |
| System | `/<system-state>` | `/offline` |

## Canonical Product Routes

Home:

- `/home`

Money:

- `/money`
- `/money/accounts`
- `/money/accounts/new`
- `/money/accounts/[id]`
- `/money/transactions`
- `/money/transactions/new`
- `/money/transactions/[id]`
- `/money/transactions/[id]/edit`
- `/money/transactions/[id]/refund`
- `/money/transactions/[id]/correct`
- `/money/products`
- `/money/products/debts`
- `/money/products/debts/new`
- `/money/products/debts/[id]`
- `/money/products/debts/[id]/pay`
- `/money/products/loans`
- `/money/products/loans/new`
- `/money/products/loans/[id]`
- `/money/products/loans/[id]/pay`
- `/money/products/loans/[id]/edit`
- `/money/products/loans/[id]/interest`
- `/money/products/loans/[id]/close`
- `/money/products/savings`
- `/money/products/savings/new`
- `/money/products/savings/[id]`
- `/money/products/savings/[id]/renewal`
- `/money/products/savings/[id]/early-withdraw`

Plan:

- `/plan`
- `/plan/jars`
- `/plan/jars/new`
- `/plan/jars/[id]`
- `/plan/jars/[id]/edit`
- `/plan/jars/[id]/reallocate`
- `/plan/goals`
- `/plan/goals/new`
- `/plan/goals/[id]`
- `/plan/goals/[id]/edit`
- `/plan/goals/[id]/contribute`
- `/plan/recurring`
- `/plan/recurring/new`
- `/plan/recurring/[id]`
- `/plan/recurring/[id]/edit`
- `/plan/calendar`
- `/plan/ritual`

Inbox:

- `/inbox`
- `/inbox/[id]`

Together:

- `/together`
- `/together/members`
- `/together/invitations`
- `/together/invitations/new`
- `/together/policies`
- `/together/preferences`
- `/together/settings`
- `/together/settings/account`
- `/together/onboard`

Health:

- `/health`
- `/health/insights`

## Compatibility Routes

Compatibility routes must be redirects only:

- `/money/add` -> `/money/transactions/new`
- `/money/cards` -> `/money/products/loans`
- `/money/cards/[id]` -> `/money/products/loans/[id]`
- Current `/money/debts` may redirect to `/money/products/debts` after migration.
- Current `/money/loans` may redirect to `/money/products/loans` after migration.
- Current `/money/savings` may redirect to `/money/products/savings` after migration.

Rules:

- No visible navigation may point to compatibility routes.
- Compatibility routes are not listed as canonical screens.
- Analytics should attribute compatibility traffic to canonical routes.

## Modal Routes

Use modal or bottom-sheet presentation for lightweight actions only when the URL remains canonical.

Rules:

- Creation flows that can be abandoned safely may open as sheets from a list.
- Complex creation wizards use full routes.
- Object actions that need confirmation may use modal presentation inside the detail route.
- If a flow needs refresh/deep-link support, use a canonical route.
- Do not create duplicate modal and page URLs for the same action.

## Creation Routes

Rules:

- Creation routes use `/new`.
- One create route per entity.
- Hubs may launch create routes, but do not own them unless the entity belongs to the hub owner.
- Create completion returns to object detail or parent list.

## Detail Routes

Rules:

- Detail routes use `[id]`.
- Detail screens show one entity only.
- Detail screens may expose actions, but actions belong to child action routes or modal confirmations.

## Settings Routes

Rules:

- Household settings live under `/together/settings`.
- Policies and preferences may remain first-class Together routes if they are frequent household work.
- Account lifecycle belongs under Together settings/account.

## History Routes

Rules:

- Transaction history is `/money/transactions`.
- Account-specific history is inside account detail.
- Product-specific history belongs inside product detail.
- Calendar projection remains `/plan/calendar`.

## Search Routes

No global search route is defined in Phase B.

Future search pattern:

- Global search: `/search`
- Section search: `/<section>/search`
- Search must be read-only and must route result selection to owner detail screens.

