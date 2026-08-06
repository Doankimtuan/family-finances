# Household User Journeys

## Result

PASS WITH RECOMMENDATIONS

The requested household journeys are completable with existing domains, except where legal ownership, country relocation, or provider automation exceeds current approved scope. Those are supportable as future integrations without redesign if they remain inside existing boundaries.

| Journey | Completeness | Required Domains |
| --- | --- | --- |
| First salary | Complete | Accounts, Transactions, Planning, Categories, Inbox if unmapped, Health |
| Emergency expense | Complete | Transactions, Categories, Planning, Inbox, Together, Month Ritual, Health |
| Monthly budgeting | Complete | Planning, Categories, Transactions, Inbox, Month Ritual, Health |
| Saving for vacation | Complete | Goals, Planning, Savings if product used, Transactions, Health |
| Buying a house | Partially complete | Goals, Planning, Savings, Loans, Accounts, Transactions; real estate ownership is future scope |
| Borrowing money | Complete | Loans, Accounts, Transactions, Inbox, Planning, Health |
| Receiving repayment | Complete | Transactions, Accounts, Loans if loan-related, Categories, Health |
| Investing every month | Complete with manual scope | Planning, Transactions, Investments, Accounts, Inbox, Health |
| Retirement planning | Partially complete | Goals, Planning, Investments, Savings, Health; advisory-grade retirement planning is out of scope |
| Having first child | Complete as household planning journey | Together, Planning, Goals, Categories, Transactions, Health |
| Family emergency | Complete | Transactions, Planning, Inbox, Together, Month Ritual, Health |
| Job loss | Complete as planning and health journey | Planning, Transactions, Accounts, Inbox, Health, Together |
| Death of family member | Partial | Together and Accounts preserve history, but legal ownership transfer and estate handling are not specified |
| Moving abroad | Partial | Accounts and Transactions can track facts, but multi-country tax, residency, and FX policy are future scope |
| Changing bank | Complete | Accounts, Transactions, Transfers, Inbox if reconciliation needed, Health |

## Journey Notes

Buying a house can be represented as a goal, savings accumulation, loan obligation, and real transactions. The actual property asset is not modeled as a first-class real estate domain yet.

Retirement planning can be represented as long-term goals and investment holdings, but ViNha correctly avoids advisory-grade recommendations.

Death of a family member and moving abroad are not blockers for current approval, but they are the strongest household-continuity risks because they stress membership, access, legal ownership, and historical visibility.

