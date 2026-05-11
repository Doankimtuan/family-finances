# Category ↔ Jar Assignment System: Architecture Review

## 1. Current Mapping Logic

### Two Parallel Mapping Systems (Confirmed from Code)

The codebase maintains **two separate category→jar mapping tables simultaneously**, which is a major source of fragility:

#### System A — `spending_jar_category_map` (v1, Legacy)
- **Table:** `spending_jar_category_map` (migration `00034`)
- **Purpose:** Maps an expense `category_id` to a `jar_id` from `jar_definitions`
- **Constraint:** `UNIQUE (household_id, category_id)` → strict 1-to-1
- **UI:** `updateSpendingJarCategoryMapAction()` — single select via `formData`
- **Fallback:** `ensureSpendingJarCategoryMapping()` auto-assigns unmapped categories to a system `"unassigned"` jar
- **Used by:** `getSpendingJarWarningForCategory()` in the Activity module for spending alerts

#### System B — `jar_rules` (v2, Intent Layer)
- **Table:** `jar_rules` (migration `00040`)
- **Purpose:** Maps `category_id` → `jar_id` (rule_type: `expense_category`) with priority and confidence levels
- **Constraint:** No `UNIQUE` on `(household_id, category_id)` — multiple rules can exist per category
- **UI:** `JarSetupRuleForm` — single `<select>` for category + single `<select>` for jar
- **Action:** `upsertExpenseRuleAction()` → first deactivates all existing rules for that category, then inserts a new one
- **Used by:** `getExpenseRuleJarId()` → `syncTransactionToJarIntent()` → auto-allocates expenses at transaction time

### Current Effective Behavior
- A category is resolved to at most 1 active jar (enforced via deactivation in v2)
- Unmapped categories fall into the `"unassigned"` fallback jar (v1) or queue for manual review (v2)
- **v1 and v2 are entirely independent** — changing a mapping in v2 does NOT update v1, and vice versa

---

## 2. Current UX Problems

### A. Two Separate UIs for the Same Conceptual Task
| Context | Page | Table Updated |
|---------|------|--------------|
| Spending Alerts | `/activity` (auto-triggered) | `spending_jar_category_map` |
| Jar Rule Setup | `/jars/setup#rules` | `jar_rules` |

The user cannot see both mappings on one screen. If they configure a rule in `/jars/setup`, the spending alerts in `/activity` still use the stale v1 mapping. This is a **silent divergence** the user has no visibility into.

### B. Single-Select Dropdown is the Entire UX
- Current form: one `<select>` for category + one `<select>` for jar + Save
- If there are 40 categories, user must submit 40 separate forms
- Zero batch editing support
- No visual indicator of which categories are currently mapped vs. unmapped

### C. Unmapped State is Invisible
- In `setup/page.tsx`, the table shows all categories with their current jar or the text `"Unmapped"`
- But "Unmapped" is rendered in italic grey — lowest visual weight — making it easy to miss
- There is no filter for "Show only unmapped" to prioritize setup

### D. No Conflict Visibility
- When `upsertExpenseRuleAction()` fires, it silently deactivates the old rule for that category
- The user cannot see history: "This category used to point to Jar A, now it points to Jar B"
- There is no audit trail shown in the UI for rule changes

### E. No Onboarding Guidance
- New users land on `/jars/setup` with zero categories mapped
- There is no wizard or suggested auto-mapping based on category names
- The preset jar bootstrap creates 6 jars but leaves all categories unmapped

---

## 3. Domain Logic Review

### A. Is Strict 1-to-1 Mapping Correct?

**Yes, for auto-allocation.** The core use case is: "When user spends on 'Groceries', automatically deduct from the 'Food' jar." For this, a deterministic single assignment is required. If Groceries mapped to both Food and Play, the system would need another decision rule to split it.

**However, 1-to-1 at the expense category level is the wrong granularity for complex households.**

Example: "Restaurants" category could legitimately belong to:
- `Necessities` for weekday lunch (50%)
- `Play` for weekend dining (50%)

The current model cannot represent this. The v2 `jar_rules` table supports `priority` and `confidence` fields, suggesting an intention to support more sophisticated rule matching — but this is never surfaced in the UI.

### B. Missing Fallback Priority Chain
The current fallback chain is:
```
category → jar_rule (v2) → OR → unassigned jar (v1 fallback)
```
There is no explicit rule priority resolution. The `jar_rules` table has a `priority` integer column, but `getExpenseRuleJarId()` only selects the top 1 ordered by priority — it does not cascade or combine rules.

### C. Shared/System Categories
Categories with `household_id IS NULL` are system-level categories shared across all households. The mapping tables use `household_id` to scope rules, which means:
- A system category (e.g., "Rent") can be mapped to Jar A in Household 1 and Jar B in Household 2 — ✅ correct
- But both tables allow this already — ✅ no structural conflict

---

## 4. UX Risks

### A. Silent Remapping
When a user saves a new rule for a category that already has a rule, the old rule is silently deactivated. There is:
- No confirmation dialog: "This will replace the existing 'Groceries → Necessities' rule"
- No undo
- No notification

### B. Confused State After Archive
If a user archives a jar that has category rules pointing to it:
- `jar_rules` has `ON DELETE CASCADE` on `jar_id`, so rules are deleted silently
- Affected categories revert to "unmapped"
- Transactions for those categories now queue for manual review
- **User has no idea why the review queue suddenly grew**

### C. Planned Multi-Select Creates New Risks
The planned improvement (multi-select UI where categories already assigned elsewhere cannot be selected) introduces several UX problems:
- If 35 out of 40 categories are mapped, only 5 appear in the selector — no feedback on *why* the others are missing
- User cannot see or change existing assignments from this UI, only add new ones
- Creates "ghost" categories: assigned but not visible in the current picker

### D. Mobile UX
Current form: a three-column grid (`1fr 1fr auto`) that collapses on mobile
- On small screens, both selects stack vertically, which is acceptable
- But with 40+ category options, the native `<select>` is unusable on mobile (tiny tap targets, no search)
- No mobile-optimized bottom sheet or typeahead search

---

## 5. Missing Edge Cases

### A. Deleting a Jar with Active Rules
- `jar_rules` uses `ON DELETE CASCADE` → rules auto-deleted silently ✅ (functional but not UX-visible)
- `spending_jar_category_map` uses `ON DELETE CASCADE` too → v1 mappings also silently deleted

### B. Moving/Renaming a Category
- Renaming a category has no effect on mappings (FK is UUID-based) ✅
- But if an admin "reclassifies" a category from `expense` to `income`, the mapping remains pointing to a jar via an expense-only constraint
- Server action validates `kind === 'expense'` on write, but stale mappings for reclassified categories are never cleaned up

### C. Archived Categories
- `categories` table has `is_active` boolean
- `jar_rules` and `spending_jar_category_map` have no filter for `is_active`
- Inactive/archived categories will still appear in the setup table and still resolve to jars
- Transactions categorized under an archived category still auto-allocate — probably intentional, but undocumented

### D. Uncategorized Transactions
- `transaction.category_id` is nullable
- `getExpenseRuleJarId()` returns `null` when `categoryId` is null → queues for review ✅
- `ensureSpendingJarCategoryMapping()` receives `null` → short-circuits ✅
- But there is no explicit "catch-all" rule for null-category expenses

### E. Historical Transaction Consistency
- If user changes category rule from `Groceries → Necessities` to `Groceries → Play`:
  - Past `jar_movements` already allocated to Necessities are **unchanged**
  - Future Groceries expenses go to Play
  - Historical reports show Groceries split across two jars — no indication of *why*

---

## 6. Scalability Risks

### A. Full Category List in Single Select
- Setup page fetches ALL expense categories (system + household) into a `<select>`
- Vietnamese households commonly have 30–60+ expense categories
- A native `<select>` with 60 options is essentially unusable
- No pagination, no search, no virtual scroll

### B. Flat Rule Table = O(N) Scan per Transaction
- `getExpenseRuleJarId()` queries: `WHERE household_id = X AND rule_type = 'expense_category' AND category_id = Y AND is_active = true`
- Index: `idx_jar_rules_category` on `(household_id, category_id)` → ✅ fast
- But with multiple deactivated rules accumulating over time (every `upsertExpenseRuleAction` adds a new row), the table grows unboundedly
- No periodic cleanup of `is_active = false` rows

### C. Dual-System Maintenance Cost
- Every future change to the category model must be tested against both `spending_jar_category_map` (v1) and `jar_rules` (v2)
- Two separate cleanup strategies required for archived jars/categories
- Two separate RLS policies

---

## 7. Benchmark Comparison

### YNAB
- **Model:** 1-to-1 strict assignment. Every transaction category points to exactly one budget category (envelope).
- **UX:** Assignment happens *at transaction time*. When entering a transaction, you pick the payee and the category simultaneously. No separate mapping setup screen.
- **Remapping:** Changing a category's envelope applies only to *future* transactions. Past entries stay in old envelope.
- **Advantage:** Feels natural because it maps how people think about spending.

### Monarch Money
- **Model:** ML-based category suggestions + user-confirmed assignments
- **UX:** Smart defaults inferred from merchant name and payee history; user can override per-transaction
- **Remapping:** "Apply to all past transactions" option — explicit, warned, reversible
- **Advantage:** Low setup burden; intelligent defaults

### Copilot
- **Model:** Similar to Monarch — ML-powered category assignment
- **UX:** "Rules" UI where user trains the system: "Always categorize 'Starbucks' as Coffee"
- **Remapping:** Per-rule editing with explicit retroactive toggle
- **Advantage:** Feels like teaching a smart assistant

### Actual Budget
- **Model:** Strict 1-to-1, but at the *budget category* level, not the *transaction category* level
- **UX:** Transaction categories are a flat list; budget categories (envelopes) are separate. User maps one to the other.
- **Remapping:** Manual, no automation
- **Advantage:** Maximum control and auditability

### Goodbudget
- **Model:** Envelopes are the categories. No separate category taxonomy.
- **UX:** When entering a transaction, you pick the envelope directly.
- **Advantage:** No mapping problem because there's only one concept.

### Key Insight from Benchmarks
> The best systems avoid the "category → jar mapping" problem entirely by **collapsing transaction categories and budget envelopes into a single concept** (Goodbudget) or by making assignment happen **at transaction time with smart defaults** (YNAB, Monarch, Copilot).
> 
> Having a separate "setup" screen for category→jar rules is a signal that the two layers are poorly integrated.

---

## 8. Recommended UX Architecture

### A. Replace the Rule Setup Page with an Inline Assignment Model

Instead of a separate `/jars/setup#rules` page, surface the category→jar assignment **in context**:

**Option 1 — Jar Detail Page (Jar-centric)**
On each Jar's detail page, show a "Categories in this Jar" panel. User can add/remove categories from within the jar view.

**Option 2 — Category Management Page (Category-centric)**
On the categories page, add a "Jar" column. Each category has an inline select for its jar.

**Option 3 — Transaction Entry (Transaction-centric)**
On the "Add Transaction" form, after selecting a category, show "Which jar?" if unmapped. Save the rule for future transactions.

**Recommendation: Option 3 as primary + Option 1 as overview.**
This aligns with YNAB's model: users learn the mapping by doing, not by a configuration screen.

### B. Replace the Single-Select Form with a Bulk Mapping Matrix

For the setup/overview page, replace the current form (one rule at a time) with an **assignment matrix**:

```
┌─────────────────────────┬──────────────────────────────────┐
│ Category                 │ Jar Assignment                   │
├─────────────────────────┼──────────────────────────────────┤
│ Groceries                │ [● Necessities       ▼]         │
│ Restaurants              │ [● Play               ▼]         │
│ Tuition                  │ [● Education          ▼]         │
│ Fuel                     │ [  Unassigned         ▼] ⚠       │
└─────────────────────────┴──────────────────────────────────┘
```

- Inline select per row
- Save on-change (optimistic update)
- ⚠ Warning icon for unmapped categories
- "Filter: Unmapped only" toggle at top

---

## 9. Recommended Domain Model

### Eliminate the Dual-System Problem

**Consolidate `spending_jar_category_map` (v1) and `jar_rules` (v2) into a single table.**

```sql
CREATE TABLE jar_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES jars(id) ON DELETE CASCADE,

  -- Assignment metadata
  assignment_type TEXT NOT NULL DEFAULT 'manual',
  -- 'manual' | 'suggested' | 'auto_inferred'

  -- Priority for future multi-rule support (currently enforced as 1-active-per-category)
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT jar_category_rules_unique UNIQUE (household_id, category_id)
  -- Enforces strict 1-to-1 at the DB level
);
```

**Key differences from current `jar_rules`:**
- Enforced at DB level with a UNIQUE constraint (not by app-level deactivation)
- Single source of truth for BOTH spending alerts and auto-allocation
- `assignment_type` tracks how the rule was created (user manually set vs. suggested by system)

---

## 10. Recommended Validation Rules

```typescript
// Rule 1: Only expense categories can be mapped
if (category.kind !== 'expense') {
  throw new Error("Only expense categories can be assigned to jars.");
}

// Rule 2: Target jar must not be archived
if (jar.is_archived) {
  throw new Error("Cannot assign categories to an archived jar.");
}

// Rule 3: On jar archive, move all mapped categories to Unassigned
// (not silent delete — explicit reassignment)
async function onJarArchived(jarId: string) {
  const unassigned = await getOrCreateUnassignedJar(householdId);
  await supabase.from('jar_category_rules')
    .update({ jar_id: unassigned.id })
    .eq('jar_id', jarId);
}

// Rule 4: Changing a mapping should not retroactively alter past movements
// (movements are immutable; only future transactions use the new rule)

// Rule 5: Warn if reassigning a high-traffic category
const transactionCount = await getMonthlyTransactionCount(categoryId);
if (transactionCount > 10) {
  return { warning: `This category has ${transactionCount} transactions this month. Changing its jar only affects future transactions.` };
}
```

---

## 11. Recommended State Management

### Optimistic Updates for Inline Assignment
Since assignment changes are low-risk and reversible, use optimistic updates:

```typescript
// Client state
const [assignments, setAssignments] = useState<Map<string, string>>(initialMap);

async function handleAssignmentChange(categoryId: string, jarId: string) {
  // Optimistic update immediately
  setAssignments(prev => new Map(prev).set(categoryId, jarId));

  try {
    await updateCategoryJarRule(categoryId, jarId);
  } catch (error) {
    // Rollback on failure
    setAssignments(prev => new Map(prev).set(categoryId, previousJarId));
    toast.error("Failed to save rule. Please try again.");
  }
}
```

### Server-Side Cache Invalidation
When a category rule changes, invalidate:
- `/jars/*` — jar balance views may show different spending attribution
- `/activity` — spending alerts use the mapping
- `/dashboard` — summary cards reflect category-level spending

---

## 12. Recommended Mobile UX

### Replace Native `<select>` with a Bottom Sheet Picker

For category selection on mobile:

```
┌───────────────────────────────────┐
│ Assign "Groceries" to a Jar        │
├───────────────────────────────────┤
│ 🔍 Search jars...                  │
├───────────────────────────────────┤
│ ● Necessities          (current)   │
│   Play                             │
│   Education                        │
│   Long-Term Savings                │
│   Financial Freedom                │
│   Give                             │
└───────────────────────────────────┘
```

- Triggered by tapping the jar badge on a category row
- Full-height drawer with search
- Current assignment highlighted
- One-tap to change

### Category List as Swipeable Cards (Optional)
For the setup flow, allow swipe-to-assign: swipe a category card left/right to cycle through jars — fast for power users.

---

## 13. Recommended Accessibility Improvements

- **Label association:** Every `<select>` must have an explicit `<label htmlFor="...">`. Current `RHFSelect` component should be verified.
- **Error announcements:** Validation errors must be announced via `aria-live="polite"`.
- **Keyboard navigation:** The assignment matrix must be fully keyboard-navigable (Tab to each row, Enter/Space to open picker, Escape to close).
- **Color contrast:** "Unmapped" italic grey text (currently `text-slate-400`) fails WCAG AA contrast ratio. Use at least `text-slate-500`.
- **Focus management:** After saving a rule inline, return focus to the row that was edited, not to the page top.
- **Screen reader labels:** Jar color dots (`<span style="background-color: ...">`) need `aria-label` or `role="presentation"`.

---

## 14. Critical Risks

### Risk 1: Dual-System Divergence (CRITICAL)
**Problem:** v1 (`spending_jar_category_map`) and v2 (`jar_rules`) are independent. A change in one does not affect the other.  
**Impact:** Spending alerts show Jar A, but auto-allocation uses Jar B for the same category. User sees inconsistent data with no explanation.  
**Mitigation:** Immediately consolidate into one table (see §9). Migrate existing data with a one-time script.

### Risk 2: Silent Category Remapping (HIGH)
**Problem:** `upsertExpenseRuleAction` deactivates old rules without confirmation.  
**Impact:** User accidentally remaps a category; all future transactions go to the wrong jar. No undo, no audit trail in UI.  
**Mitigation:** Add confirmation dialog + soft-delete with visible history in UI.

### Risk 3: Archive Cascade Silently Breaks Rules (HIGH)
**Problem:** Archiving a jar deletes all `jar_rules` for it silently (cascade).  
**Impact:** Previously auto-allocated categories now queue for manual review; user doesn't know why the queue grew.  
**Mitigation:** On jar archive, reassign categories to "Unassigned" instead of cascade delete. Show warning: "Archiving will reassign 5 categories to Unassigned."

### Risk 4: Planned Multi-Select Has No "Why Disabled" Feedback (MEDIUM)
**Problem:** If already-assigned categories are excluded from the multi-select, user has no way to know or change them.  
**Mitigation:** Show all categories in the picker. Already-assigned ones show their current jar inline. Allow reassignment in the same flow.

---

## 15. Final Recommendation

### Immediate Priority

1. **Consolidate the dual-system.** Retire `spending_jar_category_map` and migrate all data to a single `jar_category_rules` table used by both the spending alerts and the auto-allocation engine. This is the single highest-leverage fix.

2. **Do not implement multi-select.** The planned multi-select (where already-assigned categories are disabled) solves the wrong problem and introduces new UX confusion. Instead, build an **inline assignment matrix** where every category is visible with its current assignment shown in-place.

3. **Add reassignment safeguards:** Require confirmation when remapping categories with recent transactions, and show a one-line summary of the old rule being replaced.

### Near-Term

4. **Integrate assignment into the transaction entry flow.** When a user adds an expense with an unmapped category, prompt: "Which jar is this for? Save as default for this category?" — this is the highest-discoverability moment.

5. **Replace native select with a searchable component on mobile.** A combobox/bottom-sheet picker with search eliminates the 40+ options problem entirely.

### Architectural

6. **Implement a rule versioning / audit log.** Every assignment change should record the previous jar, the new jar, and the timestamp. Surface this in the UI as a simple changelog.

7. **Design toward the YNAB model.** Ultimately, the goal is to make jar assignment feel like a natural part of categorizing a transaction, not a separate configuration task. The architecture should trend toward: category = jar by default, override at transaction level if needed.
