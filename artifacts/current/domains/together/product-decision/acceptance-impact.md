# Acceptance Impact

This file identifies acceptance-criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Area | Affected capabilities | Acceptance impact |
|------|----------------------|-------------------|
| Member recognition | TGT-PD-002, TGT-PD-015 | AC coverage may need to confirm active members are recognizable to valid household members. |
| Invitation lifecycle | TGT-PD-005, TGT-PD-006, TGT-PD-007, TGT-PD-019 | AC coverage may need pending, accepted, declined, revoked, and expired invite outcomes. |
| Role scope | TGT-PD-003 | AC coverage may need to confirm Partner/Admin distinction does not reduce daily Partner rights. |
| Policy visibility | TGT-PD-008, TGT-PD-009, TGT-PD-010, TGT-PD-016, TGT-PD-020 | AC coverage may need current policy visibility and material policy-change attribution. |
| Household scope | TGT-PD-011, TGT-PD-012, TGT-PD-013 | AC coverage may need membership gates for household-scoped surfaces and no-household state. |
| Household preferences | TGT-PD-014 | AC coverage may need shared currency/timezone/locale interpretation. |
| Historical member context | TGT-PD-017, TGT-PD-018 | AC coverage may need limited former/inactive member interpretation if included in blueprint. |

## No Acceptance Criteria For Rejected Capabilities

The following rejected capabilities should not receive acceptance coverage:

- Partner engagement summaries.
- Granular custom roles and permissions.
- Legal family or marriage registry.
- Relationship dispute resolution.
- Together-initiated money movement.
