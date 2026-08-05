# Money Flow

## Real Money

Real money movement changes a real-world container.

```mermaid
flowchart LR
  Employer["Employer"] -->|salary deposit| BankAccount["Bank payment account"]
  BankAccount -->|cash withdrawal| Cash["Physical cash"]
  BankAccount -->|wallet top-up| EWallet["E-wallet"]
  Cash -->|cash spending| Merchant["Merchant"]
  EWallet -->|QR or in-app payment| Merchant
  BankAccount -->|bank transfer or VietQR| Merchant
  BankAccount -->|transfer| OtherBank["Other bank account"]
```

```mermaid
flowchart LR
  BankAccount["Funding account"] -->|principal out| TermDeposit["Savings product / term deposit"]
  TermDeposit -->|maturity payout| SettlementAccount["Settlement account"]
  TermDeposit -->|early withdrawal payout| SettlementAccount
```

```mermaid
flowchart LR
  Merchant["Merchant"] -->|card authorization| CardIssuer["Card issuer"]
  CardIssuer -->|statement / outstanding obligation| CardAccount["Credit card account"]
  BankAccount["Bank account"] -->|repayment| CardIssuer
```

## Virtual Planning

Virtual planning does not move real money. It assigns intention to money that still lives in accounts.

```mermaid
flowchart LR
  AccountTotal["Real account total"] -. informs .-> Jars["Jars / allocations"]
  Jars -. guides .-> SpendingDecision["Spending decision"]
  SpendingDecision -->|if spending happens| RealTransaction["Real transaction"]
  RealTransaction --> AccountTotal
```

## Read-Only Information

Read-only flows mirror external facts but do not move money.

```mermaid
flowchart LR
  Bank["Bank app / statement"] -. balance and transactions .-> Product["Household record"]
  Wallet["Wallet app"] -. balance and transactions .-> Product
  Product -. summary .-> Health["Health"]
  Product -. account context .-> Inbox["Inbox"]
  Product -. real position .-> Home["Home"]
```

## Key Observations

- Real money movement occurs outside the product unless the product is explicitly integrated with payment rails.
- Account records can describe or reflect money movement without legally executing it.
- Transfers between owned accounts move real money but do not change household net worth.
- Planning allocations are virtual and should not be confused with account movement.
- Read-only imported data may be delayed, partial, duplicated, or stale.

