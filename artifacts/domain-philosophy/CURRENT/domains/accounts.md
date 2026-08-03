# Domain: Accounts

**Bounded Context:** Real Ledger
**Surface:** Money
**Financial Principle:** Ownership
**Business Rules:** BR-01, BR-12

---

## 1. Philosophy

Accounts answer the most fundamental financial question: **what money do we really have, and where is it?**

An Account is a container of real wealth. It represents a relationship with a financial institution — a bank, an e-wallet provider, a cash drawer. Accounts are not abstractions. They are the digital reflection of real financial containers that exist in the world.

The philosophical purpose of Accounts is *grounding.* Before a household can plan, before it can set goals, before it can assess health — it must know what it owns and where that ownership resides. An Account is the answer to "where is our money right now?"

---

## 2. User Problem

Households typically have money scattered across multiple places: a joint checking account, individual savings accounts, cash on hand, e-wallet balances, maybe a fixed deposit. Without a unified view, the household cannot answer the simplest question: "how much money do we actually have?"

The pain is fragmentation. One partner checks the bank app. The other checks the e-wallet. Cash sits unaccounted for. The household operates on *feeling* ("I think we have about...") rather than *knowing.*

Accounts solve this by aggregating all real money containers into a single, truthful view. The household sees everything in one place — not an estimate, not a guess, but a factual record.

---

## 3. Financial Principle

**Ownership.** Every unit of real money must have an identifiable home. You cannot plan money whose location you cannot name. Before you ask "where should money go?" you must answer "where is money now?"

Ownership is the most basic financial truth. It precedes planning, budgeting, saving, and spending. Without ownership, there is no foundation.

---

## 4. Core Responsibilities

1. **Represent real money containers.** Every Account maps to a real financial instrument: a bank account, an e-wallet, physical cash, a savings product.
2. **Maintain truthful balances.** The balance of an Account reflects actual funds — not planned funds, not allocated funds, not "available after bills."
3. **Distinguish account types.** Checking, savings, cash, e-wallet — different account types have different liquidity characteristics.
4. **Provide the ground truth for all other domains.** Transactions flow through Accounts. Health reads Account balances. Jars are funded from Account money.
5. **Support reconciliation.** Account balances should be reconcilable against bank statements — they are facts, not estimates.

---

## 5. Explicit Non-Responsibilities

1. **Accounts do NOT plan.** An Account does not know what the money is "for" — that is the job of Jars.
2. **Accounts do NOT categorize.** An Account does not describe spending patterns — that is the job of Categories.
3. **Accounts do NOT set goals.** An Account is not a target — that is the job of Goals.
4. **Accounts do NOT make decisions.** An Account does not surface unmapped expenses — that is the job of the Inbox.
5. **Accounts are NOT Jars.** This is the cardinal rule (BR-01). Never present an Account as having "budgeted" amounts or "planned" allocations. An Account holds money. A Jar holds intentions.
6. **Accounts do NOT track credit.** Credit cards are payment instruments with their own domain (Cards) — they are not Accounts, even if they appear alongside accounts in a bank portal.

---

## 6. Domain Boundary

**IN:**
- Checking accounts
- Savings accounts (real bank savings, not Jar-based savings goals)
- Cash on hand
- E-wallet balances
- Account balance history
- Account types and their liquidity characteristics
- Account-level metadata (institution name, account number mask, currency)

**OUT:**
- Credit cards (→ Cards domain)
- Jars / intention envelopes (→ Budgets domain)
- Transaction records (→ Transactions domain — but accounts are the containers transactions flow through)
- Savings products with maturity terms (→ Savings domain — though they may be linked to a savings-type Account)
- Any concept of "available to spend" that subtracts planned allocations (→ Intention Plan, not Accounts)

---

## 7. Business Language

**Official Terms:**
- **Account:** A real money container at a financial institution
- **Balance:** The amount of real money currently held in the Account
- **Account Type:** The category of Account (checking, savings, cash, e-wallet)

**Aliases:**
- None. "Account" is precise and should not be aliased.

**Forbidden Terminology:**
- ❌ "Budget account" — Accounts are not budgets
- ❌ "Virtual account" — Jars are not virtual accounts
- ❌ "Available balance" (when derived by subtracting planned allocations) — balances are factual, not adjusted for plans
- ❌ "Spending account" — all accounts can receive and send money; this term adds no precision

**Preferred Terminology:**
- ✅ "Checking account," "Savings account," "Cash," "E-wallet"
- ✅ "Account balance" — never just "balance" when ambiguity with Jar allocations is possible

---

## 8. Mental Model

Users should think of Accounts as **physical containers.** Imagine a drawer labeled "Joint Checking" that holds cash. Another drawer labeled "My Savings." A wallet for e-money. A box for physical cash.

When money enters (income), it goes into one of these containers. When money leaves (expense), it comes out of one of these containers. The containers do not care *why* the money is there or *what* it is for. They simply hold it.

The household's total real money is the sum of all containers. That sum is the truth. Everything else — Jars, Goals, Plans — is an interpretation of that truth.

---

## 9. Real-World Validation

**Household finance practices:** Households naturally think in terms of "where is the money?" — the checking account, the savings account, cash in the drawer. This domain maps directly to that mental model.

**Banking:** Every financial institution provides account balances. ViNha's Accounts domain mirrors this — it is an aggregator of account-level truth.

**Consumer finance products:** Most personal finance apps lump accounts and budgets together, creating the very confusion ViNha avoids. By keeping Accounts as pure containers of real money, ViNha reflects the banking reality more faithfully than apps that blur the line.

**Validation:** This domain is grounded in reality. Every person with a bank account understands the concept. The only risk is feature creep — the temptation to make Accounts "smarter" by adding planning features.

---

## 10. Simplicity

Accounts are already simple — and they should stay that way. The domain has one job: tell the truth about what money exists and where.

**What could be removed?**
- Nothing. The domain is minimal by design. Any further simplification would remove the ability to distinguish account types, which is necessary for liquidity understanding.

**Resist the temptation to add:**
- "Net worth" calculations (→ Health domain)
- "Available after bills" projections (→ Planning domain)
- Account-level spending analytics (→ Transactions + Categories)

---

## 11. Evolution Potential

Accounts can evolve gracefully over 3-5 years:

- **New account types:** As digital payment methods proliferate, new account types may emerge (crypto wallets, buy-now-pay-later accounts). The Account type taxonomy should accommodate these without structural change.
- **Multi-currency:** If households eventually need multi-currency support, Accounts can carry a currency attribute without changing their fundamental nature.
- **Institution integration:** If bank feeds become available, Accounts can sync balances automatically while remaining philosophically unchanged — facts from the bank, not estimates.
- **Joint vs. individual visibility:** The Together domain may introduce account-level visibility rules (some accounts visible to one partner only), but this is a Tenancy concern, not an Accounts concern.

The domain is stable because it maps to an unchanging reality: money lives somewhere.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Storing "adjusted balances" (balance minus planned allocations) as if they were real. Balances are facts; adjustments are interpretations.
- Mixing credit cards into the Accounts domain. Cards are payment instruments, not money containers.
- Allowing negative balances without clear semantics (overdraft vs. data error).
- Creating "virtual accounts" for planning purposes — use Jars.

**UX Mistakes:**
- Displaying Jar allocations next to Account balances in a way that implies the allocations are "reserved" from the Account.
- Labeling Account balances as "Available" when the system has mentally subtracted planned allocations.
- Showing too many account details (full account numbers, institution logos) that add visual noise without aiding decisions.

**Business Mistakes:**
- Treating savings accounts and savings Jars as the same thing.
- Allowing transactions to reference non-existent accounts.
- Failing to distinguish between "Account balance" (real money) and "Jar allocation" (intention) in all user-facing language.

---

## 13. Success Criteria

From the user's perspective, Accounts are successful when:

1. **A partner can answer "how much money do we have?" in under 5 seconds** — by looking at the total across all Accounts.
2. **A partner never confuses an Account balance with a Jar allocation** — the distinction is visually and linguistically clear.
3. **Account balances match bank statements** — reconciliation is straightforward because Accounts reflect reality.
4. **Adding a new Account feels natural** — "oh, we opened a new savings account, let's add it" — and the household's total immediately updates.
5. **Account types communicate liquidity** — the household can see at a glance what is immediately spendable vs. what is in term products.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker starts with transactions. ViNha starts with Accounts — because you cannot track expenses if you do not know where the money lives.

Accounts embody the product principle of **Truth before intention.** Before the household can plan where money should go, it must know where money is. Accounts are the source of that truth.

Accounts also embody **Calm finance UI.** There is nothing flashy about a list of accounts. It is calm, factual, grounding. This is intentional.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 10 | The purpose is crystal-clear: own the truth about where money lives |
| Financial Correctness | 10 | Perfectly maps to real banking concepts — no abstraction leaks |
| User Value | 9 | Every household needs this; slight deduction because value depends on accurate data entry |
| Longevity | 10 | Accounts as containers of wealth is a concept that will never change |
| Extensibility | 8 | New account types can be added; multi-currency is feasible; but fundamentally stable |
| Simplicity | 10 | One job, done well — no feature creep temptation if boundaries are enforced |
| Future Evolution | 8 | Stable domain; evolution comes from integration (bank feeds) rather than conceptual change |

**Overall: 9.3 / 10** — The strongest domain in the system. Foundational, clear, and correct.
