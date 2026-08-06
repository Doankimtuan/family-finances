# Domain: Installments

**Bounded Context:** Real Ledger
**Surface:** Money
**Financial Principle:** Debt
**Business Rules:** BR-11

---

## 1. Philosophy

Installments answer the question: **what do we owe, and how are we paying it back?**

An Installment is a structured debt repayment plan. The household has taken on a financial obligation — a loan, a financed purchase, a buy-now-pay-later arrangement — and is repaying it in fixed installments over a defined period. Each installment is a real financial obligation. It must be paid.

The philosophical purpose of Installments is *debt visibility.* Debt that is hidden or poorly tracked erodes financial health. Debt that is visible, structured, and actively managed is manageable. Installments transform "we owe money" — a vague, stressful statement — into "we have 4 payments of 5 million VND remaining" — a concrete, manageable fact.

Installments belong to the Real Ledger. They are real obligations, not intentions. An installment plan is not a Jar — it is a debt.

---

## 2. User Problem

Households in Vietnam increasingly use installment plans — for electronics, furniture, vehicles, and through buy-now-pay-later services. But tracking multiple installment plans across different providers is difficult. How many payments remain? When is each due? How much total debt is outstanding?

The pain is *debt blindness.* The household knows they have installments but does not have a clear picture of the total obligation. Individual payments feel manageable; the aggregate debt may not.

Installments solve this by bringing all structured debt into one view. The household sees every installment plan, its progress, the remaining payments, and the total outstanding debt. BR-11 ensures completion is automatically detected when the final payment is made.

---

## 3. Financial Principle

**Debt.** Debt is not inherently bad — but unmanaged debt is. An installment plan is a tool: it enables the household to acquire something now and pay over time. The financial principle is that debt must be *visible, structured, and actively managed.*

Debt management is a core financial skill. The household that knows exactly what it owes and when payments are due is a household in control. The household that loses track of its installments is a household at risk.

---

## 4. Core Responsibilities

1. **Represent structured debt obligations.** Each installment plan has a total amount, number of installments, installment amount, payment frequency, and start date.
2. **Track payment progress.** How many installments have been paid? How many remain? BR-11: an installment plan completes when `paid_installments >= num_installments`.
3. **Calculate remaining debt.** Total amount minus total paid.
4. **Surface completion events.** When an installment plan completes (BR-11), notify the household through the Inbox.
5. **Distinguish installment types.** Fixed installment (equal payments), reducing balance (interest-bearing), buy-now-pay-later.
6. **Link to Account transactions.** Installment payments are real Transactions flowing from an Account. The Installment domain tracks the *plan*; Transactions track the *actual payments.*

---

## 5. Explicit Non-Responsibilities

1. **Installments are NOT Jars.** An installment is a debt obligation, not an intention envelope. You do not "allocate" money to an installment — you owe it.
2. **Installments do NOT calculate interest dynamically.** Interest terms are set at plan creation. If interest is variable, the household updates the plan — the system does not track rate changes.
3. **Installments are NOT loan origination tools.** ViNha does not help households apply for loans or compare installment offers. It tracks existing obligations.
4. **Installments do NOT manage credit scores.** Credit score monitoring is out of scope.
5. **Installments are NOT recurring expenses.** A monthly rent payment is a recurring expense (→ Planning domain). An installment is a structured debt with a defined end — when `paid_installments >= num_installments`, it is done (BR-11).

---

## 6. Domain Boundary

**IN:**
- Installment plan definitions (total amount, num installments, amount per installment, frequency)
- Payment progress tracking (paid count, remaining count, total paid, remaining balance)
- Installment types: fixed, reducing balance, buy-now-pay-later
- Completion detection (BR-11)
- Completion-triggered Inbox notifications
- Link to payment Transactions in the Real Ledger

**OUT:**
- Loan application or comparison (→ out of scope)
- Interest rate tracking or projection (→ out of scope for MVP)
- Credit score impact (→ out of scope)
- Recurring expense tracking (→ Planning domain)
- Jar allocation for installment payments (→ Budgets domain — the household may choose to allocate for upcoming installments in Jars)

---

## 7. Business Language

**Official Terms:**
- **Installment (Plan):** A structured debt repayment obligation
- **Total Amount:** The full amount owed (principal + any contracted interest/fees)
- **Number of Installments:** Total count of scheduled payments
- **Installment Amount:** The payment amount per period
- **Paid Installments:** Count of payments made so far
- **Remaining Installments:** Count of payments still due
- **Outstanding Balance:** Total remaining amount to be paid
- **Completion:** When paid_installments >= num_installments (BR-11)

**Aliases:**
- "Payment Plan" is acceptable but "Installment" is preferred.
- "EMI" (Equated Monthly Installment) is acceptable in technical contexts.

**Forbidden Terminology:**
- ❌ "Installment budget" — installments are obligations, not budgets
- ❌ "Installment goal" — installments are debts to be cleared, not targets to reach
- ❌ "Installment balance" (in the sense of a Jar allocation) — use "Outstanding balance"

**Preferred Terminology:**
- ✅ "Phone installment: 12 payments of 2 million VND — 8 paid, 4 remaining"
- ✅ "This installment completes next month"

---

## 8. Mental Model

Users should think of Installments as **countdown timers with a total displayed.** The household committed to a certain number of payments of a certain size. Each time a payment is made, the counter ticks down. When the counter reaches zero (BR-11), the obligation is fulfilled.

This is not like a Jar, where money can be added or removed freely. An installment is contractual — the household cannot decide to "pay less this month" without consequences. The system does not enforce payment, but it makes the obligation visible.

The countdown metaphor emphasizes that installments have a *finite end.* Unlike recurring expenses (which continue indefinitely), an installment plan will complete. This is psychologically important: debt with an end date is less intimidating than open-ended debt.

---

## 9. Real-World Validation

**Vietnamese consumer finance:** Installment plans are widespread in Vietnam — through banks, finance companies, and retailer partnerships (e.g., Home Credit, FE Credit). Electronics, furniture, and motorbikes are commonly purchased on installment. Buy-now-pay-later services are growing.

**Debt management:** Financial advisors universally recommend tracking all debts — amounts, interest rates, payment schedules. ViNha's Installment domain implements this advice for structured debt.

**Consumer finance products:** Many apps treat debt as a negative account balance rather than a structured plan. ViNha's approach — tracking the plan separately from Account balances — is more useful for households managing multiple installment obligations.

**Validation:** This domain is strongly validated by Vietnamese consumer behavior. Installment tracking is a genuine need, not a theoretical feature.

---

## 10. Simplicity

Installments are inherently simple: total owed, split into N payments, track progress. Complexity comes from interest-bearing vs. interest-free plans and from variable-rate products.

**What could be removed?**
- Variable interest rate tracking — if rates change, the household updates the plan. The system does not track market rates.
- Late payment tracking — out of scope for MVP. The system tracks payment progress but does not flag missed payments.

**Resist the temptation to add:**
- Payment due date reminders — this is a notification feature, not a domain change.
- "Pay off early" calculation — if the household pays extra, they mark additional installments as paid and the system recalculates (BR-11 still governs completion).
- Debt consolidation suggestions — out of scope.

---

## 11. Evolution Potential

Installments can evolve:

- **Due date tracking:** Adding expected payment dates to each installment would enable proactive reminders — but this is a UX enhancement.
- **Interest breakdown:** Showing principal vs. interest components for reducing-balance loans — but this adds complexity.
- **Early payoff calculation:** "If you pay an extra X per month, you will finish Y months early" — but this is a Health/Insight feature.
- **Debt-to-income ratio in Health:** The Health domain could incorporate total installment obligations into its score — but this belongs to Health.

The domain is stable. Structured debt repayment is a well-understood financial concept that will not change fundamentally.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Storing installment plans without a clear end condition — BR-11 must be enforced.
- Allowing installment plans to exist without linking to payment Transactions — the plan and the payments must be connected.
- Treating installment completion as a silent event — BR-11 implies an Inbox notification, not a quiet status change.

**UX Mistakes:**
- Displaying installments in a way that makes the household feel overwhelmed by debt — the tone should be factual and empowering, not alarming.
- Burying installment information in a sub-menu — debt visibility requires prominence.
- Not clearly distinguishing between "this month's payment" and "total remaining obligation."

**Business Mistakes:**
- Positioning installments as "bad" — the system should be neutral. Installments are a financial tool; the household decides whether using them is wise.
- Failing to handle installment completion gracefully — when the last payment is made, the household should feel a sense of accomplishment.
- Mixing installment obligations with voluntary savings Jars — obligations and intentions must be visually and conceptually separate.

---

## 13. Success Criteria

From the user's perspective, Installments are successful when:

1. **A partner can answer "what do we owe in total across all installments?" in under 10 seconds.**
2. **No installment completes without the household knowing** — BR-11 ensures Inbox visibility.
3. **The countdown nature of installments is motivating, not stressful** — "only 3 payments left" should feel like progress.
4. **Installment payments are naturally linked to Transactions** — the household does not double-enter data.
5. **The total outstanding debt is always visible** — not hidden behind clicks.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker records installment payments as transactions but does not track the underlying obligation. ViNha tracks both — the individual transactions AND the structured plan. This is the operating system approach: the system understands the structure, not just the events.

Installments embody **Truth before intention.** An installment is a real obligation — a fact. It must be accounted for before the household can plan discretionary spending.

Installments embody **Calm finance UI.** Debt tracking should not induce panic. The design should be factual and measured: "here is what you owe, here is your progress, here is when it ends."

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | Clear purpose: track structured debt with a defined end |
| Financial Correctness | 9 | Accurately models installment plans as distinct from revolving debt or recurring expenses |
| User Value | 8 | High for households with active installments; irrelevant otherwise — and that is acceptable |
| Longevity | 9 | Structured debt repayment is a permanent financial concept |
| Extensibility | 7 | Can add due dates, interest breakdowns; fundamentally stable |
| Simplicity | 9 | Count payments until done — conceptually minimal |
| Future Evolution | 7 | Stable; evolution is around notification intelligence |

**Overall: 8.3 / 10** — A focused, correct domain that serves a specific and common need in Vietnamese household finance.
