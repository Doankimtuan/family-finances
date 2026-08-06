# Code Quality Review — Sprint 4

## Strengths

- Constants-first app code for statuses/modes/gates
- Wizard structure readable; progressive steps with Progress
- i18n en/vi keys for divergence, pending review, Quick Close, errors
- Zod on correction note

## Issues

| Topic | Notes |
|-------|-------|
| Component size | `ritual-wizard.tsx` ~480 lines — large but cohesive; approach limit |
| Complexity | Approve path branches (quickClose preview bootstrap) — OK with comments |
| Magic strings | App path clean; SQL dual SoT; RPC name string at call site |
| Tailwind | Token spacing `gap-(--space-*)`, min-h-11 touch targets — OK |
| Type safety | Ritual DTOs in `ritual-types.ts` — OK |
| React | Client wizard uses local state + router.refresh — matches repo patterns |
| Accessibility | Buttons/fields generally OK; divergence list not announced as blocking beyond StatusAlert |
| Performance | Autolock fire-and-forget races `getMonthRitual` — may show stale unlocked state until refresh |
| Fail-open lock | Silent unlock on table errors — dangerous for money domain |
| Silent empty catch | `listRitualDivergence` / emergencies return `[]` on error — masks failures |

## Code quality score

**6.8 / 10**
