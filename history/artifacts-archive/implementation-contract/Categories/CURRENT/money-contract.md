# Money Contract

## Money Behavior By Action

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
| --- | --- | --- | --- | --- | --- | --- |
| Create Category | None | None | None | None | Category list can be read later | Invalid category, invalid permission, duplicate active meaning |
| Assign Category To Transaction | None | None | No financial ledger write; transaction meaning only | None automatically | Transactions, Planning, Inbox, Health, and reports may read updated meaning | Invalid transaction, invalid category, archived category, permission denied |
| Leave Transaction Uncategorized | None | None | None | None | Unresolved meaning may be read | Missing transaction or permission denied |
| Correct Category Assignment | None | None | No financial ledger write; meaning changes only | None automatically | Consumers may read corrected meaning | Invalid new category, invalid state, permission denied |
| Filter By Category | None | None | None | None | Read-only retrieval | No matches, permission denied |
| Summarize Category Actuals | None | None | None | None | Read-only actuals summary | No data, invalid period, permission denied, material uncertainty |
| Rename Category | None | None | None | None | Updated label may be read | Invalid wording, duplicate active meaning, permission denied |
| Archive Category | None | None | None | None | Historical meaning remains read-visible | Invalid state, would orphan meaning, permission denied |
| Restore Category | None | None | None | None | Category becomes read-visible for future use | Invalid state, duplicate active meaning, permission denied |
| Review Provider Or Merchant Suggestion | None | None | None unless user accepts as valid category assignment meaning | None automatically | Suggestion can be read as evidence | Invalid suggestion, no user acceptance, permission denied |
| Review Shared Category Meaning | None | None | None unless routed to a valid category action | None automatically | Shared meaning may be read | Review becomes approval/blame workflow or actor lacks permission |

## BR-01 Contract

- Category actions never create real money movement.
- Category actions never change amount, account, date, currency, or transaction direction.
- Category actions never create jar capacity, goal funding, or planning allocation.
- Category summaries are actuals-only and never available balances.
- Inbox acknowledgment never moves money.
- Health reads category meaning only.

## No Ambiguous Money Movement

- If an action changes only category meaning, money source and destination are None.
- If a user expects money movement from a category action, the action must fail as a boundary violation.
- If category meaning implies a different financial fact, the user must use the owning domain's valid correction flow; Categories does not perform that correction.
