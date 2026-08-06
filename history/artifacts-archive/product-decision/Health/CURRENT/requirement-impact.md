# Requirement Impact

This document identifies requirement impacts only. It does not create final requirements or implementation details.

## New Requirements

| Requirement impact | Affected capabilities |
| --- | --- |
| Health should provide a read-only household financial condition signal. | HLT-PD-001 |
| Health should explain the source factors behind every signal. | HLT-PD-009 |
| Health should show data completeness or missing-context awareness. | HLT-PD-019 |
| Health should use Inbox burden as a read-only pressure factor. | HLT-PD-004 |
| Health should use plan presence/rhythm as a read-only condition factor. | HLT-PD-005 |
| Health should support light read-only scenarios from verified facts only. | HLT-PD-022 |

## Modified Requirements

| Requirement impact | Affected capabilities |
| --- | --- |
| Liquidity-related Health language should be about visibility and resilience, not safe-to-spend permission. | HLT-PD-002 |
| Obligation and debt/card Health language should be read-only pressure, not instruction. | HLT-PD-003, HLT-PD-006 |
| Prior comparison should rely on stable grounded facts and avoid independent persisted Health truth. | HLT-PD-008 |
| Medical expense Health language should stay financial and non-clinical. | HLT-PD-011 |
| Emergency-buffer language should be cautious and non-advisory. | HLT-PD-012 |
| Partner alignment language should be neutral and household-level. | HLT-PD-016 |

## Removed Requirements

| Removed requirement direction | Affected capabilities | Reason |
| --- | --- | --- |
| Health changes records, moves money, approves decisions, or triggers repayments. | HLT-PD-027, HLT-PD-031 | Rejected due BR-24 and safety. |
| Health provides regulated or advisory-grade recommendations. | HLT-PD-028 | Rejected due compliance and financial risk. |
| Health treats virtual planning as spendable cash. | HLT-PD-029 | Rejected due BR-01. |
| Health presents unexplained precise scoring. | HLT-PD-032 | Rejected due trust and misunderstanding risk. |
