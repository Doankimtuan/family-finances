# ViNha Component System — Cards, Containers & Surfaces

## 1. Card System Philosophy

In ViNha, Cards are purposeful structural containers, not decorative boxes. Arbitrary styling, heavy drop shadows, and nested card-in-card patterns are prohibited.

---

## 2. Standard Card Roles & Primitives

### A. Summary Hero Card (`<SummaryHeroCard>`)

Anchors the top of major dashboard screens (Home, Money, Accounts, Plan, Inbox, Together).

- **Dimensions**: Full width within the 440px viewport (padded 16px from edges).
- **Radius**: 12px (`--vn-radius-card`).
- **Internal Padding**: 16px (standard) / 20px (dashboard hero).
- **Anatomy**:
  - Contextual Eyebrow / Label (12px medium, e.g. _"Tổng tài sản khả dụng"_).
  - Primary Hero Numeral: 28px/32px bold tabular nums (`₫ 2.036.547.748`).
  - Fact Pill Cluster: Horizontal strip of 2–3 tonal fact pills (e.g. `Tiền mặt: ₫ 12.7M` · `Tiết kiệm: ₫ 2.02B`).
  - Action Slot: Integrated CTA button (e.g. `+ Giao dịch` or `Xem chi tiết`).

### B. Grouped List Card (`<GroupedListCard>`)

Encapsulates a sequence of related rows into a clean, unified container.

- **Radius**: 12px.
- **Border**: 1px solid `--vn-border`.
- **Background**: Surface white (`--vn-surface`) in Light / Slate (`#1C1C1F`) in Dark.
- **Children**: Houses multiple `<BaseRow>` items separated by inset 1px dividers. Eliminates border clutter between adjacent list items.

### C. Financial Object Card (`<ObjectCard>`)

Used for standalone financial items requiring individual card boundaries (e.g. Budget Jars, Loan Amortization Cards).

- **Radius**: 12px.
- **Padding**: 14px internal padding.
- **Header**: Icon + Title + Secondary Status Badge.
- **Body**: Metric comparison (e.g. `₫ 8.500.000 / ₫ 10.000.000`) + Progress Bar.
- **Footer**: Explanatory note or inline adjustment action.

### D. Attention & Action Card (`<AttentionCard>`)

Used for pending reviews, security warnings, and urgent financial notifications in Inbox and Overview screens.

- **Left Accent**: 3px solid vertical accent strip:
  - Amber (`--vn-warning`) for unsorted transactions or threshold alerts.
  - Rose (`--vn-debt`) for overdue loans or credit card limits.
  - Teal (`--vn-primary`) for proactive savings tips.
- **Background**: Subtle surface (`--vn-surface-subtle`).
- **Actions**: Two horizontal action buttons (Primary Affirmative + Ghost Dismiss).

---

## 3. Interactive Card States

Cards that trigger navigation or open sheets support explicit interaction states:

- **Default**: Resting 1px hairline border.
- **Hover**: Border highlights subtly to `--vn-border-focus`; ambient shadow rises slightly.
- **Pressed**: Subtle scale feedback (`transform: scale(0.995)`); transition 100ms.
- **Focus**: Accessible 2px outline offset by 2px when navigated via keyboard.
