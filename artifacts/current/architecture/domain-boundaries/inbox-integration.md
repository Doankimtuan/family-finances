# Inbox Integration

## Result

PASS WITH RECOMMENDATIONS

Inbox is correctly defined as a typed decision queue. It must not become a dumping ground for generic notifications.

## Required Inbox Sources

| Source | Inbox Event | Status |
| --- | --- | --- |
| Transactions | Unmapped expense, unclear transaction, correction/refund review | Covered |
| Categories | Category/Jar mapping clarification | Covered through UnmappedExpense and mapping review |
| Planning | Planning clarification, emergency reallocation review, month close triage | Covered |
| Savings | Maturity reminder, matured product decision, early withdrawal confirmation, penalty warning, failed settlement | Covered strongly |
| Loans | Due, overdue, stale, completed, repayment review | Covered conceptually |
| Cards | Payment due, unclear statement, refund mismatch, fee, payment uncertainty | Covered |
| Investments | Stale value, missing source, unclear ownership, uncertain proceeds, impaired holding, invalid classification | Covered conceptually |
| Goals | Goal-related uncertainty or completion decision | Covered conceptually |
| Together | Material policy change or shared decision visibility | Covered conceptually |
| Health | None as producer | Correctly forbidden |

## Inbox Eligibility Rule

An item belongs in Inbox only when it requires:

- household decision;
- partner confirmation;
- source-domain clarification;
- material acknowledgement;
- approved auto-resolution policy.

Items that are only informative belong to notification surfaces, not Inbox.

## Missing Integration Contracts

- Loans need typed ReviewItem payloads for due, overdue, completion, and repayment mismatch.
- Investments need typed ReviewItem payloads that distinguish review from advice.
- Goals need explicit decision eligibility for completion, cancellation, and evidence mismatch.
- Together policy changes need materiality thresholds so Inbox does not flood partners.
- Month Close needs exact stale-item handling across all source domains, not only unmapped expenses and emergencies.

## Non-Dumping-Ground Safeguard

Every Inbox item must carry:

- source domain;
- source identifier or source reason;
- ReviewItem type;
- decision question;
- allowed outcomes;
- auto-resolution policy;
- expiration behavior;
- source-domain outcome consumer.

