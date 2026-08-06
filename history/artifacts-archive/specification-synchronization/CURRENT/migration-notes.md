# Implementation & Migration Notes — ViNha Specification v2.1

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Developer Implementation Guidance

This document provides explicit instructions for developers implementing Specification v2.1 in upcoming sprints.

---

## 2. Key Codebase Updates Required

### 2.1 Module Constants & Magic String Enforcement
- All ReviewItem type strings (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`) MUST be declared in `modules/inbox/application/inbox-constants.ts`.
- All transaction status enums (`PendingMapping`, `Posted`, `PartiallyRefunded`, `FullyRefunded`, `Reversed`) MUST be declared in `modules/ledger/application/ledger-constants.ts`.

### 2.2 Category-Jar Mapping Guard (BR-12)
- Update `CategoryApplicationService.createCategory()` to require a `jar_id` parameter.
- Add database constraint `FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE RESTRICT`.

### 2.3 3-Way Correction Transaction Atomic Service (BR-03)
- Implement `TransactionCorrectionService.executeCorrection()` inside a single SQL transaction:
  1. `UPDATE transactions SET status = 'Reversed' WHERE id = :original_id;`
  2. `INSERT INTO transactions (..., status, reverses_transaction_id) VALUES (..., 'Posted', :original_id);`
  3. `INSERT INTO transactions (..., status, corrects_transaction_id) VALUES (..., 'Posted', :original_id);`

### 2.4 Health Domain Read-Only Enforcer (BR-24)
- Configure the Health module's database connection context using a read-only database replica or read-only connection string context (`readOnly: true`).

---

## 3. Data Migration Scripts

1. **Backfill Category Mappings**: Assign existing unmapped categories to "General Household Jar".
2. **Backfill ReviewItem Types**: Default existing untyped `ReviewItem` records to `type = 'UnmappedExpense'`.
