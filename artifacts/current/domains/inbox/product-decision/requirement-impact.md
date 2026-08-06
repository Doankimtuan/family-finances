# Requirement Impact

This document identifies required requirement impacts only. It does not create or rewrite requirements.

## New Requirements

| Candidate requirement | Affected capabilities | Impact |
| --- | --- | --- |
| Inbox shall show only unresolved financial attention or historical outcomes from that attention. | IB-PD-001, IB-PD-008, IB-PD-029 | Enforces decision-queue scope. |
| Inbox items shall retain source reference and reason for attention. | IB-PD-002, IB-PD-003 | Supports user trust and auditability. |
| Inbox state labels shall distinguish resolution, acknowledgement, dismissal, expiration, archive, and deferral if present. | IB-PD-004, IB-PD-006, IB-PD-011, IB-PD-017 | Prevents state misunderstanding. |
| Inbox automation shall never execute payments or mutate real money directly. | IB-PD-010, IB-PD-021 | Protects financial safety. |

## Modified Requirements

| Existing requirement area | Affected capabilities | Impact |
| --- | --- | --- |
| Shared household resolution | IB-PD-005, IB-PD-012, IB-PD-019 | Needs privacy and partner-sensitivity validation before targeted assignment or dispute behavior. |
| Suggestions / confidence | IB-PD-013, IB-PD-021, IB-PD-024 | Needs wording that suggestions are optional and explainable. |
| Payment reminders | IB-PD-017, IB-PD-029 | Must distinguish decision-bearing reminders from generic notifications. |
| Inbox history | IB-PD-007, IB-PD-008, IB-PD-026 | Must stay lightweight and non-punitive. |

## Removed Requirements

| Candidate removal | Affected capabilities | Reason |
| --- | --- | --- |
| Any requirement for general notification-center behavior | IB-PD-029 | Rejected as product-boundary violation. |
| Any requirement for partner coordination analytics | IB-PD-027 | Rejected due trust, privacy, and blame risk. |
