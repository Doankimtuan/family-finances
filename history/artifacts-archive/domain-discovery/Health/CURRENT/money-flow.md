# Money Flow

Health does not own money. It observes money movement and interprets pressure.

## Real Money

```mermaid
flowchart LR
  Income["Income"] --> Accounts["Accounts / Cash / Wallets"]
  Accounts --> Spending["Living Expenses"]
  Accounts --> Obligations["Loans / Cards / Bills"]
  Accounts --> Savings["Savings / Emergency Buffer"]
  Accounts --> Medical["Medical Costs"]
  Insurance["Public / Private Insurance"] --> Reimbursement["Coverage / Reimbursement"]
  Reimbursement --> Accounts
  Family["Family Support"] --> Accounts
  Accounts --> FamilyOut["Family Support Sent"]
```

Real money belongs to Accounts, Transactions, Cards, Loans, Savings, Insurance-related records, and external providers. Health reads the resulting condition.

## Virtual Planning

```mermaid
flowchart LR
  Goals["Goals"] --> Intention["Future Intention"]
  Planning["Planning / Jars"] --> Intention
  Recurring["Known Recurring Pressure"] --> Intention
  Intention --> Health["Health Interpretation"]
```

Virtual planning reflects intent and pressure. It is not bank balance and does not prove liquidity.

## Read-Only Information

```mermaid
flowchart LR
  LedgerFacts["Ledger Facts"] --> Health["Health"]
  PlanFacts["Plan Facts"] --> Health
  InboxFacts["Inbox Facts"] --> Health
  DebtFacts["Debt Facts"] --> Health
  CardFacts["Card Facts"] --> Health
  Health --> Signal["Condition Signal"]
  Health --> Notices["Observations"]
  Health --> Scenarios["Read-Only Scenarios"]
```

Health creates interpretation only. It does not create, edit, delete, approve, transfer, repay, reconcile, or close financial records.
