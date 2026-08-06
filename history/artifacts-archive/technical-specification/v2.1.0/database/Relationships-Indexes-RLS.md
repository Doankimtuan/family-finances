---
document: ER, Indexes, Constraints, RLS, Migrations
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

# ER, Indexes, Constraints, RLS, Migrations

## Relationships

Household 1—* Members/Accounts/Jars/InboxItems/…  
Account 1—* Transactions  
Jar 1—* Movements; ReviewItem → optional Transaction/Jar  
InstallmentPlan → Account/BillingItem  
MonthRitual → Household + period  

## Indexes

`(household_id, created_at)` on transactions; `(household_id, status)` on inbox_items; `(household_id, period)` on rituals.

## Constraints

Positive amounts where applicable; jar state enum; ritual status enum; FK household_id.

## RLS Policies

`is_household_member(household_id)` for CRUD; system categories readable; service-role jobs restricted.

## Migration Strategy

Expand/contract; additive inbox abstraction first; do not break V1 data during strangler.
