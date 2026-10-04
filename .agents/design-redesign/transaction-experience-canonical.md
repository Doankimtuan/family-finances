# ViNha Canonical Transaction Experience Specification

> **Design Authority**: ViNha Warm Precision Design System (`assets/75087efd2c3c42baa6ce67405334331b`)  
> **Stitch Project**: `projects/16826760243481546078` ("ViNha Mobile Finance Icon System")  
> **Date**: October 2026  
> **Status**: **CANONICAL & RATIFIED (v2.0)**  
> **Platform Target**: Mobile-first Web & PWA (Centered 440px max shell; responsive 360px, 390px, 430px)

---

## 1. Executive Summary & Canonical Screen Registry

The ViNha transaction experience has been designed and published directly in Google Stitch in accordance with ViNha's double-entry accounting foundation, the **Warm Precision** visual language, and strict mobile-first ergonomics.

### Canonical Stitch Screens

| Screen Identifier             | Screen Name                         | Route / Context                   | Stitch Screen ID                   | Mode  | Description                                                                                                       |
| :---------------------------- | :---------------------------------- | :-------------------------------- | :--------------------------------- | :---- | :---------------------------------------------------------------------------------------------------------------- |
| **SCR-TRN-01-LIGHT**          | Transaction History & Activity List | `/transactions`                   | `94af54682a794d6c8f725312efd79b4a` | Light | Chronological activity list, net cash-flow hero, filter chips, compact transaction rows.                          |
| **SCR-TRN-01-DARK**           | Transaction History & Activity List | `/transactions`                   | `becbc702ff2b44939ad7474f74426847` | Dark  | 1-to-1 dark parity with `#141416` canvas, `#1C1C1F` surfaces, `#2DD4BF` mint teal.                                |
| **SCR-TRN-02-EXPENSE-LIGHT**  | Add Transaction — Expense Mode      | `/transactions/new?type=EXPENSE`  | `930a38adab3845659505776e84a3ddcd` | Light | Primary bottom-nav destination (no back button), hero MoneyInput, account/category selects, sticky submit.        |
| **SCR-TRN-02-EXPENSE-DARK**   | Add Transaction — Expense Mode      | `/transactions/new?type=EXPENSE`  | `4bd322e7fc2e413198723f6138bd154d` | Dark  | 1-to-1 dark parity, high-contrast inputs, soft mint active highlights.                                            |
| **SCR-TRN-02-INCOME-LIGHT**   | Add Transaction — Income Mode       | `/transactions/new?type=INCOME`   | `3de408fd841043ee8aa9eae2bfadc5c2` | Light | Emerald `#047857` monetary entry, destination account, income category/source, invariant notice.                  |
| **SCR-TRN-02-INCOME-DARK**    | Add Transaction — Income Mode       | `/transactions/new?type=INCOME`   | `0b63210dc9b544269779d46088594d3b` | Dark  | 1-to-1 dark parity, emerald `#34D399` hero amount and emerald container.                                          |
| **SCR-TRN-02-TRANSFER-LIGHT** | Add Transaction — Transfer Mode     | `/transactions/new?type=TRANSFER` | `59aa4e2fdf7e43c7bf1f9e8434ff0aba` | Light | Sky Blue `#0369A1` entry, linked From-To account selector, zero expense category, neutrality badge.               |
| **SCR-TRN-02-TRANSFER-DARK**  | Add Transaction — Transfer Mode     | `/transactions/new?type=TRANSFER` | `e87fce3f6d7741268cfbf5a11760af07` | Dark  | 1-to-1 dark parity, sky `#38BDF8` accents, soft sky containers.                                                   |
| **SCR-TRN-03-EXPENSE-LIGHT**  | Transaction Detail — Expense        | `/transactions/:id`               | `d94059c191b64548aa96a4a204971540` | Light | Detail card, posted status badge, audit ID, correction/reversal action buttons.                                   |
| **SCR-TRN-03-EXPENSE-DARK**   | Transaction Detail — Expense        | `/transactions/:id`               | `409ec0463f4a4428872a2e2195f08cc1` | Dark  | 1-to-1 dark parity, slate surface card, rose cancellation warning.                                                |
| **SCR-TRN-03-INCOME-LIGHT**   | Transaction Detail — Income         | `/transactions/:id`               | `24aff07da6ca4cb08b00d3bedfef35c9` | Light | Emerald income hero card, destination account, plan allocation link, reversal CTA.                                |
| **SCR-TRN-03-INCOME-DARK**    | Transaction Detail — Income         | `/transactions/:id`               | `a64e65b478874df9b19d6145794a4d7b` | Dark  | 1-to-1 dark parity, emerald `#34D399` typography and badges.                                                      |
| **SCR-TRN-03-TRANSFER-LIGHT** | Transaction Detail — Transfer       | `/transactions/:id`               | `c64ac9e312624631a5c9a32f493362bc` | Light | Visual From `→` To linked card, two-leg double-entry verification, simultaneous cancellation CTA.                 |
| **SCR-TRN-03-TRANSFER-DARK**  | Transaction Detail — Transfer       | `/transactions/:id`               | `ebf1148bfbdd4261a813d098af123328` | Dark  | 1-to-1 dark parity, sky `#38BDF8` visual flow markers, balanced status badge.                                     |
| **SCR-TRN-04-STATES-LIGHT**   | Transaction States Board            | `00 — States & Flows`             | `638a55d306db45c08eb397ba121651fc` | Light | Multi-state specification board: Empty, Skeleton Loading, Sync Error, Validation, Category Sheet, Reversal Modal. |
| **SCR-TRN-04-STATES-DARK**    | Transaction States Board            | `00 — States & Flows`             | `58e7dc50ef5840b9beef61e24d40aaed` | Dark  | 1-to-1 dark parity across all 6 state panels in deep slate theme.                                                 |

---

## 2. Core Flow Architecture

### Flow 1: Transaction List (`/transactions`)

The primary transaction history screen is calibrated for rapid scanning of household financial activity without overwhelming the user with heavy borders or oversized cards.

1. **Top Navigation & Context**:
   - `PageHeader` with title **Sổ giao dịch** (_Transaction History_), month selector (`Tháng 10, 2026 ▾`), and accessible icon buttons for **Tìm kiếm** (_Search_) and **Bộ lọc** (_Filter_).
2. **Monthly Net Cash-Flow Hero**:
   - Compact summary card displaying three key metrics:
     - **Thu vào** (_Inflow_): `+ ₫ 42.500.000` (Emerald `#047857` / `#34D399`)
     - **Chi ra** (_Outflow_): `- ₫ 18.240.000` (Neutral Slate `#27272A` / `#E4E4E7`)
     - **Chênh lệch** (_Net Difference_): `+ ₫ 24.260.000` (Teal `#0F766E` / `#2DD4BF`)
   - Replaces decorative charts with direct financial clarity.
3. **Horizontal Category & Type Filters**:
   - Filter chips for fast narrowing: `Tất cả` (_All_), `Chi tiêu` (_Expense_), `Thu nhập` (_Income_), `Chuyển khoản` (_Transfer_).
4. **Chronological Date Groupings**:
   - Group headers: e.g. **Hôm nay, 24/10/2026** with right-aligned daily net subtotal (`- ₫ 325.000`).
   - Group headers: e.g. **Hôm qua, 23/10/2026** (`+ ₫ 35.000.000`).
5. **Transaction Row Semantics**:
   - Built with the canonical `TransactionRow` component:
     - 40×40px icon container with 10px radius:
       - Expense: Category icon (e.g. Utensils for Dining, Cart for Groceries) in neutral container.
       - Income: Arrow-down-left icon in soft emerald container (`#E7F5F1` / `#064E3B`).
       - Transfer: Arrows-right-left icon in soft sky container (`#E0F2FE` / `#0C4A6E`).
     - Two-line textual stack: Primary concept label (`Ăn trưa Phở Thìn`) + secondary context (`Vietcombank · 12:30`).
     - Tabular VND amount with explicit prefix and color distinction:
       - Expense: `- ₫ 145.000` (`#27272A` / `#E4E4E7`)
       - Income: `+ ₫ 35.000.000` (`#047857` / `#34D399`)
       - Transfer: `⇄ ₫ 5.000.000` (`#0369A1` / `#38BDF8`)
     - **Accessibility Notice**: Transaction type is communicated via three independent channels: mathematical sign (`-`, `+`, `⇄`), icon glyph silhouette, and color token.

---

### Flow 2: Add Transaction as a Primary Destination (`/transactions/new`)

`Add Transaction` is a **PRIMARY bottom-navigation destination** (the middle slot in the 5-tab bar). It adopts the top-level main screen header grammar:

1. **Header Grammar**:
   - Clean, centered title: **Thêm giao dịch** (_Add Transaction_).
   - Household switcher / status on top bar.
   - **NO Back Button**: Because this is a root navigation tab, it does not trap the user or feel like a child subpage.
2. **Three-Way Type Switcher (`SegmentedControl`)**:
   - Segment items: **Chi tiêu** (_Expense_), **Thu nhập** (_Income_), **Chuyển khoản** (_Transfer_).
   - Switching segments adjusts the form below dynamically without reloading page state.
3. **Hero `MoneyInput`**:
   - Large, calm typography: 32px Geist with tabular numerals (`- ₫ 145.000`).
   - Accompanied by the spoken Vietnamese currency helper:
     - `Một trăm bốn mươi lăm nghìn đồng`
     - Eliminates household transcription errors (e.g. confusing 50.000 with 500.000).
4. **Context-Sensitive Form Fields**:
   - **Expense Mode**:
     - `Tài khoản trích tiền` (_Account_): Select dropdown showing account name and current balance (`Vietcombank · Số dư ₫ 14.850.000`).
     - `Hạng mục chi tiêu` (_Category_): Select field triggering category picker bottom sheet (`Ăn uống · Hũ Chi tiêu thiết yếu`).
     - `Ngày giao dịch` (_Date_): DatePicker with quick day chips (`Hôm nay`, `Hôm qua`).
     - `Ghi chú` (_Note_): Optional text area.
   - **Income Mode**:
     - `Tài khoản nhận` (_Destination Account_): Select dropdown (`Techcombank Payroll · Số dư ₫ 42.100.000`).
     - `Nguồn thu nhập` (_Income Source / Allocation_): Select dropdown (`Lương & Thưởng · Hũ Phân bổ`).
     - `Ngày nhận` (_Date_).
     - `Ghi chú` (_Note_).
     - `Invariant Notice`: _"Thu nhập hợp lệ ghi nhận tăng số dư tài khoản và phân bổ vào ngân sách hộ."_
   - **Transfer Mode**:
     - `Từ tài khoản` (_From Account_): Select dropdown (`Techcombank`).
     - Visual flow connector: Animated downward indicator `↓`.
     - `Đến tài khoản` (_To Account_): Select dropdown (`Vietcombank`).
     - Form validation: Enforces `sourceAccountId !== destinationAccountId`.
     - **NO Expense Category**: Transfers do not touch budget categories.
     - `Balance Neutrality Notice`: _"Nguồn giảm một lần · Đích tăng một lần · Tổng tài sản không đổi."_
5. **Sticky Form Action (`StickyFormAction`)**:
   - Fixed at the bottom of the viewport above the navigation bar.
   - Primary CTA: `Lưu chi tiêu` / `Lưu thu nhập` / `Thực hiện chuyển khoản`.
   - Disabled when amount is 0 or required accounts are unselected; displays inline loading spinner on submit.

---

### Flow 3: Transaction Detail (`/transactions/:id`)

The detail screen presents an existing posted transaction with full audit fidelity:

1. **Header**:
   - Child page header with back navigation affordance: `< Về Lịch sử` (_Back to History_).
   - Overflow action button (`···`) for quick access to actions.
2. **Hero Detail Card**:
   - Prominent amount display: `- ₫ 145.000` / `+ ₫ 35.000.000` / `⇄ ₫ 5.000.000`.
   - Category name and title.
   - Status badge: `Đã hạch toán` (_Posted_) / `Hai vế cân bằng` (_Balanced_).
3. **Structured Financial Metadata**:
   - Formatted table/grid showing:
     - Account name and balance impact.
     - Linked budget jar / plan allocation.
     - Transaction timestamp.
     - Notes and attached tags.
     - **Ledger Audit ID**: Immutable reference code (e.g. `TX-892401` or `Bút toán kép: LEG-A & LEG-B`).
4. **Transfer Flow Visualization**:
   - Visual route card mapping:
     - `Techcombank` (-₫ 5.000.000) `→` `Vietcombank` (+₫ 5.000.000).
     - Emphasizes net household change: `± 0 ₫`.
5. **Canonical Actions & Accounting Reality**:
   - Secondary Tonal Action: `Sửa giao dịch` (_Edit Transaction_ — triggers 3-way ledger correction).
   - Ghost Destructive Action: `Xoá giao dịch` (_Void / Reverse Transaction_).
   - Invariant notice: Posted transactions are immutable in the ledger; edits and deletions generate balancing reversing entries.

---

## 3. Real Product Behavior vs. Mock / Pending Logic

| Feature Area                | Real Product Reality (Codebase)                                                                                                                                                    | Stitch Screen Representation                                                                                                                  | Status / Gap Documentation                                                                        |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Transaction Model**       | Double-entry ledger postings (`postings` table with `debit`/`credit` amounts, `accountId`, `currency`).                                                                            | Reflected in `TransactionRow`, amount signs, and ledger reference codes.                                                                      | **REAL & VERIFIED**                                                                               |
| **Transaction Types**       | `EXPENSE`, `INCOME`, `TRANSFER`.                                                                                                                                                   | 3-way segment switcher in `SCR-TRN-02`.                                                                                                       | **REAL & VERIFIED**                                                                               |
| **Transfer Semantics**      | Strictly balanced two-legged posting. `recordTransferInputSchema` has `sourceAccountId`, `destinationAccountId`, `amount`, `transactionDate`, `note`.                              | Linked From-To account UI, zero expense category, neutrality badge.                                                                           | **REAL & VERIFIED**                                                                               |
| **Opening Balance**         | Equity / Capital contribution (`RECORD_OPENING_BALANCE`). NOT counted as monthly income.                                                                                           | Explicitly disclaimed in Onboarding Step 2 and transaction types.                                                                             | **REAL & VERIFIED**                                                                               |
| **Immutability & Deletion** | Posted transactions in ledger cannot be deleted in-place (`LEDGER_ACTION_ERROR_CODE.IMMUTABLE`). Mutation requires `correctTransaction` (3-way adjustment) or `refundTransaction`. | Destructive delete button is labeled `Huỷ bút toán` / `Huỷ toàn bộ chuyển khoản`. Modal clarifies that a balancing reversing entry is posted. | **DOCUMENTED MOCK / PENDING UI**: Full UI shows reversal workflow preserving ledger immutability. |
| **Transfer Deletion**       | A transfer consists of two linked ledger postings. Deleting or reversing one side would create an unbalanced ledger.                                                               | Reversal dialog specifically states: _"Cả 2 vế (nguồn và đích) sẽ được hoàn tác đồng thời."_                                                  | **REAL INVARIANT ENFORCED IN DESIGN**                                                             |
| **Categories**              | Hierarchical categories linked to Plan jars. Transfers DO NOT use categories.                                                                                                      | Category selector displayed for Expense & Income; omitted completely for Transfer.                                                            | **REAL & VERIFIED**                                                                               |
| **Multi-Currency**          | VND is canonical base currency (`₫`). Tabular formatting with space separator (e.g. `₫ 145.000`).                                                                                  | Hero MoneyInput and rows strictly follow `₫ #.###.###` format with Vietnamese spoken words.                                                   | **REAL & VERIFIED**                                                                               |

---

## 4. Multi-State Board Specification (`SCR-TRN-04`)

The canonical States Board showcases 6 mission-critical interactive micro-moments:

### State 1: Empty State (`EmptyState`)

- **Visual**: Warm line-drawn household illustration.
- **Copy**:
  - VI: _Chưa có giao dịch nào trong tháng này. Hãy thêm chi tiêu hoặc thu nhập đầu tiên để bắt đầu theo dõi ngân sách gia đình._
  - EN: _No transactions recorded this month. Add your first expense or income to begin tracking your family finances._
- **Action**: Primary Button `+ Thêm giao dịch đầu tiên`.

### State 2: Loading State (`SkeletonLoader`)

- **Visual**: Shimmer placeholders with calibrated aspect ratios matching production typography.
- **Structure**: Shimmer hero net card, filter chip skeletons, and 4 stacked transaction rows with 40px icon blocks and two-line text bars.

### State 3: Error & Offline State (`StatusAlert` / `ErrorState`)

- **Visual**: Amber/Rose status alert container with cloud-offline icon.
- **Copy**:
  - VI: _Không thể đồng bộ dữ liệu sổ cái. Kiểm tra kết nối mạng của bạn._
  - EN: _Unable to sync ledger data. Please check your network connection._
- **Action**: Tonal Button `Thử lại ngay` (_Retry now_).

### State 4: Form Validation State (`FormFieldError`)

- **Amount Validation**: Negative or 0 amount triggers: _"Số tiền giao dịch phải lớn hơn 0 ₫"_ (`AMOUNT_POSITIVE`).
- **Account Transfer Validation**: Selecting same account for From and To triggers: _"Tài khoản nguồn và đích không được trùng nhau"_ (`ACCOUNTS_DISTINCT`).
- **Required Fields**: Red hairline border on input container with 12px error text below.

### State 5: Category Picker Bottom Sheet (`BottomSheet`)

- **Presentation**: Elevated overlay with dimmed backdrop (`rgba(0,0,0,0.55)`).
- **Components**: Drag handle pill, search input (_Tìm hạng mục..._), and a 4-column grid of 12 canonical categories:
  - Ăn uống (Dining), Đi chợ (Groceries), Nhà cửa (Housing), Di chuyển (Transport), Hoá đơn (Bills), Mua sắm (Shopping), Sức khoẻ (Health), Giáo dục (Education), Giải trí (Entertainment), Con cái (Childcare), Hiếu hỷ (Gifts), Khác (Other).
- **Selection**: Active category highlighted with soft teal background and checkmark badge.

### State 6: Destructive Reversal Dialog (`ConfirmationDialog`)

- **Title**: _Huỷ giao dịch này?_ (_Void this transaction?_)
- **Advisory Banner**:
  - VI: _Giao dịch đã được ghi vào sổ cái. Thao tác này sẽ tạo một bút toán đảo để hoàn lại số dư tài khoản về trạng thái ban đầu._
  - EN: _This transaction is posted to the ledger. This action will create a reversing entry to restore account balances._
- **Transfer Note**: Explicitly states both legs will be reversed simultaneously.
- **Actions**: Destructive Button `Xác nhận huỷ` (`#E11D48`) + Secondary Ghost `Giữ lại`.

---

## 5. Bilingual Terminology Dictionary

All screens maintain strict Vietnamese / English parity:

| Domain Concept          | Canonical Vietnamese (Primary) | Canonical English (Secondary) | UI Context                       |
| :---------------------- | :----------------------------- | :---------------------------- | :------------------------------- |
| **Transaction**         | Giao dịch                      | Transaction                   | Navigation & headers             |
| **Expense**             | Chi tiêu                       | Expense                       | Segment tab, transaction type    |
| **Income**              | Thu nhập                       | Income                        | Segment tab, transaction type    |
| **Transfer**            | Chuyển khoản                   | Transfer                      | Segment tab, transaction type    |
| **Transaction History** | Sổ giao dịch                   | Transaction History           | Screen title (`SCR-TRN-01`)      |
| **Add Transaction**     | Thêm giao dịch                 | Add Transaction               | Primary tab title (`SCR-TRN-02`) |
| **Transaction Detail**  | Chi tiết giao dịch             | Transaction Detail            | Screen title (`SCR-TRN-03`)      |
| **Amount**              | Số tiền                        | Amount                        | Hero input label                 |
| **From Account**        | Từ tài khoản                   | From Account                  | Transfer source field            |
| **To Account**          | Đến tài khoản                  | To Account                    | Transfer destination field       |
| **Category**            | Hạng mục                       | Category                      | Expense classification           |
| **Budget Jar**          | Hũ ngân sách                   | Budget Jar                    | Plan allocation bucket           |
| **Transaction Date**    | Ngày giao dịch                 | Transaction Date              | Date picker label                |
| **Note**                | Ghi chú                        | Note                          | Optional description             |
| **Inflow**              | Thu vào                        | Inflow                        | Cash-flow hero                   |
| **Outflow**             | Chi ra                         | Outflow                       | Cash-flow hero                   |
| **Net Difference**      | Chênh lệch                     | Net Difference                | Cash-flow hero                   |
| **Posted / Recorded**   | Đã hạch toán / Đã ghi nhận     | Posted / Recorded             | Status badge                     |
| **Balanced**            | Hai vế cân bằng                | Balanced                      | Transfer status badge            |
| **Ledger Entry**        | Bút toán sổ cái                | Ledger Entry                  | Audit ID label                   |
| **Void / Reverse**      | Huỷ bút toán / Hoàn tác        | Void / Reverse                | Destructive action               |
| **Save Transaction**    | Lưu chi tiêu / Lưu thu nhập    | Save Expense / Save Income    | Primary CTA                      |
| **Execute Transfer**    | Thực hiện chuyển khoản         | Execute Transfer              | Primary CTA                      |

---

## 6. Viewport Responsiveness Matrix

All designs adhere to the **centered 440px max shell** specification:

```text
[ Desktop Canvas (e.g. 1440px) ]
           |
           v
+-------------------------------+
|      440px Centered Shell     |
|  +-------------------------+  |
|  | PageHeader              |  |
|  | Cash-Flow Hero Card     |  |
|  | Filter Chips            |  |
|  | Date Grouping           |  |
|  | Transaction Rows        |  |
|  | StickyFormAction        |  |
|  | BottomNav (5 tabs)      |  |
|  +-------------------------+  |
+-------------------------------+
```

### Viewport Adaptations

| Viewport Width                        | Visual Behavior & Layout Adaptations                                                                                                                                                                                           |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **360px** (Compact Android)           | Padding scales down to `12px` (from `16px`). Hero money font scales down from `32px` to `26px`. Tabular VND amounts remain single-line with truncated category names if needed. Bottom nav icons remain 24px with 10px labels. |
| **390px** (Standard iPhone)           | Default baseline. Standard `16px` padding, `32px` hero amount typography, `44px` touch targets for all interactive inputs and buttons.                                                                                         |
| **430px** (Large Mobile / Pro Max)    | Full-width utilization within the 440px maximum boundary. Extended breathing room for filter chips and date group headers.                                                                                                     |
| **Desktop / Tablet (768px - 1440px)** | The viewport stays locked at **440px wide**, centered horizontally with neutral canvas `#FAFAF9` (Light) or `#141416` (Dark) filling the background. No wide-screen stretching.                                                |

---

## 7. Verification Against Design Constitution

- [x] **No Magic Strings**: All labels, error codes, and route paths map directly to documented domain constants (`app-path.ts`, `ledger-action-constants.ts`, `transaction-types.ts`).
- [x] **Primary Bottom Navigation Tab**: `Add Transaction` is designed as a root destination with top-level header grammar (no child back button).
- [x] **Transfer Semantics**: Strictly preserves `Transfer ≠ Income` and `Transfer ≠ Expense`. No expense category required. Balanced two-legged flow with visual link.
- [x] **Opening Balance Invariance**: Opening balance is strictly separated from monthly income.
- [x] **Immutability & Reversals**: Double-entry ledger immutability is honored; cancellation is designed as a balancing reversal rather than an in-place silent deletion.
- [x] **Color vs. Shape**: Transaction types are differentiated by mathematical sign (`-`, `+`, `⇄`), icon silhouette, and color token.
- [x] **Bilingual Support**: Layouts validated for both Vietnamese (with stacked diacritics) and English.
- [x] **16 Canonical Stitch Screens**: Complete parity between Light and Dark modes across all 3 flows and the states board.
