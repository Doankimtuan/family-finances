# HOME 14A — Reference Gap Audit + Baseline Drift Cleanup Plan

Date: 2026-08-23  
Scope: current Home implementation; audit only, no product fixes applied.

## Verdict

**HOME AUDIT COMPLETE**

Counts: **P0 = 0 · P1 = 4 · P2 = 3**

Home’s financial totals are semantically safe today. The remaining gaps are stale Home composition/state contracts and one keyboard-focus regression, not a sign-based accounting defect.

## Findings

### P1 — core Home product/UX findings

| ID      | Finding                                                                                                                   | Evidence / impact                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HOME-01 | Home still carries the pre-finalization exclusion assumption for Investments, Savings, Loans, and liabilities.            | `app/[locale]/(product)/home/page.tsx:51-54` explicitly says these summaries are excluded. Home currently reads ledger position, transactions, Plan pulse, and Inbox only. This avoids misleading totals, but it leaves finalized product facts absent from the orientation surface: no distinct investment estimated value/unrealized P&L/realized P&L/income, no savings maturity/settlement attention, and no loan/debt attention. |
| HOME-02 | Home bypasses the canonical top-level `TopAppBar` contextual header.                                                      | Home renders a local `<header>` with greeting + mark at `app/[locale]/(product)/home/page.tsx:78-87`. The current shell contract requires `TopAppBar` for top-level contextual Home headers. This is a real IA/header defect, not a stale test expectation.                                                                                                                                                                           |
| HOME-03 | Month/Quarter navigation loses keyboard focus after route transition.                                                     | Authenticated browser smoke failed at `tests/e2e/home-dashboard.smoke.spec.ts:77`; the selected Quarter button was active but not focused. The attempted restoration in `home-period-transition.tsx:52-68` is lost when the route-backed tree remounts. This is an accessibility/core interaction defect.                                                                                                                             |
| HOME-04 | A failed transaction read degrades to an unavailable metric without an explicit partial/stale qualifier or recovery lane. | `getHomeDashboard` returns `financialMetrics: null` when the transaction query fails, while the page only renders the generic unavailable pulse. Position/Plan/Inbox failures use the error lane, but transaction-only failure is silent partial data. Amounts are not fabricated, but completeness is not clearly communicated.                                                                                                      |

### P2 — polish, test, and harness debt

| ID      | Finding                                                                                                                                                                                                                                                                                                         | Classification                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| HOME-05 | `tests/unit/home-screen-v2-polish.test.ts` has 3 failures because it asserts old source spellings: `mt-(--space-1) text-right`, `bg-surface-elevated` in `page.tsx`, `strokeDasharray="2 4"`, and `dot={{`. Runtime/component behavior and the current implementation use different valid structures/constants. | Stale source-contract test. Do not restore old markup solely for these assertions.           |
| HOME-06 | `scripts/home-compact-cta-check.cjs` fails before completing because `page.evaluate()` references outer `consoleMessages` without passing it into the browser context (`ReferenceError` at line 35). It also fails repository lint because it uses CommonJS `require()` and `console.log`.                      | Stale script/harness. The dedicated authenticated viewport smoke passed at 390/440/768/1280. |
| HOME-07 | `npm run format:check` reports 2,194 pre-existing files; `npm run lint` has 3 errors, all in `scripts/home-compact-cta-check.cjs`. Full-test output also contains unrelated existing React Aria warnings and expected error logging.                                                                            | Unrelated technical debt / baseline visibility.                                              |

## Financial semantics audit

Home uses `calculateHomeFinancialMetrics`, which delegates income/expense inclusion to the canonical ledger financial classifier. It does not infer meaning from transaction sign.

| Contract                        | Result                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| True Income / true Expense      | Pass. `INCOME` counts only as income; `EXPENSE` counts only as expense.                                                     |
| Transfers / principal movements | Pass. Transfer legs are neutral to Home income/expense. Savings principal is classified as a savings transfer and excluded. |
| Investment buy/sell principal   | Pass. Buy is non-expense outflow; sale proceeds are non-income inflow.                                                      |
| Debt/loan principal             | Pass. Debt borrowing/lending, receivable payments, and liability payments are neutral. Loan interest is expense.            |
| Card payment                    | Pass. `LIABILITY_PAYMENT` is neutral; ordinary card spending remains expense when it is a real expense event.               |
| Investment income               | Pass. `INVESTMENT_INCOME` counts as income; investment fees count as expense.                                               |
| Savings interest / tax / fee    | Pass. Savings interest counts as income; savings tax and fee count as expense; principal remains neutral.                   |
| Reversals/refunds               | Pass. Reversal legs and reversed originals do not enter Home totals.                                                        |

Evidence: `tests/unit/home-dashboard-metrics.test.ts`, `tests/unit/financial-semantics.test.ts`, and `tests/unit/financial-classification-consistency.test.ts` passed, including cross-screen comparisons.

## Reference-ready module integration audit

- Transactions: integrated through the canonical classifier and date-range query. No sign-based aggregation found.
- Debt / Loans: principal is safely excluded and loan interest is classified as expense. Home does not show finalized debt/loan status or due attention.
- Savings: lifecycle events are semantically safe in ledger totals. Maturity, settlement, early settlement, rollover, and event-level interest/tax/fee details are not surfaced by Home; therefore no Home double-counting was found, but the Home integration is incomplete.
- Investments / Market Data: ledger income/fee semantics are safe. The investment view model keeps estimated market value, unrealized result, realized sale result, income, and fees separate and excludes incomplete valuation rows from totals. Home does not consume that model, so stale/UNKNOWN valuation cannot contaminate Home totals; it also means Home cannot present those distinctions.
- Plan: Home consumes only active jar count and income-allocation mode from `getPlanPulse`. It does not render Plan recommendation amounts or perform Plan mutations. No Money value duplication or fabricated cash movement found.

## Investment and savings presentation

The finalized Investments model keeps estimated market value, unrealized P&L, realized P&L, investment income, and fees distinct. Unknown/stale valuation coverage is represented separately and incomplete rows are excluded from aggregate valuation. Home has no investment valuation surface, so there is no market-price-as-income path in Home, but HOME-01 is the resulting reference gap.

Savings lifecycle presentation remains owned by Savings. Home consumes only the classifier output for interest/tax/fee versus principal. Maturity, settlement, early settlement, rollover, and tax/fee event presentation is absent from Home rather than duplicated.

## Privacy and accessibility

Pass for current Home amounts. Balance uses the shared `Balance` → `FinancialValue` boundary; net cash flow uses `FinancialDeltaValue` → `FinancialValue`; cash-flow summary, chart tooltip, chart data table, and spending amounts use `FinancialValue` directly. Privacy ON replaces visible and accessibility text content with the canonical mask; the toggle exposes localized `aria-label` and `aria-pressed`. Privacy tests passed in ON/OFF coverage.

The Home privacy boundary is correct, but the browser matrix did not separately capture every locale/theme/privacy/reduced-motion permutation; the authenticated viewport smoke covered the required widths in EN.

## Header, IA, CTA, and motion

- Hierarchy is currently: greeting header → offline lane → balance/net pulse → cash-flow/spending → Inbox → Plan → floating capture. This matches the intended shallow Home order, but the local header violates the shared header contract (HOME-02).
- There is one capture CTA. Authenticated browser smoke passed at 390, 440, 768, and 1280px; no duplicate CTA or overlapping navigation was observed.
- Plan is a read-only pulse and route; it does not duplicate Money amounts or fabricate movement.
- Motion uses `motion/react`, shared tokens, and `useMotionPolicy`. Reduced-motion variants remove translation; chart animation is disabled; no layout properties are animated. Targeted motion tests passed.
- Home has nested page/section reveals plus period-transition and privacy transitions. No interaction blocking or layout-jank failure was observed, but the nested reveal structure is unnecessary motion surface and should be simplified only if a browser review confirms duplicate entrance playback.

## UX states and browser evidence

| State / dimension     | Result                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading               | Skeleton exists and targeted Home tests pass.                                                                                                 |
| Empty / day zero      | Day-zero setup CTA flow passes unit coverage.                                                                                                 |
| Full error            | Home error lane exists when core dashboard reads fail.                                                                                        |
| Partial error         | Gap recorded as HOME-04.                                                                                                                      |
| Offline / read-only   | Offline banner is shared and mutations are disabled; Home is review-only in practice, but there is no explicit Home read-only qualifier.      |
| Privacy hidden        | Shared mask boundary and accessible output pass.                                                                                              |
| Viewports             | Authenticated capture smoke passed at 390/440/768/1280px.                                                                                     |
| EN / VI, light / dark | Unit/i18n contracts pass. Full authenticated browser evidence across all locale/theme combinations was not available from the executed smoke. |

## Regression command results

- Targeted Home/semantics/privacy/motion suites: **84 passed, 3 stale source-contract failures**.
- Cross-module reference suites: **26 files, 204 tests passed**.
- Full unit suite: **150 files, 1,075 passed, 4 failed** — the 4 are the 3 `home-screen-v2-polish` source assertions plus the real `header-sheet-polish` Home header assertion.
- Home browser smoke: **5/6 passed**; all four viewport CTA tests and unauthenticated redirect passed; period-control focus assertion failed (HOME-03).
- `npm run typecheck`: **pass**.
- `npm run build`: **pass**.
- `npm run lint`: **fail**, only the three CTA harness errors in HOME-06.
- `npm run format:check`: **fail**, 2,194 baseline files reported.
- `node scripts/home-compact-cta-check.cjs`: **fail**, harness `ReferenceError` before assertion completion.

## Smallest implementation sequence

1. Fix HOME-03 focus restoration at the route boundary and add one browser regression assertion.
2. Replace the local Home header/loading header with the canonical shared `TopAppBar` contextual composition; retain the existing IA and greeting data.
3. Add an explicit typed partial/stale Home state for transaction-read failure.
4. Add a Home-approved, read-only aggregation boundary for finalized Savings/Investments/Debt/Loans attention/value summaries. Keep investment value, unrealized P&L, realized P&L, income, and freshness separate; do not fold them into Income or spendable balance.
5. Repair or delete the obsolete source-string polish tests and replace the CTA script with a working ESM/native Playwright harness. Do not reintroduce legacy markup.
6. Re-run the full 390/440/768/1280 × EN/VI × light/dark × privacy/reduced-motion browser matrix, then rerun lint, format check, typecheck, build, and full tests.

No implementation changes were made by this audit.
