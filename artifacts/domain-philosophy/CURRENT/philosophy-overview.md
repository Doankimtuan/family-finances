# Philosophy Overview — The Big Picture

## One System, Two Truths

ViNha is a **Household Money Operating System**, not an expense tracker. This distinction matters because expense trackers have one truth: *what happened.* ViNha has two:

1. **Real Money** — the factual record of funds that exist in bank accounts, cash, e-wallets, savings products, credit cards, and installment obligations. These are *atoms of financial truth.* A transaction happened; it is not debatable.

2. **Intended Money** — the planned allocation of real money into Jars, Goals, and recurring rules. These are *promises.* They represent what the household intends to do with its money, not what the money actually is.

An expense tracker answers "what did we spend?" ViNha answers "what do we have, where is it meant to go, and what needs a decision?"

---

## The Architecture of Clarity

Every domain in ViNha falls into one of four bounded contexts. Understanding these contexts is understanding ViNha.

### Real Ledger (Money Surface)
**Domains:** Accounts, Transactions, Cards, Savings, Installments

This is the **surface of truth.** It answers the question "what money do we really have?" with no ambiguity. Every entry here is a fact. Accounts hold money. Transactions move money. Cards extend credit. Savings earn interest. Installments repay debt.

The Real Ledger is a **mirror of the banking system.** It does not plan, intend, or hope. It records.

**Core principle:** *Truth before intention.* You cannot plan what you do not know you have.

### Intention Plan (Plan + Inbox Surfaces)
**Domains:** Budgets (Jars), Goals, Planning, Month Ritual, Inbox

This is the **surface of intention.** It answers the question "where is money meant to go?" Jars are intention envelopes — they hold promises, not cash. Goals are aspirational targets. Planning automates recurring intentions. The Month Ritual closes a period and locks intentions. The Inbox surfaces decisions.

The Intention Plan is a **layer on top of reality.** It interprets real money through the lens of household priorities.

**Core principle:** *Plans are not balances.* Confusing the two is the cardinal sin of household finance software.

### Tenancy (Together Surface)
**Domain:** Together

This is the **surface of collaboration.** It answers the question "who is 'we'?" The household is the fundamental unit. Partners share daily money visibility. Admins manage policies. Together defines the boundary of trust.

**Core principle:** *Partners first.* Household finance is collaborative, not individual.

### Insight (Health Surface)
**Domain:** Health

This is the **surface of reflection.** It answers the question "how are we doing?" Health reads from both Real Ledger and Intention Plan but writes to neither. It produces a score, a narrative, and light scenarios. It is the mirror that shows the household its own financial behavior.

**Core principle:** *The mirror does not move money.* Health informs; it does not act.

---

## The Decision Surface: Inbox

The Inbox is philosophically unique. It belongs to the Intention Plan bounded context, but its role is to **bridge** Real Ledger and Intention Plan. When a real transaction cannot be automatically mapped to a Jar, it becomes a ReviewItem in the Inbox. When a savings product matures, it appears in the Inbox as a decision. When an installment completes, the Inbox notifies.

The Inbox is the **gap between what happened and what was intended.** A household with zero Inbox items is a household where every real event has been reconciled with intention. That is the goal — not zero spending, but zero ambiguity.

**Core principle:** *Inbox over archaeology.* Decisions should be surfaced, not buried in transaction histories.

---

## How Domains Relate

```
Real Ledger                    Intention Plan
┌──────────────┐              ┌──────────────┐
│   Accounts   │──hold──────►│     Jars     │
│              │              │              │
│ Transactions │──classify──►│   Planning   │
│              │              │              │
│    Cards     │              │    Goals     │
│              │              │              │
│   Savings    │──mature────►│    Inbox     │◄──unmapped──┐
│              │              │              │             │
│ Installments│──complete───►│ Month Ritual │             │
└──────┬───────┘              └──────┬───────┘             │
       │                             │                     │
       │         ┌───────────┐      │                     │
       └────────►│   Health  │◄─────┘                     │
                 └───────────┘                             │
                       │                                   │
                 ┌─────▼──────┐                            │
                 │  Together  │                            │
                 └────────────┘                            │
                                                           │
              ┌────────────────────────────────────────────┘
              │
        ┌─────▼──────┐
        │ Categories │  (shared tags — serve both sides)
        └────────────┘
```

- **Accounts → Transactions:** Accounts are the containers; transactions are the contents that flow in and out.
- **Transactions → Jars:** Transactions are classified; classification drives jar allocation (or creates Inbox items when unmapped).
- **Transactions → Categories:** Categories are the tags on transactions — what the money was spent ON.
- **Planning → Jars:** Planning defines recurring rules that auto-allocate to Jars.
- **Savings → Inbox:** Maturity events create Inbox decisions.
- **Installments → Inbox:** Completion events create Inbox notifications.
- **Month Ritual → Plan:** The ritual locks plan movements for a closed period.
- **Health → All:** Health reads from every domain to produce its mirror.
- **Together → All:** Together defines who can see and act on every domain.

---

## The Household as the Fundamental Unit

ViNha is not personal finance software. It is **household** finance software. The household — not the individual — is the fundamental unit of analysis. Accounts belong to the household. Jars are shared. The Inbox is shared. The Health score reflects the household, not any one member.

This is why "Together" is a first-class domain, not an afterthought. The question "who is 'we'?" must be answered before any other question can be.

---

## The Month as the Fundamental Rhythm

Household finance operates on a monthly cadence. Salaries arrive monthly. Bills recur monthly. Budgets are planned monthly. The Month Ritual is not a feature — it is the **heartbeat** of the system. Every month, the household closes one period and opens another. Every month, intentions are reviewed against reality. Every month, the Inbox should reach zero.

This is why "Month Ritual" is a first-class domain, not a buried feature. The month is not an arbitrary date range — it is the natural unit of household financial life.

---

## What ViNha Is Not

- **Not an expense tracker.** Expense trackers have one truth. ViNha has two.
- **Not a budgeting app.** Budgeting apps treat budgets as the primary surface. ViNha treats real money as the primary surface.
- **Not a wealth manager.** ViNha does not track investments, portfolios, or net worth.
- **Not a tax tool.** ViNha does not file taxes, calculate deductions, or produce tax reports.
- **Not a crypto tracker.** ViNha deals with fiat household money.
- **Not an AI financial advisor.** AI may explain and suggest; it must not invent balances or execute money movement.

---

## The Invariant

If you remember one thing from this document, remember this:

> **Real money is not virtual jars. Plans are not balances. Partners share everything. The month is the rhythm. The Inbox is the decision queue. Health is the mirror.**
