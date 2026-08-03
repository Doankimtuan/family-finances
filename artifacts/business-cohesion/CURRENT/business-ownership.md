# Business Ownership

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

For every business concept: which domain OWNS it (single owner), which domains READ it, which domains are AFFECTED by changes, which domains must NEVER touch it.

---

## Ownership Table

### Account
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Accounts** (Real Ledger) |
| **READS** | Transactions, Cards, Savings, Installments, Inbox, Tenancy, Health |
| **AFFECTED BY** | Transactions (balance changes), Savings (linked products), Cards (linked cards) |
| **NEVER TOUCH** | Jars, Goals, Planning, Ritual (Intention Plan must not mutate account data) |

### Transaction
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Transactions** (Real Ledger) |
| **READS** | Cards, Installments, Inbox, Ritual, Health |
| **AFFECTED BY** | Planning (pattern-generated transactions), Cards (card payments), EO-20 (splits) |
| **NEVER TOUCH** | Jars (jars track intention, not transactions), Goals, Health (BR-14) |

### Card
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Cards** (Real Ledger) |
| **READS** | Transactions, Inbox, Ritual, Health |
| **AFFECTED BY** | Transactions (spending, payments), EO-02 (APR/due dates), EO-13 (interest) |
| **NEVER TOUCH** | Jars, Goals (not intention concepts) |

### SavingsProduct
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Savings** (Real Ledger) |
| **READS** | Transactions, Inbox, Ritual, Health |
| **AFFECTED BY** | Transactions (maturity withdrawal), BR-21 (alerts), BR-10 (Inbox flow) |
| **NEVER TOUCH** | Jars, Goals (savings are real money, not intentions) |

### InstallmentPlan
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Installments** (Real Ledger) |
| **READS** | Transactions, Inbox, Ritual, Health |
| **AFFECTED BY** | Transactions (payments), BR-11 (completion), EO-09 (interest visibility) |
| **NEVER TOUCH** | Jars, Goals, Planning |

### Jar
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Budgets/Jars** (Intention Plan) |
| **READS** | Goals, Planning, Ritual, Inbox, Health, Tenancy |
| **AFFECTED BY** | Inbox (resolution), Ritual (lock), EO-06 (templates), EO-19 (reallocation) |
| **NEVER TOUCH** | Accounts (BR-01: jars are not money containers), Transactions, Cards, Savings, Installments |

### Goal
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Goals** (Intention Plan) |
| **READS** | Jars, Ritual, Health |
| **AFFECTED BY** | Jars (funding allocation), EO-18 (celebration) |
| **NEVER TOUCH** | Accounts, Transactions, Cards, Savings, Installments |

### RecurringPattern
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Planning** (Intention Plan) |
| **READS** | Jars, Categories |
| **AFFECTED BY** | EO-04 (simplification), EO-03 (calendar) |
| **NEVER TOUCH** | Accounts, Cards, Savings, Installments (patterns generate transactions, not mutate Real Ledger directly) |

### ReviewItem
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Inbox** (Intention Plan) |
| **READS** | Tenancy (household scope) |
| **AFFECTED BY** | Transactions (BR-05), Savings (BR-10), Cards (BR-17), EO-07 (batch ops) |
| **NEVER TOUCH** | Health (BR-14: health doesn't create Inbox items) |

### Category
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Categories** (Shared Infrastructure) |
| **READS** | Transactions, Jars, Planning, Inbox, Ritual |
| **AFFECTED BY** | EO-01 (auto-categorization), BR-16 (override rules) |
| **NEVER TOUCH** | Health (BR-14: health reads categories, doesn't mutate) |

### HealthSnapshot
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Health** (Insight) |
| **READS** | N/A (Health is leaf node — no domain reads Health data) |
| **AFFECTED BY** | All domains' data (but Health only summarizes, BR-14) |
| **NEVER TOUCH** | All domains (BR-14: Health never mutates any domain) |

### Household
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Tenancy** (Together) |
| **READS** | Inbox (for membership scope) |
| **AFFECTED BY** | BR-12 (one active household), new partner joins |
| **NEVER TOUCH** | Health (implicit scope, not explicit household data) |

### Member
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Tenancy** (Together) |
| **READS** | Inbox (for visibility scope) |
| **AFFECTED BY** | BR-02b (single account), BR-13 (policy visibility) |
| **NEVER TOUCH** | All operational domains (membership ≠ money) |

### MonthRitual
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **MonthRitual** (Intention Plan) |
| **READS** | N/A (ritual is a process, its snapshots are consumable by Health) |
| **AFFECTED BY** | EO-10 (Quick Close), BR-08 (lock), BR-09 (assisted default), BR-23/24 |
| **NEVER TOUCH** | Health (BR-14), Accounts, Transactions (ritual reviews, doesn't mutate) |

### Movement
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Budgets/Jars** (Intention Plan) |
| **READS** | Goals (funding flow), Ritual (review) |
| **AFFECTED BY** | BR-06 (positive magnitudes, direction), BR-07 (overspend), BR-08 (lock), EO-19 (reallocation) |
| **NEVER TOUCH** | Accounts, Transactions (movements are intention-layer, not real money) |

### Policy
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Budgets/Jars** for jar policies (BR-07); **Planning** for allocation policies (BR-04) |
| **READS** | Tenancy (BR-13: partner visibility) |
| **AFFECTED BY** | Policy changes from Admin, BR-13 audit |
| **NEVER TOUCH** | Health (BR-14), Accounts, Transactions |

> ⚠️ **Ambiguity:** Policy ownership is split between Jars (overspend) and Planning (allocation). This is borderline duplicate responsibility.

### Template
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Budgets/Jars** (Intention Plan) |
| **READS** | N/A (templates are seed data) |
| **AFFECTED BY** | EO-06 (template application), BR-19 (non-destructive) |
| **NEVER TOUCH** | All operational domains (templates are read-only seed data) |

### AutoCategoryRule
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Categories** (Shared Infrastructure) |
| **READS** | Transactions (for override detection), Inbox (for resolution aid) |
| **AFFECTED BY** | EO-01 (auto-cat), BR-16 (3-override update) |
| **NEVER TOUCH** | Health (BR-14), Jars (rules classify, jars allocate — different responsibilities) |

### CalendarView
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Planning** (Intention Plan) |
| **READS** | N/A (derived from RecurringPatterns) |
| **AFFECTED BY** | EO-03 (calendar display), EO-04 (pattern feeds calendar) |
| **NEVER TOUCH** | All domains (calendar is a derived view, not a data store) |

### InterestCost
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Cards** for card interest; **Installments** for installment interest |
| **READS** | Health (summarizes) |
| **AFFECTED BY** | EO-02 → EO-13 (card interest), EO-09 (installment interest), BR-20, BR-22 |
| **NEVER TOUCH** | Jars, Goals, Accounts |

> ⚠️ **Split ownership:** InterestCost is owned by two domains. This is acceptable because they represent different financial concepts (credit card interest vs. installment interest), but the naming is confusing.

### MaturityAlert
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Savings** (Real Ledger) |
| **READS** | Inbox (BR-10: maturity → Inbox flow) |
| **AFFECTED BY** | BR-21 (30/14/7 cascade), EO-12 (alerts) |
| **NEVER TOUCH** | Health (BR-14), Jars |

### PaymentDueDate
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Cards** (Real Ledger) |
| **READS** | Inbox (BR-17: reminder → Inbox) |
| **AFFECTED BY** | EO-02 (due date data) |
| **NEVER TOUCH** | Health (BR-14), Jars |

### QuickClose
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **MonthRitual** (Intention Plan) |
| **READS** | N/A (feature of ritual process) |
| **AFFECTED BY** | EO-10 (Quick Close feature), BR-23 (6-ritual eligibility), BR-24 (summary) |
| **NEVER TOUCH** | All (Quick Close is a UX mode, not a separate domain concept) |

### SplitTransaction
| Property | Domain(s) |
|----------|-----------|
| **OWNER** | **Transactions** (Real Ledger) |
| **READS** | Categories (for category assignment per split), Jars (for jar mapping per split) |
| **AFFECTED BY** | EO-20 (split support) |
| **NEVER TOUCH** | Health (BR-14), Goals |

---

## Ownership Statistics

| Metric | Count |
|--------|-------|
| Concepts owned by Real Ledger domains | 9 (Account, Transaction, Card, SavingsProduct, InstallmentPlan, InterestCost-cards, MaturityAlert, PaymentDueDate, SplitTransaction) |
| Concepts owned by Intention Plan domains | 10 (Jar, Goal, RecurringPattern, ReviewItem, MonthRitual, Movement, Policy-jars, Template, CalendarView, QuickClose) |
| Concepts owned by Tenancy | 2 (Household, Member) |
| Concepts owned by Health | 1 (HealthSnapshot) |
| Concepts owned by Shared | 2 (Category, AutoCategoryRule) |
| Concepts with split ownership | 2 (Policy, InterestCost) |
| **Total concepts** | **24** |

---

## Ownership Conflicts

### 1. Policy — Split Ownership (LOW severity)
**Conflict:** Overspend policy (BR-07) is owned by Jars. Income placement policy (BR-04) is owned by Planning. Both are "Policy" concepts but live in different domains.
**Risk:** If a future feature needs a unified policy view, which domain serves it?
**Resolution:** Accept the split — they govern different things. But document clearly.

### 2. InterestCost — Split Ownership (LOW severity)
**Conflict:** Card interest cost (BR-22) is owned by Cards. Installment interest (BR-20) is owned by Installments. Both are "interest" but are different financial instruments.
**Risk:** If Health wants to show "total interest paid," it must aggregate from two domains.
**Resolution:** Accept the split. Health (BR-14 read-only) is the right place to aggregate.

### 3. Schedule Concept — Implicit Duplication (MEDIUM severity)
**Conflict:** Installments have payment schedules. RecurringPatterns generate on a schedule. Cards have billing cycle schedules. Three domains define "schedule-like" behavior independently.
**Risk:** No unified concept of "what happens when." Calendar view (EO-03) should aggregate all schedules but currently only aggregates RecurringPatterns.
**Resolution:** Calendar view (EO-03) should be extended to show card due dates and installment payment dates — or a new "Schedule" concept should be owned by Planning.
