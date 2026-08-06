# Acceptance Impact

This document identifies acceptance-criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Impact | Affected capabilities |
| --- | --- |
| Verify Inbox contains decision-bearing financial attention, not generic notifications. | IB-PD-001, IB-PD-029 |
| Verify each item exposes why attention is needed. | IB-PD-003 |
| Verify each item retains source reference without transferring source ownership to Inbox. | IB-PD-002, IB-PD-009 |
| Verify resolution, acknowledgement, dismissal, expiration, archive, and deferral semantics are not conflated. | IB-PD-004, IB-PD-006, IB-PD-011, IB-PD-017 |
| Verify Inbox actions do not directly move real money or mutate Health. | IB-PD-010, IB-PD-021, IB-PD-026 |
| Verify active and historical queues remain distinct. | IB-PD-008 |
| Verify suggestions are optional and do not silently override user understanding. | IB-PD-013, IB-PD-021 |
| Verify staleness and workload language is calm and non-punitive. | IB-PD-016, IB-PD-026 |
| Verify partner analytics and generic notification-center behavior are absent. | IB-PD-027, IB-PD-029 |

## Deferred Acceptance Criteria

Acceptance criteria should not yet be created for:

- Partner assignment.
- Grouped review.
- Duplicate detection.
- Evidence surfacing.
- Dispute notes.
- Exception-only review.
- Cross-provider matching.
- Provider-message classification.
- Household decision learning.
- Rich invoice review.
- Tax evidence retrieval.
