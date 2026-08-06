# Conceptual Migration Plan — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Migration Strategy Overview

The transition from ViNha Business Model v1 to Business Model v2 must guarantee **Zero Data Loss**, **Zero Accounting Discrepancy**, and **100% Backward Compatibility** for existing users and historical financial records.

This document outlines the conceptual 4-phase migration strategy.

---

## 2. 4-Phase Migration Roadmap

```
+------------------+     +------------------+     +------------------+     +------------------+
| Phase 1: Schema  | --> | Phase 2: Data    | --> | Phase 3: Contract| --> | Phase 4: Full    |
| & Field Addition |     | Backfill & Link  |     | Enforcement      |     | Policy Activation|
+------------------+     +------------------+     +------------------+     +------------------+
```

---

## 3. Phase-by-Phase Execution Plan

### Phase 1: Schema Expansion (Non-Breaking)
- **Objective**: Add new fields, enums, and tables without affecting running v1 logic.
- **Conceptual Actions**:
  - Add nullable `reverses_transaction_id` and `corrects_transaction_id` fields to `Transaction` entity.
  - Add `is_emergency` boolean and `intent_note` text to `PlanMovement` entity.
  - Add `type` discriminator enum to `ReviewItem` entity (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`).
  - Add `category_jar_mappings` lookup contract table.

---

### Phase 2: Historical Data Backfill & Linking
- **Objective**: Sanitize and enrich existing historical data to conform to v2 structures.
- **Conceptual Actions**:
  - **Category-Jar Mapping**: Map all existing unmapped Categories to a system default "General Household Jar".
  - **ReviewItem Classification**: Assign `type = UnmappedExpense` to all legacy untyped ReviewItems.
  - **Refund Identification**: Scan historical credit transactions; populate `reverses_transaction_id` for identified refunds where matching original expenses exist.

---

### Phase 3: Business Contract Enforcement
- **Objective**: Activate strict v2 business rules.
- **Conceptual Actions**:
  - Enforce **BR-12**: Reject creation of unmapped categories.
  - Enforce **BR-02 & BR-03**: Activate 3-way correction audit chain and refund Jar capacity restoration.
  - Enforce **BR-24**: Enforce read-only database connections for Health domain.

---

### Phase 4: Temporal Policies & Ritual Auto-Lock
- **Objective**: Activate temporal background workers.
- **Conceptual Actions**:
  - Launch 30-Day Month Ritual Auto-Lock scheduled worker (**BR-08**).
  - Launch Inbox Staleness Auto-Archiving worker (**BR-15**).
  - Enable Quick Close mode eligibility check (**BR-23**).

---

## 4. Rollback & Emergency Contingency

1. **Schema Safety**: All new schema additions are additive and nullable; core v1 queries continue functioning uninterrupted if a rollback is triggered.
2. **Audit Preservation**: Data backfill scripts create append-only audit log tables (`migration_audit_log`), recording original and updated field states for instant rollback if required.
