# Domain Reality Validation — Health

## Reality Validation

### How Real People Interact With Financial Health

Financial health is not a concept most people actively track. Unlike physical health (steps, weight, sleep), financial health lacks a standardized score or metric. People assess their financial health informally: "Am I stressed about money?" "Can I handle an emergency?" "Am I saving enough?" These are qualitative assessments, not quantitative scores.

**Daily/Weekly/Monthly Patterns:**
- **Stress moments:** "Can I afford this?" Financial health is felt, not measured.
- **Monthly:** Informal assessment during bill paying. "We're doing okay" or "We need to cut back."
- **Life events:** Job loss, major purchase, new baby — financial health becomes suddenly salient.

**Expectations from Financial Health Tools:**
Users expect:
- Net worth (the most common "financial health" metric)
- Spending analysis and trends
- Savings rate
- Debt-to-income ratio
- Credit score (often conflated with financial health)

**Common Mistakes:**
- Equating income with financial health (high earners can be financially unhealthy)
- Equating net worth with financial health (illiquid wealth doesn't pay bills)
- Ignoring financial health until a crisis forces attention
- Comparing financial health to others (social comparison is toxic in finance)

**Common Frustrations:**
- No clear "am I okay?" answer from financial tools
- Metrics are fragmented across accounts and tools
- Financial health feels abstract — hard to improve
- Past financial mistakes feel permanent in health scores

### ViNha Health Model Fit

ViNha's Health domain (read-only financial mirror) is the most experimental domain. No competitor has an explicit "financial health" score or narrative. The concept is innovative but its value is unproven.

**Verdict:** The model is architecturally correct (read-only, BR-14 enforced). The question is whether users derive value from it. This domain has the lowest confidence score.

---

## Financial Validation

### Does the Model Reflect Real Financial Behavior?

**The concept is sound; the execution is unproven.**

**What's Correct:**
- BR-14: Health must never write. This is architecturally enforced and non-negotiable.
- Health as read-only reflection — it shows, doesn't act.
- Score, narrative, scenarios — the right abstraction layers.

**What's Unproven:**
1. **Health score methodology** — What metrics compose the score? How are they weighted? What's a "good" score? Without a validated methodology, the score may feel arbitrary.
2. **Actionability** — Health is read-only by design (BR-14). Can users act on health insights without Health suggesting actions? If Health says "your savings rate is low," what does the user do? The answer should be in Plan, not Health.
3. **Frequency of value** — Health doesn't change daily. Weekly or monthly is the relevant timescale. If users check Health infrequently, it may feel like dead weight.

### Dangerous Assumptions
**Health as "grade":** If Health feels like a school grade (A+, B-, F), it creates anxiety and avoidance. Low scores may drive users away rather than motivating improvement. The UX must frame health as a journey, not a judgment.

---

## Behavioral Validation

### Does It Support Healthy Financial Habits?

**Potentially, if the score is motivating rather than discouraging.**

**Behavioral Strengths:**
1. **Self-awareness** — A health score makes financial reality visible. "We're at 65/100 — what would 75 look like?"
2. **Progress tracking** — Score improvement over time is motivating. "We were at 55 in January; now we're at 68."
3. **Non-judgmental reflection** — BR-14 ensures Health reflects, doesn't prescribe. This respects user agency.

**Behavioral Risks:**
1. **Score anxiety** — A low score may induce avoidance. Users may stop checking Health rather than confront a bad score.
2. **Score obsession** — Gamification risk. Users might optimize for the score rather than genuine financial health. "We moved money around to improve our score but didn't actually save more."
3. **Score meaninglessness** — If users don't understand what the score means or how to improve it, it becomes noise.
4. **Comparison instinct** — "What's a normal score?" Users will want to compare. ViNha must resist (DNI-06: no leaderboards).

**Friction Point:** Health must feel actionable despite being read-only. "Your savings rate is low" → user needs to know "go to Plan and increase your savings jar allocation." The path from insight to action must be clear without Health prescribing it.

---

## Competitor Benchmark

### YNAB
- Age of Money is the closest health metric. "How many days does your money sit before being spent?"
- Strong: Single, intuitive metric. Gamifies positive behavior (older money = better).
- Weak: One-dimensional. Doesn't capture overall financial health.
- ViNha Difference: ViNha's Health is multi-dimensional (score + narrative + scenarios) but less proven than Age of Money.

### Copilot Money
- Net worth, spending trends, investment performance. No explicit health score.
- Strong: Beautiful data visualization. Users feel informed.
- Weak: Data, not insight. "Here's your net worth" — now what?
- ViNha Difference: ViNha adds interpretation (narrative) and projection (scenarios). More opinionated.

### Monarch Money
- Reports, trends, net worth. No health score.
- Strong: Comprehensive data. Users can build their own picture.
- Weak: Raw data, not synthesized insight. Users must interpret.
- ViNha Difference: ViNha synthesizes data into a health score. Higher-level but riskier.

### Simplifi
- Spending plan, cash flow. No health score.
- Strong: Practical. "Here's your money situation."
- Weak: Narrow. Just spending and cash flow.
- ViNha Difference: ViNha's Health is broader and more interpretive.

**Key Insight:** No competitor has an explicit financial health score. YNAB's Age of Money is the closest single-metric approach. ViNha is charting new territory. This could be brilliant or irrelevant.

---

## Simplicity Validation

### Is the Health Model Optimally Simple?

**Slightly over-engineered for unproven value. Could be simpler.**

**Complexity Score:** Current 4/10, Optimal 3/10. Gap: -1 (slight simplification).

The three-layer model (score, narrative, scenarios) is well-structured but may be more than users need. Start with score + narrative; defer scenarios until the core health concept proves valuable.

**What can be removed (for now):**
- Multiple scenarios — start with one: current trajectory
- Detailed metric breakdowns — start with a holistic score + top 3 insights

**What must stay:**
- BR-14 enforcement (read-only)
- Score trending over time
- Narrative that explains the score

---

## Longevity Validation

### Will the Health Model Age Well?

**Depends on F-Wealth. Health without investment data is incomplete.**

**Stress Points:**
1. **F-Wealth dependency** — Health will be more useful when it can reflect investment accounts, net worth, and total wealth picture. Until F-Wealth ships, Health shows an incomplete picture.
2. **Score methodology evolution** — As ViNha learns what metrics correlate with user satisfaction and retention, the health score methodology will need to evolve. Early scores may be "wrong" by later standards.
3. **AI health insights** — If AI can generate personalized financial insights, Health's static narrative and scenarios may feel primitive.
4. **Open Banking data** — If bank APIs provide richer data (bills, subscriptions, income patterns), Health can use more inputs.

**Evolution:** Start simple (score + basic narrative). Add richness as data sources expand (F-Wealth, AI, Open Banking).

---

## Product Fit Validation

### Does It Support "Household Money OS" or Feel Like "Expense Tracker"?

**Supports Household Money OS — if users value it.**

Health is the "dashboard" of the operating system. It answers "how are we doing?" at a glance. In an expense tracker, you look at transactions to answer that question. In an OS, the health dashboard provides the synthesis.

The household angle: Health is a shared assessment. "Our household's financial health is improving." This frames finances as a team effort.

---

## Missing Concepts

### What's Genuinely Missing?

1. **Validated Health Score Methodology** — What metrics, what weights, what's "good"? Requires user research.
2. **Health Trends** — Score over time. More important than absolute score.
3. **Actionable Insights Without Prescription** — "Your savings rate is below target" without "you should save more" — the "what" without the "should." This is a UX design challenge.
4. **Health Snapshots** — "Your health in January vs December." Annual perspective.

### What Should Remain Intentionally Absent?

- **Health write-back** — DNI-01. Health must never create, modify, or suggest financial actions.
- **Health comparisons** — DNI-06. No leaderboards, no "compared to similar households."
- **Health-based automation** — "If health score drops below X, automatically Y." BR-14 violation.
- **Health as IA** — Health lives on Home as a chip, not as standalone navigation. This is correct.

---

## Industry Best Practices

### Patterns to Adopt
1. **YNAB's Age of Money** — Single, intuitive metric. Simple enough to understand instantly.
2. **Fitness tracker metaphors** — Progress rings, trends, streaks. Familiar UX patterns from physical health.
3. **Credit score UX** — Credit Karma's score display. Score + factors + trends. Clean, non-judgmental.

### Patterns to Avoid
1. **Net worth as health** — Copilot and Monarch push net worth. ViNha should resist. Net worth is a data point, not health.
2. **Grade-based scores** — "B+ financial health." Feels like a report card. Triggering for many.
3. **Overly complex dashboards** — Monarch's dashboard fatigue. Health should be glanceable, not a BI tool.

---

## Evolution Opportunities

| ID | Opportunity | BV | UV | CX | MC | AI | RK | FI | LO |
|----|------------|----|----|----|----|----|----|----|----|
| EO-H1 | Health Score Iteration | 6 | 6 | 4 | 2 | 3 | 3 | 7 | 7 |
| EO-H2 | Health Scenario Modeling | 5 | 5 | 5 | 3 | 4 | 4 | 6 | 5 |
| EO-H3 | Health Snapshots & Trends | 5 | 6 | 3 | 2 | 2 | 2 | 6 | 7 |

**EO-H1 Description:** Iterate health score based on user data. Identify which metrics correlate with user satisfaction and retention. Refine score methodology.

**EO-H2 Description:** "What if" scenarios. "If you saved 10% more, your emergency fund would reach target in X months." BR-14 compliant: scenarios are projections, not prescriptions.

**EO-H3 Description:** Health trends over time. Month-over-month, year-over-year. Visual progress indicators.

---

## Verdict: APPROVED WITH FUTURE CAPABILITIES

**Confidence: MEDIUM**

The Health domain model is architecturally correct (read-only, BR-14 enforced) but its user value is unproven. No competitor has an equivalent concept. The domain should ship in MKP to test the concept but with the simplest possible implementation.

**Justification:**
- BR-14 enforcement is correct and non-negotiable
- Read-only health mirror is an innovative concept
- No competitor validates or invalidates the approach
- Health value depends on F-Wealth for complete financial picture
- Start with simple score + narrative; iterate based on user engagement
- If users don't engage with Health, simplify or de-emphasize rather than adding features

**Action Required:** Ship Health with minimal viable score + narrative in MKP. Monitor engagement. Iterate based on data. Do not invest in scenarios (EO-H2) until core concept proves valuable.
