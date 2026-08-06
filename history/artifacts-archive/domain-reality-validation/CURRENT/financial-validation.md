# Domain Reality Validation — Financial Validation

## Cross-Domain Financial Correctness Assessment

### Fundamental Assumptions: Validated

**Assumption 1: Real Money ≠ Planned Money**
The separation of Real Ledger (financial truth) from Intention Plan (financial promises) is fundamentally correct. In household finance, this maps to the distinction between "what we have" and "what we've decided to do with it." This separation is more honest than YNAB's approach, which can make users believe category balances equal available money.

**Assumption 2: Transactions Are Immutable Facts**
Once a transaction clears, its fact-value is fixed. Categorization may change (tag updates), but amount, date, account, and counterparty do not. This matches real banking — you can't change what happened. YNAB and Monarch also treat transactions as immutable; this is industry standard.

**Assumption 3: Accounts Contain Real Wealth**
Accounts are real containers of value. An account balance is a fact, not an intention. This maps to real banking: checking, savings, credit card accounts have verifiable balances. ViNha's account model is correct and complete for MKP.

**Assumption 4: Jars Are Spending Promises, Not Money Locations**
A jar allocation is a plan, not a bank balance. Money remains in accounts; jars represent how that money is intended to be used. This is the correct financial model. YNAB's category system works identically, though YNAB's marketing sometimes blurs this distinction.

**Assumption 5: Planning Rules Are Automation, Not Guarantees**
Recurring rules and income placement are forecasting and automation — they don't guarantee future events. The model correctly treats planning as intention, not fact.

### Where the Model Is Incomplete

**Incomplete: Credit Card Financial Complexity**
The Cards domain models credit cards as payment instruments with limits and statements. Real credit card behavior is more complex:
- **Grace periods** — Payments within the grace period don't accrue interest
- **Minimum payments** — Users often pay only the minimum, accruing interest
- **Variable APRs** — Intro rates, penalty APRs, cash advance rates
- **Balance transfers** — Moving debt between cards
- **Authorized users** — Additional cardholders on the same account
- **Rewards programs** — Cash back, points, miles that have real financial value

**Financial Risk:** Users may make suboptimal card decisions (e.g., paying off a 0% APR card before a 22% APR card) because ViNha doesn't surface interest costs. This is a medium-risk gap for MKP but a high-priority gap for user financial health.

**Incomplete: Savings Product Diversity**
The Savings domain models savings accounts and term deposits. Real household savings include:
- **High-yield savings accounts** — Variable rates that change with market conditions
- **Certificates of Deposit (CDs)** — Fixed terms with penalties for early withdrawal
- **Money market accounts** — Higher yields with check-writing privileges
- **Treasury bonds/bills** — Government securities with specific maturity profiles
- **Investment accounts** — Explicitly out of scope (F-Wealth is Future) but users will have them

**Financial Risk:** Users with investment accounts (most middle-class+ households) will have "missing money." The Health domain reflecting only non-investment accounts will show an incomplete picture. Acceptable for MKP, must be addressed before F-Wealth.

**Incomplete: Installment Interest Calculations**
The Installments domain models principal and payment count. Real installment debt includes:
- **Amortization schedules** — Interest is front-loaded; early payments are mostly interest
- **Variable rates** — Some installment products have floating rates
- **Prepayment penalties** — Some loans penalize early payoff
- **Escrow components** — Mortgage payments often include taxes and insurance

**Financial Risk:** Without understanding interest vs principal, users may not optimize debt payoff order. BR-11 (completion when paid ≥ num_installments) is correct but may miss early-payoff scenarios.

**Incomplete: Multi-Currency**
ViNha assumes single-currency households. Real households may:
- Hold accounts in multiple currencies
- Receive income in one currency and spend in another
- Travel between currency zones

**Financial Risk:** Low for MKP (v2 Vietnamese market focus). Medium for future international expansion.

### Where the Model Is Dangerous

**Dangerous: No Overdraft Protection Model**
Accounts assume positive balances. Real checking accounts can go negative (overdraft). The model doesn't address:
- Overdraft fees
- Linked overdraft protection accounts
- Overdraft lines of credit

**Financial Risk:** Medium. Users may be surprised by overdrafts that ViNha doesn't help prevent. Cash flow projections (future capability) would mitigate this.

**Dangerous: Card Due Date Blindness**
The Cards model captures statement dates but doesn't emphasize payment due dates. Missing a credit card payment has severe consequences:
- Late fees ($25-40)
- Penalty APRs (often 29.99%)
- Credit score impact
- Loss of grace period on new purchases

**Financial Risk:** High for users with credit cards. Payment reminders are a near-term necessity, not a future enhancement.

### Financial Concepts Correctly Excluded (MKP)

These concepts are absent by design and the exclusion is correct:
- **Investment portfolios** — Correctly deferred to F-Wealth
- **Tax optimization** — Correctly excluded (not a tax tool)
- **Brokerage integration** — Correctly excluded (not an investment platform)
- **Crypto assets** — Correctly excluded (not a speculative asset tracker)
- **Business finances** — Correctly excluded (personal/household only)
- **Credit score monitoring** — Correctly excluded (not a credit bureau)

### Cross-Domain Financial Integrity

**BR-01 Enforcement: Real ≠ Virtual**
The model's greatest financial strength. No validation found a case where bank balance could be confused with jar allocation. This is architecturally enforced, not just a rule. Every competitor except YNAB blurs this distinction.

**BR-11 Enforcement: Installment Completion**
The paid_installments ≥ num_installments completion rule is correct. However, early payoff (prepayment) scenarios are not modeled. A user who pays off an installment early would have paid_installments < num_installments but the debt is settled. The model would show an active installment incorrectly.

**BR-14 Enforcement: Health Read-Only**
Health must never write. This is correct. Financial health tools that create transactions (e.g., "save $50 to reach your goal") are dangerous because they invent money. Health's read-only constraint is financially responsible.

### Industry Best Practices Adopted

1. **Immutable transactions** — Standard across all competitors and banking systems
2. **Account balance as source of truth** — Standard banking practice
3. **Category/jar separation from accounts** — YNAB's model, validated by millions of users
4. **Goal tracking with progress** — Standard across YNAB, Monarch, Simplifi
5. **Recurring transaction detection** — Standard across all competitors

### Industry Best Practices Missing

1. **Cash flow projections** — Simplifi and Monarch offer this; reduces bill-timing anxiety
2. **Interest cost visibility** — No competitor does this well, but it's financially important
3. **Debt payoff optimization** — Avalanche vs snowball methods; YNAB offers basic loan tracking
4. **Overdraft prediction** — No competitor does this; would be a ViNha innovation
5. **Tax-advantaged account awareness** — Monarch and Copilot show account types; ViNha doesn't distinguish

---

*Financial validation completed. The domain model is fundamentally correct with specific, addressable gaps in Cards, Savings, and Installments. No blocking financial errors found.*
