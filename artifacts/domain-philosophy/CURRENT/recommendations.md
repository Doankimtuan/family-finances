# Recommendations — Board Guidance for Domain Integrity

The Domain Philosophy Board offers the following recommendations. These are not feature requests. They are guardrails — principles for protecting domain integrity as ViNha evolves.

---

## Recommendation 1: Enshrine BR-01 as the First Principle

**What:** The distinction between Real Ledger and Intention Plan must be the most visible, most enforced, and most protected boundary in the entire system.

**Why:** BR-01 ("Real ledger ≠ virtual jars") is not a business rule — it is the philosophical axiom on which ViNha is built. If this distinction blurs, the system loses its reason for existing.

**How:**
- Every design review must include a "BR-01 check": does this design clearly separate Real Ledger from Intention Plan?
- The Home surface must visually reinforce the two-truths distinction — not merge them into a single "financial overview."
- New team members must understand BR-01 before they understand any other part of the system.
- The glossary's forbidden terminology list must be treated as law: never "Jar balance," never "budget account," never "available" when derived from subtracting plans from balances.

**Consequence of Ignoring:** If BR-01 is violated, ViNha becomes indistinguishable from every budgeting app that confuses plans with balances. The product's core differentiation — and its trustworthiness — evaporates.

---

## Recommendation 2: Make Health's Read-Only Nature an Architectural Guarantee

**What:** Health must be incapable of writing to any other domain. This is not a convention — it must be impossible by design.

**Why:** BR-14 ("AI may explain/suggest; must not invent balances or execute money movement") is the trust safeguard. If Health can modify financial data, the household can never be certain whether a number came from reality or from the system's judgment.

**How:**
- Health reads from all domains but has no write access to any financial domain.
- Health insights are always framed as observations, never as imperatives.
- Any future AI-Assist features that suggest actions must require explicit, attributable human confirmation.
- The Health domain's technical implementation should enforce read-only access at the infrastructure level.

**Consequence of Ignoring:** Trust is destroyed. Once the system has modified financial data without explicit human action, the household cannot trust anything it shows.

---

## Recommendation 3: Protect the Inbox as a Decision Queue — Nothing Else

**What:** The Inbox must only contain items that require a human decision. It must never become a notification center, a task list, or an activity feed.

**Why:** The Inbox's philosophical power comes from its focus. "One card, one decision" is the principle. Diluting the Inbox with informational items destroys its effectiveness as a decision-forcing mechanism.

**How:**
- Gate every proposed ReviewItem type with the question: "Does this require a human decision?"
- Create a separate notification surface for informational events. Notifications are not decisions.
- Limit MVP ReviewItem types to: unmapped expenses (BR-05), savings maturities (BR-10), installment completions (BR-11).
- Resist adding "nice to know" items: Health Score updates, Goal milestones, recurring rule executions.

**Consequence of Ignoring:** The Inbox becomes overwhelming noise. The household stops engaging with it. The "Inbox zero" habit is lost. Decisions accumulate unmade.

---

## Recommendation 4: Keep Planning Rules Stupidly Simple

**What:** Recurring rules should remain limited to percent-based and fixed-amount allocations. No conditionals. No priorities. No dependency chains.

**Why:** Planning exists to reduce cognitive load. Complex rules increase it. If rule configuration requires explanation, Planning has failed its purpose.

**How:**
- MVP rule types: "X% of income to Jar Y" and "Z fixed amount to Jar Y."
- Every rule must be explainable in one sentence.
- Both partners must be able to understand and modify every rule.
- Rule conflict resolution should not be necessary because rules should be simple enough that conflicts cannot occur.

**Consequence of Ignoring:** Planning becomes a barrier rather than an enabler. Only one partner can manage rules. The other partner disengages. The household spends more time debugging allocations than making financial decisions.

---

## Recommendation 5: Do Not Add Categories as a Navigation Surface — Ever

**What:** Categories must remain classification tags applied to Transactions. They must never become a top-level navigation destination or a primary organizing principle.

**Why:** The Category-as-destination model is the defining characteristic of expense trackers. ViNha is not an expense tracker. Adding "Categories" to the primary navigation would signal a philosophical retreat.

**How:**
- Categories are applied during Transaction entry and filtered in Transaction lists.
- Category management happens inline — creating a new Category is a side effect of entering a Transaction.
- Never add "Categories" to the bottom navigation bar.
- Never create a "Manage Categories" screen that feels like a primary destination.

**Consequence of Ignoring:** ViNha's information architecture loses its clarity. The Household Money Operating System becomes "yet another expense tracker with a categories tab."

---

## Recommendation 6: Limit Together to Two Roles — Forever

**What:** The Partner and Admin roles are sufficient for household finance. Do not add Viewer, Contributor, Approver, or any other role.

**Why:** Household finance is collaborative, not hierarchical. Partners share everything. Introducing role-based visibility restrictions ("Partner A can see this Jar, Partner B cannot") violates the transparency principle.

**How:**
- Two roles: Partner (daily money) and Admin (policy management). No more.
- All Partners see all financial data. No exceptions.
- Approval workflows (F-Approvals) are a future feature — they do not change the role model.
- Multi-household support (future) should not introduce cross-household visibility complexity.

**Consequence of Ignoring:** ViNha becomes enterprise software. The warm, collaborative household experience is replaced by permission matrices and access control lists.

---

## Recommendation 7: Make the Month Ritual Unskippable — But Delightful

**What:** The Month Ritual must be surfaced prominently at month-end. It should not be dismissible with a single tap. But it must not feel like a burden.

**Why:** The Month Ritual is the heartbeat of the system. If it is optional, it will be skipped. If it is a chore, it will be resented. The balance is: unavoidable but enjoyable.

**How:**
- Assisted mode (BR-09) is the default — the system guides the household through each step with explanations and confirmations.
- The ritual should take 5-10 minutes, not 30 minutes.
- The ritual should include moments of celebration and reflection, not just data review.
- The ritual should be visually and emotionally distinct from day-to-day app usage.

**Consequence of Ignoring:** The behavioral rhythm breaks. ViNha becomes a continuous stream with no punctuation. The discipline advantage — what separates ViNha from passive expense trackers — is lost.

---

## Recommendation 8: Never Allow Jars and Accounts to Share a List

**What:** Jars and Accounts must never appear in the same list, table, or aggregation without explicit, visually distinct separation.

**Why:** The BR-01 violation risk is highest when Jars and Accounts are visually adjacent. The human brain naturally compares numbers that appear side by side. If "Checking Account: 50,000,000" appears next to "Groceries Jar: 8,000,000," the user's brain creates a relationship that does not exist.

**How:**
- Accounts appear on the Money surface. Jars appear on the Plan surface. They are never on the same screen.
- If a summary screen must show both (e.g., Home), they must be in visually distinct sections with clear labeling.
- The total of Jar allocations must never be subtracted from Account balances and displayed as "Available."
- Cross-surface navigation (Money → Plan) is fine, but combined views are not.

**Consequence of Ignoring:** The most common BR-01 violation: the household sees the checking account balance and the Jar allocations in proximity and concludes "we have 50 million, of which 42 million is allocated, so we have 8 million available." This is mathematically correct but philosophically misleading — it implies the Jar allocations are "reserved" like pending transactions, which they are not.

---

## Recommendation 9: Invest in the ViNha Glossary as Living Documentation

**What:** The glossary (`glossary.md`) and the forbidden terminology lists in each domain file must be maintained as the system evolves. New terms must be added. Forbidden terms must be enforced.

**Why:** Ubiquitous language is not a one-time exercise. As ViNha grows, new concepts will emerge, and the temptation to use convenient-but-wrong terminology will increase. The glossary is the defense.

**How:**
- Every new feature proposal must include proposed glossary updates.
- Code reviews should flag terminology violations (e.g., a variable named `jarBalance` instead of `jarAllocation`).
- UX copy must be reviewed against the forbidden terminology lists.
- The glossary should be part of new-team-member onboarding.

**Consequence of Ignoring:** Language drift. "Jar balance" creeps into the UI. "Budget category" replaces "Jar." Within 18 months, the ubiquitous language is corrupted, and the philosophical clarity that depends on precise language is lost.

---

## Recommendation 10: Protect the Real Ledger / Intention Plan Split in Every Feature

**What:** Every new feature must be explicitly assigned to either the Real Ledger or the Intention Plan. If a feature cannot be clearly assigned to one or the other, it is probably crossing a boundary it should not cross.

**Why:** The two-truths distinction is ViNha's architectural spine. Features that blur the boundary weaken the spine.

**How:**
- Feature briefs must include a "Bounded Context" designation.
- Features that touch both Real Ledger and Intention Plan must explicitly describe how they maintain the boundary.
- The Inbox is the approved bridge — if a feature connects Real Ledger events to Intention Plan decisions, it should route through the Inbox.

**Consequence of Ignoring:** Boundary erosion. Over time, features accumulate that do not respect the two-truths distinction. The system becomes a monolith where "balance" means three different things depending on context.

---

## Recommendation 11: Design for the Disengaged Partner

**What:** Every feature should be designed with the assumption that one partner is less engaged than the other. The less-engaged partner should still be able to understand the household's financial picture at a glance.

**Why:** The North Star Metric ("weekly dual-partner clarity") is not achievable if the system is designed only for the financially-engaged partner. Household finance is inherently asymmetric — one partner often manages more of the detail. The system must bridge this gap.

**How:**
- The Home surface should provide a quick, clear summary that the less-engaged partner can understand in 30 seconds.
- The Inbox should not require deep financial knowledge to resolve items — "tap to assign this expense to Groceries Jar" is sufficient.
- Month Ritual summaries should be digestible for the partner who did not perform the ritual.
- Never assume both partners have equal context or equal engagement.

**Consequence of Ignoring:** The single-user risk materializes. One partner manages everything. The other disengages. ViNha fails its core premise of household collaboration.

---

## Recommendation 12: Resist AI Feature Creep

**What:** AI features should be limited to explanation and suggestion. AI must never execute financial actions, move money, or modify plans without explicit human confirmation.

**Why:** BR-14 is clear. But BR-14's spirit is broader than its letter: the household must always feel in control of its money. AI that acts autonomously — even with "good intentions" — undermines this sense of control.

**How:**
- AI-Assist (F-AI-Assist, post-MVP) should be a separate feature with its own boundaries.
- AI suggestions must be clearly labeled as suggestions, not as system actions.
- AI must never create Transactions, modify Jar allocations, execute Movements, or change policies.
- AI may explain Health Scores, suggest Category mappings, and propose allocation adjustments — but the household must confirm.

**Consequence of Ignoring:** Trust destruction. "Did I make that allocation, or did the AI?" Once this question is asked, the system has failed.

---

## Priority Matrix

| Priority | Recommendation | Impact if Ignored |
|----------|---------------|-------------------|
| Critical | R1: Enshrine BR-01 | Existential — product loses its identity |
| Critical | R2: Health read-only by design | Existential — trust is destroyed |
| Critical | R8: Never share Jar/Account lists | High — most common BR-01 violation vector |
| High | R3: Protect Inbox as decision queue | High — behavioral rhythm breaks |
| High | R4: Keep Planning rules simple | High — accessibility and shared management lost |
| High | R7: Month Ritual unskippable but delightful | High — behavioral rhythm breaks |
| High | R12: Resist AI feature creep | High — trust erosion |
| Medium | R5: No Categories navigation surface | Medium — philosophical positioning weakens |
| Medium | R6: Two roles only in Together | Medium — complexity and trust issues |
| Medium | R9: Maintain glossary as living doc | Medium — language drift over time |
| Medium | R10: Protect Real/Intention split in features | Medium — boundary erosion over time |
| Medium | R11: Design for disengaged partner | Medium — single-user risk |

---

## Board's Final Word on Recommendations

These recommendations are not optional. They are the minimum necessary to preserve the domain philosophy that gives ViNha its identity. A product that ignores these recommendations may still function — but it will no longer be ViNha. It will be something else: an expense tracker, a budgeting app, a financial dashboard. All useful products, but not this product.

The board's role is to say what ViNha *is.* These recommendations are that statement in operational form.
