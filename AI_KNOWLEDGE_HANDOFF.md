# Family Finances AI Knowledge Handoff

## 1. Real Problem Being Solved

This product is not a bookkeeping app. It is a household clarity system for Vietnamese couples who feel financial anxiety because they cannot see one trusted, complete, forward-looking picture of money.

Core user pain points:

- Fragmented truth across bank apps, memory, and spreadsheets.
- No clear projection for major life decisions (land purchase, mortgage, child, job change).
- No shared household visibility between partners.
- Difficulty turning data into action (cognitive load of raw numbers).

Primary product goal:

- Move users from anxiety to clarity by giving a single source of truth, explainable metrics, and actionable next steps.

## 2. Product/UX Contract (Implemented Direction)

- **Language**: Bilingual (`en` + `vi`) with household-level language setting.
- **Narrative-First**: Replaces dry scores with "Health Stories" (e.g., "Improving", "Healthy") and dynamic visualizations.
- **Action-Oriented**: Focuses on "Priority Actions" and "ETA" (Expected Time of Arrival) rather than just status.
- **Consolidated Navigation**: Mobile-first design with 4 primary tabs: **Home** (Dashboard), **Money** (Accounts/Assets/Debts/Flow), **Activity** (Transactions), and **Plan** (Insights/Health/Goals/Budgets).
- **Constructive Framing**: Uses progress-focused, non-shaming vocabulary (e.g., "Building" vs "Fragile").
- **Manual Logging**: Optimized for high-speed manual data entry (under 10 seconds).
- **Vietnamese Financial Context**: Native support for gold (`lượng`), VND scale, and complex mortgage rate structures (promo-to-floating).

## 3. Technical Baseline

Stack in use:

- Next.js 16 App Router + TypeScript
- Supabase (Postgres, Auth, RLS, Realtime)
- shadcn-style UI primitives + Tailwind
- Recharts
- TanStack Query + Supabase Realtime integration

Deployment target:

- Vercel + Supabase hosted

## 4. Current Solution Architecture

### Frontend structure

- **App Shell**: Wraps pages with mobile-friendly container, sticky header (with Settings access), and 4-tab bottom navigation.
- **Components**: Shared primitives under `components/ui/*` (Card, MetricCard, SectionHeader, Progress, EmptyState, Badge).
- **Server Actions**: Most write operations use typed action states with revalidation and audit logging.

### Data flow pattern

- **Server Discovery**: Fetches household-scoped context and data early.
- **Realtime Bridge**: `HouseholdRealtimeSync` ensures multi-device consistency without manual refreshes.
- **Explainability**: Complex metrics (Health, Insights) provide drill-downs or "How this is calculated" narratives.

## 5. Database and Migrations (Current)

Migration files:

- `00001_extensions.sql` to `00008_household_assumptions_settings.sql` (Core Schema)
- `00009_goal_cashflow_directions.sql` (Enhanced Goal tracking with inflows/outflows)

### Why tables are structured this way

- `households`: Tenant boundary + shared assumptions.
- `goal_contributions`: Recently upgraded to support `flow_type` (inflow/outflow), `source_account_id`, and `destination_account_id` for accurate double-entry goal management.
- `health_score_snapshots`: Persisted snapshots for trend analysis.
- `insights`: Urgency-ranked nuggets of intelligence.

## 6. Core Business Logic Implemented

### Dashboard Analytics

- **Real Savings Delta**: Calculates month-over-month savings change using historical trend points instead of random placeholders.
- **Quick Actions**: Curated list of 4 high-frequency paths (Log Expense, Goals, Insights, Health).

### Financial Health Engine (`lib/health/engine.ts`)

- **i18n Integration**: Engine now returns structured i18n keys for status words and top actions (e.g., `health.action.low_emergency`).
- **Explainable Factors**: Factors grouped into "Strongest" and "Needs Attention" with constructive feedback.

### Insights Engine (`lib/insights/engine.ts`)

- **Urgency Grouping**: Insights categorized into **Action Required** (Critical), **Worth Knowing** (Info/Advice), and **Wins** (Achievements).
- **Wins/Milestones**: Celebratory framing for positive net worth movement or emergency fund progress.

### Budget "Pace" Framework

- **Remaining Pace**: Replaced "Spent X of Y" with "You have [Amount] remaining for [N] days" to provide better daily pacing context.

### Goal ETA Modeling

- **ETA Hero**: Prioritizes "Expected Arrival" dates (e.g., "Arriving Dec 2026") over percentage progress.
- **Pace Status**: Detects "On Track" vs "Behind" and calculates the extra monthly contribution needed to fix gaps.

## 7. Implemented Product Modules

- **Dashboard**: Core metrics, health overview, real trend data, 4 quick actions.
- **Health**: Redesigned narrative-first health story with dynamic progress rings and factor collapse.
- **Insights**: Grouped urgency list with deep links to actions and milestones.
- **Goals**: ETA-focused management with inflow/outflow cash flow tracking.
- **Budgets**: Daily pacing framework.
- **Navigation**: Simplified 4-tab bottom bar + sticky Settings in headers.
- **Onboarding**: Multi-step guide for household setup and initial data.
- **Decision Tools**: What-if simulators for loans, major purchases, and savings.

## 8. Recent Implementation Delta (UX Redesign)

Implemented the "Product Clarity" roadmap:

- **Consolidated Navigation**: Reduced cognitive friction by merging 6 tabs into 4.
- **Health Engine**: Modernized scoring feedback with status words and ring visualizations.
- **Insight Buckets**: Organized alerts by severity to prevent "notification fatigue".
- **Real Trend Fix**: Swapped fake dashboard trend % with real historical MoM calculation.
- **Goal Cash Flow**: Added support for tracking where money for goals comes from (Account -> Goal) and where it goes back (Goal -> Account) via migration `00009`.
- **i18n Dictionary**: Massive expansion of tokens to support narrative framing and technical-to-plain translation.

## 9. Current Gaps / Next Best Steps

1. **Automated Snapshots**: Implement cron jobs for monthly financial snapshot capture.
2. **Push Notifications**: Trigger critical insight alerts via mobile push/email.
3. **Audit Visualization**: Create a "Who changed what" history view for the household.
4. **Partner Nudges**: "Discuss Together" prompts for weekly family syncs.

## 10. AI Continuation Guide

- **Aesthetics**: Always use the defined design system tokens (Glassmorphism, vibrant but calm colors). Avoid raw browser defaults.
- **Language**: Use `t(language, 'key')` for ALL UI text. Update `dictionary.ts` if a key is missing.
- **Premium UX**: Every feature should feel "alive" with micro-animations and hover states.
- **Mobile First**: Design for thumb-reach and vertical scrolling.

Key starting files:

- UI Theme: `app/globals.css`, `tailwind.config.ts`
- Translation: `lib/i18n/dictionary.ts`
- Dashboard: `app/dashboard/_components/dashboard-core-panel.tsx`
- Health: `app/health/page.tsx`, `lib/health/engine.ts`
- Insights: `app/insights/_components/insights-grouped.tsx`
- Budget/Goals: `app/budgets/page.tsx`, `app/goals/page.tsx`
