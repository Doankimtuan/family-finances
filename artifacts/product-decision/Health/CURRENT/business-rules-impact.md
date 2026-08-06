# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite Source of Truth.

## New Business Rules

| Candidate rule | Affected capabilities | Reason |
| --- | --- | --- |
| Health signals must be explainable by visible source-domain factors. | HLT-PD-001, HLT-PD-009, HLT-PD-019, HLT-PD-032 | Prevents black-box scoring and false precision. |
| Health must indicate when interpretation is based on incomplete visible facts. | HLT-PD-002, HLT-PD-019 | Protects trust when data is partial. |
| Medical-expense Health interpretation must remain financial and non-clinical. | HLT-PD-011, HLT-PD-028 | Prevents medical advice confusion. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Required modification |
| --- | --- | --- |
| Health read-only (BR-24) | HLT-PD-003, HLT-PD-006, HLT-PD-010, HLT-PD-022, HLT-PD-027, HLT-PD-031 | Clarify Health may read source-domain facts and produce observations/scenarios, but cannot mutate source domains or trigger money movement. |
| Real Ledger is not Virtual Planning (BR-01) | HLT-PD-002, HLT-PD-005, HLT-PD-012, HLT-PD-029 | Clarify Health must not treat jars, goals, or planning intention as real available money. |

## Clarified Business Rules

| Clarification | Affected capabilities | Reason |
| --- | --- | --- |
| Health scenario language is observational, not prescriptive. | HLT-PD-022 | Prevents scenario comparison from becoming recommendation. |
| Health can read Cards and Loans only as source-domain risk inputs. | HLT-PD-006 | Protects ownership of debt/card truth. |
| Health may reflect partner alignment only at household rhythm level. | HLT-PD-016 | Prevents partner scoring, surveillance, or blame. |
| AI-generated Health narrative must be grounded in verified household facts. | HLT-PD-009, HLT-PD-030, HLT-PD-032 | Prevents invention and advisory drift. |
