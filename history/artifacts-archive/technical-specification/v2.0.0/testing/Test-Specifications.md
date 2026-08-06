---
document: Testing Specifications
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

# Testing Specifications

## Unit

Domain invariants + application commands with fake repos for each module.

## Integration

Repository + RLS against test DB; API contract tests for `/api/v1`.

## E2E (Playwright)

Onboard ≤3 · Capture expense · Inbox resolve · Month Ritual · Real≠virtual assertion on Plan/Home.

## Acceptance mapping

| AC | Test type |
|----|-----------|
| AC-001 Home real≠virtual | E2E |
| AC-002 Auth gate | E2E |
| AC-003 Active jar only | Unit+E2E |
| AC-005 Inbox unmapped | E2E |
| AC-008 Ritual lock | Integration+E2E |
| AC-014 Onboard steps | E2E |
| AC-015 Health visible | E2E |
| AC-018 Online mutation | Unit (guard) |
| AC-019 A11y keyboard | E2E a11y |
