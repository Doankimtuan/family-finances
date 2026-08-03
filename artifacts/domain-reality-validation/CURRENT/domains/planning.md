# Domain Reality Validation — Planning

## Reality Validation

### How Real People Interact With Planning/Automation

People don't think about "planning rules." They think about "my paycheck arrives on the 1st, my rent is $1,500, Netflix is $15.99, and I want to save $500." Financial planning in practice is about recurring patterns and habits, not formal rules.

**Daily/Weekly/Monthly Patterns:**
- **Payday:** "My paycheck is here — what happens to it?" (BR-04: income placement)
- **Monthly:** Noticing recurring bills. "Netflix charged me again."
- **Infrequently:** Setting up new recurring payments. Changing income allocation.

**Expectations from Financial Tools:**
Users expect:
- Recurring transaction detection ("we noticed this monthly charge")
- Income distribution automation ("split my paycheck across these categories")
- Bill reminders ("your rent is due in 3 days")
- Cash flow visibility ("what does my month look like?")

**Common Mistakes:**
- Forgetting about annual subscriptions until they charge
- Not adjusting automated allocations when circumstances change
- Over-automating and losing visibility ("I don't know where my money goes")
- Setting up rules that conflict

**Common Frustrations:**
- Rules are hard to configure ("if this then that" feels like programming)
- Automation breaks silently (rule misfires, stopped working)
- Can't see what rules are active and what they're doing
- Too many tools — recurring detection, bill pay, income allocation should be one thing

### ViNha Planning Model Fit

ViNha's Planning domain (automation rules, recurring detection, income placement) captures the right concepts but may be formalized at the wrong level for users. The "rules engine" framing (conditions, actions, priorities) is engineering-correct but user-unfriendly.

**Verdict:** The domain concept is correct; the implementation abstraction level may be too high. This is the most over-engineered domain.

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**Conceptually yes. The implementation abstraction may create a gap.**

**What's Correct:**
- Recurring patterns exist and should be detected
- Income placement needs automation (BR-04: Off|Suggest|Auto)
- Planning rules reduce repetitive manual work
- Default "Suggest" for income placement (BR-04) is smart — avoids over-automation

**What May Be Over-Engineered:**
1. **Rule priorities** — Users don't think about rule conflict resolution. "Rule A before Rule B" is an implementation detail, not a user concept.
2. **Condition complexity** — "If transaction matches merchant pattern AND amount is less than X AND category is Y" — users want "Netflix is $15.99/month," not conditional logic.
3. **Rule management** — Users don't want to "manage rules." They want to "set up recurring patterns" and forget about them.

### Dangerous Assumptions
**Rule priority assumptions:** If the Planning domain allows conflicting rules with priority resolution, users will be confused when rules don't fire as expected. "I set up a rule for this but it didn't work" — the priority system is the likely culprit.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Yes, automation supports good habits. But over-automation reduces awareness.**

**Behavioral Strengths:**
1. **Default effect (BR-04)** — Income placement defaults to "Suggest." Users are guided toward good allocation without being forced. This is behaviorally optimal.
2. **Habit formation** — Recurring rules reduce repetitive decisions. "Set it and forget it" for Netflix, rent, utilities.
3. **Reduced decision fatigue** — Automation handles routine money movements. Users focus on exceptions, not every transaction.

**Behavioral Risks:**
1. **Automation blindness** — When everything is automated, users stop looking. "I don't know what my subscriptions cost because I never see them." The Month Ritual is the counterbalance.
2. **Rule abandonment** — Rules that misfire or stop working erode trust. Users stop relying on automation after a few failures.
3. **Over-automation** — BR-04's "Auto" option for income placement could make users feel they've lost control. The "Suggest" default is the right balance.

**Friction Point:** Setting up rules feels like work. Users tolerate initial setup for obvious patterns (paycheck allocation) but won't maintain a complex rule library.

---

## Competitor Benchmark

### YNAB
- Scheduled transactions for recurring bills and income. Manual entry or bank sync.
- Strong: Simple. "This transaction repeats monthly." No rules engine.
- Weak: Limited automation. Users manually assign every dollar.
- ViNha Difference: ViNha's Planning is more automated but more complex.

### Copilot Money
- Recurring detection is automatic (AI-powered). No user configuration.
- Strong: Frictionless. It just works.
- Weak: No user control over what's detected. Can't add custom recurring patterns.
- ViNha Difference: ViNha offers more control at higher complexity. Copilot offers less control at lower complexity.

### Monarch Money
- Recurring detection with user review. Rules engine for auto-categorization.
- Strong: Good balance of automation and control. Rules are manageable.
- Weak: Rules UI is still complex. Users need to understand conditional logic.
- ViNha Difference: Similar concept. Monarch's rules are categorization-focused; ViNha's are allocation-focused.

### Simplifi
- Spending plan (income minus bills). Recurring bills detected automatically.
- Strong: Simplest approach. No rules to configure. Income minus bills = available.
- Weak: Less precise. No granular allocation automation.
- ViNha Difference: ViNha offers more precision at higher complexity. Simplifi's approach is simpler but less powerful.

**Key Insight:** Simplifi's spending plan is the simplest approach to recurring planning. ViNha's rules engine is the most powerful. The question: do users want power or simplicity? The evidence suggests simplicity.

---

## Simplicity Validation

### Is the Planning Model Optimally Simple?

**No. It's over-engineered for what users need.**

**Complexity Score:** Current 5/10, Optimal 3/10. Gap: -2 (needs simplification).

The rules engine (conditions, actions, priorities) is the right abstraction for a developer but the wrong abstraction for a household. Users want "my paycheck goes to these jars" and "Netflix is $15.99/month" — not "IF transaction.merchant matches pattern THEN assign to category."

**Simplification Opportunity:** Replace or complement the rules framework with a Recurring Pattern model:
- Pattern: merchant/description, typical amount, frequency, category, jar
- No conditions, no priorities, no conflict resolution
- Income placement (BR-04) at household level, not rule level

**What can be removed:**
- Rule priorities (defer until proven needed)
- Conditional rules (defer until proven needed)
- Rule management dashboard (simplify to pattern list)

**What should stay:**
- Recurring detection
- Income placement preferences (BR-04)
- Jar allocation automation

---

## Longevity Validation

### Will the Planning Model Age Well?

**Moderate-High risk of needing redesign if the rules framework is maintained.**

**Stress Points:**
1. **Market shift to cash-flow planning** — Simplifi's spending plan approach may become the dominant paradigm. ViNha's rule-based allocation may feel dated.
2. **AI-driven planning** — If AI can suggest optimal allocations based on spending history, manual rule configuration becomes unnecessary.
3. **Real-time income** — If gig economy income (variable, frequent) becomes more common, fixed paycheck allocation rules break.

**Evolution:** Simplify to Recurring Patterns within 12 months before users accumulate complex rules. The longer Planning stays as-is, the harder the migration.

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Currently feels like "Expense Tracker with Automation Rules." With simplification, could feel like "Household Money OS."**

ViNha's Planning domain has the right mission (automation, forecasting, habit) but the wrong implementation abstraction. Users should feel like they're setting up their household's financial rhythm, not configuring a rules engine.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Recurring Bill Calendar** — Calendar view of upcoming bills. Near-term priority (EO-03).
2. **Cash Flow Projections** — Future balance based on scheduled transactions. Future capability (FC-14).
3. **Spending Plan View** — Simplifi-style "income minus bills = available." Future capability.

### What Should Remain Intentionally Absent?

- **Conditional logic** — If/then/else rules. Remove from domain until proven needed.
- **Rule versioning** — Change tracking for rules. Engineering complexity with no user value.
- **Rule sharing** — "Share this rule with other households." No use case.

---

## Industry Best Practices

### Patterns to Adopt
1. **Simplifi's spending plan** — Income minus bills = available. Simple, intuitive.
2. **Copilot's auto-detection** — Recurring patterns detected without user configuration.
3. **Monarch's review-first** — Detected patterns presented for confirmation. Trust but verify.

### Patterns to Avoid
1. **Rule engines** — IFTTT-style rule configuration. Too complex for household finance.
2. **Silent automation** — Automation without visibility. Users should see what rules are doing.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-P1 | Simplify to Recurring Patterns | 7 | 7 | 6 | 7 | 5 | 4 | 7 | 8 |
| EO-P2 | Recurring Bill Calendar | 8 | 8 | 5 | 2 | 3 | 2 | 8 | 8 |
| EO-P3 | Conditional Rules (Only If Needed) | 5 | 5 | 7 | 5 | 5 | 5 | 5 | 4 |

**EO-P1 Description:** Replace rules engine with RecurringPattern model. Pattern: merchant, amount, frequency, category, jar. Remove priorities and conditional logic. Simplifies domain significantly. Migration complexity is high if done late.

**EO-P2 Description:** Calendar view of upcoming recurring bills and income. Projected balance. "Low balance" warnings before large bills.

**EO-P3 Description:** Add conditional logic only if user research proves it's needed. Default: no conditions. Avoid until validated.

---

## Verdict: APPROVED WITH EVOLUTION OPPORTUNITIES

**Confidence: MEDIUM**

The Planning domain concept is correct but the implementation abstraction (rules engine) is over-engineered. Simplification to Recurring Patterns (EO-P1) is the highest-impact domain evolution identified by this board.

**Justification:**
- Automation and recurring detection are essential
- BR-04 income placement defaults are correct
- Rules engine abstraction is too formal for users
- Simplifi's spending plan validates a simpler approach
- Migration complexity increases with time — simplify early

**Action Required:** Validate Planning complexity with real user testing during MKP development. If users find rules confusing, prioritize EO-P1 (simplify to patterns) within 12 months post-launch.
