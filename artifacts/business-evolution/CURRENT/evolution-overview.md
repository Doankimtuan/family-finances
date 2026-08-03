# Business Evolution Overview — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## Evolution Philosophy & Scope Boundary

The Business Evolution Board operates under a strict principle: **No Orphan Evolution**. Every business modification detailed in this pack originates from a validated issue documented in prior review board artifacts (`domain-reality-validation`, `business-cohesion`, `product-decision-board`, or `domain-philosophy`). 

This document outlines the detailed rationale, core business evolution, and boundaries for all 10 validated evolutions.

---

## Detailed Breakdown of Validated Evolutions

### Evolution 1: Category ↔ Jar Formal Contract

- **Validated Weakness**: Categories classify real ledger transactions, while Jars track virtual plan intentions. In the initial specification, no formal contract governed their relationship. Categories could be created with names that diverged from active Jars, leaving transactions categorized but unmapped to any spending intention (Business Smell 5.1, 10.1, 15.1; Reality Validation DNI-02).
- **Root Business Cause**: Lack of cross-domain authority rules between transaction classification (Categories) and household budget structure (Jars).
- **Evolved Business Model**:
  1. **Jar Primacy**: Jars own the household financial taxonomy.
  2. **Mapping Contract**: Categories map to Jars on an $N:1$ basis (multiple categories can map to one Jar, but every active Category must map to exactly one Jar).
  3. **Divergence Detection**: Creating a category without a Jar assignment triggers an Inbox mapping item. The Month Ritual includes an automated Category-Jar Divergence Check that alerts the household if spending categories have drifted from plan intention jars.

---

### Evolution 2: Typed ReviewItem Taxonomy

- **Validated Weakness**: In the initial design, the Inbox domain processed all incoming items as generic `ReviewItems`. An unmapped expense, a credit card payment due date, a savings maturity alert, and an installment completion notice were treated identically. This prevented the implementation of safe auto-resolution policies (EO-16) because resolution semantics differed wildly across item sources (Business Smell 2.2, 13.1, 16.2; Lifecycle Gap 7).
- **Root Business Cause**: Ambiguity in Inbox domain modeling between actionable decision queue items, financial status alerts, and background notifications.
- **Evolved Business Model**:
  1. **Typed Taxonomy**: Every item entering Inbox must have an explicit type (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`).
  2. **Type-Specific Handlers**: Each type defines its own lifecycle, resolution actions, and auto-resolution rules (e.g., payment reminders cannot be auto-resolved to a Miscellaneous Jar; unmapped expenses can).
  3. **Queue Purity**: Decision queue items require explicit user/partner confirmation; pure informational alerts clear automatically upon expiration.

---

### Evolution 3: Structured Refund Lifecycle

- **Validated Weakness**: When a merchant refunds a transaction, the initial model created an incoming income-like transaction without linking it back to the original outgoing expense transaction. This caused audit gaps, distorted monthly income totals, and failed to restore the spending capacity of the affected Jar (Lifecycle Gap 1; Business Smell 6.1).
- **Root Business Cause**: Absence of a domain-level refund reference model linking reversal transactions to original expenditure records.
- **Evolved Business Model**:
  1. **Link Contract**: A refund transaction MUST carry `reverses_transaction_id` referencing the original expense.
  2. **Status Transition**: The original expense transitions to `PartiallyRefunded` or `FullyRefunded`.
  3. **Jar Restoration**: Refunded amounts credit back the specific Jar assigned to the original expense, restoring intention capacity without counting as new monthly income.

---

### Evolution 4: Immutable Correction Lifecycle

- **Validated Weakness**: Correcting an erroneous transaction requires creating a reversal transaction and a new correct transaction. The initial specification lacked an audit link contract defining how these three records interlock, creating accounting ambiguities (Lifecycle Gap 2; Business Smell 6.1).
- **Root Business Cause**: Missing 3-way audit graph specification in the Transaction domain model.
- **Evolved Business Model**:
  1. **3-Way Audit Chain**:
     - Original Transaction $\rightarrow$ status becomes `Reversed`.
     - Reversal Transaction $\rightarrow$ carries `reverses_transaction_id` pointing to Original.
     - Correction Transaction $\rightarrow$ carries `corrects_transaction_id` pointing to Original.
  2. **Immutability**: Neither Original nor Reversal transactions can ever be edited or deleted.
  3. **Ledger Integrity**: Net ledger balance impact is strictly zero for the reversal pair, with only the correction transaction impacting active balances.

---

### Evolution 5: Decoupled Manual Adjustment Lifecycle

- **Validated Weakness**: Ambiguity existed regarding whether mid-month Jar reallocations (EO-19) constituted "real money movement" in bank accounts or purely virtual plan adjustments. Presenting Jar movements as ledger transactions violated BR-01 (Business Smell 12.3; Reality Validation DNI-01).
- **Root Business Cause**: Blurring of Real Ledger reconciliation vs. Virtual Intention Plan reallocation.
- **Evolved Business Model**:
  1. **Real Ledger Adjustment**: Administered under Accounts domain as `adjustment_type: balance_reconciliation`. Represents physical bank balance corrections.
  2. **Intention Plan Reallocation**: Administered under Budgets/Jars domain as `plan_movement`. Represents moving virtual allocated capacity from Jar A to Jar B.
  3. **Strict Separation**: Plan movements NEVER generate ledger transactions or touch bank accounts.

---

### Evolution 6: Explicit Emergency Flow

- **Validated Weakness**: Discretionary overspending on dining out and unexpected emergency medical expenses were treated identically by BR-07 Warn. Both generated identical warning alerts, causing user fatigue and hiding genuine emergencies (Lifecycle Gap 3; Business Smell 6.2).
- **Root Business Cause**: Absence of intent metadata on Jar reallocations.
- **Evolved Business Model**:
  1. **Emergency Declaration**: Users can flag a Jar reallocation as an `EmergencyDeclaration`.
  2. **Bypass Rule**: Declared emergency reallocations bypass the mid-month BR-07 overspend warning modal, treating the event as an intentional response to a critical need.
  3. **Ritual Visibility**: All emergency declarations are automatically isolated and surfaced during the Month Ritual for mandatory household review and reflection.

---

### Evolution 7: Month Ritual Maturity & Auto-Lock

- **Validated Weakness**: If a household neglected to complete the Month Ritual, Jars remained open and mutable indefinitely. A user could edit January allocations in December. Furthermore, stale Inbox items lingered across months, and new users were locked out of Quick Close for 6 months (Lifecycle Gap 5, 7; Business Smell 2.1).
- **Root Business Cause**: Missing temporal state machine transitions and hard timeouts on monthly plan boundaries.
- **Evolved Business Model**:
  1. **30-Day Auto-Lock**: On day 30 post month-end, unapproved rituals automatically transition to `PendingReview` and lock Jar allocations against retro-active editing.
  2. **Stale Triage**: Unmapped transactions older than 30 days automatically resolve to a Miscellaneous Jar upon Month Lock.
  3. **Quick Close Path**: Formalizes Quick Close eligibility after 6 consecutive completed rituals, offering a 1-tap summary approval.

---

### Evolution 8: BR-14 / BR-24 Disambiguation

- **Validated Weakness**: Documentation across frozen packs assigned the identifier `BR-14` to two conflicting rules: Product Catalog defined BR-14 as "AI non-invention of balances", while Domain Philosophy defined BR-14 as "Health read-only". This created governance ambiguity (Business Smell 12.2).
- **Root Business Cause**: ID collision across frozen documentation artifacts.
- **Evolved Business Model**:
  1. **BR-14**: Assigned strictly to **AI Non-Invention Policy** (AI features may explain/suggest but never invent balances or execute unauthorized transactions).
  2. **BR-24 (`Health-RO`)**: Newly created official rule assigned to **Health Read-Only Policy** (Health domain reads operational data but never writes back or modifies ledger/jars).
  3. Both rules are 100% active, non-negotiable constitutional safeguards.

---

### Evolution 9: Unified Household Schedule

- **Validated Weakness**: Planning domain tracked `RecurringPatterns`, Cards domain tracked payment due dates, and Installments domain tracked debt payoff schedules. However, the Calendar view (EO-03) only aggregated `RecurringPatterns`, ignoring credit card due dates and installment milestones (Business Smell 3.1).
- **Root Business Cause**: Domain isolation without a unified schedule projection interface.
- **Evolved Business Model**:
  1. **Unified Household Calendar**: The Calendar view (EO-03) acts as the single cross-domain aggregator.
  2. **Multi-Source Events**: Aggregates `RecurringPattern` occurrences, Credit Card payment due dates (`BR-17`), and Installment due dates (`BR-20`).
  3. **Cash Flow Warnings**: Provides early cash flow deficit warnings when scheduled bills and due dates exceed expected account balances.

---

### Evolution 10: Pattern Context & Inbox Auto-Resolution

- **Validated Weakness**: Scheduled transactions generated from `RecurringPatterns` arrived in Inbox as standard unknown transactions, stripping away their recurring context and requiring repetitive manual mapping (Business Smell 5.2, 11.1, 12.1; Lifecycle Gap 7).
- **Root Business Cause**: Lack of origin metadata propagation from Planning patterns to Transaction records.
- **Evolved Business Model**:
  1. **Metadata Annotation**: Transactions created by recurring patterns carry `source: recurring_pattern` and `pattern_id` metadata.
  2. **Contextual Inbox Resolution**: Inbox reads pattern metadata to auto-fill category and Jar assignment fields, asking for 1-tap confirmation rather than manual entry.
  3. **Auto-Resolution Rules**: High-confidence pattern matches auto-resolve silently, while low-confidence matches queue in Inbox with pre-filled suggestions.
