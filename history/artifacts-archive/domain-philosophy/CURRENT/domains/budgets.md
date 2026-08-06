# Domain: Budgets (Jars)

**Bounded Context:** Intention Plan
**Surface:** Plan
**Financial Principle:** Planning, Commitment
**Business Rules:** BR-01, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08

---

## 1. Philosophy

Budgets — manifested as Jars — answer the question: **where is our money meant to go this month?**

A Jar is an intention envelope. It represents a promise the household makes to itself: "this much money is designated for this purpose." Jars are the primary mechanism through which the Intention Plan becomes concrete.

The philosophical purpose of Jars is *allocation.* Real money exists in Accounts — but Accounts do not tell you what the money is *for.* Jars do. When the household allocates 10 million VND to the "Groceries" Jar, they are not moving money — they are making a promise about how that money will be used.

This is the **BR-01** distinction in action: Real ledger ≠ virtual jars. A Jar is not a bank account. Its allocation is not a balance. This is not a technical detail — it is the philosophical core of ViNha.

---

## 2. User Problem

Households with pooled money face a constant tension: "can we afford this?" Without allocation, every spending decision is a negotiation. One partner wants to buy something; the other worries about the rent. Money in the bank looks like one big number, but that number has to cover rent, groceries, utilities, savings, and everything else.

The pain is *unstructured abundance.* Money exists, but its purpose is unclear. The household operates on mental accounting ("I think we have enough for...") rather than explicit allocation.

Jars solve this by giving every dong a job. When money is allocated to Jars, spending decisions become clear: "we have X left in the Dining Out Jar — yes, we can go to dinner, or no, we should wait."

---

## 3. Financial Principle

**Planning and Commitment.** Jars embody the principle that money without purpose is money at risk. By explicitly allocating funds to named purposes, the household transforms a raw balance into a structured plan.

Planning is the act of allocation. Commitment is the act of respecting that allocation. Together, they transform "we have money" into "we have a plan for our money."

---

## 4. Core Responsibilities

1. **Represent intention envelopes.** Each Jar holds a planned allocation, not real money.
2. **Accept allocations from real money.** When income arrives or the household decides, money is allocated to Jars — this is an intention, not a transfer.
3. **Track spending against allocations.** As Transactions tagged to a Jar occur, the Jar's "spent" amount increases and its "remaining" amount decreases (BR-07 governs what happens when remaining hits zero).
4. **Support Jar lifecycle.** Jars have states: Active (targetable), Paused (non-targetable, history preserved), Archived (closed, history preserved). BR-03: only Active Jars are allocation targets.
5. **Enable Movements.** Money can be reallocated between Jars. BR-06: movement magnitudes are positive with explicit direction in UX.
6. **Enforce overspend policy.** BR-07: when spending exceeds allocation, the household's policy (Warn, Block, Allow Negative) determines behavior.

---

## 5. Explicit Non-Responsibilities

1. **Jars are NOT bank accounts.** A Jar does not hold money. It holds a promise. The word "balance" must never describe a Jar's allocation. (BR-01)
2. **Jars do NOT track real money.** The Real Ledger tracks real money. Jars track intentions about that money.
3. **Jars do NOT define Categories.** A Jar ("Groceries") and a Category ("Groceries") may share a name but are distinct. The Category tags Transactions; the Jar holds allocations.
4. **Jars are NOT Goals.** A Goal is a forward-looking target with a deadline. A Jar is a current-month allocation. They may be related (a Goal may be funded through a Jar) but are distinct.
5. **Jars do NOT make decisions.** An unmapped expense does not go to a Jar — it goes to the Inbox. The Inbox is where allocation decisions happen.
6. **Jars do NOT close themselves at month end.** The Month Ritual handles period close. Jars persist across months unless explicitly Archived.

---

## 6. Domain Boundary

**IN:**
- Jar definitions (name, purpose, icon, color)
- Jar states: Active, Paused, Archived
- Jar allocations (amounts designated for each Jar in the current period)
- Jar spending tracking (accumulated Transaction amounts mapped to the Jar)
- Jar remaining calculation (allocation minus spending)
- Jar-to-Jar Movements (reallocations)
- Overspend policy behavior per Jar (Warn, Block, Allow Negative — BR-07)
- Jar templates (default Jar sets for new households during onboarding)

**OUT:**
- Account balances (→ Accounts domain)
- Transaction recording (→ Transactions domain)
- Category definitions (→ Categories domain — Jars may reference Categories for mapping rules)
- Goal tracking (→ Goals domain)
- Month-end closing logic (→ Month Close domain)
- Financial health scoring (→ Health domain)

---

## 7. Business Language

**Official Terms:**
- **Jar:** An intention envelope holding a planned allocation
- **Allocation:** The amount designated to a Jar for the current period
- **Spent:** The accumulated Transaction amounts mapped to a Jar
- **Remaining:** Allocation minus spent
- **Movement:** A reallocation of money between Jars
- **Active Jar:** Currently targetable (BR-03)
- **Paused Jar:** Temporarily non-targetable; history preserved
- **Archived Jar:** Permanently closed; history preserved
- **Overspend:** When spent exceeds allocation (BR-07)

**Aliases:**
- "Envelope" is acceptable as a conceptual metaphor but "Jar" is the product term.
- "Allocation" and "budget amount" are conceptually equivalent; "allocation" is preferred.

**Forbidden Terminology:**
- ❌ "Jar balance" — Jars do not have balances; they have allocations (BR-01)
- ❌ "Jar account" — Jars are not accounts
- ❌ "Transfer between Jars" — use "Movement" (money does not transfer between Jars; allocation is reassigned)
- ❌ "Budget category" — use "Jar"
- ❌ "Available" (when referring to Jar remaining) — "available" implies real money; Jars have "remaining" allocation, not available cash
- ❌ "Envelope balance" — same prohibition as "Jar balance"

**Preferred Terminology:**
- ✅ "Groceries Jar has 5 million VND allocated; 3 million spent; 2 million remaining"
- ✅ "Move 1 million from Entertainment Jar to Groceries Jar"
- ✅ "Active Jar," "Paused Jar," "Archived Jar"

---

## 8. Mental Model

Users should think of Jars as **physical jars on a shelf.** The household gets its income (real money in the bank) and distributes it among the jars. The "Rent" jar gets 15 million. The "Groceries" jar gets 8 million. The "Dining Out" jar gets 3 million.

When a Transaction occurs (money actually spent), the household takes a slip of paper representing that expense and drops it into the appropriate jar. Over the month, the jars fill up with slips. The household can look at any jar and see: we allocated X, we have spent Y, we have Z left to spend.

At the end of the month, the household empties the jars, reviews what happened, and sets up allocations for the next month. The jars themselves are not money — they are containers for *intentions about money.*

This physical metaphor is powerful because it makes BR-01 intuitive: you would never look at a physical jar full of slips and say "we have 5 million in this jar." The money is in the bank, not in the jar.

---

## 9. Real-World Validation

**Envelope budgeting:** The Jar concept is directly inspired by envelope budgeting — a method where households put cash into physical envelopes labeled with spending categories. ViNha modernizes this: the envelopes are digital (Jars), the cash stays in the bank (Accounts), and the system tracks allocation-vs-spending.

**Zero-based budgeting:** "Give every dollar a job" is the zero-based budgeting philosophy. Jars implement this: every unit of income should be allocated to a Jar, even if that Jar is "Buffer" or "Unallocated."

**YNAB methodology:** The "give every dollar a job" philosophy is well-established in personal finance. ViNha's Jars are a household-oriented implementation of this idea.

**Validation:** The Jar concept is validated by decades of envelope and zero-based budgeting practice. The innovation is applying it to *household* (multi-person) finance with clear Real-vs-Intention separation.

---

## 10. Simplicity

Jars are conceptually simple but operationally nuanced. The core concept (allocation envelope) is simple; the edges (overspend policy, movements, lifecycle states) add necessary complexity.

**What could be removed?**
- Nothing essential. The Jar lifecycle (Active, Paused, Archived) is the minimum for real-world use. Overspend policy is necessary because households will overspend. Movements are necessary because plans change.

**What could be simplified?**
- The number of jars. Onboarding should encourage ≤3 essential Jars (BR: "≤3 essentials"), not a comprehensive taxonomy. More Jars can be added over time.
- Overspend policy could default to Warn for all households and not be configurable in MVP — but long-term, households need the choice.

**Resist the temptation to add:**
- "Rollover" rules (unspent allocation automatically carries to next month) — this should be a manual decision during Month Ritual, not an automatic behavior.
- Jar "goals" or "targets" — those belong to the Goals domain.
- Sub-jars or jar hierarchies — a flat list is sufficient.

---

## 11. Evolution Potential

Jars can evolve meaningfully:

- **Jar templates:** The community or system could suggest Jar setups based on household profile (couple with children, single-income household, etc.) — this is an onboarding enhancement.
- **Jar notes:** Households might want to attach notes to Jars ("saving for a new refrigerator") — but this is cosmetic.
- **Jar-based reports:** Health could generate Jar-specific insights ("your Dining Out Jar was over-allocated for 3 consecutive months — consider reducing the allocation") — but this belongs to Health, not Jars.
- **Seasonal Jars:** Jars that auto-activate in certain months ("Holiday Gifts Jar activates in November") — this is a Planning concern.

The domain is stable because "allocating money to purposes" is a permanent household finance behavior. Evolution focuses on making allocation smarter and more automated — not changing what a Jar fundamentally is.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Storing Jar allocations as if they were account balances. Jars are allocations; accounts are balances. The data model must reflect this distinction.
- Allowing Jars to reference non-existent Accounts or Categories.
- Implementing Movements as "debit Jar A, credit Jar B" — this is an accounting pattern, not an intention allocation pattern. Movements are reassignments of allocation, not transfers of money.
- Failing to enforce BR-03 (allocations only to Active Jars).

**UX Mistakes:**
- Displaying Jar "remaining" as "Available" — this implies real money availability, which is misleading.
- Showing Account balances and Jar allocations on the same screen without clear visual distinction — the user must never confuse the two.
- Making Jar creation feel mandatory or burdensome during onboarding. Start with essentials; let the household add more naturally.
- Not clearly indicating Jar state (Active vs. Paused vs. Archived) in the Plan surface.

**Business Mistakes:**
- Calling Jars "budgets" without the household understanding they are intention envelopes, not spending trackers.
- Allowing overspend without any policy (BR-07) — households need guardrails.
- Creating too many default Jars during onboarding, overwhelming new households.

---

## 13. Success Criteria

From the user's perspective, Jars are successful when:

1. **A partner can answer "how much do we have left for X?" in under 5 seconds** — by checking the relevant Jar's remaining.
2. **The household never confuses a Jar's remaining allocation with an Account's balance** — the distinction is visually and linguistically obvious.
3. **Spending decisions become easier** — "can we eat out tonight?" is answered by checking the Dining Out Jar, not by mental math.
4. **Month Ritual feels meaningful because Jars show the story of the month** — allocations vs. actuals tell a truth the household can learn from.
5. **Overspend is noticed, not hidden** — BR-07 ensures households are aware when they exceed allocations.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker says "you spent X on dining." ViNha says "you allocated X for dining; you spent Y; you have Z remaining. Want to adjust?"

Jars embody **Truth before intention** — but they ARE the intention layer. They depend on Account truth to function. A Jar allocation without real money behind it is a fantasy.

Jars embody **Partners first.** Both partners see the same Jars, the same allocations, the same remaining amounts. There is no "my Jar" vs. "your Jar" — all Jars are household Jars.

Jars embody **Calm finance UI.** Jars should feel like a calm, organized shelf — not a dashboard of red alerts.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | The Jar concept is clear; the distinction from Accounts needs constant reinforcement |
| Financial Correctness | 9 | Aligns with envelope/zero-based budgeting; BR-01 is the critical safeguard |
| User Value | 10 | Jars are the primary value proposition — "where is money meant to go?" |
| Longevity | 9 | Allocation-based budgeting is a durable concept |
| Extensibility | 8 | Templates, seasonal Jars, insights — extensions are possible without domain change |
| Simplicity | 7 | Core concept is simple; lifecycle states and overspend policy add necessary complexity |
| Future Evolution | 8 | Stable domain; evolution is around intelligence (suggestions) and integration (auto-mapping) |

**Overall: 8.6 / 10** — The heart of the Intention Plan. Strong, clear, and critical — but requires discipline to maintain the Real-vs-Intention boundary.
