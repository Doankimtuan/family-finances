# MONEY 16A — Reference Gap Audit

Date: 2026-08-23  
Scope: Money overview, account grouping, credit cards, Savings, Investments, Loans, Debt, navigation/actions, privacy, partial failure, performance, responsive UX, and focused verification.  
Mode: Audit only; no fixes implemented.

## Verdict

**MONEY AUDIT COMPLETE**

P0: **0**  
P1: **3**  
P2: **2**

## Findings

### P1 — Money omits the canonical Investments valuation summary

Money calls `countActiveInvestmentHoldings()` and renders only a holding count (`app/[locale]/(product)/money/page.tsx:114`, `:343-361`). The Investments application already exposes the home-sized `InvestmentHomeSummary` with estimated market value, valuation quality (`current`, `stale`, `manual`, `partial`, `unknown`), freshness, and coverage (`modules/investments/application/queries/investment-queries.ts:139-149`, `:515-665`).

This avoids the worse error of counting unrealized P&L as cash, but it leaves the Money hub non-reference-ready: estimated market value and UNKNOWN/stale/manual valuation state are not visible at the hub. The current implementation also has no hub-level disclosure of excluded valuation coverage.

### P1 — Accounts/Cards failures still become a full-page Money failure

`loadFailed` is true when either `getRealPosition()` or `listCreditCards()` returns null, and the page replaces the whole overview with `money-load-error` (`app/[locale]/(product)/money/page.tsx:98-105`, `:187-202`). Savings, Investments, Loans, and Debt use restrained per-row unavailable states, but the account/card branch does not preserve the rest of Money when one read fails.

The module row model has a typed `value | empty | unavailable` union (`app/[locale]/(product)/money/money-module-section.tsx:20-24`), but the top-level reads remain null checks/booleans rather than one typed read-state composition. This is a core partial-failure UX gap.

### P1 — Money performs a full Savings read instead of using a summary-sized adapter

The Money page calls `listSavings()` and builds the overview locally (`app/[locale]/(product)/money/page.tsx:82-113`). `listSavings()` loads all savings records and all cycle rows, computes presentation details, and has a per-saving cycle-query fallback (`modules/savings/application/queries/list-savings.ts:81-178`). That is larger than the hub contract requires and can become N+1 when the bulk cycle read fails.

Money only needs active principal/count and maturity attention. A summary query already exists (`modules/savings/application/queries/savings-home-summary.ts:7-79`), though its current date/active-count semantics should be validated before substituting it.

### P2 — Money browser harness has a stale ambiguous selector

Focused browser smoke: 2 passed, 1 failed. The authenticated Money test fails at `tests/e2e/money-hub.smoke.spec.ts:41` because `getByTestId("ledger-balance")` now resolves to the hero plus multiple account rows. The scoped selector immediately below it is valid. This is harness debt, not a financial behavior failure.

### P2 — Required responsive matrix is not covered by the focused Money smoke

The focused Money smoke runs at the Playwright default viewport and does not verify 390/440/768/1280, light/dark, VI/EN, reduced motion, privacy ON/OFF, or horizontal overflow. The authenticated page did render far enough to expose the selector issue, but this audit has no browser evidence for the full required matrix.

## Contract audit

### Position semantics

- **Pass:** account balances are derived from opening balances plus cleared ledger transaction deltas (`modules/ledger/application/queries/get-real-position.ts:14-18`, `:64-89`).
- **Pass:** opening balances are part of account position; account creation itself does not write ledger movement per the Accounts contract.
- **Pass:** transfers are applied as account deltas and do not change the aggregate account total when source/destination are both included.
- **Pass:** credit cards are excluded from owned-money position and outstanding is loaded separately (`get-real-position.ts:14-18`, `:34-41`; `money-hub-view-model.ts:262-265`).
- **Pass:** Savings, Investments, Loans, and Debt are presented as separate module facts; their principal is not classified as Income/Expense.
- **Pass:** no sign-based type inference was found in the Money view model; account type comes from the typed account contract and transaction deltas preserve transaction type.
- **Note:** the hero is an owned/liquid-account position, not a combined household net-worth total. This is consistent with the current Real Position contract; no incorrect net-position aggregation was found because Money does not currently claim a net-worth total.

### Assets and obligations

- **Pass:** liquid accounts are filtered through `ACCOUNT_TYPE_LIQUID_VALUES` and grouped as cash, bank/checking, wallet, savings, investment/brokerage, and other (`money-hub-view-model.ts:78-96`, `:220-223`).
- **Pass:** credit-card liabilities remain structurally separate from ordinary account rows (`money-accounts-scan.tsx:198-245`).
- **Pass:** Loans use `remaining_principal` in the hub summary (`list-money-products.ts:304-356`); Debt uses direction-aware `borrowedRemaining`/`lentRemaining` from `buildDebtSummary`.
- **Pass:** Savings principal uses active lifecycle items and excludes settled maturity states (`savings-presentation.ts:232-274`).
- **Gap:** Investments are count-only on Money; see P1 above.
- **Pass:** no credit limit is included in owned money; card outstanding is shown as liability metadata.

### Savings lifecycle

The Money adapter uses `buildSavingsOverviewModel`, which selects the current cycle, separates active/history, and excludes settled states from `totalPrincipal`. Matured/action-required attention remains visible. No rollover double-counting was found in the presentation model. The remaining issue is read size, not lifecycle arithmetic.

### Loans, Debt, and Credit Cards

Loan totals use canonical remaining principal and due-state logic. Debt totals use the domain summary and preserve borrowed versus lent direction. Card outstanding and utilization come from `CreditCardSummary`; no transaction-sign liability inference was found.

### Accounts and specialized/system accounts

Credit-card accounts are excluded from Real Position at query time. `SAVINGS_PRODUCT` is also excluded from liquid account totals and specialized Savings is shown separately. No ordinary-user rendering path for an internal system account was found in the audited Money view model; the account contract does not expose a separate system-account discriminator, so that boundary remains dependent on upstream query filtering.

### Privacy

Focused privacy tests pass. Hero balance, account balances, composition balances, credit outstanding/available/limit, and module amounts are passed through `Balance`, `FinancialValue`, or `MoneyModuleRow` wrappers. Labels and percentages remain visible while financial values mask. No unwrapped Money amount was found in the audited overview path.

### Navigation and actions

- Money links to Transactions, Savings, Investments, Loans, and Debt through `APP_PATH` constants.
- Account rows and credit cards use account detail paths; `/money/accounts` is a compatibility redirect to Money.
- `/money/add` is a compatibility redirect to `/money/transactions/new`; the Money capture action uses the canonical transaction route.
- The capture action is disabled offline; no unsupported module mutation is offered from the hub.
- `/money/cards` is an explicit compatibility redirect to the Loans route, consistent with the current deprecated Cards/EMI alias.

### Partial failure and typed states

Module rows correctly distinguish loaded value, empty, and unavailable. The top-level position/card read does not: one failure hides all other Money content. This is the P1 partial-failure finding above.

### Performance

- **Pass:** Investments uses a count-only query for Money and does not fetch lots, prices, FX, activities, or history (`investment-queries.ts:771-775`).
- **Pass:** Loans use a stored-column summary query and do not load payment/schedule aggregates for the hub (`list-money-products.ts:304-356`).
- **Gap:** Savings uses the full list/cycle read, with a potential per-saving fallback; see P1.
- **Pass:** Debt is a single summary-sized list read for the hub; no per-row debt activity query is called by Money.

## Verification

Focused unit/integration/privacy/i18n checks only (no full unit suite): **126 passed across 16 files**.

Passed files included Money view model, Money privacy, FinancialValue privacy, Accounts, Savings lifecycle/domain/row mapping, Investments portfolio/valuation, Loans/Debt, credit-card billing, Money products, and i18n.

`npm run typecheck`: **passed**  
`npm run build`: **passed**; all Money routes compiled, including compatibility routes.  
Focused browser smoke `tests/e2e/money-hub.smoke.spec.ts`: **2 passed, 1 failed** for the stale ambiguous `ledger-balance` selector described in P2.

No production files were changed by this audit. The worktree contained pre-existing unrelated modifications before the audit began.

## Recommended smallest implementation sequence

1. Replace Money’s investment count adapter with the existing `InvestmentHomeSummary`, preserving estimated/non-cash semantics and rendering valuation quality/coverage without converting UNKNOWN to zero.
2. Split Money’s position/cards reads into typed independent read states so account failure, card failure, and module failures preserve all successful sections.
3. Add/validate a summary-sized Savings hub adapter based on current-cycle lifecycle semantics, then remove the full `listSavings()` dependency from Money.
4. Fix the Money browser selector and add one focused matrix smoke covering 390/440/768/1280, VI/EN, themes, privacy, reduced motion, and overflow.
