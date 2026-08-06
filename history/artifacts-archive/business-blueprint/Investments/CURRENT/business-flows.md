# Business Flows

## Recognize Investment

Trigger:

- User identifies an asset as investment-relevant.

Preconditions:

- Asset is believed to be risk-bearing or value-changing.
- Asset is not already fully represented by Accounts, Transactions, Savings, Goals, or Planning.

Business Rules:

- Investment must not be treated as cash.
- Broad asset class may be unknown but must not be falsely precise.
- Ownership/visibility may be uncertain but must be explicit.

Expected Result:

- Holding enters Recognized or Active state with minimum household-understandable facts.

Failure Result:

- Holding remains Unresolved if it cannot be distinguished from another domain or lacks enough recognition context.

## Activate Holding

Trigger:

- Household confirms that the investment is currently owned or relevant.

Preconditions:

- Holding identity is known.
- Asset class is known or marked unknown.
- Ownership/visibility context is known or marked uncertain.

Business Rules:

- Active investment value is estimated unless realized as cash.
- Contribution amount may be exact, estimated, or unknown.

Expected Result:

- Holding becomes Active.

Failure Result:

- Holding remains Recognized or Under Review.

## Record Contribution Context

Trigger:

- User records or confirms money put into an investment.

Preconditions:

- Holding exists or is being recognized.
- Contribution belongs to investment exposure, not ordinary spending.

Business Rules:

- Real cash movement belongs to Transactions.
- Investments may describe contribution meaning.
- Contribution is not profit.

Expected Result:

- Investment contribution context is available for household interpretation.

Failure Result:

- Contribution remains unknown or disputed.

## Update Valuation

Trigger:

- User obtains a new value from provider, statement, receipt, market quote, family update, or manual estimate.

Preconditions:

- Holding is Active, Under Review, Impaired, or partially Exited.

Business Rules:

- Value requires valuation date when known.
- Value requires source or unknown source.
- Value is not cash unless realized through sale/redemption/settlement.
- Manual or uncertain values must not be presented as guaranteed.

Expected Result:

- Estimated value and value freshness are updated.

Failure Result:

- Prior value remains but may be stale or uncertain.

## Update Holding Facts

Trigger:

- User corrects name, asset class, quantity, cost context, liquidity, risk context, purpose, or ownership/visibility.

Preconditions:

- Holding exists.

Business Rules:

- Corrections must preserve household explanation.
- Purpose context must not create goal progress or plan capacity.
- Risk context must be descriptive, not advisory.

Expected Result:

- Holding remains in its current lifecycle state with corrected business facts.

Failure Result:

- Holding enters Under Review if correction creates ambiguity or conflict.

## Review Holding

Trigger:

- Household questions value, liquidity, ownership, risk, stale data, contribution, or classification.

Preconditions:

- Holding exists.

Business Rules:

- Review does not move money.
- Review does not recommend buy/sell/hold.
- Health and Inbox may read review context but do not decide strategy.

Expected Result:

- Holding is clarified, corrected, remains Active, enters Impaired, or proceeds to exit flow.

Failure Result:

- Holding remains Under Review with unresolved reason.

## Record Investment Income Context

Trigger:

- Dividend, coupon, distribution, or similar investment income is identified.

Preconditions:

- Income is linked or reasonably related to an investment holding.

Business Rules:

- Cash receipt belongs to Transactions.
- Investment income must not be treated as ordinary salary by default.
- Income may affect realized outcome only when business context supports it.

Expected Result:

- Household understands income as investment-related.

Failure Result:

- Income remains uncategorized or Under Review.

## Partial Exit

Trigger:

- Household sells, redeems, withdraws, transfers, or writes off part of a holding.

Preconditions:

- Holding is Active, Under Review, or Impaired.
- Exit amount or portion is known or estimated.

Business Rules:

- Real proceeds belong to Transactions and Accounts.
- Partial realized gain/loss may be known, estimated, or unknown.
- Remaining holding stays Active or Under Review.

Expected Result:

- Exited portion is recorded as realized context; remaining position continues.

Failure Result:

- Holding enters Under Review if proceeds, portion, or ownership is unclear.

## Full Exit

Trigger:

- Holding is fully sold, redeemed, repaid, surrendered, transferred out, or written off.

Preconditions:

- Household no longer owns or treats the holding as active.

Business Rules:

- Realized outcome replaces unrealized value for exited portion.
- No further market value updates occur after full exit.
- History remains preserved.

Expected Result:

- Holding enters Exited, Written Off, or Transferred Out.

Failure Result:

- Holding remains Under Review if exit confirmation is missing.

## Cancel

Trigger:

- Purchase/subscription never completes, or household decides the recognized investment is invalid before activation.

Preconditions:

- No active holding exists, or provider/family confirms no ownership formed.

Business Rules:

- If cash moved and returned, Transactions owns refund/reversal truth.
- Cancelled investment does not produce realized performance.

Expected Result:

- Holding enters Cancelled and may later be Archived.

Failure Result:

- Holding remains Under Review if cash or ownership status is unclear.

## Reclassify

Trigger:

- User determines the item is actually Savings, Account cash, Goal intention, Loan, family support, or another domain object.

Preconditions:

- Holding is Recognized, Active, or Under Review.

Business Rules:

- Reclassification must not duplicate responsibility.
- Existing cash movements remain transaction facts.
- Investment history is preserved if it was ever treated as investment-relevant.

Expected Result:

- Investment exits active ownership for this domain or remains with corrected classification.

Failure Result:

- Holding remains Under Review.

## Archive

Trigger:

- Holding is Cancelled, Exited, Written Off, Transferred Out, or no longer operational.

Preconditions:

- No active investment behavior remains.

Business Rules:

- Archive never deletes financial memory.
- Archived holdings do not affect active investment exposure.

Expected Result:

- Holding becomes historical.

Failure Result:

- Archive is blocked if active exposure or unresolved review remains.
