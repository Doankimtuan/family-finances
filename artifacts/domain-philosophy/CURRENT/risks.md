# Risks — When Domain Boundaries Are Violated

This document catalogs the risks and consequences when domain boundaries are misunderstood, blurred, or deliberately violated. Each risk is a real danger — not a theoretical concern, but a path that other products have taken and regretted.

---

## Risk Category 1: The Cardinal Sin — Real Merges with Intention

### Scenario
Accounts and Jars are displayed together without clear distinction. Jar allocations are called "balances." The system shows "available to spend" as Account balance minus all Jar allocations. Users cannot tell what is real money and what is planned money.

### What Breaks
- **BR-01 is violated.** The foundational distinction of ViNha collapses.
- **Trust erodes.** When the household cannot trust what the system shows as "real" money, they stop trusting the system entirely.
- **Decisions become disconnected from reality.** The household makes spending decisions based on "Jar remaining" without knowing whether the underlying Account actually has money.
- **Financial arguments increase.** "I thought we had 5 million for groceries!" — "That was the Jar allocation, not the bank balance."

### Real-World Example
Many budgeting apps display "You have $X left for dining out" by subtracting budgeted amounts from account balances. Users spend based on this number, then overdraft because some of that money was needed for pending bills. This is the mistake ViNha must never make.

### Mitigation
- Never display Jar allocations alongside Account balances in a way that implies they are the same type of number.
- Never use the word "balance" for any Intention Plan concept.
- Always visually distinguish Real Ledger (Money surface) from Intention Plan (Plan surface).
- The Home chip should reinforce the BR-01 distinction, not blur it.

---

## Risk Category 2: The Inbox Becomes a Notification Dump

### Scenario
Every system event generates an Inbox item. "Your Health Score was calculated." "A recurring rule fired." "Your partner logged in." The Inbox fills with informational items, burying actual decisions.

### What Breaks
- **The Inbox loses its philosophical purpose.** It is no longer a decision queue; it is a notification center.
- **Decision fatigue increases.** The household must scan 20 items to find the 2 that actually need decisions.
- **Inbox zero becomes impossible.** Informational items cannot be "resolved" — they are just acknowledged. The household stops trying to clear the Inbox.
- **The behavioral rhythm breaks.** The Inbox is no longer a reliable signal of "things that need attention."

### Mitigation
- Limit ReviewItem types to actual decisions: unmapped expenses (BR-05), savings maturities (BR-10), installment completions (BR-11), policy changes (BR-13).
- Create a separate notification surface for informational events.
- Guard the Inbox boundary ruthlessly. Ask of every proposed ReviewItem: "Does this require a human decision?"

---

## Risk Category 3: Categories Become a Standalone Surface

### Scenario
Categories get their own top-level navigation. "Manage Categories" becomes a feature. Users spend time organizing Category hierarchies, color-coding, and building elaborate taxonomies. The app starts to feel like a categorization tool rather than a money management system.

### What Breaks
- **ViNha becomes an expense tracker.** The Category-as-destination model is the defining characteristic of expense tracking apps.
- **The primary shift is lost.** ViNha is organized around Jars (intentions) and Accounts (reality). Adding Categories as a primary surface fractures this clarity.
- **User attention is diverted.** Time spent managing Categories is time not spent on Jars, Inbox, and Month Ritual — the behaviors that actually improve financial health.
- **Complexity explodes.** Category hierarchies, sub-categories, merge tools, bulk-edit — these features grow without bound.

### Mitigation
- Categories are tags applied during Transaction entry. They have no standalone surface.
- Category management happens inline — when entering a Transaction, the user can create a new Category.
- Never add "Categories" to the primary navigation (bottom nav: Home, Money, Plan, Inbox, Together — not Categories).

---

## Risk Category 4: Health Crosses the Read-Only Line

### Scenario
Health starts "helping." "Your emergency fund is low — we have created an Emergency Fund Jar and allocated 5 million to it." "Based on your spending patterns, we have adjusted your Groceries Jar allocation." AI-generated recommendations become automatic actions.

### What Breaks
- **BR-14 is violated.** The system invents money or executes money movement without the household's explicit action.
- **Trust is destroyed.** Once the system moves money automatically, the household cannot trust what they see. "Did I allocate that, or did the system?"
- **Accountability disappears.** When something goes wrong ("why is there no money for rent?"), no one knows who made the decision.
- **The mirror becomes an actor.** Health's value is in reflecting reality. Once it starts changing reality, it can no longer reflect it accurately.

### Mitigation
- Health is strictly read-only. This is enforced at the architectural level, not just the philosophical level.
- Health insights are framed as observations, not imperatives. "Your emergency fund covers 1 month of expenses" — not "You should increase your emergency fund."
- Light scenarios are "what if" explorations, not "we have done this for you" actions.
- Any future AI-Assist features that suggest actions must require explicit household confirmation.

---

## Risk Category 5: Planning Becomes a Programming Language

### Scenario
Recurring rules grow in complexity. "Allocate 30% to Groceries, but only if the Dining Out Jar is not overspent, and only if income exceeds 30 million, and priority goes to Rent first, and if it is December, allocate extra to Gifts." Rule configuration requires a manual. One partner can configure rules; the other cannot understand them.

### What Breaks
- **Accessibility is lost.** ViNha is for couples and families, not for financial engineers.
- **Shared management becomes impossible.** If only one partner can understand and modify rules, the household is no longer managing money together.
- **Debugging replaces planning.** The household spends time figuring out "why did the system allocate this way?" rather than making decisions.
- **Simplicity is sacrificed.** Planning's purpose is to reduce cognitive load. Complex rules increase it.

### Mitigation
- For MVP, limit rules to: "X% to Jar" and "Y fixed amount to Jar."
- No conditional rules. No priority ordering. No dependency chains.
- Every rule must be explainable in one sentence.
- Both partners must be able to understand and modify every rule.

---

## Risk Category 6: Together Becomes an Enterprise Permission System

### Scenario
Roles proliferate: Viewer, Contributor, Approver, Auditor. Per-Jar visibility rules: "Partner A can see the Groceries Jar but not the Personal Jar." Per-Account access: "Partner B can see the Joint Account but not the Individual Account." Approval workflows: "Spending over 500,000 VND requires Partner approval."

### What Breaks
- **Partners first is violated.** ViNha's premise is that Partners are equal on daily money. Granular permissions create hierarchy.
- **Transparency is lost.** Hidden Jars, hidden Accounts, hidden Transactions — the system no longer mirrors reality for all Partners.
- **Trust erodes.** "What is my partner hiding in that Jar I cannot see?"
- **ViNha becomes enterprise software.** The target users are couples and small families, not organizations with complex access control needs.

### Mitigation
- Two roles only: Partner and Admin. That is it.
- All Partners see everything. No per-Jar, per-Account, or per-Transaction visibility rules.
- Approval workflows (F-Approvals) are a separate, future feature — not a Together domain responsibility.
- The Admin role manages policies, not access. Partners cannot be locked out of financial data.

---

## Risk Category 7: The Month Ritual Becomes Optional

### Scenario
The Month Ritual is buried in a menu. It is not surfaced at month-end. Households can skip it indefinitely. The snapshot feature is decoupled from the ritual. Eventually, the ritual is removed entirely because "nobody uses it."

### What Breaks
- **The behavioral rhythm breaks.** Without the Month Ritual, ViNha becomes a continuous stream with no punctuation.
- **Month-over-month awareness is lost.** The household never stops to reflect on what happened.
- **The discipline advantage disappears.** ViNha becomes just another app where money flows through without structure.
- **The snapshot and Health features lose their anchor.** Without a defined month-end, "comparing this month to last month" becomes ambiguous.

### Mitigation
- The Month Ritual must be surfaced prominently at month-end.
- The ritual must be easy to perform (Assisted mode, BR-09) — friction leads to avoidance.
- The ritual should feel rewarding, not punitive — celebration of completion, not scolding for overspend.
- Snapshot creation is tied to the ritual — no ritual, no snapshot.

---

## Risk Category 8: Goals and Savings Products Become the Same Thing

### Scenario
A "Goal" to save 100 million for a house down payment is displayed alongside a 100 million fixed deposit Savings product. The system treats them as interchangeable. "You have reached your Goal" is auto-triggered when a Savings product matures.

### What Breaks
- **Intention and reality conflate.** A Goal is a promise to yourself. A Savings product is a contract with a bank. They are not the same thing.
- **The household loses clarity.** "Is that 100 million in the bank, or is it a plan to have 100 million?"
- **Goal progress becomes fictional.** If the system auto-links Savings maturity to Goal completion, Goals reflect product timelines, not household commitment.
- **BR-01 is indirectly violated.** The Intention Plan (Goal) and Real Ledger (Savings product) boundaries blur.

### Mitigation
- Goals and Savings products are displayed on different surfaces (Plan vs. Money).
- A Goal may be *funded by* a Savings product, but they are not the same entity.
- Goal completion requires household acknowledgment — it is never auto-triggered.
- The distinction between "saving for X" (Goal) and "money earning interest at the bank" (Savings product) must be clear in all communications.

---

## Risk Category 9: Jars Proliferate Unbounded

### Scenario
The household creates 40 Jars. Some are never used. Some have 50,000 VND allocations. The Plan surface becomes a scrolling list. The household spends more time managing Jars than making financial decisions.

### What Breaks
- **Cognitive load increases.** More Jars = more decisions = more fatigue.
- **The value of allocation is diluted.** When each Jar holds a tiny amount, the household stops caring about individual allocations.
- **Month Ritual becomes a chore.** Reviewing 40 Jars takes forever.
- **The onboarding promise is broken.** ≤3 essentials during onboarding implies Jars should be few and meaningful.

### Mitigation
- Onboarding guides households to ≤3 essential Jars.
- The system could gently suggest Jar consolidation ("You have 3 Jars related to food — consider combining?").
- Paused and Archived states exist for a reason — Jars should be closed when their purpose is fulfilled.
- The Plan surface should not penalize the household for having many Jars, but the guidance should encourage fewer, more meaningful Jars.

---

## Risk Category 10: The System Becomes a Single-User Tool

### Scenario
One partner sets up everything. The other partner never logs in. The Inbox is managed by one person. The Month Ritual is performed solo. Together becomes a "settings" screen visited once during onboarding.

### What Breaks
- **The household finance premise collapses.** ViNha becomes personal finance software with a shared login.
- **The behavioral benefits are lost.** One person carries the mental load. The other disengages.
- **Financial transparency is theoretical, not practical.** "You have access" is not the same as "you regularly engage."
- **The North Star Metric is unachievable.** "Weekly dual-partner clarity" requires both partners to be active.

### Mitigation
- The system should encourage both-partner engagement — not through nagging, but through design.
- The Inbox should feel like a shared space, not one person's task list.
- Month Ritual should suggest both partners participate.
- Together should feel warm and human — "our household" — not like a settings panel.

---

## Summary Risk Matrix

| Risk | Likelihood | Impact | Mitigation Difficulty |
|------|-----------|--------|----------------------|
| Real merges with Intention (BR-01) | Medium | Critical | Easy — but requires constant vigilance |
| Inbox becomes notification dump | High | High | Easy — just say no to non-decision items |
| Categories become standalone surface | Medium | High | Easy — never add to navigation |
| Health crosses read-only line (BR-14) | Medium | Critical | Moderate — architectural enforcement needed |
| Planning becomes programming language | High | High | Moderate — requires product discipline |
| Together becomes enterprise permissions | Low | High | Easy — just say no to role proliferation |
| Month Ritual becomes optional | Medium | High | Easy — keep it surfaced |
| Goals and Savings conflate | Medium | Medium | Easy — separate surfaces, clear language |
| Jars proliferate unbounded | High | Medium | Moderate — requires thoughtful UX guidance |
| System becomes single-user | High | Critical | Hard — behavioral change is the hardest problem |

---

## Board Advisory

The risks documented here are not hypothetical. They represent paths that competitors have taken, mistakes that well-intentioned teams have made, and temptations that will recur as ViNha grows. The board's role is not to prevent all risk — that is impossible — but to ensure that when boundary decisions are made, they are made with full awareness of the consequences.

The two risks that would be *existential* for ViNha are:
1. **BR-01 violation (Real = Intention):** This destroys the product's reason for existing.
2. **BR-14 violation (Health writes):** This destroys trust, which is the foundation of all financial software.

All other risks are recoverable. These two are not.
