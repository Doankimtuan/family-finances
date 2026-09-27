# Inbox Experience Review

## Existing Inbox Model

The ViNha Inbox domain (`modules/inbox`, `app/[locale]/(product)/inbox`) functions as the household's **financial attention queue**, strictly distinct from a generic social notification feed or an endless log.

- **Fundamental Rule**: An Inbox item exists **only** when it carries a meaningful household outcome (classification, confirmation, or financial decision). Awareness-only notifications and items without a resolvable household outcome are not permitted in the Inbox domain.
- **Single Source of Truth**: `InboxItemKind` defined in `modules/inbox/application/inbox-constants.ts` defines all 8 canonical item types. Legacy notification types (`savings_matured`, `renewal_required`, `payment_reminder`, etc.) have either been mapped onto canonical kinds at the read boundary or retired.
- **Immutable Ledger Safety**: Inbox actions never mutate account balances, change double-entry ledger lines, or create ad-hoc money movements. Assigning a transaction to a jar (`resolve_inbox_item_to_jar`) simply classifies an existing debit line to an active envelope; maturity actions trigger standard Savings lifecycle commands.
- **Offline Integrity**: Inbox decisions require a network connection and fail-closed when offline (`inbox-offline-banner.tsx`).
- **Partner Equality**: Any adult member of the household can resolve routine inbox items (`partnerEqualNote: "Mọi partner đều có thể xử lý — quyền Inbox hàng ngày là ngang nhau"`). Ownership constraints only apply to strictly personal items where source capability is `READ_ONLY_NON_OWNER`.

---

## Item Types

ViNha supports exactly 8 canonical item kinds (`InboxItemKind`):

| Item Kind                       | Vietnamese Label      | Trigger / Meaning                                                                              | Priority / Lifecycle                            | Resolution Action                                                       | Destination After Action                                          |
| :------------------------------ | :-------------------- | :--------------------------------------------------------------------------------------------- | :---------------------------------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `UNMAPPED_EXPENSE`              | Chi chưa gắn hũ       | Debit transaction posted without a Plan jar assignment.                                        | High (blocks accurate jar spending calculation) | `resolve_inbox_item_to_jar` (select active Jar) or `dismiss_inbox_item` | Remains in ledger; returns to Inbox open queue with receipt alert |
| `INCOME_SUGGEST`                | Phân bổ thu (Suggest) | New income posted with rule suggestion for jar allocation.                                     | Medium                                          | Confirm allocation rule or assign to jar                                | Returns to Inbox open queue                                       |
| `SAVINGS_MATURITY`              | Đáo hạn tiết kiệm     | Term deposit reached maturity or is within 2-day reminder window.                              | High (urgent financial renewal decision)        | `RENEW`, `SWITCH`, `WITHDRAW`, `CONFIRM_CONFIGURED`, `REMIND_TOMORROW`  | Savings domain executes settlement; Inbox closes review item      |
| `EARLY_WITHDRAWAL_CONFIRMATION` | Rút trước hạn         | High-friction penalty confirmation when user requests early settlement of locked term savings. | High (destructive / loss of interest penalty)   | `CONFIRM` or `CANCEL`                                                   | Savings executes liquidation or retains deposit                   |
| `EMI_COMPLETE`                  | Trả góp hoàn tất      | Institutional loan or installment plan completed final payment.                                | Low (reflective milestone)                      | `CELEBRATE` or `LATER`                                                  | Moves to archived status                                          |
| `EMERGENCY_DECLARATION`         | Khai báo khẩn cấp     | A household partner shifted jar capacity with an emergency flag and intent note.               | High (household transparency / alignment)       | `ACKNOWLEDGE` / `DISMISS`                                               | Closes item; note archived                                        |
| `LOAN_PAYMENT_ATTENTION`        | Cần chú ý khoản vay   | Bank loan payment due date is imminent or overdue.                                             | High / Critical                                 | View source in Money / Loan Detail                                      | Navigates to `/money/loans/:id`                                   |
| `DEBT_PAYMENT_ATTENTION`        | Cần chú ý khoản nợ    | Personal lending/borrowing repayment due date is imminent or overdue.                          | High / Critical                                 | View source in Money / Debt Detail                                      | Navigates to `/money/debts/:id`                                   |

---

## Status Model

ViNha implements an explicit, unambiguous lifecycle model:

- **Active Status**:
  - `PENDING`: The item is active, unresolved, and requires attention or decision. Displayed in the `Đang mở` (Open Queue) tab (`/inbox` or `/inbox?tab=open`).
- **Terminal Outcomes (Archived Queue)**:
  - `RESOLVED`: Successfully classified to an active jar.
  - `DISMISSED`: User explicitly skipped/dismissed the item without resolving.
  - `ACKNOWLEDGED`: Milestone celebrated, emergency note viewed, or maturity decision recorded.
  - `AUTO_RESOLVED`: Automatically resolved by merchant rule when confidence exceeds 90% (`AUTO_RESOLVE_CONFIDENCE_THRESHOLD = 0.9`).
  - `EXPIRED`: Time-bound reminder or proposal lapsed without action.
  - `ARCHIVED`: Historical classification for completed items.
- **Read/Unread vs. Resolved/Unresolved**:
  - `readAt` is purely presentational metadata (`inbox-read-state-control.tsx`).
  - Marking an item "read" **never** resolves it. Unresolved items remain in `Đang mở` regardless of read status until an explicit financial outcome occurs.

---

## Inbox Purpose

ViNha Inbox is formally defined as:

> **The Household's Financial Attention Queue**: A focused operational workspace where financial events surface only when they require classification, confirmation, or a consequential household decision. It exists to keep cash flow and plan allocations healthy without overwhelming family members with informational noise.

---

## Pending Queue

The Pending Queue (`SCR-41`, `/inbox?tab=open`) provides an immediate, 3-second triage experience:

1. **Summary Hero Card**: Shows exact pending count (`14 việc cần xem`), reassuring purpose copy, and a live fact pill (`Đang chờ: 14 việc cần xem`).
2. **2-Segment Queue Switcher**: Clearly separates `Đang mở (14)` from `Đã lưu trữ`.
3. **Controls Card**: Title search bar (`Tiêu đề…`) and horizontally scrollable kind chips (`Tất cả`, `Chi chưa gắn hũ`, `Đáo hạn tiết kiệm`, `Khai báo khẩn cấp`, `Cần chú ý khoản vay`, `Trả góp hoàn tất`).
4. **Heterogeneous ReviewCard Rows**: Each row leads with the dominant attention concept (e.g. maturity countdown, merchant name, emergency declaration), displays semantic amount formatting, tone-specific icon containers (40×40px, rounded 10px), status badges, and trailing chevrons.

---

## Completed / Archive

The Completed / Archive Queue (`SCR-44`, `/inbox?tab=archived`):

- **Calm Historical Record**: Muted, stable visual treatment that reflects settled decisions without visual noise.
- **Read-Only ReviewCards**: Stripped of trailing navigation chevrons and interactive hover prompts to prevent accidental tap expectations.
- **Outcome Status Badges**: Displays terminal outcomes (`Đã gán`, `Đã xác nhận`, `Tự gán`, `Đã xem`, `Hết hạn`) using neutral gray styling (`#F4F4F5` / `#242428`).
- **Filter Chips**: Allows filtering archived history by outcome (`Tất cả`, `Đã gán`, `Đã xác nhận`, `Tự gán`, `Đã bỏ qua`).

---

## Item Detail

The Item Detail View (`SCR-42`, `/inbox/[id]`):

- **TopAppBar**: Back chevron (`< Về Hộp thư`), title `Mục cần xem`, and subtitle `Quyết định mà không đổi quyền sở hữu Money`.
- **Decision Context Hero**: Displays status badge (`Đang chờ`), prominent decision prompt (_"Khoản chi này chưa có hũ. Chọn hũ Active để gắn."_), and co-management reassurance.
- **Source Financial Card**: Displays merchant, account, and exact amount (`− ₫ 85.000` in 28px bold tabular-nums rose).
- **Financial Invariant Notice**: Explicitly clarifies that assigning a jar does not create new money, debit accounts, or alter balances.
- **Facts Card**: Key-value metadata breakdown (Category, Account, Date/Time, Note).
- **Sticky Bottom Action Bar**: Secondary `Bỏ qua` button and primary `Gán vào hũ` CTA.

---

## Decision Items

For items requiring choices rather than simple navigation (e.g. `SAVINGS_MATURITY`, `EARLY_WITHDRAWAL_CONFIRMATION`):

- Decisions are presented using clear, mutually exclusive Choice Tiles (`SCR-43`).
- Selected options feature active 2px teal borders, subtle tinted backgrounds, and radio check indicators.
- Secondary actions (`Nhắc lại ngày mai`, `Giữ tiết kiệm`) are placed on the left with secondary button styling; primary confirmed choices occupy the dominant right slot.

---

## Savings Items

Savings maturity items (`SCR-43`) adhere strictly to the boundary between Inbox and Money:

- **Trigger**: Term deposit maturity date is imminent (within 2 days) or passed.
- **Display**: Shows contract title, 12-month tenure, principal amount (`₫ 500.000.000`), accrued interest (`+ ₫ 29.000.000`), and maturity yield (`₫ 529.000.000`).
- **Real Actions Supported**:
  - `RENEW` (Gia hạn cuốn gốc + lãi)
  - `ROLL_PRINCIPAL_ONLY` (Chỉ cuốn gốc, rút lãi)
  - `WITHDRAW` (Rút toàn bộ / tất toán)
  - `REMIND_TOMORROW` (Nhắc lại ngày mai)
- **Boundary**: Inbox collects the decision; Money/Savings executes the rollover or payout. Inbox does not duplicate savings performance charts or tenure sliders.

---

## Plan Items

Plan-related inbox items (`UNMAPPED_EXPENSE`, `INCOME_SUGGEST`, `EMERGENCY_DECLARATION`):

- **Active Jar Integrity**: The jar picker dropdown strictly filters to active jars (`jars.filter(j => j.status === 'active')`). Closed, paused, or archived jars cannot receive assignments.
- **Pattern Learning**: Displays historical merchant pattern confidence (e.g. `95% tin cậy; tự gán từ 90%`) when matching rules exist.
- **Emergency Shifts**: When capacity is reallocated under emergency flags, partners see the intent note without blocking regular spending.

---

## Transaction Items

Unassigned transaction items (`UNMAPPED_EXPENSE`):

- Render transaction name, payment method (`Techcombank Debit ****8892`), timestamp, and debit amount.
- Inline resolution allows selecting the envelope and committing in one click without leaving the flow.
- A direct deep link (_"Xem giao dịch trong Money →"_) allows opening the source ledger entry if the user needs to correct transaction metadata.

---

## Household Items if applicable

Household co-management rules:

- **Equal Routine Rights**: Any adult household member can classify unmapped transactions, acknowledge milestones, or dismiss emergency notes.
- **Ownership Fencing**: If an item relates to a personal account owned by a partner and the current user lacks administrative authority, the item renders in read-only mode with the callout: _"Cần chủ sở hữu xử lý · Mục tài chính cá nhân này thuộc về thành viên khác trong hộ."_

---

## Action vs Navigation Model

ViNha avoids forcing all complex flows into inline cards:

- **Inline Actions**:
  - Assign to active jar (simple dropdown + submit).
  - Select maturity settlement rule (3-choice radio + submit).
  - Acknowledge milestone or dismiss.
- **Navigation to Destination Domain**:
  - Loan payment execution: Navigates to `/money/loans/:id` (`viewSourceLoan`).
  - Debt repayment execution: Navigates to `/money/debts/:id` (`viewSourceDebt`).
  - Complex savings contract renegotiation: Deep links to `/money/savings/:id`.

---

## Badge Semantics

The unread badge on the bottom navigation bar (`Hộp thư` [14]):

- Represents **Pending Action Items** (`itemCount` of unresolved items in the open queue).
- Does **not** represent unread notifications. Reading an item does not decrement the badge; resolving or dismissing it decrements the badge.
- When count is `0`, the badge is cleanly hidden (`SCR-45`).
- Tested with counts `0`, `1`, `14`, and large counts (`99+`) without visual distortion.

---

## Filters

Filtering controls (`InboxControls`):

- **Sentinel**: `ALL` ("Tất cả").
- **Kind Filter Chips**: `Chi chưa gắn hũ`, `Đáo hạn tiết kiệm`, `Khai báo khẩn cấp`, `Cần chú ý khoản vay`, `Trả góp hoàn tất`.
- Horizontal scroll with `snap-x` and zero clipping.
- Filter empty state provides an explicit `Xoá bộ lọc` CTA.

---

## Empty States

ViNha implements two distinct, dignified empty states:

1. **Inbox Zero (`SCR-45`, `/inbox` when 0 items pending)**:
   - Reassuring headline: _"Hiện không có việc nào cần chú ý"_.
   - Explains that all cash flows are classified and no contracts are due.
   - Primary action: _"Xem tổng quan tài chính →"_ linking to Home.
   - Reassurance footnote explaining automated triggers.
2. **Archived Empty (`/inbox?tab=archived` when no history exists)**:
   - Headline: _"Chưa có lịch sử Inbox đã lưu trữ"_.
   - Subtitle: _"Mục hết hạn, đã bỏ qua và đã xử lý sẽ hiện ở đây khi chúng rời hàng chờ đang mở."_

---

## Content Design

All Vietnamese copy adheres to natural, conversational financial phrasing:

- Specific action CTAs: `Gán vào hũ`, `Xác nhận gia hạn`, `Nhắc lại ngày mai`, `Bỏ qua`.
- Avoids robotic phrasing: Replaces _"Hệ thống phát hiện..."_ with clear cause-and-effect copy (_"Khoản chi này chưa có hũ. Chọn hũ Active để gắn."_).
- Clear financial labels: `Tiền gốc`, `Tiền lãi dự kiến`, `Tổng nhận khi đáo hạn`, `Hũ đang hoạt động`.

---

## UI Consistency

All 10 canonical screens adhere to the ViNha Warm Precision token hierarchy:

- App Shell: Centered 390px/440px container with iOS status bar and Home Indicator.
- Icon Containers: 40×40px with `rounded-[10px]` and 20px optical icon glyphs.
- Typography: Geist family with `tabular-nums` for all monetary values.
- Dividers: Subtle 1px borders (`#DDE4E1` light / `#2E2E33` dark).

---

## Visual QA

- **Icon Optical Weights**: Validated 1.8px stroke width across all inline SVG glyphs.
- **Badge Containedness**: Status badges use pill geometry (`rounded-full`) with uppercase tracking and adequate padding.
- **Currency Alignments**: `₫` glyph placed consistently with non-breaking spacing. Negative outflows formatted with leading minus (`− ₫ 85.000`).

---

## Responsive Review

All screens validated across standard mobile viewports:

- **360 × 800 (Compact Mobile)**: No horizontal overflow; chips scroll smoothly; touch targets maintain minimum 44×44px.
- **390 × 844 (Base iPhone Viewport)**: Pixel-perfect baseline.
- **430 × 932 (Large Mobile)**: Centered layout with balanced margins; bottom action bar spans container width.

---

## Accessibility

- **Color Independence**: Status states are communicated via explicit textual badges (`Đang chờ`, `Đã gán`, `Đáo hạn tiết kiệm`), not color alone.
- **Touch Targets**: All interactive elements (chips, buttons, form fields, tab items) satisfy minimum 44px height.
- **Contrast**: Meets WCAG AA contrast standards across both Light and Dark themes.

---

## Light Theme

Canonical screens created and reviewed:

- `SCR-41 (Light)`: `80394649d39f4c458d55e834611d45c2` (Inbox Overview — Open Queue)
- `SCR-42 (Light)`: `40df69c0cbb54fd2b151d21ec123966e` (Inbox Item Detail — Unmapped Transaction)
- `SCR-43 (Light)`: `50e2ccd1b53c4bc7b01d4c4573ef3b22` (Inbox Decision Detail — Savings Maturity)
- `SCR-44 (Light)`: `aa797df4ca0544879fa979146c5ef975` (Inbox Archived Queue — Completed History)
- `SCR-45 (Light)`: `354e2436922c475093af873d271fec77` (Inbox Empty State — Zero Pending)

---

## Dark Theme

Canonical screens created and reviewed with exact 1-to-1 parity:

- `SCR-41 (Dark)`: `1efc32d2855745c6ae118f880dafefe1` (Inbox Overview — Open Queue Dark)
- `SCR-42 (Dark)`: `d9f5d6f1c4b24fb59662bb4ad03f4b68` (Inbox Item Detail — Unmapped Transaction Dark)
- `SCR-43 (Dark)`: `8038c264d0574809bfae1a586f10d82d` (Inbox Decision Detail — Savings Maturity Dark)
- `SCR-44 (Dark)`: `2898b2b518ff4c328fa7ad81d34f68ef` (Inbox Archived Queue — Completed History Dark)
- `SCR-45 (Dark)`: `1a3419ca795a4978964ffbfaf9792694` (Inbox Empty State — Zero Pending Dark)

---

## Prototype

The verified interactive flows:

1. `Home (Overview)` $\rightarrow$ Tap Inbox tab (with badge 14) $\rightarrow$ `SCR-41` (Inbox Overview Open Queue).
2. `SCR-41` $\rightarrow$ Tap Unmapped Expense row (`Circle K`) $\rightarrow$ `SCR-42` (Item Detail).
3. `SCR-42` $\rightarrow$ Select Active Jar (`Ăn uống & Sinh hoạt`) $\rightarrow$ Tap `Gán vào hũ` $\rightarrow$ Item resolves, receipt banner shown, open count drops to 13.
4. `SCR-41` $\rightarrow$ Tap Savings Maturity row (`Sổ VCB 12M`) $\rightarrow$ `SCR-43` (Decision Detail).
5. `SCR-43` $\rightarrow$ Select settlement rule (`Gia hạn cuốn gốc + lãi`) $\rightarrow$ Tap `Xác nhận gia hạn` $\rightarrow$ Decision saved, navigates back with receipt.
6. `SCR-41` $\rightarrow$ Tap `Đã lưu trữ` tab $\rightarrow$ `SCR-44` (Archived Queue).
7. Resolving all pending items $\rightarrow$ `SCR-45` (Inbox Zero Empty State).

---

## Deferred Product Opportunities

The following capabilities were deliberately excluded from canonical designs to preserve product boundaries:

1. **Batch Auto-Resolution ("Gán tất cả giao dịch")**: Requires multi-merchant rule reconciliation not currently in database schema; deferred as a future feature opportunity.
2. **AI Smart Prioritization Scoring**: Real product uses deterministic kind grouping; AI score re-ranking is deferred.
3. **Automated Deposit Re-allocation Rules**: Automatic rollover to alternative banks requires institutional open banking APIs; deferred.
4. **Swipe-to-Dismiss Gestures**: Not supported in mobile web core primitives without native gesture polyfills; deferred.
