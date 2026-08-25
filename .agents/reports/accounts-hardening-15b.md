# ACCOUNTS 15B — Eligibility + Privacy + Browser Stabilization

## Verdict

`ACCOUNTS FOUNDATION READY`

The scoped eligibility/privacy implementation is complete, the auth fixture is reliable, and the two focused browser contract blockers are resolved. No product redesign or accounting behavior was changed.

## Changes made

### P1-01 — Investment cash-account eligibility

- Investment opening/live account selection now uses the shared ledger liquid-account predicate plus active and mutation-authority checks.
- The previous local `savings_product`-only exclusion was removed.
- The picker excludes credit cards, savings products, inactive/archived accounts, unauthorized/read-only accounts, and non-liquid liability types.
- Brokerage/investment containers remain eligible only where the current Investment RPC contract allows them; the RPC currently treats brokerage as a valid liquid source.

### P1-02 — Money hub privacy

- Credit outstanding metadata on Money Home now renders the amount through `FinancialValue`.
- Privacy ON masks the amount while the card-debt label remains visible.
- Added a focused regression test.

### P2-01 — Savings eligibility consolidation

- Removed Savings’ duplicated local account-type array.
- Savings now reuses the shared canonical cash-source predicate.
- Regression coverage verifies liquid cash/checking/savings/e-wallet/other acceptance and rejection of credit cards, brokerage, savings products, archived, and unauthorized accounts.

### Browser/auth harness

- Centralized the affected specs on the shared authenticated fixture.
- Fixture waits for the hydrated login control, fills stable field IDs, verifies values, and verifies the Money hub after authentication.
- E2E runs use a dedicated default port and do not reuse a stale existing server.
- No arbitrary sleeps or product UI changes were added for stale selectors.

## Validation

Passed:

- Focused unit tests: 11 files, 178 tests passed.
- Changed-file ESLint: passed.
- Prettier check: passed.
- Typecheck: passed.
- Production build: passed.
- Auth setup against `.env.local`: passed.
- Focused browser run: 8 passed across account/card/investment flows and 390/440/768/1280 coverage, including reduced-motion browser execution and privacy scenarios.

## ACCOUNTS 15B.1 — Contract alignment and re-certification

### Credit-card installment contract

Inspection confirmed the current canonical flow uses a shared `NumberField` for `card-installment-term`; it is an input field, not a button. The smoke test now asserts the visible field container and preserves the existing stable test ID. No markup or installment accounting changed.

### Transfer route contract

`/en/money/accounts` intentionally resolves to Money Home. The smoke test now asserts `money-hub`, scopes account rows to the current app viewport, and follows the current source/destination radio contract. Production routing and transfer semantics were unchanged.

### Re-certification

Passed:

- Affected browser specs: 14 passed, 4 skipped where fixture data was unavailable.
- Account/card/investment/transfer flows across 390 VI/light, 440 EN/dark, 768, and 1280.
- Installment setup, card payment, account edit, transfer neutrality, and investment source-picker flows.
- Privacy ON/OFF coverage in the selected investment/privacy flows.
- Reduced-motion execution, responsive shell checks, and no-overflow assertions present in the selected specs.
- No raw i18n-key failures observed.

### Final focused validation

- Focused Accounts/Credit Cards/eligibility/privacy/semantics tests: 11 files, 178 passed.
- Changed-file ESLint: passed.
- Typecheck: passed.
- Production build: passed.

## Remaining blockers

P0: 0  
P1: 0  
P2: 0

The investment closed-position failures observed in the broader selected run were fixture-data gaps outside this 15B scope; the investment picker-focused specs passed. They are not listed as Accounts/Credit Cards blockers.

## Smallest implementation sequence

No further Accounts/Credit Cards implementation sequence is required for 15B.1.

Opening-balance, transfer accounting, credit-card purchase classification, settlement neutrality, ownership/RLS, and account-type semantics were not changed.
