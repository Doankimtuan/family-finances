# State Contract

## Business States

| State | Contract |
|-------|----------|
| Candidate | Real-world container may be tracked. No account record is active. |
| Draft | Required facts are being supplied. Not part of real position. Not transaction target. |
| Active | Valid for current household use. May be transaction target. May contribute to real position if eligible. |
| Needs Review | Account truth, balance, state, or identity is uncertain. May not be treated as high-confidence. |
| Historical | Not active for daily use. Preserves history. Not ordinary transaction target. |
| Closed | Real-world container ended. Terminal for active use. Preserves history. |
| Abandoned Draft | Terminal incomplete setup. No financial history. |
| Invalid Attempt | Terminal result for rejected action only. Account remains in prior valid state. |

## Allowed Transitions

| From | To | Required condition |
|------|----|--------------------|
| Candidate | Draft | User chooses to track container. |
| Draft | Active | Required validations pass. |
| Draft | Abandoned Draft | User cancels before activation. |
| Active | Needs Review | Truth, balance, identity, or relevance becomes uncertain. |
| Needs Review | Active | Uncertainty resolved. |
| Active | Historical | No longer active, history matters. |
| Historical | Active | Restoration is valid. |
| Active | Closed | Real-world closure confirmed. |
| Closed | Historical | Closure retained as historical record. |
| Needs Review | Historical | No longer active and unresolved item does not block history. |
| Needs Review | Closed | Closure confirmed after review. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Required facts must pass Draft validation first. |
| Draft | Closed | Draft has no real account history to close. |
| Closed | Active | Closed account requires review/restoration determination first. |
| Historical | Draft | Historical account already exists. |
| Any | Planning/Jar state | BR-01 violation. |
| Any | Health-mutated state | BR-24 violation. |
| Abandoned Draft | Active | Abandoned setup cannot become active history. |

## Recovery Transitions

| Trigger | Transition |
|---------|------------|
| Wrongly archived account | Historical → Active |
| Active account discrepancy | Active → Needs Review → Active |
| Unclear closure | Active → Needs Review → Closed/Historical |
| Duplicate suspected | Active → Needs Review; no automatic merge. |
| Invalid attempted action | Any valid state → same valid state, with Invalid Attempt result. |

## Terminal States

- Closed is terminal for active use.
- Abandoned Draft is terminal for incomplete setup.
- Invalid Attempt is terminal only for the rejected action, not for the account.

