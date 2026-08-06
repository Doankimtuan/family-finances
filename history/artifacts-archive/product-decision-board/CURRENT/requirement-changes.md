# Requirement Changes

All requirement additions, modifications, and retirements resulting from Product Decision Board decisions. Requirements use REQ-XXX format.

---

## New Requirements by Feature

### EO-01: Auto-Categorization
| ID | Requirement | Priority |
|---|---|---|
| REQ-AUTO-001 | System shall maintain a default merchant-to-category mapping table shipped with the application | P1 |
| REQ-AUTO-002 | System shall apply user-custom merchant-to-category mappings with priority over default mappings | P1 |
| REQ-AUTO-003 | System shall display the suggested category on Inbox ReviewItems with a visual indicator that it is a suggestion | P1 |
| REQ-AUTO-004 | System shall require explicit user confirmation to apply a suggested category | P1 |
| REQ-AUTO-005 | System shall allow users to create custom merchant-to-category mappings from any transaction detail view | P1 |
| REQ-AUTO-006 | System shall track override frequency per merchant per household | P1 |
| REQ-AUTO-007 | System shall update user custom mapping when override threshold (default 3) is reached (per BR-16) | P1 |
| REQ-AUTO-008 | System shall display a confidence indicator on suggestions | P2 |
| REQ-AUTO-009 | System shall allow users to disable auto-categorization per household | P2 |
| REQ-AUTO-010 | System shall NEVER auto-commit a categorization without explicit user action | P1 |

### EO-02: Card Payment Due Dates
| ID | Requirement | Priority |
|---|---|---|
| REQ-CARD-001 | System shall display next payment due date for each card on the card detail view | P1 |
| REQ-CARD-002 | System shall display minimum payment amount for cards with revolving credit | P1 |
| REQ-CARD-003 | System shall display APR on card detail view | P1 |
| REQ-CARD-004 | System shall generate Inbox notification when payment due date is within the configured reminder window | P1 |
| REQ-CARD-005 | System shall send push notification for payment reminders (configurable per card) | P2 |
| REQ-CARD-006 | System shall allow users to configure reminder window per card (default 3 days, options: 1, 3, 5, 7 days) | P1 |
| REQ-CARD-007 | System shall allow users to mark a payment as "made" (manual confirmation) | P1 |
| REQ-CARD-008 | System shall display a "Payment Due" status indicator on card list view | P1 |
| REQ-CARD-009 | System shall warn when payment configuration is set to minimum payment only (per BR-18) | P1 |

### EO-03: Recurring Bill Calendar (Modified)
| ID | Requirement | Priority |
|---|---|---|
| REQ-CAL-001 | System shall display a monthly calendar view with recurring bill/income entries derived from active RecurringPatterns | P1 |
| REQ-CAL-002 | System shall display the expected amount and category for each calendar entry | P1 |
| REQ-CAL-003 | System shall provide "This Week" and "This Month" summary views showing total expected income and expenses | P1 |
| REQ-CAL-004 | System shall allow tapping a calendar entry to navigate to the source RecurringPattern detail | P2 |
| REQ-CAL-005 | System shall highlight today's date and show entries for the current day prominently | P1 |
| REQ-CAL-006 | System shall indicate whether a pattern is income or expense via color coding | P1 |
| REQ-CAL-007 | (R2) System shall project account balances based on upcoming patterns and current balance | P2 |
| REQ-CAL-008 | (R2) System shall display low-balance warnings when projected balance falls below configurable threshold | P2 |

### EO-04: Simplify Planning to Patterns
| ID | Requirement | Priority |
|---|---|---|
| REQ-PLAN-001 | System shall allow users to create RecurringPatterns with: merchant, amount pattern, frequency, category, direction | P0 |
| REQ-PLAN-002 | System shall match incoming transactions against RecurringPatterns and suggest the pattern's category and jar assignment | P0 |
| REQ-PLAN-003 | System shall display matched patterns on the transaction detail view | P0 |
| REQ-PLAN-004 | System shall support "Did you plan for this?" prompt for unmatched recurring transactions (3+ occurrences) | P1 |
| REQ-PLAN-005 | Income placement setting shall be at household level: Off, Suggest, Auto (per BR-04) | P0 |
| REQ-PLAN-006 | System shall display all active RecurringPatterns in a list view with next expected occurrence | P0 |
| REQ-PLAN-007 | System shall allow users to pause/archive patterns without deleting | P1 |
| REQ-PLAN-008 | System shall migrate existing PlanningRules to RecurringPatterns on upgrade (best-effort) | P0 |

### EO-05: Transaction Search/Filtering
| ID | Requirement | Priority |
|---|---|---|
| REQ-SRCH-001 | (R1) System shall support full-text search across merchant name and counterparty fields | P1 |
| REQ-SRCH-002 | (R1) System shall support filtering by date range (from/to) | P1 |
| REQ-SRCH-003 | (R1) System shall support filtering by category (single or multi-select) | P1 |
| REQ-SRCH-004 | (R1) System shall support filtering by account (single or multi-select) | P1 |
| REQ-SRCH-005 | (R1) System shall combine search text with active filters (AND logic) | P1 |
| REQ-SRCH-006 | (R1) System shall display active filter count and allow clearing all filters | P1 |
| REQ-SRCH-007 | (R2) System shall support filtering by amount range (min/max) | P2 |
| REQ-SRCH-008 | (R2) System shall support filtering by jar | P2 |
| REQ-SRCH-009 | (R2) System shall support saving named filter views | P2 |
| REQ-SRCH-010 | (R2) System shall support quick-access to saved views | P2 |

### EO-06: Jar Templates
| ID | Requirement | Priority |
|---|---|---|
| REQ-TMPL-001 | System shall provide at minimum three jar templates: "Young Couple", "Family with Kids", "Minimalist" | P1 |
| REQ-TMPL-002 | Each template shall include: suggested jar names, default allocation percentages, recommended category mappings | P1 |
| REQ-TMPL-003 | System shall display template preview before application, showing all jars and allocations | P1 |
| REQ-TMPL-004 | System shall allow users to edit template jars before confirming application | P1 |
| REQ-TMPL-005 | System shall not override existing jars when applying a template (per BR-19) | P1 |
| REQ-TMPL-006 | System shall offer templates during onboarding flow | P1 |
| REQ-TMPL-007 | System shall allow access to templates from Settings → Jar Management at any time | P2 |
| REQ-TMPL-008 | System shall display a "Start from scratch" option alongside templates | P1 |

### EO-07: Inbox Batch Operations
| ID | Requirement | Priority |
|---|---|---|
| REQ-IBOX-001 | System shall support multi-select on Inbox ReviewItems with select-all and select-individual | P1 |
| REQ-IBOX-002 | System shall display batch action bar when 1+ items are selected | P1 |
| REQ-IBOX-003 | System shall apply the selected action to all selected items simultaneously | P1 |
| REQ-IBOX-004 | System shall show a confirmation dialog before executing batch action with item count | P1 |
| REQ-IBOX-005 | System shall support undo for batch actions within a 10-second window | P1 |
| REQ-IBOX-006 | System shall provide "Review by Merchant" view: items grouped by merchant name | P2 |
| REQ-IBOX-007 | System shall allow "Select all from [Merchant]" in grouped view | P2 |
| REQ-IBOX-008 | System shall display batch operation progress for operations on >20 items | P2 |

### EO-08: Health Score Iteration
| ID | Requirement | Priority |
|---|---|---|
| REQ-HLTH-001 | System shall track Health score history per household (monthly snapshots) | P2 |
| REQ-HLTH-002 | System shall display Health score trend chart (3-month and 6-month views) | P2 |
| REQ-HLTH-003 | System shall provide actionable insights alongside the score | P2 |
| REQ-HLTH-004 | System shall iterate score calculation based on anonymized usage data analysis (quarterly) | P2 |
| REQ-HLTH-005 | System shall display which factors contributed most to the current score | P2 |
| REQ-HLTH-006 | System shall never auto-adjust jars, allocations, or budgets based on Health score (BR-14) | P1 |

### EO-09: Installment Interest Visibility
| ID | Requirement | Priority |
|---|---|---|
| REQ-INST-001 | System shall display total interest paid to date on installment detail view | P1 |
| REQ-INST-002 | System shall display remaining interest to be paid | P1 |
| REQ-INST-003 | System shall display per-payment breakdown: principal and interest portions | P1 |
| REQ-INST-004 | System shall display amortization summary: total paid, remaining, total cost | P1 |
| REQ-INST-005 | System shall display "You could save X in interest by prepaying" when user has surplus | P2 |
| REQ-INST-006 | System shall calculate and display effective interest rate (APR equivalent) | P1 |

### EO-10: Month Ritual Quick Close (Modified)
| ID | Requirement | Priority |
|---|---|---|
| REQ-RITL-001 | System shall unlock Quick Close option after 6 completed full Month Rituals | P2 |
| REQ-RITL-002 | System shall present Quick Close as an explicit option alongside full ritual (Assisted remains default) | P2 |
| REQ-RITL-003 | Quick Close summary shall display: income/expense summary, jar allocation status, overspent jars, unreviewed Inbox count, Health score change | P2 |
| REQ-RITL-004 | System shall require explicit confirmation of each summary section | P2 |
| REQ-RITL-005 | System shall mark the month as "Quick Closed" with distinct visual indicator | P2 |
| REQ-RITL-006 | System shall make the quick-close summary accessible to both partners | P2 |
| REQ-RITL-007 | System shall reset Quick Close eligibility if a month is skipped | P2 |

### EO-11: Data Export
| ID | Requirement | Priority |
|---|---|---|
| REQ-EXPT-001 | (R1) System shall allow export of all transactions for a date range as CSV | P2 |
| REQ-EXPT-002 | (R1) System shall include in CSV: date, merchant, amount, category, jar, account, direction | P2 |
| REQ-EXPT-003 | (R1) System shall allow export of account list as CSV | P2 |
| REQ-EXPT-004 | (R1) System shall apply active filters to CSV export scope | P2 |
| REQ-EXPT-005 | (R2) System shall generate PDF monthly summary with income, expenses, charts | P2 |
| REQ-EXPT-006 | (R2) PDF shall include simple charts (pie: expense by category, bar: monthly trend) | P2 |
| REQ-EXPT-007 | (R2) PDF shall be formatted for A4 printing | P2 |

### EO-12: Savings Maturity Alerts
| ID | Requirement | Priority |
|---|---|---|
| REQ-SAVE-001 | System shall display maturity date on savings product detail | P1 |
| REQ-SAVE-002 | System shall generate Inbox notification at 30, 14, and 7 days before maturity | P1 |
| REQ-SAVE-003 | System shall create Inbox ReviewItem on maturity date requiring user action | P1 |
| REQ-SAVE-004 | System shall offer maturity actions: Renew, Withdraw, Transfer | P1 |
| REQ-SAVE-005 | System shall display "Days until maturity" countdown on savings list view | P1 |
| REQ-SAVE-006 | System shall allow users to snooze maturity alerts (remind again in 7 days) | P2 |

### EO-13: Card Interest Cost Display
| ID | Requirement | Priority |
|---|---|---|
| REQ-CINT-001 | System shall display estimated interest cost for current billing cycle on card detail | P1 |
| REQ-CINT-002 | System shall display cumulative interest paid in current calendar year | P1 |
| REQ-CINT-003 | System shall display interest cost as a visual element (not hidden) | P1 |
| REQ-CINT-004 | System shall calculate estimated interest based on: carried balance, APR, days in cycle | P2 |
| REQ-CINT-005 | System shall display year-over-year interest comparison | P2 |
| REQ-CINT-006 | System shall display interest cost trend (month-by-month for current year) | P2 |

### EO-16: Inbox Auto-Resolution Rules (Modified)
| ID | Requirement | Priority |
|---|---|---|
| REQ-ARUL-001 | System shall allow users to create auto-resolution rules: merchant pattern → category + jar | P2 |
| REQ-ARUL-002 | System shall apply matching rules to new Inbox items automatically, moving them to Resolved tab | P2 |
| REQ-ARUL-003 | System shall log every auto-resolution action with full detail (per BR-26) | P2 |
| REQ-ARUL-004 | System shall retain resolved items in Resolved tab for 30 days with Undo action (per BR-25) | P2 |
| REQ-ARUL-005 | System shall not support conditional logic in rules | P2 |
| REQ-ARUL-006 | System shall enforce maximum 5 active rules per household (per BR-27) | P2 |
| REQ-ARUL-007 | System shall notify partner when a rule is created or modified | P2 |
| REQ-ARUL-008 | System shall provide "Auto-Resolution Log" screen showing all auto-resolved items | P2 |
| REQ-ARUL-009 | System shall display which rule would match a given Inbox item as a preview | P2 |
| REQ-ARUL-010 | System shall track "would have matched" statistics for rule effectiveness analysis | P2 |

### EO-18: Goal Progress Celebration
| ID | Requirement | Priority |
|---|---|---|
| REQ-GOAL-001 | System shall display a celebration animation when a goal reaches 25%, 50%, 75%, or 100% | P2 |
| REQ-GOAL-002 | System shall display a congratulatory message specific to each milestone | P2 |
| REQ-GOAL-003 | System shall create a positive Inbox notification at 100% completion | P2 |
| REQ-GOAL-004 | System shall not include points, badges, levels, or any gamification mechanics | P2 |
| REQ-GOAL-005 | Celebration is shown once per milestone (not on every visit after reaching it) | P2 |

### EO-19: Simple Jar Reallocation UX
| ID | Requirement | Priority |
|---|---|---|
| REQ-REAL-001 | System shall provide "Move Money" action accessible from jar list and jar detail | P2 |
| REQ-REAL-002 | System shall display source jar selector with current allocation displayed | P2 |
| REQ-REAL-003 | System shall display target jar selector (filtered to Active jars only) | P2 |
| REQ-REAL-004 | System shall show before/after allocation preview before confirming | P2 |
| REQ-REAL-005 | System shall create a ledger transaction for the reallocation | P2 |
| REQ-REAL-006 | System shall display reallocation history in jar detail | P2 |
| REQ-REAL-007 | System shall block reallocation when month is locked (per BR-08) | P2 |

### EO-20: Transaction Split Support
| ID | Requirement | Priority |
|---|---|---|
| REQ-SPLT-001 | System shall allow splitting a transaction into 2+ portions, each with its own category and amount | P1 |
| REQ-SPLT-002 | System shall require that the sum of split amounts equals the transaction total | P1 |
| REQ-SPLT-003 | System shall allow each split portion to be assigned a different jar | P2 |
| REQ-SPLT-004 | System shall display split indicator on transaction list | P1 |
| REQ-SPLT-005 | System shall show split detail when tapping a split transaction | P1 |
| REQ-SPLT-006 | System shall support splitting from Inbox ReviewItem view | P2 |
| REQ-SPLT-007 | System shall validate split amounts before confirming | P1 |

---

## Summary

| Category | Count |
|---|---|
| **New Requirements** | 107 |
| **Modified Requirements** | See BR-05 amendment impacts |
| **Retired Requirements** | All PlanningRule-specific requirements (replaced by RecurringPattern REQs) |
| **Total Active REQs** | 107 new + existing non-retired requirements |
