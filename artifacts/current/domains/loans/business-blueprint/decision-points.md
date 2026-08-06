# Decision Points

## Record Loan

Who makes it:

- Household user.

Why:

- The household decides an obligation is relevant to track.

Possible outcomes:

- Activate loan.
- Keep as draft.
- Reject as out of scope.

Business impact:

- Future repayment burden becomes visible.

## Confirm Household Relevance

Who makes it:

- Household user, often with partner context.

Why:

- A personal or family loan may or may not affect shared finances.

Possible outcomes:

- Treat as household-relevant.
- Treat as personal but visible.
- Leave unclear and Needs Review.

Business impact:

- Affects partner trust and planning interpretation.

## Correct Loan Facts

Who makes it:

- Household user.

Why:

- Lender, principal, schedule, rate, or note may be wrong or stale.

Possible outcomes:

- Correction accepted.
- Correction rejected.
- Loan enters Needs Review.

Business impact:

- Preserves trust without silently rewriting history.

## Record Repayment

Who makes it:

- Household user.

Why:

- A real payment occurred and must affect both money record and loan progress.

Possible outcomes:

- Scheduled repayment recorded.
- Irregular repayment recorded.
- Loan enters Needs Review.

Business impact:

- Updates repayment history and recorded remaining principal.

## Interpret Difference From Plan

Who makes it:

- Household user.

Why:

- Actual payment may differ from expected payment.

Possible outcomes:

- Accept as partial, early, overpayment, or corrected payment.
- Mark uncertain.

Business impact:

- Prevents false schedule certainty.

## Mark Completed

Who makes it:

- Household user.

Why:

- Household believes the obligation is settled.

Possible outcomes:

- Completed.
- Needs Review if residual uncertainty exists.

Business impact:

- Removes loan from active repayment pressure while preserving history.

## Cancel

Who makes it:

- Household user.

Why:

- Loan did not become a real active obligation or was voided.

Possible outcomes:

- Cancelled.
- Needs Review if evidence conflicts.

Business impact:

- Prevents false active liability.

## Mark Defaulted

Who makes it:

- Household user.

Why:

- Normal repayment has materially failed.

Possible outcomes:

- Defaulted.
- Needs Review if status is uncertain.

Business impact:

- Signals serious repayment breakdown without creating advice or automation.

## Archive

Who makes it:

- Household user.

Why:

- Loan is no longer needed in current view.

Possible outcomes:

- Archived.
- Needs Review if active obligation is unresolved.

Business impact:

- Keeps current view clean while preserving history.

## Use Early Payoff Estimate

Who makes it:

- Household user.

Why:

- Household wants approximate payoff pressure.

Possible outcomes:

- Estimate used for planning context.
- Estimate ignored.

Business impact:

- Does not move money, close loan, or act as lender quote.

