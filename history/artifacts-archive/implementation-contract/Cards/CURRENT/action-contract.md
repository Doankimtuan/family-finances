# Action Contract

## Create Card

Trigger:

- User chooses to track a household-relevant card.

Actor:

- Partner or Admin.

Preconditions:

- Actor has active household membership.
- Card is recognizable.
- Issuer is known.
- Card type is known enough.
- For credit cards: credit limit, statement date, and due date are known enough.

Validation:

- Issuer is not blank.
- Card type is debit, credit, or prepaid.
- Credit-card limit is present and non-negative.
- Statement date and due date are valid calendar days when required.
- Card is not being created as real cash balance or Loan by default.

Business Rules:

- BR-01, credit capacity is not cash, issuer recognition, credit-card required facts.

Success Result:

- Card enters Active state.
- Credit-card obligation tracking becomes eligible.
- No money movement occurs.

Failure Result:

- Active card is not created.
- Draft or previous state remains.
- User receives validation, permission, or boundary failure.

## Edit Card Facts

Trigger:

- User corrects issuer, type, limit, statement date, due date, network, responsibility, or lightweight status.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Change preserves historical meaning.

Validation:

- Updated facts remain valid for card type.
- Credit limit remains non-negative.
- Dates remain valid when required.
- Edit does not silently rewrite historical purchases, repayments, or billing periods.
- Edit does not convert available credit into cash or revolving debt into Loan.

Business Rules:

- No silent rewrite, invalid attempts preserve state, card boundary.

Success Result:

- Card facts are updated.
- State remains unchanged unless edit explicitly resolves Needs Review.

Failure Result:

- Edit is rejected.
- Prior valid state and facts remain unchanged.

## Record Card Purchase

Trigger:

- User records or confirms a card-funded purchase.

Actor:

- Partner or Admin.

Preconditions:

- Card is Active.
- Amount, date, and business meaning are known enough.

Validation:

- Amount is positive.
- Date is present.
- Card is not Closed, Expired, Archived, Abandoned Draft, or Invalid Attempt.
- Purchase is not recorded as repayment.
- For debit card, linked real money source must be known enough through Accounts.

Business Rules:

- Credit-card purchase increases obligation.
- Debit-card purchase is account-funded spending.
- Purchase and repayment are distinct.

Success Result:

- Purchase becomes card activity.
- Credit-card obligation and billing period are updated when applicable.
- Debit-card real movement is owned by Transactions and Accounts.

Failure Result:

- No purchase is recorded.
- Ambiguous purchase enters Needs Review.

## Associate Purchase To Billing Period

Trigger:

- A credit-card purchase needs statement-cycle placement.

Actor:

- Partner, Admin, Background Worker, or System.

Preconditions:

- Card is a credit card.
- Statement date and purchase date are known.
- Purchase exists or is being recorded.

Validation:

- Billing period can be determined from recorded card facts.
- Result is not labeled provider-confirmed unless supported by approved scope.

Business Rules:

- Billing association explains repayment timing.
- Household-recorded billing period is recorded truth.

Success Result:

- Purchase belongs to exactly one billing period.

Failure Result:

- Purchase or billing period enters Needs Review.

## Record Statement

Trigger:

- User receives or determines statement amount for a billing period.

Actor:

- Partner or Admin.

Preconditions:

- Credit card is Active or Needs Review.
- Billing period exists or can be recognized.
- Statement amount and due date are known enough.

Validation:

- Statement amount is non-negative.
- Due date is valid.
- Paid amount cannot exceed statement amount unless explicitly interpreted as credit or overpayment.
- Statement truth is not marked provider-confirmed by default.

Business Rules:

- Statement amount is obligation, not cash.
- Remaining due must be explainable.

Success Result:

- Billing period becomes Billing Open, Billing Partially Paid, or Billing Settled according to remaining due.
- Due-date awareness becomes eligible.

Failure Result:

- Billing period enters Needs Review.
- Previous valid values remain available.

## Record Card Repayment

Trigger:

- User records or confirms payment toward credit-card obligation.

Actor:

- Partner or Admin.

Preconditions:

- Credit card exists.
- Payment source is known and eligible.
- Amount and date are known.
- Payment is user-confirmed, not automatically executed by Cards.

Validation:

- Amount is positive.
- Source is a real money source owned by Accounts.
- Payment date is present.
- Payment is not duplicate by user intention.
- Payment does not exceed remaining due unless explicitly interpreted as overpayment or credit.

Business Rules:

- Repayment is real ledger movement.
- Accounts owns source.
- Transactions owns real movement.
- Cards owns obligation reduction.
- Repayment is not original purchase spending.

Success Result:

- Real ledger movement is recorded or referenced through Transactions.
- Paid amount increases.
- Remaining due decreases.
- Billing state becomes Billing Partially Paid or Billing Settled.

Failure Result:

- No repayment progress is recorded by Cards.
- If payment truth is unclear, card or billing period enters Needs Review.

## Record Partial Repayment

Trigger:

- User records payment less than remaining due.

Actor:

- Partner or Admin.

Preconditions:

- Credit-card billing period has remaining due.
- Payment source, amount, and date are known.

Validation:

- Amount is positive and less than remaining due.
- Source is a real money source.
- Unknown interest, late fee, or minimum-payment consequence is not invented.

Business Rules:

- Partial payment is valid but not automatically safe.
- Remaining due stays visible.

Success Result:

- Billing period becomes Billing Partially Paid.
- Remaining due remains greater than zero.

Failure Result:

- Prior billing state remains or enters Needs Review if interpretation is unclear.

## Record Refund

Trigger:

- User recognizes merchant refund to card.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Refund amount and date are known.
- Related purchase is identifiable when possible.

Validation:

- Refund amount is positive.
- Refund is not recorded as ordinary income by default.
- Target billing period is known or marked uncertain.

Business Rules:

- Refund may reduce current obligation, later obligation, or create credit.
- Refund does not automatically erase current due.

Success Result:

- Refund is recorded as card-specific adjustment.
- Affected billing period updates or enters Needs Review.

Failure Result:

- Refund remains review-worthy.
- No unrelated money movement is created.

## Record Fee Or Interest

Trigger:

- User identifies card fee or credit-card interest.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Amount and broad meaning are known.

Validation:

- Amount is positive.
- Charge is broad fee or interest, not invented detailed issuer formula.
- Charge belongs to card context.

Business Rules:

- Fees and interest are card-specific costs.
- Unknown charge remains Needs Review.

Success Result:

- Card obligation reflects known cost.
- Billing period becomes Billing Open, Billing Partially Paid, or Needs Review as appropriate.

Failure Result:

- Charge is rejected or marked Needs Review.

## Record Cashback Or Statement Credit

Trigger:

- User identifies cashback or simple statement credit.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Amount and credit meaning are known.

Validation:

- Amount is positive.
- Credit is simple cashback or statement credit.
- Non-cash rewards are not treated as money.

Business Rules:

- Cashback may reduce obligation.
- Cashback is not profit unless real money enters a real account.

Success Result:

- Obligation or credit context is adjusted.

Failure Result:

- Ambiguous reward remains Needs Review.

## Recognize Card-Origin Installment

Trigger:

- User identifies that a card purchase created scheduled future payment pressure.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Original purchase is identifiable when possible.
- Future amount and timing are known enough.

Validation:

- Installment is card-origin.
- It does not duplicate existing Loan obligation.
- Revolving card debt is not treated as Loan by default.

Business Rules:

- Cards preserves origin visibility.
- Planning may read future pressure.
- Loans boundary is protected.

Success Result:

- Card item is marked as card-origin installment awareness.
- Future pressure becomes eligible for Planning.

Failure Result:

- Item enters Needs Review.

## Close Card

Trigger:

- User determines card is no longer active.

Actor:

- Partner or Admin.

Preconditions:

- Card exists.
- Closure, expiry, replacement, or archive reason is known.

Validation:

- Remaining due is zero or user explicitly confirms unresolved obligation handling.
- Closure does not erase history.
- Closed, Expired, or Archived card cannot receive new normal purchases.

Business Rules:

- Closure is not repayment.
- Termination preserves history.

Success Result:

- Card becomes Closed, Expired, Replaced, or Archived.
- History remains visible.

Failure Result:

- Card enters Needs Review if unresolved obligation, refund, or mismatch exists.

## Archive Card

Trigger:

- User removes non-current card from active view.

Actor:

- Partner or Admin.

Preconditions:

- Card is Closed, Expired, Replaced, Active, or Needs Review.
- User understands history remains.

Validation:

- Archive does not hide unresolved due amount without explicit review.
- Archive does not delete history.

Business Rules:

- Archive is current-use visibility only.

Success Result:

- Card becomes Archived.

Failure Result:

- Card remains previous state or enters Needs Review.

## Review Card

Trigger:

- User questions card truth, due amount, unfamiliar charge, refund, payment posting, or responsibility.

Actor:

- Partner, Admin, or Viewer for read-only review.

Preconditions:

- Card exists.

Validation:

- Review does not move money.
- Review does not execute payment.
- Provider truth is not fabricated.

Business Rules:

- Review is confidence-only.
- Last valid state is preserved.

Success Result:

- Card is confirmed, corrected through allowed actions, or remains Needs Review.

Failure Result:

- Previous valid state remains.

## Recover Card State

Trigger:

- Historical or terminal card state is questioned.

Actor:

- Partner or Admin.

Preconditions:

- Card is Closed, Expired, Replaced, Archived, Billing Settled, or Needs Review.

Validation:

- Recovery reason is known.
- Target state is allowed by state contract.

Business Rules:

- Recovery passes through Needs Review.
- History is preserved.

Success Result:

- Card transitions through Needs Review to valid recovered state.

Failure Result:

- Card remains in previous valid state.

## Abandon Draft

Trigger:

- User stops creating an inactive card.

Actor:

- Draft creator, Partner, or Admin.

Preconditions:

- Card is Draft.
- No active financial history exists.

Validation:

- Draft has not become Active.

Business Rules:

- Abandoned Draft does not represent household financial history.

Success Result:

- Draft becomes Abandoned Draft.

Failure Result:

- If card has active history, close or archive flow is required instead.
