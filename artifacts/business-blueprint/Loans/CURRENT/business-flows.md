# Business Flows

## Create Loan

Trigger:

- Household identifies a scheduled or socially recognized borrowing obligation.

Preconditions:

- User is allowed to act for the household.
- Obligation is not a credit-card revolving balance.
- Minimum loan facts are known.

Business Rules:

- Loan must represent a real obligation, not a goal or jar.
- Lender must be identifiable.
- Principal must be positive and understandable.
- Expected repayment timing must be known enough for household planning.
- Recorded values are product truth unless provider-confirmed.

Expected Result:

- Loan becomes Active.
- Loan has recorded principal, repayment expectation, and lender context.
- Upcoming repayment awareness can begin.

Failure Result:

- Loan is not activated.
- Boundary-breaking obligations remain outside Loans.

## Update Loan Details

Trigger:

- Household needs to correct or clarify loan recognition.

Preconditions:

- Loan exists.
- Change preserves historical meaning.

Business Rules:

- Updates cannot turn a loan into a card, jar, goal, or account.
- Lender, type, note, and household relevance may be corrected.
- Historical repayment facts must not be silently rewritten.

Expected Result:

- Loan remains in its current valid state with clearer business meaning.

Failure Result:

- Invalid or boundary-breaking update is rejected.
- Prior valid state remains.

## Update Rate Awareness

Trigger:

- Household learns that a variable or promotional-rate loan has a relevant rate change.

Preconditions:

- Loan is Active or Needs Review.
- Rate change is relevant to repayment understanding.

Business Rules:

- Rate awareness explains repayment pressure.
- Benchmark and margin sophistication is not current scope.
- User-entered rate facts are not provider confirmation unless separately evidenced.

Expected Result:

- Loan repayment expectation becomes clearer.
- Loan may remain Active or return from Needs Review to Active.

Failure Result:

- If rate truth is unclear, loan remains Needs Review.

## Review Loan

Trigger:

- Household checks loan truth because of due date, payment mismatch, partner question, provider screen, or stale record.

Preconditions:

- Loan exists.

Business Rules:

- Review is a confidence action.
- Review does not move money.
- Review does not automatically change recorded principal.

Expected Result:

- Loan is confirmed, corrected, or marked Needs Review.

Failure Result:

- If truth cannot be established, loan remains Needs Review.

## Record Scheduled Repayment

Trigger:

- Household makes or confirms an expected repayment.

Preconditions:

- Loan is Active.
- Payment source is known.
- Repayment amount and date are known enough for business interpretation.

Business Rules:

- Repayment is a real ledger movement.
- Payment source belongs to Accounts.
- Transaction domain owns the money movement.
- Loans owns repayment history and obligation progress.
- Repayment must not be treated only as ordinary spending.

Expected Result:

- Repayment history is updated.
- Recorded remaining principal is reduced according to known repayment meaning.
- Next expected payment remains or loan becomes Completed when fully repaid.

Failure Result:

- If payment truth is unclear, loan enters Needs Review.
- No automatic repayment is executed.

## Record Partial Or Irregular Repayment

Trigger:

- Household pays less, more, early, or differently than expected.

Preconditions:

- Loan is Active.
- Payment source and amount are known.

Business Rules:

- Actual repayment must be recorded as actual, not forced into planned schedule.
- Difference from expected amount must remain explainable.
- Unknown fees or penalties must not be invented.

Expected Result:

- Repayment history reflects actual payment.
- Loan remains Active or enters Needs Review if future expectation is uncertain.

Failure Result:

- If the payment cannot be interpreted, previous valid state is preserved and loan needs review.

## Estimate Early Payoff

Trigger:

- Household wants to understand approximate payoff burden.

Preconditions:

- Loan is Active.
- Recorded remaining principal exists.

Business Rules:

- Payoff estimate is planning information.
- It is not lender payoff quote.
- Prepayment fees, quote expiry, and provider confirmation are outside current scope.
- Estimate must not move money or close the loan.

Expected Result:

- Household has approximate payoff context.
- Loan state does not change.

Failure Result:

- If estimate cannot be meaningfully derived, no payoff estimate is treated as authoritative.

## Mark Completed

Trigger:

- Household determines the loan is fully repaid.

Preconditions:

- Loan is Active or Needs Review.
- Recorded remaining principal is zero or household confirms obligation is settled.

Business Rules:

- Completion ends active obligation tracking.
- Completion preserves history.
- Completion does not guarantee lender-confirmed closure.

Expected Result:

- Loan becomes Completed.
- Past payments remain reviewable.

Failure Result:

- If residual obligation is uncertain, loan remains Needs Review.

## Cancel Loan

Trigger:

- Household determines a loan was not disbursed, was voided, or should no longer be treated as active because it did not become a real obligation.

Preconditions:

- Loan exists.
- Household has reason to treat obligation as cancelled rather than repaid.

Business Rules:

- Cancellation is not repayment.
- Cancellation must not create money movement.
- History remains if the loan had household meaning.

Expected Result:

- Loan becomes Cancelled.

Failure Result:

- If cancellation conflicts with payment or disbursement evidence, loan enters Needs Review.

## Mark Defaulted

Trigger:

- Household recognizes that normal repayment has materially failed.

Preconditions:

- Loan is Active or Needs Review.
- Household understands that the loan is no longer following normal repayment behavior.

Business Rules:

- Default is a serious status, not a missed-payment reminder.
- Default does not erase obligation history.
- Default does not create advice, collection action, or automatic repayment.

Expected Result:

- Loan becomes Defaulted.
- History remains available.

Failure Result:

- If default status is uncertain, loan remains Needs Review.

## Archive Loan

Trigger:

- Household wants a non-active loan out of current view.

Preconditions:

- Loan is Completed, Cancelled, Defaulted, or otherwise no longer active for daily operation.

Business Rules:

- Archive is not deletion.
- Archive does not change repayment history.
- Active unresolved obligations should not be archived without review.

Expected Result:

- Loan becomes Archived for current-use purposes.
- History remains available.

Failure Result:

- If active obligation remains unclear, loan enters or stays Needs Review.

