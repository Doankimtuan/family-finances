# Domain: Health

**Bounded Context:** Insight
**Surface:** Home (accessible via chip)
**Financial Principle:** Reflection, Risk, Behavior
**Business Rules:** BR-14

---

## 1. Philosophy

Health answers the question: **how are we doing — really?**

Financial Health is a mirror. It reflects the household's financial behavior back to them in the form of a score, a narrative, and light scenarios. Health does not move money. It does not create plans. It does not make decisions. It *reads* from every other domain and *synthesizes* what it sees.

The philosophical purpose of Health is *reflection.* Without reflection, the household operates on autopilot — money comes in, money goes out, and no one asks whether the patterns are healthy. Health makes the patterns visible. It is the household's financial conscience.

Health is unique among ViNha's domains: it is the only domain that reads from all others but writes to none. It is the observer, not the actor. This read-only nature is its defining characteristic.

---

## 2. User Problem

Households rarely step back and assess their overall financial situation. They manage month-to-month — paying bills, spending, saving a little — but never ask the big questions: Are we saving enough? Is our debt manageable? Are we on track for our goals? What would happen if one income disappeared?

The pain is *lack of perspective.* The household is deep in the trees and cannot see the forest. Individual months feel fine or stressful, but the overall trajectory is invisible.

Health solves this by providing a regular, objective assessment. Once a month (aligned with the Month Ritual), the household gets a Health Snapshot: a score, an explanation, and a few "what if" scenarios. The mirror shows them what they might not see themselves.

---

## 3. Financial Principle

**Reflection, Risk, and Behavior.** Health is the intersection of three principles:

- **Reflection:** You cannot improve what you do not see. Health makes the household's financial behavior visible.
- **Risk:** Financial surprise is the enemy of peace. Health surfaces risks (low emergency fund, high debt-to-income, overspend patterns) before they become crises.
- **Behavior:** Systems shape habits. Health's monthly cadence creates a habit of reflection — looking at the mirror, acknowledging reality, and adjusting.

---

## 4. Core Responsibilities

1. **Calculate a Financial Health Score.** A composite number that aggregates key indicators into a single, understandable metric.
2. **Generate a narrative.** Human-readable explanation of the score — "Your savings rate is strong, but discretionary spending increased 15%."
3. **Identify key indicators.** Savings rate, debt-to-income ratio, emergency fund coverage, overspend frequency, Inbox resolution rate, goal progress.
4. **Provide light scenarios.** "What if" projections: "If you reduced dining out by 20%, your savings rate would improve to X." Scenarios are educational, not prescriptive.
5. **Create monthly snapshots.** Each Month Ritual should produce a Health Snapshot that can be compared against previous months.
6. **Surface concerns, not alarms.** Health should flag concerning patterns ("your emergency fund has been declining for 3 months") without inducing panic.
7. **Respect BR-14.** Health can explain and suggest. It must not invent balances, move money, or execute any financial action.

---

## 5. Explicit Non-Responsibilities

1. **Health does NOT move money.** Under no circumstances does Health create Transactions, adjust allocations, or modify any financial data. It is strictly read-only.
2. **Health does NOT make decisions.** Health may say "your emergency fund is below the recommended level," but it does not create a Jar, allocate money, or change plans.
3. **Health does NOT enforce behavior.** Health does not block spending, restrict allocations, or impose limits — that is the role of Jar overspend policy (BR-07).
4. **Health is NOT financial advice.** The score and narrative are reflections, not recommendations. The system does not say "you should invest in X" or "you should reduce Y."
5. **Health does NOT replace the Inbox.** Health identifies patterns; the Inbox surfaces specific decisions. Health says "you have a pattern of unmapped expenses"; the Inbox shows the specific unmapped transactions.
6. **Health does NOT produce tax or legal insights.** Tax optimization, legal structuring — out of scope.

---

## 6. Domain Boundary

**IN:**
- Financial Health Score calculation
- Health Score methodology (which indicators, how they are weighted)
- Monthly Health Snapshots
- Health narrative generation
- Light scenario projections
- Trend analysis (month-over-month comparisons)
- Key indicator tracking: savings rate, debt-to-income, emergency fund coverage, overspend frequency, Inbox resolution rate, goal progress, credit utilization

**OUT:**
- Account balances (→ reads from Accounts)
- Transaction data (→ reads from Transactions)
- Jar allocations and spending (→ reads from Budgets)
- Goal progress (→ reads from Goals)
- Inbox status (→ reads from Inbox)
- Money movement of any kind (→ strictly forbidden — BR-14)
- Financial product recommendations (→ future AI-Assist)
- Investment advice (→ out of scope)

---

## 7. Business Language

**Official Terms:**
- **Financial Health:** The household's overall financial well-being assessment
- **Health Score:** A numerical representation of financial health
- **Health Snapshot:** A point-in-time capture of the score, narrative, and indicators
- **Narrative:** Human-readable explanation of the score
- **Scenario:** A lightweight "what if" projection
- **Indicator:** A specific metric contributing to the Health Score (savings rate, debt-to-income, etc.)

**Aliases:**
- "Financial Wellness" is acceptable but "Financial Health" is preferred.
- "Health Check" is acceptable as an informal term.

**Forbidden Terminology:**
- ❌ "Credit score" — this is a specific banking metric; Health Score is broader
- ❌ "Financial grade" — "grade" implies pass/fail judgment; Health is a reflection, not a test
- ❌ "Health recommendation" — use "narrative" or "insight"; the system does not recommend

**Preferred Terminology:**
- ✅ "Your Financial Health Score is 78/100 — good, with room to grow"
- ✅ "Health Snapshot for March 2026"
- ✅ "Scenario: if you reduced dining out by 20%..."

---

## 8. Mental Model

Users should think of Health as **a mirror on the wall.** Once a month, the household stands in front of the mirror and sees a reflection of their financial behavior. The mirror does not judge — it shows what is there.

The mirror might show: "You are saving 15% of income — that is solid. Your credit card utilization is 45% — that is higher than ideal. Your emergency fund covers 2 months of expenses — 3-6 is the general guideline."

The mirror does not move money from checking to savings. It does not pay down the credit card. It does not create an emergency fund Jar. It simply reflects reality so the household can decide what to do.

---

## 9. Real-World Validation

**Financial health frameworks:** Organizations like the Financial Health Network have developed multi-dimensional financial health frameworks (spend, save, borrow, plan). ViNha's Health domain aligns with these frameworks while keeping the household context.

**Behavioral economics:** Regular feedback (monthly Health Snapshot) is a proven mechanism for behavior change. People adjust their behavior when they can see the consequences.

**Personal finance apps:** Credit Karma, Mint, and others offer financial health scores. ViNha's innovation is making Health *household-scoped* (not individual) and *read-only* (not a sales channel for financial products).

**Validation:** The concept of financial health scoring is validated by the industry, but many implementations conflate scoring with product recommendations. ViNha's read-only, household-scoped Health is a cleaner approach.

---

## 10. Simplicity

Health risks becoming a "kitchen sink" domain — absorbing every possible indicator, chart, and projection. Discipline is essential.

**What could be removed?**
- Excessive indicators. Start with 5-7 key indicators (savings rate, debt-to-income, emergency fund coverage, overspend frequency, Inbox resolution rate, credit utilization, goal progress) and resist adding more.
- Detailed scenario modeling. One or two light scenarios per month is sufficient.

**Resist the temptation to add:**
- "Budget vs. actual" detailed breakdowns per Jar — that is the Budget domain's responsibility; Health reads the aggregate.
- Net worth tracking — net worth includes assets (property, vehicles) out of scope for ViNha.
- Peer comparison ("households like yours save X%") — household finance is personal, not comparative.
- Gamification (badges, streaks, leaderboards) — Health is a mirror, not a game.

---

## 11. Evolution Potential

Health has significant but dangerous evolution potential:

- **More sophisticated scoring:** As ViNha matures, the Health Score methodology can become more nuanced — but must remain explainable.
- **Predictive Health:** "Based on current trends, your Health Score may decline next month" — but this edges toward AI forecasting (BR-14 caution).
- **Personalized benchmarks:** "For a household with your income and location, an emergency fund of X is typical" — but this requires external data.
- **Goal-linked Health:** "Your Health Score would improve by 5 points if you reached your emergency fund Goal."

**The danger:** Health must resist becoming an AI advisor. BR-14 is explicit: "AI may explain/suggest; must not invent balances or execute money movement." As Health becomes more sophisticated, the temptation to cross the line from "reflection" to "recommendation" will grow. It must be resisted.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Allowing Health to trigger financial actions (auto-adjusting allocations, moving money). This violates BR-14.
- Making the Health Score opaque — the methodology must be explainable. A "black box" score erodes trust.
- Coupling Health too tightly to any single domain — Health should degrade gracefully if a domain has no data.

**UX Mistakes:**
- Displaying the Health Score as a large, anxiety-inducing number on the Home screen — Health is accessible from a chip, not dominating the primary view.
- Using red/yellow/green color coding that feels judgmental — the tone should be observational, not evaluative.
- Overwhelming the household with too many indicators and charts — a score, a narrative, and 2-3 scenarios are sufficient.

**Business Mistakes:**
- Using the Health Score to sell financial products — this destroys trust.
- Making Health the "main feature" — ViNha is an operating system, not a health tracker. Health is a mirror, not the center.
- Allowing Health to become a source of household conflict ("your score is lower because YOU spent too much") — the mirror reflects the household, not individuals.

---

## 13. Success Criteria

From the user's perspective, Health is successful when:

1. **The household reads the Health narrative each month** — it becomes part of the Month Ritual rhythm.
2. **The Health Score feels fair and understandable** — the household can see *why* the score is what it is.
3. **Health insights lead to behavior change** — "the narrative mentioned our dining out is high — let's adjust the Dining Out Jar."
4. **Health never feels judgmental or anxiety-inducing** — it is a mirror, not a report card.
5. **Health trends are visible** — the household can see improvement or decline over time.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker shows what happened. ViNha shows what happened AND what it means. Health is the "what it means" layer.

Health embodies **Calm finance UI.** The mirror should be calm, factual, and unobtrusive. It is accessible from a Home chip, not dominating the experience.

Health embodies **AI assists, never invents money (BR-14).** Health uses data to reflect and explain. It does not create, move, or modify money. This is the most important boundary in the entire system — and Health sits right on it.

Health embodies **Progressive depth.** A new household may not look at Health for the first few months. As they become comfortable with the system, Health becomes a natural part of the Month Ritual.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 8 | Read-only mirror is clear; the line between "reflect" and "recommend" needs constant guarding |
| Financial Correctness | 8 | Scoring methodology must be transparent and defensible |
| User Value | 8 | High for engaged households; invisible for those who ignore it |
| Longevity | 9 | Financial health assessment is a permanent need |
| Extensibility | 9 | Many indicators, scenarios, and methodologies can be added |
| Simplicity | 6 | High risk of complexity creep — every indicator and scenario adds weight |
| Future Evolution | 8 | Significant potential but dangerous — BR-14 boundary must be absolute |

**Overall: 8.0 / 10** — A valuable but potentially dangerous domain. Its read-only nature is its greatest strength and must be its most protected characteristic.
