---
document: Design Foundation
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# Design Foundation v1.1.0

## Status

**OFFICIAL_DESIGN_SOURCE_OF_TRUTH** — mandatory for every future UI implementation.

## Board

Mobile Experience & Design System Board.

## Supersession

This pack **supersedes** Design Foundation v1.0.0 clauses on:

- Desktop side/top navigation  
- Independent desktop / multi-column layouts  
- Unspecified UI kit  

**Inherits** from v1.0.0: ViNha Calm Ledger visual direction, deep teal accent, Geist, Phosphor, 4px spacing, sparse motion, real≠virtual, content/a11y/collaboration principles.

Historical pack remains at `artifacts/design-foundation/v1.0.0/`.

## Product stance

ViNha is a household finance OS. Primary surfaces: **Home · Money · Plan · Inbox · Together** (Health via Home chip).

**Mobile Native** (not responsive-first, not desktop-first). The mobile UI is the source of truth. Desktop is a larger canvas hosting the same mobile UI inside a **440px** application viewport.

## Non-goals

- Do not redesign Product Definition, Architecture, or Technical Specification  
- Do not implement screens in this board  
- Do not introduce enterprise dashboard layouts  

## Document index

See [README.md](./README.md).
