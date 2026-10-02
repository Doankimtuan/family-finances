# Accounts Financial Semantics

| Invariant                          | Implementation contract                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opening Balance ≠ Income           | Opening balance records money already present when tracking begins. `createAccount` stores it in the account's opening balance and does not create an income transaction. The form says it is not new income. |
| Transfer ≠ Income/Expense          | Existing transfer ledger types remain explicit. Account activity presentation uses transaction type rather than amount sign. No transfer logic changed.                                                       |
| Credit Limit ≠ Asset               | Credit cards are excluded from the owned-account balance. The credit limit appears only in credit-card detail.                                                                                                |
| Available Credit ≠ Asset           | Available credit is a card fact only; it is not included in owned cash or account group totals.                                                                                                               |
| Credit Debt ≠ Spending Total       | Current debt/outstanding is read from credit-card queries and presented as a liability. It is distinct from limit, available credit, and transaction spending totals.                                         |
| New credit account debt            | Current `createAccount` behavior forces new-card opening balance to zero. No unsupported debt-entry control was added.                                                                                        |
| Metadata edit ≠ financial mutation | Existing account edit only updates name, supported type, and icon. The UI does not alter balances or create transactions.                                                                                     |
| Archive ≠ delete/close             | Existing account archive is reversible soft archive; no hard delete or close behavior was added.                                                                                                              |

The only newly displayed derived amount is an application-layer sum of the existing account balances within a directory group. It does not alter persisted values, account eligibility, or the existing total-owned-balance calculation.
