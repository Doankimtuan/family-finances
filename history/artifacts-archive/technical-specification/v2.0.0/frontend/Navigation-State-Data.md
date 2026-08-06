---
document: Navigation, State, Data Fetching, Caching, Forms
technical_specification: v2.0.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_technical_specification_20260801T153000Z
created_at: 2026-08-01T15:00:41Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Navigation, State, Data Fetching, Caching, Forms

## Navigation Rules

Per Architecture Navigation — five primary destinations; Health secondary.

## State Management

RSC server truth; TanStack Query for client mutations/refresh; Zustand ephemeral UI only.

## Data Fetching

- Server Components call query services (via server-only adapters)  
- Client: `useMutation` → Action → invalidate query keys namespaced by household  

## Caching Strategy

TanStack cache; CDN static; no offline write cache.

## Forms & Validation

react-hook-form + Zod schemas shared with command inputs.

## Accessibility

Keyboard paths for capture, Inbox resolve, Month Ritual (REQ-019); focus rings; labels; don't use color alone for overspend.

## Responsive Rules

Nav collapses appropriately; capture form usable on mobile-first; cards stack single column on small screens.
