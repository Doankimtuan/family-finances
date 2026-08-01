---
document: Layout Specifications
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

# Layout Specifications

## Root layout

Providers (query, theme, i18n) via platform; resolve locale from household when member.

## Product shell layout

Primary nav: Home | Money | Plan | Inbox | Together. Inbox badge from `GetInboxCount`.

## Gates

Unauthenticated → login; authenticated without household → onboard/together create.
