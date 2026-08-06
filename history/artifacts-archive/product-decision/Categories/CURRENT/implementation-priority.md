# Implementation Priority

This document recommends product implementation order only. It does not define implementation details.

## High Priority

| ID | Capability | Dependencies | Reason |
| --- | --- | --- | --- |
| CAT-PD-001 | Define household category | Household context. | Foundation for all category use. |
| CAT-PD-002 | Distinguish income and expense categories | Transaction direction. | Prevents basic financial confusion. |
| CAT-PD-003 | Categorize transaction | Transactions. | Core household value. |
| CAT-PD-004 | Leave uncategorized | Transactions and review semantics. | Protects uncertainty. |
| CAT-PD-005 | Correct category assignment | Transaction category assignment. | Required for trust. |
| CAT-PD-010 | Separate category from account, merchant, payment method, and plan | Domain boundaries. | Protects BR-01 and product comprehension. |

## Medium Priority

| ID | Capability | Dependencies | Reason |
| --- | --- | --- | --- |
| CAT-PD-006 | Filter transaction history by category | Categorized transactions. | Converts labels into user value. |
| CAT-PD-007 | Summarize by category purpose | Enough categorized history. | Useful actuals insight after assignment exists. |
| CAT-PD-008 | Maintain household-specific vocabulary | Category definition. | Makes system fit household language. |
| CAT-PD-009 | Preserve historical category meaning | Category lifecycle behavior. | Important as history grows. |
| CAT-PD-011 | Provide classification evidence to other domains | Clear read-only contracts. | Lets Categories inform without owning other domains. |
| CAT-PD-012 | Rename category | Historical meaning policy. | Common cleanup need. |
| CAT-PD-013 | Archive category | Historical meaning policy. | Keeps active vocabulary manageable. |
| CAT-PD-014 | Restore category | Archive semantics. | Recovery path. |
| CAT-PD-030 | Shared partner category meaning review | Together and category visibility policy. | Important for shared finance trust. |

## Low Priority

| ID | Capability | Dependencies | Reason |
| --- | --- | --- | --- |
| CAT-PD-017 | Category visual identity | Stable vocabulary and design readiness. | Useful but not core. |
| CAT-PD-018 | Use merchant or provider hints for suggested categorization | Provider/merchant evidence and trust language. | Valuable but must be carefully constrained. |
| CAT-PD-015 | Merge category meaning | Usage history and report-effect validation. | Defer until real duplication appears. |
| CAT-PD-016 | Split mixed transaction across categories | Split semantics and user tolerance evidence. | High complexity. |
| CAT-PD-019 | Detect duplicate or near-duplicate categories | Real category corpus. | Useful only after growth. |
| CAT-PD-020 | Track confidence for inferred labels | Suggestion maturity. | Depends on automation. |
| CAT-PD-022 | Merchant-to-category learning | Merchant identity and override behavior. | Automation-sensitive. |
| CAT-PD-023 | Vietnamese merchant normalization | Provider descriptor research. | Provider-dependent. |
| CAT-PD-024 | Receipt-line or item-level classification | Receipt evidence and split behavior. | Future-heavy. |
| CAT-PD-025 | Household category templates by life stage | Vietnam category research. | Needs validation. |
| CAT-PD-026 | Cross-provider category reconciliation | Provider import maturity. | Future-heavy. |
| CAT-PD-027 | Longitudinal category drift detection | Multi-year data. | Later-stage concern. |
| CAT-PD-028 | Category portability for export or adviser review | Export/adviser demand. | Low current value. |
| CAT-PD-029 | International or multi-currency category context | Multi-currency usage evidence. | Outside current core. |

## Never Implement

CAT-PD-021 and CAT-PD-031 through CAT-PD-037 are rejected and should not enter implementation scope.
