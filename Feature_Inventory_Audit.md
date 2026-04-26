# Family Finances — Feature Inventory Audit

## 1) Scope

This audit covers runtime product behavior across:

- `app/*` pages, server actions, and API routes
- `components/*` and key feature-facing UI composition
- `lib/*` domain modules used by runtime paths
- `supabase/migrations/*` schema, SQL functions, triggers, and RLS
- `supabase/functions/*` edge-function AI pipeline

## 2) Assessment rubric

- **Usage likelihood**: High / Medium / Low (probable real user frequency)
- **Complexity**: Low / Medium / High (logic + data coupling + failure surface)
- **Finance norm fit**: Strong / Partial / Weak (alignment with standard personal-finance app behavior)
- **Recommendation**:
  - `KEEP`
  - `KEEP & OPTIMIZE`
  - `CONSIDER REMOVING`
  - `REMOVE`

---

## 3) Feature inventory (structured)

### F01. Authentication & account access
- **Location**: `app/login/page.tsx`, `app/login/actions.ts`, `app/auth/confirm/route.ts`, `app/auth/signout/route.ts`
- **What it does**: Email/password login, signup with email confirmation redirect, session sign-out.
- **Triggered by**: User opening login screen and submitting auth forms.
- **Dependencies**: Supabase Auth, profile sync trigger (`handle_new_user` in `00003_functions_and_rls.sql`).
- **Usage likelihood**: High
- **Complexity**: Low
- **Observed bugs / issues**: No critical functional break observed; copy/i18n still mostly English.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP`

### F02. Household lifecycle & collaboration
- **Location**: `app/household/page.tsx`, `app/household/actions.ts`, settings household/member screens
- **What it does**: Create household, invite partner, accept invite token, manage pending invitations.
- **Triggered by**: New-user setup or settings management.
- **Dependencies**: `households`, `household_members`, `household_invitations`, RLS helper functions.
- **Usage likelihood**: High
- **Complexity**: Medium
- **Observed bugs / issues**: Invitation UX is split across pages (household + settings), which may duplicate user paths.
- **Finance norm fit**: Strong (household co-management is a key differentiator)
- **Recommendation**: `KEEP & OPTIMIZE`

### F03. Onboarding wizard (multi-step financial bootstrap)
- **Location**: `app/onboarding/*`, `app/onboarding/actions.ts`
- **What it does**: Captures welcome context, members, money accounts, assets, debts, baseline income/expenses, first goal.
- **Triggered by**: First-time setup flow.
- **Dependencies**: Accounts/assets/liabilities/goals tables + audit logging.
- **Usage likelihood**: High (for new households)
- **Complexity**: High
- **Observed bugs / issues**: Broad action surface increases validation inconsistency risk across steps.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F04. Dashboard core aggregation
- **Location**: `app/dashboard/page.tsx`, `app/dashboard/_components/dashboard-core-panel.tsx`, `app/api/dashboard/core/route.ts`
- **What it does**: Aggregates accounts/assets/liabilities/transactions/goals/savings/jars/health into one payload.
- **Triggered by**: Dashboard load and refresh.
- **Dependencies**: `rpc_dashboard_core`, trend APIs, health service, jars and savings services, feature flags.
- **Usage likelihood**: High
- **Complexity**: High
- **Observed bugs / issues**: Very broad endpoint; single-point latency/failure risk.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F05. Accounts & money overview (net worth shell)
- **Location**: `app/money/page.tsx`, `app/money/actions.ts`
- **What it does**: Unified net-worth page with account balances, savings highlights, assets, liabilities, credit cards.
- **Triggered by**: User opening Money tab.
- **Dependencies**: Transactions ledger math, savings bundle service, liability rates, card billing tables.
- **Usage likelihood**: High
- **Complexity**: High
- **Observed bugs / issues**: Large page component (high maintenance load); mixed hardcoded Vietnamese/English copy.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F06. Transaction ledger CRUD + transfer + jar-aware warnings
- **Location**: `app/transactions/actions.ts`, `app/transactions/page.tsx`
- **What it does**: Create/update/delete transactions with transfer logic, balance checks, and optional spending-jar warnings.
- **Triggered by**: Transaction form actions.
- **Dependencies**: `transactions`, `accounts`, `categories`, jar mapping RPCs, audit events.
- **Usage likelihood**: High
- **Complexity**: High
- **Observed bugs / issues**: High branching complexity raises regression risk; needs targeted tests around transfer edge cases.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F07. Category management
- **Location**: `app/categories/actions.ts`, `app/settings/categories/page.tsx`
- **What it does**: Create/rename/disable/delete custom categories with guardrails.
- **Triggered by**: Settings/category forms.
- **Dependencies**: `categories`, `transactions`, budget tables, audit events.
- **Usage likelihood**: Medium
- **Complexity**: Medium
- **Observed bugs / issues**: Delete path references `budgets` table while active budget feature uses `monthly_budgets`; likely schema drift risk.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F08. Monthly budgeting
- **Location**: `app/budgets/page.tsx`, `app/budgets/actions.ts`
- **What it does**: Per-category monthly plan upsert and deletion.
- **Triggered by**: Budget form edits.
- **Dependencies**: `monthly_budgets`, categories, dashboard rollups.
- **Usage likelihood**: Medium
- **Complexity**: Low-Medium
- **Observed bugs / issues**: Simple and stable; dependent on category consistency.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP`

### F09. Goal management & cash contribution flows
- **Location**: `app/goals/page.tsx`, `app/goals/actions.ts`
- **What it does**: Create goals, record inflow/outflow contributions, synchronize account cash movement.
- **Triggered by**: Goal forms.
- **Dependencies**: `goals`, `goal_contributions`, `transactions`, account balance snapshot utility.
- **Usage likelihood**: High
- **Complexity**: Medium-High
- **Observed bugs / issues**: Manual rollback pattern used; transactional integrity depends on sequential success.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F10. Debt tracking & payment recording
- **Location**: `app/debts/page.tsx`, `app/debts/[id]/page.tsx`, `app/debts/actions.ts`
- **What it does**: Records liability payments, updates outstanding principal, and writes corresponding expense tx.
- **Triggered by**: Debt payment form submission.
- **Dependencies**: `liabilities`, `liability_payments`, `transactions`.
- **Usage likelihood**: Medium-High
- **Complexity**: Medium
- **Observed bugs / issues**: No explicit pre-check on source account sufficiency; partial failure windows can desync payment vs tx rows.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F11. Asset register + valuation history + cashflows
- **Location**: `app/assets/actions.ts`, `app/assets/cashflow-actions.ts`, `app/assets/[id]/page.tsx`
- **What it does**: Creates assets, tracks quantity/price history, records contribution/withdrawal/income/fee/tax cashflows.
- **Triggered by**: Asset forms and detail page updates.
- **Dependencies**: `assets`, `asset_quantity_history`, `asset_price_history`, `asset_cashflows`, `transactions`.
- **Usage likelihood**: Medium
- **Complexity**: High
- **Observed bugs / issues**: Similar rollback/non-transactional sequencing risk in coupled insert operations.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F12. Savings lifecycle (create, project, withdraw, maturity)
- **Location**: `app/api/savings/*`, `app/money/savings/*`, `lib/savings/*`, migration `00039_savings_feature.sql`
- **What it does**: Full savings product lifecycle with interest/tax logic, projection, maturity actions, and linked transactions.
- **Triggered by**: Savings APIs from UI actions.
- **Dependencies**: Savings tables, categories, calculation library, cron maturity checks, jar sync hooks.
- **Usage likelihood**: High
- **Complexity**: High
- **Observed bugs / issues**: Domain-rich and robust, but high edge-case surface (partial withdrawals, maturity preference transitions, tax handling).
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F13. Credit card billing, installment conversion, FIFO settlement, cashback
- **Location**: `app/money/card/[id]/page.tsx`, `app/money/card/installment-actions.ts`, migrations `00014`–`00025`
- **What it does**: Credit card cycle statementing, installment plan conversion, settlement application by cycle order, cashback credit routing.
- **Triggered by**: Card management forms.
- **Dependencies**: `credit_card_settings`, `card_billing_months`, `card_billing_items`, `installment_plans`, transaction hooks.
- **Usage likelihood**: Medium-High
- **Complexity**: High
- **Observed bugs / issues**: Complex mutation choreography; requires stronger invariants/tests for statement amount correctness.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F14. Jars intent layer (core)
- **Location**: `app/jars/*`, `app/jars/actions.ts`, `app/jars/intent-actions.ts`, `lib/jars/intent.ts`, migration `00040`
- **What it does**: Intent-based bucket system with plans, movement tracking, review queue, auto-suggestions, manual adjustments.
- **Triggered by**: Jars command center and related financial events.
- **Dependencies**: `jars`, `jar_month_plans`, `jar_rules`, `jar_review_queue`, `jar_movements`, savings/transactions sync.
- **Usage likelihood**: Medium (high strategic value)
- **Complexity**: High
- **Observed bugs / issues**: Large architecture and many integration points; copy/localization inconsistency in several jar pages.
- **Finance norm fit**: Strong (envelope budgeting intent)
- **Recommendation**: `KEEP & OPTIMIZE`

### F15. Spending-jar analytics micro-APIs
- **Location**: `app/api/jars/spending/*`, migrations `00034`–`00037`
- **What it does**: Monthly summary/history/transactions/category-breakdown and category→jar mapping.
- **Triggered by**: Jars spending views and transaction-time warnings.
- **Dependencies**: spending map table + analytics RPCs + transaction categorization.
- **Usage likelihood**: Medium
- **Complexity**: Medium
- **Observed bugs / issues**: Depends heavily on accurate category mapping quality.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP`

### F16. Financial health engine + snapshots
- **Location**: `lib/health/engine.ts`, `app/api/dashboard/core/route.ts`, `health_score_snapshots`
- **What it does**: Computes weighted scores (cashflow/emergency/debt/net-worth/goals/diversification) with top action.
- **Triggered by**: Dashboard recalculation path.
- **Dependencies**: Household monthly metrics and snapshot persistence service.
- **Usage likelihood**: Medium
- **Complexity**: Medium
- **Observed bugs / issues**: Public API endpoint for explicit recalc is currently disabled.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F17. Rules-based insights engine
- **Location**: `lib/insights/engine.ts`, `insights` table, dashboard consumers
- **What it does**: Detects anomalies/goal-risk/debt alerts/milestones/net-worth changes and emits bilingual insight payloads.
- **Triggered by**: Recalculation jobs/services.
- **Dependencies**: Snapshots, transactions, goals, liabilities, insights storage.
- **Usage likelihood**: Medium
- **Complexity**: Medium
- **Observed bugs / issues**: Public insight recalc/check endpoints are disabled; discovery path is less explicit in UI.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F18. AI insight generation pipeline (backend-ready, frontend-disabled)
- **Location**: `supabase/functions/ai-cycle-dispatch/index.ts`, `supabase/functions/_shared/*`, migrations `00010`, `00011`
- **What it does**: Runs prompt-versioned Gemini cycles with caps, trigger checks, run locking, and delivery rows.
- **Triggered by**: Authenticated dispatch POST + scheduler jobs.
- **Dependencies**: AI prompt/run/insight tables, Gemini credentials, worker secret.
- **Usage likelihood**: Low currently (frontend API routes disabled)
- **Complexity**: High
- **Observed bugs / issues**: Product path is effectively dormant unless flags/routes are re-enabled and operationalized.
- **Finance norm fit**: Partial (good assistive layer, not core bookkeeping)
- **Recommendation**: `CONSIDER REMOVING` (if roadmap no longer includes AI) or keep behind strict flag with clear rollout plan.

### F19. Reports module (trend + monthly review)
- **Location**: `app/reports/*`, `lib/dashboard/trend`
- **What it does**: Net-worth trend chart, cash-flow trend chart, monthly review narrative widgets.
- **Triggered by**: Reports tab navigation.
- **Dependencies**: dashboard trend dataset, transaction/category aggregation.
- **Usage likelihood**: Medium
- **Complexity**: Low-Medium
- **Observed bugs / issues**: Some report pages still English-only; monthly review is heuristic and not deeply personalized.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F20. Settings domain (profile, household, members, categories, assumptions, language)
- **Location**: `app/settings/*`, `app/settings/actions.ts`
- **What it does**: Household preferences and account-level maintenance.
- **Triggered by**: Settings navigation and form actions.
- **Dependencies**: Profile/household/member/category/assumption persistence paths + language cookie (`ff_lang`).
- **Usage likelihood**: Medium
- **Complexity**: Medium
- **Observed bugs / issues**: Prior hardcoded string issues (partially addressed), still mixed-language copy in wider app.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP & OPTIMIZE`

### F21. Feature-flag-gated placeholder APIs
- **Location**: `app/api/ai-insights/*`, `app/api/cash-flow/forecast/route.ts`, `app/api/health/recalculate/route.ts`, `app/api/insights/*`
- **What it does**: Currently returns 404 “Feature disabled” for disabled modules.
- **Triggered by**: API calls to these routes.
- **Dependencies**: Feature flag strategy (`lib/config/features.ts`).
- **Usage likelihood**: Low
- **Complexity**: Low
- **Observed bugs / issues**: Dead-end endpoints can create product ambiguity if linked from UI or docs.
- **Finance norm fit**: Partial
- **Recommendation**: `KEEP & OPTIMIZE` (either fully enable with ownership or remove exposed routes).

### F22. Security, tenancy, and auditability foundation
- **Location**: `00003_functions_and_rls.sql`, audit writes in `app/*/actions.ts`
- **What it does**: RLS policies per household, helper membership functions, auth profile sync, immutable audit event stream.
- **Triggered by**: Every data access/write.
- **Dependencies**: `household_members`, `is_household_member`, audit table.
- **Usage likelihood**: High
- **Complexity**: High
- **Observed bugs / issues**: Policy breadth is strong; ongoing risk is drift when new tables are added.
- **Finance norm fit**: Strong
- **Recommendation**: `KEEP`

---

## 4) Feature dependency map (high-level)

### Core graph
1. **Auth/Profile (F01)** → enables **Household tenancy (F02)**
2. **Household tenancy (F02)** + **RLS/Audit (F22)** → required by all financial features
3. **Accounts/Transactions (F05/F06)** → foundational inputs for:
   - Budgets (F08)
   - Dashboard (F04)
   - Reports (F19)
   - Health (F16)
   - Insights (F17)
   - Credit-card billing (F13)
   - Jars/spending-jar (F14/F15)
4. **Savings lifecycle (F12)** ↔ **Jars intent (F14)** via sync hooks
5. **Goals (F09)** → feeds Dashboard/Health/Insights/Jars
6. **Debts (F10)** + **Credit cards (F13)** → feed liabilities and health/risk scoring
7. **AI pipeline (F18)** depends on Insights + prompts + scheduler infra; currently decoupled from user-facing routes

### Critical dependency cluster (most failure-sensitive)
- `Transactions` ↔ `Accounts` ↔ `Dashboard Core` ↔ `Health/Insights`
- `Savings` ↔ `Transactions` ↔ `Jars`
- `Card Billing` ↔ `Transactions` ↔ `Installment Plans`

---

## 5) Product-owner summary table

| Feature ID | Feature | Usage | Complexity | Finance Norm Fit | Recommendation | Why |
|---|---|---|---|---|---|---|
| F01 | Authentication | High | Low | Strong | KEEP | Mandatory platform entry point |
| F02 | Household collaboration | High | Medium | Strong | KEEP & OPTIMIZE | Core differentiator; UX path overlap |
| F03 | Onboarding wizard | High | High | Strong | KEEP & OPTIMIZE | High activation value, large logic surface |
| F04 | Dashboard core | High | High | Strong | KEEP & OPTIMIZE | Primary decision screen, heavy aggregator |
| F05 | Money overview | High | High | Strong | KEEP & OPTIMIZE | High user value, oversized UI module |
| F06 | Transaction ledger | High | High | Strong | KEEP & OPTIMIZE | Financial source-of-truth, regression-sensitive |
| F07 | Categories | Medium | Medium | Strong | KEEP & OPTIMIZE | Necessary taxonomy; probable schema drift issue |
| F08 | Budgets | Medium | Low-Med | Strong | KEEP | Clear budgeting baseline feature |
| F09 | Goals | High | Med-High | Strong | KEEP & OPTIMIZE | Goal-centric planning; mutation integrity risk |
| F10 | Debts | Med-High | Medium | Strong | KEEP & OPTIMIZE | Essential debt management; needs stricter safeguards |
| F11 | Assets | Medium | High | Strong | KEEP & OPTIMIZE | Valuable but complex multi-table orchestration |
| F12 | Savings lifecycle | High | High | Strong | KEEP & OPTIMIZE | Strategic feature depth and differentiation |
| F13 | Credit card/installments | Med-High | High | Strong | KEEP & OPTIMIZE | Powerful, complex statement correctness risks |
| F14 | Jars intent layer | Medium | High | Strong | KEEP & OPTIMIZE | Strategic model; high coupling and ops cost |
| F15 | Spending-jar analytics | Medium | Medium | Strong | KEEP | Useful operational extension of jars |
| F16 | Financial health score | Medium | Medium | Strong | KEEP & OPTIMIZE | Good coaching mechanic; API path disabled |
| F17 | Rules insights | Medium | Medium | Strong | KEEP & OPTIMIZE | Actionable advice layer; distribution clarity needed |
| F18 | AI insight pipeline | Low (current) | High | Partial | CONSIDER REMOVING | Backend exists but user path disabled/inactive |
| F19 | Reports | Medium | Low-Med | Strong | KEEP & OPTIMIZE | Useful review layer; shallow personalization |
| F20 | Settings domain | Medium | Medium | Strong | KEEP & OPTIMIZE | Governance and collaboration hygiene |
| F21 | Disabled placeholder APIs | Low | Low | Partial | KEEP & OPTIMIZE | Either operationalize or retire to reduce ambiguity |
| F22 | RLS + audit foundation | High | High | Strong | KEEP | Non-negotiable trust and security controls |

---

## 6) Notable cross-cutting risks (observed)

1. **Transactional consistency risk in multi-write flows** (assets, goals, savings, card/installment actions) because operations are sequenced manually across tables.
2. **Localization inconsistency**: several runtime pages remain mixed-language/hardcoded.
3. **Complex monolith files** (`money/page.tsx`, large action modules) raise maintenance cost and regression probability.
4. **Dormant-but-present AI/forecast/insight routes** can create roadmap and ownership ambiguity.
5. **Potential schema drift** around budget table naming (`budgets` vs `monthly_budgets`) in category deletion flow.

---

## 7) Suggested next optimization sequence

1. Stabilize **financial mutation integrity** (idempotency + transactional wrappers for multi-table mutations).
2. Complete **i18n hardening pass** across all top-traffic surfaces.
3. Split large pages/actions into smaller domain modules with invariant tests.
4. Resolve **AI feature decision** (activate with clear KPI ownership, or retire).
5. Verify and reconcile schema references around budgeting paths.
