# Domain Reality Validation — Installments

## Reality Validation

### How Real People Interact With Installment Debt

Installment debt (personal loans, auto loans, mortgages, student loans) is the most structured form of consumer debt. Unlike credit cards (revolving), installment debt has fixed payments, fixed terms, and a defined end date. Users interact with installments differently than other financial instruments — the payment is a fixed monthly obligation, and the primary behavior is tracking progress toward payoff.

**Daily/Weekly/Monthly Patterns:**
- **Monthly:** Payment is made (often automatic). Users check that the payment went through.
- **Quarterly:** Reviewing remaining balance. "How much do I still owe?"
- **Annually:** Assessing payoff timeline. "Can I pay this off early?" Checking interest statements for tax purposes (mortgage interest).

**Expectations from Banking Apps:**
Users expect:
- Remaining balance and original loan amount
- Monthly payment amount and next payment date
- Interest rate
- Payoff date / remaining payments
- Total interest paid to date

**Common Mistakes:**
- Not understanding how much interest they're paying over the loan's life
- Paying extra without specifying "apply to principal" (extra payments may go to future interest)
- Refinancing without calculating total cost (lower rate but longer term = more total interest)
- Not factoring installment payments into monthly cash flow
- Treating installment debt as "good debt" and ignoring the cost

**Common Frustrations:**
- Interest is front-loaded — early payments are mostly interest, little principal
- Can't easily see payoff progress (principal vs interest breakdown)
- Early payoff penalties are frustrating
- Loan servicers change, making tracking difficult
- Escrow changes (mortgage) affect monthly payment unpredictably

### ViNha Installment Model Fit

ViNha's installment model (principal, interest amount, term, payment count) captures the core structure. BR-11 (completion when paid ≥ num_installments) is elegant and correct for standard installment products.

**Verdict:** The model is correct for MKP but under-explains the interest cost of debt. The amortization structure (interest front-loading) is not visible.

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**Yes, with one significant gap — interest visibility.**

**What's Correct:**
- Fixed payment structure with known term
- Completion rule (BR-11) is correct for standard installments
- Installment as Real Ledger (actual debt obligation) is correct

**What's Incomplete:**
1. **Amortization structure** — Installment loans front-load interest. A $20,000 loan at 5% for 5 years: the first payment is ~$83 interest + $294 principal. The last payment is ~$2 interest + $375 principal. ViNha's model shows flat payments — users don't see that early payments are mostly interest.
2. **Principal vs interest breakdown** — Without this, users can't calculate the benefit of early payoff. Extra principal payments reduce total interest significantly. ViNha doesn't surface this.
3. **Variable rates** — Some installment products (adjustable-rate mortgages, some personal loans) have variable rates. ViNha assumes fixed.
4. **Escrow components** — Mortgage payments often include property tax and insurance in escrow. The "monthly payment" includes these but they're not debt repayment.

### Dangerous Assumptions

**Early payoff completion gap:** BR-11 says an installment is complete when `paid_installments >= num_installments`. But if a user pays off the loan early (lump sum payment), `paid_installments` may be less than `num_installments` but the debt is fully settled. ViNha would incorrectly show the installment as active.

**Severity:** MEDIUM. This edge case will occur — users do pay off loans early. The model needs an `early_payoff` completion mechanism alongside BR-11.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Partially. The model tracks debt but doesn't encourage payoff.**

**Behavioral Strength:** BR-11 (completion tracking) gives a clear finish line. Users can see "12 of 36 payments made" — progress is visible and motivating.

**Behavioral Weakness:** Without interest cost visibility, users don't feel the cost of debt. Behavioral economics shows that making costs salient changes behavior. "You've paid $2,847 in interest so far" is more motivating than "24 of 60 payments remaining."

**Behavioral Risk:** Users may not optimize debt payoff. Without interest rate comparison across debts, they might pay off a 3% car loan before a 7% personal loan. The "avalanche" method (highest interest first) is mathematically optimal; ViNha doesn't provide the data for it.

**Behavioral Opportunity:** Debt snowball (smallest balance first) is behaviorally effective even though mathematically suboptimal — it provides quick wins. ViNha could offer both avalanche and snowball views. This is a future capability (FC-08).

---

## Competitor Benchmark

### YNAB
- Loan tracking is a recent addition. Tracks balance, interest rate, payment.
- Strong: Payoff calculator. Shows interest saved by paying extra.
- Weak: Loan tracking is basic. Not a primary YNAB feature.
- ViNha Difference: ViNha's installment model is more structured than YNAB's loan tracking.

### Copilot Money
- No specific installment tracking. Loans appear as negative accounts.
- Strong: Clean view of debt as negative net worth component.
- Weak: No payoff tracking, no amortization, no progress visualization.
- ViNha Difference: ViNha's installment domain is significantly more structured than Copilot's account-based approach.

### Monarch Money
- Loan accounts tracked. Basic balance and payment tracking.
- Strong: Shows debt alongside assets in net worth.
- Weak: No specific installment features. No payoff planning.
- ViNha Difference: ViNha's BR-11 completion rule and structured payment tracking exceed Monarch.

### Simplifi
- Loans tracked as debt accounts. Payment tracking is basic.
- Strong: Loans appear in spending plan as monthly obligations.
- Weak: No payoff optimization. No interest tracking.
- ViNha Difference: ViNha's installment model is more sophisticated.

**Key Insight:** No competitor does installment debt exceptionally well. YNAB's loan payoff calculator is the best feature across competitors. ViNha's structured approach (term, payment count, BR-11 completion) is more rigorous but could benefit from YNAB's interest visibility.

---

## Simplicity Validation

### Is the Installment Model Optimally Simple?

**Slightly too simple. The principal/interest distinction should be visible.**

**Complexity Score:** Current 3/10, Optimal 4/10. Gap: +1 (small).

The model captures the structure of installment debt but not its cost. Adding interest visibility (total interest paid, remaining interest, principal vs interest per payment) is display-level complexity — no structural change needed.

**What should be added (near-term):**
- Interest paid to date
- Remaining interest
- Principal vs interest breakdown per payment

**What should not be added:**
- Full amortization schedules (heavy UI, future capability)
- Refinancing calculators
- Variable rate adjustment models
- Escrow tracking

---

## Longevity Validation

### Will the Installment Model Age Well?

**Good longevity. Structured debt is a stable concept.**

**Stress Points:**
1. **BNPL (Buy Now Pay Later)** — These are installment-like but short-term (4 payments over 6 weeks). They don't fit the "monthly payment for years" model. Cards domain or a new BNPL domain may be needed.
2. **Income-driven student loan repayment** — Payments change based on income. The fixed-payment model breaks.
3. **Peer-to-peer lending** — Loans from individuals, not institutions. Less structured than bank loans.
4. **Debt consolidation** — Users may consolidate multiple installments into one. ViNha needs to handle the transition.

**Evolution:** Add interest visibility now. Add amortization and payoff optimization as future capabilities. Monitor BNPL growth for domain model impact.

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Supports Household Money OS.**

Installments as structured debt with completion tracking feels like managing obligations, not just viewing them. BR-11 (completion) and the fixed payment structure make installments an active part of the financial operating system — they have a lifecycle, not just a balance.

The household angle: partners can see all household debt in one place, with payoff progress visible to both.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Interest Cost Visibility** — Total interest paid, remaining interest. Near-term priority (EO-09).
2. **Early Payoff Completion** — BR-11 edge case: lump sum payoff before reaching num_installments. Near-term fix.
3. **Principal vs Interest Breakdown** — Per-payment or cumulative. Future capability (FC-08).
4. **Amortization Schedule** — Full schedule visualization. Future capability (FC-08).
5. **Debt Payoff Optimization** — Avalanche vs snowball recommendations. Future capability (FC-08).
6. **Variable Rate Support** — Floating rate installments. Future capability.

### What Should Remain Intentionally Absent?

- **Loan origination** — ViNha is not a lender.
- **Refinancing tools** — Financial advice. Outside scope.
- **Credit score impact modeling** — Credit score is explicitly excluded.
- **Debt consolidation recommendations** — Financial advice.

---

## Industry Best Practices

### Patterns to Adopt
1. **Payoff progress visualization** — YNAB's loan calculator shows progress. Motivating.
2. **Interest cost transparency** — Showing total interest over loan life. Required by lending regulations.
3. **Extra payment impact** — "If you pay $50 extra per month, you'll save $X in interest and pay off Y months earlier." YNAB does this well.

### Patterns to Avoid
1. **Debt as "negative account"** — Copilot and Monarch treat loans as negative-balance accounts. This loses the structured payment information. ViNha's Installment entity is better.
2. **"Good debt" vs "bad debt" framing** — Judgmental financial advice. ViNha should be neutral.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-I1 | Interest Cost Visibility | 8 | 8 | 3 | 2 | 2 | 2 | 7 | 8 |
| EO-I2 | Early Payoff Completion Fix | 6 | 7 | 3 | 2 | 2 | 1 | 7 | 7 |
| EO-I3 | Amortization & Payoff Optimization | 6 | 7 | 6 | 3 | 4 | 3 | 7 | 7 |
| EO-I4 | Variable Rate Support | 5 | 5 | 5 | 4 | 4 | 4 | 6 | 5 |

**EO-I1 Description:** Display total interest paid, remaining interest, and principal vs interest breakdown. Near-term priority. Business value high (makes debt cost salient).

**EO-I2 Description:** Add `early_payoff` completion mechanism. If user marks installment as "paid off," completion is recognized regardless of paid_installments count. BR-11 expansion.

**EO-I3 Description:** Full amortization schedules, debt payoff strategies (avalanche/snowball), "what if" extra payment scenarios. Future capability (FC-08).

**EO-I4 Description:** Support variable-rate installment products where interest rate changes over time. Future capability.

---

## Verdict: APPROVED WITH EVOLUTION OPPORTUNITIES

**Confidence: MEDIUM-HIGH**

The Installments domain model is structurally correct. The BR-11 completion rule needs an early-payoff edge case fix. Interest visibility (EO-I1) should be added near-term.

**Justification:**
- Fixed payment structure and term model is correct
- BR-11 completion rule is elegant but needs early-payoff handling
- Interest invisibility is a financial literacy gap, not a domain model gap
- No competitor does installments exceptionally well — ViNha's structured approach is differentiating
- Evolution opportunities are additive display features, not structural changes

**Action Required:** Add `early_payoff` flag to Installment entity. Add interest paid/remaining display fields within 12 months of launch.
