# Money Flow

## Real Money: Debit Card Purchase

```mermaid
flowchart LR
  User["User pays by debit card"]
  Merchant["Merchant"]
  Acquirer["Acquirer / POS"]
  Network["Card network"]
  Issuer["Issuing bank"]
  Account["Payment account"]

  User --> Merchant
  Merchant --> Acquirer
  Acquirer --> Network
  Network --> Issuer
  Issuer --> Account
  Account --> Merchant
```

Debit-card spending reduces real money in the linked payment account after authorization and settlement rules are applied.

## Real Money: Credit Card Purchase and Repayment

```mermaid
flowchart LR
  User["User pays by credit card"]
  Merchant["Merchant"]
  Issuer["Card issuer"]
  CardDebt["Card obligation"]
  BankAccount["Household bank account"]

  User --> Merchant
  Merchant --> Issuer
  Issuer --> CardDebt
  BankAccount --> CardDebt
```

Credit-card spending creates an obligation first. Real household cash leaves later when the household repays the issuer.

## Real Money: Refund

```mermaid
flowchart LR
  Merchant["Merchant refund"]
  Acquirer["Acquirer"]
  Network["Card network"]
  Issuer["Issuer"]
  CardLedger["Card ledger / account"]

  Merchant --> Acquirer
  Acquirer --> Network
  Network --> Issuer
  Issuer --> CardLedger
```

A refund may reduce the current outstanding balance, appear as a credit, or affect a later statement depending on timing.

## Virtual Planning

```mermaid
flowchart TD
  Statement["Statement balance"]
  DueDate["Payment due date"]
  HouseholdPlan["Household cash-flow plan"]
  Jars["Planning jars"]
  ExpectedPayment["Expected card repayment"]

  Statement --> ExpectedPayment
  DueDate --> ExpectedPayment
  ExpectedPayment --> HouseholdPlan
  HouseholdPlan --> Jars
```

Virtual planning does not move money. It forecasts the future bank-account outflow needed to settle card obligations.

## Read-Only Information

```mermaid
flowchart LR
  Provider["Issuer / provider"]
  Statement["Statement"]
  Notifications["App / SMS / email notifications"]
  System["Household finance system"]

  Provider --> Statement
  Provider --> Notifications
  Statement --> System
  Notifications --> System
```

Read-only information informs the household record but is not itself proof that money has moved unless reconciled to provider records.
