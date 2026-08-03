# Integration Analysis

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

For every pair of domains that interact, analyze the integration.

---

## Integration Catalog

### 1. Transactions ↔ Inbox

| Property | Assessment |
|----------|------------|
| **What flows** | Unmapped transactions → ReviewItems (BR-05) |
| **Direction** | One-way: Transactions trigger Inbox. Inbox does not write back to Transactions. |
| **Tightness** | **TIGHT** — every unmapped transaction flows here. Critical path. |
| **What breaks** | Transactions become orphaned from intention. Spending happens with no jar tracking. Inbox resolution pipeline fails. ViNha degrades to expense tracker. |
| **Correct design?** | ✅ Yes. One-way trigger is correct. Inbox should not modify transactions. |
| **Concerns** | No type differentiation in ReviewItems. An unmapped expense, a savings alert, and a card reminder all become "ReviewItems." This works for R1 but breaks for R2 auto-resolution (EO-16). |

### 2. Inbox ↔ Jars

| Property | Assessment |
|----------|------------|
| **What flows** | Resolved Inbox items → jar allocation updates |
| **Direction** | One-way: Inbox writes to Jars. Jars do not write to Inbox (overspend triggers are internal to Jars). |
| **Tightness** | **TIGHT** — every Inbox resolution touches Jars. Critical path. |
| **What breaks** | Resolved items don't update jar spending. Jars are out of sync with actual spending. Month Ritual shows wrong numbers. |
| **Correct design?** | ✅ Yes. Inbox writes resolved allocations to Jars. Jars are the target. |

### 3. Savings → Inbox

| Property | Assessment |
|----------|------------|
| **What flows** | Savings maturity events → Inbox ReviewItems (BR-10); Alert cascade (BR-21) |
| **Direction** | One-way: Savings triggers Inbox. Inbox writes the user's decision back to Savings (via transaction). |
| **Tightness** | **LOOSE** — only triggers at maturity (infrequent). |
| **What breaks** | Maturity goes unnoticed. Money stays in savings product beyond maturity. User misses renewal/withdrawal window. |
| **Correct design?** | ✅ Yes. Savings should not know about Inbox internals. Trigger is correct. |
| **Concerns** | The BR-21 alert cascade (30/14/7) happens before maturity. What if user resolves the Inbox item on day 28? Does the remaining cascade cancel? Undefined. |

### 4. Cards → Inbox

| Property | Assessment |
|----------|------------|
| **What flows** | Payment due dates → Inbox reminders (BR-17) |
| **Direction** | One-way: Cards trigger Inbox. Inbox does not write back to Cards. |
| **Tightness** | **LOOSE** — triggers monthly per card. |
| **What breaks** | Payment due date passes unnoticed. Late fees. Card balance not updated. |
| **Correct design?** | ✅ Yes. Trigger is correct. |

### 5. Planning → Transactions

| Property | Assessment |
|----------|------------|
| **What flows** | RecurringPatterns generate transactions on schedule (EO-04) |
| **Direction** | One-way: Planning writes to Transactions. Transactions do not write back. |
| **Tightness** | **TIGHT** — each pattern generates transactions at its frequency (weekly/monthly/quarterly). |
| **What breaks** | Recurring bills don't appear. Calendar (EO-03) is empty. Spending is undercounted. |
| **Correct design?** | ✅ Yes. Planning generates transactions. Transactions are the single source of financial truth. |
| **Concerns** | If actual bill amount differs from pattern amount, auto-generated transaction is wrong. Need "actual vs. expected" concept. |

### 6. MonthRitual → Jars

| Property | Assessment |
|----------|------------|
| **What flows** | Ritual approval → Jars locked (BR-08) |
| **Direction** | One-way: Ritual locks Jars. |
| **Tightness** | **LOOSE** — happens once per month. |
| **What breaks** | Jars remain mutable after month close. Historical jar data can be changed. Financial integrity lost. |
| **Correct design?** | ✅ Yes. Lock on approval is correct. |
| **Concerns** | What happens if ritual is never approved? Jars remain open indefinitely. No timeout. |

### 7. Health ↔ All Operational Domains

| Property | Assessment |
|----------|------------|
| **What flows** | Health reads and summarizes data from every domain (BR-14) |
| **Direction** | One-way INBOUND to Health. Health writes to nothing. |
| **Tightness** | **READ-ONLY** — Health is a leaf node. |
| **What breaks** | Health score becomes stale or empty. But no operational domain breaks — Health is non-critical for system function. |
| **Correct design?** | ✅ Architecturally perfect. BR-14 is the strongest architectural constraint. |

### 8. Tenancy ↔ All Domains

| Property | Assessment |
|----------|------------|
| **What flows** | Auth + membership enforced on all data access (BR-02, BR-02a) |
| **Direction** | One-way: Tenancy protects. No domain writes to Tenancy (except member management). |
| **Tightness** | **UNIVERSAL** — every data access goes through tenancy. |
| **What breaks** | Data leaks between households. Unauthorized access. Entire security model fails. |
| **Correct design?** | ✅ Yes. Universal gate is the right pattern for multi-tenant financial data. |

### 9. Categories ↔ Transactions

| Property | Assessment |
|----------|------------|
| **What flows** | Category tags on transactions. Auto-categorization suggestions (EO-01). |
| **Direction** | Two-way: Transactions read Categories. Categories learn from transaction overrides (BR-16). |
| **Tightness** | **TIGHT** — every transaction has a category. |
| **What breaks** | Transactions can't be classified. Inbox can't map to jars. Spending analysis (Ritual, Health) can't group spending. |
| **Correct design?** | ⚠️ Mostly correct, but BR-16 feedback loop (3 overrides → update rule) is under-specified. What "updates"? Category suggestion engine? The mapping table? |

### 10. Categories ↔ Jars

| Property | Assessment |
|----------|------------|
| **What flows** | Category names used to map transactions to jars. Category spending totals inform jar planning. |
| **Direction** | Two-way influence: Category structure influences jar structure. Jar structure may influence category creation. |
| **Tightness** | **TIGHT** — the category → jar mapping is the bridge between Real and Intention. |
| **What breaks** | Spending can't be tracked against jars. Inbox can't resolve unmapped items. Intention Plan is blind to Real spending. |
| **Correct design?** | ⚠️ **Weak integration.** Categories and Jars have no formal contract. They can diverge (different names, different granularity). No business rule prevents divergence. |

### 11. Jars ↔ Goals

| Property | Assessment |
|----------|------------|
| **What flows** | Jar allocations fund goals. Goal funding needs inform jar allocation decisions. |
| **Direction** | Two-way: Jars fund Goals. Goals read Jar allocations for progress. |
| **Tightness** | **MEDIUM** — linked but not critical. Goals can exist without jar funding (aspirational). |
| **What breaks** | Goals don't track progress. But jars and spending still work. No critical system failure. |
| **Correct design?** | ✅ Yes. Goals are an optional layer on top of Jars. Correct layering. |

### 12. Planning ↔ Categories

| Property | Assessment |
|----------|------------|
| **What flows** | RecurringPatterns use category tags for auto-classification. |
| **Direction** | One-way: Planning reads Categories. |
| **Tightness** | **LOOSE** — patterns have a category hint. |
| **What breaks** | Pattern-generated transactions need manual categorization. Slight friction. Not critical. |
| **Correct design?** | ✅ Yes. Planning reads categories but doesn't own them. |

### 13. Inbox ↔ Tenancy

| Property | Assessment |
|----------|------------|
| **What flows** | Inbox reads household membership to scope ReviewItems. Both partners see all items. |
| **Direction** | One-way: Inbox reads Tenancy scope. |
| **Tightness** | **MEDIUM** — every Inbox display checks household scope. |
| **What breaks** | Items shown to wrong household members. Privacy violation. |
| **Correct design?** | ✅ Yes. Tenancy scope is the correct gate. |

### 14. Installments ↔ Inbox

| Property | Assessment |
|----------|------------|
| **What flows** | Installment completion → Inbox ReviewItem (celebration/confirmation). |
| **Direction** | One-way: Installments trigger Inbox. |
| **Tightness** | **LOOSE** — only on completion (rare event). |
| **What breaks** | Completion goes unnoticed. User not informed. No system failure. |
| **Correct design?** | ✅ Yes, but loosely specified. What does the ReviewItem say? "Your installment is paid off — celebrate!" Is it actionable? |

---

## Integration Health Summary

| Integration | Direction | Tightness | Health | Issues |
|-------------|-----------|-----------|--------|--------|
| Transactions → Inbox | One-way trigger | TIGHT | ✅ GOOD | No ReviewItem type taxonomy |
| Inbox → Jars | One-way write | TIGHT | ✅ GOOD | — |
| Savings → Inbox | One-way trigger | LOOSE | ✅ GOOD | Cascade cancellation undefined |
| Cards → Inbox | One-way trigger | LOOSE | ✅ GOOD | — |
| Planning → Transactions | One-way write | TIGHT | ✅ GOOD | Actual vs. expected amount gap |
| Ritual → Jars | One-way lock | LOOSE | ✅ GOOD | No timeout if ritual never approved |
| Health → All | One-way read | READ-ONLY | ✅ PERFECT | — |
| Tenancy → All | One-way protect | UNIVERSAL | ✅ GOOD | — |
| Categories ↔ Transactions | Two-way | TIGHT | ⚠️ WEAK | BR-16 feedback under-specified |
| Categories ↔ Jars | Two-way influence | TIGHT | 🔴 WEAKEST | No formal contract; divergence risk |
| Jars ↔ Goals | Two-way | MEDIUM | ✅ GOOD | — |
| Planning → Categories | One-way read | LOOSE | ✅ GOOD | — |
| Inbox → Tenancy | One-way read | MEDIUM | ✅ GOOD | — |
| Installments → Inbox | One-way trigger | LOOSE | ✅ GOOD | ReviewItem content under-specified |

---

## Integration Gaps (Should Exist But Don't)

### Gap 1: Inbox ↔ Planning (RecurringPatterns)
**Current:** Pattern-generated transactions go directly to Transactions, which may trigger Inbox (BR-05).
**Gap:** No direct integration. Patterns don't tell Inbox "a recurring bill is due — here's what I think it should be categorized as."
**Risk:** Auto-generated transactions look like any other unmapped expense. Inbox has no context that this is a recurring bill.
**Severity:** MEDIUM

### Gap 2: Goals ↔ Planning
**Current:** No direct integration.
**Gap:** Goal funding needs don't influence income allocation patterns. "We're behind on Vacation Fund — allocate 5% more this month."
**Risk:** Manual adjustment needed when automatic would be better. Missed goal targets.
**Severity:** LOW

### Gap 3: Health ↔ Inbox
**Current:** Health summarizes Inbox resolution rate.
**Gap:** Health could provide context to Inbox: "You typically spend $200 on Dining by this point in the month — this transaction looks unusual."
**Risk:** None currently. But R2 auto-resolution (EO-16) would benefit from Health context.
**Severity:** LOW (higher for R2)
