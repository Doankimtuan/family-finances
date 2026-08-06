# Rejected Features — Protection of Product Integrity

These features and ideas were formally reviewed and REJECTED. They will never exist in ViNha. Each rejection protects a specific aspect of product integrity.

---

## Rejected Evolution Opportunities

### EO-23: Planning Conditional Rules

**Domain:** Planning
**Validation Score:** 41 (Middle Tier) — High score but high risk

**What It Was:** Advanced conditional planning rules like "If Emergency Fund is below target AND income exceeds X, allocate extra to Emergency Fund." A rule engine with priority, conditions, and automated money movement based on financial state.

**Why Rejected:**
1. **Domain Philosophy Explicitly Warned Against This.** The Domain Reality Validation flagged conditional rules as dangerous complexity. The Board concurs.
2. **Contradicts EO-04 (Simplify Planning).** We just approved replacing the PlanningRule engine with simple RecurringPatterns. Adding a conditional rule engine immediately after simplification is incoherent.
3. **Automated Money Movement Without Human Decision.** Conditional rules that auto-allocate money based on financial conditions remove the human from the decision loop. This contradicts ViNha's core identity: "what needs a decision together."
4. **Complexity Cascade.** Priority, conflict resolution, and circular dependency problems emerge as soon as multiple conditional rules interact. This is a maintenance nightmare.
5. **BR-14 Adjacent Risk.** While conditional rules are user-defined (not AI), automated money movement based on system-evaluated conditions is dangerously close to AI-driven money management.

**Product Integrity Violated:** Simplicity principle, Household-first architecture (decisions should be human), BR-14 spirit (no system-directed money movement).

**Alternative That Addresses the Underlying Need:** The Health score's actionable insights (EO-08) will say "Your Emergency Fund is below target. Consider allocating from your surplus." This informs the user without automating the decision. The human makes the call.

---

### EO-24: Month Ritual Gamification

**Domain:** Month Close
**Validation Score:** 30 (Lower Tier)

**What It Was:** Streaks, badges, and celebrations for completing consecutive Month Rituals. Gamification mechanics to encourage ritual completion.

**Why Rejected:**
1. **Financial Decisions Are Not a Game.** The Month Ritual is a serious financial accountability mechanism, not a habit to be incentivized with virtual rewards. Gamification trivializes the ritual's purpose.
2. **Wrong Motivation.** Users should complete the ritual because it provides financial clarity and partner alignment — not because they want a streak badge. External rewards crowd out intrinsic motivation.
3. **Streak Anxiety.** Losing a streak because life happens (illness, vacation, busy month) creates negative emotions associated with the product. This is counterproductive.
4. **Product Identity Erosion.** A "Household Money Operating System" does not have badges and leaderboards. This pushes the product toward casual app territory.

**Product Integrity Violated:** Simplicity principle, Product identity (Household Money OS, not a gamified app).

**Alternative That Addresses the Underlying Need:** Quick Close (EO-10) reduces friction for experienced users. The Health score trend (EO-08) provides intrinsic motivation by showing improvement. The ritual's value creates its own motivation — no badges needed.

---

### EO-26: Jar Sub-Allocation / Sub-Jars

**Domain:** Budgets/Jars
**Validation Score:** 38 (Middle Tier)

**What It Was:** Nested jar hierarchy — e.g., a "Food" parent jar with "Groceries" and "Dining Out" sub-jars. Sub-jars inherit from parent, have their own allocations, and roll up to parent totals.

**Why Rejected:**
1. **Violates Simplicity Principle.** The flat jar architecture is one of ViNha's key differentiators. Adding hierarchy introduces parent-child relationships, allocation inheritance, roll-up calculations — all of which add cognitive load.
2. **Unclear Boundaries.** When is something a category vs. a sub-jar? The distinction becomes blurry, leading to user confusion about whether to organize by category or by sub-jar.
3. **Reporting Complexity.** Every report, every filter, every Health score calculation must now handle hierarchical jars. This is a cascade of complexity across every module.
4. **Alternative Exists.** Transaction splits (EO-20 APPROVED) handle the "granular allocation" need within a flat jar architecture. Categories already provide the "Food → Groceries/Dining" distinction.

**Product Integrity Violated:** Simplicity principle, BR-01 (sub-jars blur the real/intention boundary by creating mid-layer abstractions).

**Alternative That Addresses the Underlying Need:** Use categories for classification granularity ("Groceries" and "Dining Out" are categories under a "Food" jar). Use transaction splits (EO-20) for mixed-category transactions. The flat jar architecture remains simple and powerful.

---

## Rejected DNI (Do Not Implement) Items

These items were flagged as dangerous by the Domain Reality Validation Board. The Product Decision Board formally REJECTS all seven.

---

### DNI-01: Health Write-Back

**What It Was:** Health score auto-adjusts jar allocations to improve the household's health score. "Your Health score could be 85 if you moved 500k from Dining to Emergency Fund. Apply?"

**Why Rejected:**
1. **Direct Violation of BR-14.** "Health is Read-Only." This is the most fundamental constraint on the Health module.
2. **Destroys User Autonomy.** The system making allocation decisions undermines the core value proposition: partners deciding together.
3. **Slippery Slope.** If Health can suggest allocations, it's a short step to auto-applying them. The boundary must be absolute.

**Product Integrity Violated:** BR-14, Household-first architecture, Financial safety.

**No Alternative.** Health provides information. Humans make decisions. This boundary is absolute.

---

### DNI-02: Jar-to-Account Mapping

**What It Was:** Link jars directly to specific bank accounts. "Dining jar = VPBank account. Rent jar = Techcombank account."

**Why Rejected:**
1. **Direct Violation of BR-01.** "Real Ledger ≠ Virtual Jars. Never label jar intention as bank Balance." Jars are intentions; accounts are reality. Mapping them destroys this distinction.
2. **Confuses Users.** When the jar says "5,000,000" and the account says "5,200,000" because of pending transactions — which number is "real"? The distinction we worked hard to establish collapses.
3. **Operational Fragility.** Changing accounts, opening new accounts, or closing accounts breaks the mapping. The jar system should be independent of account infrastructure.

**Product Integrity Violated:** BR-01, Product identity (core differentiator destroyed).

**No Alternative.** The Real/Intention separation is ViNha's architectural foundation. No feature that blurs it can be approved.

---

### DNI-03: Auto-Commit Categorization

**What It Was:** AI categorizes all transactions with no user override. No Inbox review. No confirmation. "Smart" categorization that learns and commits.

**Why Rejected:**
1. **Destroys Trust.** If the system miscategorizes a transaction and the user doesn't catch it, financial tracking is corrupted. Trust in the system requires user verification.
2. **No Undo Path.** Auto-committed categorizations blend into the transaction history. Users can't distinguish what they categorized from what the system categorized.
3. **Contradicts EO-01.** We approved auto-categorization as suggest-with-override. Auto-commit is the opposite.

**Product Integrity Violated:** Financial safety, BR-14 spirit (system should not make financial decisions without human oversight).

**No Alternative.** Auto-categorization is a suggestion system (EO-01). The user always has the final say.

---

### DNI-04: Partner Spending Comparison

**What It Was:** "Partner A spent X this month. Partner B spent Y." Comparative spending views that highlight who spent more.

**Why Rejected:**
1. **Creates Resentment.** Financial partnership is about togetherness, not competition. Comparing spending creates score-keeping dynamics that damage relationships.
2. **Wrong Focus.** The question isn't "who spent more" — it's "did we spend according to our plan." The plan is a household plan, not individual plans.
3. **Privacy Erosion.** Individual spending visibility feels like surveillance, not partnership. Users should feel safe, not watched.

**Product Integrity Violated:** Household-first architecture (household, not individuals), Product identity (Money OS, not relationship scorekeeper).

**No Alternative.** The household view shows collective spending against the plan. No per-partner breakdown.

---

### DNI-05: Month Ritual Removal

**What It Was:** Allow permanently disabling the Month Ritual. "I don't need the ritual. Let me turn it off."

**Why Rejected:**
1. **Removes Core Behavioral Mechanism.** The Month Ritual is the accountability anchor of the product. Removing it leaves a passive expense tracker — exactly what ViNha is NOT.
2. **Product Identity Collapse.** Without the ritual, ViNha is just a categorized transaction list. The ritual is what makes it a Money Operating System.
3. **BR-09 Reinforced.** "Month Ritual mode defaults to Assisted." The ritual is non-negotiable; the mode can vary (Assisted, Quick Close), but the act of closing the month must happen.

**Product Integrity Violated:** Product identity (core mechanism removed), BR-09.

**Alternative:** Quick Close (EO-10 APPROVED WITH MODIFICATIONS) reduces ritual friction without removing the ritual. Users who truly don't want any ritual should use a different product — ViNha's identity includes the ritual.

---

### DNI-06: Health Score Leaderboards

**What It Was:** Compare household health scores. "Your household ranks #42 in Vietnam." Leaderboards, rankings, social comparison.

**Why Rejected:**
1. **Shaming, Not Motivating.** Financial health is deeply personal. A low-ranking household doesn't feel motivated — they feel ashamed. This drives users away.
2. **Privacy Violation.** Health scores are sensitive financial data. Exposing them, even in anonymized form, is a privacy risk.
3. **Wrong Incentives.** Leaderboards incentivize gaming the score, not genuine financial health improvement.

**Product Integrity Violated:** Financial safety, Privacy, Product identity.

**No Alternative.** Health is a personal benchmark, not a competition. The trend view (EO-08) shows improvement against your own past — the only comparison that matters.

---

### DNI-07: Investment Recommendations

**What It Was:** Health score suggests specific investment products. "Based on your profile, consider VNDirect's XYZ Fund."

**Why Rejected:**
1. **Regulatory Liability.** Suggesting specific investments makes ViNha a financial advisor. This requires licensing, compliance, and regulatory oversight that ViNha does not have and should not seek.
2. **Scope Creep.** ViNha is a money management tool, not a wealth management platform. Investment advice is a different product category entirely.
3. **Trust Destruction.** If a recommended investment performs poorly, users lose trust in the entire product — including the parts that were working correctly.

**Product Integrity Violated:** Scope boundaries, Regulatory compliance, Financial safety.

**No Alternative.** ViNha helps users understand their money and make decisions together. It does not tell them where to invest. This boundary is absolute for regulatory and trust reasons.
