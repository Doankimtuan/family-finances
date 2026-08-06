# Navigation Architecture

## Bottom Navigation

Canonical bottom tabs:

| Tab | Route | Responsibility |
|---|---|---|
| Home | `/home` | Household dashboard and next actions. |
| Money | `/money` | Financial reality, money inventory, transaction history. |
| Plan | `/plan` | Household intentions and planning workflows. |
| Inbox | `/inbox` | Review queue and decisions. |
| Together | `/together` | Household members, access, policies, preferences, settings. |

Rules:

- Bottom navigation has exactly five items.
- Bottom navigation never contains Health, Settings, or object-specific routes.
- Active tab is based on the top-level product section.
- Cross-module deep links preserve the active top-level destination after navigation.

## Top Navigation

Top navigation is screen-local and should answer:

- Where am I?
- Can I go back?
- What is the one primary action for this screen?

Rules:

- Hubs have titles and optional primary action.
- Detail screens have back navigation to their parent list or originating screen.
- Action screens have cancel/back and submit/confirm.
- Top navigation does not duplicate bottom navigation.
- Top navigation should not expose more than one primary action.

## Secondary Navigation

Secondary navigation exists inside hubs only.

Money secondary groups:

- Overview
- Accounts
- Transactions
- Products

Money Products groups:

- Debts
- Loans
- Savings
- Future: Investments
- Future: Insurance
- Future: Net Worth

Plan secondary groups:

- Overview
- Jars
- Goals
- Recurring
- Calendar
- Ritual

Together secondary groups:

- Members
- Invitations
- Policies
- Preferences
- Settings

Health secondary groups:

- Overview
- Insights

## Deep Links

Deep links are valid for:

- Primary hubs.
- List screens.
- Detail screens.
- Review detail.
- Auth/invite/onboarding/system routes.

Deep links should be stable and owner-based. A deep link should never depend on how the user discovered the screen.

## Back Navigation

Back behavior:

| Current screen type | Back target |
|---|---|
| Primary hub | Previous browser/app history or no-op if root. |
| Secondary list | Owning hub. |
| Detail | Parent list. |
| Create flow | Parent list or originating hub. |
| Object action | Object detail. |
| Review detail | Inbox queue. |
| Auth secondary | Prior auth screen or welcome/login. |
| System screen | Safe route based on state. |

## Cross-Module Navigation

Allowed cross-module navigation:

- Home may link to any product area as an orientation hub.
- Inbox may link to the affected object after a decision.
- Money may link to Inbox only when money work creates or requires review.
- Plan may link to Inbox for emergency/review-driven work.
- Together may link to onboarding/settings/account lifecycle.
- Health may link back to Home, Money, or Plan only as read-only context.

Rules:

- Cross-module links are explicit exits, not hidden side navigation.
- Cross-module actions belong to the owner of the destination screen.
- A screen may display data from another module, but ownership remains with the screen owner.

## Entry Points

Canonical entry points:

- `/` public entry
- `/welcome`
- `/login`
- `/register`
- `/forgot-password`
- `/invite/[token]`
- `/together/onboard`
- `/home`
- `/money`
- `/plan`
- `/inbox`
- `/together`

Secondary entry points:

- `/health`
- `/together/settings`
- object detail deep links
- review detail deep links

Removed from navigational mental model:

- `/money/add`
- `/money/cards`
- `/money/cards/[id]`

These may remain as invisible redirects during migration, but no UI should link to them.

## Exit Points

Exit points include:

- Auth sign out.
- Account lifecycle actions.
- System recovery links.
- Back/cancel from action flows.
- Completion transitions from create/edit/action flows.

Completion rules:

- Create object: return to created object detail or parent list.
- Edit object: return to object detail.
- Correct/refund/payment/action: return to object detail or review item if launched from Inbox.
- Onboarding complete: go to Home.

