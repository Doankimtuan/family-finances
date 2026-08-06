---
generated_by: AIOS Final Composition
run_id: run_final_composition_20260801T131500Z
business_discovery: run_business_discovery_20260801T122000Z
specification: run_specification_20260801T130500Z
created_at: 2026-08-01T13:12:48Z
status: FROZEN
invent_business_logic: false
redesign: false
---

# Implementation Plan

## Implementation Entries

- **impl-order-1**: Implement/verify tenancy+auth gates before feature work (permissions + login/household journeys).
- **impl-order-2**: Preserve real ledger modules (accounts/transactions) separately from jar intent layer modules.
- **impl-order-3**: Jar sync → review → month close path must follow discovered workflow order.
- **impl-order-4**: Savings and card installment flows follow discovered state machines; do not add statuses.
- **impl-order-5**: Apply coding standards: domain rules in lib/jars/domain; actions via resolveActionContext; Zod at edges.
- **mig-sql-only**: Schema changes MUST go through supabase/migrations numbered files; do not edit historical migrations in place.
- **mig-jar-intent**: Jar intent layer migrations 00040/00046 define current jar architecture; new jar behavior must extend, not fork, these contracts.
- **mig-no-dual-write**: Migration/implementation guide: do not introduce dual-write between jar_movements and transactions balances.
- **mig-rls-required**: Any new household-scoped table MUST attach membership RLS consistent with is_household_member pattern.

## Related Tasks

- **task-trace-matrix**: Maintain requirements↔acceptance↔source trace matrix for this specification run.
- **task-jar-invariants-tests**: Add/extend tests around discovered jar invariants (active jar, closed month, positive amounts) without changing rules.
- **task-rls-regression**: Add RLS regression checks for is_household_member membership isolation.
- **task-admin-gate-tests**: Cover admin-only settings/assumptions gates discovered in permissions.
- **task-savings-transitions**: Verify savings maturity/withdraw transition guards match discovered state machine.
- **task-installment-complete**: Verify installment completion condition paid>=num as discovered.
- **task-api-inventory-docs**: Document the 17 discovered API routes in maintainer docs using API specification entries (no new endpoints).
- **task-transfer-rule-gap**: Document existing transfer transaction constraints from schema (BD soft gap) into business pack follow-up — observe only, do not invent.
- **task-soft-delete-gap**: Trace soft-delete migration 00043 behavior into knowledge/business follow-up discovery (observe only).
- **task-onboarding-e2e**: E2E cover eight discovered onboarding steps routes.

## Related Roadmap

- **rm-m0**: M0 (done): Business Discovery frozen PASS + Specification Generation from validated artifacts.
- **rm-m1**: M1: Verification hardening — jar invariants, RLS, admin gates, savings/installment transitions tests.
- **rm-m2**: M2: Close BD soft gaps (transfer shape, soft-delete) via additional discovery notes only — still no redesign.
- **rm-m3**: M3: Optional Phase 1 framework-discovery remediation (separate from product specs) if orchestrator authorizes.
