# Deferred Features

All features in this document have been reviewed and found valuable — but not right now. Each has a target version, rationale, and activation criteria.

---

## EO-14: Goal Multi-Source Funding

**Domain:** Goals
**Validation Score:** 39 (Middle Tier)
**Target Version:** v2.5
**Deferral Rationale:** The current single-jar-per-goal model is simpler and sufficient for MKP. Multi-source funding adds relationship complexity (many-to-many between goals and jars) that cascades into allocation logic, reporting, and the Health score. This is a worthwhile evolution but premature before the base goal model is validated with usage data.
**Activation Criteria:**
- 6+ months of goal usage data showing users actively managing goals
- User feedback indicating single-jar limitation is a top pain point
- Health score iteration (EO-08) has stabilized

**Risks of Deferral:** Users with complex savings strategies may find the goal model limiting. Mitigated by: jar reallocation UX (EO-19) that provides flexibility within the single-jar model.

---

## EO-15: Together Diverse Households

**Domain:** Together
**Validation Score:** 37 (Middle Tier)
**Target Version:** v3
**Deferral Rationale:** Current household model is designed for partner households. Diverse structures (roommates, multi-generational, adult children) introduce fundamentally different permission models, privacy boundaries, and financial visibility rules. This is not an incremental feature — it's a domain model expansion that requires significant research and design. The partner-focused model must prove itself first.
**Activation Criteria:**
- Partner household model stable with 12+ months of usage
- Market research indicates significant demand for diverse structures
- Domain model design complete with clear boundaries for each structure type
- BR-01 and BR-14 compliance design verified for all new structures

**Risks of Deferral:** Excludes non-partner households from the product. Mitigated by: the product's core value proposition (partners managing money together) remains intact; diverse structures are an expansion, not core.

---

## EO-17: Category Sub-Tags

**Domain:** Categories
**Validation Score:** 34 (Middle Tier)
**Target Version:** v2.1
**Deferral Rationale:** Sub-tags add a hierarchy layer to the category system that complicates the mental model (flat categories → nested sub-tags). Before adding hierarchy, the auto-categorization system (EO-01) must mature and prove that the flat category model is genuinely insufficient. Many users never need sub-tags if categories are well-designed.
**Activation Criteria:**
- Auto-categorization (EO-01) has been live for 6+ months
- Usage data shows users consistently creating workarounds for sub-classification needs
- Category hierarchy UX design validated with user testing

**Risks of Deferral:** Power users wanting granular classification may find the flat model constraining. Mitigated by: transaction search/filtering (EO-05) and splits (EO-20) providing alternative ways to organize transactions.

---

## EO-21: Card Reward Tracking

**Domain:** Cards
**Validation Score:** 33 (Lower Tier)
**Target Version:** Future Capability Pack
**Deferral Rationale:** Reward tracking (cashback, points, miles) is an optimization feature, not a money management foundation. It adds complexity (reward types, valuation, expiration) without addressing the core "where is my money" question. This is a nice-to-have for financially sophisticated users but not a need-to-have for the target market.
**Activation Criteria:**
- Core card features (EO-02 due dates, EO-13 interest) are stable and well-adopted
- User research indicates reward optimization is a top-3 requested feature
- Reward data can be automatically sourced (not requiring manual entry)

**Risks of Deferral:** Users who optimize credit card rewards may look elsewhere. Mitigated by: reward tracking is available in many standalone apps; ViNha focuses on what it does uniquely.

---

## EO-22: Savings Product Diversity

**Domain:** Savings
**Validation Score:** 36 (Middle Tier)
**Target Version:** v2.5
**Deferral Rationale:** Current savings model handles basic term deposits adequately. Supporting CDs, money market accounts, treasury bonds, and high-yield savings requires: different interest calculation methods, different maturity behaviors, different liquidity constraints, and different regulatory classifications. This is a specialized domain that benefits from waiting until the base savings model is proven.
**Activation Criteria:**
- Basic savings model (term deposits) stable with 6+ months of usage
- Savings maturity alerts (EO-12) functioning correctly
- User demand for specific product types validated through feedback
- Interest calculation logic designed and tested for each new product type

**Risks of Deferral:** Users with diverse savings products can't fully model their savings. Mitigated by: basic savings can represent most common products with manual adjustments.

---

## EO-25: Health Scenario Modeling

**Domain:** Health
**Validation Score:** 37 (Middle Tier)
**Target Version:** v2.5
**Deferral Rationale:** "What if" scenario modeling is a powerful feature that requires a stable, trusted Health score as its foundation. Scenario modeling with an immature score produces misleading results that damage trust. The Health score must prove its accuracy and usefulness (EO-08 iteration) before scenarios can be built on top of it.
**Activation Criteria:**
- Health score iteration (EO-08) has completed 2+ quarterly cycles
- Health score trust metrics: user engagement with insights, low dispute rate
- Scenario engine design: clear boundaries about what is modeled and what is assumed
- BR-14 compliance: scenarios are "what if" projections, not recommendations

**Risks of Deferral:** Competitors (Simplifi) offer cash flow projections, which are a form of scenario modeling. Mitigated by: recurring bill calendar (EO-03) provides near-term visibility; full scenario modeling targets v2.5 when Health is mature.

---

## EO-27: Account Type Sub-Classification

**Domain:** Accounts
**Validation Score:** 30 (Lower Tier)
**Target Version:** Future Capability Pack
**Deferral Rationale:** The current account taxonomy (checking, savings, credit card, loan, investment) covers the vast majority of use cases. Finer-grained classification (e.g., "High-Yield Checking" vs. "Basic Checking") adds metadata complexity without meaningful product behavior differences. This is taxonomy refinement with low user-facing value.
**Activation Criteria:**
- User feedback specifically requesting finer account distinctions
- Business logic that actually differentiates behavior based on sub-types
- Savings product diversity (EO-22) implemented, creating natural need for sub-types

**Risks of Deferral:** Minimal. Account sub-types don't change any product behavior.

---

## EO-28: Installment Variable Rate Support

**Domain:** Installments
**Validation Score:** 38 (Middle Tier)
**Target Version:** v2.5
**Deferral Rationale:** Variable-rate installments (floating interest rates that change over the loan term) are an edge case in the Vietnam consumer finance market, where fixed-rate installment plans dominate. Supporting variable rates requires: rate change tracking, amortization recalculation, and rate-history management. The complexity is not justified by current market prevalence.
**Activation Criteria:**
- Market data shows significant adoption of variable-rate consumer installment products in Vietnam
- Fixed-rate installment model (with EO-09 interest visibility) is stable
- Rate-change tracking design complete

**Risks of Deferral:** Users with variable-rate loans can't accurately track their installments. Mitigated by: users can manually update the effective rate periodically; the system shows a "rate may have changed" reminder.

---

## EO-29: Together Permission Granularity

**Domain:** Together
**Validation Score:** 39 (Middle Tier)
**Target Version:** v3
**Deferral Rationale:** Granular permissions (view-only, jar-specific access, account-specific visibility) add a permission matrix that complicates every feature. Currently, Partner/Admin is simple, clear, and sufficient for partner households. Granular permissions are primarily needed for diverse household structures (EO-15), which are also deferred to v3. These two features should ship together.
**Activation Criteria:**
- Together Diverse Households (EO-15) designed and approved
- Permission model designed to support all diverse household types
- BR-01 and BR-14 compliance verified for all permission levels
- Security audit of permission model completed

**Risks of Deferral:** None until diverse household structures are supported. Partner/Admin is adequate for the current scope.

---

## EO-30: Month Ritual Customization

**Domain:** Month Close
**Validation Score:** 33 (Lower Tier)
**Target Version:** v2.5
**Deferral Rationale:** Customizable ritual flow (which steps, what order, what depth) is premature optimization. The ritual is a designed behavioral mechanism; its structure is intentional. Customization before the ritual has proven its value through sustained usage risks users removing the most valuable steps. Let the ritual stabilize (with Quick Close as the only variation — EO-10) before offering customization.
**Activation Criteria:**
- Month Ritual Quick Close (EO-10) has been live for 6+ months
- Usage data shows which ritual steps have highest/lowest engagement
- Ritual abandonment rate is measurable and understood
- Customization options designed based on data, not speculation

**Risks of Deferral:** Users who find certain ritual steps irrelevant may feel the flow is rigid. Mitigated by: Quick Close (EO-10) provides a lighter path without removing any steps from the full ritual.
