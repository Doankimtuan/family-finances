# Edge Cases

## Provider Disappears

Rule: stop renewal; create manual review; do not create new cycle.

Ledger: no write until provider/insurance/manual actual is confirmed.

Inbox: high-priority provider exception review.

Health: read-only risk insight only.

## Rate Changes

Rule: require explicit household acceptance before renewal at changed rate.

Ledger: none until renewal/settlement.

Inbox: rate-change warning attached to maturity decision.

## Emergency

Rule: emergency raises priority but does not bypass confirmation or ledger truth.

Ledger: writes only at actual settlement.

Inbox: high-priority early withdrawal confirmation.

## Manual Correction

Rule: correction must reconcile expected versus actual provider/ledger truth.

Ledger: correction/reversal only through Ledger ownership.

Inbox: review required if household decision or acknowledgment needed.

## Migration

Rule: imported records must be classified as Active, Completed, Closed Early, Cancelled, or Archived based on evidence.

Ledger: historical ledger entries only if confirmed and non-duplicative.

Inbox: create review for uncertain maturity/settlement only.

## Provider Merge

Rule: preserve historical provider snapshot; future cycles use new confirmed provider identity.

Ledger: none unless account/product movement is confirmed.

Inbox: review if maturity, settlement, or legal owner changes.

## Holiday or Weekend Maturity

Rule: maturity business action occurs on provider-effective settlement date; expected date remains contract date.

Ledger: writes on actual posting/settlement date.

Inbox: reminder remains active until decision/settlement.

## Duplicate Actions

Rule: second identical decision on resolved product is ignored or routed to duplicate review; no duplicate ledger write.

Ledger: no duplicate posting.

Inbox: duplicate action history may be recorded.

## Late Review

Rule: if household reviews after maturity/grace, use provider actual current state.

Ledger: no backdated estimate writes.

Inbox: decision remains high priority or becomes exception review.

## Package Removed

Rule: same-package renewal blocked; household chooses another available package or withdraws.

Ledger: none until action.

Inbox: package unavailable warning attached.

## Partial Withdrawal Request

Rule: not standard. Offer full withdrawal/no withdrawal. Provider-confirmed partial actual goes to exception flow.

Ledger: actual provider-confirmed payout only.

Inbox: exception review.

## Tax/Withholding Appears

Rule: record only provider-confirmed tax/withholding.

Ledger: write withheld/fee/tax only if actual.

Inbox: review if unexpected material difference.

