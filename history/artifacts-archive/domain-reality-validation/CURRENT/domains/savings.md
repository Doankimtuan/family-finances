# Domain Reality Validation — Savings

## Reality Validation

### How Real People Interact With Savings

Savings accounts are the most emotionally charged financial accounts. They represent security, future plans, and financial discipline — or the lack thereof. Users check savings balances less frequently than checking (weekly or monthly) but with more emotional weight. A growing savings balance feels like progress; a stagnant or declining balance feels like failure.

**Daily/Weekly/Monthly Patterns:**
- **Monthly:** Checking savings balance after deposits. "Did my automatic transfer go through?"
- **Quarterly:** Reviewing interest earned. "How much did my savings make this quarter?"
- **Annually:** Evaluating savings products. "Should I move to a higher-yield account?" Assessing progress toward savings goals.

**Expectations from Banking Apps:**
Users expect:
- Current balance with interest rate displayed
- Interest earned (monthly, quarterly, annual)
- Transaction history (deposits, withdrawals, interest payments)
- Maturity date for term deposits
- Early withdrawal penalties for CDs

**Common Mistakes:**
- Keeping too much in low-yield savings when higher-yield options exist
- Breaking term deposits early and losing interest
- Confusing savings account balance with "money available for spending"
- Not laddering CDs — letting all savings mature at once
- Treating savings as a single bucket rather than purpose-specific

**Common Frustrations:**
- Interest rates are low and barely visible
- Can't easily compare savings products
- Early withdrawal penalties feel punitive
- Maturity dates are easy to forget
- Savings goals and savings accounts don't connect

### ViNha Savings Model Fit

ViNha's savings model (real financial instruments with terms and maturity) correctly positions savings as Real Ledger, not Intention Plan. The distinction from jars is critical — jars are intention; savings accounts are real wealth.

**Verdict:** The model is correct for MKP. The product diversity gap is acceptable for now.

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**Yes, with acceptable scope limitations.**

**What's Correct:**
- Savings as real financial instruments (not jars, not goals)
- Interest rate tracking for yield awareness
- Term and maturity for time-deposit products
- BR-10: Maturity → Inbox flow for reallocation decisions

**What's Incomplete (Acceptable for MKP):**
1. **Product diversity** — Real households have diverse savings: high-yield savings, CDs, money market accounts, treasury bonds. ViNha's model supports these via the `type` field but doesn't differentiate them strongly.
2. **Compounding display** — Interest compounding frequency (daily, monthly, quarterly) affects yield. ViNha shows interest rate but not compounding detail.
3. **Early withdrawal rules** — CDs have penalties for early withdrawal (e.g., 3 months interest). ViNha doesn't model these.
4. **Savings rate calculation** — "What percentage of income are we saving?" This is a Health metric, not a Savings domain concern, but users will expect it.

### Dangerous Assumptions
**None identified.** The savings model is conservative — it reflects what the bank says, not what ViNha hopes.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Yes, with BR-10 as a key behavioral mechanism.**

**Behavioral Strength:** BR-10 routes savings maturity to Inbox. This prevents the common mistake of letting maturing savings sit in a low-yield default account because the user forgot to make a decision. The Inbox card forces a conscious reallocation choice.

**Behavioral Strength:** Separation from jars prevents users from "double-counting" — the savings balance is not also a jar allocation. This is honest accounting.

**Behavioral Risk:** Users may not distinguish between "savings account" (real money) and "savings jar" (intention to save). The naming similarity is a UX risk. Consider terminology: "Savings Accounts" vs "Reserve Jar" or similar.

**Friction Point:** Savings goals (in Goals domain) may not connect to savings accounts. Users want to see "my emergency fund jar has $5,000 allocated, and my actual savings account has $5,000." While BR-01 says these are not the same thing, users will want to see them together.

---

## Competitor Benchmark

### YNAB
- Savings accounts are on-budget. Money in savings is assigned to categories like any other account.
- Strong: All money is budgeted. No "off-limits" money.
- Weak: Users lose the behavioral separation of savings. "Emergency fund" category vs savings account are conflated.
- ViNha Difference: ViNha keeps savings accounts as real and savings intentions as jars. Cleaner but may feel less integrated.

### Copilot Money
- Savings accounts are tracked alongside checking and investment. Interest earned is visible.
- Strong: Beautiful savings view. Interest tracking.
- Weak: No savings-specific features. Savings is just an account type.
- ViNha Difference: ViNha's Savings domain adds term, maturity, and Inbox routing. More structured than Copilot.

### Monarch Money
- Savings accounts are comprehensive. Goal linking to savings accounts is possible.
- Strong: Full account type support. Goals can link to savings.
- Weak: Less behavioral. No maturity management.
- ViNha Difference: ViNha's BR-10 (maturity → Inbox) is unique. No competitor routes maturing savings to a decision queue.

### Simplifi
- Savings accounts tracked. Savings goals exist but are basic.
- Strong: Simple. Savings appear in net worth.
- Weak: No savings-specific features.
- ViNha Difference: ViNha's structured approach (term, rate, maturity) adds value for users with time deposits.

---

## Simplicity Validation

### Is the Savings Model Optimally Simple?

**Slightly too simple for users with diverse savings products. Acceptable for MKP.**

**Complexity Score:** Current 3/10, Optimal 4/10. Gap: +1 (small).

The model handles basic savings accounts well. For CDs and term deposits, the model is adequate (type, term, rate, maturity covers the basics). For users with multiple savings products, the model may feel undifferentiated.

**What should be added (future, not now):**
- Compounding frequency display
- Early withdrawal penalty indicators (for CDs)
- Savings product type differentiation (HYSA, CD, MMA, Treasury)

**What should not be added:**
- Savings rate optimization recommendations
- Product comparison tools
- Automatic savings transfers

---

## Longevity Validation

### Will the Savings Model Age Well?

**Moderate risk. The boundary between "savings" and "investment" is blurring.**

**Stress Points:**
1. **Robo-advisors in savings accounts** — Betterment, Wealthfront offer "cash management" accounts that are savings-like but with investment-like yields. The savings/investment boundary blurs.
2. **High-yield savings rates fluctuate** — Currently high (4-5%), may drop. User interest in savings products tracks rates.
3. **Savings round-up programs** — Acorns-style micro-savings. Users may want to track these in ViNha.
4. **Savings account proliferation** — Users may have multiple savings accounts for different purposes. The "one savings account = one purpose" model may not hold.

**Evolution:** Add product type differentiation. Prepare for F-Wealth integration (savings ↔ investment boundary).

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Supports Household Money OS, especially with BR-10 maturity routing.**

The Savings domain does more than track balances — it manages the lifecycle of savings products. Maturity dates, Inbox routing for reallocation decisions, and the distinction from jars make savings feel like a managed financial instrument, not just a balance.

The household angle: partners can see all household savings in one place, with maturity alerts so nothing is forgotten.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Savings Product Diversity** — CD, MMA, Treasury, HYSA differentiation. Future capability (FC-13).
2. **Maturity Alerts** — Proactive notification before savings maturity. Future evolution (EO-12).
3. **Interest Rate Comparison** — Across household savings products. Future capability.
4. **Compounding Detail** — Frequency, annualized yield display. Low priority display enhancement.

### What Should Remain Intentionally Absent?

- **Investment products** — Explicitly F-Wealth. The savings/investment boundary must hold.
- **Automatic savings rules** — "Save $X when Y happens." This is Planning domain, not Savings domain.
- **Savings rate optimization** — Financial advice. ViNha is not an advisor.

---

## Industry Best Practices

### Patterns to Adopt
1. **Interest rate display** — Standard in banking apps. Users expect to see their rate.
2. **Maturity date tracking** — Essential for term deposits. Banks show this.
3. **Interest earned summaries** — Standard in banking. YTD interest earned is motivating.

### Patterns to Avoid
1. **"Savings" as a budget category** — YNAB does this. It conflates real savings (account) with planned savings (category). ViNha's separation is better.
2. **Savings account = goal** — Monarch blurs this. A savings account is a container; a goal is a target. They can align but shouldn't be conflated.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-S1 | Savings Maturity Alerts | 7 | 6 | 3 | 2 | 2 | 2 | 7 | 7 |
| EO-S2 | Savings Product Diversity | 5 | 5 | 4 | 3 | 3 | 3 | 7 | 6 |
| EO-S3 | Interest Rate Comparison | 4 | 5 | 4 | 2 | 3 | 3 | 5 | 5 |

---

## Verdict: APPROVED WITH FUTURE CAPABILITIES

**Confidence: MEDIUM-HIGH**

The Savings domain model is correct for MKP. The product diversity gap is acceptable and scoped as a future capability (FC-13). BR-10 (maturity → Inbox) is a genuine behavioral innovation.

**Justification:**
- Correctly positioned as Real Ledger (not Intention Plan)
- BR-10 maturity routing is unique and behaviorally sound
- Basic savings model covers MKP needs
- Product diversity is a future capability, not an MKP gap
- No dangerous assumptions or behavioral risks

**Action Required:** None for MKP. Plan for savings product diversity in F-Wealth timeframe.
