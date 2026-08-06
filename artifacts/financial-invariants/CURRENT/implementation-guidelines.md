# Implementation Guidelines

## Do

- Implement financial mutations through source-owned domain services.
- Use explicit constants for statuses, event names, command names, and routes according to Developer Constitution rules.
- Store money with currency and precision-safe representation.
- Use append-only ledger records for posted financial history.
- Use domain events with idempotent consumers.
- Use transactions plus outbox for financial state changes.
- Keep pending and review states visible when provider, household, or system truth is uncertain.
- Label read models with source owner and confidence/provider-confirmation context.
- Add invariant tests before broad UI or automation work.

## Do Not

- Do not mutate frozen Sources of Truth.
- Do not redesign product, architecture, UX, or domain boundaries.
- Do not let Planning, Jars, Goals, Inbox, Health, AI, reminders, or recurring expectations create ledger money.
- Do not let Health write anything.
- Do not silently rewrite ledger history.
- Do not infer provider-confirmed truth from household-recorded values.
- Do not treat credit limit, available credit, unrealized investment value, expected interest, or planned income as owned cash.
- Do not execute renewal, withdrawal, repayment, or correction from acknowledgement alone.

## Testing Guidance

Build invariant tests around outcomes, not implementation shape:

- Ledger conservation under transfer, refund, correction, reversal, and duplicate calls.
- BR-01 zero-ledger-impact planning movement.
- BR-24 zero-write Health behavior.
- Product settlement through Accounts and Transactions.
- Worker replay with duplicate and delayed execution.
- Crash recovery from pending command and outbox records.
- Audit envelope completeness for every financial event.

