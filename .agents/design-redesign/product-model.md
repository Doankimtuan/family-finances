# ViNha Product Model & Financial Semantics

## 1. Primary Product Purpose

**ViNha** is a shared financial operating system engineered specifically for bilingual (Vietnamese / English) households and couples. It bridges the gap between individual financial independence and collective household accountability. It solves the friction, emotional tension, and opacity that often accompany family money management by providing:

- A shared, unvarnished financial reality (real accounts, cash, debts, savings, and investments).
- Intention-based planning (envelope/jar allocation) without confusing jars with physical bank accounts.
- A centralized decision queue (Inbox) where incoming items, matured savings, uncategorized expenses, and partner suggestions are reviewed collaboratively.
- Transparent partner permissions (Admin vs Partner) with shared visibility and clear auditability.

---

## 2. Target Users & Household Mental Model

- **Target Users**: Couples, young families, and domestic partners in Vietnam managing combined living costs, personal allocations, shared savings, and debt obligations.
- **Household Context**: Every financial artifact exists within a single active household boundary (e.g., household _"Chúm ta"_).
- **Membership Roles**:
  - **Admin**: Can manage household configuration, invitations, policies, members, and all financial instruments.
  - **Partner**: Full operational visibility, can record transactions, manage accounts, reallocate jars, and participate in Inbox decisions, but cannot transfer ownership or revoke the admin unilaterally.

```text
Household ("Chúm ta")
 ├── Members (Admin, Partners)
 ├── Policies & Preferences (Bilingual VI/EN, Currency: VND, Timezone: Asia/Ho_Chi_Minh)
 ├── Ledger (Financial Reality)
 │    ├── Cash Accounts (e.g., "Ví thường", "Tiền mặt chồng giữ")
 │    ├── Bank Accounts (e.g., "TP Bank chồng", "VCB")
 │    ├── Credit Cards / Debts (Card debt obligations)
 │    ├── Loans (Obligations with payment schedules & interest rates)
 │    ├── Savings Products (e.g., Tikop term deposits, maturities)
 │    ├── Investment Holdings (Risk-bearing assets, market valuations)
 │    └── Transactions (Income, Expense, Transfer)
 ├── Financial Plan (Intentions & Allocation)
 │    ├── Monthly Income Base
 │    ├── Planning Jars (Envelopes: "Hũ chi tiêu", "Hũ tiết kiệm", "Hũ cho gia đình", etc.)
 │    ├── Allocation Health & Smart Reallocation Suggestions
 │    ├── Goals (Milestone targets)
 │    ├── Recurring Transactions
 │    └── Month-End Ritual (Reflection & Closing)
 ├── Decision Inbox (Shared Review Queue)
 │    ├── Matured Savings Decisions
 │    ├── Uncategorized / Unmapped Expenses
 │    ├── Income Placement Suggestions
 │    └── Partner Review Items
 └── Health (Read-Only Household Diagnostic)
      ├── Household Pulse Score (e.g., 85/100 Strong)
      └── Data Coverage Audit
```

---

## 3. Core Financial Domain Models

### A. Account & Balance Model

- **Accounts hold real, liquid money.** Accounts are categorized into Cash, Bank, and Credit Line.
- **Account Balance** represents the actual posted net balance of that financial container.
- An account's opening balance posts initial reality; subsequent balance changes happen strictly through ledger transactions.

### B. Transaction Model

- Every transaction belongs to a source account and has an effective date, amount, currency (VND), and classification:
  - **Expense**: Money leaving the household to an external merchant or payee. Categorized into a category linked to a Planning Jar.
  - **Income**: Money entering the household from an external source (salary, bonus, gift, yield).
  - **Transfer**: Money moving between two internal household accounts (e.g., Bank → Cash). **Transfers do not change household net worth and do not count as expenses or income.**

### C. Budgeting & Planning Model (Jars)

- **Jars are intention envelopes, NOT bank accounts.** Jars do not hold cash; they define spending limits and intentions for a calendar month.
- **Allocation Health**: Compares total allocated jar capacity against the monthly income base.
- **Divergence / Over-budget**: When spending in a jar's categories exceeds its planned capacity, the system flags the jar (e.g., _"Hũ shopping cho vợ is over budget by ₫809,244"_).
- **Smart Reallocation**: Rather than blocking spending, the system suggests transfers between jars (e.g., move surplus from _"Hũ tiết kiệm"_ to cover overspending).
- **Month-End Ritual**: At month's end, the household reviews actual vs planned divergence, resolves outstanding decisions, and locks the month.

### D. Savings Model

- **Savings Products** track principal locked in institutional term deposits or fintech products (e.g., Tikop 1-month, 2-month, 3-month contracts).
- Tracks principal held, interest rate, term start/maturity date, expected net interest, expected tax withholding, and renewal policy (auto-rollover vs return to account).
- **Maturity Lifecycle**: When a term ends, it generates an Inbox decision item for the household to confirm rollover or record payout.
- **Early Withdrawal**: Calculates penalties and net proceeds before confirming liquidity back into an account.

### E. Investment Model

- Tracks risk-bearing capital assets (stocks, funds, real estate, gold).
- Strictly distinguishes between **Contributed Capital** (cash put in) and **Current Market Valuation** (estimated value based on latest quote/source).
- Tracks **Realized Gains/Losses** (from confirmed sales/exits) vs **Unrealized Gain/Loss** (paper valuation).

### F. Debt & Loan Model

- Tracks formal liabilities (credit card debt, consumer loans, bank mortgages).
- Distinguishes **Principal Owed** from **Interest Payments**. Repayment transactions split principal reduction from finance charges.

### G. Decision Inbox Model

- A unified asynchronous task queue for the household.
- Items are strictly typed (`ReviewItem`):
  - `SAVINGS_MATURITY`: Savings term completed; decide rollover or account deposit.
  - `UNMAPPED_EXPENSE`: Transaction recorded without a verified planning category/jar.
  - `INCOME_PLACEMENT`: Incoming funds awaiting jar allocation.
  - `PARTNER_DECISION`: Large expenditure or policy change requiring dual consensus.
- Items have dual states: **Open** vs **Archived**.

### H. Health Model

- **Strictly read-only diagnostic** (Rule BR-24). Health does not execute mutations.
- Computes a holistic **Household Pulse** (0–100) based on record coverage (accounts, active jars, queue debt).

---

## 4. PRODUCT SEMANTICS — DO NOT LOSE DURING REDESIGN

| Semantic Concept A            | Semantic Concept B        | Why the Distinction is Critical                                                                     | Redesign Rule                                                                                               |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Account Balance**           | **Monthly Income**        | Balance is a snapshot of total accumulated liquid assets; income is an incoming flow over a period. | Never display account balance as "Earnings" or "Income".                                                    |
| **Transfer**                  | **Expense**               | An internal transfer (VCB → Wallet) does not decrease household wealth.                             | Transfers must never have negative expense color coding or affect cash flow burn charts.                    |
| **Transfer**                  | **Income**                | An internal transfer does not represent new revenue.                                                | Transfers must never be styled as emerald income gains.                                                     |
| **Jar (Envelope)**            | **Account (Bank/Cash)**   | Jars are virtual spending plans; accounts are legal repositories of currency.                       | Visuals must make clear jars do not hold deposited cash. Do not put account numbers on jars.                |
| **Opening Balance**           | **Transaction Income**    | Setting up an account's starting balance is a baseline calibration, not revenue earned this month.  | Opening balances must not distort monthly P&L or cash flow charts.                                          |
| **Investment Contribution**   | **Market Value**          | Capital invested is what was spent; market value fluctuates with the market.                        | Always show both Cost Basis (contributed) and Current Valuation; never equate valuation to guaranteed cash. |
| **Savings Principal**         | **Interest Yield**        | Principal is protected cash under contract; interest is accrued yield.                              | Keep expected interest distinctly tagged and note maturity dates explicitly.                                |
| **Debt Principal**            | **Installment / Payment** | Total owed is a liability; monthly payment is a cash flow deduction.                                | Clearly separate total outstanding balance from minimum due/monthly payment.                                |
| **Uncategorized Transaction** | **General Expense**       | Uncategorized items break the envelope planning engine and require Inbox triage.                    | Highlight uncategorized transactions with amber action cues linking to Inbox.                               |
| **Admin vs Partner Role**     | **Generic User**          | Household finance requires defined administrative boundaries and partner consensus.                 | Badge member roles clearly in Together; do not hide ownership settings.                                     |
