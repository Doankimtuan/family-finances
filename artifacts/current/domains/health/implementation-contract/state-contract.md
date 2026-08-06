# State Contract

## Business States

| State | Meaning |
| --- | --- |
| Unavailable | Health cannot assess because household context, permission, or source access is unavailable. |
| No Visible Facts | Household context exists, but no usable financial facts are visible. |
| Partial | Some facts are visible, but missing or stale context materially limits interpretation. |
| Starting | Visible facts show early setup, limited rhythm, or meaningful incompleteness. |
| Steady | Visible facts show usable household rhythm with no severe visible pressure. |
| Strong | Visible facts show strong setup, rhythm, and low visible unresolved pressure. |
| Stale | Previously assessable facts are no longer current enough for reliable interpretation. |
| Invalid Attempt | Requested interpretation violates Health rules and is blocked. |

## Allowed Transitions

| From | To | Trigger |
| --- | --- | --- |
| Unavailable | No Visible Facts | Household becomes readable but no facts exist. |
| Unavailable | Partial | Household becomes readable with incomplete facts. |
| Unavailable | Starting / Steady / Strong | Household becomes readable with assessable facts. |
| No Visible Facts | Partial / Starting | Usable source facts become visible. |
| Partial | Starting / Steady | Missing context no longer blocks basic interpretation. |
| Starting | Steady | Visible setup or rhythm improves. |
| Steady | Strong | Visible condition improves and pressure remains low. |
| Strong | Steady | Visible pressure rises or rhythm weakens. |
| Steady | Starting | Visible pressure rises or key facts disappear. |
| Starting | Partial | Missing or stale context limits interpretation. |
| Any assessable state | Stale | Source facts become too old or incomparable. |
| Stale | Partial / Starting / Steady / Strong | Current facts become visible again. |
| Any state | Unavailable | Permission or household context becomes unavailable. |
| Any state | Invalid Attempt | Requested behavior violates BR-01, BR-24, grounding, or advice boundary. |
| Invalid Attempt | Prior valid state | Invalid request is abandoned and prior state is still current. |

## Forbidden Transitions

| Transition | Reason |
| --- | --- |
| Health state -> source-domain state | Health cannot become source truth. |
| Health state -> money moved | Health never moves money. |
| Health state -> plan changed | Health never mutates Planning. |
| Health state -> Inbox resolved | Health never resolves Inbox. |
| Health state -> notification created | Health creates no notifications by default. |
| Invalid Attempt -> Strong | A blocked interpretation cannot become a positive condition. |

## Recovery Transitions

| Situation | Recovery |
| --- | --- |
| Missing facts become visible | No Visible Facts or Partial -> current valid state. |
| Stale facts refresh | Stale -> current valid state. |
| Permission restored | Unavailable -> current valid state or No Visible Facts. |
| Forbidden request stops | Invalid Attempt -> prior valid state if still current. |
| Advisory factor detected | Invalid Attempt or factor omission -> valid assessment without unsafe factor. |

## Terminal States

Health has no permanent terminal state for the household.

Terminal for a single assessment request:

- Unavailable.
- Invalid Attempt.
- No Visible Facts.
- Partial.
- Starting.
- Steady.
- Strong.
- Stale.

Each new assessment starts from current source facts.
