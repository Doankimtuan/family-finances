# Permission Contract

## Role Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View category | Allowed | Allowed | Allowed | Allowed | Allowed read-only | Allowed read-only | Categories are household vocabulary. |
| Create Category | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes household vocabulary. |
| Assign Category To Transaction | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes transaction meaning. |
| Leave Transaction Uncategorized | Allowed | Allowed | Forbidden | Allowed | Allowed only to preserve unknown state | Allowed only to preserve unknown state | Unknown meaning may be preserved, not guessed. |
| Correct Category Assignment | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes accepted household meaning. |
| Filter By Category | Allowed | Allowed | Allowed | Allowed | Allowed read-only | Allowed read-only | Read-only retrieval. |
| Summarize Category Actuals | Allowed | Allowed | Allowed | Allowed | Allowed read-only | Allowed read-only | Read-only actuals. |
| Rename Category | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes shared vocabulary. |
| Archive Category | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes future availability. |
| Restore Category | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes future availability. |
| Produce Provider Suggestion | Forbidden | Forbidden | Forbidden | Forbidden | Allowed suggestion-only | Allowed suggestion-only | Evidence only, not final meaning. |
| Accept Provider Suggestion | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Final household meaning requires user-understood acceptance. |
| Reject Provider Suggestion | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Household controls meaning. |
| Review Shared Meaning | Allowed | Allowed | Allowed read-only | Allowed | Forbidden | Forbidden | Shared comprehension, not automation. |
| Mutate Health from Categories | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | BR-24. |
| Move money from Categories | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | BR-01. |
| Create category budget/balance | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Rejected Product Decision scope. |

## Permission Rules

- Owner, Partner, and Admin must be active household members.
- Viewer can inspect category meaning and read-only actuals but cannot mutate vocabulary or assignments.
- Background Worker and System can produce or consume read-only evidence only.
- No actor can use Categories to mutate real money, Planning, Health, Cards, Loans, Savings, Goals, Accounts, or Together rights.
