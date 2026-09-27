# ViNha Complete Route Inventory

This inventory documents all routes discovered from the application codebase (`modules/shared-kernel/app-path.ts`, `app/[locale]/`, and `artifacts/information-architecture/CURRENT/`).

---

## 1. Public & Authentication Routes

| Route                       | Product Domain | Description                                             | Layout / Container     |
| --------------------------- | -------------- | ------------------------------------------------------- | ---------------------- |
| `/`                         | System         | Root entry, detects locale and redirects to `/[locale]` | Empty shell            |
| `/[locale]/welcome`         | Tenancy / Auth | Welcome screen introducing household finance entry      | Centered mobile canvas |
| `/[locale]/login`           | Tenancy / Auth | Email/password login and OAuth launcher                 | Centered mobile canvas |
| `/[locale]/register`        | Tenancy / Auth | Account registration for new users                      | Centered mobile canvas |
| `/[locale]/forgot-password` | Tenancy / Auth | Password reset request                                  | Centered mobile canvas |
| `/[locale]/reset-password`  | Tenancy / Auth | New password setting from reset email link              | Centered mobile canvas |
| `/[locale]/auth/confirm`    | Tenancy / Auth | Email magic link / confirmation callback handler        | Loading resolver       |

---

## 2. Onboarding & Invitation Routes

| Route                        | Product Domain | Description                                                   | Layout / Container     |
| ---------------------------- | -------------- | ------------------------------------------------------------- | ---------------------- |
| `/[locale]/together/onboard` | Tenancy        | Household creation or join flow for newly authenticated users | Centered mobile canvas |
| `/[locale]/invite/[token]`   | Tenancy        | Deep link invitation view to join an existing household       | Centered mobile canvas |

---

## 3. Primary Product Hubs (Bottom Navigation)

| Route                | Product Domain | Navigation Role | Description                                                              |
| -------------------- | -------------- | --------------- | ------------------------------------------------------------------------ |
| `/[locale]/home`     | Home           | Bottom Tab 1    | Household financial summary, net worth, attention items, cash flow chart |
| `/[locale]/money`    | Ledger         | Bottom Tab 2    | Financial reality overview, asset distribution, accounts, products hub   |
| `/[locale]/plan`     | Plan           | Bottom Tab 3    | Planning pulse, envelope budget jars, smart reallocations, month ritual  |
| `/[locale]/inbox`    | Inbox          | Bottom Tab 4    | Shared decision queue (Open vs Archived), triage cards                   |
| `/[locale]/together` | Tenancy        | Bottom Tab 5    | Household members, partner responsibilities, policies, preferences       |

---

## 4. Money Domain Routes (Accounts, Transactions, Products)

| Route                                         | Product Domain | Type               | Description                                                                |
| --------------------------------------------- | -------------- | ------------------ | -------------------------------------------------------------------------- |
| `/[locale]/money/accounts`                    | Ledger         | List Screen        | Complete list of cash and bank accounts grouped by type                    |
| `/[locale]/money/accounts/[id]`               | Ledger         | Detail Screen      | Account ledger history, current balance, edit/archive actions              |
| `/[locale]/money/transactions`                | Ledger         | List Screen        | Searchable, filterable transaction ledger with date groupings              |
| `/[locale]/money/transactions/new`            | Ledger         | Modal / Sheet Flow | Add Transaction form (Expense, Income, Transfer) with VND input            |
| `/[locale]/money/transactions/[id]`           | Ledger         | Detail Screen      | Single transaction audit view, category, account, note, timestamps         |
| `/[locale]/money/transactions/[id]/edit`      | Ledger         | Action Flow        | Edit transaction details                                                   |
| `/[locale]/money/transactions/[id]/refund`    | Ledger         | Action Flow        | Refund transaction workflow                                                |
| `/[locale]/money/transactions/[id]/correct`   | Ledger         | Action Flow        | Audit correction flow with mandatory reason                                |
| `/[locale]/money/transactions/tags`           | Ledger         | List / Manage      | Transaction tags management                                                |
| `/[locale]/money/debts`                       | Ledger         | List Screen        | Active credit card balances and debt obligations                           |
| `/[locale]/money/debts/[id]`                  | Ledger         | Detail Screen      | Debt payoff schedule and repayment recorder                                |
| `/[locale]/money/loans`                       | Ledger         | List Screen        | Formal loans (borrowed or lent)                                            |
| `/[locale]/money/loans/[id]`                  | Ledger         | Detail Screen      | Loan amortisation, remaining principal, payment recorder                   |
| `/[locale]/money/savings`                     | Savings        | List Screen        | Active savings products (Tikop, bank term deposits) and projected interest |
| `/[locale]/money/savings/new`                 | Savings        | Create Flow        | Open new savings deposit contract                                          |
| `/[locale]/money/savings/providers`           | Savings        | Reference          | Savings providers directory                                                |
| `/[locale]/money/savings/[id]`                | Savings        | Detail Screen      | Savings contract details, term progress, renewal rules                     |
| `/[locale]/money/savings/[id]/early-withdraw` | Savings        | Action Flow        | Early withdrawal penalty calculation and execution                         |
| `/[locale]/money/investments`                 | Investments    | List Screen        | Portfolio overview, risk-bearing holdings, cost basis vs market value      |
| `/[locale]/money/investments/new`             | Investments    | Create Flow        | Record new investment asset/holding                                        |
| `/[locale]/money/investments/convert`         | Investments    | Action Flow        | Convert cash balance to investment position                                |
| `/[locale]/money/investments/[id]`            | Investments    | Detail Screen      | Holding performance, contributions, valuations, transactions               |
| `/[locale]/money/investments/[id]/buy`        | Investments    | Action Flow        | Record buy order / contribution                                            |
| `/[locale]/money/investments/[id]/sell`       | Investments    | Action Flow        | Record sell order / realization                                            |
| `/[locale]/money/investments/[id]/income`     | Investments    | Action Flow        | Record dividend or investment yield                                        |
| `/[locale]/money/investments/[id]/valuation`  | Investments    | Action Flow        | Update latest market valuation quote                                       |

---

## 5. Plan Domain Routes (Jars, Goals, Recurring, Ritual)

| Route                           | Product Domain | Type            | Description                                                          |
| ------------------------------- | -------------- | --------------- | -------------------------------------------------------------------- |
| `/[locale]/plan/jars`           | Plan           | List Screen     | Intention envelopes list, capacity vs spent, allocation health       |
| `/[locale]/plan/jars/[id]`      | Plan           | Detail Screen   | Single jar budget breakdown, linked categories, reallocation history |
| `/[locale]/plan/goals`          | Plan           | List Screen     | Long-term milestone goals and progress tracking                      |
| `/[locale]/plan/goals/[id]`     | Plan           | Detail Screen   | Goal milestones, contributions, target dates                         |
| `/[locale]/plan/recurring`      | Plan           | List Screen     | Recurring bills and income subscriptions                             |
| `/[locale]/plan/recurring/[id]` | Plan           | Detail Screen   | Recurring frequency, next payment date, auto-triage rules            |
| `/[locale]/plan/calendar`       | Plan           | Calendar Screen | Projected cash flow calendar across future weeks/months              |
| `/[locale]/plan/ritual`         | Plan           | Workflow Screen | Month-end reflection ritual: divergence review and month locking     |

---

## 6. Inbox Domain Routes

| Route                  | Product Domain | Type            | Description                                                       |
| ---------------------- | -------------- | --------------- | ----------------------------------------------------------------- |
| `/[locale]/inbox`      | Inbox          | Hub Screen      | Asynchronous queue with Open / Archived tabs and category filters |
| `/[locale]/inbox/[id]` | Inbox          | Decision Detail | Decision resolution sheet/card with contextual primary actions    |

---

## 7. Together & Settings Routes

| Route                                 | Product Domain | Type        | Description                                                            |
| ------------------------------------- | -------------- | ----------- | ---------------------------------------------------------------------- |
| `/[locale]/together/members`          | Tenancy        | List Screen | Household members, role badges (Admin, Partner), manage access         |
| `/[locale]/together/invitations`      | Tenancy        | List Screen | Pending invitations sent, expiry dates, revoke actions                 |
| `/[locale]/together/invitations/new`  | Tenancy        | Create Flow | Invite partner by email address                                        |
| `/[locale]/together/policies`         | Tenancy        | List Screen | Shared household rules, expense thresholds, consensus triggers         |
| `/[locale]/together/preferences`      | Tenancy        | Form Screen | Household currency, week start day, language preferences               |
| `/[locale]/together/settings`         | Tenancy        | Hub Screen  | Profile summary, household locale/time, appearance picker (Dark/Light) |
| `/[locale]/together/settings/account` | Tenancy        | Action Flow | Account security, session management, sign-out, deletion               |

---

## 8. Health & System Diagnostic Routes

| Route                       | Product Domain | Type                 | Description                                                               |
| --------------------------- | -------------- | -------------------- | ------------------------------------------------------------------------- |
| `/[locale]/health`          | Health         | Overview (Read-Only) | Household health score (0-100), pulse tier, record coverage breakdown     |
| `/[locale]/health/insights` | Health         | Insights (Read-Only) | Read-only diagnostic insights into spending volatility and record hygiene |

---

## 9. System State Routes

| Route                   | Product Domain | Description                                             |
| ----------------------- | -------------- | ------------------------------------------------------- |
| `/[locale]/error`       | Platform       | Unrecoverable error state with safe recovery navigation |
| `/[locale]/offline`     | Platform       | Offline banner and network reconnection recovery        |
| `/[locale]/permission`  | Platform       | Access-denied / unauthorized role explanation           |
| `/[locale]/maintenance` | Platform       | Scheduled maintenance notice                            |
