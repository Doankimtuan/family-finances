# Integration Opportunities

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Proposed business integrations where domains should collaborate more than they currently do. Business rationale only — NO implementation details.

---

## IO-01: Inbox ReviewItem Type Taxonomy

| Property | Assessment |
|----------|------------|
| **Domains involved** | Inbox, Transactions, Savings, Cards, Installments |
| **Current state** | Inbox receives ReviewItems from 4 sources. All are undifferentiated. Inbox treats a savings maturity decision the same as an unmapped coffee expense. |
| **Proposed state** | ReviewItems have a type taxonomy: `UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`. Each type has its own resolution UX, priority, and (R2) auto-resolution rules. |
| **Business rationale** | Different financial decisions need different treatment. A savings maturity decision should not be batched with an unmapped expense (EO-07). Payment reminders are time-sensitive; unmapped expenses are not. |
| **Financial rationale** | Missed payment = late fees. Missed maturity = lost interest. Missed expense categorization = minor Inbox clutter. The cost of undifferentiated treatment is real money. |
| **User value** | **9/10** — users see appropriate actions for each Inbox item type |
| **Architecture impact** | **3/10** — type taxonomy is additive to existing Inbox model |
| **Priority** | **CRITICAL** — prerequisite for EO-16 (R2 auto-resolution) |

---

## IO-02: Category-Jar Naming Contract

| Property | Assessment |
|----------|------------|
| **Domains involved** | Categories, Budgets/Jars |
| **Current state** | Categories and Jars are independently named. A transaction can be categorized as "Dining Out" but no jar named "Dining Out" exists. The transaction goes to Inbox as unmapped. No detection, no prevention. |
| **Proposed state** | Formal Category-to-Jar mapping. Option A: "Jar names are the canonical taxonomy — categories must map to a jar." Option B: "Many-to-one mapping — multiple categories can map to one jar." Plus: divergence detection after N unmapped items with the same category. |
| **Business rationale** | The Category→Jar mapping is the bridge between Real (what happened) and Intention (what we planned). Without a contract, the bridge collapses silently. |
| **Financial rationale** | Unmapped expenses = untracked spending = inaccurate jar balances = wrong plan = poor decisions. Each unmapped expense is a small financial leak. |
| **User value** | **8/10** — auto-mapping means less Inbox work; more accurate jar tracking |
| **Architecture impact** | **5/10** — requires formal mapping structure between Categories and Jars |
| **Priority** | **HIGH** |

---

## IO-03: Inbox ← Planning Direct Channel

| Property | Assessment |
|----------|------------|
| **Domains involved** | Inbox, Planning |
| **Current state** | Pattern-generated transactions go to Transactions → Inbox (two-hop). Inbox has no knowledge that this is a recurring bill. Inbox treats it as an unknown expense requiring mapping. |
| **Proposed state** | Patterns annotate generated transactions with "source: recurring pattern, expected category: X, expected jar: Y, payee: Z." Inbox reads this annotation and pre-fills resolution fields. The Inbox item becomes "Confirm: this is your monthly Internet bill?" not "What is this transaction?" |
| **Business rationale** | Recurring bills are the most predictable expenses. Making users re-map them every month is unnecessary friction. The system knows what they are — it should tell the Inbox. |
| **Financial rationale** | Reduced Inbox resolution time = higher Inbox Zero rate = more accurate jar tracking = better financial decisions. |
| **User value** | **7/10** — "Confirm" is faster than "Categorize + Map" |
| **Architecture impact** | **3/10** — add metadata annotation to pattern-generated transactions |
| **Priority** | **MEDIUM** |

---

## IO-04: Calendar — Unified Schedule Surface

| Property | Assessment |
|----------|------------|
| **Domains involved** | Planning, Cards, Installments |
| **Current state** | Calendar (EO-03) only shows RecurringPatterns. Card due dates and installment payment dates are not on the calendar — they appear only in Inbox reminders. |
| **Proposed state** | Calendar aggregates all date-driven events: RecurringPattern bills, Card payment due dates, Installment payment dates, Savings maturity dates. The Calendar becomes "what's happening with our money this month." |
| **Business rationale** | Users have one question: "What money events are coming up?" Currently, the answer is split across Inbox (card reminders), Savings (maturity alerts), and Calendar (recurring bills). A unified view answers the complete question. |
| **Financial rationale** | Visible upcoming payments → better cash flow awareness → fewer missed payments → fewer fees. |
| **User value** | **9/10** — single place to see all upcoming money events |
| **Architecture impact** | **6/10** — Calendar must read from Cards, Installments, and Savings in addition to Planning |
| **Priority** | **HIGH** |

---

## IO-05: Goal ↔ Planning Feedback

| Property | Assessment |
|----------|------------|
| **Domains involved** | Goals, Planning, Jars |
| **Current state** | Goals are funded through jar allocations. But Planning patterns (income allocation) don't consider goal funding needs. If a goal is behind pace, Planning doesn't suggest increasing allocation. |
| **Proposed state** | During income allocation (BR-04), Planning reads goal funding status. If a goal is >20% behind target pace, Planning suggests increasing the allocation to the linked jar. "Your Vacation Fund is behind — increase allocation from $200 to $275 this month?" |
| **Business rationale** | Goals without funding adjustment are wishful thinking. The system should help users connect aspirations to actions. |
| **Financial rationale** | Goal achievement rate increases → user satisfaction increases → retention increases. |
| **User value** | **7/10** — pro-active goal management |
| **Architecture impact** | **4/10** — Planning reads Goals during allocation, adds suggestion logic |
| **Priority** | **MEDIUM** |

---

## IO-06: Health → Inbox Priority Scoring

| Property | Assessment |
|----------|------------|
| **Domains involved** | Health, Inbox |
| **Current state** | Inbox treats all items equally. A payment reminder for a maxed-out card looks the same as an unmapped $5 coffee. |
| **Proposed state** | Health provides context to Inbox: "This household has 85% card utilization — payment reminders are HIGH priority." Inbox sorts items by priority: overdue actions, critical alerts, routine categorization. |
| **Business rationale** | Not all financial items are equal. The system should help users focus on what matters most. |
| **Financial rationale** | Higher priority resolution = better financial outcomes. Missed card payment = $35 late fee + credit score impact. Missed coffee categorization = minor Inbox clutter. |
| **User value** | **8/10** — Inbox shows what matters first |
| **Architecture impact** | **3/10** — add priority field to ReviewItems, scored by Health context |
| **Priority** | **HIGH** (prerequisite for R2 auto-resolution) |

---

## IO-07: Month Ritual — Adaptive Guidance

| Property | Assessment |
|----------|------------|
| **Domains involved** | MonthRitual, Health, Goals |
| **Current state** | Month Ritual (BR-09: Assisted) walks through all sections in fixed order. It doesn't adapt to what's important this month. |
| **Proposed state** | Ritual reads Health trends and Goal status. If a jar was overspent 3 months in a row, ritual highlights it: "Dining has been over plan for 3 months — review?" If a goal is about to be reached, ritual celebrates it: "Vacation Fund at 95% — almost there!" |
| **Business rationale** | The Month Ritual should be a conversation, not a checklist. Adaptive guidance makes the ritual more valuable and reduces the temptation to Quick Close without thinking. |
| **Financial rationale** | Better ritual engagement → better financial awareness → better decisions next month. |
| **User value** | **7/10** — rituals feel personalized and insightful |
| **Architecture impact** | **4/10** — Ritual reads Health trends + Goal status during preview |
| **Priority** | **LOW** |

---

## IO-08: Correction → Inbox Re-Review

| Property | Assessment |
|----------|------------|
| **Domains involved** | Transactions, Inbox |
| **Current state** | When a transaction is reversed and corrected, and the original was Inbox-resolved, the Inbox item stays "resolved." The user must manually notice and re-review. |
| **Proposed state** | When a reversal references an original transaction that has a resolved Inbox item, the Inbox item is automatically re-opened with status "Needs Re-Review." The user is prompted to verify the corrected transaction's category and jar mapping. |
| **Business rationale** | Corrections are rare but high-impact. A corrected amount or category should flow through the same review process as the original. |
| **Financial rationale** | Corrected transactions with wrong jar mapping = inaccurate financial picture. Catching this in Inbox is cheaper than discovering it at Month Ritual. |
| **User value** | **6/10** — protects against hidden data inconsistency |
| **Architecture impact** | **3/10** — add trigger on reversal to check Inbox resolution status |
| **Priority** | **LOW** |

---

## Integration Opportunities Summary

| ID | Opportunity | Domains | User Value | Arch Impact | Priority |
|----|------------|---------|------------|-------------|----------|
| IO-01 | ReviewItem Type Taxonomy | Inbox + 4 sources | 9 | 3 | **CRITICAL** |
| IO-02 | Category-Jar Naming Contract | Categories, Jars | 8 | 5 | **HIGH** |
| IO-03 | Inbox ← Planning Channel | Inbox, Planning | 7 | 3 | MEDIUM |
| IO-04 | Unified Calendar | Planning, Cards, Installments, Savings | 9 | 6 | **HIGH** |
| IO-05 | Goal ↔ Planning Feedback | Goals, Planning, Jars | 7 | 4 | MEDIUM |
| IO-06 | Health → Inbox Priority | Health, Inbox | 8 | 3 | **HIGH** |
| IO-07 | Adaptive Ritual Guidance | Ritual, Health, Goals | 7 | 4 | LOW |
| IO-08 | Correction → Inbox Re-Review | Transactions, Inbox | 6 | 3 | LOW |

**Note:** These are business proposals only. No implementation is prescribed. Each opportunity describes WHAT should happen, not HOW.
