---
document: Component Hierarchy
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

# Component Hierarchy

## Shared (`components/`)

Button, Input, Dialog, Toast, Skeleton, EmptyState — presentational only.

## Feature components (by surface)

- Home: `RealPositionCard`, `PlanPulseCard`, `InboxCta`, `HealthChip`  
- Money: `TransactionCaptureForm`, `AccountsList`, `SavingsPanel`, `InstallmentPanel`  
- Plan: `JarList`, `JarStateBadge`, `MonthRitualWizard`, `GoalList`, `RecurringList`  
- Inbox: `InboxCard`, `ResolveToJarActions`  
- Together: `MemberList`, `InviteForm`, `PolicyForm`  

Feature components call adapters/hooks — never repositories.
