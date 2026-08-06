# Temporal Invariants

## Determinism Requirement

Month Close, renewal, maturity, recurring events, reminder generation, and emergency declaration must produce the same business result regardless of job execution time, duplicate worker execution, queue order, retry timing, or system restart.

## Invariants

1. Month Close locks planning interpretation for the period; it does not rewrite transaction history.
2. 30-day auto-lock behavior is computed from stable month dates and item state, not from worker luck.
3. Maturity reminders are generated from product maturity date and cascade schedule; resolving final decision cancels remaining siblings.
4. Renewal requires household decision or explicit confirmation; saved preferences do not silently move money.
5. Recurring events create expectations or candidate facts only according to source ownership; they do not prove real payment.
6. Reminder expiration ends attention only; it does not mark a bill paid.
7. Emergency declaration changes planning and visibility context only; it does not bypass ledger confirmation.

## Engineering Contracts

- Workers must use deterministic selection predicates, stable cursors, idempotency keys, and compare-and-set state transitions.
- Worker outputs must be replayable without duplicate financial effects.
- Time calculations must use explicit calendar period, timezone policy, and persisted schedule anchors.
- Generated reminders must have natural uniqueness keys such as source object, reminder type, due/maturity date, and cascade offset.

