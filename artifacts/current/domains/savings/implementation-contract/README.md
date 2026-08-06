# Savings Implementation Contract

Domain: Savings

Status: Phase 5 canonical implementation behavior contract.

## Purpose

This contract tells future implementation agents exactly what Savings actions can occur, which state changes are allowed, which business rules execute, which modules are affected, which Inbox items are created, which Ledger entries are created, and which notifications are generated.

It is not a business redesign, DDD redesign, architecture redesign, API design, database design, or UI design.

## Source

This contract derives only from:

- Phase 1: `artifacts/financial-domain-discovery/Savings/CURRENT`
- Phase 2: `artifacts/household-reality-validation/Savings/CURRENT`
- Phase 3: `artifacts/product-decision/Savings/CURRENT`
- Phase 4: `artifacts/business-blueprint/Savings/CURRENT`

## Scope

In scope:

- Savings lifecycle behavior.
- Allowed business actions.
- Ledger/no-ledger rules.
- Inbox decision rules.
- Notification behavior.
- Permissions by actor.
- UI behavior constraints.
- Edge-case expected behavior.

Out of scope:

- Code.
- Database schema.
- API contracts.
- UI design.
- Frozen SoT modification.

## Global Invariants

- Savings is Real Ledger money, never Plan/Jar money.
- Expected interest never writes Ledger.
- Accrued interest never writes Ledger.
- Posted/provider-confirmed actuals can write Ledger.
- Inbox acknowledgment never writes Ledger by itself.
- Health is read-only.
- Renewal preference never silently moves money.
- Partial withdrawal is not standard behavior.
- Planning pause never changes Savings state.

