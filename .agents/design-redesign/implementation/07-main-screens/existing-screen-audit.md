# Implementation 07 — Existing Screen Audit (Five Top-Level Tabs)

**Canonical Design System**: Task 11 ViNha Component System (`assets/75087efd2c3c42baa6ce67405334331b`)  
**Scope**: Five authenticated main application tabs: Home, Money, Plan, Inbox, Together  
**Date**: September 27, 2026

---

## 1. Screen Audit: Home (`/[locale]/home`)

### Technical Profile

- **Route**: `/[locale]/(product)/home/page.tsx`
- **Canonical Stitch IDs**: Light `c48a58d9f013494eb4bd4b2bc41d31d9` / Dark `d4a4d84e44c94a05ae3bfeefc6df9e6f` (SCR-01)
- **Server/Client Architecture**:
  - `HomePage` (`page.tsx`): Server Component (RSC).
  - `HomeTopBar` & `HomeTopBarFallback`: RSC with Suspense streaming.
  - `HomeContent`: RSC composing parallel data streams (`savings`, `investments`, `loans`, `debt`, `periodData`, `inbox`).
  - Interactive Client Islands:
    - `HomePeriodControl` (`home-period-control.tsx`): Segmented month/quarter toggle.
    - `HomeCaptureAction` (`home-capture-action.tsx`): Shared floating CTA button.
    - `HomeFinancialPulse` (`home-financial-pulse.tsx`): Hero asset display with privacy toggle.
- **Data Dependencies & Queries**:
  - `getHomeReadiness()`: Account readiness, day-zero detection, currency.
  - `getHouseholdPreferences()`: Household name, default preferences.
  - `getOpenInboxAttention()`: Pending inbox count.
  - `getHomePeriodData(period)`: Cash-flow metrics (income, expenses, net delta) and recent transactions.
  - `getHomeSavingsSummary()`, `getHomeInvestmentSummary()`, `getHomeLoanSummary()`, `getHomeDebtSummary()`: 4-pillar financial summaries.
- **Loading State**:
  - `HomeTopBarFallback` (Skeleton for header).
  - `HomeStreamingFallback` / `HomeContentSkeleton` with `Card tone="hero"` and section skeletons.
- **Error State**:
  - `HomeStatusLane` (`HomeStatusLaneKind.ERROR` with retry action).
- **Empty State**:
  - Day Zero flow handled by `HomeDayZeroTrio` when `isDayZero` is true.
  - Zero-balance loans and peer debts show calm reassurance states (`An toàn tuyệt đối`, `Đã đối soát xong`).
- **Legacy UI Components to Replace**:
  - Ad-hoc transaction items in `HomePeriodStory` → replace with canonical `TransactionRow`.
  - Bespoke product summary cards in `HomeProductSummaries` → replace with canonical `SavingsRow`, `InvestmentRow`, `LoanRow`, `PersonalDebtRow`.
  - Non-canonical header markup → harmonize with `PageHeader` / canonical `TopAppBar`.

---

## 2. Screen Audit: Money (`/[locale]/money`)

### Technical Profile

- **Route**: `/[locale]/(product)/money/page.tsx`
- **Canonical Stitch IDs**: Light `31dcf3d3e06042d0973920dc3ad1a08d` / Dark `b7af0cf462204bed9beedf116503c5d0` (SCR-02)
- **Server/Client Architecture**:
  - `MoneyHubPage` (`page.tsx`): Server Component fetching multi-domain summaries via `Promise.all`.
  - Interactive Client Islands:
    - `MoneyHubAccounts` (`money-hub-accounts.tsx`): Accounts expansion, group filters, fast create triggers.
    - `MoneyCaptureAction` (`money-capture-action.tsx`): Fast transaction entry CTA.
- **Data Dependencies & Queries**:
  - `getRealPosition()`: Real cash and liquid depository balance.
  - `listCreditCards()`: Active credit cards, statement cycles, utilization, credit limits.
  - `getSavingsHomeSummary()`: Savings deposit count, total principal, action-required attention count.
  - `listInvestmentHomeSummary()`: Market value, asset classes, valuation inclusion.
  - `listLoanSummaries()`: Outstanding bank debts, upcoming payments.
  - `listDebts()`: Personal lending/borrowing records, overdue counts.
- **Loading State**:
  - Handled by route-level `loading.tsx` with skeleton cards.
- **Error State**:
  - `MoneyOfflineBanner` for network disconnects; module-level `unavailableValue()` fallback when individual reads fail.
- **Empty State**:
  - Handled by `MoneyHubAccounts` empty state with clear guidance.
  - Module rows show `t("hub.modules.empty")` or zero debt pill.
- **Legacy UI Components to Replace**:
  - `MoneyModuleRow` bespoke item layouts → replace with canonical `FinancialRow` or specialized domain rows (`SavingsRow`, `InvestmentRow`, `LoanRow`, `PersonalDebtRow`).
  - Credit card custom presentation → harmonize with canonical `AccountRow` credit styling (`Hạn mức: ...`).
  - Legacy `TopAppBar` variant → harmonize with canonical `PageHeader`.

---

## 3. Screen Audit: Plan (`/[locale]/plan`)

### Technical Profile

- **Route**: `/[locale]/(product)/plan/page.tsx`
- **Canonical Stitch IDs**: Light `70749ca2e350497f9def0dadf235d3ba` / Dark `893e91e4bced4fa4af9f44b8cd967316` (SCR-35)
- **Server/Client Architecture**:
  - `PlanPage` (`page.tsx`): Server Component calculating jar health and upcoming commitments.
  - Interactive Client Islands:
    - Month navigation / ritual triggers.
    - `PlanHubHero` / `PlanHubExceptions` client wrappers for interactive warnings.
- **Data Dependencies & Queries**:
  - `getPlanPulse()`: Current period month, planned income, allocated percentage, health status.
  - `getCurrentJarBudgets()`: Jars list with planned amount, actual spent, remaining capacity, budget state.
  - `listPlanHubUpcomingEvents()`: Outflow commitments due in the next 7 days.
  - `listGoals()`: Active financial goal progress.
  - `listOpenInboxItems()`: Uncategorized transactions requiring attention.
- **Financial Invariants (P0)**:
  - `Jar ≠ Account`: Jars are budget caps, not bank accounts.
  - `Planned ≠ Spent`: Progress indicates budget consumption, not cash transfers.
  - `Adjustment ≠ Transaction`: Reallocations do not generate bank movements.
- **Loading State**:
  - `PlanContextSkeleton`, `PlanWorkRowSkeleton` in `loading.tsx`.
- **Error State**:
  - `PlanOfflineBanner`, `StatusAlert` for allocation health warnings.
- **Legacy UI Components to Replace**:
  - Bespoke jar progress bars → replace with canonical `Progress` / `ProgressSummary` (100% clamped).
  - Legacy work rows → harmonize with `BaseRow` / `FinancialRow`.

---

## 4. Screen Audit: Inbox (`/[locale]/inbox`)

### Technical Profile

- **Route**: `/[locale]/(product)/inbox/page.tsx`
- **Canonical Stitch IDs**: Light `80394649d39f4c458d55e834611d45c2` / Dark `1efc32d2855745c6ae118f880dafefe1` (SCR-41)
- **Empty Stitch IDs**: Light `354e2436922c475093af873d271fec77` / Dark `1a3419ca795a4978964ffbfaf9792694` (SCR-45)
- **Server/Client Architecture**:
  - `InboxPage` (`page.tsx`): Server Component reading open or archived attention items.
  - Interactive Client Islands:
    - `InboxQueueTabs` (`inbox-queue-tabs.tsx`): Segmented switch between Open and Archived.
    - `InboxQueueList` (`inbox-queue-list.tsx`): Filter chips by kind (Unmapped, Maturity, Overdue, Discrepancy).
- **Data Dependencies & Queries**:
  - `listOpenInboxPage()` / `listArchivedInboxItems()`: Attention queue items with urgency, domain link, and action metadata.
  - `after()` background workers: `runInboxStalenessWorker()`, `syncLoanDebtAttentionInboxItems()`.
- **Loading State**:
  - `InboxQueueHeaderPending`, `InboxQueueBodyPending`.
- **Error State**:
  - `InboxUnavailable`, `InboxOfflineBanner`.
- **Empty State**:
  - SCR-45 Canonical Zero Pending State with checkmark glyph and reassurance text ("Tuyệt vời! Không còn việc tồn đọng").
- **Legacy UI Components to Replace**:
  - Bespoke review cards → replace with canonical `InboxRow` (featuring the 3px vertical urgency accent strip and category badge).

---

## 5. Screen Audit: Together (`/[locale]/together`)

### Technical Profile

- **Route**: `/[locale]/(product)/together/page.tsx`
- **Canonical Stitch IDs**: Light `f45af37b153c4a739848e2bd0ed230e4` / Dark `d0e81a7d33c047aaa1d163ba6caf18d8` (SCR-46)
- **Server/Client Architecture**:
  - `TogetherPage` (`page.tsx`): Server Component validating household membership and listing members/invitations.
- **Data Dependencies & Queries**:
  - `requireTogetherMembership()`: Enforces authenticated tenancy context.
  - `listHouseholdMembers()`: Household name, member list, roles (`admin` vs `partner`).
  - `listPendingInvitations()`: Active invitation tokens and expiration status.
- **Loading State**:
  - Handled by `loading.tsx` with member skeleton items.
- **Error State**:
  - `TogetherStatusStrip` (`tone="warning"`) for solo-admin departure locks.
- **Empty State**:
  - Fallback member empty state.
- **Legacy UI Components to Replace**:
  - Bespoke member preview items → replace with canonical `MemberRow` and `PersonIdentity` (Vietnamese initials generator, presence dot, role badge).
  - Nav rows → replace with canonical `NavigationRow`.
  - Header → harmonize with canonical `PageHeader`.
