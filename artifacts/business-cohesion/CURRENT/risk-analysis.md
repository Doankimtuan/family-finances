# Risk Analysis

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Risks from cohesion failures — what happens when integrations break, data goes stale, or policies conflict.

---

## Risk 1: Inbox Stops Receiving Items from Transactions

| Property | Assessment |
|----------|------------|
| **Scenario** | BR-05 fails — unmapped transactions don't generate Inbox ReviewItems |
| **Likelihood** | **LOW** (simple trigger, well-defined) |
| **Impact** | **CRITICAL** — spending occurs but never maps to intention. Jars show incorrect balances. Month Ritual shows wrong data. Health score is inaccurate. ViNha degrades to a plain expense tracker. |
| **Domains affected** | Transactions, Inbox, Jars, MonthRitual, Health |
| **Detection** | Inbox item count drops to zero during active spending. Jar spending vs. transaction totals diverge. |
| **Mitigation** | Add reconciliation check: during Month Ritual, compare total transactions (Real) vs. total jar spending (Intention). Alert if they don't match. |

---

## Risk 2: Planning Patterns Stop Generating Transactions

| Property | Assessment |
|----------|------------|
| **Scenario** | EO-04 RecurringPatterns fail — bills don't generate transactions on schedule |
| **Likelihood** | **LOW** (automation failure, not business rule failure) |
| **Impact** | **HIGH** — recurring bills not tracked. Calendar (EO-03) is empty. Spending is undercounted. Month Ritual shows lower spending than reality. |
| **Domains affected** | Planning, Transactions, Calendar, Jars, MonthRitual |
| **Detection** | Calendar shows no upcoming entries from known patterns. Expected transactions don't appear. |
| **Mitigation** | Patterns should have "last generated" timestamp. If a pattern hasn't generated its expected transaction within 24 hours of due date, alert the Inbox. |

---

## Risk 3: Health Reads Stale Data

| Property | Assessment |
|----------|------------|
| **Scenario** | Health score calculated on data that hasn't been updated (transactions missing, jars not synced) |
| **Likelihood** | **MEDIUM** (Health-RO means Health can't mutate to self-heal; Product BR-14 also forbids inventing balances) |
| **Impact** | **MEDIUM** — users see inaccurate score, make decisions on wrong information. But operational domains are fine. |
| **Domains affected** | Health (only) |
| **Detection** | Health score timestamp vs. last transaction timestamp mismatch. |
| **Mitigation** | Health should display "Last updated: [timestamp]" with each score. If the last update is >24 hours old, show a "Data may be stale" indicator. |

---

## Risk 4: Month Ritual Locks But Doesn't Unlock

| Property | Assessment |
|----------|------------|
| **Scenario** | BR-08 locks jars on ritual approval. A bug prevents unlocking for the next month. |
| **Likelihood** | **LOW** (lock/unlock is a simple state toggle) |
| **Impact** | **HIGH** — new month starts with locked jars. No spending can be tracked. No Inbox items can be resolved. System is frozen. |
| **Domains affected** | Jars, Inbox, all Intention Plan |
| **Detection** | New transactions appear but jar spending doesn't update. Inbox items resolve but don't affect jars. |
| **Mitigation** | Locks must be month-scoped: "Locked for January 2026." When February starts, a new plan period is automatically created (unlocked). Lock should never be global. |

---

## Risk 5: Categories and Jars Diverge

| Property | Assessment |
|----------|------------|
| **Scenario** | User creates new Category "Pet Care" but no Jar "Pet Care." User creates Jar "Pet Expenses" but no Category "Pet Expenses." Transactions are categorized but never jar-mapped. |
| **Likelihood** | **HIGH** — the most likely cohesion failure. Categories and Jars are independently managed. |
| **Impact** | **HIGH** — Inbox grows with unmapped items. Jar tracking is incomplete. Auto-categorization (EO-01) works but has no mapping target. |
| **Domains affected** | Categories, Jars, Inbox, MonthRitual, Health |
| **Detection** | After N unmapped transactions with the same category, divergence is detectable. Inbox item count steadily grows. |
| **Mitigation** | IO-02: Formal Category-Jar naming contract. After N unmapped items with the same category, suggest creating a matching jar (or renaming to match existing). |

---

## Risk 6: Tenancy Policies Conflict with Jar Limits

| Property | Assessment |
|----------|------------|
| **Scenario** | Admin sets BR-07 to "Block" (can't overspend jars). Partner tries to spend $50 from Dining jar that has $30 remaining. Transaction blocked. Partner can't complete legitimate purchase during admin's unavailability. |
| **Likelihood** | **MEDIUM** — policy disagreements are expected in shared finances |
| **Impact** | **MEDIUM** — one partner blocked from spending. Frustration. May lead to partner creating a parallel, untracked account. |
| **Domains affected** | Tenancy, Jars, Transactions |
| **Detection** | Blocked transactions are visible in logs. Partner frustration reported as feedback. |
| **Mitigation** | BR-07 "Block" mode should have an override: "Partner can request override → Admin notified → Admin approves/denies within 24 hours or it auto-approves." |

---

## Risk 7: Auto-Categorization Runs Wild

| Property | Assessment |
|----------|------------|
| **Scenario** | EO-01 auto-categorizes everything. BR-16 learns from overrides. But over time, auto-cat becomes too confident — it auto-categorizes a major unusual expense incorrectly. Transaction auto-mapped to wrong jar. User never notices because Inbox is empty. |
| **Likelihood** | **MEDIUM** — machine learning drift |
| **Impact** | **MEDIUM** — wrong jar allocation. Silent corruption of financial data. Discovered only at Month Ritual. |
| **Domains affected** | Categories, Transactions, Jars |
| **Detection** | Unusual transaction amounts relative to category history. "You spent $2,000 on 'Groceries' — this is 10x your typical grocery spend. Confirm?" |
| **Mitigation** | Add anomaly detection: if a transaction amount is >3 standard deviations from the category average, flag it for manual review even if auto-cat is confident. |

---

## Risk 8: R2 Auto-Resolution Without Type Safety

| Property | Assessment |
|----------|------------|
| **Scenario** | EO-16 (R2) ships with undifferentiated ReviewItems. User sets one auto-resolution rule: "Auto-map to Miscellaneous jar." That rule now applies to savings maturity decisions, card payment reminders, and unmapped expenses alike. A $5,000 savings maturity is auto-resolved to "Miscellaneous" jar. |
| **Likelihood** | **HIGH** — if IO-01 (type taxonomy) is not done before EO-16 |
| **Impact** | **CRITICAL** — financial decisions auto-executed incorrectly. Savings maturity silently moved to wrong jar. Card payment never made. Financial damage. |
| **Domains affected** | Inbox, Savings, Cards, Jars |
| **Detection** | After the fact — Month Ritual shows unusual jar balances. |
| **Mitigation** | IO-01 is a hard prerequisite for EO-16. Auto-resolution rules must be scoped by ReviewItem type. "Auto-map unmapped expenses" ≠ "Auto-resolve savings maturity decisions." |

---

## Risk 9: Data Export Leaks Household Privacy

| Property | Assessment |
|----------|------------|
| **Scenario** | Partner A exports CSV (EO-11) with full transaction history. Partner A's individual pre-join transactions or sensitive data is included. Partner B didn't consent to export of shared data. |
| **Likelihood** | **LOW** (intentional export, not accidental leak) |
| **Impact** | **MEDIUM** — privacy concern within household. Trust erosion. |
| **Domains affected** | Tenancy, Transactions |
| **Detection** | Export logs show which partner exported what data. |
| **Mitigation** | BR-13: material data exports should notify the other partner. "Partner A exported household transaction history on [date]." |

---

## Risk 10: Month Ritual Skipped — Learning Loop Broken

| Property | Assessment |
|----------|------------|
| **Scenario** | User skips Month Ritual for 3 consecutive months. No Health snapshots. No plan locking. No learning for next month's planning. Jars drift from reality. |
| **Likelihood** | **MEDIUM** — user fatigue or life events |
| **Impact** | **HIGH** — cumulative. Each skipped month compounds the Planning → Jars drift. After 3 months, the plan has no relationship to reality. |
| **Domains affected** | MonthRitual, Jars, Planning, Health |
| **Detection** | Time since last ritual > 45 days. |
| **Mitigation** | Auto-lock after 30 days with summary (Gap 5 mitigation). Gentle nudges: "It's been 2 months since your last Month Ritual — catch up in 10 minutes with Quick Close." |

---

## Risk 11: BR-14 Identity Collision Causes Wrong Feature Compliance

| Property | Assessment |
|----------|------------|
| **Scenario** | A team cites “BR-14” to justify Health write-back (thinking AI non-invention only) OR justifies inventing AI balances (thinking Health-RO only). |
| **Likelihood** | **HIGH** (already present across frozen packs) |
| **Impact** | **HIGH** — either Health mutates money/plans or AI invents balances — both destroy OS trust. |
| **Domains affected** | Health, Inbox, Planning, Transactions (depending on which meaning is ignored) |
| **Detection** | Spec/PR reviews that say “complies with BR-14” without stating which meaning. |
| **Mitigation** | Until SoT splits IDs: cite **both** Product BR-14 (AI non-invention) and **Health-RO** explicitly. This board does not modify SoT. |

---

## Risk Summary

| # | Risk | Likelihood | Impact | Composite | Mitigation Exists? |
|---|------|-----------|--------|-----------|-------------------|
| 1 | Inbox stops receiving | LOW | CRITICAL | HIGH | ✅ Reconciliation check |
| 2 | Patterns stop generating | LOW | HIGH | MEDIUM | ✅ Pattern heartbeat |
| 3 | Health reads stale data | MEDIUM | MEDIUM | MEDIUM | ✅ Timestamp display |
| 4 | Ritual locks, no unlock | LOW | HIGH | MEDIUM | ✅ Month-scoped locks |
| 5 | Category-Jar divergence | HIGH | HIGH | **CRITICAL** | ⚠️ IO-02 proposed |
| 6 | Policy conflicts with limits | MEDIUM | MEDIUM | MEDIUM | ⚠️ Override proposal |
| 7 | Auto-cat runs wild | MEDIUM | MEDIUM | MEDIUM | ⚠️ Anomaly detection |
| 8 | R2 auto-resolution unsafe | HIGH | CRITICAL | **CRITICAL** | ⚠️ IO-01 prerequisite |
| 9 | Export leaks privacy | LOW | MEDIUM | LOW | ✅ BR-13 notification |
| 10 | Ritual skipped — loop broken | MEDIUM | HIGH | **HIGH** | ⚠️ Auto-lock + nudge |
| 11 | BR-14 ID collision (AI vs Health-RO) | HIGH | HIGH | **HIGH** | ⚠️ SoT governance split (not done here) |

**Top 3 Risks (by composite Likelihood × Impact):**
1. **Risk 5: Category-Jar Divergence** — HIGH likelihood, HIGH impact. This is the most likely cohesion failure.
2. **Risk 8: R2 Auto-Resolution Without Type Safety** — HIGH likelihood (if IO-01 not done), CRITICAL impact. This is the most dangerous future risk.
3. **Risk 11: BR-14 ID Collision** — HIGH likelihood of mis-citation; HIGH impact if AI write-back or Health mutation ships under the wrong BR-14 meaning. SoT not modified by this board.
