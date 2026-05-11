# Family Finances: Domain Model & Architecture Analysis

## 1. Executive Summary
The Family Finances application is a multi-tenant (household-based) personal finance management system. It employs a strict separation between **real accounting** (accounts, assets, transactions) and **virtual budgeting/intent** (jars, budgets). Recently, the system underwent a major paradigm shift (v2 Jar Intent Layer) moving away from simple ledger jars to an intent-based "Review Queue" system where real-world financial events (transactions, savings) trigger review items that must be explicitly allocated to Jars. 

## 2. Current Domain Model
The core domain is split into three distinct pillars:

### A. Core Accounting (The Real World)
- **Households & Members:** The root tenant. Users collaborate as partners within a household.
- **Accounts:** Liquid cash, checking, savings. The actual source of truth for money location.
- **Transactions:** A single-source-of-truth ledger for income, expenses, and transfers between accounts.
- **Assets & Liabilities:** Non-liquid holdings (gold, real estate) and debts (mortgages, loans).
- **Categories:** Taxonomy for transactions (income/expense).

### B. Budgeting & Planning (The Forecast)
- **Monthly Budgets:** Traditional fixed monthly limits for specific expense categories.
- **Goals:** Long-term target amounts (e.g., Emergency Fund) with snapshots.

### C. Jars Intent Layer (The Virtual Assignment)
- **Jars:** Virtual envelopes (e.g., necessities, play, education). They do not hold real money, only virtual balances.
- **Jar Month Plans:** Monthly funding strategies (fixed amount or percentage of income) for jars.
- **Jar Rules:** Auto-categorization or default strategies linking transaction categories to jars.
- **Jar Review Queue:** The staging area. Financial events (income, expense, asset buy) create pending items here.
- **Jar Movements:** The immutable ledger of virtual money entering or leaving a jar. 

## 3. Entity Relationship Analysis
- **Household `1:N` Accounts/Assets/Transactions/Jars/Budgets**: Strict multitenancy.
- **Transaction `N:1` Account**: Every transaction hits a real account.
- **Transaction `N:1` Category**: Transactions are typed by category.
- **Transaction `1:1` (optional) Jar Movement**: An expense transaction is typically linked to a Jar Movement to deduct virtual balance from a jar.
- **Savings Account `N:1` Jar**: Savings accounts can be explicitly funded by a specific Jar.
- **Jar Rule `1:1` Category**: A category can be mapped to automatically suggest a Jar in the review queue.

## 4. Current Budgeting Logic
- **Traditional Budgeting (`monthly_budgets`):** Placed at the category level. Users set a `planned_amount` for an expense category per month. This seems to act as a parallel baseline to Jars, primarily for reporting or baseline comparison.
- **Overspending:** Handled passively in traditional budgets (reporting). In the Jars system, a jar's balance drops, but because jars are virtual, it doesn't block real-world transactions.

## 5. Current Jar Logic
- **Intent-Based (v2):** Jars are no longer direct ledger copies of transactions. They are "intents". 
- **Types & Policies:** Jars have types (`essential`, `investment`, `play`) and spend policies (`flexible`, `invest_only`).
- **Balances:** Calculated dynamically via the `jar_current_balances` view by summing `jar_movements`.
- **Holdings Tracking:** The system tracks *where* the virtual money actually lives (`held_in_cash`, `held_in_savings`, `held_in_investments`).

## 6. Current Allocation Logic
1. **Plans:** A jar is given a `jar_month_plans` (e.g., 20% of income, or fixed 5M VND).
2. **Triggers:** When income hits the household, it enters the `jar_review_queue`.
3. **Review & Resolve:** The user reviews the queue. The system suggests allocations based on the `jar_month_plans` and `jar_rules`. The user approves or adjusts them, which creates `jar_movements` (inflows) for the Jars.
4. **Spending:** When an expense occurs, it enters the queue. The user resolves it by selecting which Jar pays for it, creating an outflow `jar_movement`.

## 7. Current Transaction Flow
1. User enters a real **Transaction** (e.g., Expense of 500k at Supermarket, Category: Groceries, Account: Vietcombank).
2. Account balance is updated via transaction aggregation.
3. System (via app logic) generates a **Jar Review Queue** item for this `expense_transaction`.
4. User goes to `/jars/review`, sees the 500k expense. The system suggests the "Necessities" jar because of a `jar_rules` mapping.
5. User clicks "Resolve". A **Jar Movement** is created linking the 500k expense to the "Necessities" jar, reducing its virtual balance by 500k, and marking the queue item as `resolved`.

## 8. Accounting Consistency Review
- **Positive:** Strict separation. Real balances are calculated entirely from `accounts` and `transactions`. Virtual balances are calculated entirely from `jar_movements`. This prevents "money printing" where virtual budgets accidentally inflate real net worth.
- **Positive:** `jar_movements` uses double-entry-like fields (`location_from`, `location_to`) to track if the jar's funds are sitting in cash, savings, or assets.
- **Risk:** The asynchronous nature of the `jar_review_queue`. If a user never clears their review queue, their real bank balances will be accurate, but their Jar balances will be wildly incorrect and useless for budgeting.

## 9. Hidden Assumptions
- **Assumption:** Every real-world cash flow *should* be represented in the Jar system. The queue forces users to account for every transaction virtually.
- **Assumption:** Users understand the difference between `monthly_budgets` (category level) and `jar_month_plans` (jar level). This is a heavy cognitive load.
- **Assumption:** Transfers between real accounts don't inherently change Jar balances, unless they move money into a "locked" state (like an investment), which might trigger a review.

## 10. Technical Debt
- **Duplicated Paradigms:** The system currently maintains `monthly_budgets` and `spending_jar_category_map` (from v1 jars) alongside the new `jars` and `jar_rules` intent layer.
- **State De-sync:** Because the queue resolution is manual, the "virtual" state of the household is frequently out of sync with the "real" state until the user performs their chores.

## 11. Scalability Risks
- **Queue Buildup:** For households with high transaction volume (e.g., daily coffee, multiple groceries), the `jar_review_queue` will become overwhelming, leading to alert fatigue and abandonment of the Jar system.
- **Complex Aggregation:** Views like `jar_balances_monthly` perform cross-joins on 11-month series and aggregations over movements. This could become slow over years of heavy transaction data.

## 12. Dangerous Areas
- **Deletion Logic:** In `deleteIntentJarAction`, deleting a jar requires it to have 0 balance and 0 movements. If a user makes a mistake and has years of movements, they are permanently stuck with that Jar unless they manually zero out every single historical movement.
- **Locations Logic:** Tracking `location_to` and `location_from` within `jar_movements` is inherently fragile. If an asset's value changes (price fluctuation), the `held_in_assets` value of the Jar does not automatically update, breaking the synchronization between real asset value and Jar holding value.

## 13. Questions/Unknowns
- **Automated Resolution:** Does the system automatically resolve `jar_review_queue` items if confidence is `high`, or is it always manual?
- **Goals vs Jars:** `jars` has a `goal_id` FK. Are goals being deprecated in favor of "Long Term Saving" jars, or do they exist in parallel?
- **Legacy Jars Tables:** Are `jar_definitions` and `jar_ledger_entries` still being queried by legacy components, or are they entirely dead code?

## 14. Confidence Levels
- **Confirmed from code:** 
  - Real vs Virtual separation (Transactions vs Jar Movements).
  - The existence and flow of the v2 Jar Intent Layer (Review Queue -> Movement).
  - Schema boundaries and RLS policies.
- **Inferred from behavior:** 
  - The cognitive overlap between `monthly_budgets` and Jars.
  - Queue fatigue risks.
- **Assumptions:** 
  - The user manually resolves queue items via the frontend UI `/jars/review` based on the existence of `resolveJarReviewAction`.
