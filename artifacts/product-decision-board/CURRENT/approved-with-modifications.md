# Approved With Modifications — Full Product Specifications

## EO-03: Recurring Bill Calendar

**Domain:** Planning
**Validation Score:** 44 (Top Tier)
**Decision:** APPROVED WITH MODIFICATIONS
**Target Version:** R1
**Rollout Priority:** P1

### Modifications Required

1. **Scope Reduction for R1:** Ship ONLY the recurring bill/income calendar view — not the full cash-flow projection with projected account balances. The cash-flow projection engine is deferred to R2. This keeps R1 scope manageable and aligned with the EO-04 pattern simplification.

2. **Integration with EO-04:** The calendar must be built on top of RecurringPatterns (EO-04), not on the old PlanningRule engine. EO-04 is P0; this feature must ship after EO-04's RecurringPattern model is in place.

3. **No Low-Balance Warnings in R1:** Low-balance warnings require projected account balances, which are R2 scope. R1 calendar shows only: what bills are coming, when, and how much.

4. **Calendar View Only:** The calendar is a read-only view derived from RecurringPatterns. No direct editing of patterns from the calendar (editing goes through the Pattern management screen).

### Product Changes (as modified)

A calendar view showing upcoming recurring bills and income based on RecurringPatterns. Users see what's coming this week, this month. Each calendar entry links to the source RecurringPattern.

### Business Rules Impacted

- No new BRs created. Calendar is a view-layer feature on top of EO-04's RecurringPattern model.

### Requirements (R1 Scope)

- **REQ-CAL-001:** System shall display a monthly calendar view with recurring bill/income entries derived from active RecurringPatterns.
- **REQ-CAL-002:** System shall display the expected amount and category for each calendar entry.
- **REQ-CAL-003:** System shall provide "This Week" and "This Month" summary views showing total expected income and expenses.
- **REQ-CAL-004:** System shall allow tapping a calendar entry to navigate to the source RecurringPattern detail.
- **REQ-CAL-005:** System shall highlight today's date and show entries for the current day prominently.
- **REQ-CAL-006:** System shall indicate whether a pattern is income or expense via color coding (green/red).
- **REQ-CAL-007 (R2):** System shall project account balances based on upcoming patterns and current balance.
- **REQ-CAL-008 (R2):** System shall display low-balance warnings when projected balance falls below configurable threshold.

### Acceptance Criteria (R1 Scope)

- **AC-CAL-001:** Calendar shows: Aug 5 — "Rent 12,000,000 VND (expense)", Aug 15 — "Salary 30,000,000 VND (income)".
- **AC-CAL-002:** "This Month" summary: "Expected Income: 30,000,000 VND, Expected Expenses: 18,500,000 VND".
- **AC-CAL-003:** Tapping "Rent" entry navigates to the Rent RecurringPattern detail/edit screen.
- **AC-CAL-004:** Today (Aug 3) is highlighted; today's entries show at the top of the day view.
- **AC-CAL-005:** Income entries appear in green; expense entries in red.
- **AC-CAL-006:** Paused patterns do not appear on the calendar.

### UX Changes

- Monthly calendar view with colored entries
- "This Week" / "This Month" toggle/summary
- Calendar entry tap → navigate to pattern detail
- (R2) Balance projection line chart
- (R2) Low-balance warning banner

### Architecture Impact

- New cross-domain relationship: Calendar (Presentation) → Planning (RecurringPatterns)
- Calendar is a view-layer concern; no new domain logic
- (R2) Balance projection engine added to Planning module

### Database Impact

- No new tables for R1; calendar data is derived from `recurring_patterns` (EO-04)
- (R2) May require materialized balance projection data for performance

### API Impact

- New endpoint: `GET /api/planning/calendar?household_id=<uuid>&month=&year=`
- Response: array of calendar entries with date, pattern_id, merchant, amount, category, direction
- (R2) New endpoint: `GET /api/planning/projected-balance?household_id=<uuid>`

### Migration Strategy

- Ships after EO-04 deployment (dependency)
- Calendar data derived automatically from migrated RecurringPatterns
- No separate migration needed

---

## EO-10: Month Ritual Quick Close

**Domain:** Month Close
**Validation Score:** 39 (Top Tier)
**Decision:** APPROVED WITH MODIFICATIONS
**Target Version:** R1
**Rollout Priority:** P2

### Modifications Required

1. **Partner Visibility Mandatory:** The quick close option MUST show a summary of what would have been reviewed in the full ritual. The partner must be able to review this summary. Quick close does NOT mean "skip without looking" — it means "confirm faster because you've seen it before."

2. **Minimum Ritual Count Increased:** Quick close unlocks after 6 completed full rituals (not 3 as proposed). Three months is not enough to establish the ritual habit. Six months ensures the behavioral mechanism is well-established before offering the shortcut.

3. **Quick Close Summary Requirements:** The quick close summary must include: (a) income vs. expenses summary, (b) jar allocation status, (c) any overspent jars, (d) any un-reviewed Inbox items, (e) Health score change from last month. User must explicitly confirm each section or acknowledge "All looks good."

4. **Assisted Mode Remains Default:** Even after unlocking Quick Close, Assisted mode remains the default. Quick Close is an explicit choice, not a new default.

5. **Quick Close Audit Trail:** Quick-closed months are marked distinctly from fully-ritual-closed months. The distinction is visible to both partners.

### Product Changes (as modified)

After completing 6 full Month Rituals, users unlock a "Quick Close" option. Quick Close presents a mandatory summary of the month's key financial information. The user confirms each section. Quick Close is an explicit choice that supplements — not replaces — the full ritual. Assisted mode remains the default.

### Business Rules Impacted

- **BR-09 (Month Ritual mode defaults to Assisted):** Reinforced — Assisted remains default. Quick Close is an explicit user choice.
- **NEW BR-23: Quick Close Eligibility Rule** — Quick Close is available only after 6 completed full Month Rituals. The count resets if the household skips a month (no ritual completed). Quick-closed months count as completed rituals for eligibility purposes.
- **NEW BR-24: Quick Close Transparency Rule** — A quick-closed month must display a summary containing: income summary, expense summary, jar allocation status, overspent jars, unreviewed Inbox items, and Health score change. Both partners must have access to this summary. The month is visibly marked as "Quick Closed" (vs. "Fully Reviewed").

### Requirements (as modified)

- **REQ-RITL-001:** System shall unlock Quick Close option after 6 completed full Month Rituals.
- **REQ-RITL-002:** System shall present Quick Close as an explicit option alongside full ritual (Assisted remains default).
- **REQ-RITL-003:** Quick Close summary shall display: income vs. expenses summary, jar allocation status, overspent jars, unreviewed Inbox count, Health score change.
- **REQ-RITL-004:** System shall require explicit confirmation of each summary section.
- **REQ-RITL-005:** System shall mark the month as "Quick Closed" with distinct visual indicator.
- **REQ-RITL-006:** System shall make the quick-close summary accessible to both partners for review.
- **REQ-RITL-007:** System shall reset Quick Close eligibility if a month is skipped (no ritual of any type completed).

### Acceptance Criteria (as modified)

- **AC-RITL-001:** After completing 6 full Month Rituals, the ritual screen shows: "Start Full Ritual" (default) and "Quick Close" (new option).
- **AC-RITL-002:** User selects Quick Close → summary screen shows 5 sections. User reviews and confirms each.
- **AC-RITL-003:** Summary shows: "3 jars are overspent (Dining: -200k, Entertainment: -150k, Shopping: -50k)." User acknowledges.
- **AC-RITL-004:** Summary shows: "12 Inbox items remain unreviewed." Quick Close cannot proceed until Inbox is cleared (all items reviewed or dismissed) — or user explicitly confirms "I'll review these later."
- **AC-RITL-005:** Month card in history shows "Quick Closed" with a distinct icon/color vs. "Fully Reviewed."
- **AC-RITL-006:** Partner opens the month and sees the quick-close summary; can drill into each section.
- **AC-RITL-007:** User skips a month (no ritual); Quick Close is locked again. Must complete 6 consecutive full rituals to re-unlock.
- **AC-RITL-008:** User has completed only 3 rituals; Quick Close option is not visible.

### UX Changes

- Quick Close option card on ritual start screen (visible only when eligible)
- Quick Close summary screen with section-by-section confirmation
- Distinct "Quick Closed" badge on month history
- Partner-visible summary view
- Eligibility counter/progress indicator: "4 of 6 rituals completed to unlock Quick Close"

### Architecture Impact

- Month Close module gains Quick Close sub-capability
- Quick Close is a parallel path in the ritual flow (not a replacement)
- Month status enum extended: `fully_reviewed`, `quick_closed`, `skipped`

### Database Impact

- Modified: `month_rituals` table — new fields: `close_type` (enum: full, quick), `quick_close_summary` (JSON), `quick_close_confirmed_sections` (JSON array)
- New field: `household.quick_close_eligible` (boolean, derived from consecutive ritual count)

### API Impact

- Modified: `POST /api/rituals/:id/close` — accepts `close_type: quick` and `confirmed_sections`
- Modified: `GET /api/rituals/:id` — returns `close_type` and `quick_close_summary`
- New endpoint: `GET /api/rituals/quick-close-eligibility?household_id=<uuid>` — returns eligible, rituals_completed, rituals_needed

### Migration Strategy

- Existing completed rituals count toward eligibility (if 6+ exist, Quick Close is immediately available)
- All existing rituals marked as `close_type: full`
- No retroactive quick-close summaries generated

---

## EO-16: Inbox Auto-Resolution Rules

**Domain:** Inbox
**Validation Score:** 46 (Top Tier)
**Decision:** APPROVED WITH MODIFICATIONS
**Target Version:** R2
**Rollout Priority:** P2

### Modifications Required

1. **Deferred to R2:** Auto-resolution rules are powerful but dangerous if shipped before Inbox maturity. R1 focuses on manual review + batch operations (EO-07) + auto-categorization suggestions (EO-01). R2 introduces rules when users have established categorization patterns.

2. **Mandatory Undo:** Every auto-resolution action must be undoable within 30 days (not 10 seconds). Auto-resolved items remain in a "Resolved" tab of Inbox for 30 days with an "Undo" action. This is a non-negotiable safety requirement.

3. **Rule Complexity Cap:** Rules are limited to: merchant pattern match → category + jar. No conditional logic (if amount > X, if date is...). The Board explicitly rejected conditional planning rules (EO-23 REJECTED); the same principle applies here.

4. **Transparency Dashboard:** A dedicated "Auto-Resolution Log" screen shows every auto-resolved item with: what rule matched, when it was resolved, what action was taken. Both partners can view this. This log is permanent (not 30-day limited).

5. **Partner Notification:** When a new auto-resolution rule is created by one partner, the other partner receives an Inbox notification. Rules can be viewed by both partners.

6. **Rollout Gradual:** Rules are limited to 5 per household initially. This limit is raised based on usage data showing safe patterns. The limit prevents over-automation.

### Product Changes (as modified)

User-defined auto-resolution rules for Inbox items. Each rule matches a merchant pattern and auto-applies a category and jar assignment. Rules are transparent, reversible, and limited in complexity. A permanent audit log tracks every auto-resolution. Rules are partner-visible.

### Business Rules Impacted

- **BR-05 (Unmapped expenses → Inbox ReviewItems):** Extended — auto-resolved items are removed from the active Inbox queue but remain in the Resolved log.
- **BR-14 (AI may explain/suggest; must NOT invent balances or move money):** Referenced — auto-resolution rules are user-defined, not AI-driven. The system does not auto-create rules.
- **NEW BR-25: Auto-Resolution Undo Rule** — Auto-resolved items must remain undoable for 30 days. Undoing returns the item to the active Inbox queue in its pre-resolution state.
- **NEW BR-26: Auto-Resolution Transparency Rule** — Every auto-resolution action must be logged with: matched rule, merchant, original transaction, applied category, applied jar, timestamp. This log is permanent, partner-visible, and cannot be deleted.
- **NEW BR-27: Auto-Resolution Limit Rule** — Maximum 5 active auto-resolution rules per household. Limit reviewed quarterly based on usage data.

### Requirements (as modified)

- **REQ-ARUL-001:** System shall allow users to create auto-resolution rules: merchant pattern → category + jar.
- **REQ-ARUL-002:** System shall apply matching rules to new Inbox items automatically, moving them to the Resolved tab.
- **REQ-ARUL-003:** System shall log every auto-resolution action with full detail (per BR-26).
- **REQ-ARUL-004:** System shall retain resolved items in Resolved tab for 30 days with Undo action (per BR-25).
- **REQ-ARUL-005:** System shall not support conditional logic in rules (no amount thresholds, date conditions, etc.).
- **REQ-ARUL-006:** System shall enforce maximum 5 active rules per household (per BR-27).
- **REQ-ARUL-007:** System shall notify partner when a rule is created or modified.
- **REQ-ARUL-008:** System shall provide "Auto-Resolution Log" screen showing all auto-resolved items.
- **REQ-ARUL-009:** System shall display which rule would match a given Inbox item as a preview before rule creation.
- **REQ-ARUL-010:** System shall track "would have matched" statistics for rule effectiveness analysis.

### Acceptance Criteria (as modified)

- **AC-ARUL-001:** User creates rule: "When merchant matches 'Circle K', categorize as 'Dining', assign to 'Daily Expenses' jar."
- **AC-ARUL-002:** New transaction from "Circle K" arrives → auto-resolved to Dining + Daily Expenses → appears in Resolved tab, not active Inbox.
- **AC-ARUL-003:** Auto-Resolution Log shows: "Aug 3, 10:15 — 'Circle K, 45,000 VND' → Dining, Daily Expenses (Rule: 'Circle K → Dining')".
- **AC-ARUL-004:** User opens Resolved tab, taps "Undo" on auto-resolved item → item returns to active Inbox with original state.
- **AC-ARUL-005:** User attempts to create 6th rule → error: "Maximum 5 active rules reached. Disable an existing rule first."
- **AC-ARUL-006:** Partner receives Inbox notification: "[Partner] created a new auto-resolution rule: 'Circle K → Dining'".
- **AC-ARUL-007:** On Inbox item detail: "This item matches rule: 'Circle K → Dining'. Create this rule?" preview.
- **AC-ARUL-008:** User attempts to create rule with amount condition → system rejects: "Auto-resolution rules support merchant pattern matching only."

### UX Changes

- "Auto-Resolution Rules" screen in Settings
- Rule creation flow: merchant input (autocomplete), category picker, jar picker
- Resolved tab in Inbox (alongside Active)
- Undo action on resolved items
- Auto-Resolution Log screen (permanent history)
- Rule-match preview on Inbox item detail
- Partner notification for rule changes

### Architecture Impact

- Inbox module gains auto-resolution sub-capability (new subdomain)
- New domain concept: AutoResolutionRule
- New cross-domain relationship: AutoResolution → Transactions (read merchant)
- Rule engine is intentionally simple: string matching only, no expression evaluation

### Database Impact

- New entity: `auto_resolution_rules` (household_id, merchant_pattern, category_id, jar_id, is_active, created_by, created_at, updated_at)
- New entity: `auto_resolution_log` (rule_id, transaction_id, merchant_name, category_id, jar_id, resolved_at, undone_at)
- Enforced constraint: max 5 active rules per household

### API Impact

- New endpoint: `GET /api/inbox/rules?household_id=<uuid>`
- New endpoint: `POST /api/inbox/rules`
- New endpoint: `PATCH /api/inbox/rules/:id`
- New endpoint: `DELETE /api/inbox/rules/:id`
- New endpoint: `GET /api/inbox/resolved?household_id=<uuid>`
- New endpoint: `POST /api/inbox/resolved/:id/undo`
- New endpoint: `GET /api/inbox/auto-resolution-log?household_id=<uuid>`
- New endpoint: `GET /api/inbox/rule-preview?merchant=<string>&household_id=<uuid>`

### Migration Strategy

- R2 feature; no migration needed from R1
- Ships after EO-01 (Auto-Categorization) and EO-07 (Batch Operations) are stable
- Rule limit starts at 5; monitoring data informs limit adjustments
