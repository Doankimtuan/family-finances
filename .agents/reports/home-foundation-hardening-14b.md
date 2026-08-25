# HOME 14B — Header + Period Focus + Partial-State Foundation

Date: 2026-08-23

## Verdict

`HOME FOUNDATION READY`

Scoped Home blockers: none.

P0: 0  
P1: 0  
P2: 0 in the 14B scope

The previously identified Home baseline issues were implementation/test-harness debt and are resolved below. The finalized Savings, Investments, Loans, and Debt summary surfaces remain intentionally out of scope.

## Implemented foundation

- Replaced the local Home header and loading header with the shared contextual `TopAppBar` composition.
- Preserved greeting, household context, privacy behavior, the current Home IA, and the centered mobile shell.
- Added a typed `HomeDashboardReadResult` discriminated union with distinct full-read failure sources and a transaction-only `PARTIAL` state.
- Transaction-read failure now keeps position, Inbox, and Plan surfaces usable while showing the existing restrained partial-data status lane and retry action. No metrics are fabricated.
- Preserved canonical financial calculation and privacy boundaries; no classifier, cash-flow, transfer, card-payment, or principal semantics changed.
- Period navigation now carries a route-bound focus intent. Keyboard activation restores focus to the selected Month/Quarter control after the route transition; pointer activation does not set a focus intent. No timeout or duplicate motion was added.
- Replaced brittle Home source-string assertions with component-contract behavior tests. The header contract assertion now targets the shared `TopAppBar` contract.
- Repaired `scripts/home-compact-cta-check.cjs` as an ESM-compatible Playwright harness with no direct console lint violations and fixed its page-evaluation boundary.
- Repaired the existing visual Home harness login wait to use the current route transition rather than a stale response assumption.

## Audit results

### Semantics and boundaries

Home continues to consume the canonical `calculateHomeFinancialMetrics` result. No sign-based inference was introduced. Existing semantic regression coverage remains green for true Income/Expense, transfer/card-payment neutrality, savings/investment/loan/debt principal exclusion, investment income, savings interest, tax, and fee classification.

Investment market value and P&L presentation, Savings lifecycle presentation, and Plan recommendation calculation were not changed by 14B. Home still does not add their summaries.

### Error architecture

The read model distinguishes:

- full dashboard failure with `access`, `position`, `plan`, or `inbox` source;
- transaction-only partial failure with `financialMetrics: null`;
- ready dashboard state;
- existing offline status lane.

The Home page only renders the full dashboard error lane for the full-read state. Transaction failure renders a partial lane and an unavailable cash-flow state without replacing the rest of Home with a full-page error.

### Privacy, IA, and motion

Financial values remain behind the existing privacy-aware shared boundaries. Reduced motion continues to use the shared motion policy and existing motion tokens. No layout-property animation, interaction-blocking motion, duplicated entrance animation, or CTA nesting was introduced.

## Baseline failure classification

The recurring failures from 14A were classified as follows:

- `tests/unit/home-screen-v2-polish.test.ts`: stale source-contract assertions for removed Home markup and chart source syntax. Replaced with behavior/component-contract assertions; old classes and source syntax were not restored.
- Home header/shell source assertion: stale local-header expectation. Updated to assert the shared contextual `TopAppBar` contract.
- Home period-transition E2E focus failure: real Home defect. Fixed with the route-bound focus intent and native selected-control autofocus.
- `scripts/home-compact-cta-check.cjs`: stale harness. Repaired its module boundary, evaluation argument passing, and lint-safe output while preserving one-CTA/overlap/responsive checks.
- `scripts/verify-home-dashboard.mjs`: stale login-response wait. Updated to wait for the current authenticated route transition.
- Repository-wide formatting noise remains unrelated technical debt and was not changed.

## Browser evidence

Authenticated checks passed at:

- 390px, VI, light;
- 440px, EN, dark;
- 768px, EN, light;
- 1280px, VI, dark.

Each case verified the contextual TopAppBar, one capture CTA, no horizontal overflow, and no raw i18n keys. Additional Chromium checks passed for Month → Quarter and Quarter → Month keyboard focus restoration, privacy toggle OFF → ON → OFF under reduced motion, and the compact CTA harness.

## Regression evidence

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run test` — 152 files, 1,079 tests passed
- `npm run build` — passed
- `npx playwright test tests/e2e/home-dashboard.smoke.spec.ts` — 6 passed
- `node scripts/home-compact-cta-check.cjs` — passed; one CTA, no overlap, no console errors
- `HOME_VERIFY_BASE_URL=http://localhost:3000 node scripts/verify-home-dashboard.mjs` — passed for all four visual cases
- Focused Home/privacy/motion/semantic unit contracts — 44 passed

## Smallest next implementation sequence

1. Keep this foundation stable while separately specifying finalized Home summary contracts for Savings, Investments/Market Data, Loans, and Debt.
2. Add each product summary only after its canonical valuation/lifecycle/principal contract has an explicit Home read-model adapter.
3. Add product-specific partial lanes to the existing typed read-state union only when a product summary is introduced.
