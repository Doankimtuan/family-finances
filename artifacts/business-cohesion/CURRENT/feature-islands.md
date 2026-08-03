# Feature Islands

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Identify any approved feature (EO-XX) that has no meaningful interaction with other features. For each: analysis, verdict, evidence.

---

## EO-01: Auto-Categorization

| Property | Assessment |
|----------|------------|
| **Primary domain** | Categories |
| **Interacts with** | Transactions (classifies), Inbox (speeds resolution via correct mapping), Jars (category → jar mapping), Planning (patterns use categories) |
| **Removal impact** | Every transaction needs manual categorization. Inbox grows. Jar mapping requires manual effort. User experience degrades significantly. |
| **Verdict** | **CONNECTED** — central to classification pipeline |

### Evidence
- Directly affects Transaction → Category → Jar → Inbox pipeline
- BR-16 (3-override rule update) creates a feedback loop between Categories, Transactions, and Inbox
- EO-01 is the foundation for R2 auto-resolution (EO-16)
- Without EO-01, EO-05 (search) is less useful (no auto-categorized data to filter)

---

## EO-02: Card Payment Due Dates + APR

| Property | Assessment |
|----------|------------|
| **Primary domain** | Cards |
| **Interacts with** | EO-13 (interest cost needs APR data), Cards → Inbox (BR-17: payment reminders), Cards → Health (card utilization) |
| **Removal impact** | EO-13 breaks (no APR data). Card reminders (BR-17) have no due date data. Card interest cost (BR-22) can't be calculated. |
| **Verdict** | **CONNECTED** — feeds data to multiple downstream features |

### Evidence
- Explicit dependency: EO-02 → EO-13 (from Decision Board)
- BR-17, BR-18, BR-22 all depend on card data EO-02 provides
- Card → Inbox integration depends on due dates

---

## EO-03: Recurring Bill Calendar

| Property | Assessment |
|----------|------------|
| **Primary domain** | Planning |
| **Interacts with** | EO-04 (patterns feed the calendar), Planning → Transactions (calendar shows upcoming bill → transaction created) |
| **Removal impact** | No visual view of upcoming bills. Users must remember bills manually. EO-04 patterns still generate transactions but without calendar preview. |
| **Verdict** | **CONNECTED** — depends on EO-04, feeds user awareness |

### Evidence
- Explicit dependency: EO-04 → EO-03 (from Decision Board)
- Without EO-04, EO-03 has no data to display
- Calendar view is a derived UX on top of RecurringPatterns

---

## EO-04: Simplify Planning to RecurringPatterns

| Property | Assessment |
|----------|------------|
| **Primary domain** | Planning |
| **Interacts with** | EO-03 (feeds calendar), Transactions (generates transactions), Categories (uses categories in patterns), Jars (auto-allocates per BR-04) |
| **Removal impact** | Recurring bills must be manually entered. Calendar is empty. Income auto-allocation breaks. The entire Planning domain loses automation. |
| **Verdict** | **CONNECTED** — backbone of Planning automation |

### Evidence
- Directly feeds EO-03 (calendar)
- Directly generates Transactions
- BR-04 (income placement) depends on pattern rules
- Multiple user journeys depend on recurring automation

---

## EO-05: Transaction Search/Filtering

| Property | Assessment |
|----------|------------|
| **Primary domain** | Transactions |
| **Interacts with** | Transactions (searches its own data), EO-11 (export uses search to scope data) |
| **Removal impact** | Users can't find specific transactions. Reconciliation becomes harder. But no other feature breaks. |
| **Verdict** | **CONNECTED** — utility feature that enhances all transaction-dependent flows |

### Evidence
- Search is a UX capability on top of the Transactions domain
- Used in Month Ritual review (finding specific transactions)
- Used in correction lifecycle (finding the erroneous transaction)
- Weak coupling but widely used across user journeys

---

## EO-06: Jar Templates for Onboarding

| Property | Assessment |
|----------|------------|
| **Primary domain** | Budgets/Jars |
| **Interacts with** | Jars (creates initial jars), BR-19 (template application rules) |
| **Removal impact** | New users start with zero jars. Must manually create each jar. Onboarding friction increases. No business process breaks. |
| **Verdict** | **WEAKLY CONNECTED** — onboarding-only, no runtime interaction |

### Evidence
- Only used during Day 0 (onboarding journey)
- Does not affect any ongoing business process
- BR-19 ensures non-destructive application, but this only matters at onboarding
- **Risk:** Could become an island if templates are never maintained or iterated

---

## EO-07: Inbox Batch Operations

| Property | Assessment |
|----------|------------|
| **Primary domain** | Inbox |
| **Interacts with** | Inbox (batch resolves ReviewItems), Jars (batch writes to jars), all Inbox-source domains (Transactions, Savings, Cards) |
| **Removal impact** | Inbox must be resolved one item at a time. Weekly review takes 5x longer. Inbox Zero becomes tedious. |
| **Verdict** | **CONNECTED** — UX accelerator for the Inbox hub |

### Evidence
- Multiplies Inbox resolution throughput
- Touches the same integrations as individual Inbox resolution
- Critical for "Weekly Inbox Zero" user journey
- Without EO-07, Inbox remains functional but slow

---

## EO-08: Health Score Iteration

| Property | Assessment |
|----------|------------|
| **Primary domain** | Health |
| **Interacts with** | Health (improves score calculation), All domains (reads data for score) |
| **Removal impact** | Health score is less accurate. Users get poorer financial insights. No operational domain breaks (BR-14: Health is read-only). |
| **Verdict** | **CONNECTED** — read-only, but improvement affects user trust and engagement |

### Evidence
- Health is a leaf node (BR-14)
- Better score = better user decisions = better system use
- EO-08 iteration data feeds R2 Health features
- No domain depends on Health, but users depend on accurate insights

---

## EO-09: Installment Interest Visibility

| Property | Assessment |
|----------|------------|
| **Primary domain** | Installments |
| **Interacts with** | Installments (displays interest within its own domain), Health (summarizes debt cost) |
| **Removal impact** | Installment interest is hidden. Users don't know the true cost of debt. BR-20 (interest transparency) violated. |
| **Verdict** | **CONNECTED** — enhances a single domain but required by BR-20 |

### Evidence
- Directly implements BR-20
- Health summarizes this data for "cost of debt" insights
- No cross-domain dependency beyond Health read

---

## EO-10: Month Ritual Quick Close

| Property | Assessment |
|----------|------------|
| **Primary domain** | MonthRitual |
| **Interacts with** | Ritual (accelerates the close process), BR-23 (eligibility), BR-24 (summary) |
| **Removal impact** | All rituals are Assisted (full review). Experienced users lose time-saving shortcut. No business process breaks. |
| **Verdict** | **CONNECTED** — UX shortcut for mature users, bound by BR-23/24 |

### Evidence
- Only available after 6+ rituals (BR-23) — targets experienced users
- BR-24 ensures summary quality even in Quick Close
- Depends on Ritual domain data being comprehensive

---

## EO-11: Data Export CSV

| Property | Assessment |
|----------|------------|
| **Primary domain** | Shared |
| **Interacts with** | Transactions (exports transaction data), Jars (exports jar allocation data) |
| **Removal impact** | No data export capability. Users can't take data elsewhere. No business process breaks. |
| **Verdict** | **WEAKLY CONNECTED** — data utility, no runtime integration |

### Evidence
- Read-only operation on multiple domains
- No domain depends on export
- Purely a user utility
- **Verdict: CONNECTED but peripheral** — not an island because it touches multiple domains, but non-critical

---

## EO-12: Savings Maturity Alerts

| Property | Assessment |
|----------|------------|
| **Primary domain** | Savings |
| **Interacts with** | Savings (generates alerts), Inbox (alerts may appear in Inbox), BR-21 (cascade rules), BR-10 (maturity → Inbox) |
| **Removal impact** | BR-21 violated. Users don't know savings is maturing. BR-10 Inbox flow has no trigger. |
| **Verdict** | **CONNECTED** — directly feeds the Savings → Inbox integration |

### Evidence
- BR-21 requires 30/14/7 day cascade
- Without alerts, the maturity decision lifecycle breaks
- Tightly coupled to Savings lifecycle

---

## EO-13: Card Interest Cost Display

| Property | Assessment |
|----------|------------|
| **Primary domain** | Cards |
| **Interacts with** | EO-02 (depends on APR data), Cards (displays interest cost), Health (summarizes interest burden) |
| **Removal impact** | BR-22 violated. Users don't see the cost of carrying a balance. Decision-making degrades. |
| **Verdict** | **CONNECTED** — depends on EO-02, required by BR-22 |

### Evidence
- Explicit dependency: EO-02 → EO-13 (from Decision Board)
- Without EO-02's APR data, EO-13 can't calculate interest
- Health uses this data for "credit health" score component

---

## EO-18: Goal Progress Celebration

| Property | Assessment |
|----------|------------|
| **Primary domain** | Goals |
| **Interacts with** | Goals (detects milestones internally), Jars (reads funding progress) |
| **Removal impact** | No celebration notifications. Goals still track progress. No business process breaks. |
| **Verdict** | **WEAKLY CONNECTED** — single-domain UX enhancement |

### Evidence
- Operates entirely within the Goals domain
- Triggers on milestone thresholds (25%, 50%, 75%, 100%)
- Slight connection to Jars (reads funding data) but no write-back
- **Verdict: CONNECTED but THIN** — borderline island

---

## EO-19: Simple Jar Reallocation UX

| Property | Assessment |
|----------|------------|
| **Primary domain** | Budgets/Jars |
| **Interacts with** | Jars (moves allocation between jars), BR-06 (direction explicit), BR-07 (overspend trigger), Tenancy (BR-13 visibility) |
| **Removal impact** | Can't reallocate between jars mid-month. Overspend handling becomes impossible. Emergency spending can't be absorbed. |
| **Verdict** | **CONNECTED** — essential for jar management across lifecycles |

### Evidence
- Used in overspend decision lifecycle
- Used in emergency spending lifecycle
- Used in financial conflict resolution journey
- Written to by Inbox on resolution (different interaction)

---

## EO-20: Transaction Split Support

| Property | Assessment |
|----------|------------|
| **Primary domain** | Transactions |
| **Interacts with** | Transactions (splits a single transaction into parts), Categories (each split can have different category), Jars (each split maps to different jar) |
| **Removal impact** | Can't split a Costco run into "Groceries" + "Household" + "Clothing." Forced into single category. Inbox gets harder to resolve. |
| **Verdict** | **CONNECTED** — enhances Transactions ↔ Categories ↔ Jars pipeline |

### Evidence
- Each split becomes a sub-transaction with its own category
- Each split can map to a different jar
- Strengthens the Transaction → Category → Jar mapping

---

## Summary

| Feature | Verdict | Integration Score |
|---------|---------|-------------------|
| EO-01 Auto-Cat | CONNECTED | 9/10 |
| EO-02 Card APR | CONNECTED | 8/10 |
| EO-03 Calendar | CONNECTED | 8/10 |
| EO-04 RecurringPatterns | CONNECTED | 10/10 |
| EO-05 Search/Filter | CONNECTED | 5/10 (utility) |
| EO-06 Jar Templates | WEAKLY CONNECTED | 3/10 |
| EO-07 Batch Ops | CONNECTED | 8/10 |
| EO-08 Health Score | CONNECTED | 6/10 (leaf node) |
| EO-09 Installment Interest | CONNECTED | 5/10 |
| EO-10 Quick Close | CONNECTED | 5/10 |
| EO-11 Export CSV | WEAKLY CONNECTED | 2/10 |
| EO-12 Savings Alerts | CONNECTED | 8/10 |
| EO-13 Card Interest | CONNECTED | 8/10 |
| EO-18 Goal Celebration | CONNECTED (thin) | 4/10 |
| EO-19 Jar Reallocation | CONNECTED | 9/10 |
| EO-20 Split Txns | CONNECTED | 7/10 |

### No Feature Islands Detected
All 15 features have at least weak connections to other features. No feature operates in complete isolation. However:

- **EO-06 (Jar Templates)** and **EO-11 (Export CSV)** are the weakest — they are utility features at the onboarding/offboarding edges.
- **EO-18 (Goal Celebration)** is the thinnest CONNECTED feature — it reads from Jars but operates mostly within Goals.
- The Inbox is the integration hub: EO-01, EO-07, EO-12, and partially EO-04 all feed into the Inbox.

**Business risk:** The Inbox is the single point of cross-feature integration. If the Inbox integration model is weak (e.g., no ReviewItem type system), R1 features connected via Inbox become fragile in R2.
