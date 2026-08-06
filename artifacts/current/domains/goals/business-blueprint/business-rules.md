# Business Rules

## Existing Rules

| Rule | Behavior in Goals |
| --- | --- |
| BR-01 Real Ledger is not Virtual Planning | Goals are intention only; progress and contributions are not balances or transactions. |
| BR-02 Action context | Goal changes require valid household context. |
| BR-02a Membership protection | Goals belong to the active household and are protected by membership. |
| BR-06 Positive amount and direction | Goal target and contribution magnitudes must be positive when represented as amounts. |
| BR-08 Month Ritual lock | If Planning period lock applies, normal goal intention changes follow the approved Planning lock behavior. |
| BR-13 Partner-visible assumptions | Shared goal visibility must respect household trust and partner sensitivity. |
| BR-14 AI non-invention | AI must not invent goal balances, evidence, affordability, or actions. |
| BR-15 Online-first money mutations | Goal changes follow current online-first money-action constraints where applicable. |
| BR-24 Health read-only | Health may read Goals but cannot mutate Goals. |

## Clarified Rules

| Rule | Clarification |
| --- | --- |
| Goal progress is intention | Funded or progress amount represents household interpretation, not real money proof. |
| Goal contribution is not payment | A contribution updates goal progress unless Transactions owns a real movement. |
| Goal completion is not purchase completion | Completed goal state does not prove payment, purchase, transfer, or withdrawal. |
| Goal target date is household timing | Target date is desired timing unless another domain owns confirmed due truth. |
| Goal evidence is read-only | Accounts, Transactions, Savings, Cards, and Loans remain source owners. |
| Savings association is context only | Savings owns product balance, rate, tenor, maturity, withdrawal, renewal, and settlement. |
| Goal visibility is household-sensitive | Shared visibility must not imply blame or partner-specific contribution policy beyond approved scope. |

## Derived Rules

| Rule | Business behavior |
| --- | --- |
| Invalid goal action preserves prior valid state | Boundary-breaking or invalid attempts do not change the goal. |
| Terminal states end ordinary pursuit | Completed and Cancelled goals cannot resume as ordinary continuation. |
| Overfunding is progress interpretation | Progress above target does not imply spare real money. |
| Missing evidence is uncertainty | Lack of source-domain fact cannot prove that goal progress is wrong or right. |
| Source truth wins for real money | If source-domain facts conflict with goal interpretation, real money truth belongs to the source domain. |
| Deferred scope stays out | Priority, recurring contributions, forecasting, provider matching, AI, and confidence scoring are not current Goals behavior. |
