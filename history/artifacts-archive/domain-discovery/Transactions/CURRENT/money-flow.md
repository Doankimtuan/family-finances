# Money Flow

## Real Money

Real money flow is movement recognized by a bank, wallet, card issuer, cash holder, merchant, employer, lender, or another person.

```mermaid
flowchart LR
  A["Income source"] --> B["Household account or wallet"]
  B --> C["Merchant or service provider"]
  B --> D["Family or other person"]
  C --> E["Refund back to account or wallet"]
```

```mermaid
flowchart LR
  A["Household account"] --> B["Own cash wallet"]
  A --> C["Own e-wallet"]
  C --> D["Merchant payment"]
  C --> A
```

```mermaid
flowchart LR
  A["Card issuer"] --> B["Merchant authorization"]
  B --> C["Posted card purchase"]
  D["Household bank account"] --> E["Card payment"]
  E --> A
```

## Virtual Planning

Virtual planning uses transaction facts as inputs but does not itself move money.

```mermaid
flowchart LR
  A["Recorded transaction"] --> B["Category or jar mapping"]
  B --> C["Plan capacity or review context"]
  C --> D["Household decision"]
```

Planning movement is not a transaction unless real money also moves.

## Read-Only Information

Read-only information describes activity without creating direct money movement inside the product.

```mermaid
flowchart LR
  A["Bank, wallet, or card statement"] --> B["Imported or reviewed transaction data"]
  B --> C["Household record"]
  C --> D["Search, review, reconciliation, and insight"]
```

Read-only information can be incomplete, delayed, duplicated, or corrected by the provider.
