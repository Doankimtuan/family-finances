# Form Strategy

## Form Decision Matrix

| Flow | Form type | Required-first fields | Optional/contextual fields | Inline preview | Validation timing | Draft/exit | Success destination |
|---|---|---|---|---|---|---|---|
| Login/Register | Single screen | Credentials/provider, required consent | Profile hints | None | Inline on blur + submit | No draft | Home/Onboard |
| Create household | Short progressive | Household name, starter choice | Policies later | Setup summary | Step submit | Protect if edited | Home |
| Create transaction | Single fast capture | Type, amount, account, date | category, note, attachment | Money movement preview | As field completes + submit | Keep unsaved warning | Transaction detail |
| Transfer | Single screen | Amount, from, to, date | note | Source/destination preview | Immediate account validation | Keep unsaved warning | Transaction detail |
| Create account | Single screen or short sheet | Type, name, opening balance/date | institution, color/icon later | Opening balance effect | Submit + critical inline | Keep unsaved warning | Account detail |
| Create card | Progressive | Name, limit/status, statement/due dates | installment defaults, notes | Due cycle preview | Step-level | Draft allowed if safe | Card detail |
| Create loan | Progressive | Lender, principal, repayment method, first due | rate segments, notes | Schedule preview | Step-level | Draft allowed | Loan detail |
| Create savings | Progressive | Provider/name, source, principal, term/maturity | purpose, renewal preference | Proceeds/maturity preview | Step-level | Draft allowed | Saving detail |
| Create investment | Progressive | Holding identity, contribution, estimated value/date/source | liquidity, risk note, household purpose | Not-cash/value freshness preview | Step-level | Draft/Under Review allowed | Investment detail |
| Create jar/goal/recurring | Single or short progressive | Name, amount/timing | notes/icon | Intention effect | Inline + submit | Keep unsaved warning | Detail/list |
| Policies/preferences | Sectioned settings | Current value | Advanced details | Impact summary | On submit | Warn on dirty exit | Same screen |

## Required Behavior

- Required fields appear before optional fields.
- Optional fields are collapsed unless context makes them necessary.
- Amount fields show currency and financial meaning.
- Date fields show effective date meaning.
- Forms that move real money or create real obligations must preview consequences.
- Harmless reversible preference changes may save with lightweight feedback.
- Closed-period, irreversible, destructive, partner-visible, or real-money actions use preview-confirm.

## Save Draft

Drafts are allowed when:

- A complex product setup is long.
- Missing facts can safely remain incomplete.
- The domain supports an incomplete/review state.

Drafts are not allowed when:

- The action posts real money.
- The action creates irreversible history.
- Partial data would imply a false financial state.

## Current Issue / UX Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Long financial forms are route-local and dense. | Users abandon or guess. | Use required-first progressive sections with previews. | Loans, Savings, Cards, Investments | P1 |
| Simple capture can become too slow. | Daily logging friction. | Keep income/expense/transfer as single fast forms. | Transactions | P0 |
| Optional advanced fields compete with essentials. | Cognitive overload. | Collapse optional detail and allow safe later completion. | Accounts, Loans, Savings, Investments, Goals | P1 |

