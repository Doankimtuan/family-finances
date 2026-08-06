# Acceptance Impact

This document lists Acceptance Criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Impact area | Affected capabilities | Acceptance impact |
| --- | --- | --- |
| Read-only enforcement | HLT-PD-010, HLT-PD-027, HLT-PD-031 | AC should verify Health cannot create, edit, delete, approve, repay, reconcile, or move money. |
| Grounding | HLT-PD-009, HLT-PD-030, HLT-PD-032 | AC should verify Health signals and narratives use verified household facts only. |
| Factor explanation | HLT-PD-001, HLT-PD-009 | AC should verify every Health signal has understandable source factors. |
| BR-01 protection | HLT-PD-002, HLT-PD-005, HLT-PD-029 | AC should verify Health never presents virtual planning as real money. |
| Data completeness | HLT-PD-019 | AC should verify Health can indicate partial source visibility. |
| Scenario boundaries | HLT-PD-022 | AC should verify scenarios are read-only and non-prescriptive. |
| Medical boundary | HLT-PD-011, HLT-PD-028 | AC should verify Health does not produce clinical or insurance advice. |
| Partner safety | HLT-PD-016 | AC should verify partner alignment language remains neutral and household-level. |
| Source-domain ownership | HLT-PD-003, HLT-PD-006 | AC should verify obligation, loan, and card facts are read from owning domains. |
