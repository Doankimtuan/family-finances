# Architecture Definition v2.1 — ViNha Household Money Operating System

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Architectural System Overview

ViNha is designed as a **Modular Domain-Driven Architecture (DDD)** organized around **9 Bounded Contexts**. 

The architecture enforces strict domain isolation, event-driven inter-domain communication, and absolute compliance with **BR-01** (Real Ledger ≠ Virtual Jars) and **BR-24** (`Health-RO`, Health Read-Only Policy).

```
+-----------------------------------------------------------------------------------+
|                                 VINHA ARCHITECTURE                                |
+-----------------------------------------------------------------------------------+
|  OPERATIONAL DOMAINS (Read/Write)                                                 |
|  - Accounts          · Physical Bank Accounts & Cash Balance Management           |
|  - Transactions      · Immutable Ledger, Refunds, 3-Way Corrections               |
|  - Categories        · Expense Classification & N:1 Jar Mapping Contract          |
|  - Budgets / Jars    · Virtual Allocation Capacity, Emergency Reallocations       |
|  - Planning          · Income Rules, Recurring Patterns, Calendar Schedules      |
|  - Inbox             · Typed Decision Queue & Policy Engine Auto-Resolution      |
|  - Cards / Debt      · Credit Cards, Interest Tracking, Installment Payoffs       |
|  - MonthRitual       · Reflection Workflow, 30-Day Temporal Auto-Lock             |
+-----------------------------------------------------------------------------------+
                                          |
                                   Reads Snapshots Only (BR-24)
                                          v
+-----------------------------------------------------------------------------------+
|  READ-ONLY DOMAIN (Zero Write Access)                                             |
|  - Health (Health-RO) · Financial Health Scoring, Trends, Narrative Synthesizer   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Bounded Context Ownership & Responsibility

| Domain / Bounded Context | Owned Business Entities | Key Responsibilities | Inbound Event Triggers | Outbound Business Events |
|---|---|---|---|---|
| **Accounts** | `Account`, `AccountBalance` | Bank account & cash reconciliation. | Bank Feed API, Manual Entry. | `AccountCreatedEvent`, `AccountReconciledEvent` |
| **Transactions** | `Transaction`, `RefundLink`, `CorrectionChain` | Immutable ledger, refund linkage, 3-way correction audit chain. | Ingestion API, User Triage. | `TransactionIngestedEvent`, `RefundPostedEvent`, `TransactionCorrectedEvent` |
| **Categories** | `Category`, `CategoryJarMapping` | Category taxonomy, N:1 Jar mapping contract. | Admin/User Setup. | `CategoryCreatedEvent`, `CategoryMappedEvent` |
| **Budgets / Jars** | `Jar`, `PlanMovement`, `EmergencyDeclaration` | Virtual plan capacity, mid-month reallocations, emergency flow. | Income Allocation, Expense Posting. | `JarCapacityUpdatedEvent`, `EmergencyDeclaredEvent` |
| **Planning** | `IncomeRule`, `RecurringPattern`, `CalendarSchedule` | Income auto-allocation, recurring pattern generation, schedule projections. | Scheduled Worker, User setup. | `IncomeAllocatedEvent`, `RecurringPatternTriggeredEvent` |
| **Inbox** | `ReviewItem`, `ResolutionPolicy` | Typed decision queue (`UnmappedExpense`, `MaturityDecision`, etc.), auto-resolution. | All Operational Events. | `ReviewItemCreatedEvent`, `ReviewItemResolvedEvent` |
| **Cards / Debt** | `CreditCard`, `Installment` | Card payment due reminders, interest cost surfacing, debt payoff. | Billing cycle closed, Payment due. | `PaymentDueApproachingEvent`, `InstallmentPaidOffEvent` |
| **MonthRitual** | `MonthRitual`, `RitualStep` | Monthly reflection workflow, 30-day temporal auto-lock, Quick Close. | Month-end calendar, Temporal worker. | `RitualStartedEvent`, `MonthLockedEvent` |
| **Health (`Health-RO`)** | `HealthScore`, `TrendSnapshot` | Read-only scoring, financial health indicators, narrative synthesis. | Read-Only Snapshot Trigger. | **NONE (Read-Only Leaf Context)** |

---

## 3. Cross-Domain Event Architecture & Integration Rules

1. **Strict Event Payload Decoupling**: Domains communicate exclusively via domain events published over the internal event bus. Direct cross-domain database queries are strictly prohibited.
2. **Zero Circular Event Loops**: Operational domains emit events downward or laterally to Inbox and MonthRitual. Health reads data as a pure downstream subscriber (**BR-24**).
3. **Ledger Immutability Guarantee**: Transactions cannot be overwritten. `RefundPostedEvent` and `TransactionCorrectedEvent` append new ledger records and emit updates to Budgets/Jars.
