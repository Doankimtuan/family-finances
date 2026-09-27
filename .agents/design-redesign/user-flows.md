# ViNha Core User Flows

This document details the end-to-end user journeys discovered from the real application code, UI interactions, and canonical flow specifications.

---

## 1. Daily Transaction Capture Flow (Add Expense / Income / Transfer)

```text
[Home / Money / Quick CTA "+"]
       │
       ▼
[Modal / Bottom Sheet Opens]
       │
       ├── Select Mode: [Expense] | [Income] | [Transfer]
       │
       ├── Numeric Amount Input (44px height, large tabular display e.g., ₫250,000)
       │
       ├── Select Account (Source: "Ví thường", "TP Bank chồng", etc.)
       │
       ├── If Expense/Income: Select Category / Jar (e.g. "Ăn uống", "Hũ chi tiêu")
       │   └── If Transfer: Select Destination Account (e.g. "Tiền mặt")
       │
       ├── Optional Details: Date (Default: Today), Note/Merchant, Tags
       │
       ├── [Submit / Lưu giao dịch]
       │       │
       │       ├── Validation: Amount > 0, Valid Accounts selected
       │       ▼
       ├── Transaction Posted to Ledger
       │       ├── Account balance updated in real-time
       │       ├── If Expense linked to Jar: Jar spent progress updated
       │       └── If unmapped: Dispatched to Inbox as UNMAPPED_EXPENSE
       ▼
[Return to Origin / Success Toast]
```

---

## 2. Savings Maturity & Inbox Resolution Flow

```text
[Tikop Savings Term Matures]
       │
       ▼
[System creates ReviewItem: SAVINGS_MATURITY in Inbox]
       │
       ▼
[User visits Inbox (`/inbox`) or sees Amber Alert on Home]
       │
       ▼
[Open Inbox Queue: Item displayed with Violet Badge "SAVINGS_MATURITY"]
       │   • Principal: ₫50,000,000
       │   • Accrued Net Interest: ₫875,000
       │   • Maturity Date: 24/09/2026
       │
       ▼
[Decision Point]:
       ├── Option A: [Rollover 3 Months @ 6.2%]
       │     └── New savings contract created with updated principal
       │
       └── Option B: [Withdraw to Bank Account]
             └── Select destination account ("TP Bank") -> Transfer posted -> Balance credited
       ▼
[ReviewItem marked RESOLVED -> Moved to Archived Queue]
```

---

## 3. Plan Envelope Reallocation Flow (Over-Budget Recovery)

```text
[User records expense exceeding Jar limit]
       │
       ▼
[Jar flagged as Over-Budget on `/plan`]
       │ (e.g., "Hũ shopping cho vợ is over budget by ₫809,244")
       │
       ▼
[Smart Reallocation Engine evaluates Jars with surplus]
       │ (Suggests: "Move ₫810,000 from Hũ tiết kiệm to Hũ shopping")
       │
       ▼
[User taps "Xem đề xuất điều chuyển" / "Apply Reallocation"]
       │
       ▼
[Preview Reallocation Modal]
       │   • Source Jar: Hũ tiết kiệm (Surplus: ₫2,500,000 -> New: ₫1,690,000)
       │   • Destination Jar: Hũ shopping (Over by: ₫809,244 -> New: ₫0 remaining)
       │   • Reallocation note recorded for month audit
       │
       ▼
[Confirm Reallocation]
       │
       ▼
[Both Jars refreshed to healthy status -> Banner dismissed]
```

---

## 4. Month-End Reflection Ritual Flow

```text
[End of Calendar Month / Notification on Home]
       │
       ▼
[Navigate to `/plan/ritual`]
       │
       ▼
[Step 1: Unresolved Items Check]
       │   • Scan Inbox for any pending unmapped transactions
       │   • Quick triage of remaining items
       │
       ▼
[Step 2: Monthly Divergence Audit]
       │   • Planned Income vs Actual Inflow
       │   • Planned Jar Capacity vs Actual Total Spent
       │   • Savings milestone progress
       │
       ▼
[Step 3: Partner Discussion & Notes]
       │   • Household notes on what went well / lessons learned
       │
       ▼
[Step 4: Lock Month & Seed Next Month]
       │   • Finalize historical ledger period
       │   • Roll over baseline jar allocations to next month
       ▼
[Month Closed -> Certificate / Household Pulse Update]
```

---

## 5. Partner Invitation & Household Access Flow

```text
[Household Admin visits Together (`/together/members`)]
       │
       ▼
[Tap "+ Mời thành viên" / "+ Invite Partner"]
       │
       ▼
[Enter Partner Email + Select Role (Partner)]
       │
       ▼
[System generates invitation token & deep link: `/invite/[token]`]
       │
       ▼
[Partner receives link -> Opens `/invite/[token]`]
       │   • Previews Household Name ("Chúm ta") and Inviter
       │   • Authenticates (Login or Register)
       │
       ▼
[Partner accepts invitation]
       │
       ▼
[Membership record linked in Supabase tenancy table]
       │
       ▼
[Partner redirected to `/home` with full shared household visibility]
```
