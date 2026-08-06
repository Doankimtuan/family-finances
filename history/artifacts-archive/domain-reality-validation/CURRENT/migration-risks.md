# Domain Reality Validation — Migration Risks

## What Would Break If We Evolved Any Domain?

This document assesses the migration risks, costs, and user expectation disruptions that would accompany domain evolution. Each evolution opportunity identified in the priority matrix carries migration implications.

---

## Architecture Risks by Domain

### Categories — Auto-Categorization (EO-01)
**Migration Risk: LOW**
- Category model remains tag-based; auto-tagging adds a suggestion layer, not a structural change
- Existing manual categories are unaffected
- Risk: Auto-categorization confidence scores need storage — new field on CategoryAssignment, additive only

**Architecture Impact:**
- New service: CategoryAutoTagger (ML or rule-based)
- New field: `confidence_score` on category assignment
- New UX: Suggested categories with accept/override actions
- No existing data migration needed

**Data Risk:** Cold start — no training data at launch
**User Disruption:** None. Manual categorization still works. Auto is additive.

---

### Cards — Payment Due Dates + Interest Display (EO-02, EO-13)
**Migration Risk: LOW**
- Card entity gains display fields (due date, minimum payment, interest rate)
- No structural change to card model
- Risk: Users may have cards without these fields populated — graceful degradation needed

**Architecture Impact:**
- New fields on Card entity: `payment_due_date`, `minimum_payment`, `apr`, `grace_period_days`
- New notification triggers: payment_due_soon, payment_overdue
- Additive only; existing card data unchanged

**Data Risk:** Historical cards won't have payment data
**User Disruption:** None. New cards get full data; old cards show what they have.

---

### Planning — Simplify to Patterns (EO-04)
**Migration Risk: MEDIUM-HIGH**
- This is the riskiest migration in the current opportunity set
- Existing Planning rules may not map cleanly to a lighter Pattern model
- Users who have configured complex rules may lose functionality or need reconfiguration

**Architecture Impact:**
- Potentially new domain entity: RecurringPattern replacing or complementing PlanningRule
- Data migration: Rule-to-Pattern conversion (lossy — some rule features may not survive)
- If Planning rules are deeply integrated with Inbox and Jar allocation, the ripple effects are significant

**Data Risk:** Existing rules may not convert cleanly to patterns
**User Disruption:** Medium — users with configured rules may need to reconfigure
**Recommendation:** Do this early, before users accumulate complex rule configurations. The longer Planning stays as-is, the harder this migration becomes.

---

### Inbox — Batch Operations + Auto-Resolution (EO-07, EO-16)
**Migration Risk: LOW-MEDIUM**
- Batch operations: New UX on existing InboxItem model — low risk
- Auto-resolution rules: New rule type on InboxItem processing — low risk structurally
- Risk: Auto-resolution could incorrectly resolve items, creating user trust issues

**Architecture Impact:**
- New: BatchOperation entity (or UX-only, depending on implementation)
- New: AutoResolutionRule entity linked to Inbox processing
- InboxItem gains `resolution_source` field (manual | auto | batch)

**Data Risk:** Auto-resolution mistakes could incorrectly categorize transactions
**User Disruption:** Low for batch operations. Medium for auto-resolution (must be transparent about what was auto-resolved).

---

### Transactions — Split Support (EO-20)
**Migration Risk: MEDIUM**
- Transaction splits are a structural change to the transaction model
- A split transaction is one real transaction divided across multiple categories with individual amounts
- Existing transactions don't have split data — cannot retroactively split

**Architecture Impact:**
- New entity: TransactionSplit (parent_transaction_id, amount, category)
- Transaction gains `is_split` flag
- Sum of split amounts must equal transaction amount (data integrity constraint)
- Affects: Category reports, jar tracking, Inbox review (split transactions in Inbox)

**Data Risk:** Cannot retroactively split — users must manually split from this point forward
**User Disruption:** Low to medium — splits are a new capability; existing transactions are unchanged. But users may want to split past transactions and can't.

---

### Goals — Multi-Source Funding (EO-14)
**Migration Risk: MEDIUM**
- Current model: Goal linked to single jar
- Future model: Goal funded from multiple jars, or from unspecified sources
- Structural change to Goal-Jar relationship

**Architecture Impact:**
- Goal-Jar relationship changes from 1:1 to 1:N (or Goal becomes independent of jars)
- New entity: GoalAllocation (goal_id, jar_id, amount, percentage)
- Existing goals must be migrated to new relationship model

**Data Risk:** All existing goals need migration — manageable with automated conversion
**User Disruption:** Low — multi-source funding is additive; single-source goals still work.

---

### Together — Diverse Households (EO-15)
**Migration Risk: HIGH**
- Current model: Household with members (simple composition)
- Diverse model: Multi-generational, roommates, shared custody — complex composition
- This affects permissions, policy enforcement, and the fundamental assumption of "partners"

**Architecture Impact:**
- Household composition becomes a structured concept: CompositionType (partners | roommates | family | custom)
- Member roles may expand beyond "partner" to include "dependent," "contributor," "viewer"
- Policy model may need composition-aware rules
- This is a deep architectural change, not a surface feature

**Data Risk:** Existing households (partners model) must migrate to composition model
**User Disruption:** Low for partner households (default). New household types see the expanded model.
**Recommendation:** Design the composition model now, implement only partners for MKP. Future-proof without building.

---

### Health — Scenario Modeling (EO-25)
**Migration Risk: LOW**
- Health is read-only; scenario modeling adds "what-if" projections without writing
- Additive only; no migration needed

**Architecture Impact:**
- New: HealthScenario entity (parameters, projection_result, created_at)
- Health query layer gains scenario projection capability
- BR-14 enforcement: scenarios are projections, not mutations

**Data Risk:** None
**User Disruption:** None — additive feature.

---

### Savings — Product Diversity (EO-22)
**Migration Risk: LOW-MEDIUM**
- Current model: SavingsAccount with type, term, rate, maturity
- Diverse model: More account subtypes (CD, MMA, Treasury, HYSA)
- The existing model supports extension via the `type` field

**Architecture Impact:**
- SavingsAccount `type` enum expands: SAVINGS | CD | MMA | TREASURY | HYSA
- New fields per type: penalty_period, compounding_frequency, callable_date
- Additive only with nullable new fields

**Data Risk:** Existing savings accounts default to generic SAVINGS type
**User Disruption:** None — new account types are additive.

---

### Budgets/Jars — Sub-Jars (EO-26)
**Migration Risk: MEDIUM-HIGH**
- Sub-jars create a hierarchy: Parent Jar → Child Jars
- This changes jar allocation, reporting, and the flat mental model
- Risk: Users create deep hierarchies that become unmanageable

**Architecture Impact:**
- Jar gains `parent_jar_id` (self-referential)
- Allocation rules: parent allocation = sum of child allocations (constraint)
- Reporting must handle hierarchy: roll-up and drill-down
- This is architecturally significant — the flat jar model was a deliberate choice

**Data Risk:** Existing flat jars can remain flat; only new jars get hierarchy
**User Disruption:** Medium — hierarchy changes the mental model of "what's a jar?"

**Recommendation:** Defer until user research proves hierarchy is needed. The flat model's simplicity is a feature.

---

## Product Risks

### Risk 1: Evolution Breaks the "Calm Finance" Promise
Each evolution opportunity adds complexity. The cumulative effect of EO-01 through EO-30 could transform ViNha from a calm, focused system into a complex dashboard — exactly what it's designed to replace.

**Severity:** HIGH
**Mitigation:** Gate every evolution through the simplicity validation lens. Ask: "Does this make household finance calmer or more complex?"

### Risk 2: Feature Parity Arms Race
Competitors will continue adding features. Chasing feature parity (net worth, AI, investments, reports) risks diluting ViNha's differentiated value.

**Severity:** MEDIUM
**Mitigation:** Add features that strengthen ViNha's differentiators (household, Inbox, ritual), not features that make ViNha more like competitors.

### Risk 3: User Expectation Disruption
Users who adopt ViNha for its simplicity may resist evolution that adds complexity. Conversely, users from competitors may expect rapid feature expansion.

**Severity:** MEDIUM
**Mitigation:** Progressive disclosure. New features should be opt-in or progressively revealed, not forced on all users.

### Risk 4: BR Violations Through Evolution
Evolution opportunities that cross domain boundaries risk violating business rules. Example: Health scenario modeling (EO-25) that starts feeling like "Health is telling me what to do" → BR-14 violation.

**Severity:** MEDIUM-HIGH
**Mitigation:** BR compliance review for every evolution opportunity before implementation.

---

## User Expectation Disruptions

### Expectation: "I Thought Categories Were Automatic"
Users from Copilot or Monarch will expect auto-categorization. Its absence at launch is a competitive gap; adding it later may feel like "finally catching up" rather than innovation.

**Severity:** MEDIUM
**Timeline:** Should be a near-term (0-6 month post-launch) addition.

### Expectation: "Where's Net Worth?"
Users from any competitor will expect net worth tracking. Its absence is a deliberate choice (F-Wealth) but users won't know that.

**Severity:** MEDIUM-HIGH
**Mitigation:** Clear communication about ViNha's focus (Real + Plan, not Wealth). "Coming later" messaging.
**Timeline:** Medium-term (F-Wealth, 2-3 years).

### Expectation: "I Want to See My Investments"
Users with investment accounts will see incomplete financial picture.

**Severity:** MEDIUM
**Mitigation:** Manual investment account tracking (balance-only) as a bridge before full F-Wealth.
**Timeline:** Medium-term.

### Expectation: "Why Can't I Just Skip the Ritual?"
Users who find the month ritual burdensome may resent its mandatory nature.

**Severity:** LOW-MEDIUM
**Mitigation:** Quick-close option (EO-10) before users demand removal.
**Timeline:** Monitor post-launch; if ritual abandonment is high, prioritize EO-10.

---

## Migration Cost Summary

| Domain | Evolution | Migration Complexity | Data Risk | User Disruption | Overall Risk |
|--------|----------|---------------------|-----------|-----------------|-------------|
| Categories | Auto-Tagging | Low | Low | None | LOW |
| Cards | Payment Dates | Low | Low | None | LOW |
| Cards | Interest Display | Low | Low | None | LOW |
| Planning | Simplify Patterns | High | Medium | Medium | MEDIUM-HIGH |
| Inbox | Batch Operations | Low | Low | Low | LOW |
| Inbox | Auto-Resolution | Medium | Medium | Medium | MEDIUM |
| Transactions | Splits | Medium | Medium | Low | MEDIUM |
| Goals | Multi-Source | Medium | Medium | Low | MEDIUM |
| Together | Diverse Households | High | Medium | Low | HIGH |
| Health | Scenarios | Low | None | None | LOW |
| Savings | Product Diversity | Low | Low | None | LOW |
| Budgets | Sub-Jars | High | Low | Medium | MEDIUM-HIGH |

---

## The "Do Nothing" Risk

The largest migration risk is NOT evolving. If ViNha stays static:
- Auto-categorization gap widens vs competitors
- Card payment management absence causes user financial harm
- Planning complexity drives user confusion
- Inbox backlog becomes unusable
- Health remains unproven value

**"Do nothing" carries higher risk than measured evolution.**

---

*Migration risks assessed. All evolution opportunities have manageable migration paths except Planning simplification (EO-04), Together diversity (EO-15), and Jar hierarchies (EO-26), which carry high migration risk and should be approached with caution or deferred.*
