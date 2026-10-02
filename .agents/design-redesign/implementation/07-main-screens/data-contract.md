# Implementation 07 — Data Contracts (Five Main Tabs)

**Canonical Design System**: Task 11 ViNha Component System (`assets/75087efd2c3c42baa6ce67405334331b`)  
**Scope**: Five authenticated main application tabs: Home, Money, Plan, Inbox, Together  
**Date**: September 27, 2026

---

## 1. Home Dashboard Data Contract

### Data Sources Reused Unchanged

- `getHomeReadiness()`: Account readiness, `isDayZero`, `currency`, `activeJarCount`, `incomeAllocateMode`.
- `getHouseholdPreferences()`: `householdName`.
- `getOpenInboxAttention()`: `openCount`, `canReviewUncategorized`.
- `getHomePeriodData(period)`: `financialMetrics` (totalIncome, totalExpenses, netSavings, openingBalance), recent transactions list.
- `getHomeSavingsSummary()`: `principal`, `activeCount`, `accruedInterest`.
- `getHomeInvestmentSummary()`: `marketValue`, `valuationIncluded`, `valuationTotal`.
- `getHomeLoanSummary()`: `outstandingPrincipal`, `nextPaymentDate`, `nextPaymentAmount`.
- `getHomeDebtSummary()`: `totalLent`, `totalBorrowed`.

### Derived Values Reused

- `calculateMoneyAssetOverview()`: Reused directly from `modules/ledger/application` to compute consolidated asset position and asset coverage percentage.

### Financial Invariants

- `Transfer ≠ Income` and `Transfer ≠ Expense`: Transfer transactions from `getHomePeriodData` are rendered with neutral tone and `arrow-right-left` icon without negative signs.
- `Opening Balance ≠ Income`: Opening balances are never counted into period cash flow.

---

## 2. Money Overview Hub Data Contract

### Data Sources Reused Unchanged

- `getRealPosition()`: Raw account balances and active account counts.
- `listCreditCards()`: Credit card accounts, balances, credit limits, statement cut dates, payment due dates.
- `getSavingsHomeSummary()`: Savings contracts count and total principal.
- `listInvestmentHomeSummary()`: Investment holdings and market valuation.
- `listLoanSummaries()`: Loan accounts and remaining principal balances.
- `listDebts()`: Peer debt items and directions.

### Derived Values Reused

- `createMoneyHubViewModel()`: Reused from `modules/ledger/application` for account grouping and utilization.
- `buildDebtSummary()`: Reused for peer lending receivables vs payables.
- `calculateMoneyAssetOverview()`: Reused for multi-segment asset allocation.

### Financial Invariants

- Credit cards are liabilities; credit limit is displayed explicitly as `"Hạn mức: ..."` and never treated as an asset.

---

## 3. Plan & Jars Overview Data Contract

### Data Sources Reused Unchanged

- `getPlanPulse()`: Active period month, total budget, allocated amount, health state.
- `getCurrentJarBudgets()`: Jars array with planned amounts, actual expenditures, and remaining capacity.
- `listPlanHubUpcomingEvents()`: Outflow commitments due in the next 7 days.
- `listGoals()`: Goal progress records.

### Derived Values Reused

- `calculateAllocationHealth()`: Income allocation health status.
- `collectPlanHomeExceptions()`: Overspent jar detections and reallocation exceptions.

### Financial Invariants

- `Jar ≠ Account`: Jars represent budget allocations, not physical bank balances.
- Visual progress bars strictly clamp to 100%; over-budget values render explicit badges (`Vượt mục tiêu`).

---

## 4. Inbox Overview Data Contract

### Data Sources Reused Unchanged

- `listOpenInboxPage()`: Open attention items with id, title, subtitle, impact amount, category badge, and urgency level.
- `listArchivedInboxItems()`: Historical resolved/archived items.

### Invariants

- Only real product item kinds are displayed (`unmapped_transaction`, `savings_maturity`, `loan_due`, `debt_overdue`).
- Status is strictly binary in view: `Open` vs `Archived`.

---

## 5. Together Overview Data Contract

### Data Sources Reused Unchanged

- `requireTogetherMembership()`: Authenticated household membership context.
- `listHouseholdMembers()`: Household profile and member list with names, emails, roles, and status.
- `listPendingInvitations()`: Pending invitation tokens.

### Invariants

- Roles are strictly `admin` vs `partner`.
- No personal user preferences (theme/language) are mixed into household settings.
