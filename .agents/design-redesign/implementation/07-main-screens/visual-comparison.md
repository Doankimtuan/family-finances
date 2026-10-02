# Visual Comparison: Implementation 07 Correction Pass

## Overview

This document records the visual comparison between the baseline ("BEFORE") legacy UI, the migrated production UI ("AFTER"), and the canonical Google Stitch references across all five primary authenticated screens.

---

## 1. Home Dashboard (`/[locale]/home`)

- **Stitch Reference**: SCR-01 (Light: `c48a58d9f013494eb4bd4b2bc41d31d9`, Dark: `d4a4d84e44c94a05ae3bfeefc6df9e6f`)
- **Before Evidence**: Legacy UI featured full-width dark green gradient hero card (`tone="hero"`), plain text inbox warning, and non-canonical headers.
- **After Evidence**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/home_after_1790511315900.png`
- **English Locale**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/home_en_after_1790511480788.png`

### Major Legacy Differences Removed

1. Replaced legacy dark-green gradient hero card with canonical warm precision elevated card (`rounded-2xl border border-border-subtle bg-surface p-5 shadow-xs`) with teal status dot, uppercase tracking-wider subtitle, large tabular-nums balance, and monthly net change pill.
2. Replaced plain inbox banner with canonical amber card (`Card tone="warning"` with `bg-warning/10`, shield/notification icon, pulsing amber dot, and `Xử lý ngay →` CTA).
3. Redesigned cash flow section (`Dòng tiền`) into a canonical card containing the section header, subtitle, period control (Theo tháng / Theo quý), 3-column metric strip, and dual-line chart.
4. Structured 4 pillars of financial architecture (`Cấu trúc tài chính`) using canonical `BaseRow` items with semantic icon containers.
5. Standardized TopAppBar with household name, "Chung ví" pulse badge, and profile trailing cluster.

### Remaining Visual Differences & Classification

- Real data difference: Live total balance and transaction history reflect real database values rather than static Stitch mock data.

---

## 2. Money Overview (`/[locale]/money`)

- **Stitch Reference**: SCR-02 (Light: `31dcf3d3e06042d0973920dc3ad1a08d`, Dark: `b7af0cf462204bed9beedf116503c5d0`)
- **Before Evidence**: Contained legacy dark green position hero card and separate accounts card.
- **After Evidence**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/money_after_1790511355557.png`

### Major Legacy Differences Removed

1. Replaced legacy dark-green position hero card with canonical `VỊ THẾ TÀI CHÍNH TỔNG HỢP` elevated card with emerald indicator dot, net balance, multi-segment allocation bar (Thanh khoản, Tiết kiệm, Đầu tư), asset chips, and liability summary strip (`Nợ phải trả`).
2. Transformed accounts and liquid wallets into canonical white elevated card (`Tài khoản & Ví thanh toán`) with compact rows for each bank account, cash wallet, and credit card limit.
3. Transformed accumulation, investments, and debt obligations into canonical grouped sections using `BaseRow` composites with semantic icon containers and status badges.
4. Standardized TopAppBar with `Tiền` title and `Chung ví` badge.

### Remaining Visual Differences & Classification

- Real data difference: Accounts, credit cards, and investments show real user balances and providers.

---

## 3. Plan Overview (`/[locale]/plan`)

- **Stitch Reference**: SCR-35 (Light: `70749ca2e350497f9def0dadf235d3ba`, Dark: `893e91e4bced4fa4af9f44b8cd967316`)
- **Before Evidence**: Had dark-green hero budget card with white text.
- **After Evidence**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/plan_after_1790511386835.png`

### Major Legacy Differences Removed

1. Replaced dark-green hero budget card with canonical warm precision elevated card (`rounded-2xl border border-border-subtle bg-surface p-5 shadow-xs`).
2. Implemented clean period caption (`Kỳ kế hoạch`), current period month title, assist mode badge (`Chế độ hỗ trợ`), and privacy toggle.
3. Added health status strip with semantic icon container (`bg-emerald-50 text-emerald-700` for healthy, `bg-amber-50 text-amber-700` for attention, `bg-rose-50 text-rose-700` for off-track) and context metadata (`6 hũ ngân sách · Đã phân bổ 100%`).
4. Added bottom intention strip (`Thu nhập định chuẩn kỳ này`) with subtle top border and bold value.
5. Standardized TopAppBar with `Kế hoạch chi tiêu` title, `Chung ví` badge, and actions cluster.

### Remaining Visual Differences & Classification

- Real data difference: Active jars, goals, and recurring items reflect live Supabase planning envelopes.

---

## 4. Inbox Overview (`/[locale]/inbox`)

- **Stitch Reference**: SCR-41 (Light: `80394649d39f4c458d55e834611d45c2`, Dark: `1efc32d2855745c6ae118f880dafefe1`), SCR-45 (Empty: `354e2436922c475093af873d271fec77`)
- **Before Evidence**: Header and queue summary lacked elevated card geometry.
- **After Evidence**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/inbox_after_1790511421786.png`

### Major Legacy Differences Removed

1. Styled `InboxSummary` with canonical elevated card geometry (`rounded-2xl border border-border-subtle p-5 shadow-xs`) with state-dependent tone (soft surface when clear, warning surface when attention required).
2. Clean facts grid showing pending and archived counts.
3. Retained standardized `InboxQueueTabs` with accessible 44px filter buttons.
4. Preserved unified attention feed with `InboxRow` items featuring urgency accent strips and forward chevrons.

### Remaining Visual Differences & Classification

- Real data difference: Number of pending attention items reflects actual ledger transactions awaiting categorization.

---

## 5. Together Overview (`/[locale]/together`)

- **Stitch Reference**: SCR-46 (Light: `f45af37b153c4a739848e2bd0ed230e4`, Dark: `d0e81a7d33c047aaa1d163ba6caf18d8`)
- **Before Evidence**: Had dark-green container card with white text and square icon avatars.
- **After Evidence**: `file:///Users/doantuan/.gemini/antigravity-ide/brain/710ac116-f702-4ee2-821f-b1d6ff8cfc5d/together_after_1790511450804.png`

### Major Legacy Differences Removed

1. Replaced legacy dark-green container with canonical warm precision elevated card (`rounded-2xl border border-border-subtle bg-surface p-5 shadow-xs`).
2. Updated member avatars in `TogetherHeroAvatars` to rounded-full avatar pills with emerald styling (`bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-surface`).
3. Replaced white text with high-contrast semantic typography (`text-text-primary`, `text-text-secondary`, `text-text-muted`).
4. Replaced white separator border with subtle semantic divider (`border-border-subtle`).
5. Preserved member management links, pending invitations card, and policy navigation groups.

### Remaining Visual Differences & Classification

- Real data difference: Member list and pending invitations display the active household's actual participants.
