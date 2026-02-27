# Family Finances AI Knowledge Handoff

## 1. Real Problem Being Solved
This product is not a bookkeeping app. It is a household clarity system for Vietnamese couples who feel financial anxiety because they cannot see one trusted, complete, forward-looking picture of money.

Core user pain points:
- Fragmented truth across bank apps, memory, and spreadsheets.
- No clear projection for major life decisions (land purchase, mortgage, child, job change).
- No shared household visibility between partners.
- Difficulty turning data into action.

Primary product goal:
- Move users from anxiety to clarity by giving a single source of truth, explainable metrics, and actionable next steps.

## 2. Product/UX Contract (Implemented Direction)
- Language: bilingual (`en` + `vi`) with household-level language setting.
- Data entry: manual only (no bank auto-sync dependency).
- Collaboration: equal partner access by default.
- Mobile-first interaction model, especially transaction logging.
- Honest but empowering framing (progress-focused, non-shaming).
- Vietnamese financial context treated as core (gold in `lượng`, VND scale, family loans, promo-to-floating mortgages).

## 3. Technical Baseline
Stack in use:
- Next.js 16 App Router + TypeScript
- Supabase (PostgreSQL, Auth, RLS, Realtime)
- shadcn-style UI primitives + Tailwind
- Recharts
- TanStack Query + Supabase Realtime integration

Deployment target:
- Vercel + Supabase hosted

## 4. Current Solution Architecture
### Frontend structure
- App pages are route-first under `app/*`.
- `AppShell` wraps pages with mobile-friendly container and optional sticky header + bottom tabs.
- Most write operations use server actions with typed action states (`idle | error | success`).
- Every important page has loading/error/empty handling patterns.

### Data flow pattern
- Server-render for household-scoped data where possible.
- Supabase RPCs for dashboard aggregates.
- Client-side realtime bridge (`HouseholdRealtimeSync`) subscribes to key household tables and refreshes/invalidate cache.
- Audit events written on critical financial mutations.

## 5. Database and Migrations (Current)
Migration files present:
- `00001_extensions.sql`
- `00002_core_schema.sql`
- `00003_functions_and_rls.sql`
- `00004_seed_reference_data.sql`
- `00005_seed_demo_household.sql`
- `00006_dashboard_aggregates.sql`
- `00007_household_lifecycle_rls_fix.sql`
- `00008_household_lifecycle_rpc.sql`
- `00008_household_assumptions_settings.sql`

Important note:
- There are currently **two files with prefix `00008`**. This can create ordering ambiguity depending on migration runner behavior.

### Why tables are structured this way (high-level)
- `households`: tenant boundary + shared assumptions + locale/currency/timezone.
- `household_members`: equal collaboration model with RLS scoping.
- `profiles`: user identity metadata for attribution and collaboration.
- `accounts` + `transactions`: liquid cash and movement ledger.
- `assets` + `asset_quantity_history` + `asset_price_history`: split quantity from price for proper valuation over time (critical for gold/funds).
- `liabilities` + `liability_rate_periods` + `liability_payments`: debt lifecycle + promo/floating rate modeling + amortization tracking.
- `goals` + `goal_contributions`: long-horizon planning and progress.
- `categories` + `monthly_budgets`: taxonomy and budget control.
- `health_score_snapshots`: explainable score over time.
- `insights`: actionable, generated nudges.
- `scenarios` + `scenario_results`: persisted what-if analysis and comparison.
- `audit_events`: immutable trust/explainability log.

## 6. Core Business Logic Implemented
### Dashboard aggregates (`rpc_dashboard_core`)
- `total_assets = account_assets + non_account_assets`
- `total_liabilities = sum(current_principal_outstanding where active)`
- `net_worth = total_assets - total_liabilities`
- `monthly_income = sum(income tx in month)`
- `monthly_expense = sum(expense tx in month)`
- `monthly_savings = monthly_income - monthly_expense`
- `savings_rate = monthly_savings / monthly_income` (if income > 0 else null)
- `emergency_months = liquid_assets / avg_essential_expense(last ~3 months)`
- `debt_service_ratio = debt_service_paid_in_month / monthly_income`

### Financial health engine (`lib/health/engine.ts`)
Weights:
- cashflow 22
- emergency 20
- debt 20
- networth 16
- goals 14
- diversification 8

Overall:
- `overall_score = Σ(factor_score × weight) / 100`

Factor logic:
- Cashflow score based on savings rate bands and negative-cashflow penalty.
- Emergency score: linear to 6 months target (`(months/6)*100`, clamped).
- Debt score: 70% DSR banding + 30% leverage banding.
- Net worth score: growth across trend window.
- Goals score: 65% progress ratio + 35% on-track ratio.
- Diversification score: inverse HHI concentration.

Top action:
- Deterministic priority: negative cashflow -> low emergency -> high DSR -> weakest factor.

### Debt modeling (`lib/debts/amortization.ts`)
Supports:
- `annuity`
- `equal_principal`
- `interest_only`
- `flexible` fallback (equal principal assumption)

Rate selection order:
1. explicit `liability_rate_periods`
2. promo period (`promo_rate_annual`, `promo_months`)
3. floating phase (`promo_rate_annual + floating_rate_margin`)

Per month:
- `interest = balance * monthly_rate`
- Annuity payment formula:
  - `payment = P * [r(1+r)^n / ((1+r)^n - 1)]`
- Equal principal:
  - `principal = balance / remaining_months`
  - `payment = principal + interest`
- Interest-only:
  - `payment = interest (+ principal at end)`

### Insights engine (`lib/insights/engine.ts`)
Generated types:
- spending anomaly
- goal risk
- debt alert
- savings milestone
- net worth change

Key thresholds:
- Spending anomaly: current expense >= 125% of prior 3-month avg.
- Goal risk: avg contribution < required monthly.
- Debt alert: DSR > 0.35 or projected promo->floating payment increase.
- Milestones: emergency fund crossing 1/3/6 months.
- Net worth change: monthly delta magnitude >= 5%.

## 7. Implemented Product Modules
Completed in codebase:
- Authentication and login/signup flows.
- Household lifecycle: create household, invite, accept invite, equal partner access.
- Onboarding flow (welcome, members, accounts, assets, debts, income/expenses, first goal, first insight).
- Dashboard with core metrics, trend chart, explainability drill-down drawers, quick actions.
- Accounts + transactions (including mobile quick-add path).
  - Transaction create/edit/delete flows are implemented.
  - Expense validation requires account, date, amount > 0, and category.
  - Expense entries/edits are rejected when amount exceeds current account balance (record is not written).
- Assets module with quantity/price history editing + valuation timeline.
  - Asset detail supports full delete action.
- Debts module with promo-to-floating visualization and amortization schedule.
- Goals module with contribution tracking, progress, ETA, required monthly amount.
- Categories and monthly budgets management.
  - Category rename + color edit is supported for both system and household categories.
  - Category delete is blocked when transactions already exist for that category.
- Decision tools module (loan, purchase timing, savings projection, goal modeling, debt-vs-invest).
- Scenario persistence + side-by-side comparison.
- Financial health page + recalculation endpoints.
- Insights page + recalculation endpoints.
- Reports pages (net worth trend, cash-flow trend, monthly review).
- Realtime household sync across major shared tables.
- Settings module:
  - Profile
  - Household
  - Categories
  - Assumptions
  - Household settings include language dropdown (English/Vietnamese)
  - `/settings/profile`, `/settings/categories`, `/settings/assumptions` have i18n coverage
- Audit event writes on critical financial changes.
- Global/page-level loading/error/empty states.

## 8. Audit Event Coverage (Current)
Audit writes are implemented through shared helper:
- `lib/server/audit.ts`

Critical actions now emit audit events, including:
- household created/invite/accept
- account create/archive
- transaction create (quick + detailed)
- transaction update/delete
- asset create + history edits
- asset delete
- category create/status toggle
- category rename/delete
- budget upsert/delete
- goal create/contribution
- scenario save
- onboarding-created financial records
- settings updates (profile/household/assumptions)
- settings language update

## 9. Known Issues Already Addressed
- Seed failure for `paid_by_member_id` type mismatch fixed with explicit `::uuid` cast in `00005_seed_demo_household.sql`.
- Next.js server-action error (`"use server" file can only export async functions`) fixed by moving initial action state out of server-action export patterns.
- Household create RLS issue fixed via policy update + secure bootstrap RPC.
- Input visibility/currency entry UX fixes applied in onboarding forms.
- Next.js server/client boundary issue fixed where `useI18n()` was incorrectly invoked from a server component.

## 10. Recent Implementation Delta (Latest)
These updates were implemented after the initial handoff draft:
- Transactions:
  - Added inline edit/delete controls in recent transactions list.
  - Added server actions: `updateTransactionAction`, `deleteTransactionAction`.
  - Enforced mandatory expense fields in server validation (account/date/amount/category).
  - Changed overspending behavior to hard reject with explicit error:
    - create: "Transaction not recorded: expense amount exceeds current account balance."
    - update: "Transaction not updated: expense amount exceeds current account balance."
- Categories:
  - Added edit + delete actions in settings categories UI.
  - System categories can be edited.
  - Categories already used by transactions cannot be deleted.
  - Category color is editable and consumed by dashboard monthly spending allocation chart.
- Assets:
  - Added delete action on asset detail page.
- i18n:
  - Bilingual dictionary/provider patterns are active across key modules.
  - Settings pages (`profile`, `categories`, `assumptions`) updated for EN/VI content.
  - Household settings includes language switch dropdown (`en`/`vi`) and persists locale preference.

## 11. Current Gaps / Next Best Steps
1. Resolve duplicate migration numbering (`00008` and `00008`) to deterministic order.
2. Add dedicated Settings link in global nav tab bar if desired (currently reachable via dashboard quick action and household page shortcut).
3. Expand automated operations (Edge Functions + cron):
   - monthly snapshot generation
   - scheduled health/insight recalculation
   - payment reminders
4. Add explicit automated tests for:
   - RLS behavior by household membership
   - amortization correctness for each repayment method
   - health scoring thresholds
   - scenario comparison integrity
5. Connect household assumption values more deeply into all calculators if not already consumed everywhere.

## 12. AI Continuation Guide
When continuing development, follow this pattern:
- Use household-scoped server actions for writes.
- Resolve auth + household context first; fail fast with user-safe messages.
- Write audit events after successful critical writes.
- Revalidate affected routes explicitly.
- Preserve mobile-first interactions and 3-state UI (loading/error/empty).
- Keep explainability for derived metrics (formula + contributing factors).

Key files to start from:
- Product shell/nav: `components/layout/*`
- Realtime sync: `components/realtime/household-realtime-sync.tsx`
- Dashboard API/UI: `app/api/dashboard/core/route.ts`, `app/dashboard/_components/dashboard-core-panel.tsx`
- Health engine: `lib/health/engine.ts`, `lib/health/service.ts`
- Insights engine: `lib/insights/engine.ts`, `lib/insights/service.ts`
- Debt modeling: `lib/debts/amortization.ts`
- Decision tools UI: `app/decision-tools/_components/decision-tools-client.tsx`
- Settings: `app/settings/*`
- Audit helper: `lib/server/audit.ts`
