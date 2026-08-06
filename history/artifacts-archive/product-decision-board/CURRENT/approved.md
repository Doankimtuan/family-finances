# Approved Features — Full Product Specifications

## EO-01: Auto-Categorization

**Domain:** Categories
**Validation Score:** 49 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Add automatic merchant-to-category mapping. When a transaction is created with a recognized merchant, the system suggests a category. The user must always confirm or override the suggestion. The system never auto-commits categorization without user action.

**Two-Phase Rollout:**
- **Phase 1 (R1):** Rule-based matching. The system ships with a built-in merchant-to-category mapping table. Users can add custom mappings. Match priority: user custom rule > system default rule.
- **Phase 2 (R2):** ML-based suggestions. The system learns from user overrides to improve suggestion accuracy per household.

### Business Rules Impacted

- **BR-05 (Unmapped expenses → Inbox ReviewItems):** Amended — transactions with auto-categorization suggestions still enter Inbox; the suggestion is pre-filled but not auto-applied. User must explicitly confirm or modify in Inbox.
- **BR-14 (AI may explain/suggest; must NOT invent balances or move money):** Referenced — auto-categorization is a "suggest" operation. No money movement. No balance changes. Fully compliant.
- **NEW BR-16: Auto-Categorization Override Rule** — When a user overrides an auto-categorization suggestion for a specific merchant N times (default: 3), the system updates the user's custom mapping to the user's preferred category. The old suggestion is retired for that user.

### Requirements

- **REQ-AUTO-001:** System shall maintain a default merchant-to-category mapping table shipped with the application.
- **REQ-AUTO-002:** System shall apply user-custom merchant-to-category mappings with priority over default mappings.
- **REQ-AUTO-003:** System shall display the suggested category on Inbox ReviewItems with a visual indicator that it is a suggestion (not a committed categorization).
- **REQ-AUTO-004:** System shall require explicit user confirmation (tap/click) to apply a suggested category.
- **REQ-AUTO-005:** System shall allow users to create custom merchant-to-category mappings from any transaction detail view.
- **REQ-AUTO-006:** System shall track override frequency per merchant per household.
- **REQ-AUTO-007:** System shall update user custom mapping when override threshold (default 3) is reached (per BR-16).
- **REQ-AUTO-008:** System shall display a confidence indicator (e.g., "Likely match" / "Best guess") on suggestions.
- **REQ-AUTO-009:** System shall allow users to disable auto-categorization per household.
- **REQ-AUTO-010:** System shall NEVER auto-commit a categorization without explicit user action.

### Acceptance Criteria

- **AC-AUTO-001:** Given a transaction with merchant "Circle K", the Inbox ReviewItem shows category "Dining" as a suggestion with a visual indicator.
- **AC-AUTO-002:** Given a transaction with merchant "Circle K" and a user custom rule mapping it to "Groceries", the suggestion shows "Groceries" (user rule wins).
- **AC-AUTO-003:** User must tap "Accept" to apply the suggested category; dismissing the Inbox item without confirmation leaves the transaction uncategorized.
- **AC-AUTO-004:** User can create a custom rule from any transaction: "Always categorize [Merchant] as [Category]".
- **AC-AUTO-005:** After overriding "Circle K → Dining" three times to "Groceries", the system automatically updates the custom rule.
- **AC-AUTO-006:** Disabling auto-categorization removes all suggestions from Inbox items; Inbox shows uncategorized items only.
- **AC-AUTO-007:** A partially matched merchant ("Circle K - 123 Main St") still matches "Circle K" base rule.

### UX Changes

- New suggestion chip/badge component on Inbox ReviewItems
- New "Manage Auto-Categories" screen in Settings with add/edit/delete custom rules
- Confidence indicator (color-coded or icon-based)
- "Create rule from this transaction" action in transaction detail
- Toggle in Settings: "Enable auto-categorization suggestions"

### Architecture Impact

- New domain concept: `AutoCategoryRule` in Categories bounded context
- New cross-domain relationship: Categories → Transactions (read: merchant name for matching)
- Categories module must expose rule-matching API consumed by Inbox
- Default mapping table shipped as configuration data (not in code)

### Database Impact

- New entity: `merchant_category_rules` (household_id, merchant_pattern, category_id, source: default|user, confidence, override_count)

### API Impact

- New endpoint: `GET /api/categories/auto-suggest?merchant=<string>&household_id=<uuid>`
- New endpoint: `POST /api/categories/rules` (create custom rule)
- New endpoint: `DELETE /api/categories/rules/:id`
- New endpoint: `GET /api/categories/rules?household_id=<uuid>`
- Modified: Inbox ReviewItem DTO to include `suggested_category` and `suggestion_confidence`

### Migration Strategy

- Ship default mapping table with R1 deployment
- No data migration required (no existing auto-categorization data)
- Users with existing manual categorization workflows are unaffected (opt-in feature)

---

## EO-02: Card Payment Due Dates

**Domain:** Cards
**Validation Score:** 42 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Display payment due dates, minimum payment amounts, and APR on card views. Add configurable payment reminder notifications (push notification, Inbox card). The Cards domain becomes financially safer by preventing missed payments.

### Business Rules Impacted

- No existing BRs directly modified. This is a new capability.
- **NEW BR-17: Payment Reminder Rule** — When a card has a payment due within the configured reminder window (default: 3 days), the system generates an Inbox notification and optional push notification. The notification persists until the payment is marked as made or the due date passes.
- **NEW BR-18: Minimum Payment Visibility Rule** — For cards with revolving credit, the minimum payment amount must always be displayed alongside the total balance. The system must warn when only the minimum payment is configured (indicating carried balance with interest accrual).

### Requirements

- **REQ-CARD-001:** System shall display next payment due date for each card on the card detail view.
- **REQ-CARD-002:** System shall display minimum payment amount for cards with revolving credit.
- **REQ-CARD-003:** System shall display APR (annual percentage rate) on card detail view.
- **REQ-CARD-004:** System shall generate Inbox notification when payment due date is within the configured reminder window.
- **REQ-CARD-005:** System shall send push notification for payment reminders (configurable per card).
- **REQ-CARD-006:** System shall allow users to configure reminder window per card (default 3 days, options: 1, 3, 5, 7 days).
- **REQ-CARD-007:** System shall allow users to mark a payment as "made" (manual confirmation, not a money movement).
- **REQ-CARD-008:** System shall display a "Payment Due" status indicator on card list view.
- **REQ-CARD-009:** System shall warn when payment configuration is set to minimum payment only (per BR-18).

### Acceptance Criteria

- **AC-CARD-001:** Card detail view shows: Total Balance, Available Credit, APR, Next Payment Due Date, Minimum Payment Amount.
- **AC-CARD-002:** 3 days before due date, an Inbox card appears: "Payment Due: [Card Name] — [Amount] by [Date]".
- **AC-CARD-003:** Push notification sent at configured reminder time (e.g., 9 AM on reminder day).
- **AC-CARD-004:** Marking payment as "made" removes the reminder notification and updates the "Next Payment Due" to the following cycle.
- **AC-CARD-005:** Card with due date within 24 hours shows "Due Tomorrow" with warning color on card list.
- **AC-CARD-006:** Card with past-due date shows "Overdue" with critical warning color.
- **AC-CARD-007:** User can configure reminder window per card; changes take effect immediately.

### UX Changes

- Enhanced card detail view with payment information section
- "Payment Due" / "Overdue" status badges on card list
- New "Payment Reminders" section in card settings
- Inbox card type: "Payment Reminder"
- Push notification for payment reminders

### Architecture Impact

- Cards module gains payment-tracking subdomain
- New cross-domain relationship: Cards → Notifications (for push reminders)
- New cross-domain relationship: Cards → Inbox (for reminder ReviewItems)

### Database Impact

- New fields on `cards`: `apr` (decimal), `next_payment_due_date` (date), `minimum_payment_amount` (decimal), `reminder_window_days` (integer), `reminders_enabled` (boolean)
- New entity: `payment_confirmations` (card_id, due_date, confirmed_at) — for tracking manual payment marks

### API Impact

- Modified: `GET /api/cards/:id` — returns new payment fields
- Modified: `PATCH /api/cards/:id` — accepts reminder configuration
- New endpoint: `POST /api/cards/:id/mark-payment` — mark payment as made
- New endpoint: `GET /api/cards/due-soon?household_id=<uuid>` — list cards with upcoming payments

### Migration Strategy

- New columns added with NULL defaults (no existing data affected)
- Reminder notifications disabled by default for existing cards
- Users are prompted to configure payment info during first card detail visit post-update

---

## EO-04: Simplify Planning to Patterns

**Domain:** Planning
**Validation Score:** 46 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P0 (MKP-Critical — must ship before Planning complexity grows)

### Product Changes

Replace the formal PlanningRule engine with an intuitive RecurringPattern model. A RecurringPattern describes: merchant (optional), amount pattern (exact or range), frequency (weekly/biweekly/monthly/quarterly/yearly), category, and direction (income/expense). Income placement setting moves to household-level configuration.

This simplification eliminates the current rule engine's conditional logic, priority chains, and conflict resolution — concepts that confused users. The new model is closer to how people think: "My rent is about 12M, monthly, Housing category."

### Business Rules Impacted

- **BR-04 (Income placement: Off|Suggest|Auto):** Retained but moved to household-level configuration (not per-rule). New households default to "Suggest".
- **BR-03 (Allocations target only Active jars):** Retained; pattern-based allocations respect the same constraint.
- **RETIRED: All existing PlanningRule-specific business rules** (priority, conflict resolution, chaining) — these are implementation details of the retired engine, not product rules.

### Requirements

- **REQ-PLAN-001:** System shall allow users to create RecurringPatterns with: merchant (optional), amount (exact or range), frequency, category, direction.
- **REQ-PLAN-002:** System shall match incoming transactions against RecurringPatterns and suggest the pattern's category and jar assignment.
- **REQ-PLAN-003:** System shall display matched patterns on the transaction detail view (e.g., "Matched: Monthly Rent pattern").
- **REQ-PLAN-004:** System shall support "Did you plan for this?" prompt for unmatched recurring transactions — suggesting the user create a pattern.
- **REQ-PLAN-005:** Income placement setting shall be at household level: Off, Suggest, Auto (per BR-04).
- **REQ-PLAN-006:** System shall display all active RecurringPatterns in a list view with next expected occurrence.
- **REQ-PLAN-007:** System shall allow users to pause/archive patterns without deleting.
- **REQ-PLAN-008:** System shall migrate existing PlanningRules to RecurringPatterns on upgrade (best-effort; rules that can't be mapped are listed for manual review).

### Acceptance Criteria

- **AC-PLAN-001:** User creates pattern: "Rent, ~12,000,000 VND, Monthly, Housing (expense)". Next month's rent transaction is automatically matched.
- **AC-PLAN-002:** Transaction for "Electricity — 856,000 VND" matches pattern "Utilities, 500k-1.5M, Monthly" — shows matched with confidence level.
- **AC-PLAN-003:** Unmatched recurring transaction (3+ occurrences, same merchant, similar amount) triggers "Create a pattern?" prompt in Inbox.
- **AC-PLAN-004:** Income placement set to "Auto" — all income transactions are automatically allocated per household allocation rules without Inbox review.
- **AC-PLAN-005:** Existing PlanningRules are migrated: simple rules become patterns; complex conditional rules are listed for user review.
- **AC-PLAN-006:** Pausing a pattern stops matching; archived patterns are hidden but restorable.

### UX Changes

- New "RecurringPatterns" screen replacing "Planning Rules" screen
- Pattern creation flow: simplified form (merchant, amount, frequency, category, direction)
- Pattern match indicator on transaction detail
- "Create Pattern" prompt on Inbox items for recurring unmatched transactions
- Household settings: Income Placement moved to household-level configuration panel
- Migration wizard for existing PlanningRule users

### Architecture Impact

- Planning bounded context: Replace PlanningRule domain model with RecurringPattern domain model
- Retire: RuleEngine, RulePriority, ConflictResolution, RuleChain concepts
- New: PatternMatcher service (simpler than rule engine)
- Existing BR-04 logic moves from Planning module to Household/Tenancy module

### Database Impact

- New entity: `recurring_patterns` (household_id, merchant_pattern, amount_min, amount_max, frequency, category_id, direction, is_active, is_archived)
- Migration: `planning_rules` table data migrated to `recurring_patterns`; complex/unmappable rules flagged
- `planning_rules` table marked deprecated (retained for rollback window, to be dropped in R2)
- Household settings: new `income_placement` field (enum: off, suggest, auto)

### API Impact

- New endpoints (replace existing PlanningRule endpoints):
  - `GET /api/planning/patterns?household_id=<uuid>`
  - `POST /api/planning/patterns`
  - `PATCH /api/planning/patterns/:id`
  - `DELETE /api/planning/patterns/:id`
  - `POST /api/planning/patterns/:id/pause`
  - `POST /api/planning/patterns/:id/archive`
  - `GET /api/planning/patterns/match?transaction_id=<uuid>`
- Modified: `GET /api/households/:id` — returns `income_placement`
- Modified: `PATCH /api/households/:id` — accepts `income_placement`
- Deprecated (retained for migration, removed in R2): All PlanningRule endpoints

### Migration Strategy

**Phase 1: Dual-write (R1 launch)**
1. Deploy RecurringPattern API alongside existing PlanningRule API
2. Migration script runs on deployment: maps simple rules to patterns, flags complex rules
3. UI shows RecurringPatterns screen; old Planning Rules accessible via "Legacy Rules" link for 30 days
4. New patterns created go to `recurring_patterns` only

**Phase 2: Cleanup (R2)**
1. Remove PlanningRule API endpoints
2. Drop `planning_rules` table
3. Remove migration UI link

---

## EO-05: Transaction Search/Filtering

**Domain:** Transactions
**Validation Score:** 39 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1 (basic) / R2 (advanced)
**Rollout Priority:** P1

### Product Changes

Add full-text search and multi-criteria filtering to the Transactions list. R1 delivers: search by merchant/counterparty name, filter by date range, filter by category, filter by account. R2 adds: filter by amount range, filter by jar, saved filter views.

### Business Rules Impacted

- No existing BRs impacted. This is a view-layer capability with no transactional side effects.

### Requirements

- **REQ-SRCH-001 (R1):** System shall support full-text search across merchant name and counterparty fields.
- **REQ-SRCH-002 (R1):** System shall support filtering by date range (from/to).
- **REQ-SRCH-003 (R1):** System shall support filtering by category (single or multi-select).
- **REQ-SRCH-004 (R1):** System shall support filtering by account (single or multi-select).
- **REQ-SRCH-005 (R1):** System shall combine search text with active filters (AND logic).
- **REQ-SRCH-006 (R1):** System shall display active filter count and allow clearing all filters.
- **REQ-SRCH-007 (R2):** System shall support filtering by amount range (min/max).
- **REQ-SRCH-008 (R2):** System shall support filtering by jar.
- **REQ-SRCH-009 (R2):** System shall support saving named filter views (e.g., "Groceries This Month").
- **REQ-SRCH-010 (R2):** System shall support quick-access to saved views.

### Acceptance Criteria

- **AC-SRCH-001:** Typing "Circle K" in search bar returns only transactions with "Circle K" in merchant name.
- **AC-SRCH-002:** Setting date filter to "This Month" and category to "Dining" returns only Dining transactions from the current month.
- **AC-SRCH-003:** Filtering by 2 accounts shows transactions from either account (OR logic within filter group).
- **AC-SRCH-004:** Search text "milktea" + category filter "Dining" returns Dining transactions matching "milktea" only.
- **AC-SRCH-005:** "Clear all filters" resets to unfiltered transaction list.
- **AC-SRCH-006 (R2):** User saves filter "Groceries over 500k this month" as a named view; can access it from quick-access menu.

### UX Changes

- Search bar on Transaction list screen
- Filter panel (slide-up or inline) with category, account, date, amount (R2), jar (R2) selectors
- Active filter indicator: "3 filters active" with clear button
- Saved views quick-access menu (R2)

### Architecture Impact

- Transactions module gains search/index sub-capability
- No new domain concepts; search is a query-layer concern

### Database Impact

- Full-text search index on transactions (merchant_name, description)

### API Impact

- Modified: `GET /api/transactions` — new query parameters: `search`, `date_from`, `date_to`, `category_ids`, `account_ids`, `amount_min`, `amount_max`, `jar_ids`
- New endpoint (R2): `POST /api/transactions/saved-views`
- New endpoint (R2): `GET /api/transactions/saved-views?household_id=<uuid>`
- New endpoint (R2): `DELETE /api/transactions/saved-views/:id`

### Migration Strategy

- R1: Deploy search index and new query parameters; existing clients unaffected
- R2: Add saved views table; no migration needed from R1

---

## EO-06: Jar Templates

**Domain:** Budgets/Jars
**Validation Score:** 39 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Provide pre-built jar templates that new users can select during onboarding. Templates include recommended jars, default allocation percentages, and category mappings. Users can customize after applying a template. Templates are not enforced — they are a starting point, not a constraint.

### Business Rules Impacted

- **BR-03 (Allocations target only Active jars):** Referenced — template-applied jars are Active by default.
- **NEW BR-19: Template Application Rule** — When a user applies a jar template, all template jars are created as Active jars with the template's suggested allocations. The user can modify or delete any jar immediately after application. Applying a template does not override existing jars.

### Requirements

- **REQ-TMPL-001:** System shall provide at minimum three jar templates: "Young Couple", "Family with Kids", "Minimalist".
- **REQ-TMPL-002:** Each template shall include: suggested jar names, default allocation percentages, and recommended category mappings.
- **REQ-TMPL-003:** System shall display template preview before application, showing all jars and allocations.
- **REQ-TMPL-004:** System shall allow users to edit template jars (name, allocation, category) before confirming application.
- **REQ-TMPL-005:** System shall not override existing jars when applying a template (per BR-19).
- **REQ-TMPL-006:** System shall offer templates during onboarding flow (post-household creation, pre-first transaction).
- **REQ-TMPL-007:** System shall allow access to templates from Settings → Jar Management at any time.
- **REQ-TMPL-008:** System shall display a "Start from scratch" option alongside templates.

### Acceptance Criteria

- **AC-TMPL-001:** New user selects "Family with Kids" template; preview shows 8 jars with allocations totaling 100%. User edits 2 jar names and adjusts 1 allocation, then confirms.
- **AC-TMPL-002:** User with existing jars opens template screen; applying "Young Couple" template adds new jars but preserves existing jars.
- **AC-TMPL-003:** "Minimalist" template shows 4 jars; user can change to 5 before applying.
- **AC-TMPL-004:** Onboarding flow presents template selection as an optional step; "Skip" allows starting with no jars.
- **AC-TMPL-005:** Total allocation always sums to 100%; adjusting one allocation auto-adjusts others proportionally during template editing.

### UX Changes

- Template selection screen in onboarding flow
- Template preview/edit modal
- "Jar Templates" access point in Settings
- Template card design: template name, jar count, brief description

### Architecture Impact

- Budgets/Jars module gains template sub-capability
- Templates are configuration data, not runtime logic
- Template engine is stateless: applies template → creates jars via existing jar creation API

### Database Impact

- New configuration table: `jar_templates` (template_id, locale, name, description, icon) — shipped as seed data
- New configuration table: `jar_template_items` (template_id, jar_name_key, suggested_allocation_pct, suggested_category_ids) — shipped as seed data
- No runtime tables needed; templates instantiate into existing `jars` table

### API Impact

- New endpoint: `GET /api/jars/templates` — returns available templates for locale
- New endpoint: `GET /api/jars/templates/:id` — returns template detail with items
- New endpoint: `POST /api/jars/templates/:id/apply` — applies template to household

### Migration Strategy

- Ship template seed data with R1 deployment
- No data migration needed
- Existing users discover templates via Settings entry point; no forced migration

---

## EO-07: Inbox Batch Operations

**Domain:** Inbox
**Validation Score:** 45 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Allow users to select multiple Inbox ReviewItems and apply the same action to all selected items. Supported batch actions: categorize all (same category), assign all to same jar, dismiss all. Grouped review view: items grouped by merchant for batch-by-merchant review.

### Business Rules Impacted

- **BR-05 (Unmapped expenses → Inbox ReviewItems):** Extended — batch-categorized items still respect BR-05; the categorization is applied but the Inbox item is marked as reviewed (not auto-deleted).
- No other BRs impacted.

### Requirements

- **REQ-IBOX-001:** System shall support multi-select on Inbox ReviewItems with select-all and select-individual.
- **REQ-IBOX-002:** System shall display batch action bar when 1+ items are selected with available actions: Categorize, Assign to Jar, Dismiss.
- **REQ-IBOX-003:** System shall apply the selected action to all selected items simultaneously.
- **REQ-IBOX-004:** System shall show a confirmation dialog before executing batch action with item count.
- **REQ-IBOX-005:** System shall support undo for batch actions within a 10-second window.
- **REQ-IBOX-006:** System shall provide "Review by Merchant" view: items grouped by merchant name, with batch-select per merchant group.
- **REQ-IBOX-007:** System shall allow "Select all from [Merchant]" in grouped view.
- **REQ-IBOX-008:** System shall display batch operation progress for operations on >20 items.

### Acceptance Criteria

- **AC-IBOX-001:** User selects 5 Inbox items → action bar appears with "Categorize (5)", "Assign to Jar (5)", "Dismiss (5)".
- **AC-IBOX-002:** User selects Categorize → "Dining" → confirmation dialog "Categorize 5 items as Dining?" → confirms → all 5 items updated.
- **AC-IBOX-003:** After batch categorization, an undo toast appears: "5 items categorized. Undo?" with 10-second countdown.
- **AC-IBOX-004:** "Review by Merchant" view shows: "Circle K (12 items)", "Grab (8 items)", "Unrecognized (3 items)".
- **AC-IBOX-005:** User taps "Select all from Circle K" → batch categorizes all 12 as "Transportation".
- **AC-IBOX-006:** Batch operation on 50 items shows progress indicator; items update incrementally.

### UX Changes

- Multi-select mode on Inbox list (checkboxes, select-all toggle)
- Batch action bar (bottom sheet or floating bar)
- Undo toast component for batch operations
- "Review by Merchant" toggle/grouped view
- Batch progress indicator for large operations

### Architecture Impact

- Inbox module gains batch-processing sub-capability
- Batch operations use existing single-item Inbox API with concurrent execution
- Undo mechanism: temporary state held client-side for 10 seconds; revert via API calls

### Database Impact

- No new tables required
- Batch operations use existing Inbox ReviewItem endpoints

### API Impact

- New endpoint: `POST /api/inbox/batch` — accepts array of item IDs and batch action (categorize, assign_jar, dismiss) with parameters
- New endpoint: `GET /api/inbox/grouped?household_id=<uuid>&group_by=merchant`
- Response includes item count per group and item IDs

### Migration Strategy

- No data migration required
- Batch endpoint is additive; existing single-item flow unchanged

---

## EO-08: Health Score Iteration

**Domain:** Health
**Validation Score:** 38 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1 (ongoing through R2)
**Rollout Priority:** P2

### Product Changes

Iterate the Health score based on real usage data after initial launch. Focus on actionable insights over comprehensive scoring. Show health score trends over time (past 3 months, 6 months). The Health module remains read-only per BR-14.

### Business Rules Impacted

- **BR-14 (Health is Read-only):** Explicitly respected — Health score iteration only changes what is displayed and how scores are calculated. Health never writes to jars, accounts, or transactions.

### Requirements

- **REQ-HLTH-001:** System shall track Health score history per household (monthly snapshots).
- **REQ-HLTH-002:** System shall display Health score trend chart (3-month and 6-month views).
- **REQ-HLTH-003:** System shall provide actionable insights alongside the score: "Your Dining spending is 30% over plan this month. Consider adjusting."
- **REQ-HLTH-004:** System shall iterate score calculation based on anonymized usage data analysis (quarterly).
- **REQ-HLTH-005:** System shall display which factors contributed most to the current score (positive and negative).
- **REQ-HLTH-006:** System shall never auto-adjust jars, allocations, or budgets based on Health score (BR-14 compliance).

### Acceptance Criteria

- **AC-HLTH-001:** Health dashboard shows: Current Score (e.g., 72/100), Trend (↑ or ↓ from last month), Top 3 factors (positive and negative).
- **AC-HLTH-002:** Trend chart shows monthly scores for the past 6 months with score breakdown by category.
- **AC-HLTH-003:** Insight: "Your emergency fund is at 45% of target. At current rate, you'll reach target in 4 months."
- **AC-HLTH-004:** Score calculation update (quarterly): new weights applied, users see "Score Methodology Updated" notice on next visit.
- **AC-HLTH-005:** Health dashboard never includes "Adjust jar" or "Move money" call-to-action buttons (BR-14 compliance).

### UX Changes

- Health trend chart component
- Factor breakdown: positive contributors (green), negative contributors (amber/red)
- Actionable insight cards
- "Score Methodology" link explaining calculation
- Monthly score snapshot in notification/Inbox: "Your Health score this month: 72 (↑ 3)"

### Architecture Impact

- Health module gains analytics sub-capability
- Score calculation becomes configurable (weights, thresholds) rather than hardcoded

### Database Impact

- New entity: `health_score_snapshots` (household_id, month, score, factor_breakdown JSON, calculated_at)
- Monthly cron/scheduled job to compute and store snapshots

### API Impact

- Modified: `GET /api/health/score` — returns current score + trend + top factors
- New endpoint: `GET /api/health/trend?household_id=<uuid>&months=6`
- New endpoint: `GET /api/health/insights?household_id=<uuid>`

### Migration Strategy

- Begin tracking snapshots from R1 launch (no backfill for historical data)
- First trend chart available after 3 months of data

---

## EO-09: Installment Interest Visibility

**Domain:** Installments
**Validation Score:** 40 (Top Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Display amortization summary for installment plans: total interest paid to date, remaining interest, principal vs. interest breakdown per payment. Users can see the true cost of their installment plans and make informed prepayment decisions.

### Business Rules Impacted

- **BR-11 (Installment completes when paid_installments >= num_installments):** Referenced — completion calculation unchanged; interest visibility is display-only.
- **NEW BR-20: Interest Transparency Rule** — The system shall always display total interest cost and remaining interest for any installment plan with interest rate > 0%. Interest information must be visible from the installment detail view without requiring navigation to a separate screen.

### Requirements

- **REQ-INST-001:** System shall display total interest paid to date on installment detail view.
- **REQ-INST-002:** System shall display remaining interest to be paid.
- **REQ-INST-003:** System shall display per-payment breakdown: principal portion and interest portion.
- **REQ-INST-004:** System shall display amortization summary: "You've paid X in interest. Y remains. Total interest cost: Z."
- **REQ-INST-005:** System shall display "You could save X in interest by prepaying" when user has surplus in jars.
- **REQ-INST-006:** System shall calculate and display effective interest rate (APR equivalent).

### Acceptance Criteria

- **AC-INST-001:** Installment detail shows: Original Amount, Total Interest, Paid (Principal + Interest), Remaining (Principal + Interest), Effective APR.
- **AC-INST-002:** Payment history list shows each payment with Principal/Interest split: "Payment 5/12: 2,000,000 VND (Principal: 1,750,000, Interest: 250,000)".
- **AC-INST-003:** Amortization card: "So far you've paid 1,250,000 VND in interest. 1,750,000 VND remains."
- **AC-INST-004:** User with surplus in Emergency Fund jar sees: "You could save 1,200,000 VND in interest by prepaying now" (calculated).

### UX Changes

- Enhanced installment detail view with amortization section
- Payment history with principal/interest breakdown
- "Prepayment Savings" insight card
- Visual indicator: progress bar shows principal vs interest proportion

### Architecture Impact

- Installments module gains amortization-calculation sub-capability
- Amortization is calculated, not stored (derived from installment parameters)

### Database Impact

- New fields on `installments`: `interest_rate` (decimal), `interest_type` (enum: fixed, reducing_balance)
- Amortization data is computed at read time, not stored

### API Impact

- Modified: `GET /api/installments/:id` — returns amortization summary, interest breakdown
- Modified: `GET /api/installments/:id/payments` — each payment includes principal/interest split
- New endpoint: `GET /api/installments/:id/prepayment-savings` — calculates potential interest savings

### Migration Strategy

- `interest_rate` and `interest_type` added with NULL defaults
- Users prompted to enter interest rate during first visit to installment detail post-update
- Amortization calculations only shown for installments with interest_rate > 0

---

## EO-11: Data Export CSV/PDF

**Domain:** Shared
**Validation Score:** 35 (Middle Tier)
**Decision:** APPROVED
**Target Version:** R1 (CSV) / R2 (PDF)
**Rollout Priority:** P2

### Product Changes

Allow users to export their financial data. R1: CSV export of transactions and accounts. R2: PDF monthly summary reports with charts and summaries. This addresses the fundamental user need of data portability and external analysis.

### Business Rules Impacted

- No existing BRs impacted. Data export is a read-only, user-initiated operation.

### Requirements

- **REQ-EXPT-001 (R1):** System shall allow export of all transactions for a date range as CSV.
- **REQ-EXPT-002 (R1):** System shall include in CSV: date, merchant, amount, category, jar, account, direction.
- **REQ-EXPT-003 (R1):** System shall allow export of account list as CSV.
- **REQ-EXPT-004 (R1):** System shall apply active filters to CSV export scope.
- **REQ-EXPT-005 (R2):** System shall generate PDF monthly summary: income total, expense total, by-category breakdown, jar allocation status, Health score.
- **REQ-EXPT-006 (R2):** PDF shall include simple charts (pie: expense by category, bar: monthly trend).
- **REQ-EXPT-007 (R2):** PDF shall be formatted for A4 printing.

### Acceptance Criteria

- **AC-EXPT-001:** User selects date range (Jan-Mar 2026), taps "Export CSV"; file downloads with all transactions in that range.
- **AC-EXPT-002:** CSV file opens correctly in spreadsheet software; columns are properly separated and labeled.
- **AC-EXPT-003:** User applies category filter "Dining", exports CSV; only Dining transactions are included.
- **AC-EXPT-004 (R2):** User generates "March 2026 Summary PDF"; PDF contains: income/expense summary, category pie chart, jar status, health score (72).
- **AC-EXPT-005 (R2):** PDF prints correctly on A4 paper; charts are legible.

### UX Changes

- "Export" option in transaction list (with date range picker)
- "Export Accounts" option in account list
- "Generate Monthly Report" option in Health/Reports section (R2)
- Download progress indicator

### Architecture Impact

- New Shared module capability: data export service
- PDF generation is server-side (not client-side) for consistency

### Database Impact

- No new tables required
- All export data is read from existing tables

### API Impact

- New endpoint: `GET /api/export/transactions/csv?date_from=&date_to=&filters...`
- New endpoint: `GET /api/export/accounts/csv?household_id=<uuid>`
- New endpoint (R2): `GET /api/export/monthly-report/pdf?household_id=<uuid>&month=&year=`

### Migration Strategy

- No migration needed; additive feature

---

## EO-12: Savings Maturity Alerts

**Domain:** Savings
**Validation Score:** 36 (Middle Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Notify users when savings products are approaching maturity (30, 14, 7 days). Create Inbox ReviewItem at maturity for the user to decide what to do with the funds. This implements BR-10's requirement for savings maturity flows.

### Business Rules Impacted

- **BR-10 (Savings maturity → Inbox-guided flows):** Directly implemented by this feature. The maturity flow is now: Alert (30/14/7 days) → Inbox ReviewItem at maturity → User decides action.
- **NEW BR-21: Savings Maturity Notification Rule** — When a savings product is within 30 days of maturity, the system generates a notification at 30, 14, and 7 days. At maturity, an Inbox ReviewItem is created requiring user action (renew, withdraw, transfer).

### Requirements

- **REQ-SAVE-001:** System shall display maturity date on savings product detail.
- **REQ-SAVE-002:** System shall generate Inbox notification at 30, 14, and 7 days before maturity.
- **REQ-SAVE-003:** System shall create Inbox ReviewItem on maturity date requiring user action.
- **REQ-SAVE-004:** System shall offer maturity actions: Renew (same terms), Withdraw (to jar), Transfer (to different savings product).
- **REQ-SAVE-005:** System shall display "Days until maturity" countdown on savings list view.
- **REQ-SAVE-006:** System shall allow users to snooze maturity alerts (remind again in 7 days).

### Acceptance Criteria

- **AC-SAVE-001:** Savings detail shows: "Matures: 15 Aug 2026 (12 days from now)".
- **AC-SAVE-002:** 30 days before maturity, Inbox card: "Your [Savings Name] matures in 30 days. Plan ahead."
- **AC-SAVE-003:** On maturity date, Inbox ReviewItem: "[Savings Name] has matured. What would you like to do?" with Renew/Withdraw/Transfer options.
- **AC-SAVE-004:** User selects "Withdraw to Emergency Fund jar"; system creates a transaction moving the matured amount to the jar.
- **AC-SAVE-005:** Snoozing a 7-day alert reschedules it for 7 days later (only once).
- **AC-SAVE-006:** Days-until-maturity countdown shows amber at 30 days, orange at 14 days, red at 7 days.

### UX Changes

- Maturity date and countdown on savings list/detail
- Maturity Inbox card with plan-ahead messaging
- Maturity ReviewItem with action options
- "Plan for Maturity" early-action button

### Architecture Impact

- Savings module gains maturity-tracking sub-capability
- Scheduled job: daily check for upcoming maturities → generate notifications

### Database Impact

- New field on `savings`: `maturity_date` (date) — may already exist; verify
- New field: `maturity_alert_snoozed_until` (date)

### API Impact

- Modified: `GET /api/savings/:id` — returns maturity_date, days_until_maturity
- New endpoint: `POST /api/savings/:id/mature` — process maturity action
- Modified: Scheduled job for maturity checks

### Migration Strategy

- `maturity_date` populated from existing savings data if available; nullable otherwise
- Users prompted to enter maturity date during first visit to savings detail post-update
- Existing matured savings products (past maturity date) flagged for user review

---

## EO-13: Card Interest Cost Display

**Domain:** Cards
**Validation Score:** 38 (Middle Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Visualize total interest cost on carried (revolving) credit card balances. Show "You paid X in interest this year" and cumulative interest since card was added. The display is purely informational — it shows the cost of carrying a balance without telling the user what to do.

### Business Rules Impacted

- No existing BRs impacted. Informational display only.
- **NEW BR-22: Interest Cost Visibility Rule** — For any credit card with a carried balance (not paid in full each cycle), the system must display the estimated interest cost for the current billing cycle and the cumulative interest cost for the current calendar year.

### Requirements

- **REQ-CINT-001:** System shall display estimated interest cost for current billing cycle on card detail.
- **REQ-CINT-002:** System shall display cumulative interest paid in current calendar year.
- **REQ-CINT-003:** System shall display interest cost as a visual element (not hidden in a settings menu).
- **REQ-CINT-004:** System shall calculate estimated interest based on: carried balance, APR, days in billing cycle.
- **REQ-CINT-005:** System shall display year-over-year interest comparison (e.g., "30% less interest than last year").
- **REQ-CINT-006:** System shall display interest cost trend (month-by-month for current year).

### Acceptance Criteria

- **AC-CINT-001:** Card detail shows: "This cycle's estimated interest: 156,000 VND" on card with carried balance.
- **AC-CINT-002:** Annual summary: "You've paid 2,340,000 VND in interest this year across all cards."
- **AC-CINT-003:** Interest display is prominent (same visual weight as balance and due date).
- **AC-CINT-004:** Card paid in full each cycle shows: "No interest — paid in full. Great!" (positive reinforcement).
- **AC-CINT-005:** Interest trend chart shows monthly interest cost for the current year.

### UX Changes

- Interest cost card on card detail view
- Annual interest summary across all cards
- Interest trend mini-chart (R2 scope)
- Positive reinforcement for paid-in-full cards

### Architecture Impact

- Cards module gains interest-calculation sub-capability
- Interest is calculated, not stored (derived from balance, APR, cycle data)

### Database Impact

- No new tables required
- Relies on EO-02's `apr` field and existing balance data

### API Impact

- Modified: `GET /api/cards/:id` — returns estimated_interest_this_cycle, interest_ytd, interest_trend
- New endpoint: `GET /api/cards/interest-summary?household_id=<uuid>` — aggregate interest across all cards

### Migration Strategy

- Feature activated when EO-02's APR data is populated
- Cards without APR show "Add APR to see interest cost" prompt
- Historical interest data not backfilled; starts tracking from feature activation

---

## EO-18: Goal Progress Celebration

**Domain:** Goals
**Validation Score:** 28 (Lower Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P2

### Product Changes

Add positive reinforcement when goals reach milestones: 25%, 50%, 75%, and 100% completion. Simple celebratory UI elements (confetti animation, congratulatory message). No gamification mechanics (no points, badges, streaks).

### Business Rules Impacted

- No existing BRs impacted. Pure UX enhancement.

### Requirements

- **REQ-GOAL-001:** System shall display a celebration animation when a goal reaches 25%, 50%, 75%, or 100%.
- **REQ-GOAL-002:** System shall display a congratulatory message specific to each milestone.
- **REQ-GOAL-003:** System shall create a positive Inbox notification at 100% completion.
- **REQ-GOAL-004:** System shall not include points, badges, levels, or any gamification mechanics.
- **REQ-GOAL-005:** Celebration is shown once per milestone (not on every visit after reaching it).

### Acceptance Criteria

- **AC-GOAL-001:** User's "New Laptop" goal reaches 50%; confetti animation plays and message appears: "Halfway to your new laptop! Keep going!"
- **AC-GOAL-002:** Goal reaches 100%; Inbox notification: "Congratulations! You've reached your goal: New Laptop. 15,000,000 VND saved."
- **AC-GOAL-003:** Returning to the completed goal later shows "Completed" badge, not the celebration again.
- **AC-GOAL-004:** No points, badges, or streak counters appear anywhere in the goal experience.

### UX Changes

- Confetti/simple animation component for milestones
- Milestone message component
- Completed-goal Inbox card
- "Completed" badge on goal card

### Architecture Impact

- Goals module gains milestone-tracking sub-capability
- Minimal architecture impact (UI-layer feature)

### Database Impact

- New field on `goals`: `last_celebrated_milestone` (enum: 25, 50, 75, 100, null)

### API Impact

- Modified: `GET /api/goals/:id` — returns current_milestone (nearest 25/50/75/100 not yet celebrated)
- Modified: `POST /api/goals/:id/celebrate-milestone` — marks milestone as celebrated

### Migration Strategy

- `last_celebrated_milestone` defaults to null
- Existing goals at or above milestone thresholds do not retroactively celebrate
- Feature activates on first progress update after deployment

---

## EO-19: Simple Jar Reallocation UX

**Domain:** Budgets/Jars
**Validation Score:** 33 (Middle Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P2

### Product Changes

Improve the UX for reallocating money between jars. Replace current manual edit flow with a quick-select or simple adjustment interface. Users select source jar, target jar, and amount. The system handles the reallocation as a single user action.

### Business Rules Impacted

- **BR-03 (Allocations target only Active jars):** Referenced — reallocation only allowed between Active jars.
- **BR-08 (Approved Month Ritual locks normal plan movements):** Referenced — reallocations blocked during locked months.

### Requirements

- **REQ-REAL-001:** System shall provide "Move Money" action accessible from jar list and jar detail.
- **REQ-REAL-002:** System shall display source jar selector with current allocation displayed.
- **REQ-REAL-003:** System shall display target jar selector (filtered to Active jars only, excluding source jar).
- **REQ-REAL-004:** System shall show before/after allocation preview before confirming.
- **REQ-REAL-005:** System shall create a ledger transaction for the reallocation (per BR-01 — real money movement in ledger).
- **REQ-REAL-006:** System shall display reallocation history in jar detail.
- **REQ-REAL-007:** System shall block reallocation when month is locked (per BR-08).

### Acceptance Criteria

- **AC-REAL-001:** User taps "Move Money" on jar list → selects "Dining" as source (currently 3,000,000 VND) → selects "Groceries" as target → enters 500,000 → confirms.
- **AC-REAL-002:** After confirmation: Dining shows 2,500,000, Groceries shows +500,000. Ledger transaction created: "Transfer: Dining → Groceries".
- **AC-REAL-003:** Before/after preview: "Dining: 3,000,000 → 2,500,000, Groceries: 5,000,000 → 5,500,000".
- **AC-REAL-004:** Target jar selector excludes the source jar and any non-Active jars.
- **AC-REAL-005:** During locked month, "Move Money" is disabled with message: "Month is locked. Unlock to reallocate."

### UX Changes

- "Move Money" button/action on jar list and jar detail
- Quick-select flow: source → target → amount → confirm
- Before/after preview
- Reallocation history list on jar detail
- Disabled state with explanation during locked months

### Architecture Impact

- Budgets/Jars module gains reallocation sub-capability
- Reallocation creates real ledger transactions (crosses into Ledger bounded context)

### Database Impact

- New transaction type: `jar_reallocation` in ledger transactions
- No new tables; uses existing `transactions` table with new type

### API Impact

- New endpoint: `POST /api/jars/reallocate` — { source_jar_id, target_jar_id, amount }
- Modified: `GET /api/jars/:id` — returns reallocation_history
- New endpoint: `GET /api/jars/:id/reallocations` — paginated reallocation history

### Migration Strategy

- Additive feature; no migration needed
- Existing manual reallocations (if any) remain as-is

---

## EO-20: Transaction Split Support

**Domain:** Transactions
**Validation Score:** 39 (Middle Tier)
**Decision:** APPROVED
**Target Version:** R1
**Rollout Priority:** P1

### Product Changes

Allow users to split a single transaction across multiple categories with individual amounts. Example: a 500,000 VND supermarket transaction split as 350,000 Groceries + 150,000 Household Supplies. Each split portion gets its own category and jar assignment. The sum of splits must equal the transaction total.

### Business Rules Impacted

- **BR-05 (Unmapped expenses → Inbox ReviewItems):** Extended — a split transaction creates one Inbox ReviewItem per unconfirmed split. Confirmed splits bypass Inbox.

### Requirements

- **REQ-SPLT-001:** System shall allow splitting a transaction into 2+ portions, each with its own category and amount.
- **REQ-SPLT-002:** System shall require that the sum of split amounts equals the transaction total.
- **REQ-SPLT-003:** System shall allow each split portion to be assigned a different jar.
- **REQ-SPLT-004:** System shall display split indicator on transaction list (e.g., "Split: 2 categories").
- **REQ-SPLT-005:** System shall show split detail when tapping a split transaction.
- **REQ-SPLT-006:** System shall support splitting from Inbox ReviewItem view.
- **REQ-SPLT-007:** System shall validate split amounts before confirming (sum = total, no negative amounts).

### Acceptance Criteria

- **AC-SPLT-001:** User taps "Split" on a 500,000 VND transaction → enters Split 1: "Groceries 350,000", Split 2: "Household Supplies 150,000" → confirms. Transaction shows "Split (2)" badge.
- **AC-SPLT-002:** Remaining amount displays as user enters splits: "500,000 total, 350,000 assigned, 150,000 remaining".
- **AC-SPLT-003:** Attempting to confirm with 480,000 assigned out of 500,000 shows error: "Split amounts must equal the transaction total (20,000 VND unassigned)."
- **AC-SPLT-004:** Inbox ReviewItem for 500,000 VND supermarket transaction: user taps "Split" → assigns portions → each portion categorized individually.
- **AC-SPLT-005:** Transaction detail for split transaction shows split breakdown: portion amounts, categories, jars.
- **AC-SPLT-006:** Each split portion counts separately in category spending totals.

### UX Changes

- "Split" action on transaction detail and Inbox ReviewItem
- Split entry UI: dynamic list of split lines (category + amount), running remaining counter
- Split indicator badge on transaction list items
- Split breakdown display on transaction detail

### Architecture Impact

- Transactions module gains split sub-capability
- New domain concept: TransactionSplit — a child entity of Transaction
- Category/jar reporting must handle split portions correctly

### Database Impact

- New entity: `transaction_splits` (transaction_id, category_id, jar_id, amount, note)
- Transaction total remains on `transactions` table
- Sum of `transaction_splits.amount` for a transaction must equal `transactions.amount`

### API Impact

- Modified: `POST /api/transactions` — accepts optional `splits` array
- Modified: `GET /api/transactions/:id` — returns `splits` array if split
- New endpoint: `PUT /api/transactions/:id/splits` — create/modify splits
- Modified: Category/jar spending aggregation queries to account for splits

### Migration Strategy

- Additive feature; existing transactions unaffected
- Splits are optional; non-split transactions behavior unchanged
