# Navigation Review

## Current Navigation Model

Primary product shell:

- `ChromeShell` wraps product routes.
- `BottomNavigation` renders five tabs.
- `TABS` are sourced from `shared/patterns/bottom-navigation-tabs.ts`.

Primary tabs:

- Home: `/home`
- Money: `/money`
- Plan: `/plan`
- Inbox: `/inbox`
- Together: `/together`

Explicitly excluded from bottom tabs:

- Health: `/health`

Route groups:

- Auth routes have no bottom navigation.
- Invite routes have auth-style chrome.
- Onboard routes have auth-style chrome.
- Product routes have bottom navigation.
- System routes have system chrome and no bottom navigation.

## Route Inventory

Product roots:

- `/home`
- `/money`
- `/plan`
- `/inbox`
- `/together`
- `/health`

Money:

- `/money`
- `/money/accounts`
- `/money/accounts/[id]`
- `/money/transactions`
- `/money/transactions/new`
- `/money/transactions/[id]`
- `/money/transactions/[id]/edit`
- `/money/transactions/[id]/refund`
- `/money/transactions/[id]/correct`
- `/money/debts`
- `/money/debts/[id]`
- `/money/loans`
- `/money/loans/[id]`
- `/money/savings`
- `/money/savings/new`
- `/money/savings/[id]`
- `/money/savings/[id]/early-withdraw`
- `/money/add` compatibility alias
- `/money/cards` compatibility redirect
- `/money/cards/[id]` compatibility redirect

Plan:

- `/plan`
- `/plan/jars`
- `/plan/jars/[id]`
- `/plan/goals`
- `/plan/goals/[id]`
- `/plan/recurring`
- `/plan/recurring/[id]`
- `/plan/calendar`
- `/plan/ritual`

Inbox:

- `/inbox`
- `/inbox/[id]`

Together:

- `/together`
- `/together/invitations`
- `/together/policies`
- `/together/preferences`
- `/together/onboard`

Health:

- `/health`
- `/health/insights`

Auth/invite/system:

- `/`
- `/welcome`
- `/splash`
- `/login`
- `/register`
- `/forgot-password`
- `/auth/confirm`
- `/invite/[token]`
- `/error`
- `/offline`
- `/maintenance`
- `/permission`

## Navigation Issues

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| Health is a product route but not a tab, creating a sixth major area outside primary navigation. | Medium | Medium | Low |
| Money has the deepest and widest route tree, combining accounts, transactions, debts, loans, savings, compatibility cards, and capture aliases. | Medium | High | Medium |
| `/money/add` aliases to `/money/transactions/new`, while constants and navigation use the latter. This creates two mental models for capture. | Medium | Medium | Low |
| Deprecated `/money/cards` routes redirect to loans but remain in the app tree. | Medium | Medium | Low |
| Route naming mixes object nouns (`accounts`, `loans`), action nouns (`correct`, `refund`, `early-withdraw`), and legacy aliases without a documented taxonomy. | Medium | High | Medium |
| Detail/edit/correct/refund transaction routes imply a deep flow, but there is no visible shared pattern for action-page hierarchy. | Medium | Medium | Medium |
| Plan has five subareas under one tab. This is coherent, but Phase B needs a second-level navigation model. | Medium | High | Medium |
| Together routes are grouped consistently, but onboarding lives in `(onboard)` while its path is `/together/onboard`, which can confuse route ownership. | Low | Low | Low |

## Navigation Readiness

The five-tab foundation is strong. The redesign should focus on second-level grouping, route taxonomy, and compatibility-route containment rather than rethinking the whole shell.

