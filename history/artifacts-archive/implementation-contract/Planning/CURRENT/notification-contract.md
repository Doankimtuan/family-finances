# Notification Contract

## Notifications

| Notification | Trigger | Recipient | Purpose |
| --- | --- | --- | --- |
| Planning change confirmation | Create/update/pause/resume/cancel/archive succeeds | Acting user | Confirm virtual planning change completed. |
| Review ready reminder | Period reaches review point | Household members with planning rights | Prompt household review. |
| Review locked confirmation | Period becomes Locked | Household members with planning rights | Confirm normal planning changes are closed for the period. |
| Correction confirmation | Planning correction succeeds | Acting user and relevant household members when shared | Confirm explicit correction. |
| Due expectation reminder | Expected due date approaches | Household members with planning visibility | Remind about expected pressure, not paid status. |
| Recurring expectation reminder | Recurring expected date approaches | Household members with planning visibility | Remind about expected income or expense. |
| Mismatch warning | Plan/fact comparison creates Needs Review | Household members with planning rights | Prompt review of mismatch. |
| Emergency planning confirmation | Emergency reallocation succeeds | Acting user; partner if policy requires | Confirm virtual emergency adaptation. |
| Partner review request | Partner-visible assumption or challenge requires review | Required household members | Prompt shared decision. |
| Failure notification | Any action fails validation, permission, state, or boundary rules | Acting user | Explain why no change occurred. |

## Notification Rules

- Notifications never move money.
- Notifications never change Planning state by themselves.
- Reminders must distinguish expected from confirmed.
- Failure notification must preserve prior valid state.
- Health cannot issue write-back notifications that mutate Planning.
