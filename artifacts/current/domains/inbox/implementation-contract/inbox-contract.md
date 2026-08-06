# Inbox Contract

This is the Inbox domain itself. The contract specifies when Inbox items should exist and how Inbox avoids unnecessary items.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Decision-bearing source attention identified | Yes | Source-specific Review Item | Normal unless source marks time-bound urgency | Review and choose valid outcome | Only if item type has active window | Only if eligible pattern exists | Allowed only if not hiding required decision |
| Generic notification or marketing message | No | None | None | None | None | None | Not applicable |
| Transaction meaning missing | Yes | Transaction Review Item | Normal | Resolve meaning or defer | No default expiration | Eligible only for low-risk repeated mapping | Dismiss only if source no longer needs attention |
| Savings maturity decision required | Yes | Savings Review Item | Time-sensitive | Resolve via valid savings decision or defer when allowed | Based on maturity decision window when provided | Not auto-resolved unless source contract permits low-risk non-money outcome | Dismiss only if Savings says attention no longer required |
| Payment reminder requiring attention | Yes only if decision-bearing | Reminder Review Item | Time-sensitive | Acknowledge, resolve via owning domain, defer, or expire | Required | Not auto-resolved by default | Dismiss only if not hiding obligation |
| Reminder is awareness-only | No | None | None | None | None | None | Not applicable |
| Installment completion acknowledgement | Yes when household acknowledgement required | Completion Review Item | Normal | Acknowledge or resolve if source requires decision | Optional source-defined | May auto-resolve only if source marks low-risk acknowledgement eligible | Dismiss only if source allows |
| Emergency attention | Yes when source requires shared attention | Emergency Review Item | High | Review, acknowledge, or resolve according to source | Source-defined | No | Dismiss only when source no longer requires active attention |
| Prior item completed | No new item | Existing item moves state | None | Archive when appropriate | None | None | Not applicable |
| Prior outcome questioned | Yes or reopen existing | Recovery Review Item | Normal or source-defined | Review again | Source-defined | No unless pattern still valid and low-risk | Dismiss only after recovery reason is addressed |
| Duplicate active source/reason | No new item | Existing active item remains | Existing priority | Continue existing item | Existing expiration | Existing eligibility | Existing rules |

## Priority Definitions

- High: Emergency or time-critical household attention.
- Time-sensitive: Item has due, maturity, or expiration pressure.
- Normal: Regular household decision queue item.

## Required Action Rules

- Every Inbox item must have at least one valid active outcome.
- Items with no valid required action must not be created.
- Read-only information can support an item but must not create an item by itself.

## Auto-Resolution Rules

- Auto-resolution is opt-in by business eligibility, not default.
- Auto-resolution must be explainable from prior household behavior.
- Auto-resolution cannot move real money or mutate Health.
- Auto-resolution must record history.
