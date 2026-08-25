# MONEY 16C — Final Reference Gate

Date: 2026-08-24

## Verdict

**MONEY REFERENCE READY**

Money is reference-ready against the certified Accounts, Credit Cards,
Savings, Investments, Loans, and Debt contracts. No concrete Money blocker
remains.

## Gate evidence

### Position semantics

PASS. Opening balances remain position seeds only. Transfers remain aggregate
position-neutral. Credit-card outstanding remains separate liability data.
Savings, Investment, Loan, and Debt principal remain module position facts and
are not classified as Income or Expense. Account and debt types come from
typed contracts; no sign-based inference is used.

### Accounts and Credit Cards

PASS. Liquid accounts use canonical account-type grouping. Savings products
and credit-card liabilities remain separate from ordinary owned-money rows.
Card outstanding, available credit, and limit use the canonical card summary.
Independent Position and Credit Card read failures render only their own
section unavailable.

### Investments

PASS. Money calls only `listInvestmentHomeSummary()`.

- Estimated market value is presented as a position fact.
- `current`, `stale`, `manual`, `partial`, and `unknown` valuation states are
  explicit.
- UNKNOWN never becomes `0`; partial values are labeled partial estimates.
- Unrealized P&L is not presented as Income or spendable cash.
- The Money path does not load portfolio history, lots, activities, or the
  full portfolio adapter.

### Savings

PASS. Money calls only `getSavingsHomeSummary()`.

- Active/current principal and active count are the only principal totals.
- Nearest maturity and matured/action-required attention remain available.
- Current-cycle selection prevents rollover double counting.
- Settled and early-settled lifecycles are excluded from the active total.
- No full Savings list/history/activity read or per-saving fallback loop is
  used.

### Loans and Debt

PASS. Loans use canonical remaining-principal and due-state summaries. Debt
uses canonical direction-aware borrowed/lent remaining amounts. No
transaction-sign inference is used, and Money does not load loan schedules or
Debt activity history for its summary rows.

### Typed partial states

PASS. Position, Credit Cards, Savings, Investments, Loans, and Debt compose as
independent discriminated `ready | unavailable` reads. A failed source does
not hide successful sections or fabricate a zero. Position failure produces an
unavailable hero; Card failure preserves owned-money position and module
summaries.

### Privacy

PASS. Hero position, account balances, card amounts, Savings, Investments,
Loans, Debt, and secondary module amounts flow through `FinancialValue` or the
privacy-aware `Balance` path. Privacy tests and authenticated browser checks
confirm masked accessible output while valuation/attention context remains
visible.

### Navigation and actions

PASS. Module rows use canonical `APP_PATH` routes. Account/card detail routes,
compatibility redirects, and the single capture route were exercised. The
capture CTA is present once on the active surface; offline capture mutation is
disabled by the existing transaction form state.

### UX

PASS. The existing shallow Money hub hierarchy remains intact. Browser checks
covered partial valuation, attention context, privacy, reduced motion, raw-key
absence, and no horizontal overflow; focused unit coverage covers
unavailable/empty states. No dashboard duplication or card-per-metric
expansion was introduced.

## Browser certification

Authenticated `.env.local` certification passed with one worker:

- 390px VI/light
- 440px EN/dark
- 768px regression
- 1280px regression
- healthy and partial investment valuation context, with UNKNOWN behavior
  covered by focused view-model/privacy tests
- Savings maturity attention
- privacy ON/OFF
- reduced motion
- no horizontal overflow
- Money module and product navigation
- canonical capture CTA and `/money/add` compatibility redirect

The stale capture smoke selectors were scoped to `#app-viewport-root` and the
removed direction assertion was not part of the current capture contract. No
production markup was changed for the harness.

Final focused Money browser set: **13 passed**.
Focused semantic/read-state/privacy/i18n set: **23 files, 207 tests passed**.

## Final-gate validation

- Full unit suite: **155 files, 1,099 tests passed**.
- Repository lint: **passed**.
- Typecheck: **passed**.
- Build: **passed**.
- Repository-wide format cleanup: **not run**, as required.

## Final decision

**MONEY REFERENCE READY**
