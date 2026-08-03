# Constants Architecture Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Zero Magic Strings Audit Summary

ViNha enforces a strict **Zero Magic Strings Policy** codified in **Developer Constitution v1.1** (`AGENTS.md`).

An empirical search across the codebase verified that domain status keys, transaction directions, account types, and route paths are strictly exported as `as const` objects from documented home files.

---

## 2. Constant Home Directory Inventory

| Constant Category | Home File Location | Example Exported Constants | Verdict |
|---|---|---|---|
| **Ledger Domain Constants** | `modules/ledger/application/ledger-constants.ts` | `DEFAULT_CURRENCY`, `TransactionDirection`, `AccountType`, `CardBillingMonthStatus` | **PASSED** |
| **Plan Domain Constants** | `modules/plan/application/plan-constants.ts` | `JarAllocationType`, `MonthRitualStatus`, `PlanMovementType` | **PASSED** |
| **Inbox Domain Constants** | `modules/inbox/application/inbox-constants.ts` | `ReviewItemType`, `ReviewItemStatus`, `InboxFilterType` | **PASSED** |
| **Tenancy & Auth Constants** | `modules/tenancy/application/tenancy-constants.ts`, `auth-constants.ts` | `HouseholdRole`, `AuthStatus`, `AuthErrorCode` | **PASSED** |
| **Route Path Namespaces** | `modules/tenancy/application/app-path.ts` | `APP_PATH`, `RoutePath`, `invitePath()`, `moneyAccountPath()` | **PASSED** |
| **Cross-Cutting Constants** | `shared/constants/README.md` | Governed by clear decision tree (empty by design until cross-module constant needed). | **PASSED** |

---

## 3. Governance Rules for Future Sprints

1. **Never Hardcode Route Strings**: Always import route paths from `APP_PATH` in `modules/tenancy/application/app-path.ts`.
2. **Never Hardcode Domain Keys**: Always import status enums and category keys from `modules/<bc>/application/*-constants.ts`.
3. **No Duplicate Constant Files**: Before adding a new constant, verify whether its natural home is inside an existing module `*-constants.ts` file.
