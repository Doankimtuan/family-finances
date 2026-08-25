# HOME 14C.1 — Summary Query Contracts + Deterministic Fixture Certification

Date: 2026-08-23

## Verdict

`HOME PRODUCT SUMMARY READY`

## Implemented

- Added `listInvestmentHomeSummary`, a module-level summary API that reads
  only active holding fields, valuation inputs, market/FX inputs, and minimal
  operation aggregate inputs. It does not read lots or call the full activity
  list.
- Added `getSavingsHomeSummary`, restricted to Savings roots plus active or
  matured cycle candidates. Rolled, early-settled, and closed cycles are not
  included in active value.
- Home adapters now consume these APIs; Loans and Debt continue using their
  existing lightweight summary APIs.
- Added query-shape tests covering bounded query count and the absence of lots,
  full activity reads, and full Savings list enrichment.
- Added the database-side `get_investment_home_summary_inputs` projection so
  latest valuation selection and operation aggregation do not load valuation
  history or activity rows into Home.
- Added rerunnable `scripts/home-14c1-fixture.mjs` with stable `HOME 14C1`
  prefixes, healthy/stale/UNKNOWN holdings, upcoming/matured Savings,
  overdue Loan coverage through the existing Loan fixture, and Debt attention.
- Added focused authenticated browser certification with a typed deterministic
  unavailable-Investment path.

## Validation

- Focused Home/product/query-shape/semantic/privacy/i18n tests: **76 passed**.
- Changed-file ESLint: **passed**.
- Typecheck: **passed**.
- Build: **passed**.
- Authenticated Home 14C.1 E2E: **6 passed** at 390 VI/light, 440 EN/dark,
  768, and 1280; it covered stale/partial/UNKNOWN valuation, Savings
  attention, Loan/Debt attention, unavailable Investment read, privacy, CTA,
  overflow, and Home usability.
- The configured database has the summary projection migration applied and
  the fixture setup/cleanup cycle passed.

## Financial regression

The focused Home financial metrics and financial-semantics suites passed
unchanged. Summary APIs are read-only product facts and do not enter the Home
Income, Expense, net cash-flow, or current-balance calculations.
