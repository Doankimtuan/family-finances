---
document: Module Catalog
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Module Catalog

| Module ID | Type | Ownership | Product surfaces | Public API style |
|-----------|------|-----------|------------------|------------------|
| `shared-kernel` | shared | Result, Money, ids, errors, logging-context | — | commands/queries + Zod DTOs |
| `tenancy` | bc | Household, Member, Invitation, AuthContext | Together, Auth | commands/queries + Zod DTOs |
| `ledger` | bc | Account, Transaction, Liability, Installment | Money | commands/queries + Zod DTOs |
| `savings` | application (ledger-owned) | Saving, SavingCycle, SavingProvider, SavingPackage, EarlyWithdrawal | Money / Savings | commands/queries + Zod DTOs |
| `plan` | bc | Jar, JarPlan, JarRule, Movement, MonthRitual, Goal, RecurringRule | Plan | commands/queries + Zod DTOs |
| `inbox` | bc | ReviewItem, ApprovalItem, InboxQuery | Inbox | commands/queries + Zod DTOs |
| `health` | bc | HealthSnapshot, Insight, Scenario | Home chip, Health | commands/queries + Zod DTOs |
| `app-shell` | ui | layouts, nav, providers | — | commands/queries + Zod DTOs |
| `api-facade` | adapter | /api/v1 routes, DTO mappers | — | commands/queries + Zod DTOs |
| `ui-adapters` | adapter | Server Actions, RSC loaders | — | commands/queries + Zod DTOs |
| `platform` | platform | supabase clients, proxy, observability, workers-outbox | — | commands/queries + Zod DTOs |

## Ownership rule

Only the owning module may persist its aggregates. Cross-context references use IDs + anti-corruption mappers.

## Savings module note (ledger-owned product surface)

`modules/savings` is **not** a new peer bounded context. It is a Real Ledger application module:

- Money truth remains ledger `accounts` + `transactions` (BR-01).
- Product aggregates (`savings`, `saving_cycles`, providers/packages) are owned by `modules/savings`.
- Dependency: `savings` may use platform + tenancy; **must not** import `inbox` / `plan` / `health`.
- `inbox` and `app` orchestrate maturity / early-withdrawal decisions by calling savings commands after typed ReviewItem acknowledgment (BR-10 / BR-21).
- `health` may read savings allocation / yield metrics only (BR-24 Health-RO).
