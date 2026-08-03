# Decision Lifecycle — Complete Traces

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Every important financial decision traced: who decides, what they need to know, what domains provide that information, what happens after.

---

## 1. Receive Salary Decision

**Decision:** How should this income be allocated?

### Decision Maker
Household Steward (or Daily Partner if policy allows)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Income amount | Transaction record | Transactions |
| Current jar balances | Jar allocations for month | Budgets/Jars |
| Goal funding needs | Goal targets and progress | Goals |
| Upcoming bills | RecurringPattern calendar (EO-03) | Planning |
| Last month's allocation | Previous Month Ritual snapshot | MonthRitual |
| Allocation policy | BR-04 setting (Off/Suggest/Auto) | Planning |

### Decision Flow

```
Income arrives (S0)
  → BR-04 policy check: Auto / Suggest / Off
  → If Auto: allocated per RecurringPattern rules → Done
  → If Suggest: Inbox ReviewItem with allocation suggestion
      → User reviews suggestion
      → Adjust allocation if desired
      → Confirm → Jars funded
  → If Off: Inbox ReviewItem with no suggestion
      → User manually allocates to jars
      → Confirm → Jars funded
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Jar balances updated | Budgets/Jars |
| Goal progress updated (if linked) | Goals |
| Transaction marked as allocated | Transactions |
| Inbox item resolved | Inbox |

### Domains Participating
Transactions, Inbox, Budgets/Jars, Goals, Planning, Categories

### Business Rules Governing
BR-03 (Active jars only), BR-04 (Income placement policy)

---

## 2. Spending Decision

**Decision:** Do I spend this money? Which Jar does it come from?

### Decision Maker
Daily Partner (the one spending)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Jar remaining balance | Current jar allocation - spent | Budgets/Jars |
| Account balance | Real account balance | Accounts |
| Category match | Auto-categorization suggestion (EO-01) | Categories |
| Overspend policy | BR-07 setting | Budgets/Jars |
| Partner's recent spending | Recent transactions | Transactions |

### Decision Flow

```
Pre-spend check (optional)
  → Check Jar remaining: "Can I afford this?"
  
Spending occurs
  → Transaction created
  → Auto-categorization suggests category (EO-01)
  → User confirms / overrides
  → If category matches jar: spending tracked automatically
  → If no match: Inbox ReviewItem created (BR-05)
  → BR-07 check: Warn / Block / Allow negative
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Transaction recorded | Transactions |
| Jar spending updated | Budgets/Jars |
| Inbox item (if unmapped) | Inbox |
| Overspend alert (if triggered) | Inbox |

### Domains Participating
Accounts, Transactions, Categories, Budgets/Jars, Inbox, Tenancy

### Business Rules Governing
BR-01, BR-05, BR-07, BR-16

---

## 3. Overspend Decision

**Decision:** A Jar is overspent. What do we do?

### Decision Maker
Both Partners (BR-07 visibility; BR-13 policy change visibility)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Which jar overspent | Jar balance | Budgets/Jars |
| Overspend amount | Spending - allocation | Budgets/Jars |
| Other jar balances | Current jars | Budgets/Jars |
| Overspend policy | BR-07 setting | Budgets/Jars |
| Partner view | Partner's spending context | Tenancy |

### Decision Flow

```
Jar exceeds allocation
  → BR-07 policy fires
  → If Warn: Inbox alert to both partners
      → Partners see overspend
      → Options: (a) Do nothing — accept negative jar
                 (b) Reallocate from another jar (EO-19)
                 (c) Adjust budget to reflect reality
  → If Block: Transaction blocked (pre-spend check)
  → If Allow Negative: No alert, jar goes negative
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Jar balance updated (if reallocation) | Budgets/Jars |
| Other jar balance adjusted | Budgets/Jars |
| Policy visibility (BR-13 if policy change) | Tenancy |
| Month Ritual note | MonthRitual |

### Domains Participating
Budgets/Jars, Inbox, Tenancy, MonthRitual

### Business Rules Governing
BR-06 (movement magnitudes positive), BR-07 (overspend policy), BR-13 (policy partner-visible)

---

## 4. Savings Maturity Decision

**Decision:** My savings product matured. What do I do with the money?

### Decision Maker
Household Steward (high-value financial decision)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Matured amount | Savings product data | Savings |
| Current rates (external) | User's own research | N/A (outside ViNha) |
| Account balances | Real accounts | Accounts |
| Goal funding status | Goals needing funding | Goals |
| Jar allocations | Current jar plan | Budgets/Jars |

### Decision Flow

```
Maturity alert fires (BR-21: 30/14/7 days)
  → 30 days: "Your savings matures in 30 days — plan ahead"
  → 14 days: "2 weeks until maturity — review options"
  → 7 days: "1 week — make your decision"
  
Maturity arrives
  → Inbox ReviewItem created (BR-10)
  → Options: (a) Renew — create new Savings product
             (b) Withdraw — money to Account
             (c) Transfer — move to different Savings product
  → User decides
  → Transaction(s) created
  → Original Savings product marked matured/closed
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| New Savings product (if Renew) | Savings |
| Credit Transaction (if Withdraw) | Transactions |
| Account balance updated | Accounts |
| Inbox item resolved | Inbox |
| Health reflected | Health |

### Domains Participating
Savings, Inbox, Accounts, Transactions, Health

### Business Rules Governing
BR-10 (maturity → Inbox), BR-21 (alert cascade), BR-14

---

## 5. Month Close Decision

**Decision:** Do I approve this month's financial snapshot?

### Decision Maker
Both Partners (Month Ritual is a joint ceremony)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| All transactions | Transaction list for month | Transactions |
| Category breakdown | Category spending totals | Categories |
| Jar performance | Planned vs. actual per jar | Budgets/Jars |
| Goal progress | Current vs. target | Goals |
| Savings status | Active savings products | Savings |
| Card balances | Card statements | Cards |
| Installment progress | Debt reduction | Installments |
| Inbox resolution rate | Resolved / total Inbox items | Inbox |
| Overspend events | Any jar overspends this month | Budgets/Jars |

### Decision Flow

```
Month Ritual ready (BR-09: defaults to Assisted mode)
  → Preview: all sections shown
  → User reviews each section
  → Option: Quick Close (EO-10)
      → Eligibility: 6+ prior rituals (BR-23)
      → If eligible: Quick Close with mandatory summary (BR-24)
  → User approves ritual
  → BR-08: Plan movements locked
  → Snapshot created
  → Celebration!
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Plan locked (BR-08) | Budgets/Jars |
| Month snapshot saved | MonthRitual |
| Health score updated | Health |
| New month plan foundation | Planning |

### Domains Participating
MonthRitual, Transactions, Categories, Budgets/Jars, Goals, Savings, Cards, Installments, Inbox, Health, Planning

### Business Rules Governing
BR-08 (lock on approve), BR-09 (default assisted), BR-23 (quick close eligibility), BR-24 (quick close summary)

---

## 6. Policy Change Decision

**Decision:** Should we change a financial policy?

### Decision Maker
Admin Partner (initiates); Both Partners (acknowledge per BR-13)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Current policy setting | Policy data | Planning/Budgets |
| Reason for change | Partner discussion | Tenancy |
| Impact on jars | Projected effect | Budgets/Jars |
| Historical context | Past ritual snapshots | MonthRitual |

### Decision Flow

```
Admin changes policy (e.g., BR-04 from Suggest to Auto)
  → BR-13: material policy change recorded
  → Partner notified: "Admin changed income allocation to Auto"
  → Partner acknowledges
  → Policy effective
  → Future behavior uses new policy
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Policy updated | Planning/Budgets |
| Audit trail created | Tenancy |
| Partner notified | Tenancy |
| Future allocations use new policy | Planning |

### Domains Participating
Planning, Budgets/Jars, Tenancy

### Business Rules Governing
BR-13 (policy changes partner-visible)

---

## 7. Goal Adjustment Decision

**Decision:** Should we change a goal's target or timeline?

### Decision Maker
Both Partners (shared aspiration)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Current goal progress | % of target, trend | Goals |
| Linked jar performance | Jar allocation history | Budgets/Jars |
| Health trends | Income/expense patterns | Health |
| Upcoming commitments | RecurringPattern calendar | Planning |

### Decision Flow

```
Review goal progress
  → Goal at 30% after 6 months (target 12 months) — behind pace
  → Options: (a) Extend timeline
             (b) Reduce target
             (c) Increase jar funding
             (d) Keep as-is
  → Partners decide
  → Goal updated
  → Jar allocations adjusted if needed (EO-19)
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Goal target/timeline updated | Goals |
| Jar allocations adjusted | Budgets/Jars |

### Domains Participating
Goals, Budgets/Jars, Planning, Health

### Business Rules Governing
BR-03 (funding through Active jars)

---

## 8. Card Payment Decision

**Decision:** How much should I pay on my credit card?

### Decision Maker
Daily Partner (or whoever manages the card)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Statement balance | Card statement | Cards |
| Minimum payment | BR-18 minimum visible | Cards |
| APR / interest rate | EO-02 | Cards |
| Interest cost if carrying balance | BR-22 display | Cards |
| Account balance | Can we afford full payment? | Accounts |
| Due date | BR-17 reminder | Cards |

### Decision Flow

```
Payment due approaching (BR-17: 3-day reminder)
  → Inbox ReviewItem: "Card payment due in 3 days"
  → User checks: balance, minimum, full
  → BR-22: if carrying balance, interest cost visible
  → Decision: Pay minimum / full / custom
  → Payment Transaction created
  → Card status updated
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Payment Transaction | Transactions |
| Account debited | Accounts |
| Card balance reduced | Cards |
| Interest cost updated | Cards |
| Inbox resolved | Inbox |

### Domains Participating
Cards, Inbox, Transactions, Accounts

### Business Rules Governing
BR-17 (3-day reminder), BR-18 (minimum visible), BR-22 (interest cost)

---

## 9. Jar Reallocation Decision

**Decision:** Move money from one Jar to another mid-month

### Decision Maker
Either Partner (but visible to both, BR-13)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Source jar balance (remaining) | Jar data | Budgets/Jars |
| Destination jar balance (overspent?) | Jar data | Budgets/Jars |
| Reallocation amount | User input | Budgets/Jars |
| Movement direction | BR-06: explicit direction required | Budgets/Jars |
| Partner visibility | Will partner see this? | Tenancy |

### Decision Flow

```
User identifies need: "Dining jar overspent, Groceries jar has extra"
  → Open EO-19 reallocation UI
  → Select: From "Groceries" → To "Dining" → Amount $50
  → BR-06: direction explicit (from A to B, positive amount)
  → Confirm
  → Both jars updated
  → BR-13: if material, partner notified
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Source jar reduced | Budgets/Jars |
| Destination jar increased | Budgets/Jars |
| Reallocation recorded | Budgets/Jars |
| Partner notified (if material) | Tenancy |

### Domains Participating
Budgets/Jars, Tenancy

### Business Rules Governing
BR-06 (positive magnitudes, explicit direction), BR-13

---

## 10. Template Application Decision (EO-06)

**Decision:** Which jar template should we start with?

### Decision Maker
Household Steward (during onboarding)

### Information Needed

| Information | Provided By | Domain |
|-------------|-------------|--------|
| Template options | Available templates | Budgets/Jars |
| Template descriptions | Suggested jars for each template | Budgets/Jars |
| Household composition | How many people, lifestyle | Tenancy |

### Decision Flow

```
New household created
  → "Choose a template to get started"
  → Options: [Young Couple, Family with Kids, Single Professional, Shared Housing, Custom]
  → User selects template
  → Suggested jars shown: "Groceries, Rent, Utilities, Dining, Savings..."
  → User customizes: rename, add, remove
  → BR-19: Apply — jars created as Active
  → Done
```

### Post-Decision Effects

| Effect | Domain |
|--------|--------|
| Jars created (Active status) | Budgets/Jars |
| Ready for first income allocation | Budgets/Jars |

### Domains Participating
Budgets/Jars, Tenancy

### Business Rules Governing
BR-19 (template application non-destructive, Active jars)

---

## Decision Cross-Reference

| Decision | Who | Domains Consulted | Post-Decision Domains |
|----------|-----|-------------------|-----------------------|
| Salary Allocation | Household Steward | Transactions, Jars, Goals, Planning | Jars, Goals, Inbox |
| Spending | Daily Partner | Jars, Accounts, Categories | Transactions, Jars, Inbox |
| Overspend | Both Partners | Jars, Tenancy | Jars, Inbox, Tenancy |
| Savings Maturity | Household Steward | Savings, Accounts, Goals | Savings, Transactions, Inbox |
| Month Close | Both Partners | All domains | Jars (locked), Health |
| Policy Change | Admin + Both | Planning, Jars, Tenancy | Planning, Tenancy |
| Goal Adjustment | Both Partners | Goals, Jars, Health | Goals, Jars |
| Card Payment | Daily Partner | Cards, Accounts | Transactions, Cards, Inbox |
| Jar Reallocation | Either Partner | Jars, Tenancy | Jars, Tenancy |
| Template Application | Household Steward | Templates, Tenancy | Jars |
