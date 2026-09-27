# ViNha Component Catalog & Design System

## 1. Foundations & Tokens

### Color Tokens

```css
:root {
  /* Canvas & Surfaces */
  --vn-canvas: #fafaf9;
  --vn-surface: #ffffff;
  --vn-surface-subtle: #f6f4f2;
  --vn-border: #dde4e1;
  --vn-border-subtle: #ebefef;

  /* Text & Foreground */
  --vn-text-primary: #18181b;
  --vn-text-secondary: #52525b;
  --vn-text-muted: #71717a;

  /* Financial Semantics */
  --vn-primary: #0f766e;
  --vn-primary-soft: #e7f5f1;
  --vn-income: #047857;
  --vn-income-soft: #ecfdf5;
  --vn-expense: #27272a;
  --vn-expense-soft: #f4f4f5;
  --vn-debt: #be123c;
  --vn-debt-soft: #fff1f2;
  --vn-transfer: #0369a1;
  --vn-transfer-soft: #f0f9ff;
  --vn-investment: #7c3aed;
  --vn-investment-soft: #f5f3ff;
  --vn-warning: #b45309;
  --vn-warning-soft: #fffbeb;
}

[data-theme="dark"] {
  --vn-canvas: #141416;
  --vn-surface: #1c1c1f;
  --vn-surface-subtle: #242428;
  --vn-border: #3f3f46;
  --vn-border-subtle: #2e2e33;

  --vn-text-primary: #f4f4f5;
  --vn-text-secondary: #a1a1aa;
  --vn-text-muted: #71717a;

  --vn-primary: #2dd4bf;
  --vn-primary-soft: #173b37;
  --vn-income: #34d399;
  --vn-income-soft: #064e3b;
  --vn-expense: #e4e4e7;
  --vn-expense-soft: #27272a;
  --vn-debt: #fb7185;
  --vn-debt-soft: #4c0519;
  --vn-transfer: #38bdf8;
  --vn-transfer-soft: #082f49;
  --vn-investment: #a78bfa;
  --vn-investment-soft: #2e1065;
  --vn-warning: #fbbf24;
  --vn-warning-soft: #451a03;
}
```

---

## 2. Core Layout Components

### Component: App Shell (`<AppShell>`)

- **Container**: Max width `440px`, centered horizontally on all screen sizes with `margin: 0 auto`.
- **Background**: Canvas background with subtle vertical shadow on desktop viewports.
- **Header**: Sticky 56px top app bar with safe area padding.
- **Footer**: Sticky 56px bottom navigation with safe area inset bottom.

### Component: Bottom Navigation (`<BottomNav>`)

- **Structure**: 5 equal slots (Home, Money, Plan, Inbox, Together).
- **Height**: 56px + env(safe-area-inset-bottom).
- **Slot Composition**:
  - Icon: 24×24px `AppIcon` (active stroke: 1.9px, inactive stroke: 1.5px).
  - Label: 11px Medium font.
  - Active color: `var(--vn-primary)`.
  - Inactive color: `var(--vn-text-muted)`.
  - Badge: Unread count on Inbox (e.g., pill with `14`).

### Component: Floating Add CTA (`<AddTransactionButton>`)

- **Visual**: Pill shape (`border-radius: 9999px`), background `var(--vn-primary)`, text `#FFFFFF`, icon `plus` 18px.
- **Position**: Floating 16px above the bottom navigation bar or integrated as an elevated action header.
- **Action**: Opens the Add Transaction Sheet.

---

## 3. Financial Card Primitives

### Component: Net Worth & Balance Card (`<BalanceHeroCard>`)

- **Container**: Surface container, 12px radius, 1px border.
- **Elements**:
  - Small header label ("Tổng tài sản khả dụng" / "Net Available Assets").
  - Primary Hero Numeral (e.g., `₫ 2.036.547.748` in 28px/32px bold tabular nums).
  - Sub-metrics split row:
    - Liquid Cash: `₫ 12.747.748` (emerald cash icon).
    - Locked Term Savings: `₫ 2.023.800.000` (violet savings icon).
  - Attention strip (if review items or overages exist).

### Component: Account Card (`<AccountRowCard>`)

- **Container**: 12px radius, 12px padding, horizontal layout.
- **Elements**:
  - 40×40px Icon container (10px radius) with bank / wallet glyph.
  - Title: Account name (e.g. "TP Bank chồng", "Ví thường").
  - Subtitle: Account type or last update time.
  - Right: Tabular amount in 15px 500-weight (e.g. `₫ 7.420.000`).

### Component: Transaction Row (`<TransactionRow>`)

- **Container**: 44px min touch target, 8px padding, horizontal stack.
- **Elements**:
  - 32×32px Category Icon Container (e.g. Fork/Knife for Dining, Cart for Shopping).
  - Stack:
    - Line 1: Concept / Merchant / Category name (14px 500-weight).
    - Line 2: Account name and date/time (12px muted).
  - Right: Amount formatted with sign and currency (`-₫ 120.000` or `+₫ 15.000.000`), colored neutrally for expenses (`--vn-expense`) and emerald for income (`--vn-income`).

### Component: Planning Jar Card (`<PlanJarCard>`)

- **Container**: 12px radius, 14px padding.
- **Elements**:
  - Jar icon + Jar Name (e.g. "Hũ chi tiêu trong tháng").
  - Allocated Capacity vs Actual Spent (e.g., `₫ 8.500.000 / ₫ 10.000.000`).
  - Progress bar:
    - Normal: Teal / Neutral fill (85%).
    - Over-budget: Warm Amber/Rose fill with explicit overage label: _"Vượt ₫809.244"_.
  - Inline action: "Điều chuyển" (Reallocate) button when over capacity.

### Component: Decision Inbox Card (`<ReviewItemCard>`)

- **Container**: 12px radius, 1px border with soft semantic left accent.
- **Elements**:
  - Category Badge: `SAVINGS_MATURITY` (Violet) or `UNMAPPED_EXPENSE` (Amber).
  - Primary Fact: Title and formatted financial impact.
  - Sub-context: Date, source account, interest accrued.
  - Action Row: Primary decision button (e.g. "Tái tục 3 tháng") + Secondary option ("Rút về tài khoản").

---

## 4. Canonical Reusable Component System (Task 11)

The complete canonical component system has been consolidated, standardized, and documented across 17 dedicated specifications in `.agents/design-redesign/component-system/`:

1. [Component Inventory](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/component-inventory.md): Master audit of all 44 recurring primitives and composites across all 50 canonical screens.
2. [Foundations](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/foundations.md): Color tokens, Geist typography, 4px spacing rhythm, 5-tier radii, control heights, touch targets, elevation, and motion.
3. [Actions & Buttons](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/actions.md): Button variants (Primary, Tonal, Outlined, Ghost, Destructive), sizes (sm/md/lg), states, icon buttons, and floating Add CTA.
4. [Form Inputs](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/inputs.md): TextInput, CurrencyInput (VND tabular nums & spoken words), QuantityInput (+MAX), PercentageInput, NumberInput, SearchInput, DateInput, and Textarea.
5. [Selection Controls](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/selection-controls.md): Select (closed), SelectDropdown (open popover), SearchableSelect, ActionMenu, Checkbox, Radio, Switch, SegmentedControl, Tabs, FilterChip, and StatusPill.
6. [Navigation Hierarchy](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/navigation.md): Canonical 5-tab BottomNav, TopAppBar variants, SectionHeader, and NavRow.
7. [Lists & Rows](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/lists-and-rows.md): BaseRow, TransactionRow, InstrumentRow, MemberRow, ReviewQueueRow, KeyValueRow, and divider rules.
8. [Financial Components](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/financial-components.md): FinancialAmount display, CalculatedPreview, ProgressBar primitives with 100% clamping, and Invariant Security Banner.
9. [Cards & Surfaces](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/cards-and-surfaces.md): SummaryHeroCard, GroupedListCard, ObjectCard, AttentionCard, and interactive card states.
10. [Feedback & Alerts](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/feedback.md): Toast notifications (4s auto-dismiss), InlineAlert (Info, Warning, Error, Success), and mobile Tooltip guidelines.
11. [Overlays & Sheets](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/overlays.md): BottomSheet (mobile workhorse), ModalDialog (high-impact destructive confirmation), and Backdrop scrim.
12. [Loading, Empty & Error](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/loading-empty-error.md): Skeleton placeholders, EmptyState variants (Zero pending, Zero debt), and friendly ErrorState patterns.
13. [Product-Specific Patterns](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/product-specific-components.md): MoneyPillarCard, JarEnvelopeCard, SavingsMaturityTile, DebtDirectionBadge, MembershipImpactSummary, and PolicyRuleTile.
14. [Accessibility Standards](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/accessibility.md): WCAG AA/AAA contrast matrix, 44×44px touch targets, focus visible rings, and screen-reader ARIA rules.
15. [Motion & Transitions](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/motion.md): Calibrated physics, 120ms press feedback, 250ms sheet slide, and reduced-motion zeroing.
16. [Component Usage Rules](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/component-usage-rules.md): Golden Do's & Don'ts per component family.
17. [Component Status Matrix](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/design-redesign/component-system/component-status.md): Master matrix tracking all states across 53 components in Light and Dark themes.
