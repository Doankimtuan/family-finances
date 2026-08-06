# Module Review

High-level only. Business rules and implementation details were intentionally not reviewed.

## Module Summary

| Module | Responsibility | Entry points | Routes using it | Major screens | Dependencies observed |
|---|---|---|---|---|---|
| `tenancy` | Auth, household, membership, policies, invitations, app paths. | `application/index.ts`, `app-path.ts`, auth/session/policy APIs. | Auth, invite, onboard, all product routes for auth/membership gates. | Login, Register, Forgot Password, Welcome, Invite Accept, Onboard, Together, Policies, Preferences. | Platform/Supabase indirectly; imported broadly by app routes. |
| `ledger` | Money accounts, transactions, categories, debts/loans/cards money product APIs. | `application/index.ts`, command/query files, `client.ts`, constants/types. | Money, Inbox decision, Plan jars/category, Savings funding flows. | Money hub, accounts, transactions, debts, loans, account details, transaction detail/edit/refund/correct. | Used by app routes and savings/plan orchestration surfaces. |
| `plan` | Jars, goals, recurring items, calendar, ritual, plan pulse. | `application/index.ts`, command/query files, constants/types. | Plan hub, jars, goals, recurring, calendar, ritual, policies form. | Plan hub, Jar list/detail, Goal list/detail, Recurring list/detail, Calendar, Ritual. | Reads/collaborates with ledger/inbox through app orchestration. |
| `inbox` | Review queue and decision/resolution surfaces. | `application/index.ts`, `review-items.ts`, display/types/constants. | Inbox, Plan emergency banners, Savings maturity actions. | Inbox queue, Inbox detail, Inbox decision panel. | Ledger and savings are used by UI decision handling. |
| `savings` | Savings product lifecycle and provider logic. | `application/index.ts`, commands, queries, types/constants. | Money savings list/detail/new/early-withdraw, Inbox decisions. | Savings list, Create Saving wizard, Savings detail, Early Withdraw. | Ledger for funding/money truth; platform in server actions. |
| `health` | Read-only financial health scores and insights. | `application/index.ts`, overview/detail/insights APIs. | Health, Health Insights, Home health chip. | Health overview, Health insights. | Reads other modules through application queries. |
| `home` | Home dashboard composition. | `application/index.ts`, `get-home-dashboard.ts`. | Home. | Home dashboard, day-zero actions, health chip, inbox CTA. | Imported by home route; app route also uses tenancy. |
| `platform` | Supabase clients, route handling, maintenance, AI policy, observability placeholders. | `application/index.ts`, `supabase/index.ts`. | API/auth routes and server actions indirectly. | No direct user screen. | Supabase, route handlers, read-only wrappers. |
| `shared-kernel` | Intended shared domain/application/infrastructure contracts. | README and `.gitkeep` only. | None observed. | None. | None observed. |

## Module Architecture Issues

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| App routes import `tenancy` almost everywhere for session and membership checks. This repeats routing guard logic across screens. | Medium | Medium | Medium |
| Money screens import several modules directly in route components and client action components. This keeps screen composition coupled to multiple contexts. | Medium | High | Medium |
| `savings` is a domain module but appears as a Money route subtree. This is legitimate, but Phase B must decide whether the user-facing IA calls it Money inventory or a distinct financial product area. | Medium | High | Medium |
| `health` is a leaf/read-only module with product routes but no bottom-tab entry. Discovery depends on Home or secondary links. | Medium | Medium | Low |
| `shared-kernel` currently has no visible active responsibility. | Medium | Medium | Low |
| Deprecated ledger and savings aliases remain in application code. Even if correct for migration, they are redesign noise. | Medium | Medium | Medium |
| `platform/jobs` and `platform/observability` are placeholders. | Low | Low | Low |

## Module Readiness

The bounded-context architecture is readable and stable enough for redesign. Phase B should avoid changing module boundaries, but should introduce a clearer route-level composition strategy so screens do not each rediscover auth, membership, loading, empty, and mutation conventions.

