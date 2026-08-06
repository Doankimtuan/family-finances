# Implementation Impact

## Result

No frozen domain redesign is required.

## Required Implementation Work

| Work Item | Impact | Type |
| --- | --- | --- |
| Cross-domain event registry | Medium | Contract hardening |
| Expanded Inbox ReviewItem contracts | Medium | Contract hardening |
| Month Close cross-source sweep | Medium | Lifecycle hardening |
| Health read-only shield tests | Low to Medium | Constitutional enforcement |
| BR-01 money invariant tests | Medium | Financial correctness |
| Investment valuation/proceeds guards | Medium | Financial safeguard |
| Together membership transition backlog | High | Future system evolution |
| Currency/country metadata readiness | High | Future scalability |

## Testing Impact

Add integration tests for:

- real ledger versus virtual jar separation;
- refund and correction audit chains;
- savings maturity cascade and cancellation;
- card payment reminder expiration without marking paid;
- loan repayment as transaction plus liability-progress fact;
- investment value change without cash transaction;
- Inbox resolution consumed only by owning domain;
- Health zero writes;
- Together authorization across writable domains;
- Month Close stale item handling.

## Architecture Impact

The work fits the existing modular DDD architecture. It should not introduce new UI shells, microservices, direct cross-domain database reads, or imports from frozen/legacy paths.

