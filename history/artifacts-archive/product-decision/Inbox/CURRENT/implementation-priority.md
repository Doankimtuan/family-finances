# Implementation Priority

This document recommends order only. It does not define implementation details.

## High

| Capability | Dependency reason |
| --- | --- |
| IB-PD-001 Collect pending financial decisions | Foundation for the domain. |
| IB-PD-002 Link item to source event or evidence | Required for trust and ownership boundaries. |
| IB-PD-003 Present why attention is needed | Required for user comprehension. |
| IB-PD-004 Preserve current state | Required before resolution or archive can make sense. |
| IB-PD-005 Support household resolution | Core user value. |
| IB-PD-008 Distinguish active from historical items | Required for queue clarity. |
| IB-PD-010 Separate real money, virtual planning, read-only info | Required by BR-01. |

## Medium

| Capability | Dependency reason |
| --- | --- |
| IB-PD-006 Support dismissal or acknowledgement | Depends on clear state semantics. |
| IB-PD-007 Preserve decision history | Depends on resolution and state. |
| IB-PD-009 Carry context for owning domain | Depends on source linkage and cross-domain contracts. |
| IB-PD-011 Defer an item | Depends on state clarity and backlog language. |
| IB-PD-013 Suggested resolution | Depends on repeated user behavior. |
| IB-PD-016 Track staleness | Depends on state and dates. |
| IB-PD-017 Expire time-bound reminders | Depends on reminder boundary clarification. |
| IB-PD-026 Review workload metrics | Depends on mature state/staleness semantics. |

## Low

| Capability | Dependency reason |
| --- | --- |
| IB-PD-014 Group similar items | Depends on volume evidence. |
| IB-PD-015 Identify likely duplicate items | Depends on provider/import evidence. |
| IB-PD-018 Surface receipt, invoice, or provider evidence | Depends on evidence research. |
| IB-PD-019 Capture confidence or dispute notes | Depends on privacy and conflict research. |
| IB-PD-020 Exception-only review | Depends on suggestion/import trust. |
| IB-PD-021 Pattern-based auto-resolution | Depends on suggestion trust and audit clarity. |
| IB-PD-022 Cross-provider matching | Depends on provider maturity. |
| IB-PD-023 Provider-message classification | Depends on provider-message research. |
| IB-PD-024 Household-specific decision learning | Depends on review history and user trust. |
| IB-PD-025 Richer invoice and receipt review | Depends on validated evidence-heavy use. |
| IB-PD-028 Regulatory or tax evidence retrieval | Depends on validated household-business segment. |

## Never

- IB-PD-027 Partner coordination analytics.
- IB-PD-029 General notification-center behavior.
