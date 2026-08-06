# Domain Reality Validation — Recommendations

## Board Recommendations Organized by Priority

---

## Critical (Must Do Before or Immediately After Launch)

These recommendations address competitive gaps, financial safety concerns, or structural risks that could undermine ViNha's viability.

### REC-01: Implement Category Auto-Tagging (Post-Launch, Within 6 Months)
**Reference:** EO-01
**Rationale:** Every major competitor offers auto-categorization. Launching without it is acceptable (manual + merchant rules), but the gap must be closed quickly. Users migrating from Copilot, Monarch, or Simplifi will expect it.
**Approach:** Start with rule-based merchant → category mapping. Add ML-based suggestions once transaction volume provides training data. Always suggest-with-override, never auto-commit.
**Validation Gate:** 80%+ auto-categorization accuracy within 3 months of training data accumulation.

### REC-02: Add Card Payment Due Date Visibility
**Reference:** EO-02
**Rationale:** Missing a credit card payment has severe financial consequences (late fees, penalty APRs, credit score impact). ViNha's card model currently doesn't surface payment due dates. This is a financial safety issue, not a feature request.
**Approach:** Add `payment_due_date`, `minimum_payment`, and `apr` fields to Card entity. Add payment reminder notifications. Display due date prominently in Money view.
**Validation Gate:** User can see payment due date for every credit card. Notifications fire before due dates.

### REC-03: Simplify Planning Domain to Recurring Patterns
**Reference:** EO-04
**Rationale:** The current Planning domain's rules engine (conditions, actions, priorities) is over-engineered for what users need. Simplifi's "spending plan" and YNAB's "scheduled transactions" are more intuitive patterns. Simplify before users accumulate complex rule configurations.
**Approach:** Replace or simplify PlanningRule with RecurringPattern: merchant, amount pattern, frequency, category. Keep income placement (BR-04) at the household level. Defer conditional rules (EO-23) until user research proves they're needed.
**Validation Gate:** Users can set up recurring income and expense patterns in under 2 minutes without documentation.

### REC-04: Enforce BR Compliance in All Evolution Work
**Reference:** BR-01, BR-07, BR-08, BR-14
**Rationale:** The business rules are ViNha's architectural constitution. Evolution opportunities (especially EO-25 Health scenarios, EO-16 Inbox auto-resolution) must not violate BR boundaries. BR-14 (Health must not write) and BR-01 (Real ≠ Virtual) are non-negotiable.
**Approach:** BR compliance checklist for every feature spec. Architecture review for cross-domain features. Automated tests that verify BR-14 (Health write attempted → rejected).
**Validation Gate:** Zero BR violations in production.

---

## High Priority (Should Do Within 12 Months)

These recommendations significantly improve user experience, financial health, or competitive positioning.

### REC-05: Build Recurring Bill Calendar
**Reference:** EO-03
**Rationale:** Users want to know "what bills are coming up." Simplifi's cash flow projections are a major competitive feature. ViNha already has the data (recurring patterns from Planning, upcoming transactions); it needs a calendar visualization.
**Approach:** Calendar view of upcoming recurring bills and income. Projected account balance based on scheduled transactions. "Low balance" warnings before large bills.
**Validation Gate:** Calendar shows accurate upcoming bills within 1 week of recurring pattern data establishment.

### REC-06: Add Inbox Batch Operations
**Reference:** EO-07
**Rationale:** As transaction volume grows, reviewing items one-by-one becomes tedious. Batch categorization, batch jar assignment, and bulk dismiss are necessary for Inbox to scale.
**Approach:** Select multiple InboxItems. Apply same action to all (categorize, assign jar, dismiss). Review-by-merchant: "All Grab transactions → Transport."
**Validation Gate:** User can categorize 10 InboxItems in under 30 seconds.

### REC-07: Add Transaction Split Support
**Reference:** EO-20
**Rationale:** Multi-purpose purchases (e.g., one supermarket receipt with groceries and household items) cannot be accurately categorized without splits. This creates data quality issues that cascade through reports, jar tracking, and Health scoring.
**Approach:** Allow splitting a transaction across multiple categories with individual amounts. Sum of splits must equal transaction amount. Splits visible in Inbox review.
**Validation Gate:** User can split a transaction in under 15 seconds.

### REC-08: Show Installment Interest Costs
**Reference:** EO-09
**Rationale:** Users with installment debt need to understand how much interest they're paying. Without interest visibility, they can't make informed decisions about prepayment or debt prioritization.
**Approach:** Display amortization summary: total interest paid, remaining interest, principal vs interest breakdown per payment. Do not build full amortization schedules (future capability).
**Validation Gate:** User can see interest paid and remaining for each installment.

### REC-09: Add Data Export
**Reference:** EO-11
**Rationale:** Data portability builds trust. Users need to export data for tax preparation, financial advisor meetings, or switching tools. Export capability also reduces churn risk — users who can leave easily are more likely to stay.
**Approach:** CSV export for transactions and accounts. PDF export for monthly summaries. Simple, functional, no design required.
**Validation Gate:** User can export 12 months of transactions as CSV in under 10 seconds.

### REC-10: Create Jar Templates for Onboarding
**Reference:** EO-06
**Rationale:** New users don't know what jars to create. Too many jars → fatigue. Too few jars → insufficient planning. Templates provide a guided starting point that users can customize.
**Approach:** 3-5 templates based on common household types: "Young Couple," "Family with Kids," "Minimalist." Each template includes recommended jars, suggested allocations, and category mappings.
**Validation Gate:** New user can set up jars from a template in under 3 minutes.

---

## Medium Priority (Should Consider Within 24 Months)

These recommendations add meaningful value but have lower urgency or higher complexity.

### REC-11: Inbox Auto-Resolution Rules
**Reference:** EO-16
**Rationale:** After Inbox has been used for several months, users establish patterns (e.g., "Grab → Transport, Dining jar"). Auto-resolution eliminates repetitive manual work. Must be transparent and reversible.
**Approach:** Users create rules: "When merchant matches X, auto-categorize as Y and assign to jar Z." Rules execute on new InboxItems. Auto-resolved items are marked as such with undo capability.

### REC-12: Health Score Refinement
**Reference:** EO-08
**Rationale:** The initial Health score must prove value to users. Iteration based on usage data will improve relevance. Focus on actionable insights over comprehensive scoring.
**Approach:** Start with 3-5 core metrics (savings rate, jar coverage, expense predictability, Inbox health). Add metrics based on what users find valuable. Show trends, not just absolute scores.

### REC-13: Month Ritual Quick Close Option
**Reference:** EO-10
**Rationale:** If user research shows ritual abandonment, offer a lighter-touch "quick close" that confirms the month without the full assisted flow. The ritual should add value, not friction.
**Approach:** Assisted mode remains default (BR-09). Quick close available as option after 3+ completed rituals. Quick close shows month summary and confirms lock without step-by-step flow.

### REC-14: Goal Multi-Source Funding
**Reference:** EO-14
**Rationale:** Currently goals are linked to a single jar. Users may want a "Vacation" goal funded from multiple jars or general savings. This expands goal utility without changing the core goal concept.
**Approach:** Allow goals to link to multiple jars with allocation percentages. One jar can still fund multiple goals. Simplified funding model (no complex allocation rules initially).

### REC-15: Savings Maturity Alerts
**Reference:** EO-12
**Rationale:** When a savings product matures (term deposit, CD), the money becomes available for reallocation. BR-10 routes this to Inbox, but users need proactive alerts so they don't miss the maturity event.
**Approach:** Notification when savings product is within 30, 14, and 7 days of maturity. Inbox card created at maturity for reallocation decision.

---

## Low Priority (Nice to Have, 2+ Years Out)

### REC-16: Card Interest Cost Visualization
**Reference:** EO-13
**Rationale:** Valuable for users carrying card balances, but requires accurate APR data and statement tracking that may not be available at launch. Build after card payment infrastructure is stable.

### REC-17: Goal Progress Celebrations
**Reference:** EO-18
**Rationale:** Positive reinforcement for reaching milestones. Low complexity, low urgency. Build when goal infrastructure is stable and users are actively tracking goals.

### REC-18: Transaction Attachments
**Reference:** New
**Rationale:** Allow attaching receipt photos to transactions. Useful for expense tracking and shared household visibility ("here's what I bought"). Low priority — core transaction flow must be excellent first.

### REC-19: Custom Category Icons/Colors
**Reference:** EO-17
**Rationale:** Personalization improves engagement. Icons and colors make categories visually distinct. Low complexity, low urgency.

---

## Do Not Implement (Board Explicitly Recommends Against)

### REC-20: Health Write-Back (DNI-01)
**Why:** Violates BR-14. Health must never create transactions, adjust allocations, or modify any financial data.

### REC-21: Jar-to-Account Mapping (DNI-02)
**Why:** Violates BR-01. Jars are intentions; accounts are facts. Mapping them confuses users about what money they really have.

### REC-22: Auto-Commit Categorization (DNI-03)
**Why:** AI mistakes without human override destroy trust. Always suggest, never auto-commit without confirmation.

### REC-23: Partner Spending Comparison (DNI-04)
**Why:** Creates score-keeping and resentment between partners. Undermines Together philosophy.

### REC-24: Month Ritual Removal Option (DNI-05)
**Why:** The ritual is a core behavioral mechanism. Simplify it if needed; don't remove it.

### REC-25: Health Score Leaderboards (DNI-06)
**Why:** Financial comparison is shaming, not motivating. Health is a household mirror, not a competition.

### REC-26: Investment Recommendations (DNI-07)
**Why:** Creates regulatory liability and user harm risk. ViNha is not a financial advisor.

---

## Implementation Sequencing

### Phase 1 — Launch Readiness (Now)
- No domain changes. Ship with current domain model.

### Phase 2 — Safety & Parity (0-6 Months Post-Launch)
- REC-02: Card Payment Due Dates
- REC-01: Category Auto-Tagging (basic rules)
- REC-04: BR Compliance Enforcement
- REC-10: Jar Templates

### Phase 3 — Experience & Scale (6-12 Months Post-Launch)
- REC-05: Recurring Bill Calendar
- REC-06: Inbox Batch Operations
- REC-07: Transaction Splits
- REC-08: Installment Interest Visibility
- REC-09: Data Export

### Phase 4 — Depth & Intelligence (12-24 Months Post-Launch)
- REC-03: Planning Simplification (if validated by user research)
- REC-11: Inbox Auto-Resolution
- REC-12: Health Score Refinement
- REC-13: Month Ritual Quick Close
- REC-14: Goal Multi-Source Funding
- REC-15: Savings Maturity Alerts

### Phase 5 — Maturity (24+ Months)
- Remaining medium/low priority recommendations
- Future capabilities (FC-07 through FC-20) evaluated against market conditions

---

## Recommendation Acceptance Criteria

Before implementing any recommendation, validate:
1. **BR Compliance** — Does this change violate any business rule?
2. **Domain Boundary** — Does this respect domain boundaries (Real vs Intention, Read-only Health)?
3. **Simplicity Impact** — Does this make ViNha simpler or more complex for users?
4. **Competitive Necessity** — Is this table stakes or differentiation?
5. **User Research** — Do real users want this, or do we think they want this?

---

*Board recommendations completed. 9 critical/high-priority recommendations for the first 12 months post-launch. 5 medium-priority for 12-24 months. 7 items explicitly recommended against. All recommendations respect domain boundaries and business rules.*
