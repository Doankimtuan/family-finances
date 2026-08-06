# State Machine

## Business States

| State | Meaning |
|-------|---------|
| Candidate | A real-world money movement has been observed but is not yet a transaction fact. |
| Recorded | Required factual anchors are present and the transaction exists as real ledger truth. |
| Needs Review | Transaction is factual, but household meaning or interpretation is incomplete. |
| Resolved | Transaction fact and household meaning are sufficient for normal use. |
| Refund Linked | Transaction history includes a related refund event. |
| Corrected | Transaction history includes an audit-safe correction. |
| Reversed | Transaction has been unwound in business meaning without erasing history. |
| Historical | Transaction remains for long-term household memory and account explanation. |
| Invalid Attempt | Requested action violated business rules and did not change the transaction. |

## Allowed Transitions

| From | To | Allowed when |
|------|----|--------------|
| Candidate | Recorded | Required transaction facts are valid. |
| Candidate | Invalid Attempt | Candidate lacks real money movement or required facts. |
| Recorded | Resolved | Meaning is complete enough for household use. |
| Recorded | Needs Review | Meaning, mapping, transfer interpretation, or original relation is incomplete. |
| Needs Review | Resolved | Household resolves the open question. |
| Resolved | Needs Review | Later evidence creates uncertainty. |
| Recorded | Refund Linked | A valid refund relation is established. |
| Resolved | Refund Linked | A valid refund relation is established. |
| Needs Review | Refund Linked | Refund clarifies or partially clarifies the transaction. |
| Recorded | Corrected | A valid correction explains prior error. |
| Resolved | Corrected | A valid correction explains prior error. |
| Needs Review | Corrected | Correction resolves or clarifies uncertainty. |
| Recorded | Reversed | Valid reversal unwinds transaction meaning. |
| Resolved | Reversed | Valid reversal unwinds transaction meaning. |
| Needs Review | Reversed | Reversal resolves invalid active meaning. |
| Refund Linked | Historical | Refund-linked story no longer needs active review. |
| Corrected | Historical | Corrected story no longer needs active review. |
| Reversed | Historical | Reversed story remains as history only. |
| Resolved | Historical | Transaction is no longer active review work. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Resolved | A transaction must first be recorded as fact. |
| Needs Review | Historical | Unresolved active uncertainty cannot be hidden as history unless intentionally accepted as historical uncertainty. |
| Historical | Candidate | Historical transaction already exists. |
| Reversed | Resolved | Reversed transaction cannot return to ordinary resolved state without separate correction reasoning. |
| Corrected | Candidate | Corrected history cannot become unrecorded. |
| Any | Planning/Jar state | Transactions cannot become virtual planning states. |
| Any | Health-mutated state | Health cannot change transaction state. |
| Any | AI-authoritative state | AI cannot own ledger truth. |

## Recovery Transitions

| Situation | Recovery transition |
|-----------|---------------------|
| Missing meaning | Recorded → Needs Review → Resolved |
| Wrong category | Resolved → Needs Review → Resolved |
| Wrong amount/account/date/direction | Recorded/Resolved → Corrected → Historical |
| Transaction should be unwound | Recorded/Resolved/Needs Review → Reversed → Historical |
| Refund arrives later | Recorded/Resolved/Needs Review → Refund Linked → Historical |
| Real-world truth cannot be proven | Recorded/Resolved → Needs Review until accepted or corrected |

## Terminal States

Historical:

- Terminal for active business work.
- Still available for account evidence and household memory.

Reversed:

- Terminal for active transaction meaning.
- May remain visible as historical explanation.

Invalid Attempt:

- Terminal for the failed action only.
- The underlying transaction, if any, remains in its previous valid state.
