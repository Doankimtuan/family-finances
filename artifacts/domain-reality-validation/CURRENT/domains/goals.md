# Domain Reality Validation — Goals

## Reality Validation

### How Real People Interact With Financial Goals

Financial goals are aspirational targets — "I want to save $10,000 for a house down payment." People engage with goals emotionally (excitement when progress is visible, discouragement when it's slow). The primary interaction is progress checking: "how close am I to my goal?"

**Daily/Weekly/Monthly Patterns:**
- **Monthly:** Checking goal progress after contributions. "We added $500 to the vacation fund this month."
- **Quarterly:** Reassessing goal targets and timelines. "Can we reach our goal by June?"
- **Life Events:** Creating new goals (new baby → college fund, new house → down payment). Achieving goals (celebration).

**Expectations from Goal-Tracking Tools:**
Users expect:
- Progress visualization (bar, percentage, "X of Y")
- Target date tracking ("on track" / "behind" / "ahead")
- Contribution tracking (how much added this month)
- Connection to savings accounts (where money for the goal lives)
- Multiple goal types: savings targets, debt payoff, savings rate

**Common Mistakes:**
- Setting unrealistic timelines for goals ("save $20,000 in 6 months on a $50,000 salary")
- Creating too many goals, diluting focus
- Not prioritizing goals — treating all goals as equally important
- Forgetting about goals after creating them (no regular review)
- Confusing "goal" with "jar" — a goal is a target; a jar is where allocated money lives

**Common Frustrations:**
- Goals feel abstract and disconnected from daily finances
- Progress is slow — motivation fades
- Can't link goals to actual savings accounts
- Goals compete for limited money — how to prioritize?
- Target dates feel arbitrary and stressful

### ViNha Goals Model Fit

ViNha's goals model (aspirational targets with progress tracking) is correctly positioned in Intention Plan. The distinction from jars is important: jars are allocation envelopes; goals are accumulation targets. A goal may be funded from one or more jars.

**Verdict:** The model is correct. The jar-linked goal model is a good simplification for MKP but may need expansion.

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**Yes, with simplification that is appropriate for MKP.**

**What's Correct:**
- Goals as targets, not accounts — correctly in Intention Plan
- Progress tracking toward a target amount
- Distinction from jars (jars are allocation; goals are accumulation)
- Jar-linked funding (money for "Vacation Goal" flows through "Vacation Jar")

**What's Simplified (Acceptable for MKP):**
1. **Single jar funding** — Goals are linked to one jar. Real goals may be funded from multiple sources. Future capability (EO-14).
2. **Linear progress** — Progress is assumed to be steady contributions. Real goal funding may be lumpy (tax refund, bonus).
3. **No investment growth** — If goal money is invested, growth accelerates progress. ViNha doesn't model this (F-Wealth).

### Dangerous Assumptions
**None identified.** The goals model is conservative — it tracks what you've saved toward a target, not what the target "should" be.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Yes, with goal salience as the primary behavioral mechanism.**

**Behavioral Strengths:**
1. **Present bias counter** — Goals make future benefits (vacation, home) more salient, reducing the tendency to spend now rather than save.
2. **Progress visualization** — Seeing "60% to goal" is motivating. Goal-gradient effect: people accelerate effort as they approach a goal.
3. **Commitment device** — Setting a public (household-visible) goal creates accountability. Partner visibility reinforces commitment.
4. **Achievement celebration** — Reaching a goal is a positive financial event. This should be celebrated in ViNha's UX.

**Behavioral Risks:**
1. **Goal overwhelm** — Too many goals dilute focus and motivation. Users should be guided toward 2-4 active goals.
2. **Unrealistic timelines** — Goals with impossible deadlines create discouragement. ViNha should suggest realistic timelines based on contribution capacity.
3. **Goal abandonment** — Goals created with enthusiasm may be forgotten. Regular review (Month Ritual) is the mitigation.

**Friction Point:** Goals without jar linkage may feel disconnected. "I have a vacation goal, but where's the money?" The jar link answers this but constrains funding flexibility (one jar per goal).

---

## Competitor Benchmark

### YNAB
- Goals are category-level: "target balance," "target date," "monthly contribution."
- Strong: Goals are integrated with budgeting. Categories with goals are visually distinct.
- Weak: Goals are tied to categories — no distinction between allocation and targeting.
- ViNha Difference: ViNha separates Goals from Jars. This is cleaner conceptually.

### Copilot Money
- No explicit goal tracking. Savings goals are implied through category budgets.
- Strong: Minimal. Goals are not a focus.
- Weak: No goal-specific features.
- ViNha Difference: ViNha's Goals domain is a significant addition over Copilot.

### Monarch Money
- Goals are separate from budgets. Progress tracking with projections.
- Strong: Good goal framework. Multiple goal types. Progress visualization.
- Weak: Goals compete with budgets for user attention.
- ViNha Difference: ViNha's jar-link model creates a cleaner connection between goals and allocation.

### Simplifi
- Savings goals are basic. Progress tracking. Connected to savings accounts.
- Strong: Simple. Goals are easy to set up.
- Weak: Limited goal types. Basic tracking.
- ViNha Difference: ViNha's Goals domain is more structured.

---

## Simplicity Validation

### Is the Goals Model Optimally Simple?

**Yes. Right complexity for MKP.**

The model has target amount, current progress, and jar linkage. It doesn't try to model investment growth, multiple funding sources, or complex goal types. This is correct for MKP.

**What can be removed?** Goal categories (if separate from jar categories) — simplify to jar-linked only.

**What is missing?** Multi-source funding (future), goal milestones (nice-to-have), goal celebration UX (nice-to-have).

---

## Longevity Validation

### Will the Goals Model Age Well?

**Moderate risk. User expectations for goal tracking may expand.**

**Stress Points:**
1. **Goal types** — Users may want debt payoff goals, savings rate goals, net worth goals. The current accumulation-only model constrains.
2. **Investment-linked goals** — If F-Wealth adds investment tracking, users will want goals linked to investment performance.
3. **Goal sharing** — Beyond household. Couples may want to share goals with financial advisors, family.

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Supports Household Money OS.**

Goals add the "why" to the "what" of jars. Jars tell you where money is going; goals tell you what you're building toward. This is the aspiration layer of the operating system.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Multi-Source Funding** — Goals funded from multiple jars. Future evolution (EO-14).
2. **Goal Milestones** — Intermediate targets (25%, 50%, 75%). Nice-to-have.
3. **Goal Templates** — Common goals (Emergency Fund, Vacation, Home Down Payment). Future capability.
4. **Progress Celebration** — Achievement recognition. Low priority (EO-18).

### What Should Remain Intentionally Absent?

- **Investment-linked goals** — F-Wealth scope.
- **Goal-based financial advice** — "You should save X for Y." ViNha is not an advisor.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-G1 | Multi-Source Funding | 6 | 7 | 5 | 4 | 4 | 3 | 6 | 6 |
| EO-G2 | Progress Celebration | 4 | 7 | 3 | 1 | 1 | 1 | 5 | 6 |
| EO-G3 | Goal Templates | 5 | 6 | 3 | 2 | 2 | 1 | 5 | 6 |

---

## Verdict: APPROVED WITH EVOLUTION OPPORTUNITIES

**Confidence: MEDIUM-HIGH**

The Goals domain model is correct and well-positioned. The single-jar funding model is appropriate for MKP. Multi-source funding (EO-G1) and progress celebration (EO-G2) are valuable evolutions for post-launch.

**Justification:**
- Accumulation-target model is correct
- Jar-link is a clean simplification
- Progress tracking supports healthy behavior
- Multi-source funding is a future need, not an MKP gap
- No dangerous assumptions or behavioral risks

**Action Required:** None for MKP. Plan for multi-source funding when usage data shows single-jar limitation.
