# Application Hierarchy

## Root Hierarchy

```text
App
├── Public Entry
├── Auth
├── Invite
├── Onboarding
├── Product
│   ├── Home
│   ├── Money
│   ├── Plan
│   ├── Inbox
│   ├── Together
│   └── Health
└── System
```

## Product Hierarchy

```text
Product Shell
├── Home
│   ├── Household Dashboard
│   ├── Next Actions
│   ├── Health Summary
│   └── Inbox Summary
├── Money
│   ├── Money Overview
│   ├── Accounts
│   ├── Transactions
│   ├── Products
│   │   ├── Debts
│   │   ├── Loans
│   │   └── Savings
│   └── Money Actions
├── Plan
│   ├── Plan Overview
│   ├── Jars
│   ├── Goals
│   ├── Recurring
│   ├── Calendar
│   └── Ritual
├── Inbox
│   ├── Review Queue
│   └── Review Detail
├── Together
│   ├── Household Overview
│   ├── Members
│   ├── Invitations
│   ├── Policies
│   ├── Preferences
│   ├── Settings
│   └── Account Lifecycle
└── Health
    ├── Health Overview
    └── Health Insights
```

## Primary Areas

### Home

Responsibility: orient the household and route users to the right work.

Primary screens:

- Household Dashboard

Secondary screens:

- None. Home should remain shallow.

Entry points:

- App open after authenticated/member redirect.
- Bottom navigation.

Exit points:

- Capture transaction.
- Money overview.
- Plan overview.
- Inbox queue or review item.
- Health overview.
- Together household overview.

### Money

Responsibility: show money reality and let users manage financial inventory/history.

Primary screens:

- Money Overview
- Accounts
- Transactions
- Products

Secondary screens:

- Debts
- Loans
- Savings

Detail screens:

- Account Detail
- Transaction Detail
- Debt Detail
- Loan Detail
- Saving Detail

Creation flows:

- Create Transaction
- Create Account
- Create Debt
- Create Loan
- Create Saving

Management/action flows:

- Edit Transaction
- Refund Transaction
- Correct Transaction
- Pay Debt
- Pay Loan
- Edit Loan
- Edit Loan Interest
- Close Loan
- Edit Saving Renewal Policy
- Early Withdraw Saving

History flows:

- Transactions
- Account transaction history
- Product detail history sections

### Plan

Responsibility: show and manage household intentions.

Primary screens:

- Plan Overview
- Jars
- Goals
- Recurring
- Calendar
- Ritual

Detail screens:

- Jar Detail
- Goal Detail
- Recurring Detail

Creation flows:

- Create Jar
- Create Category
- Create Goal
- Create Recurring

Management/action flows:

- Update Jar
- Reallocate Jar
- Update Goal
- Contribute to Goal
- Edit Recurring
- Run Ritual

History flows:

- Calendar projection
- Ritual status/progress

### Inbox

Responsibility: centralize review work and household decisions.

Primary screens:

- Review Queue

Detail screens:

- Review Detail

Modal/bottom sheet flows:

- Lightweight decision confirmations when the action is simple.

Management flows:

- Review item decision submission.

### Together

Responsibility: manage household people, access, policies, preferences, onboarding, and account lifecycle.

Primary screens:

- Household Overview
- Members
- Invitations
- Policies
- Preferences
- Settings

Creation flows:

- Create Invitation
- Onboard Household

Management flows:

- Revoke Invitation
- Update Household Policies
- Update Preferences
- Account Lifecycle actions

### Health

Responsibility: read-only household financial health.

Primary screens:

- Health Overview

Secondary screens:

- Health Insights

Entry points:

- Home health summary.
- Direct deep link.
- Contextual links from Money/Plan if relevant in future phases.

## IA Decisions

| Decision | Reason |
|---|---|
| Keep five bottom tabs. | Preserves minimal navigation and existing strong shell. |
| Keep Health outside bottom tabs. | Avoids a sixth tab and positions Health as insight, not daily navigation. |
| Group Debts, Loans, Savings under Money Products. | Keeps Money predictable and leaves room for Investments, Insurance, and Net Worth. |
| Keep Settings under Together. | Household-first identity makes settings a household management concern. |
| Make action routes children of the object they act on. | Reduces route ambiguity and keeps back navigation predictable. |

