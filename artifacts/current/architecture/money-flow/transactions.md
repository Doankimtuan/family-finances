# Money Flow

## Real Ledger

Transactions affect real ledger understanding only when real money moves.

```mermaid
flowchart LR
  A["Real account"] -->|expense| B["Merchant/person/provider"]
  C["Employer/person/provider"] -->|income| A
```

Expense:

- Money leaves a real account.
- Household real position decreases unless offset by another real event.
- Category or jar meaning does not move money.

Income:

- Money enters a real account.
- Household real position increases unless it is a transfer, reimbursement, refund, or correction context.

Owned-account transfer:

```mermaid
flowchart LR
  A["Household account A"] -->|transfer| B["Household account B"]
```

- Money changes location.
- Household total real position is neutral by default.
- Transfer is not income or expense by default.
- Fees or exchange effects are separate real ledger meanings.

Refund:

```mermaid
flowchart LR
  A["Original expense"] --> B["Merchant/provider"]
  B -->|refund| C["Household account"]
```

- Returned money is real ledger movement.
- Refund is linked to prior expense meaning when identifiable.
- Refund is not ordinary income when it restores prior spending.

Correction or reversal:

- Correction changes the trusted business story while preserving audit truth.
- Reversal unwinds active meaning without erasing the original history.

## Planning

```mermaid
flowchart LR
  A["Transaction fact"] --> B["Category or jar reference"]
  B --> C["Planning interpretation"]
```

- Planning consumes transaction facts.
- Planning does not create transaction facts.
- Jar reference is virtual meaning and must not be treated as real money movement.

## Inbox

```mermaid
flowchart LR
  A["Unresolved transaction"] --> B["Review work"]
  B --> C["Resolved meaning"]
  C --> A
```

- Inbox consumes unresolved transaction questions.
- Inbox resolution clarifies meaning.
- Inbox does not erase or own the transaction fact.

## Read-Only

Read-only consumers:

- Health.
- Goals.
- Together.
- Reports or summaries.
- Future provider or AI assistance.

Read-only behavior:

- Read transaction facts.
- Interpret or summarize.
- Do not create, mutate, correct, or reverse ledger truth.
