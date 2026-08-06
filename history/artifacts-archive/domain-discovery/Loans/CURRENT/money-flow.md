# Money Flow

## Real Money

Formal disbursement:

```mermaid
flowchart LR
  Lender["Lender"] -->|"Disburses principal"| Account["Borrower's account"]
  Account -->|"Spends / transfers"| Purpose["Loan purpose"]
```

Merchant-financed purchase:

```mermaid
flowchart LR
  Lender["Finance provider"] -->|"Pays merchant or settles purchase"| Merchant["Merchant"]
  Merchant -->|"Provides goods/service"| Household["Household"]
```

Scheduled repayment:

```mermaid
flowchart LR
  Account["Payment account / cash"] -->|"Principal + interest + fees"| Lender["Lender"]
  Lender -->|"Reduces outstanding obligation"| Loan["Loan balance"]
```

Informal family loan:

```mermaid
flowchart LR
  Family["Family / friend"] -->|"Cash or transfer"| Household["Household"]
  Household -->|"Agreed repayment"| Family
```

## Virtual Planning

Planned repayment schedule:

```mermaid
flowchart LR
  Terms["Known loan terms"] --> Schedule["Projected repayment schedule"]
  Schedule --> Forecast["Future cash-flow planning"]
  Forecast --> Decisions["Household decisions"]
```

Projected payoff:

```mermaid
flowchart LR
  Remaining["Remaining principal"] --> Estimate["Payoff estimate"]
  Upcoming["Expected interest / fee assumptions"] --> Estimate
  Estimate --> Planning["Planning only"]
```

Virtual planning does not move money and does not prove lender confirmation.

## Read-Only Information

Provider statement:

```mermaid
flowchart LR
  Provider["Bank / finance app / statement"] -->|"Read-only balance, schedule, rate, status"| Product["Household finance product"]
  Product -->|"Display / compare / explain"| User["User"]
```

Credit-history information:

```mermaid
flowchart LR
  Lender["Reporting lender"] --> CIC["Credit information system"]
  CIC -->|"May influence borrowing access"| FutureLender["Future lender"]
```

Read-only information can be stale, delayed, partial, or formatted differently from household records.

