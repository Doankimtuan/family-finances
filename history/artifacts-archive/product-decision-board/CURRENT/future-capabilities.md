# Future Capabilities Catalog

All features deferred by the Product Decision Board, organized by target version with activation criteria.

---

## v2.1 (Post-R2 Stability — Estimated Q3 2027)

### Category Sub-Tags (EO-17)
**Status:** Deferred from R1
**Description:** Optional sub-tags within categories for granular classification. Example: "Dining" → "Lunch", "Dinner", "Coffee".
**Activation Criteria:**
- Auto-categorization (EO-01) live for 6+ months with measurable accuracy
- Usage data shows demand for sub-classification
- Sub-tag UX validated with user testing
**Complexity:** Medium. Adds hierarchy to category model but contained within Categories domain.

---

## v2.5 (Post-v2.1 — Estimated Q1 2028)

### Goal Multi-Source Funding (EO-14)
**Status:** Deferred from R1
**Description:** Goals fundable from multiple jars; one jar funding multiple goals. Many-to-many relationship between goals and jars.
**Activation Criteria:**
- 6+ months of goal usage data
- User feedback confirms single-jar limitation as top pain point
- Health score iteration (EO-08) stabilized
**Complexity:** High. Cascades into allocation, reporting, and Health score logic.

### Savings Product Diversity (EO-22)
**Status:** Deferred from R1
**Description:** Support for CDs, money market accounts, treasury bonds, high-yield savings — beyond basic term deposits.
**Activation Criteria:**
- Basic savings model stable for 6+ months
- Savings maturity alerts (EO-12) functioning correctly
- User demand for specific product types validated
- Interest calculation logic designed for each product type
**Complexity:** High. Different interest methods, maturity behaviors, liquidity constraints per product type.

### Health Scenario Modeling (EO-25)
**Status:** Deferred from R1
**Description:** "What if" scenario modeling: interest rate changes, income changes, major purchase impact on financial health.
**Activation Criteria:**
- Health score iteration (EO-08) completed 2+ quarterly cycles
- Health score trust metrics: high engagement, low dispute rate
- Scenario engine design verified for BR-14 compliance
**Complexity:** High. Scenario engine is a new domain capability with strict BR-14 boundaries.

### Installment Variable Rate Support (EO-28)
**Status:** Deferred from R1
**Description:** Support for floating-rate installment plans with rate-change tracking and amortization recalculation.
**Activation Criteria:**
- Market data shows significant variable-rate adoption in Vietnam
- Fixed-rate model (EO-09) stable
- Rate-change tracking design complete
**Complexity:** Medium. Extends existing installment model with rate history and recalculation.

### Month Ritual Customization (EO-30)
**Status:** Deferred from R1
**Description:** Customizable ritual flow: choose which steps, order, depth of review.
**Activation Criteria:**
- Quick Close (EO-10) live for 6+ months
- Ritual step engagement data available
- Ritual abandonment rate understood
- Customization options designed from data, not speculation
**Complexity:** Medium. Configuration layer on top of existing ritual flow.

---

## v3 (Post-v2.5 — Estimated Q3 2028)

### Together Diverse Households (EO-15)
**Status:** Deferred from R1
**Description:** Support for roommates, multi-generational families, adult children with parents — beyond partner households.
**Activation Criteria:**
- Partner household model stable for 12+ months
- Market research confirms demand
- Domain model design complete with clear structure boundaries
- BR-01/BR-14 compliance verified for all structures
**Complexity:** Very High. Fundamental domain model expansion. New permission models, privacy boundaries, visibility rules per structure type.

### Together Permission Granularity (EO-29)
**Status:** Deferred from R1
**Description:** Granular permissions: view-only, jar-specific access, account-specific visibility. Beyond Partner/Admin binary.
**Activation Criteria:**
- Together Diverse Households (EO-15) designed and approved
- Permission model supports all diverse household types
- BR-01/BR-14 compliance verified for all permission levels
- Security audit completed
**Complexity:** Very High. Permission matrix affecting every feature. Must ship with EO-15.

---

## Future Capability Pack (No Target Date — Research Phase)

### Card Reward Tracking (EO-21)
**Status:** Deferred from R1
**Description:** Track cashback, points, miles. Reward optimization suggestions.
**Activation Criteria:**
- Core card features (EO-02, EO-13) stable
- User research confirms demand as top-3 request
- Reward data automatically sourceable (no manual entry)
**Complexity:** Medium. New reward domain with valuation and expiration logic.

### Account Type Sub-Classification (EO-27)
**Status:** Deferred from R1
**Description:** Fine-grained account types beyond current taxonomy (e.g., "High-Yield Checking" vs. "Basic Checking").
**Activation Criteria:**
- User feedback requesting finer distinctions
- Business logic differentiating behavior by sub-type
- EO-22 (Savings Product Diversity) implemented
**Complexity:** Low. Metadata extension with minimal behavior change.

---

## Version Roadmap Summary

| Version | Timeline (Est.) | Features | Complexity |
|---|---|---|---|
| **R0** | Current (S6 Complete) | Foundation: IA, Inbox, Onboarding | — |
| **R1 (MKP)** | S7-S12 | 15 Approved + 3 Modified features | High |
| **R2** | S13-S18 | Auto-Resolution Rules, PDF Export, Advanced Search, Enriched Health | Medium |
| **v2.1** | ~Q3 2027 | Category Sub-Tags | Medium |
| **v2.5** | ~Q1 2028 | Goal Multi-Source, Savings Diversity, Health Scenarios, Variable Rates, Ritual Customization | High |
| **v3** | ~Q3 2028 | Diverse Households, Permission Granularity | Very High |
| **Future Pack** | TBD | Card Rewards, Account Sub-Classification | Low-Medium |
