# Business Flows

## Create Card

Trigger:

- Household decides a card is relevant to shared household money.

Preconditions:

- User is allowed to act for the household.
- Card is recognizable.
- Issuer is known.
- Card type is known enough for safe interpretation.
- For credit cards, credit limit, statement date, and due date are known enough.

Business Rules:

- Credit cards must not be treated as real money accounts.
- Debit cards are primarily access to an underlying real account.
- Prepaid depth remains lightweight.
- Issuer identity is required for household recognition.

Expected Result:

- Card becomes Active.
- Credit-card obligation tracking can begin.

Failure Result:

- Card remains Draft or Invalid Attempt.
- No money movement occurs.

## Update Card Facts

Trigger:

- Household corrects issuer, type, limit, dates, responsibility, network, or status.

Preconditions:

- Card exists.
- Update preserves historical meaning.

Business Rules:

- Updates cannot convert credit capacity into cash.
- Updates cannot turn revolving card debt into Loan by default.
- Historical purchases, repayments, and billing periods must not be silently rewritten.

Expected Result:

- Card remains in a valid state with clearer business facts.

Failure Result:

- Invalid update is rejected.
- Prior valid state remains.

## Record Card Purchase

Trigger:

- Household recognizes a card-funded purchase.

Preconditions:

- Card is Active.
- Purchase amount and date are known enough.
- Purchase business meaning is known enough for household interpretation.

Business Rules:

- A credit-card purchase increases card obligation.
- A debit-card purchase reflects real money movement from the linked account through Transactions and Accounts.
- Purchase is not repayment.
- Billing-period association is applied when statement cycle is known.

Expected Result:

- Purchase becomes card activity.
- Credit-card obligation and relevant billing period reflect the purchase.

Failure Result:

- If purchase truth is unclear, card or item requires review.

## Associate Purchase To Billing Period

Trigger:

- A card purchase needs statement-cycle interpretation.

Preconditions:

- Card is a credit card.
- Statement date is known.
- Purchase date is known.

Business Rules:

- Billing-period association explains repayment timing.
- Household-recorded billing period is not provider-confirmed unless provider evidence exists.

Expected Result:

- Purchase belongs to one billing period.

Failure Result:

- If the cycle cannot be determined, the item remains Needs Review.

## Record Statement

Trigger:

- Household receives or determines statement amount for a billing period.

Preconditions:

- Credit card is Active or Needs Review.
- Billing period exists or can be recognized.
- Statement amount and due date are known enough.

Business Rules:

- Statement amount is a card obligation, not real cash.
- Statement truth is household-recorded unless provider-confirmed.
- Remaining due equals statement obligation less recognized payments, credits, or adjustments.

Expected Result:

- Billing period has statement balance, due date, paid amount, and remaining due amount.

Failure Result:

- If statement truth conflicts with known activity, billing period becomes Needs Review.

## Record Card Repayment

Trigger:

- Household pays or confirms payment toward credit-card obligation.

Preconditions:

- Credit card exists.
- Payment source is known.
- Payment amount and date are known enough.
- Payment is not automatic execution by Cards.

Business Rules:

- Repayment is a real ledger movement from a real money source.
- Accounts owns where money is.
- Transactions owns real movement.
- Cards owns repayment meaning against obligation.
- Repayment must not be double-counted as original purchase spending.

Expected Result:

- Paid amount increases.
- Remaining due decreases.
- Payment source impact remains visible through Accounts and Transactions.

Failure Result:

- If payment posting or source truth is unclear, card or billing period enters Needs Review.

## Record Partial Repayment

Trigger:

- Household pays less than the amount due.

Preconditions:

- Credit-card billing period has remaining due.
- Payment source and amount are known.

Business Rules:

- Partial payment is valid but does not imply financial safety.
- Unknown interest, late fee, or minimum-payment effects must not be invented.
- Remaining due must stay visible.

Expected Result:

- Paid amount reflects actual payment.
- Remaining due remains greater than zero.
- Billing period remains Open or Needs Review depending on certainty.

Failure Result:

- If household cannot interpret issuer consequence, billing period enters Needs Review.

## Record Refund

Trigger:

- Household receives or recognizes merchant refund to card.

Preconditions:

- Original or related card activity is identifiable when possible.
- Refund amount and timing are known enough.

Business Rules:

- Refund is not ordinary income by default.
- Refund may reduce current obligation, later obligation, or create card credit depending on timing.
- Refund does not automatically erase current due amount unless statement interpretation supports it.

Expected Result:

- Refund is visible as card-specific adjustment.
- Affected billing period is updated or marked Needs Review.

Failure Result:

- If refund timing or target period is unclear, refund remains review-worthy.

## Record Fee Or Interest

Trigger:

- Household identifies card fee or credit-card interest.

Preconditions:

- Card exists.
- Amount and business meaning are known enough.

Business Rules:

- Fees and interest are card-specific costs.
- Broad fee and interest awareness is in scope.
- Detailed issuer formula or fee taxonomy must not be invented.

Expected Result:

- Card obligation reflects known cost.

Failure Result:

- Unknown charge remains Needs Review.

## Record Cashback Or Statement Credit

Trigger:

- Household identifies cashback or simple statement credit.

Preconditions:

- Card exists.
- Amount and credit meaning are known enough.

Business Rules:

- Cashback or statement credit may reduce card obligation.
- It should not encourage treating rewards as income or profit unless the money truly enters a real account.
- Points, miles, vouchers, and optimization are out of current scope.

Expected Result:

- Card obligation or credit context is adjusted.

Failure Result:

- Ambiguous reward remains Needs Review.

## Recognize Card-Origin Installment

Trigger:

- A card purchase is converted to or understood as installment repayment.

Preconditions:

- Original card purchase is identifiable when possible.
- Future obligation amount and timing are known enough.

Business Rules:

- Card-origin visibility remains in Cards.
- Scheduled obligation must not duplicate Loans.
- Revolving card debt is not treated as Loan by default.
- Future payment pressure may be read by Planning.

Expected Result:

- Household can see that a card purchase created future repayment pressure.

Failure Result:

- If boundary with Loans is unclear, the item enters Needs Review.

## Close Card

Trigger:

- Household determines card is no longer active.

Preconditions:

- Card exists.
- Household has reason to close, expire, replace, or archive.

Business Rules:

- Closure does not erase history.
- Closure does not imply all obligations are settled unless remaining due is zero or household confirms settlement.
- Closed card cannot create new normal purchases.

Expected Result:

- Card becomes Closed, Expired, Replaced, or Archived.
- History remains available.

Failure Result:

- If remaining obligation or refund is unresolved, card enters Needs Review.

## Review Card

Trigger:

- Household questions card truth, due amount, unfamiliar charge, refund timing, payment posting, or partner responsibility.

Preconditions:

- Card exists.

Business Rules:

- Review is a confidence action.
- Review does not move money.
- Review does not execute payment.
- Unclear provider truth must not be fabricated.

Expected Result:

- Card is confirmed, corrected, or remains Needs Review.

Failure Result:

- Last valid state remains preserved.
