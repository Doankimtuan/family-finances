# Edge Cases

## Source And Data Edge Cases

- Source transaction is deleted, corrected, reversed, or refunded.
- Provider sends duplicate notification.
- Manual transaction and provider import refer to the same event.
- Merchant name is vague, missing, or misleading.
- Amount differs between authorization and posted transaction.
- Currency or exchange-rate context is missing.
- Account or card source is no longer active.
- Receipt exists but transaction has not appeared.
- Transaction appears but receipt is lost.

## Decision Edge Cases

- Both partners resolve the same item at nearly the same time.
- One partner disagrees with a prior resolution.
- Item is resolved to the wrong jar or category.
- Item is dismissed by mistake.
- Item is deferred repeatedly.
- Household cannot identify the spender.
- Item needs information from a third party.
- Multiple items depend on the same underlying decision.

## Time Edge Cases

- Bill reminder expires after due date.
- Savings maturity date changes.
- Provider posts an update after the item was resolved.
- Household reviews after month close.
- Travel or holidays create delayed review.
- Time zone differences affect due-date interpretation.

## Financial Event Edge Cases

- Cancellation.
- Partial refund.
- Full refund.
- Chargeback or dispute.
- Fee reversal.
- Rate change.
- Early withdrawal penalty.
- Auto-renewal before household decision.
- Payment failure.
- Late fee.
- Duplicate card authorization.
- Family reimbursement.
- Cash payment without evidence.

## Integration Edge Cases

- Provider outage.
- Lost connection or expired consent.
- Imported item lacks household membership context.
- Background worker creates item after user already acted manually.
- Provider sends marketing or informational message that resembles a decision.
- E-invoice is issued after the cash or QR payment already happened.

No solutions are proposed in this discovery phase.
