# Security Review — Sprint 2

## Summary: **ACCEPTABLE**

| Area | Result | Notes |
|------|--------|-------|
| SECURITY DEFINER + search_path | **PASS** | RPC pattern consistent with ledger |
| AuthN | **PASS** | `auth.uid()` required |
| AuthZ | **PASS** | Active household membership; jars scoped to household |
| Direct table mutation on `plan_movements` | **PASS** | INSERT/UPDATE/DELETE revoked; SELECT via RLS |
| Input validation | **PASS** | Positive whole amount; distinct jars; emergency note |
| SQL injection | **PASS** | Parameterized PL/pgSQL |
| Cross-BC write (plan→inbox) in DEFINER | **SMELL** | Elevates plan function privilege into inbox inserts — intentional for Alpha1 |
| Any member can declare emergency | **BY DESIGN** | No elevated role check |
| Sensitive exposure | **LOW** | Intent notes visible to household (expected for BR-13) |

## Security score input

**7.5 / 10**
