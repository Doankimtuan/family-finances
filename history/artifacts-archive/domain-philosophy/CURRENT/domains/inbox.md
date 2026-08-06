# Domain: Inbox

**Bounded Context:** Intention Plan
**Surface:** Inbox
**Financial Principle:** Decision-Making, Accountability
**Business Rules:** BR-05, BR-10, BR-11

---

## 1. Philosophy

The Inbox answers the question: **what needs a decision right now?**

The Inbox is the decision queue. It is the gap between reality (what happened in the Real Ledger) and intention (what was planned in the Intention Plan). Every item in the Inbox is an unmade decision — a ReviewItem that demands the household's attention.

The philosophical purpose of the Inbox is *decision surfacing.* Most financial software buries decisions in menus, transaction histories, and settings. ViNha inverts this: decisions are front and center. The Inbox is not a feature — it is one of the four primary navigation surfaces. This is a deliberate philosophical choice.

The Inbox is the bridge domain. It receives items from multiple sources: unmapped Transactions (BR-05), maturing Savings products (BR-10), completing Installments (BR-11), policy changes requiring partner visibility (BR-13). But the Inbox itself does not generate items — it is the collection point for decisions generated elsewhere.

---

## 2. User Problem

Households accumulate unmade financial decisions. A transaction comes in — what Jar should it go to? A savings product matures — renew or withdraw? An installment completes — what now? If these decisions are not surfaced, they pile up. The household develops "financial debt" — not money owed, but decisions owed.

The pain is *decision avoidance.* Decisions that are not surfaced do not get made. Uncategorized transactions accumulate. Savings products auto-renew without consideration. Installments complete without acknowledgment. The household drifts.

The Inbox solves this by making every pending decision into a visible, actionable card. One card, one decision. The goal is Inbox zero — not zero activity, but zero unresolved decisions.

---

## 3. Financial Principle

**Decision-Making.** Financial health is not just about numbers — it is about decisions. A household that consistently makes financial decisions is healthier than one that avoids them. The Inbox transforms "we should figure out..." into "here is what needs a decision."

**Accountability.** Every ReviewItem is visible to both partners. Decisions are shared. There is no "I did not know about that transaction" — it was in the Inbox.

---

## 4. Core Responsibilities

1. **Aggregate pending decisions.** The Inbox collects ReviewItems from across the system — it does not create the underlying events but surfaces them.
2. **Present one decision per card.** Each ReviewItem is a single, self-contained decision.
3. **Support quick resolution.** The household should be able to resolve most ReviewItems in seconds: map to a Jar, approve a renewal, acknowledge a completion.
4. **Track Inbox status.** How many items are pending? How many were resolved this week? Is the Inbox "clean"?
5. **Support deferral.** Some decisions cannot be made immediately. The Inbox allows deferral — but deferred items remain visible.
6. **Preserve decision history.** Resolved ReviewItems form an audit trail of household decisions.
7. **Enable partner visibility.** Both partners see the same Inbox. Both can resolve items. Resolution is attributable (who resolved it, when).

---

## 5. Explicit Non-Responsibilities

1. **The Inbox does NOT create decisions.** Unmapped Transactions come from the Transactions domain (BR-05). Maturities come from Savings (BR-10). Completions come from Installments (BR-11). The Inbox is the collection point, not the generator.
2. **The Inbox does NOT categorize Transactions.** The Inbox presents an unmapped Transaction and asks "which Jar?" — but the categorization itself is a mapping action, not an Inbox action.
3. **The Inbox does NOT execute financial actions.** Resolving a ReviewItem triggers an action in another domain (allocating to a Jar, marking a Savings product as renewed). The Inbox delegates the execution.
4. **The Inbox is NOT a notification center.** Notifications ("your card payment is due") are separate from decisions ("this transaction needs a Jar"). The Inbox is for decisions; notifications are for awareness.
5. **The Inbox does NOT replace month-end review.** The Month Ritual is the structured ceremony. The Inbox is the ongoing queue. Both exist.
6. **The Inbox is NOT a chat or messaging system.** Resolution is a structured action, not a conversation.

---

## 6. Domain Boundary

**IN:**
- ReviewItem aggregation from all sources
- ReviewItem types: unmapped expense, savings maturity, installment completion, policy change
- ReviewItem states: Pending, Resolved, Deferred
- Resolution actions: map to Jar, renew/save/withdraw, acknowledge
- Resolution metadata: resolver, timestamp, resolution choice
- Inbox metrics: pending count, resolved this week, average time to resolve
- Deferral support with optional remind-later date

**OUT:**
- Transaction recording (→ Transactions domain)
- Jar allocation (→ Budgets domain)
- Savings maturity logic (→ Savings domain — Inbox surfaces the decision; Savings owns the maturity detection)
- Installment completion detection (→ Installments domain — BR-11)
- Policy change management (→ Together domain)
- Notifications (→ separate notification system)

---

## 7. Business Language

**Official Terms:**
- **Inbox:** The decision queue — a primary navigation surface
- **ReviewItem:** A single decision card in the Inbox
- **Pending:** Awaiting a decision
- **Resolved:** Decision made
- **Deferred:** Decision postponed
- **Resolve:** The act of making a decision on a ReviewItem
- **Inbox Zero:** The state where all ReviewItems are Resolved or Deferred with intent

**Aliases:**
- "Decision Queue" is acceptable as a descriptive term.
- "Review" (as in "review this expense") relates to ReviewItem.

**Forbidden Terminology:**
- ❌ "Inbox task" — ReviewItems are not tasks; they are decisions
- ❌ "Inbox notification" — notifications and decisions are different concepts
- ❌ "Clear the Inbox" (implying deletion) — use "Resolve" or "Inbox zero"
- ❌ "Inbox item" — use "ReviewItem" for precision

**Preferred Terminology:**
- ✅ "You have 3 items in your Inbox — 2 expenses to map, 1 savings maturity"
- ✅ "Resolve this ReviewItem by selecting a Jar"
- ✅ "Inbox zero — all decisions made"

---

## 8. Mental Model

Users should think of the Inbox as **a physical inbox tray on the kitchen counter.** Throughout the month, slips of paper land in the tray: a receipt that needs categorizing, a bank notice that a fixed deposit matured, a notification that an installment is paid off.

Neither partner can ignore the tray — it is right there on the counter. Periodically (daily or weekly), the household sits down together (or individually) and processes the tray. Each slip is picked up, a decision is made, and the slip is filed away.

An empty tray is satisfying. It means the household is on top of its financial life. A full tray is a visual reminder: "we have decisions to make."

---

## 9. Real-World Validation

**Getting Things Done (GTD):** The Inbox concept is inspired by David Allen's GTD methodology — collect everything that needs attention into an Inbox, then process it. ViNha's Inbox applies this to household finance.

**Email Inbox:** The "Inbox zero" concept is familiar from email. The same psychology applies: an empty Inbox feels good; a cluttered Inbox creates low-grade stress.

**Household decision-making:** In shared households, decisions are often deferred because no one "owns" them. The Inbox makes decisions shared and visible — no more "I thought you were going to handle that."

**Validation:** The Inbox-as-decision-queue is a proven pattern from productivity methodology. Applying it to household finance is innovative but grounded.

---

## 10. Simplicity

The Inbox concept is simple: one queue, one decision per card. Complexity comes from too many ReviewItem types and too many resolution paths.

**What could be removed?**
- For MVP, limit ReviewItem types to: unmapped expenses (BR-05), savings maturities (BR-10), installment completions (BR-11). Other types (policy changes, goal milestones) can be added later.
- Deferral with custom remind dates adds complexity — "defer" with a default "remind in 3 days" may be sufficient.

**Resist the temptation to add:**
- Inbox categories or folders (e.g., "Urgent," "Can Wait") — the Inbox is processed as a single queue.
- Batch resolution ("approve all") — each decision deserves individual attention, even if quick.
- Automated resolution — the Inbox exists because decisions need human judgment. Auto-resolution defeats the purpose.

---

## 11. Evolution Potential

The Inbox can evolve in valuable ways:

- **Smart ordering:** The Inbox could prioritize ReviewItems by urgency or impact — but the default should be chronological.
- **Partner assignment:** "I will handle this one; you handle that one" — but this adds complexity and risks undermining shared accountability.
- **Resolution suggestions:** "This 200,000 VND expense at VinMart looks like Groceries — resolve to Groceries Jar?" — but this edges toward AI (BR-14 caution).
- **Inbox insights:** Health could report "your average Inbox resolution time is 2.3 days" — but this belongs to Health.

**The danger:** The Inbox must remain a decision queue, not become a task manager (with assignments, due dates, priorities) or an automation center (auto-resolving items). The value is in the *human decision,* not in the speed of resolution.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Generating too many ReviewItems for a single underlying event (one Transaction creating three Inbox items).
- Failing to link ReviewItems back to their source (which Transaction, which Savings product, which Installment).
- Making the Inbox write directly to other domains instead of delegating through proper domain interfaces.

**UX Mistakes:**
- Making the Inbox feel like a chore list rather than an empowering decision tool.
- Showing too much detail on each ReviewItem card — the card should present the decision, not the entire history.
- Burying the Inbox behind a badge — "3 pending" should be visible in the primary navigation.
- Making resolution feel like data entry — "map to Jar" should be a single tap/click, not a form.

**Business Mistakes:**
- Allowing the Inbox to grow unbounded without drawing attention — a household with 47 pending ReviewItems has disengaged.
- Treating Inbox zero as a "nice to have" rather than a core habit.
- Adding ReviewItem types that are informational ("your Health Score was calculated") rather than decisional — the Inbox is for decisions, not announcements.

---

## 13. Success Criteria

From the user's perspective, the Inbox is successful when:

1. **The household checks the Inbox at least weekly** — it becomes a habit, like checking email.
2. **Most ReviewItems are resolved within 48 hours** — decisions are made, not deferred indefinitely.
3. **The Inbox feels manageable, not overwhelming** — the household rarely has more than 5-10 pending items.
4. **Resolution is satisfying** — tapping "resolve" and seeing the Inbox count decrease provides a sense of progress.
5. **Both partners engage with the Inbox** — it is a shared responsibility, not one partner's chore.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker lets transactions pile up uncategorized. ViNha surfaces every uncategorized transaction as a decision. This is the operating system difference: the system actively surfaces what needs attention.

The Inbox embodies **Inbox over archaeology.** Financial decisions should not require digging through transaction histories — they should be presented directly.

The Inbox embodies **Partners first.** Both partners see the same Inbox. Both can resolve items. Financial decisions are shared.

The Inbox embodies **Calm finance UI.** The Inbox should not be red-alert-stressful. It should be a calm, organized queue. "Here are 3 things that need your attention when you are ready."

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | Decision queue is a clear, powerful concept |
| Financial Correctness | 9 | Correctly positioned as the bridge between Real Ledger events and Intention Plan decisions |
| User Value | 10 | The Inbox is the primary behavior-change mechanism — surfacing decisions changes financial behavior |
| Longevity | 9 | Decision management is a permanent need |
| Extensibility | 8 | New ReviewItem types can be added; the queue model is stable |
| Simplicity | 8 | One queue, one decision per card — but ReviewItem type diversity adds some complexity |
| Future Evolution | 8 | Smart ordering, suggestions, insights — but must resist becoming a task manager |

**Overall: 8.7 / 10** — A philosophically powerful domain. The Inbox is where ViNha's philosophy becomes tangible.
