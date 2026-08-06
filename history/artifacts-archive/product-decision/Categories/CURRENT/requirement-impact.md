# Requirement Impact

This document identifies requirement impacts only. It does not create final requirements or modify existing Sources of Truth.

## New Requirements

| Candidate requirement area | Affected capabilities | Impact |
| --- | --- | --- |
| Category definition | CAT-PD-001, CAT-PD-008 | Product requirements may need explicit household-scoped category definition language. |
| Category assignment | CAT-PD-003, CAT-PD-004, CAT-PD-005 | Requirements may need assignment, unknown, and correction states for transaction category meaning. |
| Category actuals | CAT-PD-006, CAT-PD-007 | Requirements may need category filtering and actuals summaries without budget or balance implication. |
| Category boundary language | CAT-PD-010, CAT-PD-011 | Requirements may need explicit separation from accounts, merchants, payment methods, jars, and Health. |
| Provider suggestion safety | CAT-PD-018 | Requirements may need suggestion-only language for provider or inferred category hints. |

## Modified Requirements

| Existing requirement area | Affected capabilities | Impact |
| --- | --- | --- |
| Transaction categorization | CAT-PD-003, CAT-PD-005, CAT-PD-007 | Clarify category as household meaning on transaction, not money mutation. |
| Category-Jar mapping | CAT-PD-011, CAT-PD-030 | Clarify mapping as interpretation boundary, not category-owned planning. |
| Category management | CAT-PD-012, CAT-PD-013, CAT-PD-014 | Clarify rename/archive/restore behavior around historical interpretation. |
| Inbox unresolved work | CAT-PD-004, CAT-PD-030 | Clarify how unknown category meaning is represented as reviewable uncertainty. |

## Removed Requirements

| Candidate removal | Affected capabilities | Impact |
| --- | --- | --- |
| Category balance or budget behavior | CAT-PD-031, CAT-PD-032, CAT-PD-034, CAT-PD-035 | Any requirement implying category-held money, category budget, or category available balance should be removed or rejected. |
| Autonomous final categorization | CAT-PD-037 | Any requirement allowing category meaning to be finalized without user-understood control should be removed or rejected. |
| Category-owned provider truth | CAT-PD-036 | Any requirement treating provider category as authoritative household truth should be removed or rejected. |
| Category-specific notes as first-class scope | CAT-PD-021 | Any requirement assigning explanation/comment ownership to category definitions should be removed or moved to owning context. |
