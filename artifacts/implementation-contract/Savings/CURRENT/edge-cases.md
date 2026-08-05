# Edge Cases Contract

## Duplicate Renewal

Expected behavior: second renewal attempt is rejected or treated idempotently; no duplicate Saving/cycle; no duplicate Ledger entries.

## Withdraw After Close

Expected behavior: reject action; state unchanged; no Ledger write; optional informational error.

## Renew After Completion

Expected behavior: reject action; completed product cannot renew; create a new saving only through Create Saving if user wants another product.

## Renew After Maturity Review Expired

Expected behavior: refresh provider/current state; do not use stale package/rate; require manual review.

## Provider Changed Package

Expected behavior: same-package renewal blocked if unavailable; create/maintain package warning; no Ledger write.

## Rate Changed

Expected behavior: require explicit acceptance; saved preference cannot accept new rate automatically.

## Account Deleted or Archived

Expected behavior: funding/settlement action rejected; existing active product remains Active/Awaiting Renewal; require valid account before settlement.

## Insufficient Balance

Expected behavior: funding cannot confirm; state remains Draft/Pending Funding or moves Cancelled if failure confirmed; no fake savings principal.

## Duplicate Notification

Expected behavior: suppress or idempotently update notification/review; one decision purpose remains.

## Partial Early Withdrawal

Expected behavior: not supported as standard. If provider-confirmed partial actual exists, route to exception review and post actual payout only.

## Cancelled Renewal

Expected behavior: if no new provider cycle/ledger actual occurred, remain Awaiting Renewal/Grace Period; if provider actual occurred, correct via settlement/review, not silent rollback.

## Early Withdrawal Preview Stale

Expected behavior: confirmation blocked; regenerate preview before confirm.

## Inbox Dismissed

Expected behavior: dismissal never renews, withdraws, settles, or posts Ledger. Matured product remains unresolved unless a non-action dismissal is explicitly allowed by state.

## Provider Settlement Mismatch

Expected behavior: create failed settlement review; post correction only through Ledger correction ownership; provider actual outranks estimate.

## Weekend/Holiday Maturity

Expected behavior: maturity reminder can use contract date; Ledger settlement uses actual posting/settlement date.

## Historical Import

Expected behavior: import into best-known state; do not create Ledger entries unless historical money movement is confirmed and non-duplicative.

## Health Suggests Action

Expected behavior: ignored for mutation. Health cannot trigger Savings action.

## Planning Paused Saving

Expected behavior: active Savings state unchanged. Only planned future contributions pause in Planning.

