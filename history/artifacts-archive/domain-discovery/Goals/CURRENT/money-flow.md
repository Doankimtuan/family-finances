# Money Flow

Goals do not move money by themselves. Money moves in Accounts, Transactions, Savings, Cards, Loans, cash, or external providers. Goals interpret purpose and progress.

## Real Money

```mermaid
flowchart LR
  A["Income source"] --> B["Bank account / cash / e-wallet"]
  B --> C["Real transfer, cash set-aside, or savings product"]
  C --> D["Provider or cash balance"]
  D --> E["Real purchase, payment, withdrawal, or use"]
```

Real money flow belongs to money-holding and ledger domains.

## Virtual Planning

```mermaid
flowchart LR
  A["Household intention"] --> B["Goal name"]
  B --> C["Target amount"]
  B --> D["Optional target date"]
  B --> E["Perceived funded amount"]
  E --> F["Progress interpretation"]
  F --> G["Active / paused / completed / cancelled"]
```

Virtual planning flow belongs to Goals and Planning. It expresses intention and interpretation, not provider-confirmed cash.

## Read-Only Information

```mermaid
flowchart LR
  A["Accounts"] --> E["Goal context"]
  B["Transactions"] --> E
  C["Savings products"] --> E
  D["Cards / Loans"] --> E
  E --> F["Household understanding"]
```

Read-only information may inform confidence, affordability, or factual comparison. Ownership remains with the source domain.

## Important Separation

- A goal contribution can be an intention record without a bank transfer.
- A bank transfer can support a goal without the goal owning that transfer.
- A savings product can be associated with a goal without the goal owning product truth.
- Spending goal money is a real transaction or cash event, not a goal event by itself.
