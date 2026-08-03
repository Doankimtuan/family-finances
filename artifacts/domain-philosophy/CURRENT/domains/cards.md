# Domain: Cards

**Bounded Context:** Real Ledger
**Surface:** Money
**Financial Principle:** Liquidity
**Business Rules:** BR-01

---

## 1. Philosophy

Cards answer the question: **what spending power do we have beyond our cash, and what do we owe on it?**

A Card is a payment instrument — typically a credit card — that enables the household to spend money it does not currently have in a checking Account. A Card extends *liquidity* — the ability to transact — at the cost of creating a *liability* — an obligation to repay.

The philosophical purpose of Cards is *liquidity management.* Accounts tell the household what money they have. Cards tell the household what additional spending power is available and what debt has been incurred. Together, they paint the complete picture of the household's financial capacity.

Cards belong to the Real Ledger. They are real financial instruments issued by real financial institutions. A credit limit is a fact. A statement balance is a fact. These are not intentions.

---

## 2. User Problem

Credit cards create a unique form of financial confusion. The bank account shows one balance; the credit card shows another. Money spent on the card has not yet left the bank account, but the obligation exists. The household can easily lose track of: how much is on the card this month, when payment is due, what the credit utilization is, and whether they are spending within their means.

The pain is *liquidity illusion.* The checking account looks full, but the credit card bill has not been paid yet. The household feels wealthier than it actually is.

Cards solve this by making credit card spending and obligations visible alongside account balances. The household sees: we have X in the bank, we owe Y on the card, our net position is X - Y. No illusion.

---

## 3. Financial Principle

**Liquidity.** Liquidity is the ability to spend. Cash in a checking account is the most liquid form of money. A credit card is a liquidity instrument — it provides spending ability without requiring immediate cash. But that liquidity comes at a cost: the obligation to repay.

Understanding liquidity is essential to financial health. A household that confuses credit availability with wealth is at risk. A household that manages liquidity intentionally is in control.

---

## 4. Core Responsibilities

1. **Represent credit and debit cards.** Each Card has an issuing institution, a credit limit (for credit cards), and a billing cycle.
2. **Track card spending.** Transactions made with the Card flow through the Transactions domain; Cards aggregate the current billing cycle's spending.
3. **Track statement balance.** The amount owed at the end of the billing cycle.
4. **Calculate available credit.** Credit limit minus current balance.
5. **Track credit utilization.** Current balance as a percentage of credit limit — a key financial health indicator.
6. **Surface payment due dates and amounts.** When is the payment due? What is the minimum payment? What is the full statement balance?
7. **Link card payments to Account transactions.** Paying a credit card is a Transfer from an Account to the Card — not a new expense.

---

## 5. Explicit Non-Responsibilities

1. **Cards are NOT Accounts.** A credit card is a payment instrument, not a money container. The card does not "hold" the household's money — it holds the bank's money, which the household must repay.
2. **Cards do NOT replace expense tracking.** Card Transactions are still Transactions — the Card domain aggregates, it does not replace the Transactions domain.
3. **Cards do NOT manage rewards or points.** Cashback, miles, points — these are out of scope for MVP.
4. **Cards do NOT handle disputed charges.** Dispute resolution is between the household and the bank.
5. **Cards do NOT make payment decisions.** The system shows what is owed and when; it does not auto-pay or suggest payment amounts.

---

## 6. Domain Boundary

**IN:**
- Card definitions (name, issuer, card type, last four digits)
- Credit limit (for credit cards)
- Current balance / statement balance
- Billing cycle dates
- Payment due date
- Minimum payment amount
- Available credit calculation
- Credit utilization percentage
- Card payment tracking (as Transfers from Accounts)

**OUT:**
- Account balances (→ Accounts domain)
- Individual card Transactions (→ Transactions domain — Cards aggregate)
- Card rewards/points (→ out of scope)
- Card application or comparison (→ out of scope)
- Credit score impact (→ out of scope)
- Auto-pay configuration (→ future feature)

---

## 7. Business Language

**Official Terms:**
- **Card:** A payment instrument — credit card or debit card
- **Credit Limit:** Maximum amount that can be charged to the card
- **Statement Balance:** Amount owed at the close of a billing cycle
- **Current Balance:** Total outstanding amount on the card
- **Available Credit:** Credit limit minus current balance
- **Utilization:** Current balance as a percentage of credit limit
- **Billing Cycle:** The period between statement dates
- **Minimum Payment:** The smallest amount the issuer requires by the due date

**Aliases:**
- "Credit Card" and "Debit Card" are specific types.
- "Card" is the generic term.

**Forbidden Terminology:**
- ❌ "Card account" — a card is not an account
- ❌ "Card balance" used interchangeably with "Account balance" — clarify whether it is Statement Balance or Current Balance
- ❌ "Card budget" — cards are payment instruments, not budget categories

**Preferred Terminology:**
- ✅ "Vietcombank Visa: 50 million limit, 12 million current balance (24% utilization)"
- ✅ "Payment of 12 million due by the 15th"

---

## 8. Mental Model

Users should think of Cards as **a friend who lends you money for a month, then asks for it back.** The friend (the bank) says "you can spend up to 50 million this month. At the end of the month, I will tell you what you owe. Pay me back by the 15th."

The friend's generosity is not the household's wealth. The 50 million spending limit is the friend's money, not the household's. The household's real money is in the bank. When the friend asks for repayment, the money comes from the bank account.

This metaphor helps households understand that credit card spending is *borrowing,* not *owning.* The availability of credit is not the availability of wealth.

---

## 9. Real-World Validation

**Banking:** Credit cards are a standard financial product globally and increasingly common in Vietnam. Billing cycles, statement balances, minimum payments, and credit limits are standard concepts.

**Personal finance best practices:** Financial advisors universally recommend keeping credit utilization below 30%. ViNha can surface this as a Health indicator.

**Consumer finance products:** Most apps treat credit cards as negative accounts or as regular accounts. ViNha's approach — Cards as a distinct domain with liquidity semantics — is more accurate and more useful.

**Validation:** This domain is well-grounded in banking reality. The concepts are standardized and unlikely to change.

---

## 10. Simplicity

Cards are conceptually simple (limit, balance, due date) but the distinction between Statement Balance and Current Balance can confuse users.

**What could be removed?**
- For MVP, tracking only the Current Balance (not Statement Balance vs. Current Balance distinction) may be sufficient — households can add statement detail later.
- Multiple card types (credit, debit, charge) — start with credit cards and add debit cards if needed.

**Resist the temptation to add:**
- Transaction-level card tracking in the Card domain — Transactions belong to the Transactions domain.
- Rewards optimization ("use Card A for groceries to maximize cashback") — out of scope.
- Card recommendation ("you should apply for Card X") — out of scope.

---

## 11. Evolution Potential

Cards can evolve:

- **Statement vs. Current Balance:** Adding the distinction between what was owed at statement close vs. what is owed now.
- **Payment tracking:** Showing payment history and next payment amount.
- **Spend-by-category on card:** The Health domain could show "you spent X on dining via credit cards this month."
- **Grace period awareness:** "You have 45 days interest-free on this purchase."
- **Card comparison:** If F-Wealth enters scope, card comparison tools could be added.

The domain is stable. Credit cards are a mature financial product with well-understood semantics.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Treating credit cards as Accounts (storing them in the same table, displaying them in the same list). Cards are payment instruments, not money containers.
- Failing to handle card payments correctly — paying a credit card is a Transfer from an Account, not an Expense.
- Using the Current Balance for net worth calculations without acknowledging it as a liability.

**UX Mistakes:**
- Displaying credit card balances without clearly labeling them as "owed," not "available."
- Showing credit limit as if it were available cash — the limit is a borrowing capacity, not wealth.
- Making it difficult to see the net position: total accounts minus total card balances.

**Business Mistakes:**
- Positioning credit cards as "bad" — the system is neutral. Credit cards are financial tools.
- Encouraging higher credit utilization by making the available credit too prominent.
- Failing to surface high utilization as a Health concern.

---

## 13. Success Criteria

From the user's perspective, Cards are successful when:

1. **A partner can answer "how much do we owe on credit cards?" in under 5 seconds.**
2. **The liquidity illusion is broken** — the household always sees both account balances and card obligations together.
3. **Payment due dates are visible and not missed** — the system makes obligations clear.
4. **Credit utilization is visible but not alarming** — the tone is informative, not judgmental.
5. **Card spending feeds naturally into the rest of the system** — card Transactions are categorized and mapped to Jars just like any other Transaction.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker records credit card transactions as expenses but does not track the card as a financial instrument. ViNha tracks both — the transactions AND the card's liquidity characteristics.

Cards embody **Truth before intention.** A credit card balance is a real liability — a fact. The household must account for it before deciding how much to allocate to discretionary Jars.

Cards embody **Calm finance UI.** Credit card information can be stressful. The design should be clear, factual, and calm — "here is what you owe, here is when it is due" — without red alerts or judgment.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 8 | The Card-as-instrument vs. Account-as-container distinction is clear but needs reinforcement |
| Financial Correctness | 9 | Accurately models credit cards as liquidity instruments with liability characteristics |
| User Value | 8 | High for card-using households; lower for cash-only households |
| Longevity | 9 | Credit cards are a permanent financial product |
| Extensibility | 7 | Can add statement detail, rewards; fundamentally stable |
| Simplicity | 7 | Current Balance vs. Statement Balance distinction adds complexity; simplify for MVP |
| Future Evolution | 7 | Stable; evolution is around detail and intelligence, not structural change |

**Overall: 7.9 / 10** — A correct and useful domain. The main risk is over-complication (too much card detail) rather than under-design.
