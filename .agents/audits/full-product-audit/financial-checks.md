# Financial Integrity & Reconciliation Ledger: ViNha V2 Audit

**Audit Timestamp:** 2026-10-20T22:35:00+07:00  
**Methodology:** Independent double-entry ledger calculation executed externally, compared against raw values stored and rendered by the running application.

---

## 1. Liquid Accounts Reconciliation

### 1.1 Account A — "Cash"

| Sequential Operation                           |  Credit (+) |   Debit (−) | Expected Balance | App Displayed Balance | Delta | Audit Verification |
| ---------------------------------------------- | ----------: | ----------: | ---------------: | --------------------: | ----: | ------------------ |
| Opening Balance (Onboarding)                   | ₫30,000,000 |           — |      ₫30,000,000 |           ₫30,000,000 |    ₫0 | MATCH              |
| Salary October (Income)                        | ₫25,000,000 |           — |      ₫55,000,000 |           ₫55,000,000 |    ₫0 | MATCH              |
| Groceries (Expense)                            |           — |  ₫1,500,000 |      ₫53,500,000 |           ₫53,500,000 |    ₫0 | MATCH              |
| Transfer to B Checking (Internal Transfer)     |           — |  ₫5,000,000 |      ₫48,500,000 |           ₫48,500,000 |    ₫0 | MATCH              |
| Vietcombank Savings Deposit (Placement)        |           — | ₫10,000,000 |      ₫38,500,000 |           ₫38,500,000 |    ₫0 | MATCH              |
| Investment Purchase 100 FPT @ 100k (Placement) |           — | ₫10,000,000 |      ₫28,500,000 |           ₫28,500,000 |    ₫0 | MATCH              |
| Partial Sale 40 FPT @ 120k (Sale Proceeds)     |  ₫4,800,000 |           — |  **₫33,300,000** |       **₫33,300,000** |    ₫0 | **MATCH**          |

### 1.2 Account B — "B Checking"

| Sequential Operation                |  Credit (+) | Debit (−) | Expected Balance | App Displayed Balance | Delta | Audit Verification |
| ----------------------------------- | ----------: | --------: | ---------------: | --------------------: | ----: | ------------------ |
| Opening Balance (Account Creation)  | ₫12,000,000 |         — |      ₫12,000,000 |           ₫12,000,000 |    ₫0 | MATCH              |
| Received Transfer from Cash         |  ₫5,000,000 |         — |      ₫17,000,000 |           ₫17,000,000 |    ₫0 | MATCH              |
| Transportation (Initial Expense)    |           — |  ₫600,000 |      ₫16,400,000 |           ₫16,400,000 |    ₫0 | MATCH              |
| Reversal Refund (Correction Action) |    ₫600,000 |         — |      ₫17,000,000 |           ₫17,000,000 |    ₫0 | MATCH              |
| Transportation (Corrected Expense)  |           — |  ₫700,000 |  **₫16,300,000** |       **₫16,300,000** |    ₫0 | **MATCH**          |

**Total Liquid Cash across Household:** ₫33,300,000 + ₫16,300,000 = **₫49,600,000** (Verified in both sessions).

---

## 2. Cash Flow & Revenue / Expense Integrity

| Metric Category                                       | Expected Independent Calculation | App Displayed (Transactions & Ritual) | Status | Audit Observations                                                                                                 |
| ----------------------------------------------------- | -------------------------------: | ------------------------------------: | ------ | ------------------------------------------------------------------------------------------------------------------ |
| **Gross Income**                                      |                  **₫25,000,000** |                       **₫25,000,000** | MATCH  | Opening balances (₫30M + ₫12M) and transfers (₫5M) correctly excluded from income.                                 |
| **Gross Expenses**                                    |                   **₫2,200,000** |                        **₫2,200,000** | MATCH  | Groceries (₫1.5M) + Corrected Transportation (₫700K). Reversed ₫600K expense properly neutralized by ₫600K refund. |
| **Net Operational Cash Flow**                         |                 **+₫22,800,000** |                      **+₫22,800,000** | MATCH  | Rendered under Cash flow widget on `/en/home` (`+₫22,800,000`).                                                    |
| **Net Month Cash Flow (After Investments & Savings)** |                  **+₫7,600,000** |                       **+₫7,600,000** | MATCH  | Computed on `/en/plan/ritual`: Income (25M) − Expenses (2.2M) − Savings (10M) − Net Invested (5.2M) = ₫7,600,000.  |

---

## 3. Savings Deposit Integrity

- **Provider:** Vietcombank
- **Deposit Principal:** ₫10,000,000
- **Annual Interest Rate:** 5.50%
- **Term:** 12 months (Maturity date: 2027-10-20)
- **Interest Formula:** \(\text{Principal} \times \frac{\text{Rate}}{100} \times \frac{12}{12}\)
- **Expected Maturity Interest:** \(10,000,000 \times 0.055 = \text{₫}550,000\)
- **Expected Maturity Payout:** \(10,000,000 + 550,000 = \text{₫}10,550,000\)
- **App Computed Interest & Payout:** ₫550,000 interest, ₫10,550,000 total payout.
- **Audit Verdict:** **MATCH (100% accurate).**

---

## 4. Investment Lifecycle & Valuation (CRITICAL DEFECT F3)

### 4.1 Chronological Transaction Ledger

1. **Buy Order:** 100 units @ ₫100,000 = ₫10,000,000 total cost. Funded by Cash.
   - Cost Basis: ₫10,000,000
   - Quantity: 100
2. **Price Revaluation:** Market unit price manually set to ₫120,000 (+20%).
   - Total Market Value: 100 × ₫120,000 = ₫12,000,000
   - Unrealized Gain: ₫12,000,000 − ₫10,000,000 = +₫2,000,000 (+20.00%)
3. **Partial Sale Execution:** Sold 40 units @ ₫120,000.
   - Sale Proceeds: 40 × ₫120,000 = ₫4,800,000 (Credited to Cash account)
   - Cost Basis of Sold Shares: 40 × ₫100,000 = ₫4,000,000
   - Realized Gain: ₫4,800,000 − ₫4,000,000 = +₫800,000

### 4.2 Post-Sale Holding Reconciliation: Expected vs Actual

| Metric                     |        Correct Financial Expectation |       Application Stored / Displayed |                    Defect Delta | Severity          |
| -------------------------- | -----------------------------------: | -----------------------------------: | ------------------------------: | ----------------- |
| **Remaining Share Units**  |                             60 units |                             60 units |                         0 units | MATCH             |
| **Current Unit Price**     |                             ₫120,000 |                             ₫120,000 |                              ₫0 | MATCH             |
| **Remaining Cost Basis**   |       60 × ₫100,000 = **₫6,000,000** |                       **₫6,000,000** |                              ₫0 | MATCH             |
| **True Market Valuation**  |       60 × ₫120,000 = **₫7,200,000** |                      **₫12,000,000** |  **+₫4,800,000 (+66.7% error)** | **CRITICAL (F3)** |
| **Unrealized Gain / Loss** | ₫7.2M − ₫6M = **+₫1,200,000 (+20%)** | ₫12M − ₫6M = **+₫6,000,000 (+100%)** | **+₫4,800,000 (5× overstated)** | **CRITICAL (F3)** |

**Mathematical Proof of Flaw:**  
The UI literally prints:  
`60 units × 120,000 VND / shares` right beside `₫12,000,000`!  
The calculation engine failed to multiply `remaining_quantity` (60) by `latest_price` (120,000), leaving the stale pre-sale asset valuation (₫12,000,000) intact in the holding record.

---

## 5. Household Total Asset & Balance Sheet Reconciliation

| Asset Category                  | True Financial Value | App Displayed Value |     Discrepancy | Root Cause                         |
| ------------------------------- | -------------------: | ------------------: | --------------: | ---------------------------------- |
| Liquid Cash (Cash + B Checking) |          ₫49,600,000 |         ₫49,600,000 |              ₫0 | Correct double-entry accounting    |
| Term Savings Deposits           |          ₫10,000,000 |         ₫10,000,000 |              ₫0 | Correct balance classification     |
| Investment Portfolio            |       **₫7,200,000** |     **₫12,000,000** | **+₫4,800,000** | Corrupted by Issue F3              |
| **Total Household Assets**      |      **₫66,800,000** |     **₫71,600,000** | **+₫4,800,000** | **Household Net Worth Overstated** |

**Conclusion:**  
While ViNha's core cash and transaction ledger demonstrates exemplary double-entry purity and non-inflation of operational income/expenses, its investment holding engine exhibits a critical calculation flaw that propagates directly into household net worth.
