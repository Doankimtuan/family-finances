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

---

## 2. Product/UX Contract (Implemented Direction)

- **Language**: Bilingual (`en` + `vi`) with household-level language setting.
- **Narrative-First**: Replaces dry scores with "Health Stories" (e.g., "Improving", "Healthy") and dynamic visualizations.
- **Action-Oriented**: Focuses on "Priority Actions" and "ETA" (Expected Time of Arrival) rather than just status.
- **Consolidated Navigation**: Mobile-first design with 4 primary tabs: **Home** (Dashboard), **Money** (Accounts/Assets/Debts/Flow), **Activity** (Transactions), and **Plan** (Insights/Health/Goals/Budgets).
- **Constructive Framing**: Uses progress-focused, non-shaming vocabulary (e.g., "Building" vs "Fragile").
- **Manual Logging**: Optimized for high-speed manual data entry (under 10 seconds).
- **Vietnamese Financial Context**: Native support for gold (`lượng`), VND scale, and complex mortgage rate structures (promo-to-floating).

---

## 3. Technical Baseline

Stack in use:

- Next.js 16 App Router + TypeScript
- Supabase (Postgres, Auth, RLS, Realtime)
- Supabase Edge Functions + `pg_cron`/`pg_net` for scheduled AI execution
- shadcn-style UI primitives + Tailwind v4 (`bg-linear-to-br` NOT `bg-gradient-to-br`)
- Recharts
- TanStack Query + Supabase Realtime integration

Deployment target:

- Vercel + Supabase hosted

> **Tailwind v4 note**: Use `bg-linear-to-br` instead of `bg-gradient-to-br`. The old class names will generate lint errors.

---

## 4. Current Solution Architecture

### Frontend structure

- **App Shell**: Wraps pages with mobile-friendly container, sticky header (with Settings access), and 4-tab bottom navigation.
- **Components**: Shared primitives under `components/ui/*` (Card, MetricCard, SectionHeader, Progress, EmptyState, Badge, MoneyInput, Select).
- **Server Actions / API routes**: Typed action states with revalidation and audit logging. AI feedback/read state endpoints added under `app/api/ai-insights/*`.

### Data flow pattern

- **Server Discovery**: Fetches household-scoped context and data early.
- **Realtime Bridge**: `HouseholdRealtimeSync` ensures multi-device consistency without manual refreshes.
- **Explainability**: Complex metrics (Health, Insights) provide drill-downs or "How this is calculated" narratives.
- **Scheduled AI**: New Supabase Edge dispatcher runs on cron cadence, gated by deterministic triggers and monthly quota.

---

## 5. Database and Migrations (Current)

Migration files in `supabase/migrations/`:

| File                                  | Purpose                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `00001` to `00008`                    | Core schema, lifecycle, RLS                                                             |
| `00009_goal_cashflow_directions.sql`  | Goal inflow/outflow + account direction                                                 |
| `00010_ai_insights_foundation.sql`    | AI storage, runs, delivery, feedback, prompt versions, RPC locks                        |
| `00011_ai_scheduler_cron.sql`         | Scheduler config + `invoke_ai_cycle` + cron jobs                                        |
| `00014_credit_card_installments.sql`  | `installment_plans` table, `credit_card_settings` table                                 |
| `00015_card_billing.sql`              | `card_billing_months`, `card_billing_items` tables                                      |
| `00016_fix_billing_trigger.sql`       | Trigger fixes for billing                                                               |
| `00017_installment_conversion.sql`    | Adds `is_converted_to_installment` BOOLEAN to `card_billing_items`                      |
| `00018_fix_dashboard_cc_expense.sql`  | Patches `rpc_dashboard_core` to exclude CC raw transactions from expense sum            |
| `00019_sync_installment_progress.sql` | One-time sync: backfill `paid_installments` + `remaining_amount` on `installment_plans` |

---

## 6. Credit Card & Installment System (New Module)

### 6a. Core Concept

Credit card transactions are **NOT** standard expense transactions for calculation purposes. They flow through a separate billing cycle system:

```
Transaction recorded → card_billing_items (via billing_month_id → card_billing_months)
Monthly total → card_billing_months.statement_amount
User settlement → card_billing_months.paid_amount / status
```

### 6b. credit_card_settings (per card)

| Column                   | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `account_id`             | FK → accounts                             |
| `credit_limit`           | Max spending limit                        |
| `statement_day`          | Day of month billing cycle ends (e.g. 21) |
| `due_day`                | Payment due day                           |
| `linked_bank_account_id` | Default bank account for repayments       |

### 6c. card_billing_months

Tracks one record per card per billing cycle month.

| Column             | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `card_account_id`  | FK → accounts                                   |
| `billing_month`    | YYYY-MM-01 date                                 |
| `statement_amount` | Total for this cycle (updated by billing items) |
| `paid_amount`      | Amount settled                                  |
| `status`           | `unpaid` / `partial` / `settled`                |

### 6d. card_billing_items

Individual line items inside a billing cycle.

| Column                        | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `billing_month_id`            | FK → card_billing_months                                                           |
| `installment_plan_id`         | NULL for standard, FK for installment items                                        |
| `item_type`                   | `standard` or `installment`                                                        |
| `installment_sequence`        | 1-based sequence within a plan                                                     |
| `amount`                      | Item amount                                                                        |
| `fee_amount`                  | Conversion fee (applied to first installment only)                                 |
| `description`                 | Item label                                                                         |
| `is_paid`                     | Set true when cycle is settled                                                     |
| `is_converted_to_installment` | TRUE when original item was converted; its amount is excluded from statement total |

### 6e. installment_plans

Tracks the lifecycle state of a conversion-to-installment action.

| Column              | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `card_account_id`   | FK → accounts                               |
| `description`       | Plan label                                  |
| `original_amount`   | Full transaction amount                     |
| `conversion_fee`    | One-time fee                                |
| `total_amount`      | original + fee                              |
| `monthly_amount`    | Per-month installment                       |
| `num_installments`  | Total months                                |
| `paid_installments` | Count paid so far (updated on cycle settle) |
| `remaining_amount`  | What's left to pay                          |
| `status`            | `active` / `completed`                      |

---

## 7. Installment Conversion Flow (Critical Business Logic)

### Converting a transaction to installments

Action: `convertItemToInstallmentAction` in `app/money/card/installment-actions.ts`

Steps:

1. Fetch the source `card_billing_items` row (must be `item_type != installment` and `is_converted_to_installment = false`)
2. Mark item `is_converted_to_installment = true` → prevents double-counting in statement total
3. Call `increment_statement_amount` RPC with **negative** value to remove original amount from source cycle
4. Insert a new `installment_plans` record
5. Loop N months: upsert `card_billing_months` + insert `card_billing_items` with `item_type = 'installment'`
6. Call `increment_statement_amount` RPC with monthly amount for each new month

### Settling a card (FIFO)

Action: `settleCardAction` in `app/money/card/installment-actions.ts`

Steps:

1. Fetch all unsettled billing months ordered oldest-first
2. Apply payment amount FIFO across cycles
3. When a cycle is **fully settled**:
   - Set `card_billing_months.status = 'settled'`
   - Set `card_billing_items.is_paid = true` for all items in cycle
   - **Update installment_plans**: for each installment item paid, increment `paid_installments` and decrease `remaining_amount`
   - Mark plan `status = 'completed'` when `paid_installments >= num_installments`
4. Insert a `transfer` transaction (source bank → credit card)

> **Bug fixed (session 2026-02-28)**: Previously `settleCardAction` did NOT update `installment_plans.paid_installments` or `remaining_amount`. This caused the progress bar on the "Active Installment Plans" section to never advance. Fixed by adding post-settle installment plan sync logic.

---

## 8. Dashboard Expense Calculation (Credit Card Fix)

### The problem

`rpc_dashboard_core` originally summed ALL expense transactions:

```sql
SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND ...
```

This included full-amount credit card transactions even after conversion to installments.

### The fix (migration 00018)

Split expense calculation into two parts:

1. **Non-CC accounts**: Sum expense transactions as before (excluding `credit_card` account types)
2. **CC accounts**: Sum `card_billing_items` where `is_converted_to_installment = false` for the current billing month

This ensures converted items contribute only their **monthly installment amount**, not the full original transaction.

### Dashboard API route fix (`app/api/dashboard/core/route.ts`)

The category breakdown (donut chart) had the same problem:

- **Wrong approach used initially**: Supabase join `account:accounts!account_id(type)` — this uses FK **constraint name** not column name; it silently fails returning null for all rows.
- **Correct approach**: Pre-fetch CC account IDs in a separate query, build a `Set<string>`, then use `ccAccountIds.has(tx.account_id)` to skip CC expense transactions.
- CC billing items for the current month are aggregated into a single "Thẻ tín dụng" bucket in the `expenseMap`.

---

## 9. Credit Card UI Components

### Credit Card Detail Page (`app/money/card/[id]/page.tsx`)

- **Hero card**: Dark gradient, shows outstanding balance, credit limit, usage bar, statement day, due day, linked account
- **Usage bar**: Uses `rawUsage = (balance / creditLimit) * 100`, minimum 1% width when balance > 0 (prevents invisible bar for small balances), `usageDisplay` shows 1 decimal for < 1% (e.g., "0.1%" not "0%")
- **Active Installment Plans**: Shows progress bar based on `paid_installments / num_installments`
- **Billing History**: Each billing cycle shows all items. Standard unpaid items show a "Trả góp" button → opens `ConvertToInstallmentDialog`. Converted items show strikethrough + "→ Trả góp" badge. Installment items show "Góp N" sequence badge.

### ConvertToInstallmentDialog (`app/money/card/_components/convert-to-installment-dialog.tsx`)

Client component. Triggered per-item in billing history:

- Shows source transaction summary
- Inputs: number of installments (2–60), conversion fee (VND)
- Live preview of monthly payment amount
- Submits `convertItemToInstallmentAction`

### Money Page Credit Card Display (`app/money/page.tsx`)

- CC balance comes from `cardOutstandingMap` (summed from `card_billing_months`, not from `transactions`)
- Same min-1% bar fix applies
- `usageDisplay` used for text, `usagePercent` used for bar width

---

## 10. Supabase Join Gotcha (Important)

**Never use `table!column_name(fields)` in Supabase selects when `column_name` is a column, not a constraint name.**

Supabase disambiguates FK joins using the **constraint name** (e.g., `transactions_account_id_fkey`), not the column name.

```typescript
// ❌ WRONG - silently returns null for all rows
.select("account_id, account:accounts!account_id(type)")

// ✅ CORRECT option 1 - only if there's one FK to accounts
.select("account_id, account:accounts(type)")

// ✅ CORRECT option 2 - fetch CC account IDs separately then use Set
const ccIds = new Set(ccAccountsResult.data.map(a => a.id));
if (ccIds.has(tx.account_id)) { /* this is a CC transaction */ }
```

---

## 11. AI Insights Module (Existing)

### Key data model

- `ai_prompt_versions`: Prompt registry with active version per AI function.
- `ai_insight_runs`: Idempotent run tracking (`running/completed/failed/skipped`) per household + function + period.
- `ai_insights`: Structured AI output (`content_json`) + narrative text + metadata (model, tokens, latency).
- `ai_insight_deliveries`: Per-member delivery/read status for in-app/email channels.
- `ai_insight_feedback`: Helpful/not-helpful user feedback linked to prompt version.
- `ai_scheduler_config`: Singleton table storing edge URL + worker secret + on/off flag.

### Scheduled AI functions

1. **`monthly_review`** — Runs monthly (VN 08:00 day 1). Vietnamese financial summary + 1 concrete weekly action.
2. **`goal_risk_coach`** — Weekly (VN Monday 08:00). Only calls AI if off-track rule true.
3. **`spending_anomaly_explainer`** — Weekly (VN Wednesday 20:00). Only calls AI if +25% anomaly threshold breached.

### Cost guardrails

- Hard cap: **max 6 AI generations per household per month**.
- Priority: `monthly_review` > `goal_risk_coach` > `spending_anomaly_explainer`.
- Near cap: deterministic fallback stored in `insights` (no AI call).

---

## 12. Known Gaps / Next Best Steps

1. **AI Insights UI**: Render `ai_insights` in dashboard/insights card, with thumbs up/down and read-state interactions.
2. **Weekly Email Digest**: Use `ai_insight_deliveries.channel = 'email'` + mail provider.
3. **Monitoring**: Failure alerts for `ai_insight_runs.status = 'failed'` with retry visibility.
4. **Installment: Partial cycle settlement**: Currently, `installment_plans` are only updated when a full cycle is settled. Partial payments do not advance `paid_installments`. Consider whether partial payment should count as a paid installment.
5. **CC expense in essential spending / emergency fund**: The `essential_by_month` CTE in `rpc_dashboard_core` still uses raw `transactions` (not billing items) for CC. If CC spending is tagged as essential, this will be inaccurate.

---

## 13. Key File Index

| Purpose                              | File                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Handoff doc                          | `AI_KNOWLEDGE_HANDOFF.md`                                                             |
| Credit card installment actions      | `app/money/card/installment-actions.ts`                                               |
| Convert to installment dialog        | `app/money/card/_components/convert-to-installment-dialog.tsx`                        |
| Settle card form                     | `app/money/card/_components/settle-card-form.tsx`                                     |
| Credit card detail page              | `app/money/card/[id]/page.tsx`                                                        |
| Money (accounts) page                | `app/money/page.tsx`                                                                  |
| Dashboard API route                  | `app/api/dashboard/core/route.ts`                                                     |
| Dashboard aggregates RPC             | `supabase/migrations/00006_dashboard_aggregates.sql`                                  |
| CC settings + installment schema     | `supabase/migrations/00014_credit_card_installments.sql`                              |
| Billing tables schema                | `supabase/migrations/00015_card_billing.sql`                                          |
| `is_converted_to_installment` column | `supabase/migrations/00017_installment_conversion.sql`                                |
| Dashboard CC expense fix RPC         | `supabase/migrations/00018_fix_dashboard_cc_expense.sql`                              |
| Installment progress backfill        | `supabase/migrations/00019_sync_installment_progress.sql`                             |
| AI migrations                        | `supabase/migrations/00010_ai_insights_foundation.sql`, `00011_ai_scheduler_cron.sql` |
| Edge dispatcher                      | `supabase/functions/ai-cycle-dispatch/index.ts`                                       |
| Deterministic insights engine        | `lib/insights/engine.ts`, `lib/insights/service.ts`                                   |
| Dashboard trend helper               | `lib/dashboard/trend.ts`                                                              |
| UI money input                       | `components/ui/money-input.tsx`                                                       |

---

## 14. AI Continuation Guide for Future Agents

- Keep AI **scheduled and gated**, not real-time.
- Prefer deterministic SQL/math pre-computation; AI should explain and recommend, not calculate raw metrics.
- Maintain strict output contracts (JSON), Vietnamese user-facing tone, and exactly one action recommendation.
- Do not merge `ai_insights` into legacy `insights` unless a deliberate migration strategy is approved.
- Respect cost cap and trigger gating; they are product decisions, not temporary safeguards.
- **Credit card expenses must always come from `card_billing_items`**, never raw `transactions`. The `transactions` table entry for a CC expense still exists for account balance tracking but must be excluded from expense/category calculations.
- **Always run migration 00019** (`sync_installment_progress`) when onboarding existing data or after deploying the settle-tracking fix, to backfill `paid_installments` and `remaining_amount` on existing plans.
- **Never use Supabase join syntax `table!column_name`** — use `table!constraint_name` or fetch related IDs separately.
