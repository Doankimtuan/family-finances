---
document: Module Diagram
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Module Diagram

## Modules

- **`shared-kernel`** — Shared Kernel: owns Result, Money, ids, errors…
- **`tenancy`** — Tenancy: owns Household, Member, Invitation, AuthContext
- **`ledger`** — Real Ledger: owns Account, Transaction, Liability, SavingsAccount…
- **`plan`** — Intention Plan: owns Jar, JarPlan, JarRule, Movement…
- **`inbox`** — Inbox: owns ReviewItem, ApprovalItem, InboxQuery
- **`health`** — Insight/Health: owns HealthSnapshot, Insight, Scenario
- **`app-shell`** — App Shell / Navigation: owns layouts, nav, providers
- **`api-facade`** — API Facade: owns /api/v1 routes, DTO mappers
- **`ui-adapters`** — UI Adapters: owns Server Actions, RSC loaders
- **`platform`** — Platform: owns supabase clients, proxy, observability, workers-outbox

## Layering

1. `app/(product)/*` — routes by IA  
2. `ui-adapters` — Server Actions / RSC loaders  
3. `api-facade` — `/api/v1`  
4. BC application services (`tenancy|ledger|plan|inbox|health`)  
5. BC domain + infrastructure adapters (Supabase repos)  
6. `platform` + `shared-kernel`  
