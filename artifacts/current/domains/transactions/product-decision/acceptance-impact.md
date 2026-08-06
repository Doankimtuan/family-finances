# Acceptance Impact

This document identifies Acceptance Criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Impacts

| Area | Affected capabilities | Impact |
| --- | --- | --- |
| Transaction recording | TX-PD-001, TX-PD-002, TX-PD-003, TX-PD-005 | Acceptance should verify factual anchors are present and direction is clear. |
| Activity review | TX-PD-004, TX-PD-008, TX-PD-009 | Acceptance should verify users can review and find transaction history. |
| Category meaning | TX-PD-007 | Acceptance should verify categorization does not imply real-money movement. |
| Refund/correction | TX-PD-010 | Acceptance should verify audit explanation remains visible and trust-preserving. |
| Account evidence | TX-PD-011 | Acceptance should verify transactions explain account changes. |
| Cross-domain consumption | TX-PD-012 | Acceptance should verify Plan, Inbox, and Health do not rewrite transaction facts. |
| Transfer neutrality | TX-PD-013 | Acceptance should verify owned-account transfers do not count as income or expense by default. |
| AI assistance guardrail | TX-PD-032 | Acceptance should verify AI assistance is non-authoritative if introduced in a later phase. |

## Deferred Acceptance Areas

- Provider import.
- Merchant normalization.
- Pending/posted provider state.
- Split categorization.
- Receipt attachment.
- Duplicate detection.
- Formal reconciliation.
- Cash reconciliation.
- Multi-currency and remittance context.
