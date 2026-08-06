# Domain: Savings

**Bounded Context:** Real Ledger
**Surface:** Money
**Financial Principle:** Wealth Building
**Business Rules:** BR-10

---

## 1. Philosophy

Savings answer the question: **what real financial products do we hold that earn a return over time?**

A Savings product is a real financial instrument — a fixed deposit, a savings certificate, a high-yield account with a term. It is NOT a Jar labeled "savings." It is NOT a Goal to "save for a vacation." It is a contractual relationship with a financial institution: the household deposits money for a defined term at a defined interest rate, and at maturity, the money plus interest is available.

The philosophical purpose of Savings is *wealth building.* While Accounts represent ownership and Transactions represent cash flow, Savings represent the intentional growth of money through time. This is the domain where money works for the household, not just sits waiting to be spent.

Savings products belong to the Real Ledger. They are real assets with real terms, real interest, and real maturity dates. They are not intentions — they are facts.

---

## 2. User Problem

Households in Vietnam commonly use savings products — term deposits at banks, savings certificates — as a primary wealth-building tool. But tracking these products across multiple banks is difficult. When does each one mature? What is the interest rate? Should we renew or withdraw?

The pain is *fragmented wealth tracking.* The household has money "in savings" across institutions but no unified view of what they hold, when it matures, and what decisions are pending.

Savings solve this by bringing all savings products into the Real Ledger view. The household can see every product, its term, its rate, its maturity date, and — when maturity arrives — receive an Inbox-guided decision flow (BR-10).

---

## 3. Financial Principle

**Wealth Building.** Savings products are the most common wealth-building tool for Vietnamese households. Unlike speculative investments, savings products offer guaranteed returns and capital preservation. They represent the household's commitment to growing wealth through disciplined, low-risk instruments.

Wealth building is distinct from saving (setting aside money in a Jar). Saving is intention; wealth building is action. A Jar labeled "Emergency Fund" is a plan. A 6-month fixed deposit earning 5% interest is a wealth-building action.

---

## 4. Core Responsibilities

1. **Represent real savings products.** Each Savings entry maps to a real financial product with a financial institution.
2. **Track product terms.** Principal amount, interest rate, start date, maturity date, term length.
3. **Calculate expected maturity value.** Principal + accrued interest at maturity.
4. **Surface maturity events.** When a Savings product reaches its maturity date, create an Inbox ReviewItem for the household to decide: renew, switch products, or withdraw (BR-10).
5. **Distinguish Savings products from savings-type Accounts.** A savings Account is a container for money. A Savings product is a contractual instrument. They are related (a Savings product may be held in a savings Account) but distinct.
6. **Support product lifecycle.** Active (earning interest), Matured (decision pending), Renewed (new term), Withdrawn (closed).

---

## 5. Explicit Non-Responsibilities**

1. **Savings products are NOT Jars.** A Savings product is real money in a financial instrument. A Jar is an intention envelope. A "Savings Jar" is a plan; a Savings product is an asset. (BR-01)
2. **Savings products are NOT Goals.** A Goal is an aspirational target ("save X by Y"). A Savings product is a real financial instrument. A Goal may be fulfilled by a Savings product, but they are distinct.
3. **Savings products do NOT make maturity decisions.** The system surfaces the decision to the Inbox (BR-10); it does not auto-renew, auto-withdraw, or auto-switch.
4. **Savings products do NOT track investment performance.** Stocks, bonds, mutual funds, crypto — these are investments, not savings. They may enter ViNha's scope later (F-Wealth), but they are not Savings.
5. **Savings products do NOT replace emergency fund Jars.** An emergency fund is a planning concept (how much should we keep liquid?). A Savings product is a real asset (what have we actually locked away?). They complement; they do not substitute.

---

## 6. Domain Boundary

**IN:**
- Fixed-term deposits
- Savings certificates
- High-yield savings products with defined terms
- Product metadata: institution, principal, interest rate, term, start date, maturity date
- Maturity value calculation (principal + interest)
- Product lifecycle states: Active, Matured, Renewed, Withdrawn
- Maturity-triggered Inbox items (BR-10)

**OUT:**
- Demand deposit / regular savings accounts (→ Accounts domain — these are liquid containers, not term products)
- Investment products (stocks, bonds, funds — out of scope for MVP)
- Savings Jars / intention envelopes (→ Budgets domain)
- Savings Goals / aspirational targets (→ Goals domain)
- Automatic renewal logic (→ Inbox domain — the decision is manual, surfaced in the Inbox)
- Interest rate comparison or product recommendations (→ future AI-Assist feature)

---

## 7. Business Language

**Official Terms:**
- **Savings (Product):** A real financial instrument with a fixed term and interest rate — not to be confused with a Savings Jar
- **Principal:** The initial amount deposited
- **Term:** The duration of the savings product (e.g., 6 months, 12 months)
- **Interest Rate:** The annual percentage yield
- **Maturity Date:** The date the term ends and the product must be acted upon
- **Maturity Value:** Principal + accrued interest at maturity
- **Renew:** Roll the principal (and possibly interest) into a new term
- **Switch:** Move funds to a different savings product
- **Withdraw:** Take the funds out of the savings product entirely

**Aliases:**
- "Fixed Deposit" or "Term Deposit" are acceptable technical terms.
- "Savings Certificate" is acceptable for specific product types.

**Forbidden Terminology:**
- ❌ "Savings account" (when referring to a term product) — use "Savings product" or the specific type
- ❌ "Savings balance" (when referring to a Jar) — Jars have allocations, not balances
- ❌ "Savings Goal" (when referring to a Savings product) — Goals are intentions; Savings products are assets
- ❌ "Maturity balance" — use "Maturity value"

**Preferred Terminology:**
- ✅ "6-month fixed deposit at Vietcombank: 100 million VND at 5.2%, matures December 2026"
- ✅ "This savings product matures next week — decide: renew, switch, or withdraw?"

---

## 8. Mental Model

Users should think of Savings products as **locked boxes with timers.** The household puts money in a box, sets the timer for 6 months, and the box cannot be opened until the timer goes off. While the box is locked, the money inside grows (interest). When the timer rings (maturity), the household decides: put the money back in with a new timer (renew), move it to a different box (switch), or take the money out (withdraw).

This is distinct from a Jar, which is an open envelope the household can look at and adjust at any time. It is also distinct from a Goal, which is a drawing of a thermometer on the wall — aspirational but not binding.

The locked-box metaphor helps households understand that Savings products are *real commitments* — the money is genuinely less liquid than money in a checking Account or allocation in a Jar.

---

## 9. Real-World Validation

**Vietnamese banking practices:** Term deposits are extremely common in Vietnam, often used as the primary savings vehicle for households. Banks offer various terms (1 month to 36 months) with competitive interest rates. This domain reflects actual Vietnamese household financial behavior.

**Wealth management:** In personal finance, "savings" and "investments" are on a spectrum of risk and liquidity. Savings products occupy the low-risk, fixed-return end of that spectrum. ViNha's Savings domain correctly positions these as real assets with known returns.

**Consumer finance products:** Many apps treat "savings" as a budget category rather than a distinct asset class. ViNha's separation of Savings (real products) from savings Jars (intentions) is more financially accurate.

**Validation:** This domain is firmly grounded in Vietnamese household finance reality. The fixed deposit is a fact of financial life for millions of households.

---

## 10. Simplicity

Savings products are inherently simple: principal, rate, term, maturity. The complexity comes from tracking multiple products across institutions and managing maturity decisions.

**What could be removed?**
- Nothing essential. The four attributes (principal, rate, term, maturity) are the minimum to describe a savings product.

**What could be simplified?**
- Interest calculation could be simple (principal × rate × term) rather than compound with varying frequencies — appropriate for household use.

**Resist the temptation to add:**
- Interest rate comparison tools (→ future feature, not MVP).
- "Laddering" strategies or optimization suggestions (→ AI-Assist feature).
- Partial withdrawals before maturity — most term deposits do not allow this, and modeling penalties adds complexity.
- Savings product "portfolios" — a list is sufficient.

---

## 11. Evolution Potential

Savings can evolve meaningfully:

- **Interest rate tracking:** As interest rates change, the system could notify the household when better rates are available — but this is an AI-Assist feature.
- **Ladder visualization:** Showing how savings products mature at staggered intervals ("laddering") could be a visual enhancement, not a domain change.
- **Tax consideration:** In jurisdictions where savings interest is taxable, tax estimates could be shown — but this is a future feature.
- **Product recommendations:** AI could suggest savings products based on the household's goals and cash flow — but this is future AI-Assist scope.

The domain is stable. Term deposits are a centuries-old financial instrument and will not change fundamentally.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Conflating Savings products with savings-type Accounts. A savings Account is a container; a Savings product is an instrument held within that container.
- Mixing Savings products with savings Jars in the same list or view.
- Auto-renewing Savings products without household confirmation — violates BR-10 (maturity actions are Inbox-guided flows).

**UX Mistakes:**
- Displaying Savings products in the same list as checking Accounts without clear differentiation — they have different liquidity characteristics.
- Not making maturity dates prominent — the key question is "when does this mature?"
- Hiding maturity decisions in a settings menu — they should be prominent Inbox items.

**Business Mistakes:**
- Calling savings Jars "Savings" without qualification, creating confusion with Savings products.
- Assuming all households use term deposits — some households may use this domain lightly or not at all, and that is fine.
- Treating Savings products as "set and forget" — maturity decisions are real financial events that deserve attention.

---

## 13. Success Criteria

From the user's perspective, Savings are successful when:

1. **A partner can answer "what savings products do we have and when do they mature?" in under 10 seconds.**
2. **No savings product matures without the household being aware** — BR-10 ensures Inbox visibility.
3. **The distinction between Savings products and savings Jars is clear** — no household member confuses a fixed deposit with a Jar allocation.
4. **Maturity decisions feel guided, not overwhelming** — the Inbox presents options clearly: renew, switch, withdraw.
5. **Interest earnings are visible and satisfying** — the household can see that their money is growing.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker does not handle savings products — it only tracks spending. ViNha treats Savings as a first-class Real Ledger domain because households need to know what they own, not just what they spend.

Savings embody **Truth before intention.** A Savings product is a real asset — a fact. It contributes to the household's true financial picture. The Intention Plan does not create Savings products; it may use them to fulfill Goals.

Savings embody **Progressive depth.** A household may start with no Savings products and add them as their financial sophistication grows. The domain is available but not mandatory.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | Clear distinction between Savings products, savings Accounts, and savings Jars — but needs constant reinforcement |
| Financial Correctness | 9 | Accurately models term deposits as real financial instruments |
| User Value | 7 | High for Vietnamese households using term deposits; lower for households that do not |
| Longevity | 9 | Term deposits are a permanent fixture of Vietnamese household finance |
| Extensibility | 7 | Can accommodate new product types; fundamentally stable |
| Simplicity | 9 | Four attributes (principal, rate, term, maturity) — minimal and correct |
| Future Evolution | 7 | Stable; evolution is around intelligence (recommendations, rate tracking) |

**Overall: 8.1 / 10** — A culturally-relevant, financially-correct domain. Its value depends on household behavior, but its design is sound.
