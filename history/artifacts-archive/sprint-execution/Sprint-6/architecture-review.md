# Architecture Review — Sprint 6

## Decisions

1. Health-RO is an **enforcement layer**, not a new DB role: Proxy + lint + constitutional scan over compute-on-read Health.
2. AI policy lives in **Platform** so ledger/plan/inbox assist can reuse the same guards.
3. GA hardening for this Spec-track milestone = CI quality gates + constitutional suite (not a full E2E/a11y program).

## Boundaries

- Health must not import Supabase clients or `commands/**`.
- Platform may wrap Supabase clients with `asReadOnlySupabaseClient`.
- `recordAiAuditEvent` is `server-only` and must not be re-exported from client-safe barrels.
