# User Lifecycle — Complete User Journey Traces

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Complete user journeys across time: personas, timelines, domains, emotions, friction, automation.

---

## Personas

### Daily Partner
**Goal:** Fast capture, clear next action.  
**Behavior:** Opens app multiple times per day. Needs <30s to record an expense and know what to do next.  
**Emotional Need:** Confidence that they're staying on plan without friction.

### Household Steward
**Goal:** Financial oversight, planning, ritual completion.  
**Behavior:** Uses app deeply 1-2x/week. Runs Month Ritual. Reviews Health. Adjusts policies.  
**Emotional Need:** Control and transparency. "I know where our money is and where it's going."

---

## Journey 1: Day 0 — First-Time User

**Timeline:** 1 hour (setup session)

### Flow

```
1. DOWNLOAD & AUTH
   App downloaded → Sign up with email → Email verified → BR-02b enforced
   Domain: Tenancy
   Emotion: Anticipation

2. CREATE HOUSEHOLD
   "Name your household" → Household created → BR-12: one active household
   Domain: Tenancy
   Emotion: Ownership

3. ONBOARDING (≤3 steps)
   Step 1: Add first account (checking) → Account created
   Step 2: Choose template (EO-06) → "Family with Kids" → Jars created
   Step 3: Set first goal (optional) → "Vacation Fund $3000"
   Domain: Accounts, Budgets/Jars, Goals
   Emotion: Progress

4. HOME — EMPTY STATE
   Empty transactions → "Start by recording your first expense"
   Empty Inbox → "Your Inbox is empty — great start!"
   Domain: Home, Transactions, Inbox
   Emotion: Ready

5. FIRST EXPENSE
   User captures: "$45 Groceries at Trader Joe's" → Auto-cat suggests "Groceries" (EO-01) → Confirmed
   Transaction created → Jar "Groceries" spending updated
   Domain: Transactions, Categories, Budgets/Jars
   Emotion: "That was easy!"

6. FIRST INBOX REVIEW
   No unmapped items yet → Inbox shows empty with "All caught up!"
   Domain: Inbox
   Emotion: Calm
```

### Domains Involved
Tenancy, Accounts, Budgets/Jars, Goals, Transactions, Categories, Inbox, Home

### Friction Points
- ⚠️ BR-19 template application must be non-destructive — but user doesn't know what jars they need yet. Customization is critical.
- ⚠️ First-time user has no recurring patterns, no health data. All surfaces show empty states. Empty state design matters.

### Automation Points
- Auto-categorization (EO-01) works from first transaction
- Template (EO-06) reduces jar setup from 10 minutes to 1 minute

---

## Journey 2: Daily — Partner A

**Timeline:** <30 seconds per interaction, 2-5x per day

### Flow

```
1. OPEN HOME
   See: Real position (account balances) + Plan pulse (jar spending %) + Inbox count
   Domain: Home, Accounts, Budgets/Jars, Inbox
   Emotion: Quick check — "Everything's fine" or "Uh oh"

2. CAPTURE EXPENSE
   "$12.50 at Coffee Shop" → Auto-cat: "Dining" (EO-01) → Confirm
   Transaction saved → Jar "Dining" spending +$12.50
   Inbox: no new item (mapped to existing jar)
   Domain: Transactions, Categories, Budgets/Jars
   Emotion: Done, moving on

3. (IF UNMAPPED) INBOX REVIEW
   Expense didn't match any jar → Inbox count +1
   User taps Inbox → Reviews unmapped item → Maps to "Miscellaneous" → Done
   Domain: Inbox, Budgets/Jars
   Emotion: Slight friction but resolved quickly
```

### Domains Involved
Home, Transactions, Categories, Budgets/Jars, Inbox, Accounts

### Friction Points
- ⚠️ If auto-categorization (EO-01) gets it wrong too often (>3 times per BR-16), rule should update. Until then, repeated corrections are friction.
- ⚠️ If category doesn't match any jar, Inbox grows. This is correct behavior but must be fast to resolve.

### Automation Points
- Auto-cat (EO-01) reduces manual category selection
- Jar spending auto-tracks from category match

---

## Journey 3: Weekly — Both Partners

**Timeline:** 10-15 minutes, 1x per week

### Flow

```
1. OPEN INBOX → ZERO
   Batch review all unmapped items (EO-07)
   Select multiple → Map all to correct jars in one action
   "Inbox Zero" achieved
   Domain: Inbox, Budgets/Jars
   Emotion: Satisfying — inbox zero is a dopamine hit

2. HEALTH GLANCE
   Check Health score → "78/100 — On Track" (EO-08)
   Quick narrative: "Your spending is 5% under plan. Savings up 3%."
   Domain: Health
   Emotion: Reassurance or concern

3. RECURRING CALENDAR CHECK (EO-03)
   See upcoming bills this week: "Internet $65 on Friday"
   Mentally account for it
   Domain: Planning (Calendar)
   Emotion: Prepared
```

### Domains Involved
Inbox, Budgets/Jars, Health, Planning

### Friction Points
- ⚠️ EO-07 batch operations must handle mixed item types (unmapped expenses, maturity decisions, payment reminders) — or separate them. Mixed batch could be confusing.
- ⚠️ Health score (EO-08) is only as good as its iteration data. If R1 iteration gives poor signals, score is misleading.

### Automation Points
- Batch Inbox operations (EO-07)
- Calendar auto-populated from RecurringPatterns (EO-03 ← EO-04)
- Health score auto-calculated

---

## Journey 4: Payday — Both Partners

**Timeline:** 5-15 minutes, 1-2x per month

### Flow

```
1. INCOME ARRIVES
   Salary deposit detected → Transaction created
   Domain: Accounts, Transactions
   Emotion: "Payday!"

2. ALLOCATION (per BR-04 policy)
   IF Auto: Income auto-allocated to jars → "Allocated per plan"
   IF Suggest: Inbox shows suggestion → Review → Adjust → Confirm
   IF Off: Inbox shows "Income received — allocate" → Manual allocation
   Domain: Inbox, Budgets/Jars, Goals
   Emotion: In control (if Suggest/Off) or effortless (if Auto)

3. GOAL FUNDING
   Jar allocations trigger goal progress updates
   "Vacation Fund: $1,500 / $3,000 (50%)" → EO-18 celebration!
   Domain: Goals
   Emotion: Progress toward dream

4. CONFIRM
   Review allocations → "Looks good" → Done
   Domain: Budgets/Jars
   Emotion: Set for the month
```

### Domains Involved
Accounts, Transactions, Inbox, Budgets/Jars, Goals, Planning

### Friction Points
- ⚠️ In Suggest mode, if suggestion is always wrong, user manually allocates every time. BR-04 should learn or user should switch to Auto or Off.
- ⚠️ Payday may trigger goal milestone (EO-18). Good thing — but don't interrupt allocation flow.

### Automation Points
- Auto-allocation (BR-04 Auto mode)
- Goal progress auto-calculated
- EO-18 milestone detection

---

## Journey 5: Bill Payment Day

**Timeline:** <1 minute per bill, 3-5x per month

### Flow

```
1. CALENDAR SHOWS BILL DUE
   EO-03: "Electricity $85 due today"
   Domain: Planning
   Emotion: "Right, that's today"

2. TRANSACTION CREATED
   Pattern generates transaction (EO-04 → Transaction)
   Auto-categorized: "Utilities" (EO-01)
   Domain: Transactions, Categories
   Emotion: Automatic

3. JAR DEDUCTION
   "Utilities" Jar spending updated
   Domain: Budgets/Jars
   Emotion: Accounted for

4. DONE
   Calendar updated: bill marked paid
   Domain: Planning
   Emotion: One less thing to worry about
```

### Domains Involved
Planning, Transactions, Categories, Budgets/Jars

### Friction Points
- ⚠️ If the actual bill amount differs from the pattern amount, transaction must be adjustable. Pattern-based transactions need an "actual vs. expected" concept.
- ⚠️ If bill doesn't auto-pay (user must manually pay), the transaction shouldn't be auto-created. It should be a reminder to pay.

### Automation Points
- Pattern → Transaction generation (EO-04)
- Auto-cat (EO-01)
- Calendar auto-update

---

## Journey 6: Goal Milestone

**Timeline:** Momentary, occurs naturally

### Flow

```
1. MILESTONE TRIGGERED
   Goal hits 25%, 50%, 75%, or 100%
   EO-18: celebration notification
   "You're halfway to your vacation!"
   Domain: Goals
   Emotion: Pride, motivation

2. REVIEW PROGRESS
   Check goal detail → See funding timeline → "On track for December"
   Domain: Goals, Budgets/Jars
   Emotion: "We're actually doing this"

3. CONTINUE
   No action needed → Keep going
   Domain: Goals
   Emotion: Motivated to save more
```

### Domains Involved
Goals, Budgets/Jars

### Friction Points
- ⚠️ Celebration is positive but must not be over-frequent. At most once per milestone per goal.
- ⚠️ If a goal is behind pace, a "we're behind" notification may be demotivating. EO-18 is celebration only.

### Automation Points
- Milestone detection automatic
- EO-18 celebration automatic

---

## Journey 7: Emergency Month

**Timeline:** Days to weeks, stressful period

### Flow

```
1. UNEXPECTED EXPENSE
   "Car repair $800" — not in any jar plan
   Transaction recorded → Category: "Auto"
   Domain: Transactions, Categories
   Emotion: Stress

2. JAR OVERSPENT
   No "Auto Repair" jar? → Goes to Inbox (BR-05)
   Or mapped to "Transportation" jar → BR-07 triggers: Warn
   Domain: Inbox, Budgets/Jars
   Emotion: "We didn't plan for this"

3. INBOX ALERTS
   Both partners see overspend alert
   Domain: Inbox, Tenancy
   Emotion: Need to discuss

4. REALLOCATION
   Partners discuss → Move $800 from "Emergency Fund" jar to cover
   EO-19 reallocation: From Emergency → To Transportation (or Auto)
   Domain: Budgets/Jars, Tenancy
   Emotion: Relief — covered

5. MONTH RITUAL NOTE
   Month close includes note: "Car repair — emergency, covered from emergency fund"
   Domain: MonthRitual
   Emotion: Recorded for posterity
```

### Domains Involved
Transactions, Categories, Inbox, Budgets/Jars, Tenancy, MonthRitual, Health

### Friction Points
- ⚠️ No "emergency mode" concept. An emergency looks identical to overspending on dining. The system treats them the same.
- ⚠️ Partners must discuss — but there's no "request jar reallocation approval" flow. EO-19 allows either partner to reallocate unilaterally (within household visibility).

### Automation Points
- BR-07 overspend detection automatic
- BR-13 partner visibility automatic
- BR-05 Inbox creation automatic

---

## Journey 8: Month Close — Both Partners

**Timeline:** 10-20 minutes, 1x per month

### Flow

```
1. RITUAL READY
   Month end → "It's time to close the month"
   Domain: MonthRitual
   Emotion: "Let's see how we did"

2. PREVIEW (BR-09: Assisted mode)
   Section 1: Income — "Earned $8,500 this month"
   Section 2: Spending — "Spent $6,200 across 8 jars"
   Section 3: Jar Performance — "Groceries under by $80, Dining over by $45"
   Section 4: Goals — "Vacation Fund at 55%, Emergency Fund at 80%"
   Section 5: Savings — "2 active products, $12,000 total"
   Section 6: Cards — "Card balance $450, payment due in 5 days"
   Domain: MonthRitual (reads from all domains)
   Emotion: Reviewing together

3. QUICK CLOSE? (EO-10)
   IF 6+ prior rituals (BR-23): "Quick Close available — just confirm the summary"
   IF <6 rituals: "Walk through each section" (Assisted mode)
   Domain: MonthRitual
   Emotion: "We know the drill" (Quick Close) or "Let's go through everything" (Assisted)

4. REVIEW & CORRECT
   Notice: "Wait, we spent $200 on Groceries last week — that's missing"
   Go back → Add missing transaction → Return to ritual → Updated
   Domain: MonthRitual, Transactions
   Emotion: Catch & fix

5. APPROVE
   "Looks right — approve"
   BR-08: Plan movements locked
   BR-24: Summary generated (if Quick Close)
   Domain: MonthRitual, Budgets/Jars
   Emotion: "Month done!"

6. SNAPSHOT & CELEBRATE
   Health snapshot created → Score trend updated
   "Month closed! You're doing great."
   Domain: Health
   Emotion: Accomplishment
```

### Domains Involved
MonthRitual, Transactions, Categories, Budgets/Jars, Goals, Savings, Cards, Installments, Health

### Friction Points
- ⚠️ Missing transactions discovered during ritual force backtracking. The ritual should be resumable after corrections.
- ⚠️ Quick Close (EO-10) with mandatory summary (BR-24) — the summary must be genuinely useful, not boilerplate.
- ⚠️ If partners disagree on a transaction categorization, there's no "flag for discussion" in the ritual flow.

### Automation Points
- Assisted mode (BR-09) — system walks through sections
- Quick Close auto-generates summary (EO-10, BR-24)
- Snapshot auto-created on approval

---

## Journey 9: Year Review

**Timeline:** 30 minutes, 1x per year

### Flow

```
1. 12 HEALTH SNAPSHOTS
   Scroll through 12 months of Health trends
   Income trend: "Up 8% year over year"
   Spending trend: "Housing stable, Dining up 15%"
   Savings trend: "From $5,000 to $14,200"
   Domain: Health
   Emotion: "Look how far we've come"

2. GOAL REVIEW
   Which goals completed? → "Vacation Fund done! Emergency Fund ongoing"
   Which goals need adjustment? → "House Down Payment: behind pace, extend timeline?"
   Domain: Goals
   Emotion: Strategic planning

3. POLICY REVISIT
   Review policies: Income allocation? Overspend policy? Template still right?
   Change if needed (BR-13: partner notified)
   Domain: Planning, Budgets/Jars, Tenancy
   Emotion: "Let's adjust for next year"
```

### Domains Involved
Health, Goals, Planning, Budgets/Jars, Tenancy

### Friction Points
- ⚠️ Health trends need 12 snapshots to be meaningful. If a month's ritual was skipped, the trend has a gap. What happens?
- ⚠️ Year review is not a formal ViNha feature. It relies on user initiative to scroll through data.

### Automation Points
- Health trends auto-generated from snapshots
- Goal progress tracked continuously

---

## Journey 10: New Partner Joins

**Timeline:** 5 minutes

### Flow

```
1. ADMIN INVITES
   Household Steward → "Invite Partner" → Enter email → Send
   Domain: Tenancy
   Emotion: "Let's do this together"

2. INVITEE ACCEPTS
   Invitee gets email → Creates account (BR-02b: single account) → Accepts invitation
   Domain: Tenancy
   Emotion: "I'm in"

3. PARTNER SEES EVERYTHING
   All accounts, transactions, jars, goals, health → visible
   BR-02a: RLS enforces household-only visibility
   Domain: All
   Emotion: "We're in this together"
```

### Domains Involved
Tenancy, Accounts, Transactions, Budgets/Jars, Goals, Health

### Friction Points
- ⚠️ New partner sees full financial history — what if they weren't supposed to see pre-join transactions? No "join date" visibility control.
- ⚠️ No onboarding for the joining partner. They see everything but don't know the jars or policies.

### Automation Points
- BR-02a: RLS auto-enforces household scope
- BR-02b: single account enforcement

---

## Journey 11: Financial Conflict Resolution

**Timeline:** Ongoing tension, resolved in one session

### Flow

```
1. DISAGREEMENT
   Partner A: "Let's eat out tonight" → Partner B: "We're over our Dining budget"
   Both open ViNha → Check Dining jar: "Spent $280 / $300 — only $20 left"
   Domain: Budgets/Jars
   Emotion: Friction

2. POLICY VISIBLE
   BR-07: Warn mode → "You're at 93% of Dining. Proceed with caution."
   Domain: Budgets/Jars
   Emotion: Objective data, not opinion

3. INBOX AS NEUTRAL SURFACE
   "We have $150 left in Entertainment jar — let's move $30 from there?"
   EO-19: Reallocate $30 from Entertainment → Dining
   Domain: Budgets/Jars, Tenancy
   Emotion: Compromise, not argument

4. RESOLVED
   "Okay, $30 moved. We can eat out."
   Both see the change → Both agree
   Domain: Budgets/Jars
   Emotion: Resolved with data
```

### Domains Involved
Budgets/Jars, Tenancy

### Friction Points
- ⚠️ This flow relies on both partners being willing to check the app during a disagreement. Real-life conflict may not involve app-checking.
- ⚠️ No "propose reallocation → partner approves" flow. EO-19 assumes unilateral action with visibility.

### Automation Points
- BR-07 overspend warning auto-displayed
- BR-13 partner visibility auto-enforced

---

## Journey Cross-Reference

| Journey | Frequency | Duration | Primary Persona | Peak Emotion |
|---------|-----------|----------|-----------------|--------------|
| Day 0 — Onboarding | Once | 1 hour | Household Steward | Progress |
| Daily Capture | 2-5x/day | <30s | Daily Partner | Routine |
| Weekly Review | 1x/week | 10-15min | Both | Satisfaction (Inbox Zero) |
| Payday | 1-2x/month | 5-15min | Household Steward | Relief |
| Bill Payment | 3-5x/month | <1min | Daily Partner | Automatic |
| Goal Milestone | Occasional | Moment | Both | Pride |
| Emergency Month | Rare | Days-weeks | Both | Stress → Relief |
| Month Close | 1x/month | 10-20min | Both | Accomplishment |
| Year Review | 1x/year | 30min | Household Steward | Perspective |
| Partner Joins | Rare | 5min | Household Steward | Inclusion |
| Financial Conflict | Occasional | Variable | Both | Tension → Resolution |
