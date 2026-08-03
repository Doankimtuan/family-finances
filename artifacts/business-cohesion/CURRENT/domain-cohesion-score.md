# Domain Cohesion Score

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Every domain scored on 7 dimensions. Justification for each.

---

## Scoring Dimensions

| Dimension | Description |
|-----------|-------------|
| **Internal Cohesion (IC)** | How well do the responsibilities within this domain fit together? (1 = random grab-bag, 10 = perfectly unified) |
| **External Cohesion (EC)** | How well does this domain integrate with others? (1 = isolated island, 10 = perfectly integrated) |
| **Business Importance (BI)** | How critical is this domain to the overall system? (1 = optional garnish, 10 = system fails without it) |
| **Lifecycle Completeness (LC)** | Are all money lifecycles through this domain complete? (1 = broken flows, 10 = every flow complete) |
| **Financial Correctness (FC)** | Does this domain's model reflect real financial behavior? (1 = fiction, 10 = mirrors reality) |
| **Long-term Evolution (LE)** | Can this domain evolve without breaking cohesion? (1 = rigid, 10 = evolvable) |
| **Mental Model (MM)** | Is this domain intuitive for users to understand? (1 = confusing, 10 = obvious) |

---

## Scores

### 1. Accounts (Real Ledger)

| Dimension | Score | Justification |
|-----------|-------|---------------|
| IC | **9** | Single responsibility: containers of real money. Clean, focused. No feature creep. |
| EC | **8** | Read by 5 domains (Transactions, Cards, Savings, Installments, Inbox). Protected by Tenancy. Summarized by Health. Well-integrated but passive — accounts don't initiate anything. |
| BI | **10** | Without accounts, money has no home. System-critical. |
| LC | **8** | Accounts participate in every money lifecycle. Well-defined start/end states. Passive container model is correct. |
| FC | **10** | "Account holds real money with real balance" is the simplest, truest financial concept. |
| LE | **8** | Stable. New account types (crypto, investment) can be added without changing the model. |
| MM | **9** | "This is my checking account — it has $5,000." Universally understood. |
| **Overall** | **8.9** | The most stable, clean domain. |

---

### 2. Transactions (Real Ledger)

| Dimension | Score | Justification |
|-----------|-------|---------------|
| IC | **9** | Single responsibility: atoms of financial truth. Records all money movements. |
| EC | **9** | Reads from 5 domains. Triggers Inbox. Read by 3 domains (Ritual, Inbox, Health). EO-20 (splits) and EO-05 (search) enhance it. |
| BI | **10** | No transactions = no financial truth. System-critical. |
| LC | **7** | Most lifecycles complete. Correction and refund lifecycles have gaps (missing audit links). |
| FC | **9** | Double-entry by design (transfers create two linked transactions). Corrections never deletes. Almost perfect. |
| LE | **7** | Split transactions (EO-20) is a good extension. Multi-currency would challenge it. |
| MM | **8** | "Money moved from here to there." Intuitive. Correction pattern ("reverse, don't delete") is less intuitive. |
| **Overall** | **8.4** | Core domain with minor lifecycle gaps. |

---

### 3. Cards (Real Ledger)

| Dimension | Score | Justification |
|-----------|-------|---------------|
| IC | **7** | Credit cards, payment due dates, APR, interest cost, billing cycles — all fit together as "payment instruments with credit." But some concepts (schedule/billing cycle) overlap with Planning and Installments. |
| EC | **7** | Triggers Inbox (BR-17). Read by Transactions, Ritual, Health. EO-02 + EO-13 depend on each other. |
| BI | **6** | Card spending can be tracked as regular transactions from a "Credit Card" account. Cards add value but are not system-critical. |
| LC | **7** | Statement generation gap (no archived statements). Otherwise complete. |
| FC | **8** | APR, minimum payment, interest cost — all correct financial concepts. |
| LE | **7** | Will face pressure to add rewards points, balance transfers, foreign transaction fees. Can evolve. |
| MM | **8** | "This is my credit card — I owe $450." Easy to understand. |
| **Overall** | **7.1** | Solid but not critical path. |

---

### 4. Savings (Real Ledger)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **8** | Savings products, terms, maturity dates, interest — cohesive wealth-building concept. |
| EC | **7** | Triggers Inbox (BR-10). Read by Transactions, Ritual, Health. EO-12 (alerts) enhances it. |
| BI | **6** | Savings can be tracked as a regular account with a note. Adds value but not system-critical. |
| LC | **7** | Maturity alert cascade cancellation undefined. Otherwise complete. |
| FC | **8** | Term deposits, maturity dates, interest rates — correct financial concepts. |
| LE | **8** | Can extend to variable-rate products, investment products. Stable base model. |
| MM | **7** | "Money locked away until a date." Simple. But alert cascade (30/14/7) may annoy users. |
| **Overall** | **7.3** | Clean, evolvable, not critical. |

---

### 5. Installments (Real Ledger)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **7** | Installment plans, payment schedules, interest — cohesive debt concept. But "schedule" overlaps with Planning. |
| EC | **6** | Read by Transactions, Ritual, Health. Triggers Inbox (completion). Fewer connections than other Real Ledger domains. |
| BI | **5** | Installment payments are transactions. The plan structure adds value but isn't critical. |
| LC | **7** | Completion detection (BR-11) works. Interest visibility (EO-09) works. No major gaps. |
| FC | **7** | Installment math (total = n × payment + interest) is correct. |
| LE | **7** | Can handle variable-rate installments, balloon payments. Evolvable. |
| MM | **8** | "I owe $500 over 5 months." Easy to understand. |
| **Overall** | **6.7** | Lowest Real Ledger domain — low integration density. |

---

### 6. Budgets/Jars (Intention Plan)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **8** | Jars, allocations, movements, overspend policy, reallocation, templates — cohesive intention management. |
| EC | **9** | Written by Inbox. Read by Goals, Planning, Ritual, Health. Protected by Tenancy. Multiple features (EO-06, EO-19) enhance it. Highly connected. |
| BI | **8** | Without jars, Intention Plan has no structure. Spending has no plan. Health has nothing to compare. |
| LC | **7** | Overspend → reallocation flow works. Category-jar mapping gap. Emergency mode missing. |
| FC | **8** | Envelope budgeting is a proven financial method. BR-06 (positive magnitudes, direction) is correct. |
| LE | **8** | Can handle rolling budgets, annual budgets, zero-based. Stable model. |
| MM | **8** | "I have $300 for Dining this month." Jars/envelopes are intuitive. |
| **Overall** | **8.0** | Core Intention domain, well-integrated. |

---

### 7. Goals (Intention Plan)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **7** | Goals, targets, funding, milestones — cohesive aspiration concept. But thin — only EO-18 enhances it. |
| EC | **5** | Only reads/writes Jars. Read by Ritual and Health. Most isolated operational domain. |
| BI | **5** | Goals are aspirational — system functions without them. Important for user motivation, not system operation. |
| LC | **7** | Creation → funding → milestone → completion works. Post-completion path missing. |
| FC | **7** | Target amounts, timeline, funding progress — correct concepts. |
| LE | **8** | Can handle group goals, recurring goals, milestone-based funding. Evolvable. |
| MM | **9** | "We're saving $3,000 for a vacation." Universally understood, motivating. |
| **Overall** | **6.9** | Good concept, weak integration. |

---

### 8. Planning/RecurringPatterns (Intention Plan)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **8** | RecurringPatterns (EO-04), Calendar (EO-03), income allocation (BR-04) — cohesive automation domain. |
| EC | **7** | Writes to Transactions. Reads Jars, Categories. Feeds Calendar. Influences Inbox. |
| BI | **7** | Automates recurring work. Without it, every bill is manual. Important but not critical (system works manually). |
| LC | **7** | Pattern → calendar → transaction → categorized flow works. Actual vs. expected amount gap. |
| FC | **7** | Recurring patterns are a real financial concept (bills, subscriptions). |
| LE | **7** | Can handle variable-frequency patterns, conditional patterns. Evolvable. |
| MM | **7** | "My phone bill is $85 every month on the 15th." Intuitive. |
| **Overall** | **7.1** | Strong automation domain with gaps in Inbox integration. |

---

### 9. MonthRitual (Intention Plan)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **7** | Month close, review sections, lock plan, create snapshot — cohesive ceremony. But ritual is a process, not a data domain. |
| EC | **9** | Reads from 7 domains (most of any domain). Locks Jars. Summarized by Health. Highly connected. |
| BI | **8** | Without ritual, plans never lock, Health has no snapshots, learning loop breaks. Critical for long-term system health. |
| LC | **6** | Ritual → review → approve → lock flow works. But no timeout if never approved. No "reopen locked ritual" flow. |
| FC | **7** | Month-end close is a standard financial practice. |
| LE | **6** | EO-10 (Quick Close) helps. But ritual must evolve with new domains (e.g., add investment review section). Adding sections = changing ritual structure = risky. |
| MM | **7** | "Let's close the month and see how we did." Intuitive ceremony. |
| **Overall** | **7.1** | Most connected but least mature design. |

---

### 10. Inbox (Intention Plan)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **5** | ReviewItems from 4 sources, batch operations (EO-07), future auto-resolution (EO-16). Responsibilities are cohesive (decision queue) but ReviewItem model is under-designed. |
| EC | **10** | Reads from 7 domains. Writes to Jars. Triggered by 4 domains. Protected by Tenancy. Highest integration density. |
| BI | **9** | Bridge between Real and Intention. System degrades to expense tracker without Inbox. Critical. |
| LC | **6** | Resolution flow works. But no type taxonomy. No expiry. No priority. No staleness rules. |
| FC | **7** | Decision queue for financial items is a valid pattern. But undifferentiated items are financially dangerous. |
| LE | **5** | EO-16 (auto-resolution R2) will stress the Inbox model. Without type taxonomy, it breaks. Inbox needs the most design investment before R2. |
| MM | **7** | "Things I need to decide about." Intuitive. But mixed item types confuse: "Is this a bill reminder or an expense I forgot to categorize?" |
| **Overall** | **7.0** | Most important integration domain, least mature internal design. |

---

### 11. Tenancy (Together)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **9** | Household, members, invitations, policies, auth — cohesive collaboration domain. |
| EC | **9** | Protects all domains (universal gate). Read by Inbox (household scope). BR-02 through BR-13 are consistent. |
| BI | **10** | Without tenancy, no multi-user. No shared finances. System-critical. |
| LC | **8** | Invite → accept → join → see everything flow works. Partner removal flow is unspecified. |
| FC | **8** | Household membership, RLS, single account — correct security concepts. |
| LE | **9** | Can handle multiple households per user (future), household roles, guest access. Stable model. |
| MM | **9** | "This is our household money." Simple, clear. |
| **Overall** | **8.9** | Clean, critical, well-designed. |

---

### 12. Health (Insight)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **8** | Score, narrative, trends, light scenarios — cohesive insight concept. |
| EC | **7** | Reads from 7 domains. Writes to none (BR-14). Purely inbound integration. |
| BI | **6** | System functions without Health. But user motivation and long-term engagement depend on it. |
| LC | **8** | Read-only means no lifecycles to complete. Data flows in, insights flow out. |
| FC | **8** | Financial health scoring is a valid concept. BR-14 ensures it never corrupts operational data. |
| LE | **9** | Can iterate on scoring algorithm (EO-08). Can add predictions, scenarios, recommendations. BR-14 boundary provides safety. |
| MM | **8** | "How healthy are our finances?" Intuitive. Score makes it concrete. |
| **Overall** | **7.7** | Well-designed leaf node with strong evolution potential. |

---

### 13. Categories (Shared Infrastructure)

| Domain | Score | Justification |
|--------|-------|---------------|
| IC | **7** | Categories, auto-cat rules (EO-01), override tracking (BR-16) — cohesive classification concept. But auto-cat rules and category definitions are different things in the same domain. |
| EC | **9** | Read by 5 domains. Influences 5 domains. Shared taxonomy for the entire system. |
| BI | **9** | Without categories, nothing can be classified. Inbox can't map. Health can't group. Ritual can't summarize. |
| LC | **7** | Classification flow works. But Category-Jar divergence is a lifecycle gap (classification succeeds but mapping fails). |
| FC | **7** | Categories are real accounting concepts (chart of accounts). Auto-categorization (EO-01) is ML, not pure accounting. Tension between the two. |
| LE | **6** | Category taxonomy will grow. Auto-cat rules will evolve. The domain will face pressure to add subcategories, tags, and smart categorization. Risk of becoming a kitchen-sink domain. |
| MM | **8** | "Groceries, Dining, Rent" — categories are universal. |
| **Overall** | **7.6** | Critical shared infrastructure with divergence risk. |

---

## Domain Ranking

| Rank | Domain | IC | EC | BI | LC | FC | LE | MM | Overall |
|------|--------|----|----|----|----|----|----|----|---------|
| 1 | **Accounts** | 9 | 8 | 10 | 8 | 10 | 8 | 9 | **8.9** |
| 2 | **Tenancy** | 9 | 9 | 10 | 8 | 8 | 9 | 9 | **8.9** |
| 3 | **Transactions** | 9 | 9 | 10 | 7 | 9 | 7 | 8 | **8.4** |
| 4 | **Budgets/Jars** | 8 | 9 | 8 | 7 | 8 | 8 | 8 | **8.0** |
| 5 | **Health** | 8 | 7 | 6 | 8 | 8 | 9 | 8 | **7.7** |
| 6 | **Categories** | 7 | 9 | 9 | 7 | 7 | 6 | 8 | **7.6** |
| 7 | **Savings** | 8 | 7 | 6 | 7 | 8 | 8 | 7 | **7.3** |
| 8 | **Cards** | 7 | 7 | 6 | 7 | 8 | 7 | 8 | **7.1** |
| 9 | **Planning** | 8 | 7 | 7 | 7 | 7 | 7 | 7 | **7.1** |
| 10 | **MonthRitual** | 7 | 9 | 8 | 6 | 7 | 6 | 7 | **7.1** |
| 11 | **Inbox** | 5 | 10 | 9 | 6 | 7 | 5 | 7 | **7.0** |
| 12 | **Goals** | 7 | 5 | 5 | 7 | 7 | 8 | 9 | **6.9** |
| 13 | **Installments** | 7 | 6 | 5 | 7 | 7 | 7 | 8 | **6.7** |

---

## Analysis

### Strongest Domain: Accounts (8.9) & Tenancy (8.9)
- **Accounts:** Perfectly scoped. Single responsibility. No feature creep. Clean integration. High financial correctness.
- **Tenancy:** Clean security domain. Universal gate pattern is correct. BR-02 through BR-13 are consistent.

### Weakest Domain: Installments (6.7)
- Low business importance (can function without it). Low integration density. "Schedule" overlap with Planning. Thin domain with few connections.

### Most Improved by R1: Inbox (from ~5.5 pre-R1 to 7.0 post-R1)
- EO-07 (batch ops) makes Inbox usable at scale. But internal design (ReviewItem types) still needs investment.

### Domain Needing Most Attention: Inbox (7.0)
- Highest external cohesion (10) but lowest internal cohesion (5). This asymmetry is the #1 architectural risk. Inbox is the most important integration domain with the weakest internal model.
