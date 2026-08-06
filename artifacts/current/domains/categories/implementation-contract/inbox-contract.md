# Inbox Contract

## Inbox Rules

- Inbox items exist only when household action is required.
- Categories does not create Inbox items for ordinary successful category actions.
- Duplicate active Inbox items for the same transaction and same category-review reason are forbidden.
- Resolving or dismissing a category-related Inbox item never moves money.
- Provider suggestions do not create Inbox items unless user review is required.

## Event Matrix

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Category created successfully | No | None | None | None | None | None | Not applicable |
| Category creation failed | No | None | None | None | None | None | User sees failure in action context |
| Transaction categorized successfully | No | None | None | None | None | Existing category-review item may auto-resolve | Not applicable |
| Transaction left uncategorized intentionally | Optional only if household review is still required | Category meaning review | Normal | Assign category or accept unknown meaning | None by default | When categorized or accepted as unknown | Dismiss only if household accepts no further category work |
| Transaction missing required category-to-planning interpretation | Yes when business rules require attention | Category mapping review | Normal | Clarify category meaning or mapping through valid owning flow | None by default | When owning review condition is resolved | Dismiss only if accepted uncertainty is allowed |
| Category assignment failed | No | None | None | None | None | None | User sees failure in action context |
| Category corrected successfully | No | None | None | None | None | Related active review item may auto-resolve | Not applicable |
| Provider suggestion available but not urgent | No | None | None | None | None | None | Not applicable |
| Provider suggestion needs user confirmation | Yes | Suggested category review | Normal | Accept, reject, override, or leave unknown | None by default | When accepted, rejected, overridden, or dismissed | Dismiss only with no final category change unless accepted separately |
| Category renamed | No | None | None | None | None | None | Not applicable |
| Category archive would orphan active review | Yes only if user action is still required | Category lifecycle review | Normal | Resolve affected review or cancel archive | None by default | When affected review is resolved or archive is cancelled | Dismiss only if no orphan meaning remains |
| Category archived successfully | No | None | None | None | None | None | Not applicable |
| Category restored successfully | No | None | None | None | None | Existing lifecycle review may auto-resolve | Not applicable |
| Shared category meaning questioned | Optional only if unresolved action is required | Shared category meaning review | Normal | Clarify, correct, or leave unknown | None by default | When clarified, corrected, or accepted as unresolved | Dismiss only if household accepts no further action |

## Priority Definitions

- Normal: Category meaning affects interpretation but does not by itself alter money facts.
- High is not used by default for Categories because Categories do not own money movement. High priority may be owned by Transactions, Accounts, Cards, Loans, or Inbox when financial facts are at risk.

## Expiration Contract

- Category-related Inbox items do not expire by default.
- Expiration must not silently assign category meaning.

## Auto Resolution Contract

- Auto resolution is allowed only when a valid user action removes the review need.
- Provider, AI, Health, or background inference must never auto-resolve final category meaning.
