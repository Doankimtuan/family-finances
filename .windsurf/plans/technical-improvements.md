# Technical Improvement Plan — Family Finances

## Phase 1: Code Quality & Safety (Week 1)

### 1.1 ESLint Rules
- Install `eslint-plugin-unused-imports`
- Add to `eslint.config.mjs`: `no-console: "error"`, `unused-imports/no-unused-imports: "error"`, `unused-imports/no-unused-vars: "warn"`
- Run `eslint --fix`; fix remaining violations

### 1.2 Type Safety — Eliminate `any[]`
- `health-factors.tsx:12`: `healthData: any` → use `DashboardCoreResponse["health"]`
- `recent-activity.tsx:17`: `transactions: any[]` → use `DashboardCoreResponse["recentTransactions"]`
- `snapshots-section.tsx:14-15`: `goals: any[]`, `jars: any[]` → proper types from `lib/dashboard/types.ts`
- `action-context.ts:15`: `user: any` → `User` from `@supabase/supabase-js`
- Generate `Database` types via `supabase gen types typescript`

### 1.3 Magic Numbers → `lib/constants.ts`
Create centralized constants for: `ITEMS_PER_PAGE` (20), `STALE_TIME_DASHBOARD` (60s), `STALE_TIME_DEFAULT` (30s), `COOKIE_MAX_AGE` (365d), `WEEK_MS` (7d), health score weights.

### 1.4 Mixed Vietnamese/English Audit
- Audit all files for non-dictionary strings (found in jars/actions, jars/intent-actions, transactions-list)
- Add missing keys to `lib/i18n/dictionary.ts`
- Replace inline `vi ? "..." : "..."` with `t("key")`

---

## Phase 2: Architecture (Week 2-3)

### 2.1 Dashboard API Split
- Create `/api/dashboard/activity/route.ts` (extract from core: recent transactions + priority actions)
- Create `/api/dashboard/goals/route.ts` (extract from core: goals + contributions)
- Refactor `/api/dashboard/summary/route.ts` to remove `rpc_dashboard_core` dependency
- Update `use-dashboard-data.ts` to call split endpoints
- Add `Cache-Control: stale-while-revalidate` headers

### 2.2 Server Action Consolidation
- Migrate duplicate `resolveContext()` in goals, categories, settings to shared `resolveActionContext()`
- Standardize all returns to `ActionState<T>` from `lib/server/action-helpers.ts`
- Remove duplicate `ok()`/`fail()` helpers
- Consolidate `revalidatePath` calls into domain helpers

### 2.3 Data Fetching Standard
- Rule: **RSC for initial load, TanStack Query for client interactivity**
- Convert raw `fetch()` in savings forms to `useMutation`
- Create `lib/queries/keys.ts` query key factory
- Standardize `staleTime` via constants

### 2.4 Error Handling
- Create `components/ui/error-boundary.tsx` with fallback UI + retry
- Create `lib/errors.ts` with `AppError`, `ValidationError`, `AuthError` classes
- Wrap dashboard sections in `<ErrorBoundary>`
- Standardize: all server actions → `toast.error(result.message)` pattern

---

## Phase 3: Performance (Week 3-4)

### 3.1 Dashboard N+1
- Move `fetchSavingsBundle` and `fetchJarCommandCenter` into main `Promise.all`
- Prefetch health snapshot in parallel
- Replace trend fallback loop with single RPC call handling gaps
- Consider materialized view `mv_dashboard_summary`

### 3.2 Transaction Cursor Pagination
- Create `/api/transactions/route.ts` with `?cursor=&limit=20`
- Replace client-side `.slice()` with server-side cursor using `transaction_date` + `created_at`
- Use `useInfiniteQuery` for automatic page accumulation
- Replace page numbers with "Load More" button

### 3.3 Recharts Tree-Shaking
- Replace barrel imports with direct paths: `recharts/es6/chart/LineChart`
- Or use `next.config.ts` `modularizeImports` config
- Expected savings: ~40-60KB gzipped

### 3.4 ISR Revalidation
- Add `export const revalidate = 60` to dashboard page
- Tag queries with `next: { tags: [...] }`
- Use `revalidateTag()` instead of broad `revalidatePath()` in actions

---

## Phase 4: Database (Week 4-5)

### 4.1 Soft Deletes
- Add `deleted_at timestamptz` to: `transactions`, `accounts`, `assets`, `liabilities`, `goals`, `categories`, `jar_definitions`
- Update all `.eq("is_archived", false)` queries to also check `.is("deleted_at", null)`
- Create `soft_delete_record()` RPC function

### 4.2 Data Archival
- Add table partitioning by year on `transactions` (`transaction_date`)
- Create `transactions_archive` table with same schema
- Add cron job to move records > 3 years old

### 4.3 Missing Indexes
Audit and add composite indexes for common query patterns:
- `transactions(household_id, transaction_date DESC, created_at DESC)` — pagination
- `transactions(household_id, category_id, transaction_date)` — category breakdown
- `transactions(household_id, account_id, transaction_date)` — account balance
- `card_billing_items(household_id, billing_month_id)` — CC breakdown
- `asset_price_history(asset_id, as_of_date DESC)` — latest price lookup

### 4.4 RLS Simplification
- Audit current RLS policies for performance
- Consolidate overlapping policies
- Add `security definer` wrapper functions for complex cross-table checks
