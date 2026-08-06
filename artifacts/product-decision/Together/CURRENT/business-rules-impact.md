# Business Rules Impact

This file identifies business-rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules Identified

| Proposed rule area | Affected decisions | Need |
|--------------------|-------------------|------|
| Household trust boundary | TGT-PD-001, TGT-PD-002, TGT-PD-011, TGT-PD-012, TGT-PD-013 | Clarify that household membership defines access to household-scoped finance. |
| Invitation consent | TGT-PD-005, TGT-PD-006, TGT-PD-007, TGT-PD-019 | Clarify that joining a household requires explicit invitation acceptance. |
| Role simplicity | TGT-PD-003, TGT-PD-033 | Clarify that Together supports simple Partner/Admin responsibility only, not custom role matrices. |
| Historical membership interpretation | TGT-PD-017, TGT-PD-018 | Clarify that inactive/former members may remain visible only for historical context. |

## Modified Business Rules Identified

No direct modifications to existing frozen Business Rules are made here.

Potential future SoT modification areas:

- BR-12 may need future clarification if multi-household support is reconsidered.
- BR-13 may need clearer scope for material membership changes versus policy changes.
- BR-02 / BR-02a may need Together-specific wording around household trust boundary if later SoT updates are allowed.

## Clarified Business Rules Identified

| Existing principle | Clarification needed |
|--------------------|---------------------|
| BR-01 Real Ledger is not Virtual Planning | Together provides access and policy context only; it does not hold money, allocate jars, or create ledger truth. |
| Health read-only (BR-24) | Health may reflect household state but Together/Health must not mutate money records. |
| BR-02 Auth + membership required | Auth proves person identity; Together membership proves household participation. |
| BR-12 One active household per user in v2 Now | Multiple households remain deferred. |
| BR-13 Material policy changes partner-visible | Policy-change attribution and recent policy events are approved in limited scope. |
