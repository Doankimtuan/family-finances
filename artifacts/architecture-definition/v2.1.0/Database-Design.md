---
document: Database Design
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Database Design

## Core entities (logical)

Align with Product Domain Model: Household, Member, Account, Transaction, Jar, ReviewItem, Movement, MonthRitual, Goal, RecurringRule, SavingsAccount, InstallmentPlan, HealthSnapshot.

## Strangler notes

- `jar_review_queue` readable as Inbox ReviewItem via inbox repository  
- New writes should prefer inbox abstraction  

## Indexes / performance

Index tenant + time on transactions; inbox open-items by household+status; ritual by household+period.
