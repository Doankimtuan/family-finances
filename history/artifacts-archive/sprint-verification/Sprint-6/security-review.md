# Security Review — Sprint 6

## Authentication & authorization

| Surface | Control | Result |
|---------|---------|--------|
| Health pages | `getSessionUser` + `resolveActiveMembership` | PASS |
| `getHealthDetail` | `assertMoneyActionAllowed` | PASS |
| `recordAiAuditEvent` | Same gate + household scoping on insert | PASS (design) |

## `ai_audit_logs` (remote verified)

Migration `20260804160000_sprint6_ai_audit_logs.sql`:

| Control | Implementation |
|---------|----------------|
| RLS enabled | Yes |
| SELECT | `is_household_member(household_id)` |
| INSERT | Member check on `household_id` |
| UPDATE/DELETE | Revoked from `authenticated` — append-only |
| CHECK on `event_kind` | Enum-like constraint |

**Assessment:** Sound append-only audit model for household-scoped events.

## RPC / SQL safety

Sprint 6 adds no new RPCs. Health module performs no direct SQL.

## AI policy security

| Threat | Mitigation | Gap |
|--------|------------|-----|
| Invented balances in suggestions | `assertAiSuggestionGrounded` | Guards not enforced at HTTP/API boundary globally — only where called |
| Autonomous money move | `assertNoAutonomousMoneyMove` | Not wired to command layer yet |
| Una audited policy bypass | — | No `POLICY_BLOCK` events persisted |

## Health-RO security

| Threat | Mitigation |
|--------|------------|
| Health writes via Supabase | Blocked by architecture + lint + scan |
| Health invokes ledger commands | ESLint import ban |
| Compromised Health code path | No DB credentials in Health module |

**Limitation:** Application-level enforcement only; compromised service role elsewhere could still write — outside Sprint 6 scope.

## Sensitive data

Audit `payload_json` is free-form record — callers must not store invented balances as truth (documented in table comment). **No validation** on payload content beyond JSON shape.

## Security score contribution

**7.5 / 10** — RLS and gates well-designed; audit not operational; payload content not schema-constrained.
