# Feedback Loops

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Identify all positive, negative, and missing feedback loops in the system.

---

## Positive Feedback Loops (Amplify Behavior)

### P1: Savings → Health → Motivation → More Savings

| Property | Assessment |
|----------|------------|
| **Domains involved** | Savings, Health, Goals |
| **Loop description** | User saves money → Savings balance grows → Health score improves → "We're doing great!" → Motivated to save more → Allocates more to savings |
| **Healthy or dangerous?** | **HEALTHY** — this is the virtuous cycle ViNha is designed to create |
| **BR governance** | BR-14 (Health is read-only — it reflects, doesn't drive) |
| **Risk** | If Health score over-rewards savings growth, users may over-save and under-live. Score must balance saving vs. living. |

### P2: Inbox Zero → Satisfaction → More Engagement

| Property | Assessment |
|----------|------------|
| **Domains involved** | Inbox, Transactions, Jars |
| **Loop description** | User resolves Inbox items → Inbox hits zero → "All caught up!" satisfaction → User captures more transactions (feels productive) → More Inbox items → User resolves again |
| **Healthy or dangerous?** | **HEALTHY** — encourages consistent financial engagement |
| **BR governance** | BR-05 (unmapped → Inbox ensures Inbox always has work) |
| **Risk** | If Inbox resolution becomes too gamified, users may resolve quickly without thinking. Batch operations (EO-07) mitigate risk of fatigue. |

### P3: Goal Progress → Celebration → Motivation → More Funding

| Property | Assessment |
|----------|------------|
| **Domains involved** | Goals, Jars |
| **Loop description** | Goal hits milestone → EO-18 celebration → User feels progress → User increases jar allocation → Goal funded faster → Next milestone sooner |
| **Healthy or dangerous?** | **HEALTHY** — goal achievement is a core motivation driver |
| **BR governance** | BR-03 (Active jars only) ensures funding is intentional |
| **Risk** | Over-funding goals at expense of daily needs. System doesn't warn "you're funding your vacation at the cost of your grocery budget." |

### P4: Auto-Categorization Accuracy → Less Inbox → More Trust

| Property | Assessment |
|----------|------------|
| **Domains involved** | Categories, Inbox |
| **Loop description** | Auto-cat gets it right (EO-01) → Transaction auto-mapped to jar → No Inbox item → Less work for user → User trusts auto-cat → User lets more auto-cats stand → BR-16: 3-override learning → Auto-cat gets better |
| **Healthy or dangerous?** | **HEALTHY** — automation improves with use |
| **BR governance** | BR-16 (3 override → update rule) |
| **Risk** | If auto-cat is correct 90% of the time, the 10% errors are invisible (no Inbox). User must discover errors during Month Ritual. |

---

## Negative Feedback Loops (Stabilize Behavior)

### N1: Overspending → Inbox Alert → Adjustment → Reduced Spending

| Property | Assessment |
|----------|------------|
| **Domains involved** | Jars, Inbox, Tenancy |
| **Loop description** | Jar overspent → BR-07 Warn fires → Inbox alert to both partners → Partners see overspend → Reallocate or reduce spending → Jar returns to plan |
| **Healthy or dangerous?** | **HEALTHY** — this is the self-correcting mechanism |
| **BR governance** | BR-07 (overspend policy), BR-13 (partner visibility) |
| **Risk** | If Warn is too soft, overspending continues. If Block is too hard, user feels constrained. Allow Negative removes the feedback entirely. |

### N2: High Card Utilization → Health Warning → Reduced Card Spending

| Property | Assessment |
|----------|------------|
| **Domains involved** | Cards, Health |
| **Loop description** | Card balance grows → Utilization ratio increases → Health score drops (or shows warning) → "Credit usage is high" → User reduces card spending or pays down balance → Utilization improves |
| **Healthy or dangerous?** | **HEALTHY** — prevents credit overextension |
| **BR governance** | BR-14 (Health observes), BR-22 (interest cost visibility) |
| **Risk** | Health is read-only. It warns but can't prevent. User must act on the warning. |

### N3: Month Ritual → Plan Lock → Next Month Planning

| Property | Assessment |
|----------|------------|
| **Domains involved** | MonthRitual, Jars, Planning |
| **Loop description** | Month closes → Ritual approved → Jars locked (BR-08) → Snapshot informs next month's plan → Next month starts with better allocation → More accurate plan → Easier ritual next time |
| **Healthy or dangerous?** | **HEALTHY** — the Month Ritual is the learning mechanism |
| **BR governance** | BR-08 (lock on approve), BR-09 (assisted default), BR-23/24 (Quick Close) |
| **Risk** | If user skips rituals, the learning loop breaks. Planning becomes stale. Quick Close (EO-10) reduces ritual friction, preventing skip temptation. |

### N4: Payment Reminder → Payment → Card Balance Reduced

| Property | Assessment |
|----------|------------|
| **Domains involved** | Cards, Inbox, Transactions |
| **Loop description** | Payment due approaching → BR-17: 3-day reminder → Inbox ReviewItem → User pays → Card balance drops → Interest cost reduces → Payment pressure eases |
| **Healthy or dangerous?** | **HEALTHY** — prevents missed payments |
| **BR governance** | BR-17 (reminder), BR-18 (minimum visible), BR-22 (interest cost) |
| **Risk** | If user ignores reminders, no escalation. System doesn't send a second reminder. |

---

## Missing Feedback Loops (Should Exist But Don't)

### M1: Category-Jar Divergence Detection

| Property | Assessment |
|----------|------------|
| **Domains involved** | Categories, Jars, Inbox |
| **Missing loop** | When Category names and Jar names diverge, transactions can't be auto-mapped. Inbox grows. But there's no detection: "You have 15 transactions categorized as 'Dining Out' but no Jar named 'Dining Out' — create one or rename?" |
| **Why it matters** | This is the most common source of Inbox growth. Auto-categorization (EO-01) is half the solution — the other half is Category-Jar alignment. |
| **User impact** | Manual Inbox resolution for every misaligned category. Erodes trust in auto-cat. |
| **Severity** | **HIGH** |
| **Recommendation** | After N unmapped transactions with the same category, suggest creating a matching jar. Or suggest renaming the category to match an existing jar. |

### M2: Template Effectiveness Tracking

| Property | Assessment |
|----------|------------|
| **Domains involved** | Jars, MonthRitual |
| **Missing loop** | EO-06 templates create initial jars. But the system never checks: "Are you actually using these jars? Are they the right jars for your spending?" |
| **Why it matters** | Templates assume a lifestyle that may not match reality. A "Young Couple" template with "Dining Out" jar is useless for a couple that cooks at home. |
| **User impact** | Unused jars create clutter. Important jars are missing. |
| **Severity** | **LOW** |
| **Recommendation** | At Month Ritual #3, compare template jars vs. actual spending categories. Suggest adding/removing jars. |

### M3: Goal Progress → Jar Allocation Adjustment

| Property | Assessment |
|----------|------------|
| **Domains involved** | Goals, Jars, Planning |
| **Missing loop** | If a goal is behind pace, the system could suggest increasing jar allocation. If ahead of pace, could suggest reducing. Currently, goal progress and jar allocation are independently managed. |
| **Why it matters** | Goals are aspirations but jar allocations are commitments. When they disconnect, goals become fantasy. |
| **User impact** | Missed goal targets due to insufficient funding. |
| **Severity** | **MEDIUM** |
| **Recommendation** | At goal review (monthly), if goal is >20% behind pace, suggest: "To reach your Vacation Fund by December, increase allocation from $200 to $275/month." |

### M4: Health Score → Inbox Priority

| Property | Assessment |
|----------|------------|
| **Domains involved** | Health, Inbox |
| **Missing loop** | Health knows which areas need attention (e.g., "Card utilization is high"). But Inbox treats all items equally. Health could inform Inbox: "Payment due items are urgent — your credit health is at risk." |
| **Why it matters** | In R2 auto-resolution (EO-16), Health context could inform which items to auto-resolve and which to surface for review. |
| **User impact** | Users miss important items buried in a busy Inbox. |
| **Severity** | **MEDIUM** (higher for R2) |
| **Recommendation** | Add priority scoring to ReviewItems based on Health context. High-card-utilization households see card reminders as high priority. |

### M5: Correction → Inbox Re-Review Trigger

| Property | Assessment |
|----------|------------|
| **Domains involved** | Transactions, Inbox |
| **Missing loop** | When a transaction is reversed and corrected, and the original was Inbox-resolved, the Inbox item should be re-opened for re-review. Currently, this is manual. |
| **Why it matters** | A corrected transaction may need different jar mapping. If the Inbox item stays "resolved," the correction creates a mapping inconsistency. |
| **User impact** | Silent data inconsistency discovered only at Month Ritual. |
| **Severity** | **LOW** |
| **Recommendation** | When a reversal transaction references an original that was Inbox-resolved, re-open the Inbox item with status "Needs Re-Review." |

---

## Feedback Loop Health Summary

| Type | Count | Healthy | Dangerous | Missing |
|------|-------|---------|-----------|---------|
| Positive | 4 | 4 | 0 | — |
| Negative | 4 | 4 | 0 | — |
| Missing | 5 | — | — | 5 |

**Assessment:** ViNha has balanced feedback loops — positive loops encourage good behavior, negative loops correct bad behavior. No dangerous loops detected. The 5 missing loops are integration-quality issues, not structural failures.

**Most Critical Missing Loop:** M1 (Category-Jar divergence detection) — this is the root cause of unnecessary Inbox growth and the biggest threat to auto-categorization effectiveness.
