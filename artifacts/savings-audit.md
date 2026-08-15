# Savings audit

## Repository

The attached project is a Next.js App Router TypeScript application using Supabase, HeroUI v3, shared UI and motion primitives, and Playwright. The Savings routes and domain modules are present under the canonical /money/savings route family. The repository had no pre-existing uncommitted application changes when the audit began.

## Existing domain

Savings already uses configurable database-backed providers and packages, immutable saving cycles, maturity detection, settlement, early withdrawal, renewal policy, and legacy backfill. The canonical blueprint requires provider or manual actuals for settlement, durable early-withdrawal results, exactly-once logical movements, immutable cycle history, and no posting of accrued estimates as actual interest.

## UI and motion constraints

The project constitution requires HeroUI controls, shared form and money primitives, Hugeicons through AppIcon, the centered 440px shell, and browser evidence at 390px, 440px, 768px, and 1280px. Motion uses motion/react and shared tokens, with transform and opacity preferred, reduced motion supported, and no layout-property animation or competing library.

## Root risks

The original placement RPC classified funding as Expense and the internal Savings account leg as Income. Existing UI also used ad-hoc principal parsing and native primary selects. Settlement and early-withdrawal RPCs classified returned principal as ordinary Income. The audited fix therefore uses additive migrations rather than editing applied migrations or creating a new Savings model.
