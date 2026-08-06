# Security Review — Sprint 1

## Summary: **ACCEPTABLE WITH REQUIRED HARDENING**

New money paths are gated by auth + household membership inside `SECURITY DEFINER` RPCs. The residual risk is the still-granted in-place update RPC and broad error collapsing.

## Findings

| Area | Result | Evidence |
|------|--------|----------|
| AuthN on new RPCs | **PASS** | `auth.uid()` null checks |
| AuthZ household membership | **PASS** | `is_household_member` on refund/correct; membership on create_category |
| Direct table INSERT/UPDATE on transactions | **PASS** (revoked earlier + delete hardened) | Mutations via DEFINER RPCs |
| `update_transaction` EXECUTE for `authenticated` | **FAIL vs immutability policy** | Prior grant never revoked in Sprint 1 migration |
| Input validation | **PASS** | Zod + SQL positive whole amount checks |
| SQL injection | **PASS** | Parameterized PL/pgSQL |
| Sensitive data exposure | **LOW RISK** | Broad catch → generic error codes (good for leak, bad for ops) |
| RLS | **ASSUMED intact** | No Sprint 1 change disabling RLS observed |
| Health write surface | **PASS** | No new writes |

## Required security-aligned fix

Revoke or replace `update_transaction` so authenticated clients cannot bypass the 3-way correction contract. Prefer fail-closed RPC stub mirroring `delete_transaction`, or narrow allowed fields to non-financial note-only if product insists (still Spec-sensitive).

## Security score input

**7.0 / 10**
