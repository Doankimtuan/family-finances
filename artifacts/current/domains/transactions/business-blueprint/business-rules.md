# Business Rules

## Existing Rules

| Rule | Behavior in Transactions |
|------|--------------------------|
| BR-01 Real Ledger is not Virtual Planning | Transactions are real ledger facts. Categories, jars, plans, and goals explain meaning but do not move real money. |
| BR-02 Action context | Household money actions require valid household/user context. |
| BR-02a Membership protection | Transaction facts belong to a household and are protected by membership. |
| BR-06 Positive magnitude and explicit direction | Income and expense use clear direction and positive amount meaning. Transfer handling must not confuse direction with spending/income. |
| BR-12 One household MVP | Transaction relevance is evaluated within the active household scope. |
| BR-15 Online-first money mutations | Transaction-affecting money changes are not offline write behavior in current scope. |
| BR-24 Health read-only | Health may consume transaction facts but must never mutate transactions. |

## Clarified Rules

| Rule | Clarification |
|------|---------------|
| Transaction facts are real-ledger events only | A transaction cannot represent a jar allocation, goal intention, forecast, or reminder. |
| Transfer neutrality | Movement between household-owned accounts is not income or expense by default. |
| Category as meaning | Category explains purpose but does not change real money movement. |
| Jar reference as planning meaning | Jar reference may connect a transaction to intention but does not move real money. |
| Review does not change truth | Review clarifies meaning; it does not alter amount, account, date, currency, or direction unless a valid correction occurs. |
| Refund as linked real event | Refund is money movement related to a prior transaction, not ordinary income when linked. |
| Correction audit truth | Corrections must preserve a business story of original and corrected truth. |
| Reversal audit truth | Reversal unwinds active meaning without erasing history. |
| Lightweight reconciliation | Reconciliation supports confidence but does not make provider data automatically authoritative. |
| AI assistance limit | AI may suggest meaning only; it cannot create, mutate, or finalize ledger truth autonomously. |

## Derived Rules

| Rule | Business behavior |
|------|-------------------|
| Transaction requires real account context | Every transaction must connect to a real active account or valid transfer context. |
| Invalid attempts preserve prior state | Failed transaction actions do not alter previous valid business state. |
| Historical preservation | Transactions remain explainable after correction, reversal, refund, account closure, or time passing. |
| Read-only consumers cannot repair transaction truth | Health, Goals, summaries, AI, and provider information cannot change transaction facts. |
| Unresolved facts remain visible | Missing meaning creates review work; it does not justify hiding the transaction. |
| Financial safety outranks convenience | Automation or shortcuts must not compromise user-understood ledger truth. |
