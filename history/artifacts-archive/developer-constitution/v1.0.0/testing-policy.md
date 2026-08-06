---
document: Testing Policy
developer_constitution: v1.0.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260801T230000Z
created_at: 2026-08-01T16:38:51Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# Testing Policy

## Required layers

Every feature delivery **must** define:

1. **Unit tests** — domain rules, schemas, pure utils
2. **Integration tests** — application services + repositories (or mocked infra)
3. **Acceptance mapping** — story/AC links in PR description or test titles
4. **E2E** — critical journeys (Playwright)

## Critical journeys (minimum)

Must retain E2E coverage as stories land:

- Auth session
- Capture money path (idempotent)
- Inbox resolve
- Month Ritual assisted path
- Offline fail-closed money mutation (AC-018)
- Keyboard paths (AC-019)

## Tooling

- Unit/integration: Vitest (or repository standard if already locked)
- E2E: Playwright
- Do not skip tests for “demo-only” money paths

## Definition of Done

A story is not done without tests matching Implementation Plan DoD layers for that story.
