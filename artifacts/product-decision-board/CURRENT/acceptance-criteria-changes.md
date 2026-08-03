# Acceptance Criteria Changes

All acceptance criteria additions mapped to requirements. Uses AC-XXX format.

---

## EO-01: Auto-Categorization → REQ-AUTO-001 through REQ-AUTO-010

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-AUTO-001 | Given a transaction with merchant "Circle K", the Inbox ReviewItem shows category "Dining" as a suggestion with a visual indicator | REQ-AUTO-001, REQ-AUTO-003 |
| AC-AUTO-002 | Given a transaction with merchant "Circle K" and a user custom rule mapping it to "Groceries", the suggestion shows "Groceries" (user rule wins) | REQ-AUTO-002 |
| AC-AUTO-003 | User must tap "Accept" to apply the suggested category; dismissing without confirmation leaves the transaction uncategorized | REQ-AUTO-004, REQ-AUTO-010 |
| AC-AUTO-004 | User can create a custom rule from any transaction: "Always categorize [Merchant] as [Category]" | REQ-AUTO-005 |
| AC-AUTO-005 | After overriding "Circle K → Dining" three times to "Groceries", the system automatically updates the custom rule | REQ-AUTO-006, REQ-AUTO-007 |
| AC-AUTO-006 | Disabling auto-categorization removes all suggestions from Inbox items; Inbox shows uncategorized items only | REQ-AUTO-009 |
| AC-AUTO-007 | A partially matched merchant ("Circle K - 123 Main St") still matches "Circle K" base rule | REQ-AUTO-001, REQ-AUTO-002 |

## EO-02: Card Payment Due Dates → REQ-CARD-001 through REQ-CARD-009

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-CARD-001 | Card detail view shows: Total Balance, Available Credit, APR, Next Payment Due Date, Minimum Payment Amount | REQ-CARD-001, REQ-CARD-002, REQ-CARD-003 |
| AC-CARD-002 | 3 days before due date, an Inbox card appears: "Payment Due: [Card Name] — [Amount] by [Date]" | REQ-CARD-004 |
| AC-CARD-003 | Push notification sent at configured reminder time (e.g., 9 AM on reminder day) | REQ-CARD-005 |
| AC-CARD-004 | Marking payment as "made" removes the reminder notification and updates "Next Payment Due" to the following cycle | REQ-CARD-007 |
| AC-CARD-005 | Card with due date within 24 hours shows "Due Tomorrow" with warning color on card list | REQ-CARD-008 |
| AC-CARD-006 | Card with past-due date shows "Overdue" with critical warning color | REQ-CARD-008 |
| AC-CARD-007 | User can configure reminder window per card; changes take effect immediately | REQ-CARD-006 |

## EO-03: Recurring Bill Calendar → REQ-CAL-001 through REQ-CAL-008

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-CAL-001 | Calendar shows: Aug 5 — "Rent 12,000,000 VND (expense)", Aug 15 — "Salary 30,000,000 VND (income)" | REQ-CAL-001, REQ-CAL-002 |
| AC-CAL-002 | "This Month" summary: "Expected Income: 30,000,000 VND, Expected Expenses: 18,500,000 VND" | REQ-CAL-003 |
| AC-CAL-003 | Tapping "Rent" entry navigates to the Rent RecurringPattern detail/edit screen | REQ-CAL-004 |
| AC-CAL-004 | Today (Aug 3) is highlighted; today's entries show at the top of the day view | REQ-CAL-005 |
| AC-CAL-005 | Income entries appear in green; expense entries in red | REQ-CAL-006 |
| AC-CAL-006 | Paused patterns do not appear on the calendar | REQ-CAL-001 |

## EO-04: Simplify Planning to Patterns → REQ-PLAN-001 through REQ-PLAN-008

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-PLAN-001 | User creates pattern: "Rent, ~12,000,000 VND, Monthly, Housing (expense)". Next month's rent transaction is automatically matched | REQ-PLAN-001, REQ-PLAN-002 |
| AC-PLAN-002 | Transaction for "Electricity — 856,000 VND" matches pattern "Utilities, 500k-1.5M, Monthly" — shows matched with confidence level | REQ-PLAN-002, REQ-PLAN-003 |
| AC-PLAN-003 | Unmatched recurring transaction (3+ occurrences, same merchant, similar amount) triggers "Create a pattern?" prompt in Inbox | REQ-PLAN-004 |
| AC-PLAN-004 | Income placement set to "Auto" — all income transactions are automatically allocated per household rules without Inbox review | REQ-PLAN-005 |
| AC-PLAN-005 | Existing PlanningRules are migrated: simple rules become patterns; complex conditional rules are listed for user review | REQ-PLAN-008 |
| AC-PLAN-006 | Pausing a pattern stops matching; archived patterns are hidden but restorable | REQ-PLAN-007 |

## EO-05: Transaction Search/Filtering → REQ-SRCH-001 through REQ-SRCH-010

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-SRCH-001 | Typing "Circle K" in search bar returns only transactions with "Circle K" in merchant name | REQ-SRCH-001 |
| AC-SRCH-002 | Setting date filter to "This Month" and category to "Dining" returns only Dining transactions from the current month | REQ-SRCH-002, REQ-SRCH-003 |
| AC-SRCH-003 | Filtering by 2 accounts shows transactions from either account (OR logic within filter group) | REQ-SRCH-004 |
| AC-SRCH-004 | Search text "milktea" + category filter "Dining" returns Dining transactions matching "milktea" only | REQ-SRCH-005 |
| AC-SRCH-005 | "Clear all filters" resets to unfiltered transaction list | REQ-SRCH-006 |
| AC-SRCH-006 | (R2) User saves filter "Groceries over 500k this month" as a named view; can access it from quick-access menu | REQ-SRCH-009, REQ-SRCH-010 |

## EO-06: Jar Templates → REQ-TMPL-001 through REQ-TMPL-008

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-TMPL-001 | New user selects "Family with Kids" template; preview shows 8 jars with allocations totaling 100%. User edits 2 jar names and adjusts 1 allocation, then confirms | REQ-TMPL-001, REQ-TMPL-003, REQ-TMPL-004 |
| AC-TMPL-002 | User with existing jars opens template screen; applying "Young Couple" template adds new jars but preserves existing jars | REQ-TMPL-005 |
| AC-TMPL-003 | "Minimalist" template shows 4 jars; user can change to 5 before applying | REQ-TMPL-004 |
| AC-TMPL-004 | Onboarding flow presents template selection as an optional step; "Skip" allows starting with no jars | REQ-TMPL-006, REQ-TMPL-008 |
| AC-TMPL-005 | Total allocation always sums to 100%; adjusting one allocation auto-adjusts others proportionally during template editing | REQ-TMPL-002 |

## EO-07: Inbox Batch Operations → REQ-IBOX-001 through REQ-IBOX-008

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-IBOX-001 | User selects 5 Inbox items → action bar appears with "Categorize (5)", "Assign to Jar (5)", "Dismiss (5)" | REQ-IBOX-001, REQ-IBOX-002 |
| AC-IBOX-002 | User selects Categorize → "Dining" → confirmation dialog "Categorize 5 items as Dining?" → confirms → all 5 items updated | REQ-IBOX-003, REQ-IBOX-004 |
| AC-IBOX-003 | After batch categorization, an undo toast appears: "5 items categorized. Undo?" with 10-second countdown | REQ-IBOX-005 |
| AC-IBOX-004 | "Review by Merchant" view shows: "Circle K (12 items)", "Grab (8 items)", "Unrecognized (3 items)" | REQ-IBOX-006 |
| AC-IBOX-005 | User taps "Select all from Circle K" → batch categorizes all 12 as "Transportation" | REQ-IBOX-007 |
| AC-IBOX-006 | Batch operation on 50 items shows progress indicator; items update incrementally | REQ-IBOX-008 |

## EO-08: Health Score Iteration → REQ-HLTH-001 through REQ-HLTH-006

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-HLTH-001 | Health dashboard shows: Current Score (e.g., 72/100), Trend (↑ or ↓), Top 3 factors (positive and negative) | REQ-HLTH-002, REQ-HLTH-005 |
| AC-HLTH-002 | Trend chart shows monthly scores for the past 6 months with score breakdown by category | REQ-HLTH-001, REQ-HLTH-002 |
| AC-HLTH-003 | Insight: "Your emergency fund is at 45% of target. At current rate, you'll reach target in 4 months." | REQ-HLTH-003 |
| AC-HLTH-004 | Score calculation update (quarterly): new weights applied, users see "Score Methodology Updated" notice on next visit | REQ-HLTH-004 |
| AC-HLTH-005 | Health dashboard never includes "Adjust jar" or "Move money" call-to-action buttons | REQ-HLTH-006 |

## EO-09: Installment Interest Visibility → REQ-INST-001 through REQ-INST-006

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-INST-001 | Installment detail shows: Original Amount, Total Interest, Paid (Principal + Interest), Remaining (Principal + Interest), Effective APR | REQ-INST-001, REQ-INST-002, REQ-INST-006 |
| AC-INST-002 | Payment history list shows each payment with Principal/Interest split: "Payment 5/12: 2,000,000 VND (Principal: 1,750,000, Interest: 250,000)" | REQ-INST-003 |
| AC-INST-003 | Amortization card: "So far you've paid 1,250,000 VND in interest. 1,750,000 VND remains." | REQ-INST-004 |
| AC-INST-004 | User with surplus in Emergency Fund jar sees: "You could save 1,200,000 VND in interest by prepaying now" | REQ-INST-005 |

## EO-10: Month Ritual Quick Close → REQ-RITL-001 through REQ-RITL-007

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-RITL-001 | After completing 6 full Month Rituals, the ritual screen shows: "Start Full Ritual" (default) and "Quick Close" (new option) | REQ-RITL-001, REQ-RITL-002 |
| AC-RITL-002 | User selects Quick Close → summary screen shows 5 sections. User reviews and confirms each | REQ-RITL-003, REQ-RITL-004 |
| AC-RITL-003 | Summary shows: "3 jars are overspent (Dining: -200k, Entertainment: -150k, Shopping: -50k)." User acknowledges | REQ-RITL-003 |
| AC-RITL-004 | Summary shows: "12 Inbox items remain unreviewed." User explicitly confirms "I'll review these later" to proceed | REQ-RITL-004 |
| AC-RITL-005 | Month card in history shows "Quick Closed" with a distinct icon/color vs. "Fully Reviewed" | REQ-RITL-005 |
| AC-RITL-006 | Partner opens the month and sees the quick-close summary; can drill into each section | REQ-RITL-006 |
| AC-RITL-007 | User skips a month (no ritual); Quick Close is locked again. Must complete 6 consecutive full rituals to re-unlock | REQ-RITL-007 |
| AC-RITL-008 | User has completed only 3 rituals; Quick Close option is not visible | REQ-RITL-001 |

## EO-11: Data Export → REQ-EXPT-001 through REQ-EXPT-007

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-EXPT-001 | User selects date range (Jan-Mar 2026), taps "Export CSV"; file downloads with all transactions in that range | REQ-EXPT-001 |
| AC-EXPT-002 | CSV file opens correctly in spreadsheet software; columns are properly separated and labeled | REQ-EXPT-002 |
| AC-EXPT-003 | User applies category filter "Dining", exports CSV; only Dining transactions are included | REQ-EXPT-004 |
| AC-EXPT-004 | (R2) User generates "March 2026 Summary PDF"; PDF contains: income/expense summary, category pie chart, jar status, health score | REQ-EXPT-005, REQ-EXPT-006 |
| AC-EXPT-005 | (R2) PDF prints correctly on A4 paper; charts are legible | REQ-EXPT-007 |

## EO-12: Savings Maturity Alerts → REQ-SAVE-001 through REQ-SAVE-006

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-SAVE-001 | Savings detail shows: "Matures: 15 Aug 2026 (12 days from now)" | REQ-SAVE-001 |
| AC-SAVE-002 | 30 days before maturity, Inbox card: "Your [Savings Name] matures in 30 days. Plan ahead." | REQ-SAVE-002 |
| AC-SAVE-003 | On maturity date, Inbox ReviewItem: "[Savings Name] has matured. What would you like to do?" with Renew/Withdraw/Transfer options | REQ-SAVE-003, REQ-SAVE-004 |
| AC-SAVE-004 | User selects "Withdraw to Emergency Fund jar"; system creates a transaction moving the matured amount to the jar | REQ-SAVE-004 |
| AC-SAVE-005 | Snoozing a 7-day alert reschedules it for 7 days later (only once) | REQ-SAVE-006 |
| AC-SAVE-006 | Days-until-maturity countdown shows amber at 30 days, orange at 14 days, red at 7 days | REQ-SAVE-005 |

## EO-13: Card Interest Cost Display → REQ-CINT-001 through REQ-CINT-006

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-CINT-001 | Card detail shows: "This cycle's estimated interest: 156,000 VND" on card with carried balance | REQ-CINT-001 |
| AC-CINT-002 | Annual summary: "You've paid 2,340,000 VND in interest this year across all cards" | REQ-CINT-002 |
| AC-CINT-003 | Interest display is prominent (same visual weight as balance and due date) | REQ-CINT-003 |
| AC-CINT-004 | Card paid in full each cycle shows: "No interest — paid in full. Great!" (positive reinforcement) | REQ-CINT-001 |
| AC-CINT-005 | Interest trend chart shows monthly interest cost for the current year | REQ-CINT-006 |

## EO-16: Inbox Auto-Resolution Rules → REQ-ARUL-001 through REQ-ARUL-010

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-ARUL-001 | User creates rule: "When merchant matches 'Circle K', categorize as 'Dining', assign to 'Daily Expenses' jar" | REQ-ARUL-001 |
| AC-ARUL-002 | New transaction from "Circle K" arrives → auto-resolved to Dining + Daily Expenses → appears in Resolved tab, not active Inbox | REQ-ARUL-002 |
| AC-ARUL-003 | Auto-Resolution Log shows: "Aug 3, 10:15 — 'Circle K, 45,000 VND' → Dining, Daily Expenses (Rule: 'Circle K → Dining')" | REQ-ARUL-003, REQ-ARUL-008 |
| AC-ARUL-004 | User opens Resolved tab, taps "Undo" on auto-resolved item → item returns to active Inbox with original state | REQ-ARUL-004 |
| AC-ARUL-005 | User attempts to create 6th rule → error: "Maximum 5 active rules reached. Disable an existing rule first" | REQ-ARUL-006 |
| AC-ARUL-006 | Partner receives Inbox notification: "[Partner] created a new auto-resolution rule: 'Circle K → Dining'" | REQ-ARUL-007 |
| AC-ARUL-007 | On Inbox item detail: "This item matches rule: 'Circle K → Dining'. Create this rule?" preview | REQ-ARUL-009 |
| AC-ARUL-008 | User attempts to create rule with amount condition → system rejects: "Auto-resolution rules support merchant pattern matching only" | REQ-ARUL-005 |

## EO-18: Goal Progress Celebration → REQ-GOAL-001 through REQ-GOAL-005

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-GOAL-001 | User's "New Laptop" goal reaches 50%; confetti animation plays and message appears: "Halfway to your new laptop! Keep going!" | REQ-GOAL-001, REQ-GOAL-002 |
| AC-GOAL-002 | Goal reaches 100%; Inbox notification: "Congratulations! You've reached your goal: New Laptop. 15,000,000 VND saved." | REQ-GOAL-001, REQ-GOAL-003 |
| AC-GOAL-003 | Returning to the completed goal later shows "Completed" badge, not the celebration again | REQ-GOAL-005 |
| AC-GOAL-004 | No points, badges, or streak counters appear anywhere in the goal experience | REQ-GOAL-004 |

## EO-19: Simple Jar Reallocation UX → REQ-REAL-001 through REQ-REAL-007

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-REAL-001 | User taps "Move Money" on jar list → selects "Dining" as source (currently 3,000,000 VND) → selects "Groceries" as target → enters 500,000 → confirms | REQ-REAL-001, REQ-REAL-002, REQ-REAL-003 |
| AC-REAL-002 | After confirmation: Dining shows 2,500,000, Groceries shows +500,000. Ledger transaction created: "Transfer: Dining → Groceries" | REQ-REAL-005 |
| AC-REAL-003 | Before/after preview: "Dining: 3,000,000 → 2,500,000, Groceries: 5,000,000 → 5,500,000" | REQ-REAL-004 |
| AC-REAL-004 | Target jar selector excludes the source jar and any non-Active jars | REQ-REAL-003 |
| AC-REAL-005 | During locked month, "Move Money" is disabled with message: "Month is locked. Unlock to reallocate." | REQ-REAL-007 |

## EO-20: Transaction Split Support → REQ-SPLT-001 through REQ-SPLT-007

| ID | Acceptance Criteria | Maps To |
|---|---|---|
| AC-SPLT-001 | User taps "Split" on a 500,000 VND transaction → enters Split 1: "Groceries 350,000", Split 2: "Household Supplies 150,000" → confirms. Transaction shows "Split (2)" badge | REQ-SPLT-001, REQ-SPLT-004 |
| AC-SPLT-002 | Remaining amount displays as user enters splits: "500,000 total, 350,000 assigned, 150,000 remaining" | REQ-SPLT-007 |
| AC-SPLT-003 | Attempting to confirm with 480,000 assigned out of 500,000 shows error: "Split amounts must equal the transaction total (20,000 VND unassigned)" | REQ-SPLT-002, REQ-SPLT-007 |
| AC-SPLT-004 | Inbox ReviewItem for 500,000 VND supermarket transaction: user taps "Split" → assigns portions → each portion categorized individually | REQ-SPLT-006 |
| AC-SPLT-005 | Transaction detail for split transaction shows split breakdown: portion amounts, categories, jars | REQ-SPLT-005 |
| AC-SPLT-006 | Each split portion counts separately in category spending totals | REQ-SPLT-001 |

---

## Summary

| Category | Count |
|---|---|
| **New Acceptance Criteria** | 82 |
| **R2-Deferred ACs** | 7 (AC-SRCH-006, AC-CAL R2 items, AC-EXPT-004/005, AC-ARUL-*) |
| **R1-Ready ACs** | 75 |
