# Risk Analysis

Risks introduced by Product Decision Board decisions. Each risk assessed for likelihood, impact, and mitigation.

---

## Business Risks

### BR-1: Auto-Categorization Miscategorization Erodes Trust
**Source:** EO-01
**Likelihood:** Medium | **Impact:** High
**Description:** If the auto-categorization system consistently miscategorizes transactions, users lose trust in the product's accuracy. This is especially dangerous for financial data where trust is paramount.
**Mitigation:**
- Suggest-only model; never auto-commit
- Confidence indicator on suggestions
- Override tracking auto-updates rules when users correct repeatedly
- Users can disable auto-categorization entirely
- BR-16 ensures the system learns from corrections

### BR-2: PlanningRule Migration Disrupts Existing Users
**Source:** EO-04
**Likelihood:** Medium | **Impact:** High
**Description:** Users with complex PlanningRules may find their rules don't cleanly map to RecurringPatterns. This creates confusion and potential data loss.
**Mitigation:**
- Best-effort migration script
- Complex/unmappable rules listed for manual user review
- 30-day dual-write window with "Legacy Rules" access
- PlanningRule tables retained for rollback throughout R1
- Migration wizard guides users through the transition

### BR-3: Card Feature Complexity Overwhelms UI
**Source:** EO-02, EO-13
**Likelihood:** Low | **Impact:** Medium
**Description:** Adding payment dates, minimum payments, APR, interest cost, and interest trends to card views could make card management feel complex rather than helpful.
**Mitigation:**
- Progressive disclosure: essential info (due date, minimum) always visible; interest details expandable
- EO-13 (interest cost) ships after EO-02 (basic payment info) is stable
- Card list view keeps simple; detail view holds complexity

### BR-4: Inbox Auto-Resolution Reduces User Engagement
**Source:** EO-16
**Likelihood:** Medium | **Impact:** Medium
**Description:** If auto-resolution rules handle most Inbox items, users stop reviewing transactions — defeating the Inbox's purpose as a review mechanism.
**Mitigation:**
- Rules limited to 5 per household (BR-27)
- Permanent audit log ensures visibility of what was auto-resolved
- 30-day undo window
- Resolved tab keeps auto-resolved items accessible
- Rules are merchant-match only (no complex patterns that could silently auto-resolve everything)

---

## UX Risks

### UX-1: Feature Density Creates Cognitive Overload
**Source:** Multiple features (15 approved for R1)
**Likelihood:** Medium | **Impact:** Medium
**Description:** Adding 18 features (15 approved + 3 modified) in R1 risks overwhelming users with too many new capabilities at once.
**Mitigation:**
- Phased rollout within R1 (Waves 1-4)
- Progressive disclosure: new features appear gradually, not all at once
- Onboarding tooltips for major new features
- Features like Quick Close (EO-10) only appear when eligibility is met (6 rituals)
- Templates (EO-06) appear during natural onboarding moments

### UX-2: Transaction Split Adds Complexity to Core Flow
**Source:** EO-20
**Likelihood:** Low | **Impact:** Medium
**Description:** Split transactions make the transaction model more complex. Reporting, filtering, and Inbox flows must all account for splits.
**Mitigation:**
- Split is an optional action; non-split transactions behave identically to before
- Split indicator on list view is subtle; detail expands on tap
- Inbox ReviewItem for split transactions handles each portion individually

### UX-3: Quick Close Undermines Ritual Value
**Source:** EO-10
**Likelihood:** Low | **Impact:** Medium
**Description:** Users might default to Quick Close and miss the financial review that the ritual provides, degrading the product's core behavioral mechanism.
**Mitigation:**
- Quick Close requires 6 full rituals first (increased from proposed 3)
- Assisted mode remains the default; Quick Close is an explicit choice
- Quick Close summary is mandatory — users must review key information
- Unreviewed Inbox items must be explicitly acknowledged
- Quick-closed months are visibly distinct; partner can review

---

## Architecture Risks

### AR-1: Module Proliferation Increases Coupling
**Source:** Multiple features adding cross-domain relationships
**Likelihood:** Low | **Impact:** Medium
**Description:** New cross-domain relationships (Cards→Inbox, Savings→Inbox, Budgets→Ledger) increase coupling between modules.
**Mitigation:**
- All cross-domain communication is via API, not direct database access
- Bounded contexts remain independently deployable
- New relationships are read-only where possible (Cards→Inbox is create-only; no circular dependencies)

### AR-2: Technical Debt from Dual-Write Period
**Source:** EO-04
**Likelihood:** Medium | **Impact:** Low
**Description:** The dual-write period (PlanningRules + RecurringPatterns coexisting) creates temporary technical debt and potential sync issues.
**Mitigation:**
- Dual-write period is time-boxed (30 days, not indefinite)
- PlanningRules deprecated at R1 launch; removed at R2
- Sync issues are acceptable during transition window (no silent failures)

---

## Maintenance Risks

### MR-1: Default Mapping Table Staleness
**Source:** EO-01
**Likelihood:** Medium | **Impact:** Low
**Description:** The default merchant-to-category mapping table becomes stale as new merchants appear and category structures evolve.
**Mitigation:**
- Default mappings are configurable data, not hardcoded
- Quarterly review of mapping accuracy based on override data
- User custom rules take priority over system defaults (BR-16)
- ML-based suggestions (R2) will supplement static mappings

### MR-2: Auto-Resolution Log Growth
**Source:** EO-16
**Likelihood:** High | **Impact:** Low
**Description:** The permanent auto-resolution log grows unboundedly as every auto-resolution is logged forever.
**Mitigation:**
- Append-only table, partitioned by month
- Archival strategy for logs older than 2 years (retain, but move to cold storage)
- Log queries are paginated; "show all" is never the default view

---

## Product Identity Risks

### PI-1: Feature Accumulation Shifts Identity Toward Expense Tracker
**Source:** Cumulative effect of all approved features
**Likelihood:** Low | **Impact:** High
**Description:** Adding search, filters, splits, auto-categorization, and export could make ViNha feel like a sophisticated expense tracker rather than a Household Money Operating System.
**Mitigation:**
- The Month Ritual remains the core behavioral anchor (reinforced by Quick Close modifications)
- Jar-based planning system remains central (flat, simple, intentional)
- Health score provides the "why" behind the features (not just "what")
- Rejected features (gamification, spending comparison, conditional rules) protect the Money OS identity
- Every feature is evaluated against: "Does this strengthen 'Household Money OS' or push toward 'Expense Tracker'?"

### PI-2: BR-01/BR-14 Boundary Creep
**Source:** Cumulative feature interactions
**Likelihood:** Very Low | **Impact:** Critical
**Description:** Over time, features that individually respect BR-01/BR-14 could interact in ways that blur boundaries. For example: if Health shows "your Dining jar is overspent" and Auto-Resolution rules allow moving money — does that constitute Health-influenced money movement?
**Mitigation:**
- BR-01/BR-14 audit at each feature interaction review
- DNIs 01 and 02 permanently rejected
- No Health→Jars write path exists or will ever exist
- Auto-Resolution rules are user-defined, not Health-driven
- Quarterly BR compliance audit

---

## Migration Risks

### MG-1: Data Loss During PlanningRule Migration
**Source:** EO-04
**Likelihood:** Low | **Impact:** Critical
**Description:** Migration script could lose or corrupt existing PlanningRule data, destroying users' planning configurations.
**Mitigation:**
- Migration is read-only on PlanningRules table (creates new RecurringPatterns; doesn't delete PlanningRules)
- Migration script tested on production data snapshot before deployment
- Rollback: PlanningRules table retained throughout R1; simply disable RecurringPattern UI
- Manual review list for unmappable rules

### MG-2: Existing Users Miss New Features
**Source:** All R1 features
**Likelihood:** Medium | **Impact:** Low
**Description:** Existing users who are comfortable with current workflows may not discover new features, missing value.
**Mitigation:**
- Feature announcement Inbox card on first login post-update
- Progressive tooltips for new features in-context
- Settings entry points for all new capabilities
- No forced workflow changes; existing flows remain functional

---

## Financial Risk

### FR-1: Interest Calculation Liability
**Source:** EO-09, EO-13
**Likelihood:** Low | **Impact:** Medium
**Description:** If interest calculations are inaccurate, users may make financial decisions based on wrong information (e.g., prepaying a loan when the calculated savings are wrong).
**Mitigation:**
- Interest calculations are labeled "estimated"
- Disclaimer: "Calculations are estimates. Refer to your lender for exact figures."
- Calculation formulas are transparent and documented in-app
- Amortization uses standard formulas validated by financial domain expert
- Interest display is informational, not advisory

---

## Risk Heat Map

| Risk | Likelihood | Impact | Risk Level |
|---|---|---|---|
| BR-1: Auto-categorization trust | Medium | High | **HIGH** |
| BR-2: PlanningRule migration disruption | Medium | High | **HIGH** |
| PI-1: Identity shift | Low | High | **MEDIUM** |
| PI-2: BR-01/BR-14 boundary creep | Very Low | Critical | **MEDIUM** |
| MG-1: PlanningRule data loss | Low | Critical | **MEDIUM** |
| BR-4: Auto-resolution reduces engagement | Medium | Medium | **MEDIUM** |
| UX-1: Feature density overload | Medium | Medium | **MEDIUM** |
| FR-1: Interest calculation liability | Low | Medium | **LOW** |
| All other risks | Low-Medium | Low-Medium | **LOW** |

---

## Overall Risk Assessment

**Risk Posture: MODERATE**

The Board assesses that the approved features introduce manageable risk. The two high-priority risks (auto-categorization trust and PlanningRule migration) have strong mitigations. The critical product integrity risks (BR-01/BR-14 violation, identity shift) have been explicitly addressed through rejections and safeguards. No risk is unmitigated.
