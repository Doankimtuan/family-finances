# Architecture Impact

Architecture implications of all Product Decision Board decisions. This document identifies what changes in the domain model, module boundaries, and cross-domain relationships — without specifying implementation details.

---

## Domain Boundary Changes

### Planning Module: Complete Domain Model Replacement

**Current State:** PlanningRule engine with priority, conflict resolution, chaining, conditional logic.
**Target State (EO-04, R1):** RecurringPattern model — simple, flat patterns describing recurring transactions.

**Domain Concept Changes:**
- **New:** `RecurringPattern` — merchant pattern, amount range, frequency, category, direction
- **Retired:** `PlanningRule`, `RulePriority`, `RuleConflict`, `RuleChain`, `ConditionalRule`
- **Relocated (BR-04):** `IncomePlacement` — moves from Planning to Tenancy/Household module

**Boundary Change:** Planning module becomes simpler; the complex rule engine boundary collapses.

### Categories Module: New Auto-Categorization Subdomain

**New Domain Concept (EO-01, R1):** `AutoCategoryRule` — user-defined or system-default merchant-to-category mapping.

**New Cross-Domain Relationship:** Categories → Transactions (read: merchant name for suggestion matching).

### Cards Module: New Payment and Interest Subdomains

**New Domain Concepts (EO-02, EO-13, R1):**
- `CardPaymentTracking` — due date, minimum payment, reminder configuration
- `InterestCostDisplay` — estimated interest, YTD interest, interest trend (derived)

**New Cross-Domain Relationships:**
- Cards → Inbox (payment reminders as ReviewItems)
- Cards → Notifications (push notification for due dates)

### Inbox Module: Batch and Auto-Resolution Subdomains

**New Domain Concepts:**
- (EO-07, R1): `BatchOperation` — multi-item action execution
- (EO-16, R2): `AutoResolutionRule` — merchant pattern → category + jar; `AutoResolutionLog` — permanent audit trail

**New Cross-Domain Relationships:**
- Inbox → Categories (auto-resolution rules reference categories)
- Inbox → Budgets/Jars (auto-resolution rules reference jars)
- Inbox → Together (partner notification for rule changes)

### Installments Module: Amortization Subdomain

**New Domain Concept (EO-09, R1):** `AmortizationSummary` — calculated interest breakdown per installment.

### Savings Module: Maturity Tracking Subdomain

**New Domain Concepts (EO-12, R1):** `MaturityTracking` — countdown, alerts, maturity action.

**New Cross-Domain Relationship:** Savings → Inbox (maturity alerts and maturity ReviewItems).

### Transactions Module: Split Subdomain

**New Domain Concept (EO-20, R1):** `TransactionSplit` — portions of a transaction assigned to different categories/jars.

### Health Module: Analytics Subdomain

**New Domain Concepts (EO-08, R1):** `HealthSnapshot` — monthly score record; `HealthInsight` — actionable recommendation.

### Goals Module: Milestone Tracking

**New Domain Concept (EO-18, R1):** `GoalMilestone` — 25/50/75/100 celebration tracking.

### Budgets/Jars Module: Template and Reallocation Subdomains

**New Domain Concepts:**
- (EO-06, R1): `JarTemplate` — pre-built jar configuration (seed data)
- (EO-19, R1): `JarReallocation` — money movement between jars with ledger transaction creation

### Month Close Module: Quick Close Subdomain

**New Domain Concept (EO-10, R1):** `QuickClose` — simplified ritual path with summary sections.

---

## Cross-Domain Dependency Matrix (New/Modified Relationships)

| From Module | To Module | Relationship | Source | Version |
|---|---|---|---|---|
| Categories | Transactions | Read merchant names | EO-01 | R1 |
| Cards | Inbox | Create payment reminder ReviewItems | EO-02 | R1 |
| Cards | Notifications | Send push notifications | EO-02 | R1 |
| Planning (Calendar) | Planning (Patterns) | Read patterns for calendar | EO-03 | R1 |
| Inbox | Categories | Reference categories in rules | EO-16 | R2 |
| Inbox | Budgets/Jars | Reference jars in rules | EO-16 | R2 |
| Inbox | Together | Partner notification for rules | EO-16 | R2 |
| Savings | Inbox | Maturity alerts + ReviewItems | EO-12 | R1 |
| Budgets/Jars | Ledger | Create reallocation transactions | EO-19 | R1 |
| Health | (Read-only from all modules) | BR-14 enforcement | EO-08 | R1 |

---

## Module Complexity Assessment

| Module | Current Complexity | Post-Decision Complexity | Change |
|---|---|---|---|
| Planning | High (rule engine) | Low (simple patterns) | ↓ Significant reduction |
| Categories | Low | Medium (auto-categorization) | ↑ New subdomain |
| Cards | Low | Medium (payments, interest) | ↑ Two new subdomains |
| Inbox | Medium | High (batch, auto-resolution) | ↑ Significant new capability |
| Installments | Low | Medium (amortization) | ↑ New subdomain |
| Savings | Low | Medium (maturity tracking) | ↑ New subdomain |
| Transactions | Medium | Medium-High (search, splits) | ↑ Moderate increase |
| Health | Low | Medium (analytics) | ↑ New subdomain |
| Goals | Low | Low (milestone tracking) | → Minor addition |
| Budgets/Jars | Medium | Medium-High (templates, reallocation) | ↑ New subdomains |
| Month Close | Medium | Medium (quick close) | → Minor addition |
| Together | Medium | Medium (unchanged) | → No significant change |

---

## Architecture Principles Preserved

1. **BR-01 (Real Ledger ≠ Virtual Jars):** No cross-domain relationship created between Jars and Accounts. Jar reallocations (EO-19) go through Ledger, not direct jar-to-jar.
2. **BR-14 (Health is Read-Only):** Health reads from other modules but never writes. No Health → Jars/Accounts/Transactions write paths.
3. **Bounded Context Integrity:** Each module remains independently deployable. Cross-domain communication is via API, not direct database access.
4. **Simplicity:** The Planning module simplification (EO-04) is the most significant architectural improvement — removing a complex rule engine in favor of a simple pattern model.
