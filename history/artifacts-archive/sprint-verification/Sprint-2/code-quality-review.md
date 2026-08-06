# Code Quality Review — Sprint 2

## Strengths

- TypeScript + Zod at command boundary.
- Magic-string discipline strong in app TS (`PLAN_*`, `InboxItemKind`, `OverspendPolicy`, `CapacityMovementDirection`).
- RHF form for new reallocate UI (Constitution preference).
- Readable RPC with explicit auth/membership checks.
- Comments clarify capacity_delta ≠ bank balance.

## Findings

| Area | Finding | Severity |
|------|---------|----------|
| Component size | Reallocate form ~370 lines — moderate | Low |
| Naming | Clear (`reallocateJarCapacity`, `isEmergency`) | OK |
| Magic strings | SQL embeds inbox kind/status/event English title | Low (migrations) |
| Accessibility | Native controls + min touch targets likely; no a11y audit evidence | Medium (DoD) |
| React patterns | `useTransition` + RHF — consistent | OK |
| Type safety | Good; form schema drift from command schema | Low |
| Misleading pack debt | TD-S2-04 claims legacy `updateTransaction` still open — **stale**; app already fail-closed `IMMUTABLE` post Sprint-1 fixes | Info |

## Code quality score input

**7.5 / 10**
