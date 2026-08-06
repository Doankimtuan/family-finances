# Acceptance Checklist

## State And Actions

- [ ] Every Recognize Investment action creates Recognized state or fails without side effects.
- [ ] Activate Holding is allowed only from Recognized or Under Review.
- [ ] Archived holdings cannot become Active.
- [ ] Exited holdings cannot become Active without new recognition.
- [ ] Active, Under Review, Impaired, and Partially Exited holdings cannot be archived.
- [ ] Every forbidden transition leaves prior state unchanged.
- [ ] Duplicate confirmed actions do not create duplicate state changes.

## Money Correctness

- [ ] Ledger writes occur only when real money moves.
- [ ] Investments never writes cash movement independently of Transactions.
- [ ] Estimated value updates never create Ledger writes.
- [ ] Unrealized gain/loss never creates spendable cash.
- [ ] Contribution amount is never treated as gain.
- [ ] Investment purpose never creates Planning capacity.
- [ ] Investment value never completes Goals by default.
- [ ] Partial exit records remaining exposure or sends holding to Under Review.
- [ ] Full exit removes active exposure and preserves history.

## Inbox And Notifications

- [ ] No Inbox item is created for complete normal tracking.
- [ ] Missing identity creates a high-priority review item.
- [ ] Unclear ownership/visibility creates a high-priority review item.
- [ ] Unclear full-exit proceeds creates a high-priority review item.
- [ ] Inbox acknowledgment never changes money.
- [ ] Inbox never recommends buy, sell, hold, switch, or rebalance.
- [ ] Notifications never encourage market timing or trading.

## Permissions

- [ ] Viewer cannot mutate investment records.
- [ ] Background Worker cannot create, exit, impair, cancel, reclassify, archive, or recommend.
- [ ] System cannot automatically trade, rebalance, exit, contribute, or recommend.
- [ ] Health never writes investment data.
- [ ] Planning and Goals never mutate investment state.
- [ ] Permission failure leaves state unchanged.

## Validation

- [ ] Holding identity is required for activation.
- [ ] Asset class can be unknown only when explicitly marked unknown.
- [ ] Valuation source can be unknown only when explicitly marked unknown.
- [ ] Valuation date can be unknown only when explicitly marked unknown.
- [ ] Manual values remain distinguishable from provider/statement values.
- [ ] Reclassification requires a target domain or remains Under Review.
- [ ] Archive requires terminal non-active state.

## Rejected Scope

- [ ] Buy/sell/hold recommendations are impossible.
- [ ] Automated trading is impossible.
- [ ] Automated rebalancing is impossible.
- [ ] Market-timing prompts are impossible.
- [ ] Detailed tax optimization is impossible.
- [ ] Crypto trading depth is impossible.
- [ ] Unrealized value as plan capacity is impossible.
