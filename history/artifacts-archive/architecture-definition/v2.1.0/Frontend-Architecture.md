---
document: Frontend Architecture
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Frontend Architecture

## Stack

Next.js App Router + React 19 + Tailwind + existing UI kit.

## Routing = Product IA

Route groups under `app/(product)/{home,money,plan,inbox,together}` (+ optional `health`).

## Rendering

- **RSC** loads read models via application query services (server).  
- **Client components** for capture forms, Inbox cards, charts.  
- **TanStack Query** when client refresh/mutation UX needs cache.  
- **Zustand** ephemeral UI only (modals, wizards).

## Navigation architecture

Primary nav: Home | Money | Plan | Inbox | Together. Gates: unauth→login; no household→together/onboard.

## Feature modules (UI)

UI feature folders colocated under each route; they call adapters — never SQL.
