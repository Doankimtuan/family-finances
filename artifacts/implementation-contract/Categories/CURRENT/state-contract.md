# State Contract

## Category Definition States

| State | Meaning |
| --- | --- |
| Active | Category is valid and available for future classification. |
| Archived | Category is unavailable for ordinary future selection but remains meaningful for history. |
| Invalid Attempt | Requested category action failed and prior valid state remains. |

## Category Assignment States

| State | Meaning |
| --- | --- |
| Uncategorized | Transaction has no accepted household category meaning. |
| Suggested | Non-authoritative evidence proposes category meaning. |
| Categorized | Transaction has accepted household category meaning. |
| Invalid Attempt | Requested assignment failed and prior valid assignment remains. |

## Allowed Definition Transitions

| From | To | Allowed when |
| --- | --- | --- |
| None | Active | Valid category is created. |
| Active | Active | Valid rename occurs. |
| Active | Archived | Valid archive occurs. |
| Archived | Active | Valid restore occurs. |
| Active | Invalid Attempt | Invalid rename/archive/action is attempted. |
| Archived | Invalid Attempt | Invalid restore/rename/action is attempted. |
| Invalid Attempt | Prior valid state | Failed action is abandoned or corrected. |

## Allowed Assignment Transitions

| From | To | Allowed when |
| --- | --- | --- |
| None | Uncategorized | Transaction exists with no category meaning. |
| None | Categorized | Valid category is assigned. |
| Uncategorized | Categorized | User assigns valid category. |
| Uncategorized | Suggested | Non-authoritative suggestion exists. |
| Suggested | Categorized | User accepts valid suggestion. |
| Suggested | Uncategorized | User rejects, ignores, or cannot confirm suggestion. |
| Categorized | Categorized | User corrects to another valid category. |
| Categorized | Uncategorized | User removes category meaning. |
| Any assignment state | Invalid Attempt | Invalid assignment action is attempted. |
| Invalid Attempt | Prior valid assignment state | Failed action is abandoned or corrected. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Any | Category balance | Categories do not hold money. |
| Any | Category budget | Categories do not own spending limits. |
| Any | Account balance | Accounts own real money location. |
| Any | Jar capacity | Planning owns virtual capacity. |
| Any | Payment executed | Categories do not execute payments. |
| Suggested | Categorized without user-understood acceptance | Suggestions are not final truth. |
| Archived | Assigned to ordinary new transaction | Archived categories are not available for future ordinary use. |
| Uncategorized | Forced category | Unknown meaning must not be guessed. |
| Any | Health-mutated state | Health is read-only. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Wrong assignment | Categorized -> Categorized with corrected valid category |
| Missing meaning becomes known | Uncategorized -> Categorized |
| Bad suggestion | Suggested -> Uncategorized or Categorized with accepted alternate category |
| Accidental archive | Archived -> Active |
| Invalid action | Invalid Attempt -> prior valid state |

## Terminal States

- Categories have no financial terminal state.
- Archived is terminal for future ordinary selection until restored.
- Invalid Attempt is terminal only for the failed action.
