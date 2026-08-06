# Future Scalability

The IA must support at least five years of growth without adding bottom tabs.

## Growth Strategy

Future financial modules should enter through existing mental models:

| Future area | Primary location | Reason |
|---|---|---|
| Investments | Money Products | It is financial inventory and performance/history. |
| Insurance | Money Products | It is financial protection inventory and obligations. |
| Net Worth | Money Overview and Money Products | It summarizes financial reality across assets/liabilities. |
| Budget analytics | Plan or Health depending on read/write behavior | Planning changes belong to Plan; read-only insight belongs to Health. |
| Document vault | Together Settings or Money product detail attachments | Household-owned docs belong to Together; object-specific docs belong to object detail. |
| Advisor/reports | Health | Read-only household insight. |

## Money Expansion Model

Money uses a stable substructure:

```text
Money
├── Overview
├── Accounts
├── Transactions
└── Products
    ├── Debts
    ├── Loans
    ├── Savings
    ├── Investments
    ├── Insurance
    └── Net Worth
```

Rules:

- New financial inventory goes under Money Products.
- New money history goes under Transactions or object detail history.
- New money capture goes through one canonical create/action path.
- Money tab count does not increase.

## Plan Expansion Model

Plan uses a stable substructure:

```text
Plan
├── Overview
├── Jars
├── Goals
├── Recurring
├── Calendar
└── Ritual
```

Rules:

- New intention types become Plan subareas only if they are active household planning work.
- Read-only plan intelligence belongs in Health.
- Calendar remains the projection/history lens for plan timing.

## Together Expansion Model

Together uses a stable household management model:

```text
Together
├── Household Overview
├── Members
├── Invitations
├── Policies
├── Preferences
└── Settings
```

Rules:

- Household access and account lifecycle stay in Together.
- App configuration that affects the household stays in Together settings.
- Personal-only preferences can live under Together settings/account unless future multi-profile scope requires separation.

## Health Expansion Model

Health is a secondary read-only insight space:

```text
Health
├── Overview
├── Insights
└── Future: Reports / Trends / Scenarios
```

Rules:

- Health never mutates money.
- Health never becomes a daily work queue.
- Health may link to owner screens for follow-up work.

## Scalability Guardrails

- Add sections inside hubs before adding bottom tabs.
- Add object detail tabs/sections before adding sibling routes if the user is still working with one object.
- Add a new primary route only when the user mental model is distinct and recurring.
- New modules must declare owner, routes, dependencies, forbidden dependencies, and entry points before implementation.

