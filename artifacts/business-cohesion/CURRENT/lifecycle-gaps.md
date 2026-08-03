# Lifecycle Gaps

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Identify gaps in money lifecycles: money with no exit path, decisions that can't complete, states with no transitions, missing steps, dead-end flows.

---

## Gap 1: Refund Lifecycle — No Structured Reversal-to-Original Link

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Refund Lifecycle (#7) |
| **Gap description** | A refund transaction should reference the original expense transaction. But there is no business specification for what this link looks like. Is it a "linked_transaction_id"? A "reversal_of" flag? Without this, audit is incomplete. |
| **State with no transition** | "Refund received" (S0) → "Original linked" (S2) — the link itself has no specified structure |
| **Severity** | **MEDIUM** |
| **What's needed** | Define the reversal link: a refund transaction MUST carry a reference to the original transaction. The original transaction must be flagged as "refunded." |

---

## Gap 2: Correction Lifecycle — No Audit Link Specification

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Correction Lifecycle (#12) |
| **Gap description** | Corrections create a reversal transaction and a new correct transaction. But there is no business specification for: (a) how the reversal references the original, (b) how the correction references the reversal, (c) what the original's new status is. |
| **State with no transition** | "Reversal created" (S1) → "Original marked reversed" (S2) — the link contract is undefined |
| **Severity** | **MEDIUM** |
| **What's needed** | Define: (1) Reversal transaction has `reverses_transaction_id`. (2) Original transaction status becomes "reversed". (3) New correct transaction has `corrects_transaction_id` referencing the original (not the reversal). (4) All three form a linked audit chain. |

---

## Gap 3: Emergency Lifecycle — No Emergency Mode

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Emergency Spending Lifecycle (#10) |
| **Gap description** | An emergency expense and a discretionary overspend are indistinguishable in the system. Both trigger BR-07. Both require jar reallocation. The Month Ritual note is the only way to capture "this was an emergency." |
| **State with no transition** | Between "Transaction recorded" (S1) and "Jar reallocation" (S3) — no "emergency declared" state |
| **Severity** | **LOW** |
| **What's needed** | Add an "Emergency" flag on jar reallocation. When a user moves money citing emergency, BR-07 Warn is bypassed. Month Ritual automatically surfaces emergency reallocations. |

---

## Gap 4: Savings Maturity Alert Cascade — Incomplete State Machine

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Savings Lifecycle (#4) |
| **Gap description** | BR-21 specifies a 30/14/7 day alert cascade. But what happens if the user resolves the Inbox item early (e.g., on day 28)? Do the remaining alerts (14-day, 7-day) cancel? Or do they still fire? The state machine is undefined. |
| **State with no transition** | "Maturity approaching" (S3) → "Inbox decision" (S5) — premature resolution doesn't explicitly cancel the cascade |
| **Severity** | **LOW** |
| **What's needed** | Define: once a maturity decision is made (Inbox item resolved), all pending maturity alerts for that Savings product are cancelled. |

---

## Gap 5: Month Ritual — No Approval Timeout

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Month Ritual (multiple lifecycles reference it as endpoint) |
| **Gap description** | BR-08 locks plan movements when ritual is approved. But what if the ritual is NEVER approved? Jars remain mutable indefinitely. A month from January could be edited in December. |
| **State with no transition** | "Ritual ready" → never transitions to "Approved" → "Locked" never reached |
| **Severity** | **LOW** |
| **What's needed** | Add a timeout or auto-lock: if Month Ritual is not completed within 30 days of month-end, jars are auto-locked with a "pending review" status. The user can still approve and annotate the auto-locked ritual later. |

---

## Gap 6: Recurring Bill — Actual vs. Expected Amount

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Recurring Bill Lifecycle (#8) |
| **Gap description** | EO-04 patterns generate transactions on schedule with the pattern's amount. But actual bills may differ (e.g., electricity $85 expected, $92 actual). The generated transaction has the pattern amount, not the actual. No concept of "adjust pattern-generated transaction to actual." |
| **State with no transition** | "Transaction created" (S3) — amount is pattern-expected, not actual. No "adjust to actual" state. |
| **Severity** | **LOW** |
| **What's needed** | Pattern-generated transactions should be created as "estimated" with a flag. User can confirm (amount correct) or adjust (amount different). Adjusted transactions update the pattern's running average. |

---

## Gap 7: Inbox ReviewItem — No Expiry/Staleness

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | All lifecycles that flow through Inbox |
| **Gap description** | Inbox ReviewItems have no expiry. An unmapped expense from 6 months ago sits in the Inbox forever. A payment reminder from 2 months ago (already paid) may still be there. |
| **State with no transition** | ReviewItems never transition to "expired" or "stale" |
| **Severity** | **LOW** |
| **What's needed** | Add staleness rules: (1) Payment reminders expire after the due date passes + 7 days. (2) Unmapped expenses older than the current Month Ritual are auto-resolved to "Miscellaneous" jar if one exists. (3) Stale items are moved to an "Archive" section, not clogging the active Inbox. |

---

## Gap 8: Card Lifecycle — Statement Generation Gap

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Credit Card Lifecycle (#6) |
| **Gap description** | The lifecycle describes "Billing cycle closes → Statement generated." But statement generation is implicit. There's no "statement" concept in the domain model. The card balance and payment due date are tracked, but there's no archived statement. |
| **State with no transition** | "Billing cycle closes" (S2) — no "statement archived" state |
| **Severity** | **LOW** |
| **What's needed** | Add a "Statement" concept owned by Cards. Each statement captures: period, balance at close, minimum payment, due date. Statements are immutable history. |

---

## Gap 9: Goal Completion — What Next?

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Goal Funding Lifecycle (#9) |
| **Gap description** | When a goal completes, EO-18 fires a celebration. But then what? Does the goal archive? Does it auto-create a new goal? Does it return funds to jars? The lifecycle ends at "Completed" with no transition. |
| **State with no transition** | "Completed" (S5) — no "archived" or "celebrated and closed" state |
| **Severity** | **LOW** |
| **What's needed** | After celebration: (1) Goal moves to "Achieved" status (read-only archive). (2) Linked jar funding is released — user is prompted to reallocate or create a new goal. (3) Health records the achievement. |

---

## Gap 10: Manual Adjustment — Real vs Intention Fork Underspecified

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Manual Adjustment Lifecycle (#12) |
| **Gap description** | Users need to reconcile cash or rebalance jars. Without an explicit Real vs Intention fork, “Adjust” can be interpreted as changing bank balance by editing a jar (BR-01 mental-model risk). EO-19 Decision Board wording (“ledger transaction”) conflicts with Philosophy (jars never hold money). |
| **State with no transition** | S0 Need recognized → S1a/S1b fork has no product-level decision contract |
| **Severity** | **MEDIUM** |
| **What's needed** | Label two adjustment types: Account Reconciliation (Real) vs Jar Reallocation (Intention). Resolve EO-19 wording against BR-01 in future SoT governance — this board does not redesign. |

---

## Gap 11: Goal Funding — Multi-Jar Philosophy Ahead of Product

| Property | Assessment |
|----------|------------|
| **Lifecycle affected** | Goal Funding Lifecycle (#9) |
| **Gap description** | Philosophy allows funding through one or more jars. Decision Board deferred EO-14. R1 is single-jar. Lifecycle docs that say “jars” (plural) overstate current product law. |
| **Severity** | **LOW** |
| **What's needed** | Treat multi-jar as deferred. Single-jar is complete for R1. |

---

## Gap Summary

| # | Gap | Lifecycle | Severity | Priority |
|---|-----|-----------|----------|----------|
| 1 | Refund reversal-to-original link unspecified | Refund | MEDIUM | High |
| 2 | Correction audit link unspecified | Correction | MEDIUM | High |
| 3 | No emergency mode differentiation | Emergency | LOW | Medium |
| 4 | Alert cascade cancellation undefined | Savings | LOW | Low |
| 5 | No Month Ritual approval timeout | Month Ritual | LOW | Medium |
| 6 | Actual vs. expected amount for recurring | Recurring Bill | LOW | Medium |
| 7 | No Inbox ReviewItem expiry | All (Inbox) | LOW | Medium |
| 8 | No archived card statements | Credit Card | LOW | Low |
| 9 | Goal completion has no post-celebration path | Goal | LOW | Low |
| 10 | Manual Adjustment Real vs Intention fork | Manual Adjustment | MEDIUM | High |
| 11 | Goals multi-jar Philosophy ahead of EO-14 | Goal | LOW | Low |

**Total gaps: 11 (0 CRITICAL, 3 MEDIUM, 8 LOW)**

**Severity distribution:** Most gaps are LOW — polish and completeness. Three MEDIUM gaps (refund, correction, manual adjustment) affect financial integrity / BR-01 mental model and should be addressed before R1 is complete.

**Lifecycle Completeness Score: 6.8/10** — Happy path works end-to-end; corner cases (corrections, refunds, emergencies, manual adjustments) and SoT wording tensions need explicit contracts.
