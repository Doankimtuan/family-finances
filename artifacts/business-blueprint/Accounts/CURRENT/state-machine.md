# State Machine

## Business States

| State | Meaning |
|-------|---------|
| Candidate | A real-world container the household may track. Not yet an account. |
| Draft | Account details are being established but not yet active. |
| Active | Account is valid for current household use. |
| Needs Review | Account truth or state is uncertain. |
| Historical | Account is not active but remains meaningful for history. |
| Closed | Real-world container is closed or permanently ended. |
| Abandoned Draft | Draft was not completed. |
| Invalid Attempt | Requested transition or action violates business rules. |

## Allowed Transitions

| From | To | Allowed when |
|------|----|--------------|
| Candidate | Draft | Household chooses to track the container. |
| Draft | Active | Required account facts are valid. |
| Draft | Abandoned Draft | Household stops setup before activation. |
| Active | Needs Review | Balance, identity, relevance, or state is uncertain. |
| Needs Review | Active | Uncertainty is resolved. |
| Active | Historical | Account no longer active but history matters. |
| Historical | Active | Account becomes relevant again. |
| Active | Closed | Real-world account is closed or ended. |
| Closed | Historical | Closure retained as historical record. |
| Needs Review | Historical | Account is no longer active and uncertainty does not block history. |
| Needs Review | Closed | Closure is confirmed. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Account must first have required business facts. |
| Draft | Closed | A non-active draft cannot be closed as real account history. |
| Closed | Active | Closed real-world account cannot become active without a restore determination. |
| Historical | Draft | Historical account already exists. |
| Any | Planning/Jar state | Accounts cannot become virtual planning containers. |
| Any | Health-mutated state | Health cannot change account state. |

## Recovery Transitions

| Situation | Recovery transition |
|-----------|---------------------|
| Wrong account marked Historical | Historical → Active |
| Active account has wrong facts | Active → Needs Review → Active |
| Account closed with unresolved meaning | Active → Needs Review → Closed/Historical |
| Duplicate suspected | Active → Needs Review; duplicate handling remains business review, not automatic merge. |

## Terminal States

Abandoned Draft:

- Terminal for incomplete setup.
- Does not represent household financial history.

Closed:

- Terminal for active use.
- May remain viewable as historical record.

Invalid Attempt:

- Terminal for the attempted action only.
- The account itself remains in its previous valid state.

