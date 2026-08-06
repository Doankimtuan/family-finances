# Action Contract

## Recognize Investment

Trigger:

- User identifies an asset as investment-relevant.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Actor has active household access.
- Asset is believed to be risk-bearing or value-changing.
- Asset is not already fully represented by Accounts, Transactions, Savings, Goals, or Planning.

Validation:

- Holding identity is present enough for household recognition.
- Asset class is supplied or explicitly unknown.
- Ownership/visibility context is supplied or explicitly unclear.
- Contribution amount is supplied, estimated, or explicitly unknown.

Business Rules:

- INV-BR-001, INV-BR-004, INV-BR-010, INV-BR-011, INV-BR-015.

Success Result:

- Holding enters Recognized state.
- No money moves.
- No Planning update occurs.

Failure Result:

- No holding is recognized.
- Prior state is unchanged.
- User receives validation or permission failure.

## Activate Holding

Trigger:

- User confirms that the recognized investment is currently owned or household-relevant.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Recognized or Under Review.
- Ownership is confirmed enough to treat the holding as active exposure.

Validation:

- Holding identity is known.
- Asset class is known or explicitly unknown.
- Ownership/visibility is known or explicitly unclear.
- Holding is not Cancelled, Exited, Written Off, Transferred Out, or Archived.

Business Rules:

- INV-BR-001, INV-BR-010, INV-BR-011.

Success Result:

- Holding becomes Active.
- Existing valuation remains estimated unless realized cash exists.

Failure Result:

- Holding remains Recognized or Under Review.

## Edit Holding Facts

Trigger:

- User changes holding name, asset class, quantity/units, cost context, liquidity, risk context, ownership/visibility, or optional purpose note.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding exists.
- Holding is Recognized, Active, Under Review, Impaired, or Partially Exited.

Validation:

- Updated facts do not convert holding into cash.
- Purpose note does not create goal progress or planning capacity.
- Risk context is descriptive only.
- Update does not erase historical meaning.

Business Rules:

- INV-BR-005, INV-BR-009, INV-BR-010, INV-BR-012, INV-BR-013, INV-BR-015.

Success Result:

- Holding remains in prior valid state unless uncertainty is resolved.
- If facts become contradictory, holding enters Under Review.

Failure Result:

- Update is rejected.
- Existing facts and state remain unchanged.

## Update Valuation

Trigger:

- User obtains a value from provider, statement, receipt, market quote, family update, or manual estimate.

Actor:

- Owner, Partner, Admin, or Background Worker only when future read-only data source is approved.

Preconditions:

- Holding is Active, Under Review, Impaired, or Partially Exited.
- Value represents estimated investment value, not realized cash.

Validation:

- Value is non-negative or explicitly unknown.
- Valuation date is supplied or explicitly unknown.
- Valuation source is supplied or explicitly unknown.
- Manual value is marked as manual or uncertain when applicable.

Business Rules:

- INV-BR-001, INV-BR-002, INV-BR-003, INV-BR-005, INV-BR-008.

Success Result:

- Estimated value context updates.
- Holding state remains unchanged unless stale/uncertain data causes Under Review or resolves Under Review.
- No Ledger write occurs.

Failure Result:

- Prior valuation remains.
- Holding may remain or enter Under Review if value is contradictory.

## Review Holding

Trigger:

- User questions stale value, ownership, liquidity, classification, contribution, exit proceeds, or risk.

Actor:

- Owner, Partner, Admin, or System when a deterministic review condition exists.

Preconditions:

- Holding exists.
- Holding is not Archived.

Validation:

- Review reason is investment-related.
- Review does not request buy/sell/hold advice.
- Review does not require Health, Goals, or Planning to decide.

Business Rules:

- INV-BR-009, INV-BR-010, INV-BR-013.

Success Result:

- Holding enters Under Review unless already in a more severe state.
- Review may create Inbox item according to Inbox contract.

Failure Result:

- State remains unchanged.
- Invalid review reason is rejected.

## Mark Impaired

Trigger:

- User identifies material doubt: default, scam suspicion, suspended redemption, family dispute, or unverifiable recoverability.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Active, Under Review, or Partially Exited.

Validation:

- Impairment reason is present.
- Impairment does not automatically write off value unless write-off action occurs.

Business Rules:

- INV-BR-008, INV-BR-009, INV-BR-011.

Success Result:

- Holding becomes Impaired.
- No money moves.

Failure Result:

- Holding remains in previous state.

## Record Investment Income Context

Trigger:

- Dividend, coupon, distribution, or similar investment income is identified.

Actor:

- Owner, Partner, Admin, or permitted Transactions-owned path.

Preconditions:

- Holding exists or is reasonably identifiable.
- Cash receipt is or can be represented by Transactions when money moved.

Validation:

- Income is investment-related.
- Income is not ordinary salary by default.
- If no cash receipt exists, it remains read-only context.

Business Rules:

- INV-BR-007.

Success Result:

- Income is associated as investment context.
- Ledger writes occur only through Transactions when money moved.

Failure Result:

- Income remains uncategorized or Under Review.

## Partial Exit

Trigger:

- User sells, redeems, repays, transfers, or writes off part of holding.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Active, Under Review, or Impaired.
- Portion or amount is known, estimated, or explicitly unknown.

Validation:

- Exit type is known: sale, redemption, repayment, surrender, transfer, write-off, or unknown.
- Real proceeds are linked to Transactions when cash moved.
- Remaining exposure can be determined or marked Under Review.

Business Rules:

- INV-BR-001, INV-BR-006, INV-BR-012.

Success Result:

- Holding becomes Partially Exited or remains Active if remaining exposure is clear.
- Realized outcome is recorded for exited portion when known.
- No market value is treated as cash.

Failure Result:

- Holding enters or remains Under Review.

## Full Exit

Trigger:

- User confirms holding is fully sold, redeemed, repaid, surrendered, transferred, or no longer active.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Active, Under Review, Impaired, or Partially Exited.

Validation:

- Exit type is known or explicitly unknown.
- Final proceeds, transfer, or write-off status is known or explicitly uncertain.
- No active exposure remains.

Business Rules:

- INV-BR-006, INV-BR-012.

Success Result:

- Holding becomes Exited, Written Off, or Transferred Out.
- Realized outcome replaces unrealized value for the exited holding.

Failure Result:

- Holding remains Under Review.

## Cancel Investment

Trigger:

- User confirms purchase/subscription/deal never formed active ownership.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Recognized or Under Review.
- No active ownership exists.

Validation:

- If cash moved, refund/reversal status is handled by Transactions.
- Cancellation is not used to hide an active loss.

Business Rules:

- INV-BR-004, INV-BR-012.

Success Result:

- Holding becomes Cancelled.

Failure Result:

- Holding remains Under Review.

## Reclassify Holding

Trigger:

- User determines item belongs to another domain.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Recognized, Active, Under Review, or Impaired.

Validation:

- Target domain is identified.
- Reclassification does not duplicate ownership.
- Existing transaction facts remain with Transactions.

Business Rules:

- INV-BR-015.

Success Result:

- Investments no longer owns active business truth for the item.
- Historical investment context remains if needed.

Failure Result:

- Holding remains Under Review.

## Archive Holding

Trigger:

- User archives non-operational investment history.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Holding is Cancelled, Exited, Written Off, or Transferred Out.
- No active exposure remains.

Validation:

- Holding is not Active, Under Review, Impaired, or Partially Exited.
- Archiving does not delete historical meaning.

Business Rules:

- INV-BR-012.

Success Result:

- Holding becomes Archived.

Failure Result:

- Archive is rejected; state remains unchanged.
