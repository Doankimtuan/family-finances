# Performance Review: Implementation 07 — Main App Shell Screens

## Architecture Overview

The 5 main authenticated tab screens:

1. `Home` (`/[locale]/home`)
2. `Money` (`/[locale]/money`)
3. `Plan` (`/[locale]/plan`)
4. `Inbox` (`/[locale]/inbox`)
5. `Together` (`/[locale]/together`)

maintain their canonical Server Component (RSC) architecture. Data fetching remains strictly parallelized on the server via `Promise.all` and decoupled React `<Suspense>` streaming boundaries.

## Server / Client Boundary Verification

- **Home**:
  - `page.tsx` is an async RSC.
  - Streaming sections (`HomeInboxCta`, `HomePlanPulse`, `HomePeriodStory`, `HomeProductSummaries`) are lazy/streamed in parallel.
  - Client components are strictly isolated: `HomePeriodSelector` (interactive tab switch), `HomeCashFlowChart` (canvas/SVG rendering).
- **Money**:
  - `page.tsx` is an async RSC with parallel `Promise.all` for products, accounts, and summary.
  - Client components: `MoneyHideBalancesToggle`, `MoneyPeriodToggle`.
- **Plan**:
  - `page.tsx` is an async RSC.
  - Multiple Suspense boundaries (`PlanCriticalSection`, `PlanDecisionsSection`, `PlanUpcomingSection`, `PlanJarsSection`, `PlanGoalsSection`).
  - Client components: isolated recommendation interactions or modal triggers.
- **Inbox**:
  - `page.tsx` is an async RSC.
  - Attention list and queue preview rendered server-side with zero hydration waterfalls.
- **Together**:
  - `page.tsx` is an async RSC.
  - Member preview and household identity rendered server-side.

## Performance Metrics & Regressions

- **New request waterfall**: NO. All queries are either initiated upfront via `Promise.all` or rendered in isolated parallel `<Suspense>` streams.
- **Prefetch regression**: NO. All internal tab and entity links retain `prefetch={PRODUCT_LINK_PREFETCH}`.
- **Unexpected client migration**: NO. No page was converted from RSC to `"use client"`.
- **Layout shift (CLS)**: Preserved skeleton dimensions matching exact `min-h-[52px]` and `min-h-16` of `BaseRow` and `Card` components.
- **Bundle impact**: Minimal, leveraging shared UI tokens and SVG symbols already present in the bundle.
