# Notification Contract

## Principle

Goals does not require push, email, or autonomous notifications in current scope.

Required user-facing messages are in-app confirmations, warnings, and errors tied to user action or visible state. No notification may imply money moved.

## Notification Matrix

| Notification | Trigger | Recipient | Purpose |
| --- | --- | --- | --- |
| Goal created confirmation | Create Goal succeeds | Acting user | Confirm intention was created. |
| Goal updated confirmation | Edit Goal succeeds | Acting user | Confirm intention was updated. |
| Contribution recorded confirmation | Add Contribution succeeds | Acting user | Confirm progress update only. |
| Goal paused confirmation | Pause succeeds | Acting user | Confirm active pursuit paused. |
| Goal resumed confirmation | Resume succeeds | Acting user | Confirm pursuit resumed. |
| Goal completed confirmation | Complete succeeds | Acting user | Confirm intention state completed, not payment. |
| Goal cancelled confirmation | Cancel succeeds | Acting user | Confirm pursuit ended. |
| BR-01 warning | User action could be read as real money movement | Acting user | Clarify that Goals does not move money. |
| Invalid action error | Validation or permission fails | Acting user | Explain that prior state remains. |
| Target date passed notice | User views goal after target date passes | Household viewer | Communicate timing pressure without automatic state change. |
| Evidence conflict notice | Read-only source facts conflict with progress | Household viewer | Explain uncertainty and prompt review if needed. |

## Forbidden Notifications

- No notification may say money transferred because of a goal action.
- No notification may say savings was funded by a goal action.
- No notification may say Health changed a goal.
- No notification may make advisory recommendations.
- No recurring contribution reminder exists in current scope.
