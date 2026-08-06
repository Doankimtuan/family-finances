# Roadmap Classification

This document classifies product decisions by phase. It is not an implementation plan.

## MVP

- IB-PD-001 Collect pending financial decisions.
- IB-PD-002 Link item to source event or evidence.
- IB-PD-003 Present why attention is needed.
- IB-PD-004 Preserve current state.
- IB-PD-005 Support household resolution.
- IB-PD-006 Support dismissal or acknowledgement.
- IB-PD-008 Distinguish active from historical items.
- IB-PD-009 Carry context for owning domain.
- IB-PD-010 Separate real money, virtual planning, read-only info.
- IB-PD-013 Suggested resolution based on prior behavior.
- IB-PD-016 Track staleness.
- IB-PD-017 Expire time-bound reminders.

Why:

- These preserve the validated decision-queue model and protect financial safety.

## Version 1.x

- IB-PD-007 Preserve decision history.
- IB-PD-011 Defer an item.
- IB-PD-014 Group similar items.
- IB-PD-015 Identify likely duplicate items.
- IB-PD-021 Pattern-based auto-resolution with audit trail.
- IB-PD-026 Review workload metrics.

Why:

- These improve long-term operation after MVP validates review behavior and terminology.

## Version 2.x

- IB-PD-012 Assign or target item to partner.
- IB-PD-018 Surface receipt, invoice, or provider evidence.
- IB-PD-019 Capture confidence or dispute notes.
- IB-PD-020 Exception-only review.
- IB-PD-022 Cross-provider matching.
- IB-PD-023 Provider-message classification.
- IB-PD-024 Household-specific decision learning.

Why:

- These depend on provider maturity, user trust, privacy validation, or higher review volume.

## Future

- IB-PD-025 Richer invoice and receipt review.
- IB-PD-028 Regulatory or tax evidence retrieval.

Why:

- These are relevant only if household-business or evidence-heavy behavior is validated.

## Never

- IB-PD-027 Partner coordination analytics.
- IB-PD-029 General notification-center behavior.

Why:

- These conflict with household-first trust and decision-queue clarity.
