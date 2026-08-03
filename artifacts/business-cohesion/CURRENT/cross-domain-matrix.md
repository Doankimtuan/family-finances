# Cross-Domain Matrix

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Matrix of every domain against every other domain. For each intersection: what is the relationship? Read? Write? Influence? None?

### Legend

| Symbol | Meaning |
|--------|---------|
| `R` | Reads data from |
| `W` | Writes data to |
| `I` | Influences behavior of |
| `T` | Triggers events in |
| `P` | Protects (enforces constraints on) |
| `S` | Summarizes (read-only aggregation) |
| `L` | Locks (prevents mutation in) |
| `—` | No direct relationship |

---

## Matrix

| ↓ FROM / TO → | Accounts | Transactions | Cards | Savings | Install | Jars | Goals | Planning | Ritual | Inbox | Tenancy | Health | Categories |
|----------------|----------|--------------|-------|---------|---------|------|-------|----------|--------|-------|---------|--------|------------|
| **Accounts** | — | R | — | — | — | — | — | — | — | — | P← | S← | — |
| **Transactions** | R | — | R | R | R | — | — | — | — | T(WR) | — | S← | R |
| **Cards** | R | R | — | — | — | — | — | — | — | T | — | S← | — |
| **Savings** | R | — | — | — | — | — | — | — | — | T | — | S← | — |
| **Installments** | R | R | — | — | — | — | — | — | — | — | — | S← | — |
| **Jars** | — | — | — | — | — | — | W | I | R← | R← | P← | S← | R |
| **Goals** | — | — | — | — | — | R | — | — | R← | — | — | S← | — |
| **Planning** | — | T(W) | — | — | — | R | — | — | — | I | — | S← | R |
| **Ritual** | — | R | R | R | R | R(L) | R | — | — | — | — | S← | R |
| **Inbox** | — | R | R | R | R | W | — | — | — | — | R | S← | R |
| **Tenancy** | P | P | P | P | P | P | P | P | P | P | — | — | — |
| **Health** | S | S | S | S | S | S | S | S | S | S | — | — | — |
| **Categories** | — | I | — | — | — | I | I | I | — | I | — | S← | — |

---

## Detailed Explanations (Row by Row)

### Accounts → *
- **Accounts → Transactions:** Accounts are the home of money; Transactions read account balances. Relationship: **READ.**
- **Accounts → Tenancy:** Tenancy protects access to accounts. Relationship: **PROTECTED BY.**
- **Accounts → Health:** Health summarizes account balances. Relationship: **SUMMARIZED BY.**
- **Accounts → Others:** No direct relationship. Accounts are passive containers.

### Transactions → *
- **Transactions → Accounts:** Transactions reference the account they affect. Relationship: **READ.**
- **Transactions → Cards:** Transactions may be linked to a card (card spending). Relationship: **READ.**
- **Transactions → Savings:** Transactions may be linked to savings (maturity withdrawal). Relationship: **READ.**
- **Transactions → Installments:** Transactions may be linked to an installment payment. Relationship: **READ.**
- **Transactions → Inbox:** Unmapped transactions trigger Inbox ReviewItems (BR-05). Relationship: **TRIGGERS (WRITE).**
- **Transactions → Categories:** Transactions read categories for classification. Relationship: **READ.**
- **Transactions → Health:** Health summarizes transaction history. Relationship: **SUMMARIZED BY.**

### Cards → *
- **Cards → Accounts:** Cards are linked to a funding account. Relationship: **READ.**
- **Cards → Transactions:** Card spending creates transactions; card balance comes from transactions. Relationship: **READ.**
- **Cards → Inbox:** Payment due dates trigger Inbox reminders (BR-17). Relationship: **TRIGGERS.**
- **Cards → Health:** Health summarizes card utilization. Relationship: **SUMMARIZED BY.**

### Savings → *
- **Savings → Accounts:** Savings products linked to accounts. Relationship: **READ.**
- **Savings → Inbox:** Maturity events trigger Inbox decisions (BR-10). Relationship: **TRIGGERS.**
- **Savings → Health:** Health summarizes savings growth. Relationship: **SUMMARIZED BY.**

### Installments → *
- **Installments → Accounts:** Installments linked to payment accounts. Relationship: **READ.**
- **Installments → Transactions:** Payment history read from transactions. Relationship: **READ.**
- **Installments → Health:** Health summarizes debt reduction. Relationship: **SUMMARIZED BY.**

### Jars → *
- **Jars → Goals:** Jar allocations can fund goals. Relationship: **WRITE (funding).**
- **Jars → Categories:** Jars read categories for mapping (category → jar). Relationship: **READ.**
- **Jars → Ritual:** Ritual reviews jar performance. Relationship: **READ BY.**
- **Jars → Inbox:** Inbox resolves items to jars. Relationship: **READ BY.**
- **Jars → Tenancy:** Tenancy protects household jars. Relationship: **PROTECTED BY.**
- **Jars → Health:** Health summarizes jar performance. Relationship: **SUMMARIZED BY.**
- **Jars → Planning:** Planning reads jar structure for auto-allocation. Relationship: **INFLUENCES.**

### Goals → *
- **Goals → Jars:** Goals read jar allocations for funding progress. Relationship: **READ.**
- **Goals → Ritual:** Ritual reviews goal progress. Relationship: **READ BY.**
- **Goals → Health:** Health summarizes goal achievement. Relationship: **SUMMARIZED BY.**

### Planning → *
- **Planning → Jars:** Planning reads jars for auto-allocation rules. Relationship: **READ.**
- **Planning → Transactions:** Patterns generate transactions (EO-04). Relationship: **TRIGGERS (WRITE).**
- **Planning → Categories:** Planning reads categories for pattern classification. Relationship: **READ.**
- **Planning → Inbox:** Pattern-generated transactions may flow to Inbox (if unmapped). Relationship: **INFLUENCES.**
- **Planning → Health:** Health summarizes planning effectiveness. Relationship: **SUMMARIZED BY.**

### Ritual → *
- **Ritual → Transactions:** Ritual reads transaction history for the month. Relationship: **READ.**
- **Ritual → Jars:** Ritual reviews jar performance and locks on approval (BR-08). Relationship: **READ + LOCK.**
- **Ritual → Goals:** Ritual reviews goal progress. Relationship: **READ.**
- **Ritual → Cards:** Ritual reviews card statements. Relationship: **READ.**
- **Ritual → Savings:** Ritual reviews savings status. Relationship: **READ.**
- **Ritual → Installments:** Ritual reviews debt reduction. Relationship: **READ.**
- **Ritual → Categories:** Ritual reviews category spending breakdown. Relationship: **READ.**
- **Ritual → Health:** Health summarizes ritual outcomes. Relationship: **SUMMARIZED BY.**

### Inbox → *
- **Inbox → Transactions:** Inbox reads unmapped transactions (BR-05). Relationship: **READ.**
- **Inbox → Cards:** Inbox reads payment reminders (BR-17). Relationship: **READ.**
- **Inbox → Savings:** Inbox reads maturity events (BR-10). Relationship: **READ.**
- **Inbox → Installments:** Inbox reads completion events. Relationship: **READ.**
- **Inbox → Jars:** Inbox writes resolved items to jars (mapping). Relationship: **WRITE.**
- **Inbox → Categories:** Inbox reads categories for mapping resolution. Relationship: **READ.**
- **Inbox → Tenancy:** Inbox reads household membership for visibility. Relationship: **READ.**
- **Inbox → Health:** Health summarizes Inbox resolution rate. Relationship: **SUMMARIZED BY.**

### Tenancy → *
- **Tenancy → All domains:** Tenancy protects access to all household data. BR-02 enforces auth + membership. BR-02a enforces RLS. Relationship: **PROTECTS (universal gate).**
- **Tenancy → Health:** Health does not read tenancy data directly (household is implicit scope). Relationship: **NONE (scope is implicit).**

### Health → *
- **Health → All domains:** Health summarizes data from all domains for the Health Score (EO-08). But BR-14 is absolute: Health NEVER writes to any domain. Relationship: **SUMMARIZES (read-only).**

### Categories → *
- **Categories → Transactions:** Categories classify transactions. Relationship: **INFLUENCES.**
- **Categories → Jars:** Categories map to jars. Category names influence jar structure. Relationship: **INFLUENCES.**
- **Categories → Goals:** Categories may influence goal categorization. Relationship: **INFLUENCES.**
- **Categories → Planning:** Categories are used in recurring pattern rules. Relationship: **INFLUENCES.**
- **Categories → Inbox:** Categories aid Inbox resolution (auto-mapping). Relationship: **INFLUENCES.**
- **Categories → Health:** Health summarizes category spending. Relationship: **SUMMARIZED BY.**

---

## Integration Density Heatmap

| Domain | Outgoing Edges | Incoming Edges | Total | Density |
|--------|---------------|---------------|-------|---------|
| **Inbox** | 7 (reads) + 1 (writes) | 5 (triggered by) | 13 | **HIGHEST** |
| **Ritual** | 6 (reads) + 1 (locks) | 1 (summarized) | 8 | HIGH |
| **Transactions** | 6 (reads) + 1 (triggers) | 3 (read by) | 10 | HIGH |
| **Jars** | 2 (writes) + 1 (reads) | 6 (read/locked/protected) | 9 | HIGH |
| **Health** | 7 (summarizes) | 0 (writes) | 7 | MEDIUM |
| **Planning** | 2 (reads) + 1 (triggers) | 1 (summarized) | 4 | MEDIUM |
| **Cards** | 2 (reads) + 1 (triggers) | 3 | 6 | MEDIUM |
| **Savings** | 1 (reads) + 1 (triggers) | 2 | 4 | MEDIUM |
| **Tenancy** | 11 (protects) | 1 (read by Inbox) | 12 | HIGH |
| **Categories** | 5 (influences) | 5 (read by) | 10 | HIGH |
| **Goals** | 1 (reads) | 3 (read/written) | 4 | LOW |
| **Installments** | 2 (reads) | 3 | 5 | LOW |
| **Accounts** | 0 (passive) | 5 (read by) | 5 | LOW |

---

## Key Observations

### Most Connected Domain: **Inbox** (13 edges)
The Inbox is the integration hub. It reads from 7 domains (Transactions, Cards, Savings, Installments, Jars, Categories, Tenancy) and writes to Jars. It is triggered by 3-4 external events. This is architecturally sound but creates a single-point-of-integration risk.

### Most Isolated Domain: **Goals** (4 edges)
Goals only interact with Jars (read/write funding) and Health (summarized by). While this is correct scoping (goals are intentions, not money), Goals could benefit from deeper integration with Planning (goal-driven allocation patterns).

### Universal Protector: **Tenancy** (11 outgoing protects)
Tenancy touches every domain as the auth/membership gate. This is correct — financial data must be protected.

### Universal Observer: **Health** (7 outgoing summarizes)
Health reads from every operational domain but writes to none. BR-14 is architecturally correct.

### Shared Dependency: **Categories** (10 edges)
Categories are read by 5 domains and influence 5 domains. This is the most under-managed domain in terms of business contracts — Category naming changes ripple through Real Ledger, Intention Plan, and Inbox simultaneously.

### Blind Spot: **Jars ← Categories** (Influence only)
Jars read Categories, but there is no bidirectional contract. If a Category is renamed, Jars don't automatically know. If a Jar is renamed, Categories don't automatically know. This is a divergence risk.
