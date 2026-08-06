# Domain Reality Validation — Accounts

## Reality Validation

### How Real People Interact With Accounts

Accounts are the most familiar financial concept. Every adult with a bank account understands the basics: an account holds money, has a balance, and transactions flow through it. Users check account balances frequently — daily for many, weekly for most. The primary user behavior is balance checking: "How much money do I have?"

**Daily/Weekly/Monthly Patterns:**
- **Daily:** Quick balance checks, especially before purchases. "Do I have enough for this?"
- **Weekly:** Reviewing recent transactions, confirming nothing is unexpected.
- **Monthly:** Statement review, reconciling with personal records, paying credit card bills from checking.

**Expectations from Banking Apps:**
Users bring strong mental models from banking apps. They expect:
- Real-time or near-real-time balance updates
- Clear distinction between current balance and available balance (pending transactions)
- Transaction history with running balance
- Account nicknames and customization
- Basic account details (account number, routing number, type)

**Common Mistakes:**
- Confusing current balance with available balance (forgetting pending transactions)
- Forgetting about automatic payments and subscriptions when checking balance
- Treating credit card available credit as "money they have"
- Not distinguishing between account types (checking vs savings purposes)

**Common Frustrations:**
- Balance doesn't match expectations ("I thought I had more")
- Bank sync delays (balance is stale)
- Too many accounts to track ("I have accounts at 3 banks")
- Can't rename accounts meaningfully ("Checking ****1234" is not useful)

### ViNha Account Model Fit

ViNha's account model (containers of real wealth, type + balance) maps cleanly to real user behavior. The simplicity is correct — accounts should not do more than hold value and report it. The model correctly resists adding behavioral features to accounts (those belong in Plan).

**Verdict:** The account model reflects reality well. Users will immediately understand accounts. The challenge is not the model but the integration quality (bank sync accuracy, balance freshness).

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**Yes, with high fidelity.**

The account model correctly captures:
- **Account as value container:** Balance is the source of truth
- **Account types:** Checking, savings, credit card — fundamental categories
- **Balance as fact:** Not intention, not projection — verifiable number

### Assumptions That Hold
1. Accounts are containers of real wealth — CORRECT. This is the fundamental banking concept.
2. Account type determines behavior — CORRECT. Checking behaves differently than savings or credit.
3. Balance is always knowable — GENERALLY CORRECT. Bank sync provides balance. Manual accounts rely on user accuracy.

### Assumptions That May Be Incomplete
1. **Balance is singular** — Real accounts have current balance, available balance, ledger balance. Pending transactions create a gap between current and available. ViNha's model shows one balance. For MKP, this is acceptable. For power users, the distinction matters.
2. **Accounts are independent** — Real accounts have relationships: overdraft protection links checking to savings, credit cards are paid from checking. ViNha doesn't model these relationships. For MKP, this is acceptable.
3. **All accounts are equally accessible** — Some accounts have withdrawal limits, transfer delays, or restricted access (joint accounts requiring both signatures). ViNha doesn't model access constraints.

### Dangerous Assumptions
**None identified.** The account model is conservative and correct. It does not overreach.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Yes, with one behavioral nuance.**

The account model's simplicity supports healthy behavior: it shows you what you have, without interpretation. This is honest. Users who previously confused "budget categories" with "bank balance" will find ViNha's account view clarifying.

**Behavioral Strength:** By not mixing intention with reality, accounts prevent the most common budgeting error — believing you have more money than you do because you "allocated" it to categories.

**Behavioral Risk:** Account balance visibility without planning context could encourage spending. "I have $5,000 in checking, I can afford this" — without seeing that $4,000 is allocated to rent, bills, and savings. This is mitigated by the Home view showing both Real and Plan.

**Friction Point:** Users may want to see "money available to spend" — a derived number that subtracts committed allocations from account balances. This is not a domain model change; it's a Home view calculation.

---

## Competitor Benchmark

### YNAB
- Accounts are "on-budget" or "off-budget" (tracking). On-budget accounts fund categories.
- Strong: Clear mental model for budgeting. Accounts feed categories.
- Weak: "On-budget" vs "off-budget" distinction is confusing. Users don't know where to put investment accounts.
- ViNha Difference: ViNha doesn't distinguish "budget" vs "tracking" accounts. All accounts are real; jars are plans. Cleaner separation.

### Copilot Money
- Accounts are the primary organizational unit. Net worth is account-based.
- Strong: Beautiful account views with transaction history. Investment account support.
- Weak: No envelope budgeting. Accounts are for tracking, not planning.
- ViNha Difference: ViNha separates account tracking from planning. Copilot conflates them.

### Monarch Money
- Accounts are comprehensive: checking, savings, credit, investment, loan, property.
- Strong: Full account type coverage. Good balance between simplicity and completeness.
- Weak: Account management can feel overwhelming with many connected accounts.
- ViNha Difference: ViNha has fewer account types (MKP scope). Monarch's comprehensiveness is a future aspiration.

### Simplifi
- Accounts are straightforward: checking, savings, credit card, investment.
- Strong: Clean account list. Cash flow projections based on account balances.
- Weak: Less account detail than Monarch.
- ViNha Difference: Similar simplicity. ViNha adds Plan layer on top.

---

## Simplicity Validation

### Is the Account Model Optimally Simple?

**Yes. 9.3/10 — near-perfect simplicity.**

Accounts are exactly as simple as they should be. The model has:
- Account entity: name, type, balance, institution
- No lifecycle management, no complex rules, no behavioral features

**What can be removed?** Nothing. The current model is minimal and complete.

**What is missing?** Account relationships (overdraft protection, transfer links) — but these are future capabilities, not MKP necessities.

**Simplicity Risk:** None. Accounts are the simplest domain and should stay that way.

---

## Longevity Validation

### Will the Account Model Age Well?

**Yes. 3-5 year longevity is high.**

Account containers are a durable concept. Banking innovation (digital banks, fintech accounts) changes account features but not the container model. The type enum may expand (new account subtypes) but the entity model holds.

**Stress Points:**
- Open Banking APIs may standardize account data — requires adapter, not model change
- Digital-bank account types may blur checking/savings boundaries — type system may need flexibility
- Crypto accounts — explicitly excluded but market pressure may mount

**Evolution:**
- Add account subtypes (high-yield checking, cash management)
- Add account relationships (linked for overdraft, transfer pairs)
- Add access constraints (joint account signing requirements)

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Strongly supports "Household Money OS."**

Accounts as real wealth containers is a foundational concept for an operating system. The separation from Plan makes it clear that ViNha is not just tracking what happened (expense tracker) — it's showing you what you really have, as the basis for planning what to do with it.

The distinction from an expense tracker: expense trackers show accounts as a list. ViNha shows accounts as the "real" layer that the "plan" layer sits on top of.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Available vs Current Balance** — Pending transactions create a gap. Users with many pending transactions may be misled by current balance. Future capability.
2. **Account Relationships** — Overdraft protection, linked transfers. Future capability.
3. **Joint Account Indicators** — Some accounts require both partners' authorization. Together domain integration — future capability.
4. **Account Access Constraints** — Withdrawal limits, transfer delays. Display-only metadata — low priority.

### What Should Remain Intentionally Absent?

- **Account performance metrics** — Interest rate optimization, fee analysis. Not ViNha's purpose.
- **Account opening/closing flows** — ViNha is not a bank. Users manage accounts at their bank.
- **Business accounts** — Personal/household only. Explicitly excluded.

---

## Industry Best Practices

### Patterns to Adopt
1. **Clear account type distinction** — Checking, savings, credit card. Universal in banking.
2. **Balance as primary metric** — Users check balance first. Standard across all competitors.
3. **Transaction history linked to accounts** — Standard banking UX. Monarch does this well.
4. **Account nicknames** — Users want meaningful names. All competitors allow renaming.

### Patterns to Avoid
1. **"On-budget" vs "Off-budget"** — YNAB's distinction is confusing. ViNha's Real/Intention separation is cleaner.
2. **Net worth as account page default** — Copilot and Monarch push net worth. ViNha should push "real position."
3. **Account balance as spending limit** — Simplifi shows "available to spend" from account balances. This conflates real and planned.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-A1 | Available Balance Display | 5 | 7 | 3 | 2 | 2 | 2 | 6 | 7 |
| EO-A2 | Account Relationships | 4 | 5 | 5 | 3 | 4 | 3 | 6 | 6 |
| EO-A3 | Account Type Sub-Classification | 4 | 4 | 4 | 3 | 3 | 2 | 5 | 5 |
| EO-A4 | Joint Account Authorization Indicators | 3 | 5 | 4 | 2 | 3 | 3 | 5 | 5 |

**EO-A1 Description:** Display both current balance and available balance (current minus pending). Business value moderate (power users care). Complexity low (balance display enhancement).

**EO-A2 Description:** Model relationships between accounts (overdraft protection source, auto-transfer pairs). Business value moderate. Complexity medium (new relationship entity). Architecture impact medium (crosses account boundaries).

**EO-A3 Description:** Sub-classify account types (high-yield checking, cash management, student checking). Business value low. Complexity low (enum extension).

**EO-A4 Description:** Indicate which accounts require both partners' authorization for transactions. Business value low. Complexity low (metadata flag). Together domain integration needed.

---

## Verdict: APPROVED

**Confidence: HIGH**

The Accounts domain model is financially correct, behaviorally sound, optimally simple, and structurally durable. It is ready for MKP implementation without modification.

**Justification:**
- Accounts as value containers is the universally correct model
- The simplicity is a feature, not a gap
- No behavioral or financial risks identified
- Competitor approaches validate the container model
- Evolution opportunities are incremental, not structural
- The Real/Intention separation makes Accounts more honest than competitor implementations

**The account model is one of ViNha's strongest domains. Protect its simplicity.**
