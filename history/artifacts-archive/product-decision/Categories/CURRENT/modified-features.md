# Modified Features

## Capabilities Requiring Modification

| ID | Capability | Original idea | Required modification | Reason | Expected result |
| --- | --- | --- | --- | --- | --- |
| CAT-PD-007 | Summarize by category purpose | Show spending or income totals by category. | Present only actual transaction summaries, never balances, budgets, or available money. | Protect BR-01 and avoid category-as-budget confusion. | Users understand what happened, not what remains. |
| CAT-PD-009 | Preserve historical category meaning | Keep category meaning useful over time. | Scope to historical comprehension; avoid heavy audit, taxonomy, or report-rewrite tooling in early phases. | Long-term value is real, but complexity can grow quickly. | Old transactions remain interpretable without over-engineering. |
| CAT-PD-011 | Provide classification evidence to other domains | Let other domains use category meaning. | Read-only consumption only; owning domains retain decisions and state. | Prevents Categories from becoming Planning, Health, Inbox, or reporting logic owner. | Categories inform without controlling outcomes. |
| CAT-PD-012 | Rename category | Change category wording freely. | Treat rename as meaning-sensitive and preserve old interpretation where needed. | Casual renames can distort historical reports. | Household can improve language without losing history. |
| CAT-PD-013 | Archive category | Stop using a category. | Archive only affects future selection; historical transactions keep meaning. | Deleting or hiding past meaning breaks trust. | Category list can stay clean while history remains understandable. |
| CAT-PD-014 | Restore category | Re-enable old category. | Restore only within archive semantics, without implying historical correction. | Recovery is useful but should remain simple. | Households recover from cleanup mistakes safely. |
| CAT-PD-018 | Use merchant or provider hints for suggested categorization | Use external or inferred category labels. | Suggestions must be explicit, reviewable, and subordinate to household meaning; no auto-commit. | Provider categories can be wrong and automation can erode trust. | Convenience without losing user understanding. |
| CAT-PD-030 | Shared partner category meaning review | Partners can understand and question category meaning. | Keep as shared comprehension, not approval workflow, blame tool, or surveillance layer. | Category visibility is socially sensitive. | Supports calm household discussion without process burden. |

## Product Value

Modified capabilities are approved in principle because they reflect real household needs. The modifications protect:

- BR-01 Real Ledger is not Virtual Planning.
- Health read-only principle.
- Household-first language.
- Financial safety before convenience.
- Maintainability over years.
