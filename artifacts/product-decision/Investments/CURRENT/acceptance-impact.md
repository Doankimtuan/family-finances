# Acceptance Impact

This document lists required acceptance-criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Impact | Affected capabilities |
|--------|----------------------|
| Investment holdings must not appear as ordinary cash accounts by default. | INV-PD-001, INV-PD-014 |
| Estimated investment values must be distinguishable from realized cash. | INV-PD-008, INV-PD-011, INV-PD-012, INV-PD-014 |
| Valuation date must be visible or otherwise understandable wherever current value is used. | INV-PD-009 |
| Valuation source must be captured or represented at a household-understandable level when value is not purely real-time provider truth. | INV-PD-010, INV-PD-022 |
| Investment income must remain distinguishable from ordinary salary or household income. | INV-PD-013 |
| Investment purpose must not create plan allocation or goal progress by itself. | INV-PD-030, INV-PD-044 |
| Health must not mutate investments, investment values, or investment decisions. | INV-PD-041, INV-PD-045 |
| Automated trading, rebalancing, market-timing prompts, and recommendations must not be accepted scope. | INV-PD-042, INV-PD-043, INV-PD-046 |
| Margin/leverage, if represented, must be treated as risk visibility only. | INV-PD-027 |
| Private/family investments must not be presented with false precision. | INV-PD-039 |
