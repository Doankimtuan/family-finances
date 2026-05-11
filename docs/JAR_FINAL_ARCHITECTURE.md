# Final Production-Ready Jar Budgeting Architecture

## 1. Executive Summary

The recommended long-term architecture is a **hybrid intent-based envelope budgeting system** with strict separation between real accounting and virtual budgeting.

The system should keep the strongest part of the current implementation: **assets/accounts/transactions remain the only source of real money truth**, while jars remain **virtual budget envelopes** powered by an immutable virtual ledger.

The final design should evolve the current v2 Jar Intent Layer into a production-grade system with:

- **Hybrid allocation:** high-confidence events auto-resolve; ambiguous events go to review
- **Single category assignment source of truth:** one category can map to only one jar
- **Immutable virtual ledger:** every budget change is traceable
- **Lazy month-end reconciliation:** no silent midnight money movement
- **Immutable monthly snapshots:** historical reports never mutate silently
- **Explicit correction model:** retroactive edits create correction events, not hidden rewrites

The most important architectural rule is:

> **A jar balance is not account balance. A jar movement is not bank movement. A jar transfer is budget intent movement only.**

This rule must be enforced in the schema, APIs, UX copy, reporting, and audit history.

---

## 2. Recommended Architecture

### Architecture Layers

```text
Real Money Layer
  accounts
  transactions
  assets
  liabilities
  savings/investments
        |
        | emits financial facts
        v
Budget Intent Layer
  jars
  jar_category_rules
  jar_month_plans
  jar_review_queue
  jar_movements
  jar_events
        |
        | materializes reporting state
        v
Reconciliation / Snapshot Layer
  jar_monthly_snapshots
  jar_month_close_runs
  jar_rule_change_events
        |
        v
UX / Reporting Layer
  command center
  review inbox
  month close wizard
  jar history
  category assignment matrix
```

### Core Principles

- **Real ledger is authoritative for real balances.**
- **Jar ledger is authoritative for budget balances.**
- **Snapshots are authoritative for closed-month reporting.**
- **Rules decide future behavior only.** They do not rewrite historical movements.
- **Automation must be visible.** Auto-resolved events still create events and appear in activity history.
- **Closed months are immutable.** Backdated edits become explicit correction events.

### Recommended Operating Model

| Area | Recommended Model |
|---|---|
| Jar funding | Virtual allocation only |
| Expense deduction | Auto-resolve if high confidence; otherwise review queue |
| Category mapping | One active jar per category |
| Rollover | User-approved lazy month close |
| Overspending | Explicit cover suggestions, not silent hidden coverage |
| Reporting | Snapshot-based for closed months |
| Corrections | Append-only correction movements |

---

## 3. Final Domain Model

### Real Money Domain

#### `Account`
Represents real cash location.

- Checking
- Cash
- Savings
- Credit account if later supported

**Invariant:** Account balances are derived from real transactions only.

#### `Transaction`
Represents real financial activity.

- Income
- Expense
- Transfer

**Invariant:** Transactions never directly change jar balances. They only emit budget-intent work.

#### `Asset`
Represents non-cash value.

- Gold
- Property
- Investments
- Other tracked holdings

**Invariant:** Asset price changes do not create or destroy jar budget unless explicitly reconciled.

---

### Budget Intent Domain

#### `Jar`
A virtual envelope for budgeting intent.

Fields:

- `id`
- `household_id`
- `name`
- `jar_type`
- `spend_policy`
- `is_archived`
- `deleted_at`
- display fields: `color`, `icon`, `sort_order`

**Invariant:** Jars do not hold real money.

#### `JarMonthPlan`
A monthly target or funding strategy.

Fields:

- `jar_id`
- `month`
- `fixed_amount`
- `income_percent`
- `priority`

**Invariant:** Plans are targets, not allocated money.

#### `JarCategoryRule`
The single source of truth for category-to-jar assignment.

- One expense category maps to one jar per household
- Used by both spending alerts and allocation engine
- Replaces legacy `spending_jar_category_map` and generic `jar_rules` for expense category mapping

**Invariant:** `UNIQUE (household_id, category_id)`.

#### `JarReviewItem`
A staged unresolved budget event.

Used when:

- no category mapping exists
- confidence is low
- transaction is uncategorized
- source event is complex
- rule conflict exists
- user approval is required

#### `JarMovement`
The immutable virtual budget ledger.

Represents:

- allocation into jar
- spending from jar
- virtual transfer between jars
- rollover carry-forward
- overspending coverage
- manual correction

**Invariant:** Movements are append-only.

#### `JarEvent`
A domain event log for explainability and activity history.

Examples:

- `allocation.auto_resolved`
- `allocation.review_created`
- `jar.transfer_created`
- `month_close.approved`
- `overspend.covered`
- `rule.changed`

#### `JarMonthlySnapshot`
Immutable closed-month reporting state.

Stores opening balance, inflows, outflows, transfers, rollover, closing balance, and correction metadata.

---

## 4. Ledger/Event Design

### Two Separate Ledgers

#### Real Ledger
Tables:

- `transactions`
- `accounts`
- `assets`
- `liabilities`

Purpose:

- net worth
- cash balances
- account reconciliation
- asset reporting

#### Virtual Budget Ledger
Tables:

- `jar_movements`
- `jar_events`
- `jar_monthly_snapshots`

Purpose:

- budget availability
- envelope history
- rollover
- allocation transparency

### Jar Movement Types

Recommended movement types:

```text
allocation_income
allocation_manual
expense_spend
jar_transfer_out
jar_transfer_in
rollover_carry_forward
rollover_sweep_out
rollover_sweep_in
overspend_cover_out
overspend_cover_in
correction_in
correction_out
snapshot_opening
```

### Movement Direction

Use explicit signed semantics while storing positive amount:

```text
amount > 0
balance_delta = -1 | 0 | 1
```

Examples:

| Movement | balance_delta | Effect |
|---|---:|---|
| Income allocated to jar | `1` | increases jar budget |
| Expense deducted from jar | `-1` | decreases jar budget |
| Transfer out | `-1` | decreases source jar |
| Transfer in | `1` | increases target jar |
| Metadata-only event | `0` | audit only |

### Event Idempotency

Every generated movement must have a deterministic idempotency key.

Recommended unique key:

```text
household_id + source_type + source_id + source_line_key
```

Examples:

```text
income_transaction:txn_123:food_allocation
expense_transaction:txn_456:auto_rule_v1
month_close:2026-04:cover_food_from_play
month_close:2026-04:sweep_play_to_vacation
```

### Activity History Requirement

Every auto-resolved movement must be visible in activity history.

Do not hide automation. Use copy such as:

```text
Automatically assigned Grocery expense to Food Jar based on your category rule.
```

---

## 5. Allocation Engine Design

### Hybrid Allocation Model

The final engine should use a **confidence-based resolver**.

```text
Financial Event
   ↓
Normalize event
   ↓
Find applicable rules
   ↓
Score confidence
   ↓
If high confidence → create movement + event automatically
If low confidence → create review queue item
```

### Auto-Resolve Criteria

Auto-resolve only when all conditions pass:

- transaction belongs to active household
- source event is not already processed
- transaction is not deleted/reversed
- transaction has valid category
- category maps to exactly one active jar
- jar is active and not archived
- currency is compatible
- movement would not violate hard validation rules
- rule confidence is high

### Manual Review Criteria

Create review item when:

- no category selected
- category has no jar mapping
- target jar archived
- amount exceeds available jar budget and strict mode is enabled
- transaction is split or complex
- transaction is backdated into closed month
- source type is unsupported
- user has disabled auto-resolve

### Income Allocation

Income allocation should use `jar_month_plans` but must not imply real money movement.

Recommended sequence:

1. Determine allocatable income event.
2. Calculate percent-based plans.
3. Fill fixed monthly targets by priority.
4. Check affordability against real available cash if strict mode is enabled.
5. Auto-resolve only if user opted into auto-income allocation.
6. Otherwise create review item with suggestions.

### Expense Allocation

Expense allocation should prioritize deterministic category rules.

```text
Expense transaction
  → category_id
  → jar_category_rules
  → target jar
  → create expense_spend movement
```

If rule is missing:

```text
Expense transaction
  → review queue
  → user assigns jar
  → option: save category rule for future
```

### Rule Priority Chain

Recommended precedence:

1. Explicit per-transaction jar override
2. Merchant/payee rule if later introduced
3. Category-to-jar rule
4. Household default catch-all jar
5. Manual review queue

---

## 6. Rollover Engine Design

### Do Not Use Silent Midnight Cron

A cron-only approach creates:

- timezone bugs
- duplicate execution risk
- user trust issues
- hidden adjustments
- load spikes

### Recommended Model: Lazy Month Close

When user enters a new month:

```text
Detect previous month is open
  → build month close proposal
  → show reconciliation UI
  → user approves
  → write movements + snapshot atomically
  → mark month closed
```

### Month Close Phases

#### Phase 1 — Finalize Current Month
Calculate:

- starting balance
- allocations
- spending
- manual adjustments
- current ending balance

#### Phase 2 — Overspending Coverage
For negative jars:

- suggest cover from configured source jar
- apply source priority
- never create hidden real-money movement
- never allow circular cover chains
- never make donor jar negative unless user explicitly allows borrowing mode

#### Phase 3 — Surplus Rollover
For positive jars:

- carry forward to same jar by default
- or sweep to configured target jar
- or move to unassigned buffer

#### Phase 4 — Snapshot and Seal
Create:

- `jar_movements` for coverage/sweep/carry
- `jar_events` for each generated action
- `jar_monthly_snapshots`
- `jar_month_close_runs`

Then mark month closed.

### Overspending Coverage Rules

Coverage must be explicit and bounded:

```text
negative jar deficit = 500k
source jar available = 300k
strict mode → partial cover 300k, remaining deficit 200k
```

Do not cascade infinitely. Use max depth of `1` unless user explicitly approves multi-source coverage.

---

## 7. Reporting Strategy

### Reporting Sources

| Report Type | Source |
|---|---|
| Current open month | `jar_movements` aggregate |
| Closed historical month | `jar_monthly_snapshots` |
| Activity feed | `jar_events` + real transactions |
| Cash/net worth | real ledger only |
| Budget availability | virtual ledger only |

### Never Mix Real and Virtual Balances

Do not show jar balances as account money.

Recommended copy:

```text
Budget remaining
Allocated budget
Virtual jar activity
```

Avoid:

```text
Money in jar
Cash in jar
Jar account balance
```

### Report Immutability

Closed month reports should be stable. If a backdated transaction is entered after month close:

- keep original closed snapshot
- create correction event in current open month
- optionally show historical report banner:

```text
This month has later corrections applied in May 2026.
```

---

## 8. Snapshot Strategy

### Required Tables

- `jar_monthly_snapshots`
- `jar_month_close_runs`
- `jar_snapshot_corrections`

### Snapshot Contents

Each jar/month snapshot should include:

- opening balance
- planned amount
- income allocation
- manual allocation
- expense outflow
- transfer in
- transfer out
- rollover in
- rollover out
- overspend cover in
- overspend cover out
- correction amount
- closing balance before rollover
- closing balance after rollover
- closed_at
- closed_by
- source month close run

### Closed Month Rule

After snapshot close:

- no movement dated inside the closed month may be inserted except by correction workflow
- correction workflow must append a current-period correction movement
- original source transaction can still be edited, but budget effect is represented separately

---

## 9. Validation Architecture

Use layered validation.

### Layer 1 — Database Constraints

- non-negative movement amount
- valid `balance_delta`
- one active category rule per category
- no movement against deleted jar
- unique idempotency key
- FK household boundaries

### Layer 2 — Server Domain Services

Validate:

- jar active state
- month open/closed state
- category kind is `expense`
- rule conflict
- currency compatibility
- overspending policy
- rollback/correction eligibility

### Layer 3 — Client UX Validation

Validate early for speed:

- missing fields
- negative amount
- invalid month
- duplicate category selection
- disabled archived jars

Client validation is never authoritative.

### Policy Modes

Support household-level policies:

```text
overspend_policy = warn | block | allow_negative
income_auto_allocate = off | suggest | auto_high_confidence
expense_auto_allocate = off | auto_mapped_only
month_close_mode = manual | assisted
```

---

## 10. API Architecture

### Server Actions

Recommended server actions:

```typescript
createJarAction
updateJarAction
archiveJarAction
upsertJarMonthPlanAction
upsertJarCategoryRuleAction
bulkUpsertJarCategoryRulesAction
resolveJarReviewItemAction
createManualJarMovementAction
previewMonthCloseAction
approveMonthCloseAction
createJarTransferAction
createJarCorrectionAction
```

### Domain Services

Move business logic out of UI actions into services:

```text
lib/jars/domain/allocation-engine.ts
lib/jars/domain/rollover-engine.ts
lib/jars/domain/rule-engine.ts
lib/jars/domain/snapshot-engine.ts
lib/jars/domain/validation.ts
lib/jars/domain/events.ts
```

Server actions should only:

1. authenticate household context
2. parse input
3. call domain service
4. revalidate paths
5. return result

### RPC / Query APIs

Use database RPCs for heavy reporting:

```sql
rpc_jar_current_balances(household_id)
rpc_jar_month_summary(household_id, month)
rpc_jar_command_center(household_id, month)
rpc_jar_month_close_preview(household_id, month)
```

---

## 11. Frontend State Architecture

### Principles

- Server is source of truth
- Client state is local form/edit state only
- Optimistic updates allowed for low-risk mappings
- Ledger mutations must confirm with server

### React Hook Form Usage

Use RHF for:

- jar creation
- month plan form
- bulk category assignment
- manual review resolution
- month close approval

Use `RHFMoneyInput` for all money fields.

### Recommended Components

```text
JarCommandCenter
JarBalanceCard
JarReviewInbox
JarReviewItemCard
JarCategoryAssignmentMatrix
JarMonthCloseWizard
JarMovementTimeline
JarTransferDialog
JarCorrectionDialog
```

### State Patterns

- URL state for selected month
- local component state for edit mode
- server action result for mutation feedback
- optimistic state for category assignment matrix only
- no client-calculated authoritative balances

---

## 12. Database Schema Recommendation

### Consolidated Category Rule Table

```sql
CREATE TABLE public.jar_category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jar_id uuid NOT NULL REFERENCES public.jars(id) ON DELETE RESTRICT,
  assignment_type text NOT NULL DEFAULT 'manual',
  confidence text NOT NULL DEFAULT 'high',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, category_id)
);
```

### Enhanced Movement Table

```sql
ALTER TABLE public.jar_movements
ADD COLUMN IF NOT EXISTS movement_type text,
ADD COLUMN IF NOT EXISTS idempotency_key text,
ADD COLUMN IF NOT EXISTS month date,
ADD COLUMN IF NOT EXISTS reversed_by uuid,
ADD COLUMN IF NOT EXISTS reversal_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS jar_movements_idempotency_key_idx
ON public.jar_movements(household_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
```

### Event Log

```sql
CREATE TABLE public.jar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id uuid REFERENCES public.jars(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  source_type text,
  source_id text,
  idempotency_key text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (household_id, idempotency_key)
);
```

### Monthly Snapshots

```sql
CREATE TABLE public.jar_monthly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  jar_id uuid NOT NULL REFERENCES public.jars(id) ON DELETE RESTRICT,
  month date NOT NULL,
  opening_balance numeric(18,0) NOT NULL DEFAULT 0,
  planned_amount numeric(18,0) NOT NULL DEFAULT 0,
  allocated_amount numeric(18,0) NOT NULL DEFAULT 0,
  spent_amount numeric(18,0) NOT NULL DEFAULT 0,
  transfer_in_amount numeric(18,0) NOT NULL DEFAULT 0,
  transfer_out_amount numeric(18,0) NOT NULL DEFAULT 0,
  rollover_in_amount numeric(18,0) NOT NULL DEFAULT 0,
  rollover_out_amount numeric(18,0) NOT NULL DEFAULT 0,
  overspend_cover_in_amount numeric(18,0) NOT NULL DEFAULT 0,
  overspend_cover_out_amount numeric(18,0) NOT NULL DEFAULT 0,
  correction_amount numeric(18,0) NOT NULL DEFAULT 0,
  closing_balance numeric(18,0) NOT NULL DEFAULT 0,
  closed_at timestamptz NOT NULL,
  closed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  UNIQUE (household_id, jar_id, month)
);
```

### Month Close Runs

```sql
CREATE TABLE public.jar_month_close_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  month date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  preview_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, month)
);
```

---

## 13. Concurrency Strategy

### Idempotent Processing

Every event handler must be safely retryable.

Required keys:

```text
transaction_id + handler_name + version
review_id + allocation_line_key
month + rule_id + phase
```

### Transaction Boundaries

Operations that must be atomic:

- resolving review item and creating movements
- auto-resolving expense transaction
- approving month close
- creating transfer pair
- creating reversal pair

### Locking Strategy

Use logical locks for month close:

```text
jar_month_close_runs UNIQUE (household_id, month)
status = draft | processing | approved | failed
```

Only one close run can be active per household/month.

### Conflict Handling

If two users edit the same category mapping:

- latest write wins only if updated version matches
- otherwise return conflict
- UI prompts reload

---

## 14. Sync/Offline Strategy

### Offline Principles

- Allow offline transaction drafts
- Do not finalize jar movements offline unless deterministic and locally validated
- Sync creates pending review if confidence cannot be guaranteed

### Client Mutation Queue

Offline-capable mutations need:

- client-generated UUID
- idempotency key
- created_at client timestamp
- server accepted timestamp
- conflict result state

### Conflict Policy

| Conflict | Resolution |
|---|---|
| category rule changed while offline | server wins; transaction goes to review |
| jar archived while offline | movement rejected; create review item |
| month closed while offline | create current-month correction |
| duplicate transaction | idempotency prevents duplicate movement |

---

## 15. Migration Plan

### Phase 1 — Stabilize Existing v2

- Add idempotency keys to `jar_movements`
- Add `movement_type`
- Add `jar_events`
- Start writing events for all new movements

### Phase 2 — Consolidate Category Mapping

- Create `jar_category_rules`
- Migrate active `jar_rules` expense mappings
- Migrate `spending_jar_category_map` only where no v2 rule exists
- Update allocation engine and activity alerts to use `jar_category_rules`
- Mark old tables read-only

### Phase 3 — Hybrid Allocation

- Implement auto-resolve for high-confidence category mappings
- Keep review queue for ambiguous items
- Add event log entries for auto-resolved movements
- Add UI filters: `auto-resolved`, `needs review`, `failed`

### Phase 4 — Month Close and Snapshots

- Create snapshot tables
- Build month close preview service
- Build approval workflow
- Start using snapshots for closed-month reports

### Phase 5 — Retire Legacy Tables

- Remove UI references to `jar_definitions`
- Remove `jar_ledger_entries` dependencies
- Remove `spending_jar_category_map` once reporting is verified

---

## 16. Scalability Plan

### Query Strategy

- Use snapshots for closed months
- Use aggregate views only for current/open month
- Avoid generating month series on every request
- Precompute command center summary via RPC

### Indexes

Recommended indexes:

```sql
CREATE INDEX jar_movements_household_month_idx
ON public.jar_movements(household_id, month);

CREATE INDEX jar_movements_jar_month_idx
ON public.jar_movements(jar_id, month);

CREATE INDEX jar_review_queue_pending_idx
ON public.jar_review_queue(household_id, status, movement_date);

CREATE INDEX jar_category_rules_lookup_idx
ON public.jar_category_rules(household_id, category_id);
```

### Data Growth

For high-volume households:

- archive resolved review items after snapshot closure
- keep event log but paginate aggressively
- partition `jar_events` by month if needed later
- materialize monthly summaries

---

## 17. Security/Data Integrity Plan

### RLS

Every table must scope by `household_id`.

Rules:

- household members can read household jar data
- only authorized members can mutate rules/plans/movements
- closed snapshots are read-only except admin correction workflow

### Immutability

Do not physically delete ledger rows.

Use:

- `reversed_by`
- `reversal_reason`
- `deleted_at` for soft delete of non-ledger entities
- append-only corrections

### Auditability

Every important action writes `jar_events`:

- rule changes
- auto allocation
- manual allocation
- month close approval
- snapshot correction
- jar archive

---

## 18. UX Principles

### Language

Use:

- Budget remaining
- Allocated budget
- Move budget
- Review allocation
- Month-end reconciliation

Avoid:

- Money in jar
- Transfer money to jar
- Fund jar from account
- Jar account balance

### Transparency

Automation must always answer:

- What happened?
- Why did it happen?
- Which rule caused it?
- Can I undo or correct it?

### Mobile-First

- Bottom-sheet pickers for category/jar assignment
- Review inbox cards
- One-tap approve for high-confidence suggestions
- Searchable category assignment matrix

---

## 19. Recommended Libraries/Patterns

### Frontend

- React Hook Form for forms
- Zod schemas shared between client/server where practical
- `RHFMoneyInput` for money fields
- Server Actions for mutations
- URL params for selected month
- Optimistic updates only for category assignment

### Backend Patterns

- Domain service layer
- Event-sourced virtual ledger
- Idempotent command handlers
- Snapshot-based reporting
- Explicit correction workflows

### Database Patterns

- unique idempotency keys
- immutable ledger rows
- soft archive for domain entities
- DB constraints for financial invariants
- RPC for heavy aggregations

---

## 20. Critical Risks

### Risk 1 — Hidden Money Duplication
If UX or reporting implies jar funds are real balances, users will misunderstand net worth.

**Mitigation:** strict copywriting, separate reports, no account-like jar terminology.

### Risk 2 — Dual Mapping Divergence
Current v1/v2 category mapping split can produce inconsistent allocation and alert behavior.

**Mitigation:** consolidate immediately into `jar_category_rules`.

### Risk 3 — Silent Automation Loss of Trust
Auto-covering or auto-rolling without user visibility will make users think the app changed balances incorrectly.

**Mitigation:** assisted month close with approval and event history.

### Risk 4 — Mutable Historical Reports
Backdated edits can mutate old reports if reports are always live aggregates.

**Mitigation:** immutable snapshots and correction events.

### Risk 5 — Queue Fatigue
A fully manual review queue will be abandoned.

**Mitigation:** hybrid auto-resolve for high-confidence events.

### Risk 6 — Race Conditions
Duplicate sync or concurrent users can create duplicate movements.

**Mitigation:** idempotency keys, unique constraints, transaction boundaries.

---

## 21. Final Recommendation

Build the jar system as a **hybrid event-sourced virtual budgeting layer** on top of the real accounting ledger.

The final direction should be:

1. **Keep jars virtual.** Never let jar operations mutate account balances.
2. **Consolidate category mapping.** One authoritative `jar_category_rules` table.
3. **Use hybrid allocation.** Auto-resolve high-confidence events; queue only ambiguous events.
4. **Make movements immutable.** Correct through reversal/correction, never destructive edits.
5. **Close months explicitly.** Lazy, user-approved month-end reconciliation.
6. **Report from snapshots.** Closed-month reports must be stable and auditable.
7. **Expose automation.** Every automatic action must be visible, explainable, and reversible.

This architecture preserves fintech-grade accounting correctness while making the budgeting experience practical for everyday household use. It avoids hidden money creation, prevents duplicated balances, supports long-term reporting, and gives the system a maintainable path from the current v2 intent layer to a production-ready budgeting platform.
