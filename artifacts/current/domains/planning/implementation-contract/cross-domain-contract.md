# Cross-Domain Contract

## Interactions

| Domain | Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- | --- |
| Accounts | Accounts | Planning | Accounts provide where money is; Planning reads context. | Planning never treats jars as accounts. |
| Transactions | Transactions | Planning | Transactions provide actual income, expense, transfer, refund, and correction facts. | Planning compares intention with facts without mutating transactions. |
| Cards | Cards | Planning | Cards provide card due and obligation truth. | Planning may show repayment pressure, not card balance truth. |
| Loans | Loans | Planning | Loans provide repayment obligation truth. | Planning may show repayment pressure, not loan balance truth. |
| Savings | Savings | Planning | Savings provides product balance, maturity, renewal, and withdrawal truth. | Planning goals remain intention. |
| Planning | Planning | Home, Health, Inbox, household | Planning provides plan pulse and intention state. | Consumers read intention without treating it as money. |
| Goals | Planning | Household, Home, Health | Goals are planning intention. | Goal progress is not product balance unless read from Savings context. |
| Inbox | Planning or source domains | Inbox and household | Inbox handles decision work only. | Review items clarify Planning without moving money. |
| Health | Planning and source domains | Health | Health reads facts and intention. | Health does not mutate Planning. |
| Categories | Transactions/Categories | Planning | Categories provide meaning labels. | Categories may inform Planning but are not jars by default. |
| Together | Together | Planning | Together provides membership and partner-visible policy. | Planning enforces permissions and shared visibility. |

## Cross-Domain Failure Rules

- Missing source fact cannot be treated as confirmed.
- Conflicting source fact moves Planning to Needs Review or leaves expected value explicit.
- Source-domain write request from Planning is forbidden.
- Cross-domain read failure must not corrupt Planning state.
