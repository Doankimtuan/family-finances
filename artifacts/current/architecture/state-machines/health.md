# State Machine

This is a business state model only. It does not define implementation state, database state, or technical contracts.

Health has assessment states. These states describe the current assessment result, not a persisted money object.

## Business States

| State | Meaning |
| --- | --- |
| Unavailable | Health cannot assess because household context, permission, or required source access is unavailable. |
| No Visible Facts | Household context exists, but no usable financial facts are visible. |
| Partial | Some facts are visible, but missing or stale context materially limits interpretation. |
| Starting | Visible facts show early setup, limited rhythm, or meaningful incompleteness. |
| Steady | Visible facts show usable household rhythm with no severe visible pressure. |
| Strong | Visible facts show strong setup, rhythm, and low visible unresolved pressure. |
| Stale | Previously assessable facts are no longer current enough for reliable interpretation. |
| Invalid Attempt | Requested interpretation violates Health rules and is blocked. |

## Allowed Transitions

| From | To | Allowed when |
| --- | --- | --- |
| Unavailable | No Visible Facts | Household context becomes valid but no facts are visible. |
| Unavailable | Partial | Household context and some facts become visible. |
| Unavailable | Starting | Household context and enough early facts become visible. |
| No Visible Facts | Partial | At least one usable source fact becomes visible. |
| No Visible Facts | Starting | Enough early setup facts become visible. |
| Partial | Starting | Minimum interpretable facts exist but setup or rhythm is weak. |
| Partial | Steady | Missing context no longer materially limits basic interpretation. |
| Starting | Steady | Visible setup, decision rhythm, or planning rhythm improves. |
| Steady | Strong | Visible condition improves and unresolved pressure remains low. |
| Strong | Steady | Visible pressure rises or rhythm weakens without severe incompleteness. |
| Steady | Starting | Visible pressure rises, setup weakens, or key facts disappear. |
| Starting | Partial | Missing or stale context materially limits interpretation. |
| Any assessable state | Stale | Source facts become too old or context changes without refresh. |
| Stale | Partial | Some refreshed facts are visible but incomplete. |
| Stale | Starting | Refreshed facts support early assessment. |
| Stale | Steady | Refreshed facts support steady assessment. |
| Stale | Strong | Refreshed facts support strong assessment. |
| Any state | Unavailable | Household context or permission becomes unavailable. |
| Any state | Invalid Attempt | Requested interpretation violates BR-01, BR-24, grounding, or advice boundaries. |
| Invalid Attempt | Prior valid state | Invalid request is abandoned and prior valid assessment remains usable if still current. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Any Health state | Account, Transaction, Card, Loan, Savings, Planning, Goal, Inbox, Category, or Together state | Health cannot become source-domain truth. |
| Any Health state | Money moved | Health has no real-money movement transition. |
| Any Health state | Plan changed | Health cannot mutate planning intention. |
| Any Health state | Inbox resolved | Health cannot resolve decisions. |
| Any Health state | Advisory state | Health cannot become advice-grade guidance. |
| Invalid Attempt | Strong | A blocked interpretation cannot be converted into a positive Health condition. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Missing source facts become visible | No Visible Facts or Partial -> Starting, Steady, or Strong |
| Stale facts are refreshed | Stale -> Partial, Starting, Steady, or Strong |
| Invalid virtual-money interpretation is removed | Invalid Attempt -> prior valid state |
| Advisory interpretation is blocked | Invalid Attempt -> prior valid state |
| Household permission restored | Unavailable -> No Visible Facts, Partial, Starting, Steady, or Strong |

## Terminal States

Health has no permanent terminal state while the household exists.

Terminal for a single assessment request:

- Unavailable.
- Invalid Attempt.
- Completed assessment as Partial, Starting, Steady, or Strong.

The next assessment starts again from current source facts.
