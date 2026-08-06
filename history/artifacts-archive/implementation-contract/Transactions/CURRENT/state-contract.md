# State Contract

## Business States

| State | Implementation meaning |
|-------|------------------------|
| Candidate | Observed money movement before a valid transaction fact exists. Not persistent business truth. |
| Recorded | Required factual anchors exist and the transaction is real ledger truth. |
| Needs Review | Transaction is factual but household meaning, transfer interpretation, refund relation, or planning reference is incomplete. |
| Resolved | Transaction fact and household meaning are sufficient for normal use. |
| Refund Linked | Transaction history includes valid refund relationship. |
| Corrected | Transaction history includes audit-safe correction relationship. |
| Reversed | Transaction has been unwound in business meaning without erasing history. |
| Historical | Transaction is no longer active work but remains read-visible as household memory and account evidence. |
| Invalid Attempt | Failed action state for the attempted command only; underlying transaction remains unchanged. |

## Allowed Transitions

| From | To | Contract |
|------|----|----------|
| Candidate | Recorded | Required facts and permissions pass. |
| Candidate | Invalid Attempt | Required facts, permissions, or real-money basis fail. |
| Recorded | Resolved | Meaning is complete. |
| Recorded | Needs Review | Meaning or interpretation is incomplete. |
| Needs Review | Resolved | Household resolves the open question. |
| Resolved | Needs Review | Later evidence creates uncertainty. |
| Recorded | Refund Linked | Valid refund relationship is established. |
| Resolved | Refund Linked | Valid refund relationship is established. |
| Needs Review | Refund Linked | Refund clarifies the unresolved question. |
| Recorded | Corrected | Valid correction is applied. |
| Resolved | Corrected | Valid correction is applied. |
| Needs Review | Corrected | Valid correction resolves or clarifies uncertainty. |
| Recorded | Reversed | Valid reversal is applied. |
| Resolved | Reversed | Valid reversal is applied. |
| Needs Review | Reversed | Valid reversal resolves invalid active meaning. |
| Resolved | Historical | No active review remains. |
| Refund Linked | Historical | Refund-linked story no longer needs active review. |
| Corrected | Historical | Corrected story no longer needs active review. |
| Reversed | Historical | Reversed story is historical only. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Resolved | Must first become a recorded fact. |
| Needs Review | Historical | Cannot hide unresolved active uncertainty unless explicitly accepted as historical uncertainty. |
| Historical | Candidate | Existing history cannot become unrecorded. |
| Reversed | Resolved | Reversed transaction cannot return to ordinary resolved state. |
| Corrected | Candidate | Corrected history cannot become unrecorded. |
| Any | Planning/Jar state | Violates BR-01. |
| Any | Health-mutated state | Violates BR-24. |
| Any | AI-authoritative state | Violates AI assistance guardrail. |

## Recovery Transitions

| Situation | Recovery |
|-----------|----------|
| Missing meaning | Recorded → Needs Review → Resolved |
| Wrong meaning only | Resolved → Needs Review → Resolved |
| Wrong financial facts | Recorded/Resolved/Needs Review → Corrected |
| Transaction should not stand | Recorded/Resolved/Needs Review → Reversed |
| Refund arrives | Recorded/Resolved/Needs Review → Refund Linked |
| Truth cannot be proven | Recorded/Resolved → Needs Review |
| Active work complete | Resolved/Refund Linked/Corrected/Reversed → Historical |

## Terminal States

Historical:

- Terminal for active work.
- Read-visible and available for account evidence.

Reversed:

- Terminal for active transaction meaning.
- May transition only to Historical.

Invalid Attempt:

- Terminal for failed action only.
- Must not mutate underlying transaction state.
