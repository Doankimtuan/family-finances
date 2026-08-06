# Inbox Flow

## Principles

- Inbox owns decisions and acknowledgment.
- Savings owns product facts and post-decision lifecycle.
- Inbox acknowledgment never writes Ledger by itself.
- Savings maturity does not auto-resolve.
- Generic notifications should not crowd Inbox.

## ReviewItem Types

### Maturity Reminder

Creation: product enters maturity reminder window.

Priority: normal; high if maturity is near and no decision exists.

Expiration: expires when product matures, is renewed, withdrawn, closed, or archived.

Auto resolution: no.

Manual review: yes.

Partner assignment: optional v1 for material balances.

History: record reminder creation and final decision link.

### Matured Product Decision

Creation: maturity date reached or grace period begins.

Priority: high.

Expiration: expires after product is completed, renewed, closed early, cancelled, or archived.

Auto resolution: no.

Manual review: required.

Partner assignment: v1 for shared/material savings.

History: record selected action, actor, timestamp, and linked product/cycle.

### Early Withdrawal Confirmation

Creation: household requests early withdrawal after preview.

Priority: high; urgent if emergency.

Expiration: expires when confirmed, cancelled, product matures, or product is no longer active.

Auto resolution: no.

Manual review: required.

Partner assignment: v1 for material/shared savings.

History: record preview, decision, final outcome.

### Penalty Warning

Creation: early withdrawal preview shows material penalty or forfeiture.

Priority: high when withdrawal is pending; normal otherwise.

Expiration: expires when withdrawal cancelled, confirmed, or preview becomes stale.

Auto resolution: no.

Manual review: required if tied to withdrawal.

Partner assignment: follows withdrawal confirmation.

History: record penalty acknowledged.

### Rate or Package Change Warning

Creation: v1 only, when known rate/package change affects renewal decision.

Priority: normal; high during maturity decision.

Expiration: expires when decision made or product no longer applicable.

Auto resolution: no during maturity; may archive if product closed.

Manual review: yes if decision required.

Partner assignment: optional.

History: record changed fact and household decision.

### Failed Funding or Settlement Review

Creation: v1 only, when funding/settlement fails, reverses, duplicates, or mismatches expected.

Priority: high.

Expiration: expires when corrected, cancelled, or confirmed as accepted discrepancy.

Auto resolution: no.

Manual review: required.

Partner assignment: optional unless household policy requires.

History: record correction path and final financial truth.

## Priority Rules

High:

- Matured product decision.
- Early withdrawal confirmation.
- Failed funding/settlement review.
- Emergency withdrawal.

Normal:

- Maturity reminder outside urgent window.
- Rate/package warning not yet actionable.
- Interest paid notification if treated as Inbox-worthy.

Low:

- Non-decision informational items should be notifications, not Inbox.

