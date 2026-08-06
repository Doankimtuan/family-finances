# State Machine

This is a business state model only. It does not define implementation state, database state, or technical contracts.

## Category Definition States

| State | Meaning |
| --- | --- |
| Active | Category is valid and available for future classification. |
| Archived | Category is not available for ordinary future selection, but historical meaning remains. |
| Invalid Attempt | Requested action violated business rules and did not change prior valid state. |

## Category Assignment States

| State | Meaning |
| --- | --- |
| Uncategorized | Transaction has no household category meaning. |
| Suggested | Provider, merchant, or system evidence proposes a category, but household meaning is not final. |
| Categorized | Transaction has accepted household category meaning. |
| Invalid Attempt | Requested assignment violated business rules and did not change prior valid state. |

## Allowed Category Definition Transitions

| From | To | Allowed when |
| --- | --- | --- |
| None | Active | Household creates a valid category. |
| Active | Active | Category wording changes while preserving meaning. |
| Active | Archived | Household stops future use while preserving history. |
| Archived | Active | Household restores a valid archived category. |
| Active | Invalid Attempt | Requested change violates business rules. |
| Archived | Invalid Attempt | Requested change violates business rules. |
| Invalid Attempt | Prior valid state | Failed action is abandoned or corrected. |

## Allowed Category Assignment Transitions

| From | To | Allowed when |
| --- | --- | --- |
| None | Uncategorized | Transaction exists but meaning is unknown. |
| None | Categorized | Transaction is assigned valid household meaning. |
| Uncategorized | Categorized | Household later clarifies meaning. |
| Uncategorized | Suggested | Non-authoritative evidence suggests meaning. |
| Suggested | Categorized | Household accepts or confirms valid meaning. |
| Suggested | Uncategorized | Household ignores, rejects, or cannot confirm suggestion. |
| Categorized | Categorized | Household corrects meaning to another valid category. |
| Categorized | Uncategorized | Household removes category because meaning is no longer known. |
| Any assignment state | Invalid Attempt | Requested assignment violates business rules. |
| Invalid Attempt | Prior valid assignment state | Failed action is abandoned or corrected. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Any | Category balance | Categories do not hold money. |
| Any | Category budget | Categories do not own spending limits. |
| Any | Account balance | Accounts own real money location. |
| Any | Jar capacity | Planning/Jars own virtual planning capacity. |
| Any | Payment executed | Categories do not execute payments. |
| Suggested | Categorized without household-understood acceptance | Provider or inferred evidence is not final truth. |
| Archived | Assigned to new ordinary transaction | Archived category is not available for ordinary future selection. |
| Uncategorized | Forced category | Unknown meaning must not be guessed. |
| Any | Health-mutated category | Health is read-only and cannot change Categories. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Wrong category assignment | Categorized -> Categorized with corrected valid meaning |
| Missing meaning becomes known | Uncategorized -> Categorized |
| Bad provider suggestion | Suggested -> Uncategorized or Suggested -> Categorized with different household meaning |
| Accidental archive | Archived -> Active |
| Ambiguous rename | Active -> Active with clearer valid wording or Invalid Attempt -> prior valid state |
| Invalid boundary attempt | Any state -> Invalid Attempt -> prior valid state |

## Terminal States

Categories have no financial terminal state.

Archived is terminal for ordinary future selection until the household restores it. Invalid Attempt is terminal only for the failed action and does not terminate the prior valid category or assignment.
