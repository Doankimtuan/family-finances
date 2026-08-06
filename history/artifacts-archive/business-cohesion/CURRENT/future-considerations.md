# Future Considerations

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

How deferred, rejected, and future features would affect business cohesion.

---

## Deferred Features (from Decision Board)

### EO-14: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown — depends on domain placement and integration design.

---

### EO-15: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-16: Inbox Auto-Resolution Rules (R2)

| Property | Assessment |
|----------|------------|
| **Domain** | Inbox |
| **Current cohesion concern** | Without ReviewItem type taxonomy (IO-01), auto-resolution is dangerous. A single "auto-map to Miscellaneous" rule would apply to savings maturities, card reminders, and unmapped expenses alike. |
| **Cohesion if done right** | **STRENGTHENS** — reduces Inbox bottleneck, improves automation, makes Inbox Zero sustainable for experienced users. |
| **Cohesion if done wrong** | **CRITICAL FRAGMENTATION** — auto-resolution on undifferentiated ReviewItems creates silent financial errors. |
| **Prerequisites** | IO-01 (ReviewItem type taxonomy), IO-06 (Health → Inbox priority) |
| **Recommendation** | Ship only after IO-01 is complete. Scope auto-resolution to UnmappedExpense type only. Require explicit rules per type. |

---

### EO-17: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-21: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-22: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-25: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-27: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-28: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-29: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

### EO-30: (Referenced but not detailed — presumed future)

**Cohesion impact if added:** Unknown.

---

## Future Capabilities (FC-01 through FC-20)

*Since FC details are not provided in the specification, this section analyzes capability types and their cohesion implications.*

### Capability Type A: More Automation (e.g., FC-XX Auto-Budget Adjustment)

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **STRENGTHENS** — automation that learns from patterns reduces manual work, strengthens feedback loops. But automation must respect BR-14 (never move real money without user intent) and BR-01 (Real ≠ Intention). |
| **Risk** | Over-automation creates "set and forget" behavior. Users disengage. Financial awareness drops. Month Ritual becomes a rubber stamp. |
| **Mitigation** | Any automation should increase ritual engagement, not replace it. Automation suggestions, not decisions. |

---

### Capability Type B: More Insights (e.g., FC-XX Predictive Analytics)

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **STRENGTHENS** if placed in Health (BR-14: read-only). **FRAGMENTS** if placed in a new domain that duplicates Health's role. |
| **Risk** | If insights suggest actions ("You'll overspend Dining by $50 next month — reduce now"), the boundary between Health (read-only mirror) and Planning (active intention) blurs. |
| **Mitigation** | All insights live in Health. Insights suggest, Planning acts. Clear BR-14 boundary: "Health says X, you decide to do Y in Planning." |

---

### Capability Type C: External Integrations (e.g., FC-XX Bank Sync)

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **STRENGTHENS** — auto-imported transactions reduce manual capture. But external data must be treated as "suggested" until user confirms. |
| **Risk** | Auto-imported transactions bypass Inbox entirely. BR-05 (unmapped → Inbox) never fires. External data quality issues (wrong amounts, duplicates) create silent errors. |
| **Mitigation** | Imported transactions enter Inbox just like any other transaction. External source is flagged: "Imported from Chase — confirm?" User confirms before jar mapping. |

---

### Capability Type D: Multi-Currency Support

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **FRAGMENTS** — currency conversion adds complexity to every money lifecycle. Transactions in different currencies. Jars in different currencies. Health score with exchange rate dependency. Every cross-domain integration must handle currency. |
| **Risk** | BR-01 (Real ≠ Virtual) gets harder: transferring money between accounts in different currencies is a Real event with exchange rate implications. The simple "transaction = amount" model breaks. |
| **Mitigation** | Multi-currency is its own bounded context (Currency Exchange). It wraps existing domains, doesn't change them. All internal calculations use a base currency. |

---

### Capability Type E: Investment Tracking

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **STRENGTHENS** if added to Savings domain (another savings product type). **FRAGMENTS** if a new "Investments" domain duplicates Savings' maturity/alert/Inbox patterns. |
| **Risk** | Investments have fluctuating value, not fixed maturity. The Savings → Inbox maturity flow doesn't apply. New lifecycle needed. |
| **Mitigation** | Extend Savings domain to support variable-value products. Same BR-10 (maturity → Inbox) triggers for fixed-term. New "Value Change" event for variable products. |

---

### Capability Type F: Tax Preparation

| Property | Assessment |
|----------|------------|
| **Cohesion if added** | **STRENGTHENS** if it's a read-only Health insight ("tax estimate based on your income"). **FRAGMENTS** if it becomes a new domain that writes tax data to transactions. |
| **Risk** | Tax categories differ from spending categories. A new "Tax Category" taxonomy fragments the Categories domain. |
| **Mitigation** | Tax tagging is metadata on existing transactions and categories, not a new domain. Health summarizes tax-relevant data. No new mutations. |

---

## Cohesion Impact Summary

### Features That Would STRENGTHEN Cohesion

| Feature Type | Why |
|-------------|-----|
| **More Automation (FC-A)** | Reduces manual work; improves feedback loops |
| **More Insights (FC-B)** | If in Health (BR-14); more data → better reflection |
| **External Integrations (FC-C)** | If treated as suggestions through Inbox; reduces manual data entry |
| **Investment Tracking (FC-E)** | If extends Savings domain; reuses maturity/alert patterns |
| **Tax Preparation (FC-F)** | If read-only Health insight; enriches Month Ritual |

### Features That Would FRAGMENT Cohesion

| Feature Type | Why |
|-------------|-----|
| **More Insights (FC-B)** | If outside Health — duplicates read-only mirror role |
| **Multi-Currency (FC-D)** | Adds currency dimension to every money lifecycle |
| **More Automation (FC-A)** | If automation makes decisions instead of suggestions (BR-14 violation) |
| **External Integrations (FC-C)** | If bypass Inbox — silent errors, BR-05 never fires |
| **New Domains without Integration Contracts** | Any new domain that doesn't define its Inbox/Health/Real/Intention contract upfront |

---

## Guidance for Future Feature Design

### Pre-Integration Checklist

Before adding any new feature or domain, answer:

1. **Which existing domain OWNS this concept?** (Single owner — never split)
2. **Does this feature WRITE to Real Ledger or Intention Plan?** (Must choose one; BR-01)
3. **Does this feature MUTATE money?** (If yes, it's Real Ledger. If no, it could be Intention or Health.)
4. **Does this feature READ financial data for insights?** (If yes, it's Health-adjacent. Must follow BR-14.)
5. **Does this feature create events that flow through Inbox?** (If yes, define the ReviewItem type and resolution contract.)
6. **Does this feature touch Categories?** (If yes, define how it maps to Jars.)
7. **Which feedback loops does this feature strengthen or break?**
8. **Does this feature create a new integration between two previously unconnected domains?** (If yes, define the integration contract.)

### Future Feature Architecture Principles

1. **Health is always the final destination.** Any new insight capability goes in Health, not a new domain.
2. **Inbox is always the integration hub.** Any new cross-domain event flows through Inbox. Never create direct domain-to-domain event channels that bypass Inbox.
3. **Categories is always the shared taxonomy.** Any new classification concept extends Categories, not creates a parallel taxonomy.
4. **Tenancy is always the gate.** Any new domain must honor BR-02 (auth + membership) and BR-02a (RLS).
5. **Real ≠ Intention (BR-01) is always sacred.** If a new feature blurs the line between "what money do we have" and "what do we plan to do with it," redesign.
