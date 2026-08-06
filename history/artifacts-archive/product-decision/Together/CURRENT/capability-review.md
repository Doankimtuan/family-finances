# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| TGT-PD-001 | Define household | Create the shared financial unit. | High | High | Low | Low | APPROVED | Validated as the core answer to who "we" are. |
| TGT-PD-002 | Identify active members | Show who currently belongs to household finance. | High | High | Low | Medium | APPROVED | Required for trust and household-scoped access. |
| TGT-PD-003 | Distinguish roles | Separate daily partner access from elevated policy responsibility. | High | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep the role model small and avoid hierarchy language; Admin means policy responsibility only. |
| TGT-PD-004 | Represent partner participation | Treat partners as real participants in shared finance. | High | High | Low | Low | APPROVED | Phase 2 validated asymmetric but shared participation. |
| TGT-PD-005 | Invite person | Allow a household member to invite a partner. | High | High | Low | Medium | APPROVED | Invitation is the natural consent entry into shared finance. |
| TGT-PD-006 | Accept or decline invitation | Let invitee choose whether to join. | High | High | Low | Medium | APPROVED | Consent is required for household trust. |
| TGT-PD-007 | Invitation lifecycle state | Recognize pending, accepted, revoked, expired, and declined states. | Medium | High | Low | Low | APPROVED | Prevents ambiguous access and supports recovery. |
| TGT-PD-008 | Define household policies | Hold simple shared assumptions that affect other domains. | High | High | Medium | Medium | APPROVED | Validated by household need for remembered agreements. |
| TGT-PD-009 | Expose policy state | Make current household policy visible to members. | High | High | Low | Low | APPROVED | Prevents surprise and supports shared understanding. |
| TGT-PD-010 | Attribute material policy changes | Identify that a material household assumption changed. | High | High | Medium | Medium | APPROVED | Required for trust and partner-visible policy behavior. |
| TGT-PD-011 | Provide household scope | Give other domains the household boundary. | Critical | High | Low | High | APPROVED | Foundational to household-first product behavior. |
| TGT-PD-012 | Protect records from non-members | Keep household data private to valid members. | Critical | High | Medium | Critical | APPROVED | Security and privacy foundation; no household product without this. |
| TGT-PD-013 | Identify active household status | Know whether a user has an active household. | High | High | Low | Low | APPROVED | Required for onboarding and money-action gates. |
| TGT-PD-014 | Household preferences | Represent shared locale, timezone, and base currency. | Medium | Medium | Low | Medium | APPROVED | Practical for Vietnam-first household interpretation of dates and money. |
| TGT-PD-015 | Member display/contact identity | Show member names and contact identity. | Medium | High | Low | Medium | APPROVED | Helps ordinary users recognize people; must avoid exposing unnecessary personal data. |
| TGT-PD-016 | Recent policy events | Show recent material household policy history. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep focused on material policy context, not a corporate audit console. |
| TGT-PD-017 | Membership history | Preserve basic history of who belonged. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Historical interpretation matters, but scope must stay minimal and privacy-sensitive. |
| TGT-PD-018 | Inactive member representation | Recognize former or inactive members. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Needed for history, but not a full separation workflow now. |
| TGT-PD-019 | Invitation attribution | Identify who initiated an invitation. | Medium | Medium | Low | Low | APPROVED WITH MODIFICATIONS | Useful for trust; keep as accountability context only. |
| TGT-PD-020 | Policy-change attribution | Identify who changed a household policy. | High | High | Low | Medium | APPROVED WITH MODIFICATIONS | Validated as trust-preserving; avoid blame-oriented presentation. |
| TGT-PD-021 | Manual household meaning clarification | Let household context be clarified in ordinary terms. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Allow clarity, but do not create a parallel agreement-management domain. |
| TGT-PD-022 | Multiple households per user | Let one user belong to more than one household. | Medium later | Medium later | High | High | DEFERRED | Real future need, but conflicts with current simple one-household model. |
| TGT-PD-023 | Complex family structures | Model dependents, parents, siblings, or extended family as structured actors. | Medium later | Medium later | High | High | DEFERRED | Family influence is real, but product membership should stay simple now. |
| TGT-PD-024 | Temporary access | Allow temporary advisor/helper access. | Low now | Low now | High | High | DEFERRED | Not validated for target households and risks permission complexity. |
| TGT-PD-025 | Separation or split workflows | Support breakup, divorce, death, or household split lifecycle. | High later | High later | High | Critical | DEFERRED | Important but safety-sensitive; needs research before decisions. |
| TGT-PD-026 | External account consent records | Track consent for provider or account data shared into the household. | High later | High later | High | High | DEFERRED | Depends on external data integration maturity and legal validation. |
| TGT-PD-027 | Household export/deletion audit | Interpret export/deletion at household level. | Medium later | Medium later | High | High | DEFERRED | Important for data governance, but not core MVP household clarity. |
| TGT-PD-028 | Provider consent renewal | Renew consent for connected provider data. | Medium later | Medium later | High | High | DEFERRED | Dependent on deferred provider integrations. |
| TGT-PD-029 | Cross-border household settings | Support cross-border currency, timezone, and location complexity. | Medium later | Medium later | High | Medium | DEFERRED | Not common enough for Vietnam-first young-household MVP. |
| TGT-PD-030 | Household leave/close lifecycle | Let members or household exit shared management cleanly. | Medium later | Medium later | High | High | DEFERRED | Real lifecycle need; requires sensitive validation and SoT decisions. |
| TGT-PD-031 | Household access recovery context | Recover from expired invite, lost access, or no household state. | Medium | Medium | Medium | Medium | DEFERRED | Some recovery exists through Auth/Invite; broader household recovery needs research. |
| TGT-PD-032 | Partner engagement summaries | Summarize how active each partner is. | Low | Low | Medium | High | REJECTED | Risks surveillance and blame; conflicts with household trust. |
| TGT-PD-033 | Granular custom roles and permissions | Add viewer, contributor, approver, per-domain, or per-account permissions. | Low | Low | High | High | REJECTED | Over-engineered for young households and conflicts with simple before powerful. |
| TGT-PD-034 | Legal family or marriage registry | Model legal relationship status. | Low | Low | High | High | REJECTED | Together is a financial trust boundary, not a legal registry. |
| TGT-PD-035 | Relationship dispute resolution | Adjudicate partner conflict or fairness. | Low | Low | High | Critical | REJECTED | Product can preserve facts, not resolve relationship disputes. |
| TGT-PD-036 | Together-initiated money movement | Let Together move, allocate, or correct money automatically. | Low | Low | High | Critical | REJECTED | Violates Real Ledger boundary and no unnecessary automation. |

## Summary

- APPROVED: 14.
- APPROVED WITH MODIFICATIONS: 7.
- DEFERRED: 10.
- REJECTED: 5.
- Total reviewed: 36.
