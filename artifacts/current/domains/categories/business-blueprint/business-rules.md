# Business Rules

This document records business behavior affecting Categories. It does not modify frozen Sources of Truth.

## Existing Rules Applied

| Rule | Business behavior in Categories |
| --- | --- |
| BR-01 Real Ledger is not Virtual Planning | Categories classify real transaction meaning but never become account balance, jar capacity, budget, or available money. |
| BR-12 Category-Jar mapping | Category meaning may connect to planning interpretation, but Categories do not own jar state or planning decisions. |
| BR-14 AI non-invention | Suggested or inferred categories must not silently invent final household meaning. |
| BR-24 Health is read-only | Health may read category patterns but cannot create, change, approve, or reject categories. |

## Clarified Rules

| Rule | Business behavior |
| --- | --- |
| Category is classification only | A category is a household label for transaction meaning. It is not money, balance, limit, plan, merchant, payment method, or provider truth. |
| Household category overrides provider category | Provider labels, merchant categories, and inferred hints are evidence only. Household-understood meaning is the accepted category. |
| Category history remains interpretable | Rename, archive, restore, and correction must not make old transaction history misleading. |
| Uncategorized is valid uncertainty | A transaction may remain uncategorized when household meaning is unknown. Unknown meaning must not be guessed. |
| Category actuals are past facts only | Category summaries describe past categorized transactions. They do not represent spendable money, budget, or forecast. |
| Category correction changes meaning only | Correcting a category does not change transaction amount, account, date, currency, or direction. |
| Archived categories preserve history | Archived categories are unavailable for ordinary future selection but remain meaningful for historical records. |
| Shared category meaning is comprehension | Partner review of category meaning supports understanding, not spending approval or surveillance. |

## Derived Rules

| Rule | Business behavior |
| --- | --- |
| Category kind must fit meaning | Income categories classify income meaning; expense categories classify expense meaning. |
| Category cannot execute financial action | A category cannot initiate payment, transfer, withdrawal, settlement, repayment, or allocation. |
| Category cannot own another domain outcome | Categories may be read by other domains but cannot decide Planning, Health, Goals, Cards, Loans, Savings, Accounts, Inbox, or Together outcomes. |
| Suggestion must remain reversible until accepted | Suggested category evidence is not final household meaning until household-understood acceptance occurs. |
| Category vocabulary is household-scoped | Category meaning belongs to the household's shared financial language. |

## Deferred And Rejected Rule Areas

Deferred capabilities do not create active business rules in this blueprint.

Rejected capabilities are explicitly disallowed by the rules above.
