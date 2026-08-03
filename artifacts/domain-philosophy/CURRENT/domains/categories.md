# Domain: Categories

**Bounded Context:** Shared (classification tags)
**Surface:** None (not a standalone surface)
**Financial Principle:** Classification
**Business Rules:** BR-01, BR-05

---

## 1. Philosophy

Categories answer the question: **what was this money for?**

A Category is a classification tag. It describes the *nature* of a Transaction — "groceries," "rent," "salary," "freelance income." Categories are not containers of money. They are not plans. They are labels that make Transactions understandable.

The philosophical purpose of Categories is *meaning.* A Transaction without a Category is a number without context. "200,000 VND left the account" is a fact. "200,000 VND left the account for groceries" is a fact with meaning. Categories bridge raw data and human understanding.

Critically, Categories are **shared infrastructure.** They serve both the Real Ledger (classifying Transactions) and the Intention Plan (providing rules for mapping Transactions to Jars). But Categories themselves belong to neither — they are metadata that both sides use.

---

## 2. User Problem

Without classification, a list of Transactions is overwhelming. "500,000 VND at VinMart, 200,000 VND at Circle K, 150,000 VND at Bach Hoa Xanh" — are these groceries? Dining? Household supplies? The household cannot see patterns without labels.

The pain is *undifferentiated noise.* Transactions pile up. The household knows money was spent but cannot answer "on what?" This undermines planning (how much should we allocate to groceries?) and health assessment (is our dining-out spending too high?).

Categories solve this by providing a consistent, household-wide vocabulary for describing money movements. "Groceries" means the same thing to both partners.

---

## 3. Financial Principle

**Classification.** Understanding money requires grouping. A single Transaction tells you little. A hundred Transactions grouped by Category tell you a story. Classification is the bridge between raw data and financial insight.

Classification is not a financial principle in the sense of Ownership or Cash Flow — but it is the *cognitive* principle that makes financial principles actionable. You cannot manage what you cannot name.

---

## 4. Core Responsibilities

1. **Provide a consistent classification vocabulary.** Every Category name should mean the same thing to all household members.
2. **Tag Transactions with meaningful labels.** A Transaction with a Category is actionable; without one, it is noise.
3. **Support Jar mapping rules.** Categories are the bridge: "Transactions categorized as 'Groceries' map to the 'Groceries' Jar."
4. **Enable spending analysis.** "How much did we spend on Transportation this month?" requires Categories.
5. **Remain household-scoped.** Categories belong to the household, not to the system. Different households may use different Categories.

---

## 5. Explicit Non-Responsibilities

1. **Categories are NOT Jars.** A Category describes what money was spent on. A Jar describes where money is planned to go. They may share names ("Groceries" Category and "Groceries" Jar) but are philosophically distinct.
2. **Categories are NOT a standalone IA surface.** Categories do not get their own top-level navigation. They are used within Transactions (filtering) and Planning (mapping rules) — never as a primary destination.
3. **Categories do NOT hold money.** Categories are tags, not containers. No balance, no allocation, no budget.
4. **Categories do NOT make decisions.** A Category does not resolve unmapped expenses — the Inbox does.
5. **Categories are NOT hierarchical by default.** Parent-child Category trees add complexity without clear household finance value. Keep categories flat unless a compelling use case emerges.
6. **Categories do NOT define spending limits.** "We should spend no more than X on Category Y" — this is a Jar function, not a Category function.

---

## 6. Domain Boundary

**IN:**
- Category definitions (name, icon, color for visual distinction)
- Category-to-Transaction assignment
- Category-based filtering of Transaction lists
- Category-to-Jar mapping rules (used by Planning domain)

**OUT:**
- Spending limits per Category (→ Budgets/Jars domain)
- Category-level budgets (→ Budgets/Jars domain)
- Category-based financial health scoring (→ Health domain — Health reads categorized Transactions but scoring logic belongs to Health)
- Category management as a standalone feature surface
- Category hierarchies (parent-child) — keep flat unless proven necessary

---

## 7. Business Language

**Official Terms:**
- **Category:** A classification tag applied to Transactions
- **Categorize:** The act of assigning a Category to a Transaction

**Aliases:**
- "Tag" is acceptable as a technical synonym.
- "Label" is acceptable but "Category" is preferred.

**Forbidden Terminology:**
- ❌ "Budget category" — Categories are not budgets
- ❌ "Spending category" with implied limits — Categories describe; they do not constrain
- ❌ "Category balance" — Categories do not have balances
- ❌ "Category group" — avoid implying hierarchy unless explicitly designed

**Preferred Terminology:**
- ✅ "Category"
- ✅ "Categorize a transaction"
- ✅ "Transaction Category"

---

## 8. Mental Model

Users should think of Categories as **labels on receipts.** When you get a receipt from the supermarket, you could mentally file it under "Groceries." When you get a receipt from the gas station, you file it under "Transportation." Categories are those filing labels.

The filing cabinet does not tell you how much you *should* spend on groceries. It just holds the receipts, organized by label. When you want to know how much you *did* spend on groceries, you open the "Groceries" folder and add up the receipts.

This is deliberately simple. Categories are not smart. They are not proactive. They are just labels — and that is their strength.

---

## 9. Real-World Validation

**Household finance practices:** Households naturally categorize spending — "this was for food," "this was for the house." The concept is intuitive.

**Accounting:** The chart of accounts in double-entry bookkeeping is essentially a Category system. ViNha's Categories are a simplified chart of accounts for household use.

**Consumer finance products:** Most apps use Categories heavily — sometimes as the primary organizing principle (Mint-style categorization). ViNha deliberately demotes Categories from primary surface to shared infrastructure. This is a philosophical choice: ViNha is organized around Jars (intentions) and Accounts (reality), not around spending categories.

**Validation:** Categories reflect real-world classification behavior. The risk is elevating them beyond their role — making Categories the center of the experience, as many competitors do.

---

## 10. Simplicity

Categories are already simple — and must stay that way. The biggest risk to Categories is over-engineering.

**What could be removed?**
- Category hierarchies. A flat list of 15-25 Categories covers most household needs. Parent-child trees add cognitive load.
- Category-level configuration beyond name, icon, and color. No "rules" attached to Categories themselves — rules belong to Planning.

**Resist the temptation to add:**
- "Smart Categories" that auto-generate based on Transaction patterns — this is an AI feature (Planning domain), not a Category feature.
- Category budgets — that is what Jars are for.
- Category-based alerts — that is what the Inbox and Health are for.
- Sub-categories — "Food & Dining > Restaurants > Fast Food" is overkill for household finance.

---

## 11. Evolution Potential

Categories can evolve, but evolution should be cautious:

- **Icon and color enhancements:** As the design system grows, Categories may get richer visual treatment — but this is cosmetic, not conceptual.
- **Suggested Categories:** During Transaction entry, the system could suggest a Category based on counterparty history — but the Category system itself does not change.
- **Category merging:** If a household realizes "Dining Out" and "Restaurants" are the same thing, they should be able to merge — but this is data management, not domain evolution.

The domain should NOT evolve into:
- A hierarchical taxonomy (trees of sub-categories)
- A rule engine (Categories do not trigger actions)
- A primary navigation surface

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Making Categories the primary organizing principle of the app (the "Mint mistake").
- Building Category hierarchies that no one will maintain.
- Coupling Categories too tightly to Jars — they serve different purposes and should be independently manageable.
- Allowing Transactions to have multiple Categories (split categorization) without a clear UX for how this interacts with Jar mapping.

**UX Mistakes:**
- Giving Categories prominent top-level navigation — they are filters and tags, not destinations.
- Displaying Category totals in a way that implies they are budgets ("you spent 80% of your Dining category") — this is a Jar function.
- Making Category management feel like a chore. Adding a new Category should be a natural side effect of entering a Transaction, not a separate setup step.

**Business Mistakes:**
- Positioning ViNha as a "category-based budgeting app" — this contradicts the Real Ledger / Intention Plan distinction.
- Adding "system Categories" that the household cannot modify — all Categories should be household-owned.
- Creating Category-dependent features that force the household into a specific classification scheme.

---

## 13. Success Criteria

From the user's perspective, Categories are successful when:

1. **A partner can answer "what did we spend on X?" by filtering Transactions by Category** — and the answer is accurate.
2. **Categories feel natural, not forced** — the household's own vocabulary is reflected, not a system-imposed taxonomy.
3. **Categories quietly enable Jar mapping without drawing attention to themselves** — the household sets up "Groceries Category → Groceries Jar" once and forgets about it.
4. **Adding a new Category takes seconds** — it is a byproduct of entering a Transaction, not a configuration task.
5. **Categories never feel like the "main feature"** — they are infrastructure, and good infrastructure is invisible.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

Expense trackers are organized around Categories. ViNha deliberately is not. Categories are tools that serve the system — they are not the system itself.

Categories embody **Progressive depth.** A new household can start with a handful of Categories. As they use the system, they can add more. The system works with 5 Categories or 50 — it does not depend on a perfect taxonomy.

Categories also embody **Inbox over archaeology.** By linking Categories to Jar mapping rules, the system can automatically route categorized Transactions to the correct Jar. Uncategorized or unmapped Transactions go to the Inbox. Categories reduce Inbox noise.

Importantly, Categories embody the **anti-pattern** that ViNha rejects: the Category-as-destination model. ViNha has no "Categories" tab. Categories are a tool, not a destination.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 8 | Clear as classification tags; some ambiguity about Category-vs-Jar distinction needs reinforcement |
| Financial Correctness | 9 | Classification is a legitimate financial concept; the flat model is appropriate for household use |
| User Value | 7 | Categories are useful but secondary — the system works without perfect categorization (Inbox handles gaps) |
| Longevity | 9 | Classification is a permanent need |
| Extensibility | 6 | Deliberately constrained — Categories should NOT be extended into a rule engine or hierarchy |
| Simplicity | 9 | Flat tags are inherently simple; risk is over-engineering |
| Future Evolution | 7 | Stable but deliberately limited — this is a feature, not a bug |

**Overall: 7.9 / 10** — Solid shared infrastructure. The score reflects its intentionally limited role, not weakness. Categories are correctly modest.
