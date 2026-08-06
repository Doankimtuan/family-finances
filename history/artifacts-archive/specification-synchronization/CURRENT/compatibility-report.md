# Backward Compatibility Report — ViNha Specification v2.1

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Compatibility Overview

Specification v2.1 ensures **100% Backward Compatibility** with existing v2.0 data models and APIs. All database schema changes are strictly additive and non-breaking, enabling zero-downtime upgrades.

---

## 2. API & Database Compatibility Assessment

| Domain / API Surface | Schema / API Modification | Compatibility Status | Impact / Notes |
|---|---|---|---|
| **Transactions API** | Added optional `reverses_transaction_id` and `corrects_transaction_id` fields. | **100% COMPATIBLE** | Fields are nullable; existing GET/POST endpoints work without modification. |
| **ReviewItem API** | Added `type` discriminator enum to payload responses. | **100% COMPATIBLE** | Legacy untyped items default to `UnmappedExpense` during migration. |
| **Budgets / Jars API** | Added optional `is_emergency` and `intent_note` to reallocation payload. | **100% COMPATIBLE** | Defaults to `is_emergency = false`. Ledger impact remains `$0.00`. |
| **Health API** | Enforced read-only database connections (`Health-RO`, **BR-24**). | **100% COMPATIBLE** | Read queries unchanged; zero write access enforced. |
| **Calendar API** | Expanded event aggregation to include Card & Debt due dates (**EO-03**). | **100% COMPATIBLE** | Additive event array output; existing UI components render without error. |
