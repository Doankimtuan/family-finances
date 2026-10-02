# Implementation 07 — Screen-to-Component Mapping Matrix

**Canonical Design System**: Task 11 ViNha Component System (`assets/75087efd2c3c42baa6ce67405334331b`)  
**Scope**: Five authenticated main application screens: Home, Money, Plan, Inbox, Together  
**Date**: September 30, 2026

---

## 1. Home Dashboard (`/[locale]/home`)

| Current Section             | Canonical Stitch Section (SCR-01) | Canonical Reusable Component              | Props & Semantics                                                                                                                          |
| :-------------------------- | :-------------------------------- | :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeTopBar`                | 1. Header (Household & Search)    | `PageHeader` / `TopAppBar`                | Eyebrow: Household name; Title: "Chúm ta" / Greeting; Status: Active sync pip; Actions: Notifications and Together link.                   |
| `HomeFinancialPulse`        | 2. Hero: Tổng tài sản hiện hữu    | `Card` (surface) + `FinancialAmount`      | Tabular display, privacy toggle (`FinancialPrivacyProvider`), monthly delta badge (`+₫ ... (+...% tháng này)`).                            |
| `HomeInboxSection`          | 3. Decision Inbox Alert Banner    | `Card` / `InlineAlert` (variant: warning) | Amber surface, shield icon, pending count, direct action link (`Xử lý ngay →`).                                                            |
| `HomePeriodSection` (Chart) | 4. Dòng tiền (Cash-Flow)          | `Card` + `SegmentedControl` + Chart       | Period switch (`Theo tháng` / `Theo quý`), Net delta / Total Income / Total Expense metric strip, Area/Line chart, spending breakdown bar. |
| `HomeProductSummaries`      | 5. Cấu trúc tài chính (4 Pillars) | `Card` + Specialized Rows                 | `SavingsRow` (Tiết kiệm), `InvestmentRow` (Đầu tư), `LoanRow` (Khoản vay & Thế chấp), `PersonalDebtRow` (Vay mượn cá nhân).                |
| `HomePeriodStory` (Feed)    | 6. Giao dịch gần đây              | `Card` + `TransactionRow`                 | Explicit types: `income` (+), `expense` (−), `transfer` (⇄ neutral, no minus sign).                                                        |
| Transaction creation        | Shared navigation action          | `BottomNavigation`                        | One centered Add transaction action on product routes; Home has no duplicate capture button.                                               |

---

## 2. Money Overview Hub (`/[locale]/money`)

| Current Section             | Canonical Stitch Section (SCR-02)        | Canonical Reusable Component            | Props & Semantics                                                                                                  |
| :-------------------------- | :--------------------------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `TopAppBar`                 | 1. Header: Tài chính                     | `TopAppBar` primary                     | Shared title/subtitle hierarchy, household status, search and Inbox actions.                                       |
| `MoneyPositionHero`         | 2. Consolidated Hero & Allocation        | `Card` + `FinancialAmount`              | Owned balance tabular display, privacy toggle, asset allocation segmented bar (Cash, Savings, Investments, Debts). |
| `MoneyHubAccounts`          | 3. Tài khoản thanh toán & Ví             | `SectionHeader` + `AccountRow`          | Depository accounts grouped with bank artwork, balance, account type.                                              |
| Credit Cards                | 4. Thẻ tín dụng & Dư nợ thẻ              | `SectionHeader` + `AccountRow`          | Debt tone, outstanding balance, credit limit (`Hạn mức: ...`), utilization %.                                      |
| `MoneyModuleCard` (Growing) | 5. Đang sinh lời (Savings & Investments) | `Card` + `SavingsRow` + `InvestmentRow` | Total principal + interest yield; holdings count + market value + gain/loss.                                       |
| `MoneyModuleCard` (Owed)    | 6. Nghĩa vụ nợ (Loans & Debts)           | `Card` + `LoanRow` + `PersonalDebtRow`  | Outstanding bank debt + upcoming installment; peer debts with mandatory text (`Cho vay` vs `Đi vay`).              |

---

## 3. Plan & Jars Overview (`/[locale]/plan`)

| Current Section     | Canonical Stitch Section (SCR-35) | Canonical Reusable Component            | Props & Semantics                                                                                     |
| :------------------ | :-------------------------------- | :-------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `TopAppBar`         | 1. Header: Kế hoạch ngân sách     | `TopAppBar` primary                     | Shared title/subtitle hierarchy and page-specific allocation action.                                  |
| `PlanHubHero`       | 2. Budget Hero                    | `Card` + `FinancialMetric`              | Total planned vs actual spent vs remaining capacity.                                                  |
| `PlanHubExceptions` | 3. Attention / Overspend Banner   | `InlineAlert` (variant: warning/danger) | Overspent jar count and reallocation reminder.                                                        |
| Jars List           | 4. Danh sách 6 Hũ chi tiêu        | `Card` + `ProgressSummary`              | Jar name, icon, planned/spent numbers, 100% clamped `Progress` bar, `Vượt mục tiêu` badge when >100%. |
| Upcoming Outflows   | 5. Khoản chi sắp tới (7 ngày)     | `Card` + `FinancialRow`                 | Event title, due date, committed amount.                                                              |

---

## 4. Inbox Overview (`/[locale]/inbox`)

| Current Section          | Canonical Stitch Section (SCR-41 / SCR-45) | Canonical Reusable Component     | Props & Semantics                                                                                 |
| :----------------------- | :----------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------ |
| `TopAppBar`              | 1. Header: Hộp thư xử lý                   | `TopAppBar` primary              | Shared title hierarchy, queue count, and privacy action.                                          |
| `InboxQueueTabs`         | 2. Segment Switcher                        | `SegmentedControl`               | 2 segments: `Đang mở (X)` vs `Đã lưu trữ`.                                                        |
| `InboxQueueList` Filters | 3. Kind Filters                            | `FilterChip` (horizontal scroll) | `Tất cả`, `Chưa phân loại`, `Đến hạn`, `Lệch số dư`.                                              |
| `InboxQueueList` Items   | 4. Attention Rows                          | `InboxRow` (Impl 05)             | 3px urgency accent strip (`urgent`, `normal`, `low`), category badge, impact amount, action link. |
| Empty Queue              | 5. Zero Pending Empty State                | `EmptyState` (SCR-45)            | Checkmark glyph, "Không còn việc tồn đọng", calm reassurance CTA.                                 |

---

## 5. Together Overview (`/[locale]/together`)

| Current Section         | Canonical Stitch Section (SCR-46) | Canonical Reusable Component        | Props & Semantics                                                                               |
| :---------------------- | :-------------------------------- | :---------------------------------- | :---------------------------------------------------------------------------------------------- |
| `TopAppBar`             | 1. Header: Cùng nhau              | `TopAppBar` primary                 | Shared title/subtitle hierarchy, active Together header tab, and Admin/Partner status.          |
| `TogetherHeroAvatars`   | 2. Household Hero                 | `Card` (surface) + `PersonIdentity` | Household avatar stack, total member count, admin role context.                                 |
| `TogetherMemberPreview` | 3. Danh sách thành viên           | `SectionHeader` + `MemberRow`       | Member avatar initials, display name, role badge (`Chủ hộ`, `Thành viên`), active presence dot. |
| Together Nav Links      | 4. Điều hướng quản trị hộ         | `Card` + `NavigationRow`            | Links to `Thành viên`, `Lời mời`, `Chính sách hộ`.                                              |
