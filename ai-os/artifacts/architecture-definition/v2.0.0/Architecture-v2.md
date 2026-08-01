---
document: Architecture v2
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Architecture v2

## Status

**OFFICIAL IMPLEMENTATION BLUEPRINT** — Architecture Definition `v2.0.0`  
Selected: **Candidate B — Balanced (modified)** per Architecture Decision freeze.

## System Context

```mermaid
C4Context
title System Context — ViNha Architecture v2
Person(partner, "Partner", "Household member")
Person(admin, "Admin Partner", "Elevated policies")
System_Boundary(vinha, "ViNha Web") {
  System(web, "Next.js App", "Home/Money/Plan/Inbox/Together")
}
System_Ext(supabase, "Supabase", "Auth + Postgres + RLS")
System_Ext(worker, "Optional Workers", "Health/notifications async")
System_Ext(obs, "Observability", "Logs/traces/errors")
Rel(partner, web, "Uses")
Rel(admin, web, "Uses + policies")
Rel(web, supabase, "SSR auth, SQL, RLS")
Rel(web, worker, "Outbox enqueue when enabled")
Rel(worker, supabase, "Read/write job data")
Rel(web, obs, "Telemetry")
```

*(If C4 renderer unavailable, see textual context below.)*

### Textual system context

- **Users:** Partners / Admin partners  
- **System:** Single Next.js deployable (web)  
- **External:** Supabase (Auth, Postgres, RLS); optional managed workers; observability vendors  
- **Out of scope runtime:** `ai-os/` control plane  

## Runtime shape

One web deployable + managed DB/auth. Application services per BC. UI Adapters (RSC/Actions) and API Facade (`/api/v1`) both call services. Optional workers consume outbox for Health/notifications.

## Product alignment

IA surfaces map to modules: Together/Auth→tenancy; Money→ledger; Plan→plan; Inbox→inbox; Health→health; Home composes queries across services without owning domain writes.
