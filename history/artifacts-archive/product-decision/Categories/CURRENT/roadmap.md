# Roadmap Classification

This roadmap classifies product decisions by phase. It is a decision grouping, not an implementation plan.

## MVP

| ID | Capability | Why |
| --- | --- | --- |
| CAT-PD-001 | Define household category | Foundational vocabulary. |
| CAT-PD-002 | Distinguish income and expense categories | Essential financial clarity. |
| CAT-PD-003 | Categorize transaction | Core user value. |
| CAT-PD-004 | Leave uncategorized | Prevents forced false meaning. |
| CAT-PD-005 | Correct category assignment | Required for trust. |
| CAT-PD-006 | Filter transaction history by category | Basic household question-answering. |
| CAT-PD-008 | Maintain household-specific vocabulary | Household-first fit. |
| CAT-PD-010 | Separate category from account, merchant, payment method, and plan | Boundary safety. |
| CAT-PD-011 | Provide classification evidence to other domains | Needed as read-only context. |

## Version 1.x

| ID | Capability | Why |
| --- | --- | --- |
| CAT-PD-007 | Summarize by category purpose | Valuable once assignment exists; must remain actuals-only. |
| CAT-PD-009 | Preserve historical category meaning | Becomes more important as history grows. |
| CAT-PD-012 | Rename category | Common cleanup need with historical caution. |
| CAT-PD-013 | Archive category | Common cleanup need with historical caution. |
| CAT-PD-014 | Restore category | Recovery path after archive. |
| CAT-PD-017 | Category visual identity | Useful scan aid after vocabulary stability. |
| CAT-PD-018 | Use merchant or provider hints for suggested categorization | Valuable with strict suggestion-only safety. |
| CAT-PD-022 | Merchant-to-category learning | Reconsider only after suggestion behavior and merchant identity are validated. |
| CAT-PD-030 | Shared partner category meaning review | Important, but must stay comprehension-oriented. |

## Version 2.x

| ID | Capability | Why |
| --- | --- | --- |
| CAT-PD-015 | Merge category meaning | Needs usage history and report-effect validation. |
| CAT-PD-016 | Split mixed transaction across categories | Needs proof that added complexity is worth it. |
| CAT-PD-019 | Detect duplicate or near-duplicate categories | Useful after real category growth. |
| CAT-PD-020 | Track confidence for inferred labels | Depends on suggestion/import maturity. |
| CAT-PD-023 | Vietnamese merchant normalization | Depends on provider descriptor research. |
| CAT-PD-025 | Household category templates by life stage | Depends on Vietnam card-sorting research. |

## Future

| ID | Capability | Why |
| --- | --- | --- |
| CAT-PD-024 | Receipt-line or item-level classification | Too heavy until receipt data and mixed-purchase pain are proven. |
| CAT-PD-026 | Cross-provider category reconciliation | Requires mature provider ecosystem. |
| CAT-PD-027 | Longitudinal category drift detection | Requires years of household category data. |
| CAT-PD-028 | Category portability for export or adviser review | Low current relevance. |
| CAT-PD-029 | International or multi-currency category context | Outside Vietnam-first core. |

## Never

| ID | Capability | Why |
| --- | --- | --- |
| CAT-PD-021 | Category-specific notes or explanations | Duplicates transaction-level context and risks category overgrowth. |
| CAT-PD-031 | Category holds money | Violates core financial model. |
| CAT-PD-032 | Category available balance | Violates BR-01. |
| CAT-PD-033 | Category executes payments | Unsafe ownership. |
| CAT-PD-034 | Category enforces spending cap | Planning/Jars own limits. |
| CAT-PD-035 | Category replaces jar or budget | Contradicts ViNha model. |
| CAT-PD-036 | Category certifies provider truth | Provider labels are not household truth. |
| CAT-PD-037 | Category decides household intent autonomously | Unnecessary automation and trust risk. |
