# Action Contract

## Create Loan

Trigger:

- User chooses to track a borrowing obligation.

Actor:

- Partner or Admin.

Preconditions:

- Actor has active household membership.
- Obligation is a scheduled or socially recognized loan.
- Required loan facts are supplied.

Validation:

- Lender is identifiable.
- Original principal is positive.
- Broad loan type is allowed.
- Repayment expectation is known enough for due awareness.
- Obligation is not a credit-card revolving balance, jar, goal, account, or plan.

Business Rules:

- BR-01, BR-02, BR-02a, recorded loan truth, broad type only.

Success Result:

- Loan enters Active state.
- Loan has lender, principal, recorded remaining principal, type, term, and repayment expectation.
- Upcoming due awareness becomes eligible.

Failure Result:

- No Active loan is created.
- Previous state remains unchanged.
- User receives validation, permission, or boundary failure.

## Edit Loan Details

Trigger:

- User corrects or clarifies loan recognition.

Actor:

- Partner or Admin.

Preconditions:

- Loan exists.
- Loan is Active, Needs Review, Completed, Cancelled, Defaulted, or Archived.
- Change preserves historical meaning.

Validation:

- Updated details do not change Loans into another domain.
- Lender, name, broad type, note, and household relevance remain meaningful.
- Historical repayment facts are not silently rewritten.

Business Rules:

- Recorded loan truth, completion is not erasure, invalid attempts preserve state.

Success Result:

- Loan remains in its prior valid state unless edit resolves Needs Review.
- Updated details are visible to authorized household users.

Failure Result:

- Edit is rejected.
- Existing facts and state remain unchanged.

## Update Rate Awareness

Trigger:

- User records a relevant rate change or promotional-rate change.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Active or Needs Review.
- Rate change affects repayment understanding.

Validation:

- Rate value is present and non-negative.
- Effective date or period meaning is known.
- Change is not benchmark/margin modeling.
- User-entered rate is not marked provider-confirmed in current scope.

Business Rules:

- Rate awareness is simple.
- Recorded loan truth.

Success Result:

- Loan repayment expectation and rate awareness are updated.
- Needs Review may resolve to Active if uncertainty is removed.

Failure Result:

- Invalid rate change is rejected.
- If rate truth remains unclear, loan remains or enters Needs Review.

## Review Loan

Trigger:

- User checks loan truth because of due date, mismatch, partner question, stale data, or provider/family reference.

Actor:

- Partner or Admin.

Preconditions:

- Loan exists.

Validation:

- Review target is a loan.
- Review does not claim provider confirmation unless evidence is explicitly available outside current scope.

Business Rules:

- Review is confidence-only.
- Review does not move money.
- Review does not automatically change recorded principal.

Success Result:

- Loan remains confirmed, is corrected through allowed actions, or enters Needs Review.

Failure Result:

- If review cannot complete, loan remains in previous valid state or Needs Review.

## Record Scheduled Repayment

Trigger:

- User records or confirms an expected repayment.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Active.
- Payment source is known and eligible through Accounts.
- Amount and payment date are known.

Validation:

- Amount is positive.
- Payment source is active and household-relevant.
- Payment is not a virtual allocation.
- Payment is not automatically executed by Loans.
- Duplicate payment is not knowingly created.

Business Rules:

- Repayment dual meaning.
- Actual beats planned.
- BR-01.

Success Result:

- Transaction-owned ledger movement is recorded or referenced.
- Loan repayment history is updated.
- Recorded remaining principal is reduced according to known repayment meaning.
- Loan remains Active or becomes Completed if fully repaid.

Failure Result:

- No money movement or loan progress is recorded by Loans.
- If payment truth is unclear, loan enters Needs Review.

## Record Partial Or Irregular Repayment

Trigger:

- User records payment that differs from expected schedule.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Active.
- Payment source, amount, and date are known.

Validation:

- Amount is positive.
- Difference from expected payment is allowed and explainable.
- Unknown fee, penalty, or interest components are not invented.

Business Rules:

- Actual beats planned.
- Recorded loan truth.

Success Result:

- Actual repayment is recorded.
- Loan remains Active if future expectation remains clear.
- Loan enters Needs Review if future expectation is uncertain.

Failure Result:

- Previous valid state is preserved.
- Loan enters Needs Review if interpretation is unclear.

## Estimate Early Payoff

Trigger:

- User asks for approximate payoff burden.

Actor:

- Partner, Admin, or Viewer.

Preconditions:

- Loan is Active.
- Recorded remaining principal exists.

Validation:

- Estimate uses recorded loan truth only.
- Estimate is not labeled as lender quote.
- Estimate does not include invented fees.

Business Rules:

- Early payoff is estimate.
- BR-01.

Success Result:

- Payoff estimate is shown as planning context.
- Loan state and money remain unchanged.

Failure Result:

- No authoritative payoff amount is shown.
- Loan state remains unchanged.

## Mark Completed

Trigger:

- User determines obligation is fully repaid or settled.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Active or Needs Review.
- Recorded remaining principal is zero, or household confirms settlement.

Validation:

- Loan is not already Archived.
- Completion is not used to hide uncertain active obligation.
- Completion does not claim lender closure unless evidence exists outside current scope.

Business Rules:

- Completion is not erasure.
- Completion is not provider proof.

Success Result:

- Loan becomes Completed.
- Payment history remains available.
- Completion Inbox item may be created only if human acknowledgement is required.

Failure Result:

- Loan remains Needs Review if residual obligation is uncertain.

## Cancel Loan

Trigger:

- User determines loan was voided, not disbursed, or not a real active obligation.

Actor:

- Partner or Admin.

Preconditions:

- Loan exists.
- Cancellation reason is known enough for household meaning.

Validation:

- Cancellation is not repayment.
- Cancellation does not conflict with known payment or disbursement evidence.

Business Rules:

- Invalid attempts preserve state.
- Cancellation creates no money movement.

Success Result:

- Loan becomes Cancelled.
- History remains available.

Failure Result:

- Loan enters Needs Review if evidence conflicts.

## Mark Defaulted

Trigger:

- User recognizes normal repayment has materially failed.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Active or Needs Review.
- Household understands the status is serious and not only a reminder.

Validation:

- Default is not used for ordinary upcoming payment.
- Default does not create advice, collection action, or automatic repayment.

Business Rules:

- Completion is not erasure.
- No automatic repayment.

Success Result:

- Loan becomes Defaulted.
- History remains available.

Failure Result:

- Loan remains Needs Review if status is uncertain.

## Archive Loan

Trigger:

- User removes non-active loan from current operational view.

Actor:

- Partner or Admin.

Preconditions:

- Loan is Completed, Cancelled, Defaulted, or Needs Review with no current-use role.

Validation:

- Active unresolved obligations are not archived without review.
- Archive is not deletion.

Business Rules:

- Completion is not erasure.
- Active unresolved loans are not safely archived.

Success Result:

- Loan becomes Archived.
- History remains available.

Failure Result:

- Loan enters or remains Needs Review.

## Recover Loan State

Trigger:

- User discovers completed, cancelled, defaulted, or archived state is wrong or incomplete.

Actor:

- Partner or Admin.

Preconditions:

- Loan exists in Completed, Cancelled, Defaulted, Archived, or Needs Review.

Validation:

- Recovery path is allowed by state contract.
- Reason for recovery is explainable.

Business Rules:

- Invalid attempts preserve state.
- Unclear truth needs review.

Success Result:

- Loan moves through Needs Review before returning to Active or Completed.

Failure Result:

- Loan remains in previous valid state or Needs Review.

## Abandon Draft

Trigger:

- User stops creating a draft loan before activation.

Actor:

- Draft creator, Partner, or Admin.

Preconditions:

- Loan is Draft.

Validation:

- Draft has not become Active.

Business Rules:

- Draft has no active financial history.

Success Result:

- Draft becomes Abandoned Draft.

Failure Result:

- Active or historical loans cannot be abandoned as drafts.

