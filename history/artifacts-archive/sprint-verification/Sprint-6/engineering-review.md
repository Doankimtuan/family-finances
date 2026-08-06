# Engineering Review — Sprint 6

## Reuse audit

| Asset | Reused? | Location |
|-------|---------|----------|
| Ledger read APIs | Yes | `getRealPosition`, `listRecentTransactions` |
| Plan read APIs | Yes | `getPlanPulse` |
| Inbox read APIs | Yes | `listOpenInboxItems`, `InboxItemKind` |
| Tenancy gate | Yes | `assertMoneyActionAllowed` |
| Shared UI patterns | Yes | `HealthCard`, `TopAppBar`, `Card`, `EmptyState` |
| Constants | Yes | `HEALTH_READONLY_VIOLATION`, `AI_POLICY_ERROR_CODE`, `InsightKind`, etc. |
| Platform barrel | Yes | Client-safe exports; server audit isolated |

## New abstractions

| Abstraction | Assessment |
|-------------|------------|
| `asReadOnlySupabaseClient` | Justified; **unused** in production — consider wiring at platform read factory or document as optional |
| `HEALTH_BC_CONTRACT` | Thin const object — appropriate |
| `assertAiSuggestionGrounded` / `assertNoAutonomousMoneyMove` | Small, deterministic — appropriate |
| `recordAiAuditEvent` | Complete server function — **orphaned** (no callers) |

## Duplication

No duplicate Health RO or AI guard implementations found. Constitutional test patterns mirror ESLint rules — intentional defense in depth, acceptable.

## Hook / form reuse

Sprint 6 added no new hooks or forms. Health pages are server components — consistent with existing product patterns.

## ESLint as engineering gate

`eslint.config.mjs` adds Health-specific:
- `no-restricted-imports` for Supabase clients and `commands/**`
- `no-restricted-syntax` for write/RPC call expressions

This is **high-value reuse** of lint infrastructure vs one-off comments.

## CI engineering

`.github/workflows/ci.yml`:
- `quality` job: lint, typecheck, unit
- `constitution` job: `npm run test:constitution`

Good separation; missing `test:e2e` job.

## Engineering score contribution

**7.8 / 10** — Strong reuse and lint gates; orphaned audit function and unused proxy reduce score.
