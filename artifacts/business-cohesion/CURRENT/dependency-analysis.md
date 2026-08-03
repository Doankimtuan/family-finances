# Dependency Analysis

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Business dependency analysis — which domains are critical path, which are independent, which features have the most dependencies, and what new dependencies R1 features create.

---

## Critical Path Analysis

### Tier 1 — Critical (If These Fail, ViNha Fails)

| Domain | Why Critical | Depends On |
|--------|-------------|------------|
| **Accounts** | Money has no home without accounts. All transactions reference accounts. | Tenancy (auth gate) |
| **Transactions** | No financial truth without transactions. Inbox, Jars, Ritual, Health all read transactions. | Accounts, Categories, Tenancy |
| **Categories** | No classification without categories. Transactions, Jars, Inbox, Planning all depend on categories. | Nothing (shared infrastructure) |
| **Tenancy** | No access without auth + membership. Universal gate. | Nothing (autonomous) |
| **Inbox** | Bridge between Real and Intention. BR-05, BR-10, BR-17 all flow through Inbox. | Transactions, Savings, Cards, Installments, Tenancy |

**Critical path chain:** Tenancy → Accounts → Transactions → Categories → Inbox → Jars

### Tier 2 — Important (System Degrades Without Them)

| Domain | Why Important | Depends On |
|--------|--------------|------------|
| **Jars** | Intention tracking. Without jars, spending has no plan. Inbox has no resolution target. | Categories, Tenancy |
| **Planning** | Automation of recurring bills and income allocation. | Jars, Categories |
| **MonthRitual** | Month close ceremony. Without it, plans never lock, Health has no snapshots. | All domains (reads) |

### Tier 3 — Supporting (System Functions Without Them)

| Domain | Why Supporting | Depends On |
|--------|---------------|------------|
| **Cards** | Credit card tracking. Without cards, card spending is tracked as regular transactions. | Accounts, Transactions |
| **Savings** | Savings product tracking. Without savings, savings are tracked as regular accounts. | Accounts |
| **Installments** | Debt tracking. Without installments, debt payments are regular transactions. | Accounts, Transactions |
| **Goals** | Aspirational targets. Without goals, jars still work. | Jars |
| **Health** | Read-only mirror. Without Health, all operational domains still function (BR-14). | All domains (reads) |

---

## Domain Independence

### Fully Independent Domains

| Domain | Can Function Alone? | Caveat |
|--------|---------------------|--------|
| **Health** | ✅ Yes | Can show empty state; no mutations needed |
| **Goals** | ✅ Yes (partially) | Can exist as aspirations without jar funding |
| **Cards** | ✅ Yes (limited) | Can be created without transactions (pre-loaded data) |

### Fully Dependent Domains

| Domain | Depends On | Minimum Required |
|--------|------------|-----------------|
| **Transactions** | Accounts, Categories, Tenancy | Must have at least one account and category to function |
| **Jars** | Categories, Tenancy | Must have categories for mapping |
| **Inbox** | Transactions, Tenancy | Must have transactions to receive ReviewItems |

---

## Feature Dependency Analysis

### Most Dependent Features (Highest Inbound Dependencies)

| Feature | Depended On By | Count |
|---------|---------------|-------|
| **EO-04 (RecurringPatterns)** | EO-03 (Calendar), Transactions (generates), Planning (own domain) | 3 |
| **EO-01 (Auto-Categorization)** | Transactions, Inbox, BR-16, future EO-16 | 4 |
| **EO-02 (Card APR)** | EO-13 (Interest Cost), BR-22 (interest display) | 2 |

### Most Dependent Features (Highest Outbound Dependencies)

| Feature | Depends On | Count |
|---------|-----------|-------|
| **EO-03 (Calendar)** | EO-04 (Patterns) | 1 |
| **EO-13 (Card Interest)** | EO-02 (APR) | 1 |
| **EO-16 (Auto-Resolution R2)** | EO-01 (Auto-Cat) | 1 |

### Feature Creates New Cross-Domain Dependencies

| Feature | Creates Dependency | Domains Affected |
|---------|-------------------|-----------------|
| **EO-01 (Auto-Cat)** | Categories → Transactions (auto-classification) | Categories, Transactions |
| **EO-03 (Calendar)** | Planning → time-based user surface | Planning (new CalendarView) |
| **EO-04 (Patterns)** | Planning → Transactions (auto-generation) | Planning, Transactions |
| **EO-06 (Templates)** | Seed data → Jars (template application) | Jars (onboarding only) |
| **EO-07 (Batch Ops)** | Inbox → Jars (bulk resolution) | Inbox, Jars |
| **EO-10 (Quick Close)** | Ritual → new UX mode | MonthRitual |
| **EO-12 (Savings Alerts)** | Savings → Inbox (alert cascade) | Savings, Inbox |
| **EO-19 (Reallocation)** | Jars → Jars (mid-month movement) | Jars (internal) |
| **EO-20 (Split)** | Transactions → Categories/Jars (multi-mapping) | Transactions, Categories, Jars |

---

## Dependency Chain Lengths

### Longest Dependency Chains

1. **Tenancy → Accounts → Transactions → Categories → Inbox → Jars → Goals → Health** (8 hops)
   - Tenancy gates access → Account holds money → Transaction records movement → Category classifies it → Inbox bridges unmapped → Jar tracks intention → Goal receives funding → Health summarizes all

2. **EO-04 → EO-03 → Calendar Display** (3 hops)
   - Pattern defines recurrence → Calendar view shows upcoming → User sees bill due

3. **EO-02 → EO-13 → BR-22 → Card Interest Display** (3 hops)
   - Card APR data → Interest cost calculation → BR-22 ensures visibility → User sees cost

### Shortest Dependency Chains

1. **Health → User** (1 hop — Health reads, user consumes)
2. **EO-11 Export → User** (1 hop — export file, user downloads)
3. **EO-18 Celebration → User** (1 hop — notification fires, user sees)

---

## Hidden Dependency Risks

### Risk 1: Inbox Depends on 4 Source Domains
**Chain:** Transactions + Savings + Cards + Installments → Inbox
**Risk:** Inbox must handle ReviewItems from 4 different sources with different semantics. If any source domain changes its event format, Inbox may misinterpret.
**Mitigation:** Define ReviewItem type taxonomy with explicit contracts per source.

### Risk 2: MonthRitual Reads from 7 Domains
**Chain:** Transactions + Categories + Jars + Goals + Savings + Cards + Installments → Ritual
**Risk:** Ritual preview must aggregate data from 7 domains. If any domain is missing data, Ritual shows incomplete picture.
**Mitigation:** Ritual should validate data completeness before allowing approval. Missing data → Assisted mode, not Quick Close.

### Risk 3: Categories Touches 5 Operational Domains
**Chain:** Categories → Transactions + Jars + Planning + Inbox + Ritual
**Risk:** A category rename cascading through 5 domains. If rename is not transactional across domains, temporary inconsistency.
**Mitigation:** Categories should be immutable-once-used. Rename = create new category + migrate transactions.

---

## R1 → R2 Dependency Bridge

| R1 Feature | R2 Feature | Dependency Nature |
|------------|-----------|-------------------|
| EO-01 (Auto-Cat) | EO-16 (Auto-Resolution) | Foundation — auto-resolution builds on auto-categorization accuracy |
| EO-08 (Health R1) | EO-08 (Health R2) | Iteration — R2 insights need R1 data history |
| EO-07 (Batch Ops) | EO-16 (Auto-Resolution) | Complement — batch ops handle what auto-resolution misses |

---

## Summary

| Metric | Value |
|--------|-------|
| Critical path domains | 5 (Accounts, Transactions, Categories, Tenancy, Inbox) |
| Independent domains | 3 (Health, Goals-partial, Cards-limited) |
| Fully dependent domains | 3 (Transactions, Jars, Inbox) |
| Longest dependency chain | 8 hops (Tenancy → Health) |
| Most inbound dependencies (feature) | EO-01 (4 dependents) |
| Most outbound dependencies (feature) | EO-03, EO-13, EO-16 (1 each) |
| R1 → R2 bridge features | 3 (EO-01, EO-07, EO-08) |

**Architecture assessment:** ViNha's dependency graph is a directed acyclic graph (DAG). No circular dependencies. The long chain is expected (financial data flows from Real → Intention → Insight). The thin waist is the Inbox — 4 sources feed in, one domain resolves out. This is architecturally sound but operationally risky.
