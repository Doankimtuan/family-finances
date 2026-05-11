# End-of-Month Jar Rollover Engine: Architecture Review & Redesign

## 1. Current Rollover Logic

In the current implementation of the Jar system, the "rollover" behavior is implicit rather than explicit.
- **Continuous Summation:** The `jar_current_balances` view calculates balances by summing all historical `jar_movements` from the dawn of time (`sum(amount * balance_delta)`).
- **Implicit Carry-Over:** Because balances are continuous aggregations, any unspent funds automatically "exist" in the next month.
- **No Explicit Transfers:** There is no automated job that zeros out a jar and sweeps the remaining balance to another jar at month-end.

## 2. Current Overspending Logic

- **Passive Negative Balances:** Currently, the system allows jar balances to go negative when expenses exceed the allocated amount.
- **No Auto-Coverage:** There is no mechanism to auto-cover negative balances from other jars. Overspending sits in the jar perpetually until manually corrected via an adjustment or future income allocation.

*(Based on your planned features, the goal is to implement explicit rollover sweeping and auto-coverage for overspending. The rest of this document will review the risks of these planned features and propose the architecture to handle them safely.)*

## 3. UX Risks

If automated rollover sweeps and overspending auto-coverage are implemented, several UX risks emerge:
- **"Ghost" Movements:** If the system automatically transfers money from "Play" to cover a deficit in "Food" at midnight on the last day of the month, the user wakes up to changed balances without understanding why.
- **Loss of Agency:** Users budget with intent. If the system auto-reallocates their funds, it breaks their mental model of envelope budgeting.
- **Confusing Automation:** If a user has an explicit rule to "Sweep remaining 'Necessities' to 'Vacation'", but 'Necessities' was negative and got covered by 'Emergency', the cascade of events is impenetrable to the user.

## 4. Accounting Risks

- **Circular Transfers:** Rule 1: Cover A with B. Rule 2: Cover B with A. If A and B are both negative, an automated engine could enter an infinite loop or create phantom money.
- **Cascading Negative Balances:** If Jar A is overspent by 1M, and auto-covers from Jar B (which only has 500k), does Jar B go negative? Or does it partially cover?
- **Historical Report Mutation:** If month-end rules rewrite past movements, financial reports for closed months change retrospectively, destroying trust in historical analytics.
- **Asset/Location Misalignment:** Jars track where money lives (`held_in_cash`, `held_in_savings`). If an auto-cover moves virtual budget from Jar A to Jar B, does it respect the underlying physical location? (e.g., You can't cover cash spending using a budget jar that is entirely held in an illiquid investment).

## 5. Missing Edge Cases

- **Retroactive Edits:** A user enters a transaction on Feb 5th, but backdates it to Jan 28th. The January month-end engine has already run. Does it re-run?
- **Deleted Jars:** A rollover rule exists to sweep funds to Jar X, but Jar X was archived mid-month.
- **Multi-Currency Fluctuations:** If overspending happens in USD but is covered by a VND jar, what exchange rate is used at month-end?
- **Approval Flows:** Should automated month-end coverage happen silently, or should it stage into the `jar_review_queue` for user approval?

## 6. Month Boundary Problems

- **Timezone Drift:** The system relies on standard `DATE` columns. A transaction at 11:30 PM on Jan 31 in New York might be Feb 1 in UTC. Month-end engines running on a CRON schedule on a UTC server will execute at the wrong time for the user's household.
- **Partial Execution:** If the CRON job crashes halfway through a household's rollover cascade, some jars are covered, some aren't.
- **Duplicate Execution:** If the job retries, it might double-sweep remaining balances if idempotency isn't strictly enforced.

## 7. Event Processing Risks

- **Event Order Dependency:** The order of operations is critical.
  - Step 1: Sweep remaining balances?
  - Step 2: Auto-cover overspending?
  - If Step 1 happens first, a jar might sweep its positive balance away, leaving it unable to help cover overspending in Step 2.
- **Idempotency Keys:** Generating movements programmatically requires bulletproof `source_id` / `source_line_key` generation so a re-run doesn't duplicate the movements.

## 8. Benchmark Comparison

### YNAB (You Need A Budget)
- **Rollover:** Unspent positive balances naturally carry over to the same envelope next month.
- **Overspending:** **NO auto-coverage.** The user must manually "Whack-a-Mole" by moving money from green categories to red ones. If uncorrected by month-end, cash overspending decreases next month's global "Ready to Assign" pool, and credit overspending becomes accrued debt.
- **Advantage:** Preserves ultimate user agency. Forces behavioral changes.

### Monarch Money
- **Rollover:** Configurable per category. You can choose to roll over positive/negative balances or reset to zero.
- **Overspending:** Requires manual reallocation. 

### Actual Budget
- **Rollover:** Similar to YNAB. 
- **Month Boundary:** Strict month-based isolation. You budget explicitly per month. 

**Insight:** None of the major players use completely silent "auto-cover" rules across different envelopes because it masks overspending habits. They force the user to feel the "pain" of reallocating.

## 9. Recommended Rollover Architecture

Instead of an active CRON job that runs at exactly 23:59:59, use a **Lazy Event-Sourced Month Closure**.

1. **State Machine:** Households have a `current_open_month`.
2. **Lazy Trigger:** When the user logs in during the new month (e.g., Feb 1st), the system detects January is still "open".
3. **Month Close Engine:**
   - It calculates the final state of January.
   - It applies user-defined sweep/cover rules by generating explicit `jar_movements` dated on the last day of the month (e.g., Jan 31).
   - It writes an immutable snapshot to `jar_monthly_snapshots`.
   - It updates the household's `current_open_month` to February.
4. **Idempotency:** The generated movements use deterministic keys: `source_type = 'month_close'`, `source_id = '2024-01'`.

## 10. Recommended Snapshot Strategy

To protect historical data and simplify queries, introduce a `jar_monthly_snapshots` table:

```sql
CREATE TABLE jar_monthly_snapshots (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  jar_id UUID NOT NULL,
  month DATE NOT NULL, -- e.g., '2024-01-01'
  
  starting_balance NUMERIC,
  total_inflow NUMERIC,
  total_outflow NUMERIC,
  ending_balance NUMERIC, -- Before rollover
  
  rollover_swept_out NUMERIC,
  rollover_swept_in NUMERIC,
  carried_forward NUMERIC, -- Starting balance for next month
  
  closed_at TIMESTAMPTZ,
  UNIQUE(jar_id, month)
);
```
*(This eliminates the need for expensive cross-joins and aggregates from the dawn of time when viewing historical months).*

## 11. Recommended Rule Engine

If you implement auto-coverage and sweeping, use a **Directed Acyclic Graph (DAG)** of rules, executed in a strict phase order:

**Phase 1: Auto-Cover Overspending (Deficit Resolution)**
- If Jar A is negative, look for coverage based on household rules.
- Rule examples: `cover_from_specific_jar` (e.g., "Cover Food from Play"), `cover_from_global_buffer` (e.g., "Cover from Unassigned").
- *Safety Constraint:* A jar can only cover up to its positive balance. No cascading negative creation. Location constraints must match (cannot cover cash spending with illiquid investment jar).

**Phase 2: End-of-Month Sweeps (Surplus Management)**
- If Jar B has a positive balance, apply sweep rules.
- Rule examples: `sweep_to_jar` (e.g., "Sweep leftover Play to Vacation"), `carry_forward` (Default: "Keep it in Play").

**Phase 3: Global Overspending Handling**
- Any remaining negative balances are swept into the "Unassigned / Next Month's Income" pool, reducing the household's global budget for the new month.

## 12. Recommended UX Flow

Avoid silent automation. Use an **Inbox / Review Flow** at the start of the month:

1. **The Prompt:** User logs in on Feb 1st. A banner appears: *"January has ended. Let's wrap up your budget."*
2. **The Summary:** Show a modal: 
   - *"You overspent 500k in Food. We suggest covering it from Play (which has 1M leftover)."*
   - *"You have 2M leftover in Necessities. We will sweep this to Long-Term Savings based on your rules."*
3. **The Action:** User clicks **"Approve & Close January"**.
4. **The Result:** The system writes the `jar_movements` and seals the month.

*Why this works:* It provides the convenience of automation but preserves the psychological impact of budgeting (seeing your overspending) and user agency.

## 13. Recommended Validation Rules

1. **No Infinite Loops:** Rule creation UI must reject cyclical sweeps (A -> B, B -> A).
2. **Positive Covering Only:** Auto-cover transactions fail if the donor jar does not have sufficient positive balance.
3. **Location Matching:** Ensure virtual location aligns. (e.g., If a negative jar represents a cash deficit, the covering jar must have `held_in_cash` available).
4. **Closed Month Immutability:** If a transaction is backdated to a closed month, it does *not* alter the closed month's snapshot. Instead, it creates a `correction` movement in the *current open month*.

## 14. Critical Risks

1. **Retroactive Destabilization:** If users frequently backdate transactions to previous months, the lazy month-close engine will be constantly out of sync. *Mitigation: Lock closed months. Backdated transactions hit the current open month's ledger.*
2. **Database Contention:** Processing complex rollover rules for all jars and all households at exactly midnight via CRON will cause massive database spikes. *Mitigation: The Lazy Month Close strategy spreads the load across the first few days of the month when users log in.*
3. **Loss of Trust:** Silent, automated adjustments will cause users to think the app is broken or "losing their money." *Mitigation: Require explicit user approval for month-end reconciliation.*

## 15. Final Recommendation

**Do not implement silent, fully automated CRON-based rollovers.**

Instead, build a **"Month-End Reconciliation Workflow"**:
1. Introduce the concept of a `closed_month`.
2. When a month ends, compile the surplus/deficit data.
3. Apply the user's rules to generate a **"Suggested Month-End Plan"**.
4. Present this to the user in the UI to approve.
5. Upon approval, generate the explicit `jar_movements` (Type: `rollover`, Delta: `+1`/`-1`) and save the `jar_monthly_snapshots`.

This architecture marries the convenience of programmatic rules with the psychological benefits of active budgeting, while protecting system performance and historical data integrity.
