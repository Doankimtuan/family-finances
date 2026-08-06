# Executive Summary

The redesigned IA keeps the existing five-tab foundation and resolves the Phase A risks by making second-level hierarchy explicit. The product remains household-first: users begin at Home, manage financial reality in Money, manage intentions in Plan, resolve work in Inbox, and manage the household in Together.

Health remains important but should not become a sixth primary tab. It is a secondary household insight surface reachable from Home and relevant contextual links. Settings also remains secondary and is owned by Together because household identity, preferences, policies, and account lifecycle already live there.

## Target Structure

| Primary area | User meaning | Owner | Bottom tab |
|---|---|---|---|
| Home | Household overview and next best entry points. | `home` | Yes |
| Money | What exists, what happened, and money product inventory. | `ledger` plus product sub-owners | Yes |
| Plan | What the household intends to do. | `plan` | Yes |
| Inbox | What needs review or decision. | `inbox` | Yes |
| Together | Household people, access, policies, preferences, onboarding, settings. | `tenancy` | Yes |
| Health | Read-only household health and insights. | `health` | No |
| System/Auth | Entry, authentication, system states. | `tenancy` / `platform` | No |

## Main IA Improvements

- Keep bottom navigation minimal at five tabs.
- Treat Money as a predictable financial workspace with Overview, Accounts, Transactions, Products, and Actions.
- Treat Plan as a predictable intention workspace with Overview, Jars, Goals, Recurring, Calendar, and Ritual.
- Convert compatibility routes into invisible redirects, not entry points.
- Make each screen belong to exactly one owner.
- Standardize route taxonomy for overview, list, detail, create, edit, action, review, settings, and history.
- Make modal and sheet usage a presentation choice for simple creation/action flows, not a duplicated URL strategy.
- Move module-specific UI ownership out of generic shared patterns in future implementation phases.

## IA Scores

- Information Architecture Score: 8/10
- Navigation Simplicity Score: 8/10
- Scalability Score: 9/10
- Maintainability Score: 8/10
- Developer Experience Score: 8/10

