# Cross-Module Continuity

## Continuity Rules

- Preserve `origin` for cross-module launches.
- Preserve list scroll/filter state when returning.
- After action completion, return to the most meaningful context: source object, review item, or parent list.
- Health never performs writes; it links to source facts.
- Inbox resolves decisions but does not become the owner of source object detail.
- Home can launch flows but does not own mutation results.

## Required Continuity Cases

| Case | Required behavior |
|---|---|
| Inbox -> Saving maturity -> back | Return to Inbox queue position after decision unless user chooses Saving detail. |
| Health -> source transaction/loan -> back | Return to Health insight and preserve source factor context. |
| Goal -> approved funding source -> back | Return to Goal detail after source review/action. |
| Account -> transaction detail -> correction -> back | Return to Account detail activity position after correction if launched there. |
| Home -> product detail -> back | Return to Home summary context if launched from Home. |
| Investment stale value -> Inbox review -> detail | Return to investment detail after resolving facts, or Inbox if launched from queue. |

## Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Module transitions can feel like redirects. | Users lose place and trust. | Add origin-aware returns and receipts. | Inbox, Health, Home, Money | P1 |
| Inbox can become alternate navigation. | Ownership blurs. | Inbox resolves, then routes to owner detail or queue. | Inbox Review Detail | P0 |

