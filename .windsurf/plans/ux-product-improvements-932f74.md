# UX/Product Improvements — Implementation Plan

Implement Section 5 recommendations: full navigation restructure, dashboard tier 2/3, and transaction entry optimization.

---

## Phase 1: Navigation Restructure

### 1.1 Merge Money + Debts → `/accounts`
- Create `app/accounts/` with unified page combining Money sections (NetWorthHero, Accounts, Assets, CreditCards, Liabilities, Savings) + Debts content
- Port queries from `app/money/_lib/queries.ts` and debts queries into `app/accounts/_lib/`
- Add 308 redirects: `/money` → `/accounts`, `/debts` → `/accounts`
- Remove `app/money/` and `app/debts/` directories

### 1.2 Rename Transactions → Activity
- Rename `app/transactions/` → `app/activity/`, update all imports
- Update i18n keys: `transactions.*` → `activity.*`
- Add 308 redirect: `/transactions` → `/activity`

### 1.3 Merge Jars into Goals
- Add tab navigation to `app/goals/page.tsx` via search params (`?tab=jars`)
- Port Jars components into `app/goals/_components/jars-tab.tsx`
- Add 308 redirect: `/jars` → `/goals?tab=jars`
- Remove `app/jars/` directory

### 1.4 Update Bottom Tab Bar
- New tabs: Dashboard | Accounts | Activity | Goals
- Icons: LayoutDashboard, Wallet, ArrowLeftRight, Target
- Update dictionary: `nav.accounts`, `nav.goals`, `nav.activity`

### 1.5 Cross-Reference Audit
- Update all hardcoded paths in dashboard, settings, onboarding, decision-tools, error pages
- Update `revalidatePath` calls in server actions
- Update feature flags

---

## Phase 2: Dashboard Tier 2/3

### 2.1 Mini Sparklines Row
- Create `sparkline-row.tsx` with 3 lightweight SVG sparklines below MetricsGrid
- Net Worth (6mo), Savings Rate trend, Expense trend
- Each links to full chart or Accounts page

### 2.2 Upcoming Bills Widget
- Create `upcoming-bills.tsx` showing credit card dues + liability payments in next 7-14 days
- Add to dashboard API or activity endpoint
- Display: bill name, amount, due date, priority

### 2.3 Tier 3 Deep Links
- Extend `QuickActionsSection` with links to: Decision Tools, Full Reports, Settings

---

## Phase 3: Transaction Entry Optimization

### 3.1 Quick-Add Templates (User Favorites)
- Migration: `quick_add_templates` table (household_id, user_id, type, category_id, amount, description, sort_order)
- `template-chips.tsx`: horizontal scrollable chips above quick-add form
- Server actions: save/delete/reorder templates
- "Save as template" toast action after successful quick-add
- Seed 5-6 system defaults (Coffee, Grab, Lunch, Salary, Rent)

### 3.2 Smart Category Suggestions
- `lib/transactions/suggestions.ts`: query recent transactions by description substring match
- API endpoint: `/api/activity/suggestions?q=...`
- Show suggested category chips when user types description in QuickAddForm

---

## Phase 4: Polish

### 4.1 Redirects & SEO
- 308 redirects in `next.config.ts` for all old routes
- Update metadata on all new/renamed pages

### 4.2 i18n Dictionary
- Add keys: `nav.accounts`, `accounts.*`, `activity.*`, `nav.goals`
- Update Vietnamese + English translations

### 4.3 Cleanup
- Remove dead feature flag references if Jars flag becomes irrelevant
- Remove unused imports after directory deletions
