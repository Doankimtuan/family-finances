# Notification Contract

## Principle

Health creates no notifications by default.

Health is a read-only assessment and must not become a notification center, warning engine, reminder system, or automation trigger.

## Notifications

| Notification | Trigger | Recipient | Purpose | Decision |
| --- | --- | --- | --- | --- |
| Health assessed | Assessment completes | None | None | No notification |
| Health level changed | Current assessment differs from prior visible condition | None | None | No notification by Health |
| Health partial | Missing source context affects assessment | None | None | Inline UI context only |
| Health stale | Source facts are stale | None | None | Inline UI context only |
| Health unavailable | Permission or source access unavailable | None | None | Inline UI error only |
| Medical expense pressure visible | Medical financial pressure appears | None | None | No notification by Health |
| Debt/card pressure visible | Debt/card pressure appears | None | None | No notification by Health |
| Scenario viewed | User views scenario | None | None | No notification |

## Forbidden Notification Behavior

- No push, email, SMS, reminder, warning, confirmation, completion, due, maturity, or failure notification may be created by Health.
- Health must not notify a partner about another partner's behavior.
- Health must not escalate a score or factor outside the current product context.

## Ownership Rule

If a source-domain event requires a reminder or notification, that notification belongs to the owning source domain or a dedicated notification policy, not Health.
