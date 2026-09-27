# Implementation Contract & Engineering Governance

**Product**: ViNha (Bilingual Household Financial Platform)  
**Governance Scope**: Next.js 16 UI Architecture, Supabase Integration, and Ledger Invariants  
**Status**: **FROZEN (Task 13 Gate Passed — Strict Implementation Boundary)**

---

## 1. What Implementation MAY Do

The implementation engineer or agent **MAY**:

1. Map canonical components from Task 11 (`DS-01`) directly to modular React client/server components.
2. Reuse existing verified domain business logic in `modules/ledger`, `modules/savings`, `modules/plan`, `modules/inbox`, and `modules/tenancy`.
3. Reuse existing Supabase schemas, client adapters, and server actions without modifying table columns or RLS policies.
4. Adapt responsive styling across 360px, 390px, and 430px viewports using Tailwind CSS inside the centered 440px `AppViewport`.
5. Implement accessible ARIA states (`aria-expanded`, `aria-checked`, `role="listbox"`, `aria-invalid`).
6. Render canonical loading skeletons and error retry surfaces using `LoadingState` and `ErrorState`.
7. Leverage `shared/ui` and `shared/patterns` primitives, consolidating one-off legacy implementations.

---

## 2. What Implementation MAY NOT Do

The implementation engineer or agent **MAY NOT**:

1. **Redesign screens**: Do not alter approved screen hierarchies, change card order, or introduce alternative visual styles.
2. **Alter P0 financial semantics**: Never treat opening balances as income, transfers as spending, jars as bank accounts, or credit limits as net worth.
3. **Invent UI features**: Do not invent batch wizards, automatic AI rebalancers, or simulated live annuity forecasts not present in canonical Stitch designs.
4. **Change copy without documented reason**: Strictly follow the canonical terminology dictionary in `localization-readiness.md`.
5. **Replace canonical components with one-off styling**: Always use components from Task 11 / `shared/ui` rather than writing ad-hoc local inputs or buttons.
6. **Modify backend database models**: Do not add new columns to Supabase tables, create new migrations, or alter database triggers.
7. **Change routing structure**: Do not rename Next.js routes documented in `route-screen-map.md`.
8. **Remove verified functionality**: Do not delete fields, actions, or links that exist in canonical Stitch designs.

---

## 3. P0 Financial Invariants (Zero-Tolerance Gate)

| Domain               | Strict Financial Invariant                | Implementation Rule                                                                                                                                       |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounts**         | **Opening Balance ≠ Monthly Income**      | Creating an account or recording an initial balance calls `record_opening_balance`, establishing ledger capital without creating an income event.         |
| **Accounts**         | **Transfer ≠ Income / Expense**           | Inter-account transfers (e.g., Checking $\rightarrow$ Savings) update two account balances simultaneously; net cash flow for the month remains zero.      |
| **Accounts**         | **Credit Limit ≠ Asset**                  | A credit card limit of ₫ 50.000.000 is a borrowing facility. Total net wealth only reflects liquid cash minus current credit card debt.                   |
| **Savings**          | **Principal ≠ Interest**                  | Savings balances represent locked principal. Accrued interest is an unrealized gain until maturity settlement.                                            |
| **Savings**          | **Savings ≠ Investment**                  | Fixed-term savings have contractual interest rates and fixed terms. They cannot be merged with fluctuating market securities.                             |
| **Investments**      | **Unit Price Update ≠ Cash Flow**         | Updating the market NAV of a mutual fund (e.g., DCDS ₫ 26.000 $\rightarrow$ ₫ 27.500) updates portfolio valuation; it generates zero cash inflow/outflow. |
| **Investments**      | **Value = Quantity × Unit Price**         | Portfolio holding value is strictly derived from `Quantity × Current Price`. Never persist a precomputed value string.                                    |
| **Bank Loans**       | **Principal ≠ Interest Expense**          | Loan repayments must be segregated into Principal (reduces loan balance) and Interest (recorded as financial expense).                                    |
| **Personal Lending** | **I Lend (Asset) ≠ I Borrow (Liability)** | Lending money creates a receivable asset (+₫). Borrowing money creates an obligation (−₫). They must never be merged into one net value.                  |
| **Plan**             | **Jar ≠ Bank Account**                    | Budget jars are virtual envelopes (spending intention quotas). Moving quota between jars does not transfer physical bank money.                           |
| **Together**         | **Policy Configuration ≠ Cash Movement**  | Adjusting household overspend policies or month-close rules alters application behavior; it never alters bank balances.                                   |

---

## 4. Data Requirement Audit (Direct vs Derived vs Deferred)

| Screen Area             | Data Displayed                      | Data Classification | Source / Mathematical Derivation                                                                                                                                                                                   |
| ----------------------- | ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home Net Wealth**     | `₫ 2.036.547.748`                   | **DERIVED**         | $\sum(\text{Liquid Checking}) + \sum(\text{Savings Principal}) + \sum(\text{Investment Market Value}) + \sum(\text{Receivables}) - \sum(\text{Credit Debt}) - \sum(\text{Loan Principal}) - \sum(\text{Payables})$ |
| **Home Cash Flow**      | Thu ₫ 45.2M / Chi ₫ 28.6M           | **DIRECT DATA**     | Aggregated from `monthly_summary` ledger view for current active period                                                                                                                                            |
| **Money Breakdown**     | Thanh khoản 0.6%, Tiết kiệm 90.5%   | **DERIVED**         | $\text{Category Balance} / \text{Total Assets} \times 100\%$                                                                                                                                                       |
| **Account Row**         | Tên, Số tài khoản, Số dư            | **DIRECT DATA**     | `accounts` table (`name`, `account_number_mask`, `current_balance`)                                                                                                                                                |
| **Credit Card Detail**  | Dư nợ ₫ 4.85M, Khả dụng ₫ 45.15M    | **DERIVED**         | $\text{Available Limit} = \text{Credit Limit} - \text{Current Balance}$                                                                                                                                            |
| **Savings Detail**      | 64% elapsed, 132 ngày còn lại       | **DERIVED**         | $\text{Elapsed} = (\text{Today} - \text{Start Date}) / (\text{Maturity Date} - \text{Start Date}) \times 100\%$                                                                                                    |
| **Investment Gain**     | +₫ 24.000.000 (+23.8%)              | **DERIVED**         | $\text{Unrealized Gain} = (\text{Quantity} \times \text{Current Price}) - \text{Cost Basis}$                                                                                                                       |
| **Loan Next Payment**   | Gốc ₫ 8.3M + Lãi ₫ 9.9M             | **DIRECT DATA**     | `loan_amortization_schedule` table for period `next`                                                                                                                                                               |
| **Loan Payoff Saved**   | Tiết kiệm lãi ~₫ 945.000.000        | **DERIVED**         | $\sum(\text{Future Interest from Unpaid Periods}) - \text{Prepayment Fee}$                                                                                                                                         |
| **Personal Receivable** | Đã nhận ₫ 5M / Gốc ₫ 15M (33.3%)    | **DERIVED**         | $\text{Repaid Ratio} = \text{Amount Received} / \text{Original Principal} \times 100\%$                                                                                                                            |
| **Plan Jar Bar**        | Đã chi ₫ 10.2M / ₫ 15M (68%)        | **DERIVED**         | $\text{Spent Ratio} = \min(100\%, \text{Actual Expenses} / \text{Budget Cap} \times 100\%)$                                                                                                                        |
| **Inbox Counter**       | 14 việc cần xem                     | **DIRECT DATA**     | `count(*) from inbox_items where status = 'pending'`                                                                                                                                                               |
| **Together Policies**   | `overspendPolicy`, `monthCloseMode` | **DIRECT DATA**     | `household_policies` record from tenancy schema                                                                                                                                                                    |

---

## 5. Critical Invariant Copy Safeguards

Whenever a user is entering or adjusting financial state, implementation must ensure the exact canonical microcopy is present:

- **Opening Balance**: _"Khoản này không tính là thu nhập mới của tháng."_
- **Credit Card Setup**: _"Hạn mức tín dụng là khoản được ngân hàng cấp, không phải tài sản thực có của gia đình."_
- **NAV Update**: _"Cập nhật định giá thị trường không tạo ra giao dịch thu chi tiền mặt."_
- **Loan Repayment**: _"Số tiền trả nợ được phân bổ riêng biệt thành tiền gốc (giảm dư nợ) và tiền lãi (chi phí)."_
- **Jar Allocation Adjustment**: _"Điều chỉnh phân bổ hũ là thay đổi hạn mức dự kiến, không chuyển tiền giữa các tài khoản ngân hàng."_
