# Savings Implementation Report

## Scope completed

The ViNha / Family Finance Savings feature was audited and updated without creating a parallel domain model. Existing immutable Savings cycles, configurable providers and packages, Inbox maturity decisions, settlement and early-withdrawal application services, route ownership, shared form primitives, and canonical motion architecture were preserved.

The highest-risk product boundaries supported by the audited repository are now covered: placement and settlement use neutral ledger transfer semantics, principal is not classified as ordinary Expense or Income, placement submission has a stable idempotency key, provider type maps to a typed bank/platform family, and overview/detail flows expose the financial context users need.

## Implementation changes

| Area | Result |
| --- | --- |
| Placement amount | The creation wizard uses the shared AmountField, stores number or null, validates the canonical numeric value, and submits it without ad-hoc string parsing. |
| Provider and package selection | Creation, renewal, and Inbox maturity selectors use shared accessible HeroUI-backed LabeledSelect controls instead of native primary selects. |
| Provider family | Added typed SavingsFamily.BANK and SavingsFamily.PLATFORM mapping from existing provider types without changing persisted legacy values. |
| Overview | Added principal held, expected interest, maturity-review count, and bank versus app/platform segmentation. Rows use scoped hover and press transitions with reduced-motion fallback. |
| Detail | Added provider family, funding source account, settlement destination account, expected value, and an explicit estimate disclaimer. |
| Placement ledger | Added migration 20260815100000_savings_neutral_transfer.sql. The new 12-argument RPC records transfer_out and transfer_in legs into the internal Savings product account, validates account/provider state, and supports replay using an idempotency key. |
| Maturity settlement | Added migration 20260815110000_savings_neutral_settlement.sql. Principal plus interest leaves the Savings product account through a neutral transfer; only realized interest is represented as income. Completed settlements replay their original receipt instead of creating another movement. |
| Early settlement | Added migration 20260815120000_savings_neutral_early_withdraw.sql. Principal and eligible proceeds return through neutral transfer legs while the existing penalty and early-withdrawal audit record remain intact. Replayed early closures return the stored receipt. |
| Tests | Added typed bank/platform family mapping coverage. Existing Savings tests continue to cover interest, penalty, Inbox typing, and renewal behavior. |

## Financial boundaries preserved

The canonical blueprint requires ledger accounts and transactions to remain the only owners of real money movement, immutable Savings cycle history to remain the domain entry point, and Inbox resolution not to diverge from the owner-domain mutation. The new migrations follow those rules and are additive; previously applied migrations were not edited.

Provider/manual actual settlement remains the source of truth. Expected interest and expected value are explicitly shown as estimates and are never posted as actual settlement income by the UI. Tax behavior remains configuration-dependent because the existing schema has no verified platform-tax field or seeded platform provider; a speculative 5 percent rule was not introduced into an already deployed financial path.

## Validation

| Check | Result |
| --- | --- |
| TypeScript | Passed after the final typed-family, detail, selector, and idempotency changes. |
| Full ESLint | Passed after the final Savings and Inbox selector edits. |
| Full Vitest suite | Passed: 66 test files and 372 tests after the final edits. |
| Focused Savings tests | Passed after family coverage was added: 2 files and 22 tests. |
| Production build | Passed after the final edits: Next.js compiled, typechecked, and generated 92 pages. |
| Playwright Savings smoke suite | Ran on an alternate port; both tests skipped because authenticated E2E credentials were not available. The default port was occupied by an existing MCP listener and timed out. |
| Browser visual evidence | Not completed at 390, 440, 768, and 1280px because authenticated browser credentials and a usable desktop browser test session were unavailable. |

## Files changed

The principal application changes are in the Savings wizard, overview, detail, renewal editor, Inbox maturity panel, Savings command/types/constants, localization files, tests, and three additive Supabase migrations. Audit and report artifacts are stored under artifacts/savings-audit.md and artifacts/savings-implementation-report.md.

## Remaining production gate

Before applying the migrations to a live Supabase project, run them in a staging database and verify exact transaction constraints, RPC overload resolution, RLS behavior, replay receipts, account balances, and Inbox resolution consistency. Then run authenticated Playwright scenarios at 390, 440, 768, and 1280px in light, dark, and reduced-motion modes. This gate is deliberately not bypassed because it touches real principal movement.
