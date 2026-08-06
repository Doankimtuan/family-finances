# Cross-Domain Interactions

## Accounts

Producer:

- Accounts provides account context through Transactions.

Consumer:

- Categories does not consume account balances directly except as transaction context.

Ownership:

- Accounts owns real balances and where money is.
- Categories owns purpose labels only.

Responsibilities:

- Category behavior must not mutate account state or imply account balance.

## Transactions

Producer:

- Transactions produces transaction facts that may need meaning.

Consumer:

- Categories provides labels used to classify transaction facts.

Ownership:

- Transactions owns amount, date, currency, account, direction, refund, correction, and real ledger truth.
- Categories owns classification vocabulary and assignment meaning.

Responsibilities:

- Category assignment must never rewrite transaction facts.

## Cards

Producer:

- Cards may provide statement, merchant category, MCC, reward, billing, fee, refund, or payment context.

Consumer:

- Categories may use card evidence only as classification context.

Ownership:

- Cards owns card lifecycle and provider/card truth.
- Categories owns household meaning if accepted.

Responsibilities:

- Card provider category cannot become final household category by itself.

## Loans

Producer:

- Loans provides liability and repayment context.

Consumer:

- Categories may classify related transaction meaning.

Ownership:

- Loans owns schedule, principal, interest, liability, repayment, and payoff truth.
- Categories owns label meaning only.

Responsibilities:

- Loan repayment must not be misrepresented as the original consumption category.

## Savings

Producer:

- Savings provides product, maturity, contribution, withdrawal, and interest context.

Consumer:

- Categories may classify visible transaction meaning where appropriate.

Ownership:

- Savings owns product state and savings movement truth.
- Categories does not own savings balances or maturity state.

Responsibilities:

- Savings movement must not be mistaken for ordinary category spending.

## Planning

Producer:

- Planning may consume category meaning as actual behavior evidence.

Consumer:

- Categories may reference planning interpretation only as boundary context.

Ownership:

- Planning owns jars, virtual capacity, allocation, and planning decisions.
- Categories owns transaction classification meaning.

Responsibilities:

- Category-to-jar mapping must not make Categories own jar state.

## Goals

Producer:

- Goals may provide future-purpose context for household interpretation.

Consumer:

- Goals may read category evidence about actual spending.

Ownership:

- Goals owns future intention and progress meaning.
- Categories owns transaction purpose labels.

Responsibilities:

- Category meaning must not imply goal funding or completion.

## Inbox

Producer:

- Inbox may surface unresolved category meaning as household work.

Consumer:

- Categories provides the vocabulary needed to resolve classification.

Ownership:

- Inbox owns review state.
- Categories owns accepted label meaning.

Responsibilities:

- Categories must not own pending/resolved/dismissed review workflow.

## Health

Producer:

- Categories provides read-only patterns.

Consumer:

- Health may read category evidence.

Ownership:

- Health owns interpretation only and is read-only.
- Categories owns labels.

Responsibilities:

- Health cannot create, change, approve, or reject categories.

## Categories

Producer:

- Categories produces household classification meaning.

Consumer:

- Categories consumes household decisions and non-authoritative evidence.

Ownership:

- Categories owns vocabulary, active/archive state, assignment meaning, and actuals classification.

Responsibilities:

- Categories must remain modest and classification-only.

## Together

Producer:

- Together provides household membership and shared context.

Consumer:

- Categories relies on household context for shared vocabulary.

Ownership:

- Together owns who belongs to the household and what shared context is valid.
- Categories owns category meaning once used by the household.

Responsibilities:

- Shared category review must support understanding, not surveillance.
