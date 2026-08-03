# Glossary — Ubiquitous Language

This glossary defines every domain term used across ViNha. It is the canonical vocabulary. No term should appear in the product, documentation, or code that contradicts these definitions.

---

## A

### Account
A container that holds real money at a financial institution. Checking accounts, savings accounts, cash wallets, e-wallet balances. Accounts belong to the Real Ledger. They represent *ownership* — what money the household actually has. **Never:** call a Jar an "account."

**Domain:** Accounts | **Context:** Real Ledger

### Admin
A household member with elevated permissions. Admins can change household policies, adjust income allocation rules, and modify material assumptions. Partners are equal on daily money; Admins manage the framework. **BR-13:** material assumption/policy changes are partner-visible.

**Domain:** Together | **Context:** Tenancy

### Allocation
The act of assigning real money to a Jar. Allocation is an intention, not a transfer. Money does not "move" between Jars in a banking sense; it is reassigned within the plan. **BR-03:** allocations target only Active Jars.

**Domain:** Budgets | **Context:** Intention Plan

### Archive (Jar State)
A Jar whose purpose has been fulfilled and is no longer active. Archived Jars are non-targetable. They preserve historical allocation data but accept no new allocations. Distinct from Paused.

**Domain:** Budgets | **Context:** Intention Plan

### Assisted (Month Ritual Mode)
A Month Ritual mode where the system guides the household through each step with explanations and confirmations. **BR-09:** defaults to Assisted for new households. Contrast with Manual.

**Domain:** Month Close | **Context:** Intention Plan

### Auto (Income Placement Mode)
An income placement mode where incoming money is automatically allocated to Jars according to configured rules. No human confirmation is needed. Contrast with Suggest and Off.

**Domain:** Planning | **Context:** Intention Plan

---

## B

### Balance
The amount of real money in an Account at a point in time. A balance is a fact — it comes from the bank, not from the plan. **Never:** call a Jar's allocated amount a "balance."

**Domain:** Accounts | **Context:** Real Ledger

### Billing Cycle
The period between credit card statement dates. Determines when spending is reported and when payment is due.

**Domain:** Cards | **Context:** Real Ledger

---

## C

### Card
A payment instrument issued by a financial institution. Credit cards, debit cards. Cards provide *liquidity* — the ability to spend before cash is settled. Cards belong to the Real Ledger.

**Domain:** Cards | **Context:** Real Ledger

### Category
A classification tag applied to transactions. Categories describe *what money was spent on* or *what money was earned from.* Categories are shared metadata — they serve both Real Ledger (categorizing transactions) and Intention Plan (rules for auto-mapping to Jars). Categories are not a standalone domain.

**Domain:** Categories | **Context:** Shared (tags)

### Credit Limit
The maximum amount a credit card issuer allows the household to borrow. Part of liquidity management.

**Domain:** Cards | **Context:** Real Ledger

---

## D

### Decision
The fundamental action in the Inbox. Each ReviewItem represents one decision: map this expense to a Jar, renew this savings, switch this product, withdraw this amount. Decisions are binary — resolve or defer.

**Domain:** Inbox | **Context:** Intention Plan

---

## E

### Expense
Money leaving a Real Ledger account. An expense is a transaction fact — it happened. It may or may not have a corresponding Jar allocation.

**Domain:** Transactions | **Context:** Real Ledger

---

## F

### Financial Health
A composite assessment of the household's financial behavior. Expressed as a score, a narrative, and light scenarios. Health is a *mirror* — it reflects but does not change anything. **Principle:** AI may explain/suggest; must not invent balances or execute money movement (BR-14).

**Domain:** Health | **Context:** Insight

---

## G

### Goal
An aspirational target within the Intention Plan. "Save 50 million VND for a vacation by December." Goals represent *commitment* — forward-looking intentions that span multiple months. Goals are distinct from Jars: a Goal may be funded by one or more Jars.

**Domain:** Goals | **Context:** Intention Plan

---

## H

### Health Snapshot
A point-in-time capture of the household's Financial Health score, narrative, and key indicators. Snapshots enable trend comparison across months.

**Domain:** Health | **Context:** Insight

### Household
The fundamental unit of ViNha. A household is the group of people who share finances together — typically a couple or small family. **BR-12:** one active household per user in v2 Now. All accounts, Jars, and decisions belong to the household, not to individuals.

**Domain:** Together | **Context:** Tenancy

---

## I

### Inbox
The decision queue. The Inbox surfaces items that need a human choice: unmapped expenses, maturing savings, completed installments, policy changes. One card, one decision. The goal is Inbox zero — not zero activity, but zero unresolved decisions.

**Domain:** Inbox | **Context:** Intention Plan

### Income
Money entering a Real Ledger account. Income is a transaction fact — it happened. Income placement (allocation to Jars) is an Intention Plan action governed by **BR-04.**

**Domain:** Transactions | **Context:** Real Ledger

### Installment
A structured debt repayment plan. "Pay 5 million VND per month for 12 months." Installments belong to the Real Ledger — they are real financial obligations. **BR-11:** an installment completes when `paid_installments >= num_installments`.

**Domain:** Installments | **Context:** Real Ledger

### Intention
A planned use of money. Intentions are not facts — they are promises the household makes to itself. The Intention Plan is the collection of all active intentions (Jars, Goals, recurring rules).

**Context:** Intention Plan

---

## J

### Jar
An intention envelope. A Jar represents a planned use of money — "groceries," "rent," "vacation fund." Jars are NOT bank accounts. They do not hold money. They hold *promises* about where money should go. **BR-01:** Real ledger ≠ virtual jars. Never label a Jar's allocation as a "Balance."

**Domain:** Budgets | **Context:** Intention Plan

### Jar State
The lifecycle status of a Jar: Active, Paused, or Archived. **BR-03:** allocations target only Active Jars. Paused Jars preserve history but accept no new allocations. Archived Jars are closed.

**Domain:** Budgets | **Context:** Intention Plan

---

## L

### Liability
A real financial obligation — debt that must be repaid. Credit card balances, installment plans, loans. Liabilities belong to the Real Ledger. They reduce the household's true net position.

**Domain:** Accounts (or Installments, Cards) | **Context:** Real Ledger

---

## M

### Manual (Month Ritual Mode)
A Month Ritual mode where the household executes each step without system guidance. Contrast with Assisted. **BR-09:** Assisted is the default for new households.

**Domain:** Month Close | **Context:** Intention Plan

### Maturity
The date on which a savings product reaches its term. At maturity, the household must decide: renew, switch products, or withdraw. **BR-10:** maturity actions appear as Inbox-guided flows.

**Domain:** Savings | **Context:** Real Ledger

### Member
An individual who belongs to a household. Members have roles: Partner (daily money access) or Admin (policy management). **BR-12:** one active household per user.

**Domain:** Together | **Context:** Tenancy

### Month Ritual
The periodic ceremony of closing a financial period. The Month Ritual locks plan movements for the closed month, creates a snapshot, and opens the next period. **BR-08:** approved Month Ritual locks normal plan movements; corrections use an explicit path. **BR-09:** defaults to Assisted mode.

**Domain:** Month Close | **Context:** Intention Plan

### Movement
A change in Jar allocation. Moving 1 million VND from "Entertainment" to "Groceries." Movements are within the Intention Plan — they do not affect Real Ledger balances. **BR-06:** movement magnitudes are positive with explicit direction in UX.

**Domain:** Budgets | **Context:** Intention Plan

---

## N

### Narrative
The human-readable explanation of the household's Financial Health. "Your savings rate is strong, but your discretionary spending increased 15% this month." The narrative translates the Health score into actionable insights.

**Domain:** Health | **Context:** Insight

---

## O

### Off (Income Placement Mode)
An income placement mode where incoming money is NOT automatically allocated. The household must manually place income into Jars. Contrast with Suggest and Auto.

**Domain:** Planning | **Context:** Intention Plan

### Overspend
When actual spending against a Jar exceeds the allocated amount. **BR-07:** overspend policy governs behavior: Warn, Block, or Allow negative. New households default to Warn.

**Domain:** Budgets | **Context:** Intention Plan

---

## P

### Partner
A household member with daily money access. Partners can view accounts, transactions, Jars, and the Inbox. Partners are equal — no hierarchy on daily money decisions. Contrast with Admin.

**Domain:** Together | **Context:** Tenancy

### Paused (Jar State)
A Jar that is temporarily inactive. Paused Jars preserve history and allocations but are non-targetable for new allocations. Contrast with Archived (permanently closed).

**Domain:** Budgets | **Context:** Intention Plan

### Placement
See Allocation. The act of directing income to a Jar. Governed by **BR-04:** percent|fixed plans with Off|Suggest|Auto modes.

**Domain:** Planning | **Context:** Intention Plan

### Policy
A household-level rule that governs behavior. Overspend policy (BR-07), income placement defaults (BR-04), Month Ritual mode (BR-09). Policies are managed by Admins.

**Domain:** Together | **Context:** Tenancy

---

## R

### Real Money
Money that actually exists in bank accounts, cash, or e-wallets. Real money is factual — it comes from financial institutions. The Real Ledger is the system of record for real money.

**Context:** Real Ledger

### Recurring Rule
An automated intention within Planning. "Every month, allocate 30% of income to the Groceries Jar." Recurring rules reduce manual allocation on income placement.

**Domain:** Planning | **Context:** Intention Plan

### ReviewItem
A single decision card in the Inbox. "This 500,000 VND expense is unmapped — which Jar should it go to?" Each ReviewItem demands one decision.

**Domain:** Inbox | **Context:** Intention Plan

---

## S

### Savings (Product)
A real financial instrument that earns interest over a fixed term. Fixed deposits, savings certificates, high-yield accounts. Savings products belong to the Real Ledger — they are real assets with maturity dates and terms. **BR-10:** maturity actions become Inbox-guided flows.

**Domain:** Savings | **Context:** Real Ledger

### Scenario
A lightweight "what if" projection within Health. "If we reduce dining out by 20%, our savings rate would improve to X." Scenarios are educational, not prescriptive. They do not modify actual plans.

**Domain:** Health | **Context:** Insight

### Score (Health)
A numerical representation of the household's financial well-being. The Health Score aggregates multiple indicators into a single, understandable number.

**Domain:** Health | **Context:** Insight

### Suggest (Income Placement Mode)
An income placement mode where the system proposes Jar allocations based on configured rules. The household must confirm before allocation takes effect. Contrast with Off and Auto. **BR-04:** new households default to Suggest.

**Domain:** Planning | **Context:** Intention Plan

---

## T

### Transaction
A single movement of real money. "Paid 200,000 VND at the supermarket." Transactions are *facts* — they happened. They belong to the Real Ledger and are the atoms of financial truth.

**Domain:** Transactions | **Context:** Real Ledger

---

## U

### Utilization
The percentage of a credit card's limit currently in use. "Card has 20 million VND limit, 5 million VND used = 25% utilization." Part of liquidity management.

**Domain:** Cards | **Context:** Real Ledger

---

## Cross-Reference Index

| If you mean... | Use this term | Never use |
|---------------|---------------|-----------|
| Money in a bank | Balance | Jar balance |
| Money planned for groceries | Jar allocation | Groceries balance |
| End-of-month process | Month Ritual | Month close run |
| Decision card | ReviewItem | Inbox item, task |
| Intention envelope | Jar | Envelope, bucket, category |
| Spending classification | Category | Budget category |
| Household member with daily access | Partner | User, member |
| Household member with policy access | Admin | Owner, manager |
| Automated intention | Recurring Rule | Auto-budget |
