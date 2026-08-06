# Edge Case Contract

## Duplicate Action

Trigger:

- Same purchase, repayment, refund, statement, or close action is submitted more than once.

Expected behavior:

- Duplicate must not create duplicate obligation, duplicate ledger movement, or duplicate state transition.

Business result:

- Prior valid result remains authoritative.

User-visible result:

- User sees duplicate or already-completed feedback.

Recovery behavior:

- Review Card if duplicate status is uncertain.

## Expired State

Trigger:

- User attempts normal purchase or repayment behavior on Expired card.

Expected behavior:

- New normal purchase is blocked.
- Repayment or refund may proceed only if tied to existing obligation and valid state.

Business result:

- Card remains Expired or enters Needs Review.

User-visible result:

- User sees expiry warning.

Recovery behavior:

- Recover through Needs Review or record replacement meaning.

## Cancelled Operation

Trigger:

- User exits draft, review, or edit before completion.

Expected behavior:

- No partial business change is applied.

Business result:

- Previous valid state remains.

User-visible result:

- User sees unchanged card state.

Recovery behavior:

- User may resume valid action.

## Provider Changes

Trigger:

- Issuer changes limit, due date, statement date, fee, interest, card status, or replacement.

Expected behavior:

- User-entered update or review is required.
- Product must not invent provider-confirmed truth.

Business result:

- Card is updated or enters Needs Review.

User-visible result:

- User sees that provider truth needs review.

Recovery behavior:

- Edit Card Facts or Review Card.

## Manual Adjustment

Trigger:

- User corrects amount, billing period, refund, fee, or statement meaning.

Expected behavior:

- Adjustment must preserve ledger truth and historical meaning.

Business result:

- Card facts update or Needs Review remains.

User-visible result:

- User sees corrected meaning or unresolved review.

Recovery behavior:

- Further review or correction through allowed actions.

## Interrupted Process

Trigger:

- Network interruption, navigation away, or unfinished submission.

Expected behavior:

- Previous valid state remains until success is confirmed.

Business result:

- No uncertain money movement is assumed.

User-visible result:

- User sees retry or unchanged state.

Recovery behavior:

- Retry action or Review Card.

## Conflict

Trigger:

- Two users update card facts, statement, repayment, or closure with conflicting meaning.

Expected behavior:

- Conflicting truth enters Needs Review.
- No silent overwrite of financial meaning.

Business result:

- Last valid non-conflicting state remains authoritative until resolved.

User-visible result:

- User sees conflict/review state.

Recovery behavior:

- Authorized user reviews and chooses a valid correction.

## Invalid Money Interpretation

Trigger:

- User attempts to count available credit as cash, record refund as ordinary income by default, or record cashback as profit without real account inflow.

Expected behavior:

- Action is rejected or requires corrected meaning.

Business result:

- No invalid money movement occurs.

User-visible result:

- User sees BR-01 boundary message.

Recovery behavior:

- Re-enter as valid card obligation adjustment or real account movement.

## Card-Origin Installment Duplicate

Trigger:

- User attempts to record card-origin installment and Loan for the same obligation.

Expected behavior:

- Duplicate obligation is blocked or marked Needs Review.

Business result:

- No duplicate future pressure is created.

User-visible result:

- User sees boundary review message.

Recovery behavior:

- Review whether obligation belongs to Cards, Loans, or remains card-origin awareness.

## Health Mutation Attempt

Trigger:

- Health insight attempts to change card state, repayment, or balance.

Expected behavior:

- Attempt is forbidden.

Business result:

- Card remains unchanged.

User-visible result:

- No operational card change occurs from Health.

Recovery behavior:

- User performs allowed Cards action if needed.
