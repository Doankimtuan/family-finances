# Business Rules Impact

This document identifies required business-rule impacts only. It does not rewrite any Source of Truth.

## New Business Rules

| Proposed impact | Affected capabilities | Reason |
|-----------------|----------------------|--------|
| Investments are risk-bearing assets and must not be treated as cash until proceeds are realized. | INV-PD-001, INV-PD-008, INV-PD-011, INV-PD-014, INV-PD-044 | Protects users from treating market value as available money. |
| Investment value must carry valuation date and value-source meaning when shown as current value. | INV-PD-008, INV-PD-009, INV-PD-010, INV-PD-022 | Prevents stale or manual values from being over-trusted. |
| Investment purpose context must not create virtual allocation or goal progress by itself. | INV-PD-030, INV-PD-038, INV-PD-044 | Protects BR-01. |
| Investment risk context must be descriptive, not advisory. | INV-PD-027, INV-PD-028, INV-PD-037, INV-PD-041, INV-PD-042 | Protects financial safety and advice boundary. |

## Modified Business Rules

None identified as direct modifications to existing frozen rules in this phase.

## Clarified Business Rules

| Existing principle/rule | Clarification needed | Affected capabilities |
|-------------------------|----------------------|----------------------|
| BR-01 Real Ledger is not Virtual Planning | Investment market value is real asset context, but not default plan capacity or jar funding. | INV-PD-001, INV-PD-014, INV-PD-030, INV-PD-044 |
| BR-24 Health is read-only | Health may read investment exposure only; it must not change investment values, holdings, or decisions. | INV-PD-041, INV-PD-045 |
| No unnecessary automation | Investment automation is rejected for trading, rebalancing, or decision execution. | INV-PD-043, INV-PD-046 |
| User always understands where money is | Users must distinguish bank cash, broker/platform cash, investment holdings, and estimated value. | INV-PD-002, INV-PD-014, INV-PD-018 |
