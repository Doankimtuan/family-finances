# Jar Funding & Budget Allocation Flow: Comprehensive Review

## 1. Current Funding Flow

### A. Real Money Movement (Accounts/Transactions)
1. User creates a **Transaction** (income/expense/transfer) in an **Account**
2. Transaction is recorded in the ledger with amount, date, category, account
3. Account balance is updated via aggregation
4. **Real money never leaves the account**

### B. Virtual Allocation (Jars/Movements)
1. Transaction triggers a **Jar Review Queue** item
2. User navigates to `/jars/review` to see pending allocations
3. User either:
   - Accepts suggested allocations (for income)
   - Manually assigns to jars (for expenses)
4. Allocation creates **Jar Movements** (virtual ledger entries)
5. Jar balances are calculated from movements, not from accounts

### C. Sync Triggers
- **Income Transaction:** `syncTransactionToJarIntent()` → `computeIncomeAllocationSuggestions()` → Queue with suggestions
- **Expense Transaction:** `syncTransactionToJarIntent()` → Check `jar_rules` for category mapping → Either auto-move or queue
- **Savings Create/Withdraw:** Similar flow via `sync-savings.ts`

---

## 2. Current Allocation Model

### A. Income Allocation Strategy
```
1. Calculate percentage-based allocations first
   - For each jar with income_percent > 0:
     suggested = (remaining_income * income_percent) / 100
   - Deduct from remaining pool

2. Fill fixed targets second
   - For each jar with fixed_amount > 0:
     gap = fixed_amount - current_month_inflow
     suggested = min(gap, remaining)
   - Deduct from remaining pool

3. Return suggestions with reasons
```

**Issue:** Allocations can exceed real account balances. Example:
- Account has 5M VND
- User sets: Food Jar 40%, Education Jar 40%, Play Jar 40%
- System suggests: 2M + 2M + 2M = 6M (exceeds available!)

### B. Expense Allocation Strategy
```
1. Check jar_rules for category → jar mapping
   - If found: Auto-create jar_movement (no queue)
   - If not found: Queue for manual review

2. User manually selects jar(s) and amounts
   - Can split across multiple jars
   - No validation against jar balance
```

**Issue:** Users can overspend a jar. Example:
- Food Jar has 1M balance
- User spends 1.5M on groceries
- System allows it; jar balance goes negative

### C. Double Counting Risk: NONE
- Real balances calculated from `transactions` table
- Virtual balances calculated from `jar_movements` table
- No shared state between them
- ✅ **Accounting is clean**

---

## 3. Accounting Review

### A. Positive Aspects
- ✅ **Strict Separation:** Real money (accounts) vs virtual budgets (jars)
- ✅ **Immutable Ledger:** `jar_movements` are append-only
- ✅ **Audit Trail:** Every movement linked to source transaction
- ✅ **Location Tracking:** `location_from` / `location_to` tracks where virtual money sits
- ✅ **No Duplication:** Money doesn't appear in both systems

### B. Risks & Inconsistencies

#### Risk 1: Unresolved Queue = Stale State
- Real account balance: 5M (accurate)
- Pending review queue: 3M (unresolved)
- Jar balances: Don't reflect the 3M yet
- **User sees inconsistent picture**

#### Risk 2: Negative Jar Balances
- Jar "Food" has 1M allocated
- User spends 1.5M on groceries
- System allows it; balance = -0.5M
- **No validation prevents overspending**

#### Risk 3: Location Tracking Fragility
- Jar movement says "held_in_savings: 500k"
- Savings account value drops due to market downturn
- Jar still shows 500k held in savings
- **Virtual holding value ≠ real asset value**

#### Risk 4: Asset Price Changes
- User allocates 1M to "Investment" jar
- Buys stock worth 1M
- Stock price drops to 800k
- Jar still shows 1M "held_in_investments"
- **Jar balance doesn't reflect real-world value changes**

---

## 4. UX Confusion Risks

### A. Terminology Confusion
| Term | Actual Meaning | User Likely Thinks |
|------|---|---|
| "Allocate" | Assign budget quota | Move real money |
| "Fund Jar" | Set virtual target | Deposit cash |
| "Jar Balance" | Virtual quota remaining | Real money available |
| "Held in Savings" | Virtual money location | Actual savings account |

### B. Misleading UI Patterns
1. **Jar Overview Card**
   - Shows "Current Balance: 1.5M"
   - User thinks: "I have 1.5M to spend"
   - Reality: "I budgeted 1.5M, but real account might be empty"

2. **Location Breakdown**
   - Shows "Held in Cash: 500k, Held in Savings: 1M"
   - User thinks: "I have 1.5M across accounts"
   - Reality: "I virtually allocated 1.5M to these locations"

3. **Monthly Target Dialog**
   - Shows "Fixed: 5M" or "Percent: 20%"
   - User thinks: "This is my spending limit"
   - Reality: "This is my allocation target"

### C. Missing Affordability Check
- User sets: "Food Jar: 50% of income"
- Income is 10M
- System suggests: Allocate 5M to Food
- **But account only has 2M!**
- No warning shown

### D. Overspending Not Prevented
- Food Jar has 1M balance
- User creates 1.5M expense
- System allows it
- Jar balance goes negative
- **No UI indication of overspending**

---

## 5. Missing Logic

### A. Allocation Limits
- ❌ No check: "Can I allocate more than account balance?"
- ❌ No check: "Can I allocate more than income?"
- ❌ No check: "Can I overspend a jar?"
- ❌ No check: "Can I allocate across multiple currencies?"

### B. Overspending Handling
- ❌ No prevention of negative jar balances
- ❌ No warning when spending exceeds jar balance
- ❌ No "overspend from next month" feature (like YNAB)
- ❌ No rollover of unspent budget

### C. Asset Deletion/Archive Behavior
- If user deletes a savings account with jar movements:
  - `jar_movements` still reference it
  - `held_in_savings` becomes orphaned
  - **No cascade cleanup**

### D. Multi-Currency Issues
- Accounts can have different currencies
- Jars don't have currency field
- If user allocates from USD account to jar:
  - No exchange rate applied
  - No currency tracking in movements
  - **Silently mixes currencies**

### E. Historical Snapshot Issues
- User changes jar plan mid-month
- Old allocations still use old plan
- No snapshot of what plan was active when
- **Audit trail is incomplete**

### F. Allocation Reconciliation
- User allocates 5M to Food Jar
- Then deletes the transaction
- Jar movement is orphaned
- **No automatic cleanup**

---

## 6. Ledger/Event Problems

### A. Missing Events
- ❌ No "allocation_created" event
- ❌ No "allocation_modified" event
- ❌ No "allocation_reversed" event
- ❌ No "overspend_detected" event

### B. Audit Trail Gaps
- `jar_movements` table has `created_by` and `created_at`
- But no `updated_at` or edit history
- If user corrects an allocation:
  - Old movement is deleted
  - New movement is created
  - **No trace of the correction**

### C. Review Queue State Machine
- States: `pending` → `resolved` → (no further states)
- ❌ No `rejected` state
- ❌ No `partial_resolved` state
- ❌ No `expired` state
- User can't "undo" a resolution

### D. Orphaned Movements
- If source transaction is deleted:
  - `jar_movements.related_transaction_id` becomes null
  - Movement still exists
  - **Dangling reference**

---

## 7. Scalability Risks

### A. Review Queue Buildup
- High-transaction households (daily coffee, groceries):
  - 30+ transactions per month
  - Each creates a queue item
  - User must manually resolve each
  - **Alert fatigue → abandonment**

### B. Aggregation Performance
- `jar_current_balances` view:
  ```sql
  SELECT ... 
  FROM jars j
  LEFT JOIN jar_movements m ON m.jar_id = j.id
  GROUP BY j.id
  ```
  - For 10 jars × 1000 movements = 10k rows to aggregate
  - For 10 jars × 100k movements = 1M rows to aggregate
  - **Slow for multi-year households**

### C. Monthly Balance View
- `jar_balances_monthly` view:
  ```sql
  CROSS JOIN (generate_series(...) AS month)
  ```
  - Generates 12 months × 10 jars = 120 rows
  - Then joins to movements
  - **Expensive for historical queries**

### D. Suggestion Computation
- `computeIncomeAllocationSuggestions()`:
  - Fetches all plans, jars, balances
  - Loops through plans twice
  - Called on every income transaction
  - **No caching**

---

## 8. Benchmark Comparison

### A. YNAB (You Need A Budget)
- **Real vs Virtual:** Strict separation like this system
- **Overspending:** Allowed, but tracked as "overspending from next month"
- **Allocation:** Happens at transaction time, not in queue
- **Suggestions:** Based on spending patterns, not fixed targets
- **Advantage:** Immediate feedback; no queue backlog

### B. Monarch Money
- **Real vs Virtual:** Similar separation
- **Overspending:** Prevented by default (can override)
- **Allocation:** Auto-categorized by ML, user can adjust
- **Suggestions:** Based on historical spending
- **Advantage:** Smart defaults; less manual work

### C. Actual Budget
- **Real vs Virtual:** Strict separation
- **Overspending:** Allowed; tracked as "carryover"
- **Allocation:** Happens at transaction time
- **Suggestions:** None; user manually allocates
- **Advantage:** Full control; no automation

### D. Goodbudget (Digital Envelope)
- **Real vs Virtual:** Virtual envelopes only (no real accounts)
- **Overspending:** Prevented by design
- **Allocation:** Manual; user decides how much to put in each envelope
- **Suggestions:** None
- **Advantage:** Simple; no confusion between real/virtual

### E. This System vs Benchmarks
| Feature | This System | YNAB | Monarch | Actual | Goodbudget |
|---------|---|---|---|---|---|
| Real/Virtual Separation | ✅ | ✅ | ✅ | ✅ | ❌ |
| Overspend Prevention | ❌ | ⚠️ | ✅ | ❌ | ✅ |
| Auto-Suggestions | ✅ | ✅ | ✅ | ❌ | ❌ |
| Queue-Based Allocation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Immediate Feedback | ❌ | ✅ | ✅ | ✅ | ✅ |
| Multi-Currency | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 9. Recommended Improvements

### A. Immediate (High Impact, Low Effort)

#### 1. Add Overspend Prevention
```typescript
// In resolveJarReviewQueue()
for (const allocation of allocations) {
  const balance = await getJarBalance(jar_id);
  if (allocation.amount > balance) {
    throw new Error(`Overspend: ${jar.name} only has ${balance}`);
  }
}
```

#### 2. Add Affordability Check
```typescript
// In computeIncomeAllocationSuggestions()
const accountBalance = await getAccountBalance(householdId);
const totalSuggested = suggestions.reduce((sum, s) => sum + s.amount, 0);
if (totalSuggested > accountBalance) {
  // Warn or cap suggestions
}
```

#### 3. Improve Terminology
- "Allocate" → "Budget"
- "Fund Jar" → "Set Monthly Target"
- "Jar Balance" → "Budget Remaining"
- "Held in Savings" → "Allocated to Savings"

#### 4. Add Overspend Indicator
```tsx
const isOverspent = currentBalance < 0;
<Badge className={isOverspent ? "bg-red-100" : "bg-green-100"}>
  {isOverspent ? "Overspent" : "On Track"}
</Badge>
```

### B. Medium Term (High Impact, Medium Effort)

#### 5. Implement Rollover Logic
```typescript
// At month boundary:
// - Unspent budget carries to next month
// - Overspent budget deducted from next month
```

#### 6. Add Allocation Audit Trail
```sql
CREATE TABLE jar_allocation_history (
  id UUID,
  jar_id UUID,
  month DATE,
  old_amount NUMERIC,
  new_amount NUMERIC,
  changed_by UUID,
  changed_at TIMESTAMPTZ
);
```

#### 7. Implement Undo/Correction
```typescript
// Allow user to "reverse" a resolution
// Create new movements with opposite delta
// Mark original as "corrected"
```

#### 8. Add Multi-Currency Support
```typescript
// In jar_movements:
// - Add currency field
// - Add exchange_rate field
// - Normalize to household base currency
```

### C. Long Term (Architectural)

#### 9. Move Allocation to Transaction Time
- Instead of queue-based, allocate when transaction is created
- Show immediate feedback
- Reduce queue backlog

#### 10. Implement Smart Suggestions
- Learn from user's allocation patterns
- Suggest based on history, not just targets
- Use ML to predict category → jar mapping

#### 11. Add Spending Forecasting
- Project end-of-month balance
- Warn if on track to overspend
- Suggest reallocation

#### 12. Implement Envelope Locking
- Allow user to "lock" a jar
- Prevent overspending
- Show warning when approaching limit

---

## 10. Recommended Domain Model

### A. Core Entities

```typescript
// Real Money (Immutable)
Account {
  id: UUID
  household_id: UUID
  name: string
  type: 'checking' | 'savings' | 'cash'
  balance: NUMERIC (calculated from transactions)
  currency: CHAR(3)
}

Transaction {
  id: UUID
  account_id: UUID
  type: 'income' | 'expense' | 'transfer'
  amount: NUMERIC
  date: DATE
  category_id: UUID
  description: string
}

// Virtual Budget (Mutable)
Jar {
  id: UUID
  household_id: UUID
  name: string
  type: 'essential' | 'savings' | 'play'
  color: string
  icon: string
}

JarMonthPlan {
  id: UUID
  jar_id: UUID
  month: DATE
  fixed_target: NUMERIC (0 if percent-based)
  percent_target: NUMERIC (0 if fixed)
  notes: string
}

JarAllocation {
  id: UUID
  jar_id: UUID
  month: DATE
  amount: NUMERIC (current budget remaining)
  allocated_at: TIMESTAMPTZ
  allocated_by: UUID
}

JarMovement {
  id: UUID
  jar_id: UUID
  month: DATE
  type: 'allocate' | 'spend' | 'rollover' | 'correction'
  amount: NUMERIC
  delta: -1 | 0 | 1
  source_transaction_id: UUID (nullable)
  created_at: TIMESTAMPTZ
  created_by: UUID
}

// Audit
AllocationEvent {
  id: UUID
  jar_id: UUID
  event_type: 'allocated' | 'spent' | 'overspent' | 'corrected'
  amount: NUMERIC
  previous_balance: NUMERIC
  new_balance: NUMERIC
  created_at: TIMESTAMPTZ
  created_by: UUID
}
```

### B. Key Relationships
- Account 1:N Transaction (real money)
- Jar 1:N JarMonthPlan (budget targets)
- Jar 1:N JarAllocation (monthly budgets)
- Jar 1:N JarMovement (virtual ledger)
- Transaction 0..1 JarMovement (optional link)

### C. Invariants
- `JarAllocation.amount >= 0` (no negative budgets)
- `JarMovement.amount > 0` (movements are always positive)
- `sum(JarAllocation.amount) <= Account.balance` (optional: prevent over-allocation)
- `JarMovement.delta ∈ {-1, 0, 1}` (only three states)

---

## 11. Recommended Ledger Structure

### A. Allocation Ledger (New)
```sql
CREATE TABLE jar_allocations (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  jar_id UUID NOT NULL,
  month DATE NOT NULL,
  allocated_amount NUMERIC(18,0) NOT NULL,
  allocated_by UUID NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  UNIQUE(jar_id, month)
);

-- Tracks: "On 2024-01-01, User allocated 5M to Food Jar for January"
```

### B. Movement Ledger (Enhanced)
```sql
CREATE TABLE jar_movements (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  jar_id UUID NOT NULL,
  month DATE NOT NULL,
  
  -- What happened
  movement_type TEXT NOT NULL, -- 'allocate' | 'spend' | 'rollover' | 'correction'
  amount NUMERIC(18,0) NOT NULL,
  delta SMALLINT NOT NULL, -- -1 | 0 | 1
  
  -- Why it happened
  source_type TEXT, -- 'transaction' | 'manual' | 'rollover' | 'correction'
  source_id UUID,
  related_transaction_id UUID,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  
  -- Correction tracking
  corrected_by UUID,
  corrected_at TIMESTAMPTZ,
  correction_reason TEXT
);

-- Tracks: "On 2024-01-15, User spent 500k from Food Jar (transaction #123)"
```

### C. Event Log (New)
```sql
CREATE TABLE jar_events (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  jar_id UUID NOT NULL,
  month DATE NOT NULL,
  
  event_type TEXT NOT NULL, -- 'allocated' | 'spent' | 'overspent' | 'corrected' | 'rolled_over'
  
  -- State before/after
  previous_balance NUMERIC(18,0),
  new_balance NUMERIC(18,0),
  amount NUMERIC(18,0),
  
  -- Metadata
  metadata JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

-- Tracks: "Food Jar balance changed from 5M to 4.5M due to spending"
```

---

## 12. Recommended UX Copywriting

### A. Terminology Overhaul
| Current | Recommended | Explanation |
|---------|---|---|
| "Allocate" | "Budget" | Clearer that it's planning, not moving |
| "Fund Jar" | "Set Monthly Target" | Explicit about the time period |
| "Jar Balance" | "Budget Remaining" | Emphasizes it's a quota, not real money |
| "Held in Savings" | "Allocated to Savings" | Clarifies it's virtual, not real |
| "Jar Review Queue" | "Allocation Review" | More descriptive |
| "Resolve" | "Allocate" | Clearer action |

### A. UI Copy Examples

#### Jar Card
```
❌ Current:
"Current Balance: 1.5M"
"Held in Cash: 500k"

✅ Recommended:
"Budget Remaining: 1.5M"
"Allocated to Cash: 500k"
"(This is your budget quota, not real money)"
```

#### Allocation Dialog
```
❌ Current:
"Fund Jar"
"Choose source assets"

✅ Recommended:
"Set Monthly Target"
"How much do you want to budget for this jar this month?"
"Fixed Amount: 5M VND"
"Or Percent of Income: 20%"
```

#### Overspend Warning
```
❌ Current:
(No warning)

✅ Recommended:
"⚠️ Budget Exceeded"
"You've spent 1.5M but only budgeted 1M for Food."
"Your budget is now -500k in the red."
"This will reduce next month's budget unless you reallocate."
```

#### Review Queue Item
```
❌ Current:
"expense_transaction · 2024-01-15"
"Total Amount: 500k"

✅ Recommended:
"Grocery Store Purchase"
"Date: Jan 15, 2024"
"Amount: 500k VND"
"Which jar should this come from?"
"Suggested: Food Jar (based on category)"
```

---

## 13. Recommended Validation Rules

### A. Allocation Validation
```typescript
// Rule 1: Can't allocate more than account balance
if (totalAllocations > accountBalance) {
  throw new Error("Total allocation exceeds account balance");
}

// Rule 2: Can't allocate negative amounts
if (allocation.amount < 0) {
  throw new Error("Allocation must be non-negative");
}

// Rule 3: Can't allocate to archived jar
if (jar.is_archived) {
  throw new Error("Cannot allocate to archived jar");
}

// Rule 4: Month must be valid
if (!isValidMonth(month)) {
  throw new Error("Invalid month format");
}
```

### B. Spending Validation
```typescript
// Rule 5: Can't spend more than jar balance (optional)
if (spendAmount > jarBalance && !allowOverspend) {
  throw new Error("Insufficient budget in jar");
}

// Rule 6: Can't spend negative amounts
if (spendAmount <= 0) {
  throw new Error("Spend amount must be positive");
}

// Rule 7: Can't spend from archived jar
if (jar.is_archived) {
  throw new Error("Cannot spend from archived jar");
}
```

### C. Correction Validation
```typescript
// Rule 8: Can't correct resolved allocations older than 30 days
if (daysSinceResolution > 30) {
  throw new Error("Cannot correct allocations older than 30 days");
}

// Rule 9: Must provide reason for correction
if (!correctionReason) {
  throw new Error("Correction reason is required");
}
```

### D. Multi-Currency Validation
```typescript
// Rule 10: All allocations in same currency
const currencies = allocations.map(a => a.currency);
if (new Set(currencies).size > 1) {
  throw new Error("Cannot allocate across multiple currencies");
}

// Rule 11: Currency must match household base currency
if (allocation.currency !== household.base_currency) {
  throw new Error("Allocation currency must match household currency");
}
```

---

## 14. Critical Risks

### Risk 1: Silent Over-Allocation (CRITICAL)
**Severity:** HIGH  
**Impact:** User thinks they have 5M budget, but account only has 2M  
**Likelihood:** HIGH (happens when income allocation exceeds account balance)  
**Mitigation:**
- Add real-time affordability check
- Show warning: "You're allocating 5M but only have 2M in account"
- Cap suggestions to available balance

### Risk 2: Negative Jar Balances (CRITICAL)
**Severity:** MEDIUM  
**Impact:** User overspends; jar balance goes negative; confusing  
**Likelihood:** HIGH (no prevention in place)  
**Mitigation:**
- Prevent overspending (hard block or soft warning)
- Show overspend indicator
- Implement "borrow from next month" feature

### Risk 3: Unresolved Queue = Stale State (HIGH)
**Severity:** MEDIUM  
**Impact:** User sees inconsistent balances; doesn't know what's pending  
**Likelihood:** MEDIUM (depends on user behavior)  
**Mitigation:**
- Show pending allocations in jar balance calculation
- Add "pending" badge to jar cards
- Auto-resolve high-confidence items

### Risk 4: Asset Value Mismatch (MEDIUM)
**Severity:** MEDIUM  
**Impact:** Jar shows 1M "held in investments" but stock is worth 800k  
**Likelihood:** MEDIUM (market volatility)  
**Mitigation:**
- Recalculate held_in_investments based on current asset prices
- Show "estimated value" vs "allocated amount"
- Add price update trigger

### Risk 5: Orphaned Movements (LOW)
**Severity:** LOW  
**Impact:** Jar balance includes deleted transactions  
**Likelihood:** LOW (requires user to delete transaction)  
**Mitigation:**
- Cascade delete jar_movements when transaction is deleted
- Or mark movements as "orphaned" instead of deleting

### Risk 6: Multi-Currency Silent Failure (MEDIUM)
**Severity:** MEDIUM  
**Impact:** User allocates USD to jar, but household is VND; amounts mismatch  
**Likelihood:** MEDIUM (if user has multiple accounts)  
**Mitigation:**
- Enforce single currency per allocation
- Add currency field to jar_movements
- Show currency in UI

---

## 15. Final Recommendation

### Summary
The current Jar Funding system has a **solid architectural foundation** (real/virtual separation) but suffers from **critical UX and validation gaps**:

1. **No overspend prevention** → Users can go negative
2. **No affordability check** → Users can over-allocate
3. **Confusing terminology** → Users think "budget" = "real money"
4. **Queue-based allocation** → Creates backlog and stale state
5. **Missing audit trail** → Can't trace corrections

### Recommended Approach

#### Phase 1 (Immediate): Safety Rails
- Add overspend prevention (hard block)
- Add affordability check (warning)
- Improve terminology (UI copy)
- Add overspend indicator (visual)

#### Phase 2 (Short-term): Better UX
- Implement allocation undo/correction
- Add allocation audit trail
- Show pending allocations in balance
- Auto-resolve high-confidence items

#### Phase 3 (Medium-term): Smart Allocation
- Move allocation to transaction time (not queue)
- Implement smart suggestions (ML-based)
- Add spending forecasting
- Implement envelope locking

#### Phase 4 (Long-term): Full Feature Parity
- Multi-currency support
- Rollover logic
- Spending analytics
- Mobile-first allocation UI

### Success Metrics
- ✅ Zero negative jar balances (after Phase 1)
- ✅ 90%+ queue resolution rate (after Phase 2)
- ✅ <5min average allocation time (after Phase 3)
- ✅ User satisfaction >4.5/5 (after Phase 4)

### Implementation Priority
1. **Overspend Prevention** (1-2 days)
2. **Affordability Check** (1-2 days)
3. **Terminology Overhaul** (2-3 days)
4. **Audit Trail** (3-5 days)
5. **Undo/Correction** (5-7 days)
6. **Smart Suggestions** (7-10 days)
7. **Transaction-Time Allocation** (10-14 days)

---

## Appendix: Code Examples

### A. Overspend Prevention
```typescript
export async function validateJarSpending(
  supabase: SupabaseClient,
  jarId: string,
  amount: number,
): Promise<{ allowed: boolean; reason?: string }> {
  const balance = await getJarBalance(supabase, jarId);
  
  if (amount > balance) {
    return {
      allowed: false,
      reason: `Insufficient budget. Jar has ${balance} but you're trying to spend ${amount}.`,
    };
  }
  
  return { allowed: true };
}
```

### B. Affordability Check
```typescript
export async function validateAllocationAffordability(
  supabase: SupabaseClient,
  householdId: string,
  allocations: Array<{ jarId: string; amount: number }>,
): Promise<{ affordable: boolean; warning?: string }> {
  const accountBalance = await getHouseholdBalance(supabase, householdId);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  
  if (totalAllocated > accountBalance) {
    return {
      affordable: false,
      warning: `You're allocating ${totalAllocated} but only have ${accountBalance} in accounts.`,
    };
  }
  
  return { affordable: true };
}
```

### C. Improved Terminology
```typescript
const translations = {
  "jar.action.allocate": "Set Monthly Target",
  "jar.action.fund": "Budget for This Jar",
  "jar.field.balance": "Budget Remaining",
  "jar.field.held_in_cash": "Allocated to Cash",
  "jar.field.held_in_savings": "Allocated to Savings",
  "jar.status.overspent": "Budget Exceeded",
  "jar.status.on_track": "On Track",
};
```
