# Implementation Priority

This document recommends implementation order only. It does not define implementation details.

## High

| Capabilities | Reason | Dependencies |
| --- | --- | --- |
| HLT-PD-010 | Read-only grounding is the foundation of the domain. | BR-24 enforcement and source-domain read access. |
| HLT-PD-001 | Core value is household condition reflection. | Source-domain facts. |
| HLT-PD-009 | Explanation is required for trust. | Factor definitions. |
| HLT-PD-019 | Completeness context prevents overtrust. | Source visibility awareness. |
| HLT-PD-004 | Inbox pressure is validated and low-complexity. | Inbox read facts. |
| HLT-PD-005 | Plan rhythm is validated and low-complexity. | Planning read facts. |

## Medium

| Capabilities | Reason | Dependencies |
| --- | --- | --- |
| HLT-PD-007 | Activity rhythm supports trust after the core signal exists. | Transaction read facts. |
| HLT-PD-022 | Light scenarios are useful but require careful language. | Grounded facts and BR-24 guardrails. |
| HLT-PD-002 | Liquidity visibility has high value but higher misunderstanding risk. | Accounts and completeness context. |
| HLT-PD-003 | Obligation pressure is valuable once source-domain boundaries are stable. | Cards, Loans, Inbox, or Planning read facts. |
| HLT-PD-006 | Debt/card signals are valuable but risk-sensitive. | Cards and Loans source truth. |

## Low

| Capabilities | Reason | Dependencies |
| --- | --- | --- |
| HLT-PD-008 | Prior comparison should wait for stable period facts. | Month Close or comparable stable history. |
| HLT-PD-011 | Medical expense awareness is valuable but boundary-sensitive. | Category/transaction evidence and non-advisory language. |
| HLT-PD-012 | Emergency-buffer awareness is valuable but can sound prescriptive. | Liquidity visibility and safe wording. |
| HLT-PD-016 | Partner alignment is useful but emotionally sensitive. | Together, Inbox rhythm, and partner-trust validation. |

Deferred and rejected capabilities are not prioritized for current implementation.
