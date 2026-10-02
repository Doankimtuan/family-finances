# Component Reference Index — ViNha Component System (Task 11)

**Canonical Stitch Component Boards**:

- **Light Board**: `5c6805523e9644b9b233449304419296` ("HỆ THỐNG COMPONENT VINHA — LIGHT v2.0")
- **Dark Board**: `b07644fd6dad4c7c81b8a4bf1a51baff` ("HỆ THỐNG COMPONENT VINHA — DARK v2.0")
- **Design System Spec**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")

---

## 1. Component Family Mapping to Stitch Boards & Documentation

| Component Family       | Primary Primitive            | Variants / Subcomponents                                       | Canonical States                                  | Documentation Source                                        | Board Location              |
| ---------------------- | ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| **Buttons & Actions**  | `Button`                     | Primary, Tonal, Outlined, Destructive, Ghost                   | Default, Hover, Pressed, Focus, Loading, Disabled | `actions.md`                                                | Strip 2: Buttons & Actions  |
| **Icon Actions**       | `IconButton`                 | Standard, Primary Tint, Danger                                 | Default, Hover, Pressed, Focus, Disabled          | `actions.md`                                                | Strip 2: Icon Buttons       |
| **Floating Action**    | `FloatingAddCTA`             | Pill button (`+ Giao dịch`)                                    | Default, Pressed, Elevated (Shadow 2)             | `actions.md`                                                | Strip 2: Floating Action    |
| **Text Inputs**        | `TextInput`                  | Standard, Leading Icon, Trailing Icon                          | Default, Focus, Error, Disabled, Read-only        | `inputs.md`                                                 | Strip 3: Form Inputs        |
| **Currency Inputs**    | `CurrencyInput`              | Large Hero (32px), Standard (16px), Spoken Readout             | Tabular nums, Typing, Error, Read-only            | `inputs.md`, `financial-components.md`                      | Strip 3: Hero Currency      |
| **Quantity Inputs**    | `QuantityInput`              | Standard, With `MAX` quick button                              | Default, Focus, Over-capacity Error               | `inputs.md`, `financial-components.md`                      | Strip 3: Form Inputs        |
| **Password Inputs**    | `PasswordInput`              | Revealable password with eye toggle                            | Hidden, Visible, Error, Focus                     | `inputs.md`, `component-gaps-auth-onboarding.md`            | Strip 3 & Auth screens      |
| **Search Inputs**      | `SearchInput`                | Compact, Header Search                                         | Default, Active, Clear Affordance                 | `inputs.md`                                                 | Strip 3: Form Inputs        |
| **Closed Select**      | `Select`                     | Form Select, Compact Sort/Filter                               | Placeholder, Selected, Focus, Disabled            | `selection-controls.md`                                     | Strip 4: Selection Controls |
| **Open Dropdown**      | `SelectDropdown`             | Popover listbox, checkmark on active item                      | Open, Hovered item, Selected, Scrollable          | `selection-controls.md`                                     | Strip 4: Open Popover       |
| **Selection Controls** | `Checkbox`                   | Form Checkbox, Terms consent                                   | Unchecked, Checked, Indeterminate, Disabled       | `selection-controls.md`                                     | Strip 4: Selection Controls |
| **Radio Controls**     | `Radio`                      | Form Radio, Policy selection                                   | Unselected, Selected, Disabled                    | `selection-controls.md`                                     | Strip 4: Selection Controls |
| **Switches**           | `Switch`                     | Household policy toggle, Active state                          | Off, On, Disabled                                 | `selection-controls.md`                                     | Strip 4: Selection Controls |
| **Choice Tiles**       | `ChoiceTile`                 | Single, Group (`ChoiceTileGroup`)                              | Default, Selected, Disabled                       | `selection-controls.md`                                     | Strip 4: Choice Tiles       |
| **Segmented Controls** | `SegmentedControl`           | 2-segment, 3-segment switcher                                  | Segment Active, Inactive, Focus                   | `navigation.md`                                             | Strip 4 & Strip 7           |
| **Filter Chips**       | `FilterChip`                 | Horizontal filter pill bar                                     | Inactive, Active (Primary Tint)                   | `selection-controls.md`                                     | Strip 4: Filter Chips       |
| **List Rows**          | `TransactionRow`             | Expense (− Rose/Slate), Income (+ Emerald), Transfer (Sky)     | Default, Pressed                                  | `lists-and-rows.md`                                         | Strip 5: Transaction Rows   |
| **Instrument Rows**    | `InstrumentRow`              | Bank Account, Savings Contract, Loan, Investment               | Default, Pressed                                  | `lists-and-rows.md`                                         | Strip 5: Instrument Rows    |
| **Member Rows**        | `MemberRow`                  | Member avatar, name, role badge, email                         | Default, Admin, Partner                           | `lists-and-rows.md`                                         | Strip 5: Member Rows        |
| **Review Cards**       | `ReviewCard`                 | Unmapped Tx, Maturity decision, Policy change                  | Pending, Resolving, Resolved                      | `cards-and-surfaces.md`                                     | Strip 5 & Inbox suite       |
| **Status Badges**      | `StatusBadge`                | Success, Warning/Amber, Danger/Rose, Neutral, Info             | Fixed height 22px, pill radius                    | `feedback.md`                                               | Strip 6: Badges & Chips     |
| **Surfaces & Cards**   | `Card`                       | Canvas (0), Surface (1), Elevated (2)                          | 12px radius, hairline border                      | `cards-and-surfaces.md`                                     | Strip 6: Financial Cards    |
| **Ledger Invariant**   | `InvariantBanner`            | Sky blue invariant notice callout                              | Persistent advisory                               | `cards-and-surfaces.md`                                     | Strip 6: Invariant Callout  |
| **Feedback Toasts**    | `Toast`                      | Success, Action completed                                      | Floating bottom notification                      | `feedback.md`                                               | Strip 6: Toast Notification |
| **Overlays**           | `ActionSheet` / `Modal`      | Half-sheet modal, Dialog alert                                 | Closed, Open, Scrim backdrop                      | `overlays.md`                                               | SCR-03, SCR-16, SCR-50      |
| **State Components**   | `EmptyState`                 | Zero Pending, Zero Accounts, Zero Investments                  | Icon container, text, Primary CTA                 | `loading-empty-error.md`                                    | SCR-45, Domain empties      |
| **Loading & Error**    | `LoadingState`, `ErrorState` | Skeleton rows, full-screen retry                               | Shimmering placeholder, Error retry CTA           | `loading-empty-error.md`                                    | System screens              |
| **App Shell**          | `TopAppBar`                  | Hub title, Back chevron, Role pill, Avatar                     | Scrolled, Resting                                 | `navigation.md`                                             | Strip 1: Top App Bar        |
| **Bottom Nav**         | `BottomNavigation`           | 5 equal route tabs plus a separate floating transaction action | Active route, Inactive, Badge, Create action      | `navigation.md` · Stitch `468646066fc14f1f87f6080af33308eb` | 5-route Stitch reference    |
| **Progress Bar**       | `ProgressBar`                | Clamped 4px / 6px ratio indicator                              | 0% to 100% clamped, color semantics               | `feedback.md`, `financial-components.md`                    | Plan & Loan cards           |

---

## 2. Token Cross-Reference (Component Heights & Radii)

- **Touch Targets**: All interactive elements (Buttons, Inputs, Select triggers, Row tap regions, Tabs) maintain `min-height: 44px` (or `44×44px` for IconButtons).
- **Control Height**:
  - `Input` / `Select` / `Button`: `44px` height (Desktop/Mobile unified), `10px` border radius (`rounded-[10px]`).
  - `Large Hero Currency`: `64px` height container, `32px` font size, `12px` border radius.
- **Icon Containers**:
  - `Compact (Category)`: `32×32px`, `rounded-[10px]`, `20px` centered SVG.
  - `Default (Financial Instrument)`: `40×40px`, `rounded-[10px]`, `20px` centered SVG.
  - `Large (Detail Hero)`: `48×48px` or `56×56px`, `rounded-[14px]`.
- **Card Radius**: `12px` or `14px` border radius, `1px` solid border (`#DDE4E1` light / `#3F3F46` dark).
- **Sheet Radius**: `16px` top border radius (`rounded-t-2xl`).
