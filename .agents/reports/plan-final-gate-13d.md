# PLAN 13D — Final Reference Gate

Date: 2026-08-23  
Scope: complete Plan module certification.  
Implementation changes: none.

## Final verdict

`PLAN REFERENCE READY`

No concrete Plan blocker remains. PLAN 13A's privacy/valuation and action/browser
findings are closed by PLAN 13B and PLAN 13C and were rechecked in this gate.

## 1. Jars

PASS.

- Fixed and qualifying-income percentage plans use the canonical Jar rule
  calculation and basis-point contract.
- Active, paused, and archived Jars remain distinct; only active Jars receive
  current allocations.
- Category linkage, period-local spending, positive-only rollover, adjustments,
  overspend, and the 80% near-limit boundary retain focused coverage.
- Current reads create only missing current-period rule snapshots. Historical
  reads consume stored snapshots and do not rewrite earlier rule state.
- Reallocation writes signed Plan adjustments and a Plan movement only. The
  command rejects any RPC response reporting a ledger transaction or non-zero
  ledger impact.

## 2. Qualifying income

PASS.

The deterministic priority remains:

1. configured household qualifying income;
2. projected active recurring household income;
3. posted qualifying household Income fallback.

Posted fallback is period-bounded, household-account scoped, and classified by
the shared financial-semantics contract. Transfers, Savings/Investment
principal, Loan/Debt principal, reversals, non-posted rows, and non-Income event
types are excluded. Each fallback is selected once; sources are not summed or
double-counted.

## 3. Goals and linked sources

PASS.

- Supported sources are Savings, the explicitly approved `savings_account`,
  Investment holdings, Loans, and Debt. Generic Accounts remain unsupported.
- Mixed compatible sources derive one Goal summary without adding legacy
  progress to linked progress.
- Link, soft unlink, and reassignment use the authoritative typed source link
  and preserve source financial state.
- Ready to Active regression, Pause/Resume, Complete, and Cancel retain focused
  domain and browser coverage.
- Source compatibility, currency, lifecycle availability, whole-source
  exclusivity, household scope, and personal ownership are validated before
  mutation and again at the protected database boundary.

## 4. Investment valuation integration

PASS.

- `AUTO_CURRENT` contributes the current value.
- `AUTO_STALE` remains usable and surfaces stale context.
- `MANUAL` remains a known usable valuation.
- `UNKNOWN` stays explicit and never becomes a fabricated zero.
- Known plus `UNKNOWN` retains the known contribution but keeps aggregate
  progress indeterminate.
- Exited, closed, missing, and unavailable holdings are not active funding.

Authenticated deterministic fixtures reconfirmed current, stale, UNKNOWN, and
mixed states in both required critical viewports.

## 5. Savings integration

PASS.

Active Savings uses the current lifecycle cycle. Rollover selects the current
cycle rather than adding old and new cycles. Settled and early-settled Savings
resolve unavailable and stop contributing as active funding.

## 6. Loans and Debt integration

PASS.

Payoff progress is derived from the frozen original/initial-principal contract
minus canonical remaining principal. Plan does not infer progress from
transaction sign or generic account balance.

## 7. Monthly Review

PASS.

The exposed `/plan/ritual` route renders Monthly Review only. It is optional,
report-only, and non-blocking. Marking viewed/reviewed records metadata and a
snapshot; it does not lock Plan or Money. Historical rule/review snapshots stay
separate from live calculations. No Quick Close control or Ritual approval flow
is exposed.

## 8. Recommendations

PASS.

Recommendation IDs are deterministic, results are sorted deterministically,
and conflicting duplicates are suppressed. Actions navigate to review/action
surfaces and never perform automatic financial mutation. Currency and locale
are passed to privacy-aware rich amount leaves. Missing, stale, unavailable,
overspent, and historical conditions resolve or disappear when their source
condition no longer applies.

## 9. Ownership and security

PASS for Plan.

- Every Plan read/action begins at the active household membership gate and
  applies household predicates.
- Personal account activity is excluded from Jar and Monthly Review inputs.
- Goal-source mutations validate both Goal and linked-source authority;
  cross-household, cross-owner, cross-scope, inactive/former-owner, and
  incompatible-source writes fail closed.
- RLS, trigger guards, RPC ACL tests, and the recorded live 14D.4 A/B Goal/Plan
  matrix confirm that User B cannot mutate User A's personal linked Money
  source through Plan.
- Plan does not grant or elevate Money authority.

The isolated ownership harness currently reports its controlled household as
absent after cleanup, which is its documented terminal state. This does not
replace or invalidate the completed live 14D.4 Plan/Goal matrix.

## 10. Privacy

PASS.

Plan Home, Jar and Goal cards/details, linked-source values, recommendations,
Monthly Review metrics/changes/issues, exceptions, receipts, and action previews
render financial amounts through `FinancialValue`, `Amount`, or privacy-aware
rich leaves. Privacy ON masks amounts while leaving names, statuses, dates, and
valuation explanations legible; privacy OFF restores localized values.

## 11. Action UX

PASS.

Jar create/edit/reallocation, Goal create/edit, source link/unlink/reassign,
lifecycle actions, and Monthly Review actions use `Sheet`,
`ActionSheetLayout`, and the shared sticky `SheetActionFooter` or canonical
bottom action hierarchy. Shared controlled fields and `ChoiceTile` are used;
no Plan-local bottom-padding workaround was found. Action bodies own scrolling,
focus enters the dialog, Escape dismisses ephemeral state, and recoverable
errors keep the form mounted for retry.

Direct authenticated inspection reconfirmed Link, Unlink, and Reassign source
sheets, including the no-money-movement explanation and shared footer.

## 12. Browser certification

Authenticated `.env.local` result:

| Matrix         | Result | Evidence                                                                                                                                                                        |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 390px VI/light | PASS   | Plan Home, Jars, Goals, create actions, current/stale/UNKNOWN/mixed valuation, privacy ON, Monthly Review, reduced motion, focus, Escape dismissal, no overflow, no Quick Close |
| 440px EN/dark  | PASS   | Plan Home, Jar edit/reallocation surface, Goal edit and source actions, current/stale/UNKNOWN/mixed valuation, privacy OFF, recommendations, no raw keys, no overflow           |
| 768px          | PASS   | centered 440px shell and action footer geometry                                                                                                                                 |
| 1280px         | PASS   | centered 440px shell and action footer geometry                                                                                                                                 |

Automated Plan run: 16 passed and 1 F3 harness failure. The F3 failure is a
stale locator, not a product failure: `jar-reallocate-amount` is now the input
itself, while the spec searches for a descendant `input`. The failure snapshot
shows the visible, labeled reallocation textbox and enabled action sheet. G1's
current unlocked allocation/contribution Money-position invariant passed, and
the reallocation zero-ledger invariant remains covered by command/RPC tests and
the recorded authenticated Plan/Goals integration verification. This test-debt
item does not block the Plan product verdict.

## 13. Regression

| Check                                          | Result                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Focused Plan/integration/security/privacy/i18n | PASS — 33 files, 325 tests                                                                |
| Authenticated Plan browser matrix              | PASS product evidence — 16 passed; 1 stale-locator harness failure documented above       |
| G1                                             | PASS                                                                                      |
| F3                                             | Harness locator stale; product field present and zero-ledger contract independently green |
| Changed-file ESLint                            | PASS                                                                                      |
| Typecheck                                      | PASS                                                                                      |
| Production build                               | PASS                                                                                      |
| Full Vitest visibility                         | 150 files / 1,075 tests passed; 4 unrelated Home source-contract assertions failed        |
| Full ESLint visibility                         | only 3 unrelated `scripts/home-compact-cta-check.cjs` diagnostics                         |

The full-suite failures are Home baseline/source-contract drift and do not
exercise Plan. They do not block this gate.

## 14. Legacy compatibility debt

Legacy `month-ritual`, Quick Close, autolock, constants, exports, tests, and
message keys remain in the application compatibility surface. No current
product route imports or exposes those workflows; the technical ritual route
imports `getMonthlyReview` and renders `MonthlyReviewReport` only.

Deferred compatibility cleanup: remove/isolate the unused Ritual/Quick Close
application and message surface only after its remaining non-route callers and
compatibility exports are formally retired. No broad deletion was performed in
this gate.

## Certification

`PLAN REFERENCE READY`
