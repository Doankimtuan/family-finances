# Investments 12C — List + Create UX

Date: 2026-08-21
Scope: investment overview/list and opening/create flows only.

## Implemented

- Portfolio hierarchy now separates current estimated market value, remaining basis, estimated P&L, realized P&L, and received income.
- Financial amounts on the overview use `FinancialValue`; the shared privacy provider remains the source of truth.
- Valuation rows carry real valuation date/source into the holding view and are labeled as estimated market value, not cash. Unknown date/source is shown only when the underlying value is absent.
- Closed holdings link to their detail/history route.
- Bonds are included in the overview filters and use the Bonds label in both locales.
- Allocation chart colors use semantic chart tokens and the chart is shorter at mobile widths.
- Investment-specific loading skeleton and recoverable read error with Retry were added. A failed activity/read query continues to render the read error rather than an empty state.
- Money offline banner is present on list/create; opening mutations are disabled offline.
- Opening flow uses the shared SelectField for unit/source-account choices and retains shared controlled DateField/field validation. Reopening/success resets form state.
- Historical/opening mode has no source account or cash movement. Live purchase mode requires the source account. Unit-based assets use quantity × unit price; Funds/CCQ retain NAV-per-CCQ semantics. Bonds use the explicit total-value exception through `20260821160000_investments_list_create_12c_bond_purchase.sql`.
- Generic crypto copy no longer mentions BTC.

## Verification

Passed:

- Focused investment tests: 4 files, 25 tests.
- Full unit suite: 138 files, 1,016 tests.
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Message JSON parse and `git diff --check`.

## 12C.1 remote/browser verification

Passed:

- Auth setup using the existing `.env.local` credentials: 1 passed. The established `tests/e2e/auth.setup.ts` session infrastructure successfully reached the authenticated app.
- Remote migration verification: `20260821160000` is present in remote migration history; the 14-argument Bond-capable `record_investment_initial_purchase` RPC exists alongside the compatibility signature.
- Dedicated browser probe `tests/e2e/investments-12c1.smoke.spec.ts`: 2 passed.
  - 390px, VI, light, reduced motion: active list, privacy ON/OFF, Fund/CCQ NAV label, historical mode without source account, live mode with source account, and no page errors.
  - 440px, EN, dark, reduced motion: unit asset quantity/unit-price label, Bond total-value label, historical/live account behavior, no BTC-specific copy, and no page errors.

Remote authenticated data check: 4 active holdings and 0 closed holdings for `E2E_USER_EMAIL`. The closed-detail link implementation exists, but no closed holding was available to click, so that requested browser assertion remains unverified.

The existing mutation-heavy `tests/e2e/investments.smoke.spec.ts` remains red because its older 12B assertions/selectors still expect pre-12C copy and controls (`Số lượng chính xác`, the old total-value buy field, and the old “Tất cả” control). It was attempted after auth and was not treated as evidence for 12C readiness.

## 12C.2 closed-fixture and smoke refresh

Passed:

- Reused the authenticated `.env.local` E2E login/session path; login was attempted and succeeded.
- The refreshed `tests/e2e/investments.smoke.spec.ts` now uses current per-unit fields, HeroUI holding selectors, current sell-all accessibility text, current position IDs, current action labels, and receipt URL assertions. Deprecated total-value unit-asset assertions were removed.
- The existing authenticated household was seeded through the normal UI buy/sell flow with disposable holdings. The full sell path preserved opening, buy, and sell operations; the canonical domain close state is `exited`.
- Remote check after seeding: 27 active and 2 exited holdings for `E2E_USER_EMAIL`; no unrelated rows were deleted.
- `tests/e2e/investments.smoke.spec.ts`: 2 passed, including 390px VI/light opening + buy/sell-all and 440px EN/dark conversion + valuation + income.
- `tests/e2e/investments-12c1.smoke.spec.ts`: 2 passed. Closed rows appeared in both locales, were actionable, opened the correct detail/history view, and privacy ON/OFF was verified. No browser console/page errors were reported.
- Focused investment/12B-integrity/ownership/Home-Transactions/privacy/i18n tests: 23 files, 253 tests passed.
- Full unit suite: 138 files, 1,016 tests passed.
- `npm run lint`, `npm run typecheck`, and `npm run build` passed.

## Verdict

INVESTMENTS LIST/CREATE READY
