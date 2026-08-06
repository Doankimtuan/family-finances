# Requirement Impact

This file identifies requirement impacts only. It does not modify existing Sources of Truth.

## New Requirements Identified

| Proposed requirement area | Affected capabilities | Impact |
|---------------------------|----------------------|--------|
| Household member visibility | TGT-PD-001, TGT-PD-002, TGT-PD-015 | Requirements may need explicit wording that members can recognize who belongs to the household. |
| Invitation consent lifecycle | TGT-PD-005, TGT-PD-006, TGT-PD-007, TGT-PD-019 | Requirements may need explicit invitation lifecycle coverage beyond one active household. |
| Household preference interpretation | TGT-PD-014 | Requirements may need explicit household-level locale, timezone, and base-currency interpretation. |
| Historical membership context | TGT-PD-017, TGT-PD-018 | Requirements may need limited historical-member interpretation if approved for blueprint. |

## Modified Requirements Identified

| Existing requirement | Affected capabilities | Impact |
|----------------------|----------------------|--------|
| REQ-012 One active household per user in v2 Now | TGT-PD-001, TGT-PD-013, TGT-PD-022 | Keep for current scope; note multi-household remains deferred. |
| REQ-013 Material assumption/policy changes are partner-visible | TGT-PD-010, TGT-PD-016, TGT-PD-020 | Clarify attribution/recent events as material context, not full activity monitoring. |
| REQ-020 Partners share daily Money/Plan/Inbox rights; admin elevation limited | TGT-PD-003, TGT-PD-033 | Clarify that Admin is policy responsibility and custom role expansion is rejected. |
| REQ-002 Authenticated active household membership required | TGT-PD-011, TGT-PD-012 | Clarify Auth identity versus household membership responsibility. |

## Removed Requirements Identified

No removed requirements identified.

## Deferred Requirement Areas

- Multi-household membership.
- Complex family structures.
- Separation and household split lifecycle.
- External provider consent.
- Household-level export/deletion audit.
- Cross-border household settings.
