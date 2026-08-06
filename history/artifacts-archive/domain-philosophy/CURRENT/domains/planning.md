# Domain: Planning

**Bounded Context:** Intention Plan
**Surface:** Plan
**Financial Principle:** Planning, Forecasting, Habit
**Business Rules:** BR-04, BR-05

---

## 1. Philosophy

Planning answers the question: **how do we make good intentions automatic?**

Planning is the "set it and forget it" layer of the Intention Plan. While Jars represent active allocations and Goals represent aspirational targets, Planning defines the *rules* that automate the routine. Recurring rules, income placement strategies, and Category-to-Jar mappings — these are the infrastructure that reduces manual effort.

The philosophical purpose of Planning is *automation with receipts.* The household should not have to manually allocate every dong of income every month. The system should handle the predictable; humans should handle the decisions. But — and this is critical — automation must be transparent. The household must always understand *why* money was allocated the way it was.

Planning is about *reducing cognitive load.* Every decision the system can make automatically (with the household's configured rules) is a decision the household does not have to make. This frees mental energy for the decisions that truly require human judgment.

---

## 2. User Problem

Households that manually manage finances face "allocation fatigue." Every month, income arrives, and the household must decide: how much to groceries? How much to rent? How much to savings? This is exhausting. Eventually, they stop. The plan becomes stale. Intentions drift.

The pain is *repetitive decision-making.* The household makes the same allocation decisions every month, month after month. It is not that the decisions are hard — it is that there are too many of them.

Planning solves this by allowing the household to define rules once and have them execute automatically. "30% of income to Groceries Jar." "Rent is fixed at 15 million every month." Once configured, these allocations happen without manual intervention. The household reviews (BR-04: Suggest mode) or simply trusts (Auto mode) and focuses on exceptions.

---

## 3. Financial Principle

**Planning and Forecasting.** Planning embodies the principle that *intentions without systems are just hopes.* A household that manually decides every allocation every month will eventually stop deciding. Systems make intentions sustainable.

**Habit.** Planning also embodies habit — but at the system level rather than the human level. The system develops "habits" (recurring rules) that mirror the household's actual behavior. These system habits make the human habits (checking the Plan surface, performing the Month Ritual) easier.

---

## 4. Core Responsibilities

1. **Define recurring allocation rules.** "Every month, allocate X% or Y fixed amount to Jar Z." These rules fire when income is placed.
2. **Manage income placement modes.** BR-04: Off (no automation), Suggest (system proposes, human confirms), Auto (system executes). New households default to Suggest.
3. **Define Category-to-Jar mappings.** "Transactions categorized as 'Groceries' map to 'Groceries' Jar." This bridges classified Transactions with Jar allocations.
4. **Calculate next month's initial plan.** Based on recurring rules, prepare the starting allocations for the upcoming month (used during the Month Ritual).
5. **Support rule scheduling.** Rules can be monthly, weekly, or custom — though monthly is the default cadence.
6. **Allow rule overrides.** The household can override any auto-allocation for a specific month without changing the underlying rule.

---

## 5. Explicit Non-Responsibilities

1. **Planning does NOT hold money.** Rules define how money *will be* allocated. Actual allocations live in Jars (Budgets domain).
2. **Planning does NOT execute Transactions.** Rules allocate to Jars; they do not move real money between Accounts.
3. **Planning does NOT categorize Transactions.** Category-to-Jar mappings use Categories but do not create them. Categories are defined in the Categories domain.
4. **Planning does NOT close months.** The Month Ritual uses Planning's output (next month's initial plan) but is its own domain.
5. **Planning does NOT track Goal progress.** Goals have their own domain. Planning may allocate to a Jar that funds a Goal, but the Goal's tracking is separate.
6. **Planning does NOT predict future balances.** Forecasting ("based on your rules, your account balance will be X in 6 months") belongs to Health or Goals, not Planning.

---

## 6. Domain Boundary

**IN:**
- Recurring allocation rules (Jar target, amount/percentage, frequency)
- Income placement modes: Off, Suggest, Auto (BR-04)
- Category-to-Jar mapping rules
- Rule override capability (one-time adjustment without changing the rule)
- Next-month plan calculation (feeds Month Ritual)
- Rule templates (default rules for new households)
- Rule execution history (what was auto-allocated, when, by which rule)

**OUT:**
- Jar allocation management (→ Budgets domain — Planning writes to Jars but Jars own their state)
- Transaction categorization (→ Categories domain)
- Income detection (→ Transactions domain — Planning acts on detected income)
- Month-end processing (→ Month Close domain)
- Goal tracking (→ Goals domain)
- Financial projections and scenarios (→ Health domain)

---

## 7. Business Language

**Official Terms:**
- **Recurring Rule:** An automated allocation instruction
- **Income Placement:** The act of distributing incoming money to Jars
- **Placement Mode:** Off, Suggest, or Auto (BR-04)
- **Category Mapping:** A rule linking a Category to a Jar
- **Rule Override:** A one-time deviation from a recurring rule
- **Suggest Mode:** System proposes allocations; household confirms
- **Auto Mode:** System executes allocations without confirmation
- **Off Mode:** No automated allocation

**Aliases:**
- "Auto-allocation" is acceptable for the concept of automated placement.
- "Rule" is an acceptable shorthand for "Recurring Rule."

**Forbidden Terminology:**
- ❌ "Auto-budget" — "budget" implies spending limits; Planning allocates income to Jars
- ❌ "Scheduled transfer" — Planning allocates intentions, not money transfers
- ❌ "Rule engine" (in user-facing language) — too technical

**Preferred Terminology:**
- ✅ "Recurring rule: allocate 30% of income to Groceries Jar"
- ✅ "Income placement mode: Suggest"
- ✅ "Category mapping: 'Groceries' Category → Groceries Jar"

---

## 8. Mental Model

Users should think of Planning as **a set of standing instructions to a household assistant.** The household tells the assistant: "Every month, when my salary arrives, put 30% into the Groceries Jar, 25% into the Rent Jar, 10% into the Savings Jar, and so on."

The assistant follows these instructions faithfully. In Suggest mode (BR-04 default for new households), the assistant prepares the allocations and says "here is what I am about to do — does this look right?" The household reviews and confirms. In Auto mode, the assistant just does it and leaves a receipt.

The household can change the standing instructions at any time. They can also tell the assistant "this month, do something different for this one Jar" (override). The assistant is a tool, not an authority — it executes the household's intentions, not its own.

---

## 9. Real-World Validation

**Automated bill pay and savings transfers:** Many households already use automated transfers — rent auto-paid, savings auto-transferred. Planning extends this concept to the Intention Plan: auto-allocation to Jars.

**Zero-based budgeting with automation:** In traditional zero-based budgeting, every dollar is allocated manually each month. Planning automates the repetitive parts of this process while preserving human oversight (Suggest mode) or enabling full trust (Auto mode).

**Pay-yourself-first:** The principle of automatically saving before spending is well-established. Planning implements this at the Jar level — the household can configure rules that prioritize savings Jars before discretionary Jars.

**Validation:** The concept of automated financial rules is validated by banking (auto-pay, auto-transfer) and personal finance (automated savings). ViNha's innovation is applying automation to the *intention* layer while preserving human oversight.

---

## 10. Simplicity

Planning has an inherent tension: rules can become complex quickly. "30% of income to Jar A, but only if income exceeds X, and only in months where Jar B is not overspent..." — this way lies madness.

**What could be simplified?**
- For MVP, limit rules to: "X% to Jar" and "Y fixed amount to Jar." No conditional rules, no priority ordering, no dependency chains.
- Category-to-Jar mappings should be one-to-one (one Category maps to one Jar), not conditional.

**What could be removed?**
- Rule scheduling beyond monthly — weekly and custom frequencies add complexity without clear value for MVP.
- Rule conflict resolution — with simple rules, conflicts are unlikely.

**Resist the temptation to add:**
- Conditional rules ("if balance > X, then...") — this is programming, not household finance.
- Priority-based allocation ("fund Jar A first, then Jar B with remainder") — this is a future feature.
- Rule templates based on "financial philosophies" — the household defines its own rules.

---

## 11. Evolution Potential

Planning has significant but dangerous evolution potential:

- **Conditional rules:** "If the Emergency Fund Jar is below X, allocate extra to it this month." Useful but complex.
- **Priority-based allocation:** "Fund essential Jars first, then distribute remainder proportionally." Aligns with needs-before-wants philosophy.
- **Smart suggestions:** The system notices "you always override the Dining Out allocation to be higher" and suggests adjusting the rule. This is AI-Assist scope.
- **Seasonal rules:** "Increase the Gift Jar allocation in December." A natural extension.
- **Income type awareness:** Different rules for salary income vs. freelance income vs. gift income.

**The danger:** Planning must not become a programming language for money. Rules should be simple enough that both partners can understand and modify them. If rule configuration requires a manual, Planning has failed.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Executing rules that create circular dependencies (Rule A depends on Jar B; Rule B depends on Jar A).
- Failing to log rule execution — the household must see what rules fired and what they did (the "receipt").
- Allowing Auto mode (BR-04) without a clear history of what was automated.

**UX Mistakes:**
- Making rule configuration feel like coding — rules should be selected from simple templates, not written in a rule language.
- Not clearly showing what a rule will do before it is saved — "this rule will allocate 3 million to Groceries next month based on your average income."
- Hiding rule execution — the household should see "allocated by rule: Groceries 30%" on the Plan surface.

**Business Mistakes:**
- Defaulting to Auto mode for new households (BR-04 says Suggest is the default). New households need to build trust with the system before handing over automation.
- Creating too many default rules — new households start with ≤3 essentials during onboarding; rules should match.
- Allowing rules to become so complex that one partner cannot understand or modify them — this undermines shared financial management.

---

## 13. Success Criteria

From the user's perspective, Planning is successful when:

1. **Monthly allocation requires minimal manual effort** — the household reviews (Suggest) or trusts (Auto) rather than entering every allocation.
2. **Rules are understandable** — both partners can explain what each rule does.
3. **Automation is transparent** — the household always knows what was automated and why.
4. **Overrides are easy and temporary** — "just this month, allocate more to Dining Out" without changing the underlying rule.
5. **Planning reduces, rather than creates, cognitive load** — the household spends LESS time on finances after configuring Planning.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker has no automation — every categorization and budget entry is manual. ViNha's Planning domain is the automation layer that makes the operating system truly operate.

Planning embodies **Automation with receipts.** Every automated action leaves a trace. The household never wonders "why was money allocated this way?" — the rule and its execution are visible.

Planning embodies **Progressive depth.** A new household starts with Suggest mode and simple rules. As they gain confidence, they may switch to Auto mode and add more sophisticated rules. The domain scales with the household's sophistication.

Planning embodies **Partners first.** Rules are household rules. Both partners can view, modify, and override them. No "my rules" vs. "your rules."

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 8 | Automation layer is clear; the line between Planning and Budgets needs definition |
| Financial Correctness | 8 | Aligns with automation practices in personal finance; conditional complexity is a risk |
| User Value | 9 | High — Planning is what makes ViNha sustainable beyond the first month |
| Longevity | 9 | Financial automation is a permanent need |
| Extensibility | 8 | Conditional rules, priorities, seasonal rules are natural extensions |
| Simplicity | 6 | The biggest risk — rules can become complex quickly; discipline is essential |
| Future Evolution | 8 | High potential; must resist becoming a programming language |

**Overall: 8.0 / 10** — A powerful domain with a dangerous edge. Simplicity must be aggressively defended.
