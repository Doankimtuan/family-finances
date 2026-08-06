# Technical Specification v2.1 — ViNha Household Money Operating System

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Technical Data Models & Schema Contracts

The technical schema reflects all Business Model v2 requirements, incorporating immutable audit links, typed Inbox schemas, emergency flags, and N:1 Category-Jar mapping contracts.

### 1.1 `Transaction` Entity Schema
```typescript
interface Transaction {
  id: string; // UUID v4
  household_id: string;
  account_id: string;
  amount: number; // Signed decimal (+ for income/credit, - for expense/debit)
  currency: string;
  payee: string;
  category_id: string; // References Category
  jar_id: string; // References Jar (via BR-12 contract)
  status: 'PendingMapping' | 'Posted' | 'PartiallyRefunded' | 'FullyRefunded' | 'Reversed';
  reverses_transaction_id?: string | null; // For Refunds & Reversals (BR-02, BR-03)
  corrects_transaction_id?: string | null; // For Corrections (BR-03)
  source: 'manual' | 'bank_feed' | 'recurring_pattern';
  pattern_id?: string | null;
  posted_at: string; // ISO 8601 UTC timestamp
  created_at: string;
}
```

---

### 1.2 `ReviewItem` Entity Schema
```typescript
type ReviewItemType = 
  | 'UnmappedExpense' 
  | 'MaturityDecision' 
  | 'PaymentReminder' 
  | 'InstallmentComplete' 
  | 'EmergencyDeclaration';

interface ReviewItem<T = Record<string, unknown>> {
  id: string;
  household_id: string;
  type: ReviewItemType; // Strongly-typed discriminator (EVO-02)
  payload: T;
  status: 'Queued' | 'Resolved' | 'AutoResolved' | 'Expired' | 'Archived';
  auto_resolved: boolean;
  confidence_score?: number;
  created_at: string;
  expires_at?: string | null; // For PaymentReminder expiration (BR-15)
}
```

---

### 1.3 `PlanMovement` Entity Schema
```typescript
interface PlanMovement {
  id: string;
  household_id: string;
  source_jar_id: string;
  target_jar_id: string;
  amount: number; // Virtual capacity transferred ($0.00 ledger impact)
  is_emergency: boolean; // Emergency declaration flag (EVO-06)
  intent_note?: string | null;
  executed_by_user_id: string;
  created_at: string;
}
```

---

## 2. Temporal Background Workers

### 2.1 Month Ritual 30-Day Auto-Lock Worker
- **Schedule**: Executes daily at 01:00 UTC.
- **Query**: Selects all `MonthRitual` records where status $\in \{\text{'Draft'}, \text{'InReview'}\}$ and `month_end_date` $\le (\text{CurrentDate} - 30\text{ days})$.
- **Action**:
  1. Auto-resolves any remaining `UnmappedExpense` ReviewItems for that month to the Miscellaneous Jar.
  2. Updates `MonthRitual` status to `PendingReview`.
  3. Locks all `Jar` allocations and `Category` mappings for that calendar month.

---

### 2.2 Inbox Staleness & Expiration Worker
- **Schedule**: Executes hourly.
- **Query**: Selects active `ReviewItem` records where `status = 'Queued'` and `expires_at` $\le \text{CurrentDate}$.
- **Action**: Updates status to `Expired` and moves item to Archived tab.

---

## 3. Core API Endpoint Contracts

- `POST /api/v2/transactions/refund`: Posts a refund transaction, links `reverses_transaction_id`, updates original status, and restores Jar capacity.
- `POST /api/v2/transactions/correct`: Executes 3-way correction chain (`Reversed` original, reversal, and correction).
- `POST /api/v2/jars/reallocate`: Reallocates virtual capacity between Jars ($0.00$ ledger impact). Accepts `is_emergency` and `intent_note`.
- `GET /api/v2/calendar/events`: Returns unified household schedule aggregating recurring patterns, credit card due dates, and installment dates.
