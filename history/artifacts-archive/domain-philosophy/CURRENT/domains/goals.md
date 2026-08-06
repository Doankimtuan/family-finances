# Domain: Goals

**Bounded Context:** Intention Plan
**Surface:** Plan
**Financial Principle:** Commitment, Forecasting
**Business Rules:** BR-01

---

## 1. Philosophy

Goals answer the question: **what are we working toward?**

A Goal is an aspirational target — a commitment to accumulate a specific amount by a specific date for a specific purpose. "Save 36 million VND for a vacation by December." Goals look forward. They are the household's financial ambitions made concrete.

The philosophical purpose of Goals is *direction.* Jars answer "where should money go this month?" Goals answer "where are we heading over the next several months?" Without Goals, the household manages month-to-month. With Goals, they build toward something.

Goals are distinct from Jars — and this distinction matters. A Jar allocates money for *spending* (groceries, rent, dining out). A Goal commits money for *accumulation* (vacation, new car, emergency fund). Jars are operational; Goals are strategic.

---

## 2. User Problem

Households have dreams — vacations, home renovations, education funds, emergency cushions — but without structured tracking, these dreams remain vague. "We should save for a vacation" is not a plan. Without a target amount and a target date, the household drifts.

The pain is *aspiration without structure.* The household wants to save but never knows if they are on track. Months pass, the dream stays distant, and nothing changes.

Goals solve this by giving aspirations a structure: an amount, a deadline, a funding mechanism (linked to one or more Jars), and a visible progress indicator. The household can see "we are 40% toward our vacation goal" and adjust behavior accordingly.

---

## 3. Financial Principle

**Commitment and Forecasting.** Goals embody commitment — the household declares "we will save X by Y date." This is not a wish; it is a commitment with a deadline.

Goals also embody forecasting — the system can project whether the household is on track based on current allocation patterns. "At your current savings rate, you will reach your goal 3 months late — consider allocating more per month."

Commitment without forecasting is blind. Forecasting without commitment is speculation. Goals combine both.

---

## 4. Core Responsibilities

1. **Define aspirational targets.** Each Goal has a name, target amount, target date, and purpose description.
2. **Track progress.** Show the household how much has been accumulated toward the Goal and what percentage of the target has been reached.
3. **Link to funding Jars.** A Goal is funded through one or more Jars — the Goal reads Jar allocation data to track progress.
4. **Project completion.** Based on current allocation rates, forecast when the Goal will be reached.
5. **Support Goal completion.** When a Goal is reached, the household should be prompted with a decision: celebrate and close, or extend the target.
6. **Allow Goal adjustment.** Goals can be modified (new target amount, new date) because life changes — but changes should be partner-visible (BR-13).

---

## 5. Explicit Non-Responsibilities

1. **Goals are NOT Jars.** A Goal is a target; a Jar is an allocation envelope. A Goal may be funded by Jars, but the Goal does not hold allocations.
2. **Goals are NOT savings products.** A Goal is an intention ("save for vacation"). A Savings product is a real financial instrument with interest, maturity, and terms. They are entirely different domains.
3. **Goals do NOT hold money.** Money is in Accounts. Allocation is in Jars. Goals are progress trackers.
4. **Goals do NOT execute transactions.** When a Goal is reached, the household decides what to do — the system does not automatically move money.
5. **Goals do NOT enforce discipline.** Goals show progress; they do not block spending or enforce allocation. That is the role of Jar overspend policy (BR-07).
6. **Goals are NOT recurring.** A Goal is a one-time accumulation target. Recurring savings behavior belongs to Planning (Recurring Rules).

---

## 6. Domain Boundary

**IN:**
- Goal definitions (name, description, target amount, target date)
- Goal progress tracking (accumulated amount, percentage complete)
- Goal-to-Jar linking (which Jars fund this Goal)
- Goal projection (forecasted completion date based on current rate)
- Goal states: Active, Paused, Completed, Abandoned
- Goal adjustment history (target changes are tracked — BR-13)

**OUT:**
- Jar allocations (→ Budgets domain)
- Savings products (→ Savings domain)
- Actual money movement (→ Transactions domain)
- Recurring savings rules (→ Planning domain)
- Goal-based spending enforcement (→ Budgets domain — overspend policy)

---

## 7. Business Language

**Official Terms:**
- **Goal:** An aspirational accumulation target
- **Target Amount:** The total amount the household aims to accumulate
- **Target Date:** The date by which the Goal should be reached
- **Progress:** Current accumulated amount as a percentage of target
- **Funding Jar:** A Jar whose allocations contribute to this Goal

**Aliases:**
- "Savings Goal" is acceptable but can cause confusion with Savings (products). "Goal" alone is preferred.

**Forbidden Terminology:**
- ❌ "Goal balance" — Goals do not have balances; they have progress toward a target
- ❌ "Goal account" — Goals are not accounts
- ❌ "Savings Goal" when the Goal is funded through a checking Account — the term implies a savings product
- ❌ "Transfer to Goal" — money does not transfer to Goals; it is allocated to Jars; the Goal reads from Jars

**Preferred Terminology:**
- ✅ "Vacation Goal: 24 million of 36 million (67%) — on track for December"
- ✅ "Fund this Goal from the Vacation Jar"

---

## 8. Mental Model

Users should think of Goals as **thermometers on the wall.** The household draws a line at the top (target amount) and labels it (purpose). Each month, as money is allocated to the connected Jar(s), the thermometer fills up a little more.

The thermometer does not hold money — it just shows progress. The money is still in the bank. The allocation is still in the Jar. The Goal simply answers: "at this rate, will we reach the top in time?"

This metaphor makes the Goal-Jar distinction intuitive: you would never look at a fundraising thermometer and say "the money is in the thermometer." The money is in the bank. The thermometer just shows progress toward the target.

---

## 9. Real-World Validation

**Household finance practices:** Households naturally have savings targets — "we need X for the wedding," "we want Y for a down payment." Goals formalize this natural behavior.

**SMART goals framework:** Specific, Measurable, Achievable, Relevant, Time-bound. ViNha Goals are inherently SMART: specific (named purpose), measurable (target amount), achievable (linked to actual Jar allocations), relevant (household-defined), time-bound (target date).

**Consumer finance products:** Many apps have "goals" features — but often conflate goals with accounts (opening a separate "goal savings account"). ViNha's Goals are pure intention — they read from existing allocation structures without creating new financial instruments.

**Validation:** The Goal concept is validated by goal-setting theory and common financial practice. The innovation is keeping Goals as pure intention rather than creating pseudo-accounts.

---

## 10. Simplicity

Goals are already minimal: a target, a deadline, and progress tracking. The simplicity must be protected.

**What could be removed?**
- Goal categories or types ("short-term," "long-term") — the target date already communicates timeframe.
- Goal priority rankings — all Goals the household defines are important to them; ranking adds complexity without value.
- "Smart Goal" auto-creation — Goals should be household-defined, not system-generated.

**Resist the temptation to add:**
- Goal-based automatic allocation adjustment ("you are behind on your Goal, so we increased your Jar allocation") — this is a Planning decision, not a Goal behavior.
- Goal "portfolios" or groupings — a flat list is sufficient.
- Goal sharing or social features — household finance is private.

---

## 11. Evolution Potential

Goals can evolve moderately:

- **Goal templates:** Common Goal types (emergency fund, vacation, major purchase) could have suggested target amounts and timelines — but this is onboarding, not domain change.
- **Multi-Jar funding:** A Goal could track progress across multiple Jars — this is already within scope and represents natural evolution.
- **Goal celebration:** When a Goal is reached, the system could offer a celebratory moment — but this is a UX flourish, not domain evolution.
- **Goal-linked Health insights:** "Your emergency fund Goal is at 60% — financial advisors recommend 3-6 months of expenses" — but this belongs to Health.

The domain is stable. Goals will not change fundamentally because "save X by Y date" is a permanent human behavior.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Creating pseudo-accounts for Goals (a "Goal Account" that "holds" the accumulated amount). Goals do not hold money.
- Automatically moving money between Accounts when a Goal is reached — money movement is a household decision, not a system action.
- Failing to link Goals to actual Jar allocations, making Goal progress fictional.

**UX Mistakes:**
- Displaying Goal progress in a way that implies the money is "in" the Goal.
- Not making Goal progress visible on the Plan surface — Goals should be prominent, not buried.
- Showing overly precise projections ("you will reach your Goal on March 14, 2027") — projections are estimates and should be communicated as such.

**Business Mistakes:**
- Positioning Goals as "savings accounts" — this conflates Intention Plan (Goal) with Real Ledger (Savings product).
- Creating Goals automatically ("based on your spending, you should save for...") — Goals are household commitments, not system suggestions.
- Allowing Goal target dates to be set unrealistically close without warning — the system should flag when the required monthly allocation exceeds historical patterns.

---

## 13. Success Criteria

From the user's perspective, Goals are successful when:

1. **A partner can answer "are we on track for our vacation Goal?" in under 10 seconds** — by glancing at Goal progress.
2. **Goals feel motivating, not stressful** — progress is visible and encouraging, not a source of anxiety.
3. **Goal completion is celebrated** — when the household reaches a Goal, it feels like an achievement, not just a data update.
4. **Goals influence behavior** — the household makes different spending decisions because they can see their Goals progressing.
5. **Goal adjustments are transparent** — if one partner changes a Goal target, the other is notified (BR-13).

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker looks backward. Goals look forward. This forward-looking quality is essential to ViNha's identity as an operating system, not a recorder.

Goals embody **Progressive depth.** A new household may not define Goals immediately. As they become comfortable with Jars and the Month Ritual, Goals become the natural next step — the strategic layer on top of the operational layer.

Goals embody **Partners first.** Goals are household Goals. Both partners see them, contribute to them, and celebrate when they are reached.

Goals embody **AI assists, never invents money (BR-14).** The system can project Goal completion and suggest allocation adjustments — but it cannot create money, move money, or change allocations without the household's explicit action.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | Clear purpose; the Goal-Jar distinction needs reinforcement but is understandable |
| Financial Correctness | 9 | Aligns with SMART goal-setting and accumulation tracking |
| User Value | 8 | High for goal-oriented households; lower for households living month-to-month |
| Longevity | 9 | Aspirational saving is a permanent human behavior |
| Extensibility | 7 | Goal templates and multi-Jar funding are natural extensions; beyond that, limited |
| Simplicity | 9 | Conceptually simple: target, deadline, progress |
| Future Evolution | 7 | Stable domain with limited evolution potential — which is appropriate |

**Overall: 8.3 / 10** — Solid strategic layer. Valuable for households ready to look beyond the current month.
