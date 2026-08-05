# Current Product Gap

This document compares the discovered real-world Accounts domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- The official domain model includes Account as a Real Ledger entity.
- Domain philosophy defines Accounts as real money containers and emphasizes BR-01: Real Ledger is not Virtual Jars.
- The current ledger constants define account types: cash, checking, savings, ewallet, brokerage, credit_card, savings_product, and other.
- Initial tenancy onboarding creates an accounts table with name, type, opening_balance, archive state, household ownership, and creator metadata.
- The original accounts table check constraint listed cash, checking, savings, ewallet, brokerage, and other; later code includes credit_card and savings_product as account types.
- Real position reads active non-credit-card accounts and derives balances from opening balances plus transaction deltas.
- Account list and detail exist under the Money surface.
- Account creation supports cash/wallet-style accounts and credit-card account creation with separate credit-card settings.
- Health reads account count and real position but does not invent balances.
- Transactions reference accounts.
- Savings flows reference funding and settlement accounts and use a savings-product account in some flows.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
|--------------------|--------------------------|-------------|
| Institution identity matters for reconciliation. | Account records observed with name/type/opening balance. | No clear current account-level institution identity in the observed base account shape. |
| Account numbers are often recognized by safe masks. | Observed account shape does not include mask. | No factual evidence of account mask support in the base account record. |
| Legal holder and practical household owner can differ. | Household ownership and creator metadata exist. | No factual evidence of account holder metadata distinct from household membership. |
| Currency can vary by account in real life. | Household base currency is read; default currency is VND. | No factual evidence of per-account currency in the base account record. |
| Balance freshness matters for manual and imported records. | Balances are derived from recorded opening balance and transactions. | No factual evidence of last-reconciled or last-updated balance freshness metadata. |
| External institution balance can differ from recorded balance. | Product derives recorded balance internally. | No factual evidence of institution-balance comparison fields. |
| Available balance and current balance can differ. | Product uses recorded balance. | No factual evidence of separate current, available, pending, or held balances. |
| Transfers between owned accounts are a distinct money movement. | Transactions reference accounts; transfer lifecycle exists in cohesion artifacts. | No factual evidence from observed account APIs that Accounts own transfer semantics. |
| E-wallets have provider-specific restrictions and linked-bank relationships. | E-wallet is an account type. | No factual evidence of wallet provider, verification, withdrawal, or linked-bank metadata. |
| Credit cards are not owned money. | Product excludes credit cards from real position and has card settings. | Current code still represents credit cards through the accounts table/type, creating a factual modeling tension with the philosophy statement that credit cards are not Accounts. |
| Savings products have maturity and liquidity terms. | Separate Savings module and savings-product account type exist. | Account-level liquidity/maturity distinction is not evident in the base account shape. |
| Closed accounts keep history. | is_archived exists. | Closure reason/date and real-world close state are not evident in the base account shape. |

## Product-Definition Alignment Observations

- The strongest alignment is the separation between real position and virtual jars.
- The Money surface already treats Accounts as a foundation for real position.
- Credit cards and savings products are partially represented through Accounts and partially through specialized domains, which requires careful interpretation in future design phases.
- The current observed product is intentionally minimal for MVP; several real-world account properties are absent from the observed base account shape.

No implementation changes are proposed in this discovery phase.
