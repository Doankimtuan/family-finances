# Services & DDD Architecture Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Service Architecture & Layer Separation

ViNha enforces a strict **Domain-Driven Design (DDD) Layering Pattern** across all 8 bounded contexts inside `modules/<bc>/`:

```
+-------------------------------------------------------------------------+
| PRESENTATION LAYER (app/[locale]/...)                                  |
| - React Components, Server Actions, Page Layouts                       |
+-------------------------------------------------------------------------+
                                   |
                         Calls Application APIs
                                   v
+-------------------------------------------------------------------------+
| APPLICATION LAYER (modules/<bc>/application/)                           |
| - Application Services, Commands, Queries, DTO Mappers, Constants       |
+-------------------------------------------------------------------------+
                                   |
                        Executes Domain Rules
                                   v
+-------------------------------------------------------------------------+
| DOMAIN LAYER (modules/<bc>/domain/)                                     |
| - Core Business Entities, Aggregates, Invariants, Value Objects          |
+-------------------------------------------------------------------------+
                                   |
                       Accesses Persistence via Ports
                                   v
+-------------------------------------------------------------------------+
| INFRASTRUCTURE LAYER (modules/<bc>/infrastructure/)                     |
| - Supabase Repositories, Database Adapters, External APIs               |
+-------------------------------------------------------------------------+
```

---

## 2. Service Layer Audit Matrix

| Bounded Context | Repository Pattern | Application Service | Server/Client Boundary | Status |
|---|---|---|---|---|
| `ledger` | `SupabaseLedgerRepository` in `infrastructure/` | `LedgerApplicationService` in `application/` | Enforced (`server-only` guards) | **PASSED** |
| `plan` | `SupabasePlanRepository` in `infrastructure/` | `PlanApplicationService` in `application/` | Enforced (`server-only` guards) | **PASSED** |
| `inbox` | `SupabaseInboxRepository` in `infrastructure/` | `InboxApplicationService` in `application/` | Enforced (`server-only` guards) | **PASSED** |
| `health` | Read-only repository context in `infrastructure/` | Read-only health pulse in `application/` | Enforced (`Health-RO`, **BR-24**) | **PASSED** |

---

## 3. Governance Rules for Services

1. **Zero Database Calls in React Components**: UI components MUST NOT call database drivers (`@supabase/supabase-js`) directly. All mutations and queries MUST execute through module Application Services.
2. **Read-Only Context for Health**: The Health domain Application Service MUST use read-only database connections (**BR-24**).
