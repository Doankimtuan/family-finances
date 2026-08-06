---
document: System Context Diagram
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# System Context Diagram

## Actors

| Actor | Goals |
|-------|-------|
| Partner | Capture money, resolve Inbox, view Home/Plan |
| Admin Partner | Policies/assumptions with audit visibility |
| System Worker (optional) | Score Health, fan-out notifications |

## External systems

Supabase Auth · Supabase Postgres/RLS · Hosting (Vercel) · Error/Telemetry · (optional) Worker platform

## Trust boundaries

- Browser untrusted  
- Server trusted with user session  
- DB enforces household RLS  
- Service role only for approved aggregates/jobs  
