# Engineering Checklist

## Before Implementing Financial Writes

- [ ] Define canonical financial command ids and idempotency keys.
- [ ] Define event registry with producer, consumer, payload, causal links, and forbidden side effects.
- [ ] Add append-only ledger constraints.
- [ ] Add refund, reversal, and correction link constraints.
- [ ] Add household/account ownership constraints.
- [ ] Add source-domain ownership labels to read models.
- [ ] Add outbox/inbox event processing with deduplication.
- [ ] Add deterministic worker cursors and natural uniqueness keys.
- [ ] Add explicit pending/review states for external uncertainty.
- [ ] Add invariant test harness for account, transaction, product, planning, Inbox, and Health flows.

## Must-Test Scenarios

- [ ] Double-click transaction creation.
- [ ] Duplicate refund request.
- [ ] Concurrent correction requests.
- [ ] Interrupted savings funding.
- [ ] Renewal decision retry.
- [ ] Investment sale before proceeds settle.
- [ ] Loan payment retry.
- [ ] Card repayment and refund overlap.
- [ ] Month close crash and resume.
- [ ] Reminder worker duplicate run.
- [ ] Health render attempts zero writes.
- [ ] Jar reallocation creates zero ledger impact.

