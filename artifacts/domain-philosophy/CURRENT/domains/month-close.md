# Domain: Month Close (Month Ritual)

**Bounded Context:** Intention Plan
**Surface:** Plan (accessed via Month Ritual flow)
**Financial Principle:** Discipline, Habit, Behavior
**Business Rules:** BR-08, BR-09

---

## 1. Philosophy

The Month Ritual answers the question: **what happened this month, and are we ready for the next?**

The Month Ritual is the heartbeat of household finance. It is the periodic ceremony that closes one financial period and opens the next. Unlike the Inbox (ongoing decisions) or Jars (ongoing allocations), the Month Ritual is a *punctuation mark* — a deliberate pause to reflect, reconcile, and reset.

The philosophical purpose of the Month Ritual is *discipline.* Discipline is not punishment — it is the structure that enables freedom. By formally closing a month, the household acknowledges what happened (the facts) and commits to what comes next (the intentions). The ritual transforms household finance from a continuous, undifferentiated stream into a series of meaningful chapters.

---

## 2. User Problem

Without a period close, months blur together. The household never stops to ask: "Did we spend what we planned? Are our allocations still right? What should change next month?" Financial drift sets in.

The pain is *continuous partial attention with no closure.* Money flows in and out, Jars are adjusted, but there is no moment of "this month is done; now we look ahead."

The Month Ritual solves this by creating a structured ceremony. Once a month, the household sits down (together or individually) and walks through a guided flow: review the month, approve the close, create the snapshot, set up next month. The ritual provides closure and a clean start.

---

## 3. Financial Principle

**Discipline, Habit, and Behavior.**

- **Discipline:** The Month Ritual imposes a structure — close the month, lock the plan, open the next. This structure is not restrictive; it is liberating. The household does not have to wonder "should we review things?" — the system prompts them.
- **Habit:** Monthly rituals become habits. After a few months, the household expects and anticipates the Month Ritual. It becomes part of their financial rhythm.
- **Behavior:** The Month Ritual shapes behavior by creating a regular feedback loop. "Last month we overspent on dining — let's adjust this month's allocation." Without the ritual, this feedback never happens.

---

## 4. Core Responsibilities

1. **Guide the period-close ceremony.** The Month Ritual is a guided flow, not a single button. BR-09: defaults to Assisted mode for new households.
2. **Lock plan movements for the closed month.** BR-08: once the Month Ritual is approved, normal plan movements for that month are locked. Corrections use an explicit correction path.
3. **Create a monthly snapshot.** Preserve the state of the household's finances at month-end: Account balances, Jar allocations vs. spending, Inbox status, Goal progress.
4. **Generate a month summary.** What happened? Income, expenses, overspend events, Jar movements, Inbox resolution rate.
5. **Carry forward allocations.** What happens to unspent Jar allocations? Roll over to next month, return to unallocated, or custom? This is a household policy decision within the ritual.
6. **Prepare next month's plan.** Based on recurring rules and the household's choices, set up the initial Jar allocations for the new month.
7. **Surface discrepancies.** "You allocated 8 million to Groceries but spent 9.2 million — adjust next month's allocation?"

---

## 5. Explicit Non-Responsibilities

1. **The Month Ritual does NOT move money between Accounts.** It operates entirely within the Intention Plan — closing allocations, creating snapshots, preparing next month's plan.
2. **The Month Ritual does NOT create Transactions.** The close is an intention-layer event, not a Real Ledger event.
3. **The Month Ritual does NOT reconcile against bank statements.** Bank reconciliation is an Accounts domain concern, though the Month Ritual may prompt the household to verify account balances.
4. **The Month Ritual is NOT an Inbox item.** The ritual is a structured flow, not a single ReviewItem. Though the Inbox may contain pre-ritual items ("3 unmapped expenses — resolve before closing the month").
5. **The Month Ritual does NOT replace monthly Health assessment.** The Health Snapshot is generated during the ritual (or immediately after), but Health is its own domain that reads the snapshot.
6. **The Month Ritual does NOT execute automatically.** BR-08 requires an explicit approval. The ritual cannot run silently.

---

## 6. Domain Boundary

**IN:**
- Month Ritual flow (guided steps for period close)
- Ritual modes: Assisted (BR-09 default), Manual
- Month locking (BR-08: approved ritual locks normal plan movements)
- Correction path for locked months (explicit, auditable)
- Monthly snapshot creation (Account balances, Jar state, Goal progress, Inbox status)
- Month summary generation
- Unspent allocation handling (rollover, return, custom)
- Next month plan preparation
- Ritual approval (explicit action by a Partner or Admin)

**OUT:**
- Account balance tracking (→ Accounts domain)
- Transaction data (→ Transactions domain)
- Jar allocation management (→ Budgets domain)
- Goal progress tracking (→ Goals domain)
- Health assessment (→ Health domain — reads the snapshot)
- Recurring rule execution (→ Planning domain — recurring rules *feed* the next month's plan)

---

## 7. Business Language

**Official Terms:**
- **Month Ritual:** The periodic ceremony of closing a financial period
- **Assisted Mode:** Guided ritual with system explanations and confirmations (BR-09 default)
- **Manual Mode:** Ritual without system guidance — the household navigates freely
- **Month Lock:** The BR-08 state where normal plan movements for a closed month are restricted
- **Correction:** An explicit, auditable change to a locked month's plan
- **Snapshot:** The preserved state of finances at month-end
- **Carry Forward:** What happens to unspent Jar allocations

**Aliases:**
- "Month Close" is acceptable as a technical term.
- "Monthly Review" is acceptable in conversational contexts.

**Forbidden Terminology:**
- ❌ "Month-end run" — implies an automated batch process; the Month Ritual is a human ceremony
- ❌ "Close the books" — implies accounting finality; the Month Ritual is a household ceremony, not an audit
- ❌ "Rollover" (without context) — clarify whether it is allocation rollover, snapshot, or plan prep

**Preferred Terminology:**
- ✅ "It's time for your Month Ritual — review March and prepare for April"
- ✅ "March is locked — use corrections for any changes"
- ✅ "Snapshot saved: March 2026"

---

## 8. Mental Model

Users should think of the Month Ritual as **closing a chapter in a book and opening the next.** At the end of each chapter, the household pauses. They review what happened. They acknowledge what went well and what did not. Then they turn the page and begin a fresh chapter.

The old chapter does not disappear — it is there to reference (snapshots). But it is *closed* — you cannot go back and rewrite it casually. If a correction is needed, there is a deliberate process (correction path, BR-08). This is not restrictive; it is how stories work. You do not constantly rewrite Chapter 3 while writing Chapter 4.

This metaphor also explains why the Month Ritual mode defaults to Assisted (BR-09). A new author might benefit from guidance on how to close a chapter. An experienced author can do it manually.

---

## 9. Real-World Validation

**Monthly financial review:** Financial advisors universally recommend a monthly review of spending, saving, and planning. The Month Ritual is ViNha's implementation of this advice.

**Accounting period close:** Businesses close their books monthly or quarterly. The Month Ritual adapts this concept for household use — with appropriate simplification (no double-entry, no audit requirements, no regulatory compliance).

**Behavioral psychology:** Rituals and ceremonies are powerful behavior-shaping tools. The Month Ritual creates a recurring touchpoint that builds financial awareness over time.

**Validation:** The concept of a monthly financial review is well-established. ViNha's innovation is making it a guided, ritualistic experience rather than a chore.

---

## 10. Simplicity

The Month Ritual must balance structure (enough guidance to be useful) with flexibility (not so rigid that it feels bureaucratic).

**What could be removed?**
- For MVP, the correction path (BR-08) could be simplified: "unlock month, make changes, re-lock" rather than a separate correction flow. But the explicit correction path preserves audit integrity.
- Carry-forward rules could default to "return unspent to unallocated" for new households, with rollover as an option.

**Resist the temptation to add:**
- Mid-month "mini-rituals" — the monthly cadence is intentional.
- Automatic ritual execution — BR-08 requires explicit approval.
- Ritual "streaks" or gamification — the ritual is its own reward.

---

## 11. Evolution Potential

The Month Ritual can evolve meaningfully:

- **Ritual customization:** Households could customize which steps appear in their ritual flow.
- **Pre-ritual checklist:** "Before starting the ritual: resolve 3 Inbox items, verify account balances."
- **Ritual insights over time:** "In the last 6 Month Rituals, you have adjusted the Groceries Jar upward 5 times — consider increasing the base allocation."
- **Partner-synchronized ritual:** Both partners go through the ritual together, with synchronized screens — but this is a UX feature, not domain evolution.

The domain is stable. The concept of "closing a period and opening the next" is fundamental and will not change.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Making the Month Ritual a single "Close Month" button — it is a guided flow, not a toggle.
- Failing to enforce BR-08 adequately — if plan movements are not locked after approval, the ritual has no teeth.
- Allowing the ritual to run without resolving Inbox items — the ritual should encourage (or require) Inbox zero before close.

**UX Mistakes:**
- Making the ritual feel like a tedious form — each step should be meaningful, not bureaucratic.
- Burying the ritual — it should be prominently surfaced at month-end, not hidden in a menu.
- Using alarmist language ("MONTH CLOSE OVERDUE!") — the tone should be calm and inviting.

**Business Mistakes:**
- Allowing month-close to be skipped indefinitely — households that never perform the ritual lose the discipline benefit.
- Not providing enough guidance in Assisted mode — the ritual should explain *why* each step matters.
- Treating the ritual as an "advanced" feature — it is core to the product's rhythm.

---

## 13. Success Criteria

From the user's perspective, the Month Ritual is successful when:

1. **The household performs the ritual every month** — it becomes as natural as paying rent.
2. **The ritual feels satisfying, not burdensome** — closure is psychologically rewarding.
3. **Month-to-month comparisons are meaningful** — snapshots enable the household to see progress.
4. **The household enters each new month with clarity** — allocations are set, intentions are clear, the slate is clean.
5. **Corrections are rare but possible** — BR-08's correction path is there when needed but not casually used.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker has no concept of a month close — it just keeps recording transactions forever. ViNha creates rhythm through the Month Ritual. This is the operating system difference: the system has a heartbeat.

The Month Ritual embodies **Month as ritual.** This is a named product principle and a domain philosophy. The month is the natural unit of household finance; the ritual is the ceremony that respects that unit.

The Month Ritual embodies **Partners first.** Both partners should participate in (or at minimum, be aware of) the ritual. The snapshot is shared. The next month's plan is shared.

The Month Ritual embodies **Calm finance UI.** The ritual should feel like a calm, guided reflection — not a stressful audit.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | The ritual concept is clear and powerful |
| Financial Correctness | 9 | Aligns with monthly review best practices and accounting period close concepts |
| User Value | 9 | The ritual creates the behavioral rhythm that makes ViNha effective long-term |
| Longevity | 9 | Monthly financial review is a permanent practice |
| Extensibility | 7 | Can add customization, insights; fundamentally a ceremony |
| Simplicity | 7 | The guided flow adds structure; the challenge is making it feel light, not heavy |
| Future Evolution | 7 | Stable core with room for UX refinement |

**Overall: 8.1 / 10** — The heartbeat of ViNha. Its success depends on UX execution — the ritual must feel like a gift, not a chore.
