# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules

| Candidate | Affected capabilities | Impact |
| --- | --- | --- |
| Inbox items represent unresolved financial attention, not generic notifications | IB-PD-001, IB-PD-003, IB-PD-029 | Prevents Inbox from becoming a noisy message center. |
| Resolving an Inbox item does not by itself move real money | IB-PD-005, IB-PD-009, IB-PD-010, IB-PD-021 | Protects BR-01 and user understanding. |
| Automated Inbox decisions must be explainable and constrained | IB-PD-013, IB-PD-021 | Prevents unnecessary automation and silent financial confusion. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Impact |
| --- | --- | --- |
| BR-01 Real Ledger != Virtual Planning | IB-PD-009, IB-PD-010, IB-PD-021 | Clarify Inbox can route decisions across domains but cannot own ledger or planning truth. |
| BR-24 Health read-only | IB-PD-026 | Clarify Health may read Inbox burden/staleness but cannot mutate Inbox. |

## Clarified Business Rules

| Rule area | Affected capabilities | Impact |
| --- | --- | --- |
| Dismissal, acknowledgement, resolution, expiration | IB-PD-006, IB-PD-017 | Clarify each state has distinct business meaning and does not prove money moved. |
| Source ownership | IB-PD-002, IB-PD-009 | Clarify source domains remain authoritative after Inbox creation. |
| Partner visibility | IB-PD-012, IB-PD-019, IB-PD-027 | Clarify shared attention must not become surveillance or partner performance scoring. |
| Reminder boundary | IB-PD-017, IB-PD-029 | Clarify only decision-bearing reminders belong in Inbox. |
