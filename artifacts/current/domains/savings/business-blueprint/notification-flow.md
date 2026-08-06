# Notification Flow

## Principles

- Notifications inform; Inbox asks for decisions.
- No notification writes Ledger.
- No notification changes Savings state.
- Notification noise must be minimized.

## Reminder

Trigger: upcoming maturity window.

Result: notification and/or Inbox reminder depending on urgency.

Ledger impact: none.

Inbox impact: creates or references maturity reminder if decision-worthy.

## Maturity

Trigger: product reaches maturity or grace period.

Result: matured product decision is created in Inbox.

Ledger impact: none.

Inbox impact: high-priority ReviewItem.

## Renewal

Trigger: renewal completed.

Result: notification may confirm new cycle.

Ledger impact: none from notification; renewal flow already handled ledger.

Inbox impact: decision resolved.

## Rate Change

Trigger: known rate change at maturity/review.

Result: v1 warning, not advice.

Ledger impact: none.

Inbox impact: tied to renewal decision if actionable.

## Package Unavailable

Trigger: selected/saved package unavailable.

Result: v1 warning and manual review.

Ledger impact: none.

Inbox impact: maturity decision must not use unavailable package.

## Early Withdrawal Completed

Trigger: provider/manual confirmation of early withdrawal settlement.

Result: notification confirms closure and net payout.

Ledger impact: none from notification; withdrawal flow writes ledger.

Inbox impact: withdrawal confirmation resolved.

## Interest Paid

Trigger: posted interest confirmed.

Result: notification allowed if meaningful.

Ledger impact: none from notification; interest posting flow writes ledger.

Inbox impact: no Inbox item unless reconciliation/action needed.

## Errors

Trigger: funding, settlement, duplicate action, provider mismatch, or correction required.

Result: error notification plus Inbox review if user decision/action required.

Ledger impact: none from notification.

Inbox impact: failed funding/settlement review.

