# UI Behavior Contract

This document defines required UI behavior only. It does not design the UI.

## State Behavior

| State | Visible actions | Hidden actions | Disabled actions | Required message behavior |
| --- | --- | --- | --- | --- |
| Unavailable | Retry/refresh if allowed, navigate away | All mutation actions | Source actions through Health | Explain that Health cannot load or assess now. |
| No Visible Facts | Refresh, view setup/context links if allowed | Mutation actions | Health score-changing actions | Explain that no usable facts are visible. |
| Partial | Refresh, view factors, view source context if allowed | Mutation actions | Actions that imply Health can fix missing data | Explain that assessment is incomplete. |
| Starting | Refresh, view factors, view scenarios if grounded | Mutation actions | Direct money/action controls | Explain factors without blame. |
| Steady | Refresh, view factors, view scenarios if grounded | Mutation actions | Direct money/action controls | Explain factors without permission-to-spend language. |
| Strong | Refresh, view factors, view scenarios if grounded | Mutation actions | Direct money/action controls | Explain factors without guaranteeing safety. |
| Stale | Refresh, view last known context only if marked stale | Mutation actions | Scenario if not grounded | Explain that facts may be outdated. |
| Invalid Attempt | Return to prior valid context, refresh if allowed | Mutation actions | Repeating invalid action | Explain which boundary was violated. |

## Required UI Behaviors

- Health must show condition and factors together when a condition is shown.
- Health must show completeness context when facts are missing or stale.
- Health must label scenarios as read-only.
- Health must not show create, edit, delete, approve, reject, repay, transfer, reconcile, close, or archive actions inside Health.
- Health must not show confirmations for money movement because Health cannot move money.
- Health must not use warning language that sounds like medical, insurance, credit, investment, tax, or legal advice.

## Loading Behavior

- Loading Health must not show a stale positive condition as current.
- If prior context is shown during loading, it must be visibly marked as prior or stale.
- Loading failure must not change source facts.

## Empty State

- Empty Health means no usable financial facts are visible.
- Empty Health must not imply the household has no risk.

## Error State

- Error state must explain unavailable, permission-blocked, stale, or invalid interpretation where known.
- Error state must not create Inbox items or notifications.
