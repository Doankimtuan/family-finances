# ACCOUNTS 15A — Reference Gap Audit

Date: 2026-08-23  
Scope: current Accounts + Credit Cards implementation; archived legacy code excluded.  
Mode: audit only; no production fixes made.

## Verdict

**ACCOUNTS AUDIT BLOCKED**

The static/application audit and focused unit checks are complete. Required real-browser evidence is blocked: the focused Playwright run could not consistently load or authenticate against `http://localhost:3000`, so responsive, theme, locale, privacy, reduced-motion, and live flow behavior cannot be accepted as verified.

## Findings

### P0 — accounting/security/data integrity: 0

No confirmed P0 gap.

- Account kinds are explicit constants (`cash`, `checking`, `savings`, `ewallet`, `brokerage`, `credit_card`, `savings_product`, `other`); balances are not used to infer type.
- Opening balance is persisted as `accounts.opening_balance`; no create-account path posts a synthetic transaction, Income/Expense, or transfer. Credit cards force opening balance to zero.
- Transfers validate positive amount and reject same-account source/destination in the shared schema. The command delegates to the atomic `record_owned_account_transfer` RPC and passes an idempotency key; the implementation documents neutral semantics and returns both deltas.
- Card purchases route through the card transaction RPC and enforce credit limit; card settlement uses the dedicated settlement path with a source account, payment idempotency key, and neutral liability-payment semantics.
- Ownership reads derive household authority from the authenticated session. Accounts RLS allows active-member reads, limits personal mutation to the active owner, keeps ownership immutable, and applies transaction mutation checks through the account.
- Real Position excludes credit cards and sums opening balances plus balance-affecting transactions. Home consumes that position read model, so opening balance and transfers do not enter period cash-flow analytics.

### P1 — broken/misleading core UX: 2

1. **Investment opening-position purchase picker exposes credit cards.** `app/[locale]/(product)/money/investments/new/page.tsx:13-19` excludes only `savings_product`. The downstream investment RPC rejects `credit_card` as a cash account, so the UI can offer an account that cannot complete the purchase. This is a duplicated/divergent eligibility predicate against the finalized cash-source contract.

2. **Money hub credit-outstanding metadata bypasses `FinancialValue`.** `app/[locale]/(product)/money/page.tsx:214-222` renders the formatted monetary value inside a raw `<span>`. The main position, account rows, cards, and module values use privacy-aware primitives, but this monetary summary will remain visible when privacy is ON.

### P2 — polish/test debt: 2

1. **Savings eligibility duplicates the canonical account-type list locally.** `modules/savings/application/savings-domain-rules.ts:242-252` recreates the eligible set instead of reusing the shared account predicate/constants. This currently matches the debt/liquid contract but can drift.

2. **Browser evidence is not reproducible in the audit environment.** The selected Accounts, Transfers, and Credit Card specs ran with credentials present but failed at login/page navigation timeouts against localhost; one card-installment path also failed to find the term control. This prevents distinguishing product regressions from server/auth/fixture instability.

## Area-by-area result

| Area                                                      | Result                           | Evidence                                                                                                                          |
| --------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Overview/list                                             | Pass statically                  | `listAccounts` excludes credit cards from liquid list; Money groups account types explicitly.                                     |
| Create/edit                                               | Pass with P1 eligibility gap     | Shared form/schema and reset behavior exist; create persists opening balance and ownership.                                       |
| Account detail                                            | Pass statically; browser blocked | Balance, type, ownership, activity, edit, quick capture, archive, and loading/error/empty states are present.                     |
| Opening balance                                           | Pass                             | Position seed only; no synthetic transaction path found.                                                                          |
| Transfers                                                 | Pass                             | Atomic RPC, neutral semantics, same-account validation, idempotency, household gate.                                              |
| Credit cards                                              | Pass statically                  | Expense purchase path, neutral settlement path, source eligibility in settlement, outstanding/available/limit model.              |
| Ownership/security                                        | Pass statically                  | Server-derived authority, ownership-aware RLS/RPC migration coverage, former-owner read-only model.                               |
| Specialized eligibility                                   | Gap                              | Savings and debt use liquid contract; investment opening picker is broader than the RPC contract.                                 |
| Privacy                                                   | Gap                              | Confirmed raw Money hub monetary metadata path. Other audited account/card primitives use `FinancialValue`.                       |
| Home/Money/Transactions                                   | Pass statically                  | Position and cash-flow reads are separated; transfers classified neutral.                                                         |
| Responsive UX / VI-EN / themes / reduced motion / offline | Blocked                          | Browser run failed before reliable screen verification. Static components include offline/error/empty and motion-reduction paths. |

## Focused checks

- Unit tests: **176 passed / 176**, 12 focused files covering accounts, transfers, semantics, cards, forms, privacy, Money view model, ownership/RLS, eligibility, and transfer capture.
- Typecheck: **passed** (`npm run typecheck`).
- Build: **passed** (`npm run build`).
- Focused browser smoke: **10 failed**, primarily login/navigation timeout at `localhost:3000`; no valid responsive acceptance evidence.
- Full unit suite: **not run**, per audit instruction.

## Recommended smallest implementation sequence

1. Fix the two P1 gaps: use the finalized investment cash-account eligibility predicate in the picker, and wrap Money hub credit-outstanding display in `FinancialValue`.
2. Consolidate savings eligibility onto the shared account eligibility contract; add focused regression tests for credit-card exclusion and privacy masking.
3. Repair the local Playwright server/auth/fixture setup, then rerun only the Accounts, Transfers, Credit Cards, ownership/privacy, and responsive smoke specs at 390/440/768/1280 in VI/EN, light/dark, privacy ON/OFF, and reduced motion.

No implementation fixes were made in this audit.
