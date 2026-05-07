# Family Finances AI Knowledge Hub

## 1. What This Product Is Solving

Family Finances is a household finance clarity system, not just a bookkeeping app.

It is built for households that need one trusted view of:

- where money is now
- how money is moving
- what commitments already exist
- whether current behavior supports future goals

The product is especially shaped around Vietnamese household finance patterns: VND-first thinking, manual entry, gold/assets, mortgage-style debt, savings products, and shared household visibility between partners.

The product goal is to move users from fragmented financial tracking to a single household operating system for money, decisions, and follow-up actions.

## 2. Product Mental Model

The system should be understood through these layers:

- `household` is the ownership and access boundary
- `accounts + transactions` are the base cash ledger
- `assets`, `liabilities`, `goals`, and `savings` add domain-specific state on top
- `credit cards` use a parallel billing/installment layer instead of behaving like ordinary cash accounts
- `jars` are an intent/allocation layer for planned use of money
- `dashboard`, `health`, `insights`, and `reports` are read models built from the underlying data
- `decision-tools` store user-created what-if scenarios and outputs
- `AI insights` are scheduled narrative outputs layered on top of deterministic household data

When in doubt, treat the product as a household-scoped financial platform with multiple domain views over a common base ledger, not as a single-table expense tracker.

## 3. Technical Architecture At A Glance

### Frontend

- `app/*` is the main application surface built with Next.js App Router
- primary areas include dashboard, money, transactions, debts, goals, assets, jars, reports, settings, onboarding, household management, insights, and savings
- `components/layout/*` contains the shared app shell, header, and bottom tab navigation
- `components/ui/*` contains reusable UI primitives

### Application logic

- server actions live alongside route groups in `app/**/actions.ts`
- API routes live under `app/api/*`
- shared business logic, calculations, formatting, and orchestration live in `lib/*`
- common patterns include server-side household resolution, Supabase queries, revalidation, and audit logging

### Backend and persistence

- `supabase/migrations/*` is the main source of truth for schema, RLS, triggers, RPCs, and long-term business invariants
- Supabase Auth + Postgres + RLS enforce household isolation
- some product features rely on RPC-backed aggregates instead of recomputing everything in the client

### AI layer

- `supabase/functions/ai-cycle-dispatch` is the scheduled AI worker entrypoint
- `supabase/functions/_shared/*` contains shared AI context building, prompts, persistence helpers, and run-lock logic
- AI storage, run tracking, prompt versions, delivery, feedback, and scheduling are rooted in migrations `00010` and `00011`

### Stitch UI & Design System

- **Project Name**: `Family Finances Dashboard`
- **Project ID**: `projects/12932461820484795471`
- **Design System**: A premium, "Heritage Ledger" aesthetic inspired by Vietnamese architectural sanctuaries and high-end editorial design.
- **Typography**: Newsreader (Serif) for headlines/numbers, Be Vietnam Pro (Sans) for body/labels.
- **Colors**: Deep Emerald (#005235), Paper-white surfaces (#F9F9F8), and warm Amber accents.
- **Usage**: Use Stitch MCP tools to iterate on UI components and screen layouts based on this design system.

## 4. Core Domains And Responsibilities

### Household, auth, and invitations

- core tables begin in `supabase/migrations/00002_core_schema.sql`
- RLS and household membership helpers are established in `supabase/migrations/00003_functions_and_rls.sql`
- user entry and household setup live in `app/login/*`, `app/household/*`, and `app/onboarding/*`
- the standard server-side household resolver is `lib/server/household.ts`

### Accounts and transactions

- accounts represent cash accounts, bank accounts, and credit cards
- transactions are the base cash ledger for income, expense, and transfer events
- most write flows are implemented in `app/money/actions.ts` and `app/transactions/actions.ts`
- transaction writes are often the trigger point for downstream logic such as jars, balances, and read-model refresh

### Assets

- assets track owned value outside ordinary cash accounts
- quantity and price history are stored separately and used to derive current value and trends
- entrypoints: `app/assets/*`
- supporting logic: `app/assets/actions.ts`, `lib/assets/*`

### Debts / liabilities

- liabilities model debt state and repayment structure
- liability payments update both payment history and outstanding principal
- debt calculations and amortization helpers live in `lib/debts/amortization.ts`
- entrypoints: `app/debts/*`

### Goals

- goals track future targets and contribution progress
- contributions can create corresponding account cash-flow entries, so goals are not isolated from the ledger
- entrypoints: `app/goals/*`
- core write flow: `app/goals/actions.ts`

### Savings

- savings is its own domain, not just a tag on transactions
- the system stores savings accounts, rate history, withdrawals, maturity actions, and computed current/projected values
- savings creation usually creates matching ledger activity and can sync into jar intent
- key files: `app/api/savings/*`, `lib/savings/*`, migration `00039_savings_feature.sql`

### Credit cards and installments

- credit cards deliberately do not behave like normal expense accounts for aggregate calculations
- the billing model uses card settings, billing cycles, billing items, and installment plans
- settlement and installment conversion logic live in `app/money/card/installment-actions.ts`
- related schema evolves across migrations such as `00014`, `00015`, `00017`, `00018`, `00021`, `00024`, and `00025`
- if investigating card math, always confirm behavior in both write actions and the related migrations/RPCs

### Jars / financial intent layer

- jars are a planning and allocation layer that answers what money is for, not only where it sits
- this area has evolved from earlier spending-jar structures toward a broader intent model
- current intent-centered logic lives in `lib/jars/intent.ts` and `app/jars/*`
- spending-analytics endpoints still exist under `app/api/jars/spending/*`
- current tables for the rebuilt intent layer are defined in `00040_rebuild_jars_intent_layer.sql`

### Dashboard, health, insights, reports, and scenarios

- dashboard is a read-model surface, not the canonical write source
- `rpc_dashboard_core` and related aggregate logic are central to the dashboard experience
- financial health snapshots are calculated through `lib/health/service.ts` and `lib/health/engine.ts`
- deterministic insights are calculated through `lib/insights/service.ts` and `lib/insights/engine.ts`
- reports and trends use read-side aggregation over household data
- decision scenarios are stored through `app/decision-tools/actions.ts` using `scenarios` and `scenario_results`

## 5. Source Of Truth Map

Use this section to decide where to read next.

### Schema, RLS, triggers, and RPCs

- read `supabase/migrations/*`
- start with:
  - `00002_core_schema.sql`
  - `00003_functions_and_rls.sql`
  - `00006_dashboard_aggregates.sql`
  - `00010_ai_insights_foundation.sql`
  - `00022_financial_jars.sql`
  - `00039_savings_feature.sql`
  - `00040_rebuild_jars_intent_layer.sql`

### Page-level behavior and user flows

- read `app/*`
- page components show the surface area and composition
- server actions in the same feature folder usually reveal the real mutation flow
- API routes under `app/api/*` usually reveal read-model composition and domain endpoints

### Shared business logic and calculations

- read `lib/*`
- key clusters:
  - `lib/server/*` for household context and audit helpers
  - `lib/dashboard/*` for formatted metrics and trends
  - `lib/health/*` for health calculations
  - `lib/insights/*` for rule-based insight generation
  - `lib/savings/*` for savings computations and schemas
  - `lib/jars/*` for intent and jar logic
  - `lib/config/features.ts` for feature gating

### AI scheduling, prompts, runs, and deliveries

- read `supabase/functions/*`
- `supabase/functions/README.md` explains runtime shape and secrets
- `supabase/functions/ai-cycle-dispatch/index.ts` is the AI orchestration entrypoint
- `supabase/functions/_shared/*` contains prompt construction, context assembly, locking, and persistence helpers

## 6. Important Cross-Cutting Rules And Conventions

- Household is the isolation boundary. Almost every meaningful query and write is household-scoped.
- RLS is fundamental. Do not reason about access rules from app code alone; verify them in migrations.
- The app often uses server-side aggregation and RPCs for derived metrics. Do not assume UI totals are computed only from raw page queries.
- Transactions are the base cash ledger, but some domains intentionally maintain parallel truth layers:
  - credit cards use billing cycles and installment tables
  - savings uses dedicated savings tables plus linked ledger events
  - jars use allocation and intent tracking that is not reducible to a single transaction category
- Audit logging is a normal expectation in write flows. Many mutations call `writeAuditEvent`.
- Household language and locale are stored at household level and affect UI copy and AI output language.
- Feature flags can gate product surfaces. See `lib/config/features.ts` for:
  - `jars`
  - `cashflowForecast`
  - `insights`
  - `financialHealth`
- Realtime refresh is handled through household-scoped invalidation in `components/realtime/household-realtime-sync.tsx`.

## 7. AI Subsystem Overview

The AI subsystem is not a general chat agent bolted onto the UI. It is a scheduled insight pipeline with explicit storage, quotas, and deterministic triggers.

Current shape:

- storage and control plane live in AI-related migrations, especially `00010` and `00011`
- the worker entrypoint is `supabase/functions/ai-cycle-dispatch/index.ts`
- supported function types currently include:
  - `monthly_review`
  - `goal_risk_coach`
  - `spending_anomaly_explainer`
- the worker:
  - resolves active households
  - checks whether a run should happen
  - builds deterministic context from household data
  - loads the active prompt version
  - calls the model
  - stores deliveries and fallback outputs
- monthly cost control matters; the system enforces caps and can store deterministic fallback insights when limits are reached

If working on AI behavior, inspect both the edge function code and the AI foundation migrations before making assumptions.

## 8. Recommended Investigation Paths By Task Type

### If the task is about a user-visible page or workflow

1. Start with the route in `app/.../page.tsx`
2. Check nearby components in the same route folder
3. Inspect the matching `actions.ts` or `app/api/.../route.ts`
4. Follow into `lib/*` for calculations or orchestration
5. Confirm schema and invariants in the relevant migration files

### If the task is about data correctness or a metric mismatch

1. Check the API route or server component that supplies the UI
2. Identify whether it uses raw tables, helper services, or RPCs
3. Read the matching `lib/*` service or engine
4. Confirm the underlying SQL/RPC definition in migrations
5. For card, savings, or jar behavior, verify any parallel truth layer before trusting raw transactions alone

### If the task is about a mutation or write flow

1. Find the server action or API POST handler
2. Check validation and household resolution
3. Identify follow-up writes, side effects, and audit events
4. Check whether the write also updates a specialized domain table
5. Verify downstream aggregates or triggers in migrations

### If the task is about AI-generated content

1. Read the relevant API route in `app/api/ai-insights/*` if the issue is user delivery or feedback
2. Read `supabase/functions/ai-cycle-dispatch/index.ts` for generation flow
3. Inspect `_shared/context.ts`, `_shared/prompts.ts`, and `_shared/store.ts`
4. Confirm the DB structures and run semantics in `00010` and `00011`

### If the task is about access, membership, or localization

1. Start with `lib/server/household.ts`
2. Check household and settings actions in `app/household/actions.ts` and `app/settings/actions.ts`
3. Verify locale behavior in `lib/i18n/*`
4. Confirm membership and RLS rules in `00002` and `00003`

## 9. Known Documentation Limits

- This file is intentionally overview-first. It should help an AI orient itself and choose where to read next, not replace code-level investigation.
- Some domains have historical layers still visible in the repo, especially jars and cashflow forecasting. Prefer current active routes, services, and latest migrations over old mental models.
- The repo currently has no first-party automated test files outside dependencies/build artifacts. Confidence should come from reading migrations, service logic, write flows, and runtime endpoints together.
- If a behavior seems ambiguous, trust this order:
  1. latest relevant migration
  2. current server action or API route
  3. shared service/calculation layer
  4. page/UI code

## Quick Orientation Checklist For Future AI

Before making changes, answer these questions:

- Which household-scoped domain is affected?
- Is the source of truth raw transactions, a specialized table, or an aggregate/RPC?
- Is there a server action or API route already responsible for this flow?
- Is there a feature flag involved?
- Which migration defines the invariant that must remain true?

If those answers are clear, the rest of the repo becomes much easier to navigate safely.
