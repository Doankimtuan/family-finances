# Business Rule Changes

All business rule additions, modifications, and retirements resulting from Product Decision Board decisions.

---

## New Business Rules

### BR-16: Auto-Categorization Override Rule
**Source:** EO-01 (APPROVED)
**Rule:** When a user overrides an auto-categorization suggestion for a specific merchant N times (default: 3), the system updates the user's custom mapping to the user's preferred category and retires the old suggestion.
**Scope:** Categories domain, per household.
**Effective:** R1

### BR-17: Payment Reminder Rule
**Source:** EO-02 (APPROVED)
**Rule:** When a card has a payment due within the configured reminder window (default: 3 days), the system generates an Inbox notification and optional push notification. The notification persists until the payment is marked as made or the due date passes.
**Scope:** Cards domain, Inbox domain.
**Effective:** R1

### BR-18: Minimum Payment Visibility Rule
**Source:** EO-02 (APPROVED)
**Rule:** For cards with revolving credit, the minimum payment amount must always be displayed alongside the total balance. The system must warn when only the minimum payment is configured (indicating carried balance with interest accrual).
**Scope:** Cards domain.
**Effective:** R1

### BR-19: Template Application Rule
**Source:** EO-06 (APPROVED)
**Rule:** When a user applies a jar template, all template jars are created as Active jars with the template's suggested allocations. The user can modify or delete any jar immediately after application. Applying a template does not override existing jars.
**Scope:** Budgets/Jars domain.
**Effective:** R1

### BR-20: Interest Transparency Rule
**Source:** EO-09 (APPROVED)
**Rule:** The system shall always display total interest cost and remaining interest for any installment plan with interest rate > 0%. Interest information must be visible from the installment detail view without requiring navigation to a separate screen.
**Scope:** Installments domain.
**Effective:** R1

### BR-21: Savings Maturity Notification Rule
**Source:** EO-12 (APPROVED)
**Rule:** When a savings product is within 30 days of maturity, the system generates a notification at 30, 14, and 7 days. At maturity, an Inbox ReviewItem is created requiring user action (renew, withdraw, transfer).
**Scope:** Savings domain, Inbox domain.
**Effective:** R1

### BR-22: Interest Cost Visibility Rule
**Source:** EO-13 (APPROVED)
**Rule:** For any credit card with a carried balance (not paid in full each cycle), the system must display the estimated interest cost for the current billing cycle and the cumulative interest cost for the current calendar year.
**Scope:** Cards domain.
**Effective:** R1

### BR-23: Quick Close Eligibility Rule
**Source:** EO-10 (APPROVED WITH MODIFICATIONS)
**Rule:** Quick Close is available only after 6 completed full Month Rituals. The count resets if the household skips a month (no ritual completed). Quick-closed months count as completed rituals for eligibility purposes.
**Scope:** Month Close domain.
**Effective:** R1

### BR-24: Quick Close Transparency Rule
**Source:** EO-10 (APPROVED WITH MODIFICATIONS)
**Rule:** A quick-closed month must display a summary containing: income summary, expense summary, jar allocation status, overspent jars, unreviewed Inbox items, and Health score change. Both partners must have access to this summary. The month is visibly marked as "Quick Closed" (vs. "Fully Reviewed").
**Scope:** Month Close domain, Together domain.
**Effective:** R1

### BR-25: Auto-Resolution Undo Rule
**Source:** EO-16 (APPROVED WITH MODIFICATIONS)
**Rule:** Auto-resolved items must remain undoable for 30 days. Undoing returns the item to the active Inbox queue in its pre-resolution state.
**Scope:** Inbox domain.
**Effective:** R2

### BR-26: Auto-Resolution Transparency Rule
**Source:** EO-16 (APPROVED WITH MODIFICATIONS)
**Rule:** Every auto-resolution action must be logged with: matched rule, merchant, original transaction, applied category, applied jar, timestamp. This log is permanent, partner-visible, and cannot be deleted.
**Scope:** Inbox domain, Together domain.
**Effective:** R2

### BR-27: Auto-Resolution Limit Rule
**Source:** EO-16 (APPROVED WITH MODIFICATIONS)
**Rule:** Maximum 5 active auto-resolution rules per household. Limit reviewed quarterly based on usage data.
**Scope:** Inbox domain.
**Effective:** R2

---

## Modified Business Rules

### BR-05: Unmapped Expenses → Inbox ReviewItems (AMENDED)
**Original:** Unmapped expenses go to Inbox as ReviewItems.
**Amendment:** Transactions with auto-categorization suggestions (EO-01) still enter Inbox; the suggestion is pre-filled but not auto-applied. User must explicitly confirm or modify in Inbox. Split transactions (EO-20) create one Inbox ReviewItem per unconfirmed split portion. Auto-resolution rules (EO-16, R2) remove matching items from active Inbox to Resolved tab.
**Scope:** Inbox domain.
**Effective:** R1 (auto-categorization + splits), R2 (auto-resolution)

### BR-04: Income Placement (RELOCATED)
**Original:** Income placement setting at planning rule level (Off|Suggest|Auto).
**Amendment:** Income placement setting moves to household-level configuration. New households default to "Suggest." The Off|Suggest|Auto options remain unchanged. This change is part of EO-04 (Simplify Planning to Patterns).
**Scope:** Tenancy/Household domain (moved from Planning domain).
**Effective:** R1 (with EO-04)

### BR-03: Allocations Target Only Active Jars (REFERENCED)
**No change to rule text.** The rule is referenced by: EO-04 (RecurringPattern allocations respect Active-only constraint), EO-06 (template jars are Active by default), EO-19 (reallocation only between Active jars).
**Effective:** Unchanged; compliance reaffirmed.

### BR-08: Approved Month Ritual Locks Normal Plan Movements (REFERENCED)
**No change to rule text.** The rule is referenced by: EO-19 (reallocation blocked during locked months).
**Effective:** Unchanged; compliance reaffirmed.

### BR-09: Month Ritual Mode Defaults to Assisted (REINFORCED)
**No change to rule text.** Reinforced by EO-10: Assisted remains default even after Quick Close is unlocked. Quick Close is an explicit user choice, not a new default.
**Effective:** Unchanged; reinforced.

### BR-10: Savings Maturity → Inbox-Guided Flows (IMPLEMENTED)
**Original:** Savings maturity → Inbox-guided flows.
**Amendment:** Now fully implemented by EO-12. The flow is: Alert (30/14/7 days) → Inbox ReviewItem at maturity → User action (renew/withdraw/transfer). Previously specified but not implemented; now has concrete product specification.
**Scope:** Savings domain, Inbox domain.
**Effective:** R1 (implementation)

### BR-11: Installment Completion (REFERENCED)
**No change to rule text.** Referenced by EO-09: interest visibility is display-only; completion calculation unchanged.
**Effective:** Unchanged.

---

## Retired Business Rules

### RETIRED: PlanningRule-Specific Business Rules
**Source:** EO-04 (Simplify Planning to Patterns)
**What Is Retired:** All business rules that were implementation details of the PlanningRule engine: rule priority, conflict resolution, rule chaining, conditional execution. These were never user-facing product rules — they were architecture concerns elevated to business rules. With the PlanningRule engine replaced by RecurringPatterns, these rules are obsolete.
**Effective:** R1 (with EO-04)

---

## Summary

| Category | Count | Details |
|---|---|---|
| **New BRs** | 12 | BR-16 through BR-27 |
| **Modified BRs** | 7 | BR-03, BR-04, BR-05, BR-08, BR-09, BR-10, BR-11 |
| **Retired BRs** | 1 set | PlanningRule-specific rules |
| **Unchanged BRs** | 9 | BR-01, BR-02, BR-06, BR-07, BR-12, BR-13, BR-14, BR-15, plus the retired set's domain rules that were never true BRs |

---

## BR Compliance Notes

- **BR-01 (Real Ledger ≠ Virtual Jars):** No approved feature violates this. DNI-02 explicitly rejected. EO-19 reallocations create real ledger transactions, not virtual movements.
- **BR-14 (Health is Read-Only):** No approved feature violates this. DNI-01 explicitly rejected. EO-01 and EO-16 are suggest/apply only. EO-08 provides insights, not actions.
- **Financial Safety:** BR-17, BR-18, BR-20, BR-21, BR-22 all enhance financial safety. No approved feature reduces it.
