# Screen Hierarchy

## Public/Auth/System

```text
Public Entry
├── Welcome
├── Splash
├── Login
├── Register
├── Forgot Password
├── Auth Confirm
└── Invite Accept

Onboarding
└── Together Onboard

System
├── Error
├── Offline
├── Maintenance
└── Permission
```

## Product

```text
Home
└── Household Dashboard

Money
├── Money Overview
├── Accounts
│   ├── New Account
│   └── Account Detail
├── Transactions
│   ├── New Transaction
│   └── Transaction Detail
│       ├── Edit Transaction
│       ├── Refund Transaction
│       └── Correct Transaction
└── Products
    ├── Debts
    │   ├── New Debt
    │   └── Debt Detail
    │       └── Pay Debt
    ├── Loans
    │   ├── New Loan
    │   └── Loan Detail
    │       ├── Pay Loan
    │       ├── Edit Loan
    │       ├── Edit Loan Interest
    │       └── Close Loan
    └── Savings
        ├── New Saving
        └── Saving Detail
            ├── Renewal Policy
            └── Early Withdraw

Plan
├── Plan Overview
├── Jars
│   ├── New Jar
│   ├── New Category
│   └── Jar Detail
│       ├── Edit Jar
│       └── Reallocate Jar
├── Goals
│   ├── New Goal
│   └── Goal Detail
│       ├── Edit Goal
│       └── Contribute to Goal
├── Recurring
│   ├── New Recurring
│   └── Recurring Detail
│       └── Edit Recurring
├── Calendar
└── Ritual

Inbox
└── Review Queue
    └── Review Detail
        └── Decision Panel

Together
├── Household Overview
├── Members
├── Invitations
│   └── New Invitation
├── Policies
├── Preferences
├── Settings
│   └── Account Settings
└── Account Lifecycle

Health
├── Health Overview
└── Health Insights
```

## Screen Type Rules

| Type | Responsibility |
|---|---|
| Hub | Orient and route; should not perform complex data entry. |
| List | Browse one collection; may include filter/search if collection needs it. |
| Detail | Explain one object and expose available actions. |
| Create | Create one object. |
| Edit | Edit one object. |
| Action | Perform one object-specific action. |
| Review | Resolve one review item. |
| Settings | Configure household/account preferences. |
| System | Explain non-product states. |

## Depth Rules

- Target maximum product depth: 3 levels from bottom tab.
- Exception: object action routes may be 4 levels when attached to detail.
- Hubs should not nest inside hubs.
- Lists should not contain unrelated creation workflows inline if the create flow is complex.
- Detail pages should not contain multiple unrelated management forms.

