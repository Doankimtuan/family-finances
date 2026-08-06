# Inbox Contract

## Principle

Health must not create unnecessary Inbox items. Health is interpretive and read-only; Inbox exists for decision-bearing attention owned by source domains.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Health assessed successfully | No | None | None | None | None | Not applicable | Not applicable |
| Health refreshed successfully | No | None | None | None | None | Not applicable | Not applicable |
| Health state is Starting, Steady, or Strong | No | None | None | None | None | Not applicable | Not applicable |
| Health is Partial | No by Health default | None | None | None | None | Not applicable | Inline context only |
| Health is Stale | No by Health default | None | None | None | None | Not applicable | Inline context only |
| Health is Unavailable | No | None | None | None | None | Not applicable | Inline error only |
| Invalid Health attempt blocked | No | None | None | None | None | Not applicable | Inline error only |
| Health identifies Inbox pressure | No new item | Existing Inbox context only | Existing priority only | Existing Inbox action only | Existing rules | Existing rules | Existing rules |
| Health identifies source-domain pressure | No by Health default | None | None | None | None | Not applicable | Source domain decides if Inbox is needed |
| Health scenario displayed | No | None | None | None | None | Not applicable | Not applicable |

## Forbidden Inbox Behavior

- Health must not create Inbox items.
- Health must not resolve Inbox items.
- Health must not auto-acknowledge Inbox items.
- Health must not dismiss Inbox items.
- Health must not create generic informational Inbox noise.
- Health must not create an Inbox item just because a Health score changed.

## Source-Domain Rule

If Health reveals attention that may require a decision, the owning source domain is responsible for determining whether an Inbox item should exist. Health itself remains read-only.
