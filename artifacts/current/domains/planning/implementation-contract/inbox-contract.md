# Inbox Contract

## Principle

Planning creates Inbox work only when a human decision is required. Routine successful Planning changes do not create Inbox items.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Income intention created | No | None | None | None | None | Not applicable | Not applicable |
| Jar created or updated successfully | No | None | None | None | None | Not applicable | Not applicable |
| Goal created or updated successfully | No | None | None | None | None | Not applicable | Not applicable |
| Recurring expectation created or updated | No | None | None | None | None | Not applicable | Not applicable |
| Expected due date maintained | No by default | None | None | None | None | Not applicable | Not applicable |
| Source due truth conflicts with expected due date | Yes | Planning Review | Medium | Confirm expected date, accept source fact as read-only, or correct Planning | None by default | No | Dismiss only by acknowledging unresolved expectation or correcting Planning |
| Plan/fact mismatch needs household decision | Yes | Planning Review | Medium | Review mismatch and choose keep, adjust, correct, or acknowledge | None by default | No | Dismiss only after explicit acknowledgment |
| Partner challenges planning assumption | Yes | Planning Review | Medium | Resolve disagreement, adjust, pause, cancel, or keep active | None by default | No | Dismiss only if challenge is withdrawn or acknowledged |
| Emergency reallocation completed | No by default | None | None | None | None | Not applicable | Not applicable |
| Emergency reallocation requires partner review by policy | Yes | Planning Review | High | Acknowledge or resolve emergency planning change | None by default | No | Dismiss only after required partner action |
| Period ready for review | Optional | Planning Review | Low | Review period or postpone | End of review relevance | No money auto-resolution | Dismiss if user postpones or completes review |
| Review blocked by unresolved items | Yes | Planning Review | Medium | Resolve or acknowledge blocking items | None by default | No | Dismiss only when period remains Needs Review or issue is resolved |
| Invalid attempt | No by default | None | None | None | None | Not applicable | Not applicable |
| Stale planning assumption detected | Yes, only if user action needed | Planning Review | Low | Confirm, update, or keep expected assumption | None by default | No | Dismiss after explicit keep/ignore |

## Inbox Item Requirements

When a Planning Review item exists, it must include:

- Planning item reference.
- Reason review is needed.
- Whether any source-domain fact is involved.
- Required household decision.
- Statement that resolving the item does not move real money.

## Forbidden Inbox Behavior

- No Inbox item for routine success confirmation.
- No duplicate active item for the same Planning item and reason.
- No Inbox auto-resolution that changes money, source-domain facts, or locked periods.
- No Inbox item that lets Health mutate Planning.
