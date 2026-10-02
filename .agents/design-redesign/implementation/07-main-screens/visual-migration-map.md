# Visual Migration Map: Implementation 07 Correction Pass

## Purpose

This document maps every legacy screen section across the five main tabs to its exact canonical Stitch composition, target component, and source file.

---

## 1. Home Dashboard (`/[locale]/home`)

- **Stitch Reference**: SCR-01 (Light: `c48a58d9f013494eb4bd4b2bc41d31d9`, Dark: `d4a4d84e44c94a05ae3bfeefc6df9e6f`)

| Current Legacy UI Section                                               | Canonical Stitch Composition                                                                                                                                                                                                                                  | Target Component / Styling                                           | Source File                                               |
| :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Top App Bar**: Contextual greeting banner with full-width text        | **Canonical TopAppBar**: Left household icon tile (teal-50), household name + "Chung ví" pulse badge, subtitle. Right action buttons (Search, Notification with dot, Avatar badge).                                                                           | `TopAppBar` with household leading tile and profile trailing cluster | `app/[locale]/(product)/home/home-streaming-sections.tsx` |
| **Hero Card**: Dark green gradient card (`tone="hero"`) with white text | **Asset Hero Card**: White/zinc-900 rounded-2xl card, small teal dot + `TỔNG TÀI SẢN HIỆN HỮU` uppercase tracking-wider text, large tabular-nums net asset balance, supporting description, bottom border with monthly net change pill + `Xem sao kê →` link. | `Card tone="elevated"` + `Balance` (dark text) + Net Delta Badge     | `app/[locale]/(product)/home/home-financial-pulse.tsx`    |
| **Inbox CTA**: Warning card with standard icon                          | **Decision Inbox Banner**: Amber-50/950 card with shield icon, `Cần xử lý (N)` heading with amber pulse dot, description, and `Xử lý ngay →` CTA.                                                                                                             | `HomeInboxCta` with canonical amber banner styling                   | `app/[locale]/(product)/home/home-inbox-cta.tsx`          |
| **Plan Pulse**: Plain text card with allocation mode                    | **Plan Quick Pulse / Attention**: Clean elevated card showing jar allocation status and link to Plan.                                                                                                                                                         | `HomePlanPulse` with elevated card styling                           | `app/[locale]/(product)/home/home-plan-pulse.tsx`         |
| **Cash Flow**: Legacy chart card                                        | **Canonical Dòng tiền**: White rounded-2xl card with segmented control (Theo tháng / Theo quý), 3-col metric strip (Dòng ròng, Tổng Thu, Tổng Chi), clean area chart with dual lines and legends.                                                             | `HomePeriodStory` / `HomeCashFlowChart`                              | `app/[locale]/(product)/home/home-period-story.tsx`       |
| **Product Summaries**: Stacked dark/grey cards                          | **Cấu trúc tài chính (4 Trụ cột)**: Section header with link to `/money`, 4 clean rounded-xl cards with semantic icon containers (Tiết kiệm, Đầu tư, Khoản vay & Thế chấp, Vay mượn cá nhân).                                                                 | `HomeProductSummariesStreaming` composing `BaseRow`                  | `app/[locale]/(product)/home/home-product-summaries.tsx`  |

---

## 2. Money Overview (`/[locale]/money`)

- **Stitch Reference**: SCR-02 (Light: `31dcf3d3e06042d0973920dc3ad1a08d`, Dark: `b7af0cf462204bed9beedf116503c5d0`)

| Current Legacy UI Section                                   | Canonical Stitch Composition                                                                                                                                                                                                                                                                           | Target Component / Styling                                          | Source File                                             |
| :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------ |
| **Top App Bar**: Simple title                               | **Canonical TopAppBar**: Roof icon tile, `Tiền` title + `Chung ví` badge, subtitle, Search + Notif + Avatar actions.                                                                                                                                                                                   | `TopAppBar`                                                         | `app/[locale]/(product)/money/page.tsx`                 |
| **Position Hero**: Dark green gradient card (`tone="hero"`) | **Vị thế tài chính tổng hợp**: White/zinc-900 rounded-2xl card with green indicator dot, uppercase subtitle, large net worth balance, multi-segment allocation bar (Thanh khoản, Tiết kiệm, Đầu tư), allocation chips, and bottom liability summary strip (`Nợ phải trả: ₫ 0` + `Xem sổ giao dịch →`). | `MoneyPositionHero` with white elevated card & asset allocation bar | `app/[locale]/(product)/money/money-position-hero.tsx`  |
| **Accounts Section**: Separate full list                    | **Tài khoản & Ví thanh toán**: White rounded-2xl card with Wallet icon, total liquidity amount, compact account list items (TPBank, Tiền mặt, MoMo, VCB, Thẻ tín dụng với hạn mức), and link `Quản lý danh sách tài khoản →`.                                                                          | `MoneyHubAccounts`                                                  | `app/[locale]/(product)/money/money-hub-accounts.tsx`   |
| **Domain Modules**: Basic list                              | **Tích lũy & Đầu tư / Nghĩa vụ nợ**: Grouped sections with clean canonical rows (Tiết kiệm có kỳ hạn, Đầu tư sinh lời, Khoản vay, Vay mượn cá nhân) with status badges and forward chevrons.                                                                                                           | `MoneyModuleSection`                                                | `app/[locale]/(product)/money/money-module-section.tsx` |

---

## 3. Plan Overview (`/[locale]/plan`)

- **Stitch Reference**: SCR-35 (Light: `70749ca2e350497f9def0dadf235d3ba`, Dark: `893e91e4bced4fa4af9f44b8cd967316`)

| Current Legacy UI Section                             | Canonical Stitch Composition                                                                                                                                                                                                                                                                                         | Target Component / Styling                     | Source File                                           |
| :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- | :---------------------------------------------------- |
| **Top App Bar**: Legacy header                        | **Canonical Plan TopBar**: Title `Kế hoạch chi tiêu`, subtitle, `+ Phân bổ` action button, Month selector dropdown + `Chế độ hỗ trợ` badge.                                                                                                                                                                          | `TopAppBar`                                    | `app/[locale]/(product)/plan/page.tsx`                |
| **Hero Budget Card**: Dark green card (`tone="hero"`) | **Plan Context Hero Card**: White/zinc-900 rounded-2xl card, warning/success status pill (`Cần lưu ý 1 hũ vượt`), day progress indicator (`Ngày 26/31 của tháng · Tiến độ 83%`), subtext with calculated income, dual-segment progress bar with "Hôm nay" marker, 3-column summary (Tổng kế hoạch, Đã chi, Còn lại). | `PlanHubHero` with canonical white card layout | `app/[locale]/(product)/plan/plan-hub-hero.tsx`       |
| **Decision Recommendations**: Big cards               | **Decisions & Attention**: Warning callouts and action rows for overspent jars and unmapped transactions.                                                                                                                                                                                                            | `PlanHubExceptions` & `RecommendationList`     | `app/[locale]/(product)/plan/plan-hub-exceptions.tsx` |
| **Jars Section**: Plain list                          | **Danh sách Hũ ngân sách**: Structured list of jars with category icon, planned/spent/remaining labels, progress bars, and overspent danger pills.                                                                                                                                                                   | `PlanHubWorkRow`                               | `app/[locale]/(product)/plan/plan-hub-work-row.tsx`   |

---

## 4. Inbox Overview (`/[locale]/inbox`)

- **Stitch Reference**: SCR-41 (Light: `80394649d39f4c458d55e834611d45c2`, Dark: `1efc32d2855745c6ae118f880dafefe1`), SCR-45 (Empty: `354e2436922c475093af873d271fec77`)

| Current Legacy UI Section                  | Canonical Stitch Composition                                                                                                                                                          | Target Component / Styling     | Source File                                         |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------- | :-------------------------------------------------- |
| **Header & Queue Hero**: Full green banner | **Queue Hero**: Clean elevated container with unread counter, queue state tabs (`Đang mở (N)` / `Đã lưu trữ`), search bar, filter chips (`Tất cả`, `Chi chưa gắn hũ`, `Phân bổ thu`). | `InboxQueueHero` & `TopAppBar` | `app/[locale]/(product)/inbox/page.tsx`             |
| **Queue Feed**: Heterogeneous cards        | **Canonical Attention Feed**: Standardized `InboxRow` items with urgency accent strip, category icon, description, amount, and forward chevron.                                       | `InboxQueueList`               | `app/[locale]/(product)/inbox/inbox-queue-list.tsx` |
| **Empty State**: Minimal text              | **Dignified Inbox Zero**: Clean checkmark circle, `Tuyệt vời! Không còn việc chờ xử lý`, overview CTA.                                                                                | `EmptyState` matching SCR-45   | `app/[locale]/(product)/inbox/page.tsx`             |

---

## 5. Together Overview (`/[locale]/together`)

- **Stitch Reference**: SCR-46 (Light: `f45af37b153c4a739848e2bd0ed230e4`, Dark: `d0e81a7d33c047aaa1d163ba6caf18d8`)

| Current Legacy UI Section                | Canonical Stitch Composition                                                                                                                  | Target Component / Styling             | Source File                                                |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- | :--------------------------------------------------------- |
| **Top App Bar**: Simple text             | **Together TopAppBar**: Title `Gia đình`, subtitle, household badge `Chúm ta`, role badge `Đối tác`.                                          | `TopAppBar`                            | `app/[locale]/(product)/together/page.tsx`                 |
| **Household Hero**: Dark green container | **Household Identity Card**: White/zinc-900 rounded-2xl card with member avatar stack, household tier, active member count, and role context. | `TogetherHero` with white card styling | `app/[locale]/(product)/together/together-hero.tsx`        |
| **Member List**: Custom card block       | **Member Roster**: Clean list with `MemberRow`, avatar with initials, email/name, role badge (`Quản trị`, `Đối tác`), and membership status.  | `TogetherMemberList`                   | `app/[locale]/(product)/together/together-member-list.tsx` |
| **Pending Invites**: Inline alert        | **Invitations Card**: Dedicated invite card with copy link and revoke actions.                                                                | `TogetherInvitationsSection`           | `app/[locale]/(product)/together/together-invitations.tsx` |
