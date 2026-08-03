# Story Catalog — ViNha Implementation Master Plan

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Story Mapping Framework

Every Story in Specification v2.1 maps directly to:
$$\text{Business Rules} \longrightarrow \text{Requirements} \longrightarrow \text{Acceptance Criteria} \longrightarrow \text{Technical Tasks}$$

---

## 2. Complete 18-Story Catalog

### Sprint 1 (EPIC 1: Core Domain Contracts & Schema Realization)

#### Story ST-E01-001: Category ↔ Jar N:1 Mapping Contract Realization
- **Epic**: EPIC-01
- **Business Value**: Prevents transaction categorization without active Jar mapping, enforcing plan intention alignment (BR-12).
- **Business Rules**: BR-12.
- **Requirements**: REQ-CAT-01, REQ-CAT-02.
- **Acceptance Criteria**: AC-CAT-01.
- **Affected Modules**: `modules/categories/`, `modules/budgets/`.
- **Complexity**: 5 Story Points.

#### Story ST-E01-002: Structured Refund Linkage & Jar Restoration
- **Epic**: EPIC-01
- **Business Value**: Links refunds to original expenses, updates status, and restores Jar capacity without inflating income (BR-02).
- **Business Rules**: BR-02.
- **Requirements**: REQ-TRN-01, REQ-JAR-01.
- **Acceptance Criteria**: AC-TRN-01.
- **Affected Modules**: `modules/ledger/`, `modules/budgets/`.
- **Complexity**: 8 Story Points.

#### Story ST-E01-003: 3-Way Immutable Correction Audit Chain
- **Epic**: EPIC-01
- **Business Value**: Enforces 3-way immutable audit chain (`Original`, `Reversal`, `Correction`) for financial correctness (BR-03).
- **Business Rules**: BR-03.
- **Requirements**: REQ-TRN-02.
- **Acceptance Criteria**: AC-TRN-02.
- **Affected Modules**: `modules/ledger/`.
- **Complexity**: 8 Story Points.

---

### Sprint 2 (EPIC 2: Decoupled Plan Movements & Emergency Flow)

#### Story ST-E02-001: Decoupled Jar Plan Movements ($0.00 Ledger Impact)
- **Epic**: EPIC-02
- **Business Value**: Strictly separates virtual Jar reallocations from physical bank account balances (BR-01).
- **Business Rules**: BR-01, BR-06.
- **Requirements**: REQ-JAR-03.
- **Acceptance Criteria**: AC-JAR-01.
- **Affected Modules**: `modules/budgets/`, `modules/ledger/`.
- **Complexity**: 5 Story Points.

#### Story ST-E02-002: Emergency Declaration Flag & BR-07 Warning Bypass
- **Epic**: EPIC-02
- **Business Value**: Allows users to log emergency intent notes and bypass mid-month warning modals for real emergencies (BR-07, EVO-06).
- **Business Rules**: BR-07.
- **Requirements**: REQ-JAR-02.
- **Acceptance Criteria**: AC-JAR-02.
- **Affected Modules**: `modules/budgets/`.
- **Complexity**: 5 Story Points.

#### Story ST-E02-003: Partner Emergency Notification & Visibility
- **Epic**: EPIC-02
- **Business Value**: Notifies household partner instantly when an emergency reallocation is declared (BR-13).
- **Business Rules**: BR-13.
- **Requirements**: REQ-JAR-02.
- **Acceptance Criteria**: AC-JAR-02.
- **Affected Modules**: `modules/budgets/`, `modules/inbox/`.
- **Complexity**: 3 Story Points.

---

### Sprint 3 (EPIC 3: Inbox Decision Engine & Auto-Resolution)

#### Story ST-E03-001: Strongly-Typed ReviewItem Schema Discriminators
- **Epic**: EPIC-03
- **Business Value**: Instantiates typed schemas (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, etc.) in Inbox (EVO-02).
- **Business Rules**: BR-05, BR-10, BR-17.
- **Requirements**: REQ-INB-01.
- **Acceptance Criteria**: AC-INB-01.
- **Affected Modules**: `modules/inbox/`.
- **Complexity**: 5 Story Points.

#### Story ST-E03-002: Pattern Metadata Annotation & Auto-Resolution Policy Engine
- **Epic**: EPIC-03
- **Business Value**: Annotates recurring transactions with pattern metadata and auto-resolves high-confidence items (BR-16).
- **Business Rules**: BR-16.
- **Requirements**: REQ-INB-02, REQ-TRN-03.
- **Acceptance Criteria**: AC-INB-01.
- **Affected Modules**: `modules/inbox/`, `modules/planning/`.
- **Complexity**: 8 Story Points.

#### Story ST-E03-003: Inbox Staleness & Temporal Expiration Worker
- **Epic**: EPIC-03
- **Business Value**: Auto-archives expired reminders and cancels maturity cascades upon resolution (BR-15, BR-21).
- **Business Rules**: BR-15, BR-21.
- **Requirements**: REQ-INB-03.
- **Acceptance Criteria**: AC-INB-01.
- **Affected Modules**: `modules/inbox/`, `modules/savings/`.
- **Complexity**: 5 Story Points.

---

### Sprint 4 (EPIC 4: Month Ritual Maturity & Temporal Auto-Lock)

#### Story ST-E04-001: 30-Day Month Ritual Temporal Auto-Lock Worker
- **Epic**: EPIC-04
- **Business Value**: Locks uncompleted month rituals after 30 days (`PendingReview`), preserving historical integrity (BR-08).
- **Business Rules**: BR-08, BR-15.
- **Requirements**: REQ-RIT-01.
- **Acceptance Criteria**: AC-RIT-01.
- **Affected Modules**: `modules/month-ritual/`, `modules/budgets/`.
- **Complexity**: 8 Story Points.

#### Story ST-E04-002: Month Ritual Step 1 Category-Jar Divergence Check Gate
- **Epic**: EPIC-04
- **Business Value**: Blocks ritual progression if unmapped categories exist in completed month spending (EVO-01).
- **Business Rules**: BR-12.
- **Requirements**: REQ-CAT-01, REQ-RIT-01.
- **Acceptance Criteria**: AC-CAT-01.
- **Affected Modules**: `modules/month-ritual/`, `modules/categories/`.
- **Complexity**: 5 Story Points.

#### Story ST-E04-003: Step 3 Emergency Reflection & 1-Tap Quick Close Mode
- **Epic**: EPIC-04
- **Business Value**: Surfaces emergency reallocations for partner reflection and enables 1-tap Quick Close after 6 rituals (BR-09, BR-23).
- **Business Rules**: BR-07, BR-09, BR-23.
- **Requirements**: REQ-RIT-02, REQ-RIT-03.
- **Acceptance Criteria**: AC-JAR-02, AC-RIT-01.
- **Affected Modules**: `modules/month-ritual/`.
- **Complexity**: 5 Story Points.

---

### Sprint 5 (EPIC 5: Unified Household Financial Calendar)

#### Story ST-E05-001: Multi-Domain Household Schedule Projection Service
- **Epic**: EPIC-05
- **Business Value**: Aggregates recurring patterns, card due dates, and debt payoff schedules into one dataset (EO-03).
- **Business Rules**: BR-17, BR-20.
- **Requirements**: REQ-CAL-01.
- **Acceptance Criteria**: AC-CAL-01 (implied).
- **Affected Modules**: `modules/calendar/`, `modules/cards/`, `modules/planning/`.
- **Complexity**: 8 Story Points.

#### Story ST-E05-002: Calendar View UI & Early Cash Flow Deficit Warning
- **Epic**: EPIC-05
- **Business Value**: Renders aggregated calendar events on interactive mobile grid with low-balance warning alerts (REC-05).
- **Business Rules**: BR-17, BR-20.
- **Requirements**: REQ-CAL-01.
- **Acceptance Criteria**: AC-CAL-01.
- **Affected Modules**: `modules/calendar/`.
- **Complexity**: 5 Story Points.

#### Story ST-E05-003: Debt Payoff Milestone & Celebration Surface
- **Epic**: EPIC-05
- **Business Value**: Surfaces installment payoff milestones on calendar and triggers cash flow reallocation triage (BR-11).
- **Business Rules**: BR-11, BR-20.
- **Requirements**: REQ-CAL-01.
- **Acceptance Criteria**: AC-CAL-01.
- **Affected Modules**: `modules/calendar/`, `modules/cards/`.
- **Complexity**: 3 Story Points.

---

### Sprint 6 (EPIC 6: Health Read-Only Shield & GA Hardening)

#### Story ST-E06-001: Health Domain Database Read-Only Shield Enforcer
- **Epic**: EPIC-06
- **Business Value**: Enforces mathematical read-only connection safety for Health score calculations (BR-24).
- **Business Rules**: BR-24 (`Health-RO`).
- **Requirements**: REQ-HLT-01.
- **Acceptance Criteria**: AC-HLT-01.
- **Affected Modules**: `modules/health/`.
- **Complexity**: 5 Story Points.

#### Story ST-E06-002: AI Non-Invention Policy Guards & Audit Logger
- **Epic**: EPIC-06
- **Business Value**: Prevents AI features from inventing fake balances or executing unauthorized money movement (BR-14).
- **Business Rules**: BR-14.
- **Requirements**: REQ-HLT-01.
- **Acceptance Criteria**: AC-HLT-01.
- **Affected Modules**: `modules/platform/`, `modules/health/`.
- **Complexity**: 5 Story Points.

#### Story ST-E06-003: Multi-Tier Regression & System Release Hardening
- **Epic**: EPIC-06
- **Business Value**: Executes end-to-end regression, security audit, A11y verification, and GA readiness sign-off.
- **Business Rules**: All BRs (BR-01 through BR-24).
- **Requirements**: All REQs.
- **Acceptance Criteria**: All ACs.
- **Affected Modules**: Global System.
- **Complexity**: 8 Story Points.
