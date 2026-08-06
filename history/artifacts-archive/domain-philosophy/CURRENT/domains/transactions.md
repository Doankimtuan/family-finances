# Domain: Transactions

**Bounded Context:** Real Ledger
**Surface:** Money
**Financial Principle:** Cash Flow
**Business Rules:** BR-01, BR-05, BR-15

---

## 1. Philosophy

Transactions answer the question: **what happened to our money?**

A Transaction is a single, atomic event of money movement. Money entered an Account (income), or money left an Account (expense), or money moved between Accounts (transfer). Each Transaction is a *fact.* It happened on a specific date, at a specific amount, involving a specific Account. There is no ambiguity.

The philosophical purpose of Transactions is *recording.* While Accounts answer "what do we have?", Transactions answer "how did we get here?" Every Account balance is the sum of all Transactions affecting that Account. Transactions are the atoms; balances are the molecule.

---

## 2. User Problem

Households lose track of where money goes. A partner looks at a diminished bank balance and thinks "where did it all go?" Without transaction records, the household operates on memory — and memory is unreliable.

The pain is *invisibility.* Small expenses accumulate. Recurring charges go unnoticed. Income arrives and disappears without the household understanding the flow. Financial arguments often start with "I don't know where the money went."

Transactions solve this by creating an auditable, searchable record of every money movement. The household can trace any balance change back to its origin.

---

## 3. Financial Principle

**Cash Flow.** Money is not static. It enters, it leaves, it moves. Understanding cash flow — the velocity, the direction, the patterns — is essential to financial health. A household that knows its income and expenses is a household that can plan.

Cash flow is the pulse. No pulse, no life. No transaction recording, no financial awareness.

---

## 4. Core Responsibilities

1. **Record every money movement as an immutable fact.** A Transaction, once recorded, should not be silently altered. Corrections are new Transactions (reversals).
2. **Link every Transaction to an Account.** Money always flows from or to a specific Account. No orphan Transactions.
3. **Distinguish transaction types.** Income, expense, transfer — different types, different meanings, different implications for planning.
4. **Support categorization.** Every Transaction should carry a Category tag describing *what the money was for* (or *where it came from*).
5. **Enable search and filtering.** Households should be able to answer "how much did we spend on groceries last month?"
6. **Feed the Intention Plan.** Transactions are the raw material for Jar allocation — classified transactions map to Jars; unclassified transactions become Inbox items (BR-05).

---

## 5. Explicit Non-Responsibilities

1. **Transactions do NOT plan.** A Transaction records what happened; it does not predict what will happen.
2. **Transactions are NOT Jar allocations.** A Transaction is a real money movement. A Jar allocation is an intention. They are related (transactions can be mapped to Jars) but distinct.
3. **Transactions do NOT assess health.** Transaction volume alone does not indicate financial health — that is the Health domain's job.
4. **Transactions do NOT manage recurring rules.** Recurring expenses may exist, but the rules that govern them belong to Planning.
5. **Transactions are NOT editable in the traditional sense.** Corrections should be new reversal Transactions, not overwrites. This preserves the audit trail.

---

## 6. Domain Boundary

**IN:**
- Income transactions (money entering an Account)
- Expense transactions (money leaving an Account)
- Transfer transactions (money moving between Accounts)
- Transaction metadata: date, amount, description, counterparty
- Transaction categorization (linking to a Category tag)
- Transaction-to-Jar mapping (linking a Transaction to a Jar — this is the bridge to Intention Plan)

**OUT:**
- Jar allocations (→ Budgets domain — a Transaction may *trigger* an allocation, but the allocation itself is an Intention Plan concern)
- Recurring transaction rules (→ Planning domain)
- Budget vs. actual comparisons (→ Budgets / Health domains)
- Spending trends and analytics (→ Health domain)
- Account balance calculation (→ Accounts domain — though Transactions are the inputs to balance)

---

## 7. Business Language

**Official Terms:**
- **Transaction:** A single, atomic event of real money movement
- **Income:** A Transaction where money enters an Account
- **Expense:** A Transaction where money leaves an Account
- **Transfer:** A Transaction moving money between two Accounts
- **Counterparty:** The other party in the Transaction (merchant, employer, person)

**Aliases:**
- "Entry" is acceptable in technical contexts but "Transaction" is preferred in user-facing language.

**Forbidden Terminology:**
- ❌ "Budget transaction" — Transactions are facts; budgets are plans
- ❌ "Virtual transaction" — Transactions are always real money movements
- ❌ "Pending transaction" (in the sense of "planned but not yet executed") — if money has not moved, it is not a Transaction; it is a planned expense in the Intention Plan

**Preferred Terminology:**
- ✅ "Transaction," "Income," "Expense," "Transfer"
- ✅ "Transaction amount" — never "budget amount" or "planned amount"

---

## 8. Mental Model

Users should think of Transactions as **receipts in a ledger book.** Every time money moves, a line is written: date, amount, what it was for, which account. The ledger book does not judge. It does not plan. It simply records.

At the end of the month, the household can review the ledger and see the complete story of their money. The story may reveal patterns — "we spent a lot on dining out" — but the ledger itself is neutral. It is the raw material for reflection, not the reflection itself.

---

## 9. Real-World Validation

**Household finance practices:** Households that track expenses (in a notebook, spreadsheet, or app) are essentially maintaining a transaction log. This domain formalizes that practice.

**Banking:** Bank statements are lists of transactions. ViNha's Transactions domain mirrors bank statements — it is the household's own statement, enriched with categories and Jar mappings that the bank does not provide.

**Double-entry bookkeeping:** In accounting, every transaction has two sides (debit and credit). ViNha simplifies this for household use — single-entry with Account and Category — but the philosophical root is the same: transactions are the fundamental unit of financial record-keeping.

**Validation:** This domain is grounded in centuries of accounting practice. Transactions as facts is not a product decision — it is a reflection of how money actually works.

---

## 10. Simplicity

Transactions are simple by nature — money moved, here's the record. Complexity creeps in when Transactions try to do more than record.

**What could be removed?**
- Nothing essential. The domain is already minimal: date, amount, type, account, category, description, counterparty.

**Resist the temptation to add:**
- "Split transactions" across multiple categories (keep it simple — one Transaction, one Category; if money went to multiple purposes, record multiple Transactions)
- "Transaction tags" beyond Categories (one classification system is enough)
- "Transaction notes" that become free-form journals (descriptions are sufficient)

---

## 11. Evolution Potential

Transactions can evolve gracefully:

- **Attachment support:** Photos of receipts could be attached to Transactions without changing the domain's nature.
- **Automatic categorization:** Machine learning could suggest Categories based on counterparty and amount patterns — but the Transaction remains a fact regardless of how the Category is assigned.
- **Bank feed integration:** Automatic Transaction import from bank APIs would increase convenience without changing the domain's philosophy.
- **Recurring Transaction detection:** The system could detect patterns ("this looks like a recurring expense") and suggest a Recurring Rule — but the detection is an insight, not a Transaction responsibility.

The domain is stable because "money moved" is an event that will never change its fundamental nature.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Allowing Transactions to be deleted instead of reversed. Deletions break the audit trail.
- Storing Transactions without Account references, creating orphan records.
- Mixing Transaction types (e.g., treating a credit card payment as an expense when it is a transfer from checking to the card).
- Automatically creating Jar allocations for every Transaction without allowing for unmapped expenses (violates BR-05).

**UX Mistakes:**
- Displaying Transactions in a way that hides the Account they belong to.
- Making it difficult to search or filter Transactions — the household should easily answer "what did we spend at the supermarket this month?"
- Showing Transaction amounts without clear income/expense/transfer indicators, causing confusion about money direction.

**Business Mistakes:**
- Calling Jar allocations "transactions" — this conflates real money movement with intention.
- Allowing Transactions to be created without verification that the Account exists.
- Failing to handle transfer Transactions correctly (they affect two Accounts simultaneously).

---

## 13. Success Criteria

From the user's perspective, Transactions are successful when:

1. **A partner can answer "what did we spend on X last month?" in under 30 seconds** — through search and filter.
2. **Every Transaction is clearly income, expense, or transfer** — no ambiguity about money direction.
3. **Transactions reconcile with bank statements** — the household can verify that what ViNha shows matches what the bank shows.
4. **Unmapped Transactions naturally flow to the Inbox** — the household is not forced to categorize at entry time if they do not want to.
5. **The Transaction list feels like a truthful story of the household's money** — not a cluttered, confusing mess.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker IS its transaction list — that is the entire product. ViNha uses Transactions as *input* to a larger system. Transactions feed Jars, Inbox, Health, and Planning. They are essential but not central.

Transactions embody **Truth before intention.** Every Transaction is a fact. The system never guesses what happened — it records what the household tells it happened.

Transactions also embody **Inbox over archaeology.** Rather than forcing the household to categorize every Transaction at entry time, unmapped Transactions become Inbox items. The decision is surfaced, not buried.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 10 | Perfectly clear: Transactions are facts about money movement |
| Financial Correctness | 10 | Mirrors centuries of double-entry bookkeeping concepts |
| User Value | 10 | Without Transactions, the system has no raw material |
| Longevity | 10 | Money movement as a concept is eternal |
| Extensibility | 9 | Attachments, auto-categorization, bank feeds all possible |
| Simplicity | 9 | Domain is simple; complexity risk comes from feature requests (split transactions, etc.) |
| Future Evolution | 9 | Stable; evolution comes from automation around recording, not changing what a Transaction is |

**Overall: 9.6 / 10** — The atomic domain. Everything depends on it. Almost perfect.
