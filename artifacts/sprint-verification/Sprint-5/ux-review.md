# UX Review — Sprint 5

## Strengths

- Plan hub entry to calendar
- Month grid with event/milestone dots
- Deficit banner + day-level callout
- Day empty state copy
- Source tags via i18n
- Payoff celebration with clear CTAs
- Touch-friendly day cells; aria-pressed / aria-label

## Gaps

| Gap | Severity |
|-----|----------|
| No in-UI prev/next month (only `?month=`) | Medium (TD-S5-02) |
| Installment/payoff links via `moneyCardPath(planId)` likely wrong destination | **High** |
| Card due links via `moneyAccountPath` may skip card-specific IA | Medium |
| Celebration is inline StatusAlert, not modal | Low vs task wording |
| `forecast` running balances not shown (only flags) | Low–Medium |
| False deficit warnings from bad math | **High** (trust) |
| No loading state (RSC only) | Low |

## Design System

Shared patterns/primitives — **PASS**.

## UX score

**6.3 / 10**
