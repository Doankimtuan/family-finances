# Concurrency Analysis

## Required Safety Outcomes

Double click, retry, offline sync, duplicate API calls, background workers, idempotency replay, and race conditions must never create duplicate money, lose money, skip history, or silently mutate another domain.

## Financial Command Rules

1. Every financial command must have an idempotency key scoped to household, actor, command type, target, and semantic operation.
2. Retrying the same command returns the same result or safe current state.
3. Concurrent conflicting commands use optimistic locking, aggregate version checks, or serializable transaction boundaries.
4. Consumers must deduplicate domain events before applying side effects.
5. Background workers must be safe under at-least-once execution.
6. Offline candidates cannot become money mutations until online validation confirms current authority and state.

## High-Risk Races

| Scenario | Required invariant |
| --- | --- |
| Double refund | One original transaction cannot be over-refunded beyond allowed amount. |
| Double correction | One active original cannot receive competing active correction chains. |
| Double renewal | One matured savings product cannot produce multiple active renewed cycles for the same decision. |
| Payment and cancellation race | Final state must reflect the first valid committed operation and route conflict to review. |
| Month close and late correction | Month close locks plan interpretation; ledger correction remains explicit and auditable. |
| Reminder worker duplicate | Duplicate reminder generation must collapse to one active item per natural key. |

## Verdict

Pass with engineering actions. The business model is safe, but implementation must harden idempotency and event registry contracts before production financial writes.

