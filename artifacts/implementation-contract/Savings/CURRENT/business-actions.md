# Business Actions Contract

## Create Saving

Preconditions: actor can manage household money; provider/name, product type, principal, funding source, settlement destination, term, rate, maturity/start dates are known enough for setup.

Validation: principal positive; funding source valid; settlement destination valid; savings is not a jar/goal; expected interest is marked expected only.

Business rules: Draft creation writes no Ledger unless created as manually confirmed Active.

Success result: Draft or Active if funding already confirmed.

Failure result: no state change; no Ledger write.

## Initiate Funding

Preconditions: state Draft; funding source and settlement destination valid.

Validation: actor permission; funding amount equals requested principal unless provider actual differs.

Business rules: standard target is Pending Funding; MVP may go Active only for confirmed/manual funding.

Success result: Pending Funding or Active.

Failure result: Draft remains or Cancelled if user cancels; no duplicate Ledger write.

## Confirm Funding

Preconditions: state Pending Funding or Draft with manual confirmed funding.

Validation: provider/manual actual principal known; product terms known.

Business rules: provider-confirmed actual outranks requested amount.

Success result: Active; funding Ledger entries created.

Failure result: Pending Funding remains or moves Cancelled with reversal/correction if needed.

## Cancel Saving

Preconditions: state Draft or Pending Funding before provider contract becomes active.

Validation: no active provider-held principal, or funding rejected/reversed.

Business rules: Active savings cannot be cancelled; it must be withdrawn/closed.

Success result: Cancelled.

Failure result: no state change.

## Edit Renewal Policy

Preconditions: product not Archived, Completed, Closed Early, or Cancelled.

Validation: policy is preference/pre-fill only.

Business rules: editing renewal policy never moves money, never resolves Inbox, and never creates Ledger entries.

Success result: policy updated; state unchanged.

Failure result: state unchanged.

## Mature Saving

Preconditions: state Active; maturity date reached or grace window reached.

Validation: product not already Completed, Renewed, Closed Early, Cancelled, or Archived.

Business rules: maturity creates decision context; expected/accrued interest remains non-ledger.

Success result: Grace Period if grace known, else Awaiting Renewal.

Failure result: Active remains; no Ledger write.

## Renew

Preconditions: state Grace Period or Awaiting Renewal; household decision recorded; package/rate accepted.

Validation: no saved-preference-only execution; selected package available or provider terms confirmed; rate accepted if changed.

Business rules: create immutable new cycle; prior cycle closes/rolls; no duplicate saving; no duplicate Ledger writes.

Success result: Renewed then Active.

Failure result: remain Grace Period/Awaiting Renewal; Inbox stays unresolved or becomes review.

## Switch Package

Preconditions: v1; state Grace Period or Awaiting Renewal; household decision recorded.

Validation: selected package exists or provider confirms terms.

Business rules: same as Renew, but new cycle terms differ.

Success result: Renewed then Active.

Failure result: Awaiting Renewal remains; package warning/review if package unavailable.

## Withdraw All at Maturity

Preconditions: state Grace Period or Awaiting Renewal; household decision recorded; settlement destination valid.

Validation: product not already Completed/Closed Early/Archived; provider/manual settlement actual known before posting.

Business rules: write actual principal/interest settlement only once.

Success result: Completed.

Failure result: Awaiting Renewal or failed settlement review.

## Preview Early Withdrawal

Preconditions: state Active.

Validation: early withdrawal policy known enough for preview.

Business rules: preview never writes Ledger and never changes state.

Success result: preview shown; penalty warning/confirmation may be created.

Failure result: no state change.

## Confirm Early Withdrawal

Preconditions: state Active; preview shown; confirmation recorded.

Validation: actor permission; product still Active; settlement destination valid.

Business rules: write only provider/manual actual payout; emergency does not bypass confirmation.

Success result: Closed Early.

Failure result: Active remains or failed settlement review.

## Close Saving

Preconditions: state Completed or Closed Early.

Validation: no pending settlement or unresolved decision.

Business rules: closure/archival writes no Ledger.

Success result: Archived when archived.

Failure result: state unchanged.

## Correct Settlement

Preconditions: provider/manual actual differs from posted/expected amount.

Validation: correction belongs to Ledger ownership; Savings provides product context.

Business rules: correction writes only if real posted truth changes.

Success result: corrected Ledger and resolved review.

Failure result: review remains open.

