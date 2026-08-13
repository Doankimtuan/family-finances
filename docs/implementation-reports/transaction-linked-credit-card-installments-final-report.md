# Transaction-Linked Credit-Card Installments — Final Implementation Report

**Project:** ViNha / Family Finances  
**Date:** 13 August 2026  
**Scope:** Correct the credit-card installment model and refactor the account forms onto canonical shared controls.

## Executive summary

The application now treats a credit-card installment as a **bank-confirmed tracking agreement attached to one existing card purchase**, rather than as a standalone financial object. A tracker cannot be created without a source purchase, and each purchase may be tracked only once. This removes the previous risk of inventing duplicate expenses, duplicate card liabilities, or synthetic repayment transactions.

The implementation separates **interest** from **conversion fees** at every layer: typed domain constants, persisted plan fields, schedule calculation, preview UI, and tests. A plan with zero interest but a conversion fee is therefore no longer represented as a free plan. The user records the bank-confirmed agreement instead of selecting a hard-coded issuer rule.

| Area                        | Outcome                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Canonical installment model | Implemented as transaction-linked, one tracker per source purchase.                                                       |
| Accounting safety           | Source purchase remains the sole expense; tracker posts no ledger entries.                                                |
| Cost disclosure             | Principal, conversion fee, interest, total extra cost, total repayment, and expected schedule are separate.               |
| Database migration          | Applied and live-schema verified, with source FK, uniqueness, schedule table, RLS, and source-validation trigger.         |
| Account forms               | Shared `LabeledSelect` and `NumberField` controls replace raw primary controls.                                           |
| Validation                  | Lint, typecheck, production build, 345 unit tests, full Playwright suite, and 5 authenticated responsive checks all pass. |

## Vietnamese credit-card installment findings

Vietnamese card programs are transaction-led: a cardholder either converts an eligible already-posted purchase or makes an eligible merchant purchase under a partner program. Issuer materials also distinguish interest from conversion fees and describe materially variable terms, approval conditions, merchant participation, collection timing, and promotional availability. The application consequently records **only bank-confirmed terms supplied by the user**, not issuer-specific defaults. [1] [2] [3]

| Finding                                                                  | Product consequence                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Conversion is tied to a purchase or partner checkout flow.               | `source_transaction_id` is mandatory and references an existing card expense.                 |
| “0% interest” can coexist with a conversion fee.                         | Fee and interest are independent fields and are disclosed separately in the preview.          |
| Terms vary by issuer, cardholder, campaign, merchant, channel, and time. | No issuer policy or fee matrix is hard-coded into the product.                                |
| Bank repayment treatment can differ from a local projection.             | The schedule is explicitly expected tracking data, not an automatically reconciled statement. |

> **Product principle:** a locally recorded installment tracker documents a bank agreement already confirmed by the cardholder; it neither applies for, changes, nor cancels that agreement.

## Previous-model risk and canonical replacement

The former standalone shape could represent an installment without a verifiable purchase. That creates ambiguity about whether the original purchase should still count as spending and exposes the ledger to double-counting if monthly rows or repayments are treated as new expenses.

The corrected model establishes the following invariant.

| Concern           | Canonical behavior                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Purchase origin   | The source must be a positive expense on the same credit-card account.                                                                 |
| Duplicate tracker | A database uniqueness constraint permits one tracker per source transaction.                                                           |
| Eligibility       | Refunds, corrections, transfers, repayments, non-expenses, invalid amounts, and already-tracked purchases are structurally excluded.   |
| Program structure | Supports true zero-interest/zero-fee, zero-interest with fee, flat-interest with or without fee, and bank-quoted total repayment.      |
| VND arithmetic    | Integer VND arithmetic is used throughout; percentage calculations use basis points and half-up rounding.                              |
| Remainder         | Any indivisible VND remainder is placed in the final expected period, preserving exact reconciliation.                                 |
| Progress          | Progress is based only on schedule rows explicitly confirmed by the user; time passing or card settlement does not auto-confirm a row. |
| Stop action       | “Stop tracking” changes local tracker status only. It does **not** cancel the agreement with the bank.                                 |

## Accounting semantics

The corrected implementation separates economic events from tracking metadata. The original card transaction is the only expense. The card payment is a cash-to-liability settlement. The installment tracker is a planning and disclosure layer around the bank agreement and does not create a second expense, a second principal liability, or monthly synthetic ledger entries.

| Event                       | Ledger treatment                                 | Installment tracker treatment                                  |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Original card purchase      | Recorded once as an expense.                     | Becomes the immutable source transaction.                      |
| Bank conversion agreement   | No new purchase is posted.                       | Agreement terms and expected schedule are persisted.           |
| Expected installment period | No automatic transaction is posted.              | Retained as an expected schedule row.                          |
| Actual card repayment       | Liability settlement, not spending.              | Does not automatically mark a plan period confirmed.           |
| Refund or correction        | Existing transaction flow remains authoritative. | Tracker is surfaced for review rather than silently rewritten. |

## Domain, database, and API implementation

The implementation introduces typed values for installment origin, program type, fee type, fee timing, calculation source, plan status, schedule status, and standard term presets. The pure domain helper provides deterministic schedule allocation, preview construction, view-model derivation, structural purchase eligibility, row mapping, percentage-to-basis-points conversion, and VND-safe percentage rounding.

The applied migration `20260813113000_transaction_linked_credit_card_installments.sql` retires legacy standalone rows into an archive and reshapes the live `credit_card_installments` table. Live-schema inspection confirmed the following.

| Live database safeguard            | Verification result                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `source_transaction_id`            | Present, non-null, unique, and foreign-keyed to `public.transactions`.                                                |
| Typed cost and status fields       | Present with database check constraints for origin, program, calculation source, fee type, fee timing, and status.    |
| `credit_card_installment_schedule` | Present with expected date, principal, fee, interest, total, confirmation status, and confirmation timestamp columns. |
| Schedule ownership                 | Foreign-keyed to installment and household.                                                                           |
| Row Level Security                 | Enabled on plans, schedule rows, and legacy archive.                                                                  |
| Source validation                  | Database trigger included by migration to enforce valid tracker/source relationships.                                 |
| Legacy data                        | Archive table present; current live tracker and archive row counts were zero at verification.                         |

The register command validates the source purchase and same-card relation, checks local uniqueness, persists the plan and expected rows, and intentionally does not post transactions or mutate card billing. The stop command preserves history and explicitly avoids implying an issuer cancellation.

## User interface and form refactor

The credit-card detail no longer exposes a permanently open blank installment form. Instead, it presents a **“Convert transaction to installment”** action that opens a canonical sheet. The setup flow starts from an eligible purchase, then lets the user choose agreement type, term, expected first period, and only the conditionally relevant bank-confirmed cost inputs. A required live preview exposes the original purchase, conversion fee, interest, total extra cost, total repayment, and first/final expected periods before saving.

The active-plan presentation is compact and includes an accessible progress bar, remaining amount, next expected amount, and total extra cost. Its stop-tracking control is paired with explicit local-only disclaimer copy. English and Vietnamese localization keys were added for all setup, disclosure, preview, progress, and stop-tracking text.

The account-create form now uses the canonical HeroUI-based `LabeledSelect` for account type and linked payment account, while statement and due days use the shared `NumberField` with bounds of **1–31**. The account-edit form now uses `LabeledSelect` for the account type. Raw primary `input`, `select`, and radio controls are absent from both refactored account forms. The create sheet keeps a compact inline action hierarchy with **Add account** primary and **Cancel** secondary.

## Review findings and disposition

| Severity  | Finding                                                                                                                  | Disposition                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Critical  | A standalone installment could be represented without an original card purchase, risking duplicate accounting semantics. | Resolved through mandatory source transaction linkage, source validation, schedule metadata, and no-posting command behavior.      |
| Critical  | A 0% plan could be presented as free despite a conversion fee.                                                           | Resolved through explicit fee/interest separation in persistence, preview, and tests.                                              |
| Important | Rounded VND schedules could fail to reconcile with total repayment.                                                      | Resolved with integer VND allocation and final-row remainder handling.                                                             |
| Important | Account create/edit flows used inconsistent local/raw controls.                                                          | Resolved with shared `LabeledSelect` and `NumberField` components.                                                                 |
| Important | Browser checks initially exercised the redirecting `/money/accounts` alias, which was unreliable at tablet width.        | Test coverage now navigates directly to the owning `/money` hub; the product route alias remains intact.                           |
| Polish    | A stale inbox test expected the obsolete generic maturity type.                                                          | Updated the assertion to the repository’s explicit `SavingsMaturityDecision` schema; this was unrelated to the installment change. |

The live Supabase security advisor contains existing warnings concerning mutable function search paths and anonymously executable `SECURITY DEFINER` functions elsewhere in the project. No advisor finding named the new credit-card installment plan, schedule, or validation trigger. Those broader warnings should be addressed as a separate security-hardening initiative using the advisor remediation guidance.

## Validation evidence

| Check                           | Result                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused card domain tests       | **21/21 passed**: 7 installment tests plus 14 card-billing tests.                                                                                                                        |
| Complete unit suite             | **345/345 passed** across 62 test files.                                                                                                                                                 |
| Lint                            | `npm run lint` passed.                                                                                                                                                                   |
| Type checking                   | `npm run typecheck` passed.                                                                                                                                                              |
| Production build                | `npm run build` passed; all routes compiled and generated successfully.                                                                                                                  |
| Full browser suite              | **54 passed, 40 skipped**. The original cold-start internal-server-error condition was eliminated by running against the warmed local application.                                       |
| Authenticated responsive checks | **5/5 passed** without creating, editing, submitting, stopping, or deleting financial records.                                                                                           |
| Live schema inspection          | Completed against project `bbzffxvgocjwsdbujvgn`; plan, schedule, FK, uniqueness, and RLS verified.                                                                                      |
| Obsolete-card-path search       | Only the new registration action and tracker section are active for credit cards. Remaining generic `createInstallment*` aliases map to the loan product and have no active card caller. |

The authenticated checks verified the canonical account controls at 390px light, 440px dark, 768px light, and 1280px dark. They verified the accessible HeroUI select triggers, the localized 1–31 NumberField bound labels, the account-edit type selector, the conversion sheet, transaction selection when eligible purchases exist, the mandatory preview, and the disabled save state when no eligible purchase is available. They did not submit or mutate any household financial record.

## Deferred work

No unresolved blocker remains within this scope. Deliberately deferred enhancements include partial conversion of a purchase, statement-row reconciliation, automatic schedule confirmation from bank data, issuer-integrated eligibility checks, and a broader remediation pass for existing database security-advisor warnings. Each should be designed independently so that it does not weaken the current no-double-counting accounting invariant.

## Key files

| Purpose                                      | Path                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vietnam-domain research and product contract | `docs/domain/vietnam-credit-card-installments.md`                                                                                                         |
| Typed constants                              | `modules/ledger/application/ledger-constants.ts`                                                                                                          |
| VND calculation and view-model helpers       | `modules/ledger/application/credit-card-installments.ts`                                                                                                  |
| Registration and safe local-stop commands    | `modules/ledger/application/commands/register-credit-card-installment.ts`; `modules/ledger/application/commands/stop-credit-card-installment-tracking.ts` |
| Plan and eligible-purchase queries           | `modules/ledger/application/queries/list-credit-card-installments.ts`                                                                                     |
| Live migration                               | `supabase/migrations/20260813113000_transaction_linked_credit_card_installments.sql`                                                                      |
| Transaction-led card UI                      | `app/[locale]/(product)/money/accounts/[id]/credit-card-installments-section.tsx`                                                                         |
| Account create/edit refactor                 | `app/[locale]/(product)/money/accounts/add-account-form.tsx`; `app/[locale]/(product)/money/accounts/[id]/account-detail-actions.tsx`                     |
| Domain test coverage                         | `tests/unit/credit-card-installments.test.ts`                                                                                                             |
| Authenticated responsive browser coverage    | `tests/e2e/credit-card-installments.smoke.spec.ts`                                                                                                        |

## References

[1] [VPBank — Phí chuyển đổi trả góp thẻ tín dụng là gì?](https://www.vpbank.com.vn/bi-kip-va-chia-se/retail-story-and-tips/credit-card-category/phi-chuyen-doi-tra-gop-the-tin-dung)

[2] [Techcombank — Trả góp linh hoạt với thẻ tín dụng](https://techcombank.com/khach-hang-ca-nhan/chi-tieu/the/the-tin-dung/tra-gop)

[3] [MB Bank — Trả góp lãi suất 0% cùng thẻ tín dụng MB](https://www.mbbank.com.vn/chi-tiet/tin-khuyen-mai-khcn/tra-gop-lai-suat-0-cung-the-tin-dung-%E2%80%93-don-gian-de-dang-phi-tot-nhat-thi-truong-2024-3-5-11-40-2/2637)
