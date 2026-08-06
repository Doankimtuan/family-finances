# Implementation Priority

This file recommends product implementation order only. It does not provide implementation details.

## High Priority

| Capabilities | Reason | Dependencies |
|--------------|--------|--------------|
| TGT-PD-001, TGT-PD-013 | Household identity and active household state are foundational. | Auth session. |
| TGT-PD-002, TGT-PD-011, TGT-PD-012 | Membership, household scope, and protection are required before money surfaces. | Household identity. |
| TGT-PD-005, TGT-PD-006, TGT-PD-007 | Invitation and consent complete the household collaboration foundation. | Active household and user identity. |
| TGT-PD-008, TGT-PD-009 | Household policies must exist before policy-dependent planning behavior. | Household membership. |
| TGT-PD-003 with modifications | Role meaning controls policy access and must be simple. | Membership. |

## Medium Priority

| Capabilities | Reason | Dependencies |
|--------------|--------|--------------|
| TGT-PD-010, TGT-PD-016, TGT-PD-020 | Material policy attribution supports trust after policies exist. | Household policies. |
| TGT-PD-014 | Preferences support correct interpretation of money and time. | Household identity. |
| TGT-PD-015 | Recognition identity improves membership clarity. | User identity. |
| TGT-PD-019 | Invitation attribution helps recovery and accountability. | Invitation lifecycle. |

## Low Priority

| Capabilities | Reason | Dependencies |
|--------------|--------|--------------|
| TGT-PD-017, TGT-PD-018 | Historical membership context matters later, after real history exists. | Membership lifecycle evidence. |
| TGT-PD-021 | Household meaning clarification needs terminology validation. | User research. |
| TGT-PD-027, TGT-PD-031 | Data-governance and access-recovery needs can follow core usage evidence. | Operational evidence and policy work. |

## Not Prioritized Now

Deferred Version 2.x/Future items and rejected Never items should not be planned before validated triggers are met.
