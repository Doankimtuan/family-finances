# Component to Screen Usage Matrix — ViNha Design System

**Canonical System**: Task 11 ViNha Component System (`DS-01`)  
**Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")

This document cross-references all canonical UI components against their approved usages across ViNha screens.

---

## 1. Interactive Actions & Buttons

| Component        | Variant / Subtype             | Canonical Height & Radius         | Primary Screen Usages                                                                                                                                                                                                | Notes                                                                    |
| ---------------- | ----------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Button`         | Primary (Filled Deep Teal)    | 44px min-height, 10px radius      | `/welcome`, `/login`, `/register`, `/together/onboard`, `/money/accounts/new`, `/money/savings/new`, `/money/investments/new`, `/money/loans/new`, `/money/debts/new`, `/plan/jars/new`, `/together/invitations/new` | Core primary CTA across forms, wizards, and resolution sheets            |
| `Button`         | Tonal (Soft Mint Tint)        | 44px min-height, 10px radius      | `/welcome` (Đăng nhập), `/inbox/:id` (Bỏ qua), `/together/members` (Quản trị), `/plan/jars/:id` (Điều chỉnh)                                                                                                         | Low-emphasis secondary actions                                           |
| `Button`         | Outlined (1px Hairline)       | 44px min-height, 10px radius      | `/money/investments/:id` (Sửa), `/money/loans/:id` (Lịch), `/together/policies` (Đặt lại)                                                                                                                            | Structured secondary actions on light/dark surfaces                      |
| `Button`         | Destructive (Rose/Crimson)    | 44px min-height, 10px radius      | `/together/members/remove-confirm`, `/money/savings/:id` (Rút trước hạn), `/money/debts/:id/edit` (Tất toán)                                                                                                         | Dangerous or irreversible lifecycle actions                              |
| `Button`         | Ghost (Text-only link)        | 44px min-height, inline           | `/together/onboard` (Bỏ qua), `/login` (Quên mật khẩu), `/register` (Đăng nhập)                                                                                                                                      | Quiet inline navigation and skip affordances                             |
| `IconButton`     | Standard / Circular Target    | 44×44px touch target, 10px radius | `TopAppBar` (Back, Search, Filter, Close), Modal dismiss (×), Password reveal                                                                                                                                        | 20px centered SVG glyph, visible focus ring                              |
| `FloatingAddCTA` | Floating Pill (`+ Giao dịch`) | 44px height, pill radius (9999px) | `/home`, `/money/accounts`, `/money/debts`                                                                                                                                                                           | Floating bottom right (16px above bottom nav), elevated shadow (Level 2) |

---

## 2. Form Inputs & Financial Entry

| Component           | Variant / Subtype           | Specs & Behavior                         | Primary Screen Usages                                                                                                               | Notes                                                                                      |
| ------------------- | --------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `TextInput`         | Standard Text Input         | 44px height, 10px radius, 14px font      | `/login` (Email), `/together/onboard` (Tên hộ), `/money/accounts/new` (Tên TK), `/together/invitations/new` (Email)                 | Optional leading/trailing icon slot; floating label pattern avoided                        |
| `PasswordInput`     | Revealable with Eye Toggle  | 44px height, 10px radius, 14px font      | `/login`, `/register`, `/reset-password`                                                                                            | Native show/hide eye toggle button with accessible label                                   |
| `HeroCurrencyInput` | Large Tabular Display       | 64px container, 32px font, tabular-nums  | `/money/transactions/new`, `/together/onboard` (Step 2)                                                                             | Real-time Vietnamese word pronunciation (_"Hai trăm năm mươi nghìn đồng"_); +50k-+1M chips |
| `AmountField`       | Standard Monetary Entry     | 44px height, 16px font, tabular-nums     | `/money/accounts/new`, `/money/savings/new`, `/money/loans/new`, `/money/debts/new`, `/plan/jars/new`, `/money/investments/:id/buy` | Vietnamese Dong (₫) prefix, period thousand separator (`.`), non-negative ceiling          |
| `QuantityInput`     | Fractional & Tabular        | 44px height, 14px font, tabular-nums     | `/money/investments/new`, `/money/investments/:id/buy`, `/money/investments/:id/sell`                                               | Supports decimals (e.g., `4.800 CCQ`); includes prominent `MAX` one-tap button on sell     |
| `PercentageField`   | Annual Rate / Yield         | 44px height, 14px font, `% / năm` suffix | `/money/savings/new`, `/money/loans/new`                                                                                            | Period decimal point (`6.20%`); numeric keypad binding                                     |
| `NumberInput`       | Integer Numeric Field       | 44px height, 14px font, step controls    | `/money/accounts/new-credit` (Kỳ sao kê: 20), `/money/loans/new` (Kỳ hạn: 240)                                                      | Positive integers only; bound to numeric keyboard                                          |
| `DateInput`         | Due / Valuation Date Picker | 44px height, 10px radius, calendar icon  | `/money/loans/:id/pay`, `/money/debts/new`, `/money/investments/:id/valuation`                                                      | Uses HeroUI / accessible popover calendar; ISO-8601 formatting                             |
| `SearchInput`       | Search Bar with Clear Icon  | 40px height, 10px radius                 | `/home` (TopAppBar), `/inbox`, `/inbox?tab=archived`, `/together/members`                                                           | Instant client filtering with clear `×` affordance                                         |
| `Textarea`          | Multiline Notes Input       | Min 80px height, 10px radius             | `/money/debts/:id/edit`, `/money/transactions/new`                                                                                  | Character limit countdown (max 200 chars)                                                  |

---

## 3. Selection Controls & Filters

| Component          | Variant / Subtype       | Interaction Model                        | Primary Screen Usages                                                                                | Notes                                                                                |
| ------------------ | ----------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Select` (Closed)  | Standard Form Select    | 44px height, 10px radius, chevron        | `/money/transactions/new` (Hũ), `/money/investments/:id/buy` (Nguồn tiền), `/inbox/:id` (Gán hũ)     | Displays placeholder or selected item with icon                                      |
| `SelectDropdown`   | Open Popover Listbox    | Floating card, 12px radius, shadow 2     | All `Select` interactions when active                                                                | Fixed viewport positioning, max 280px height with scroll, checkmark on selected item |
| `ChoiceTile`       | Single Selection Card   | 12px radius, 1px border, radio/indicator | `/together/onboard` (Presets), `/inbox/:id` (Maturity rules), `/plan/jars/new` (Phân bổ)             | Rich title, description, and icon; primary border tint when selected                 |
| `ChoiceTileGroup`  | Radio Group Container   | Vertical or horizontal flex              | `/together/policies` (3 policies), `/money/loans/new` (Amortization), `/money/debts/new` (Direction) | Mutually exclusive single selection                                                  |
| `Checkbox`         | Form Checkbox           | 20×20px box, 4px radius, checkmark       | `/login` (Ghi nhớ), `/register` (Điều khoản), `/plan/jars/new` (Danh mục)                            | Accessible check state with label                                                    |
| `Switch`           | Household Policy Toggle | 44×24px track, 20px knob                 | `/together/policies`, `/plan/jars/new` (Active state), `/money/debts/new` (Chia sẻ hộ)               | Smooth CSS transition; accessible aria-checked                                       |
| `SegmentedControl` | 2 or 3-segment switcher | 40px height, container with sliding pill | `/inbox` (Đang mở vs Đã lưu trữ), `/home` (Tháng vs Quý), `/money/debts` (Lend vs Borrow)            | High-contrast active segment container                                               |
| `FilterChip`       | Horizontal Pill Bar     | 32px height, pill radius (9999px)        | `/inbox` (Kind filters), `/money/loans/:id/schedule` (Tất cả, Sắp tới, Đã trả), `/money/debts`       | Scrollable horizontal container without scrollbar                                    |

---

## 4. Rows, Cards & Surfaced Displays

| Component         | Variant / Subtype                     | Content Layout                                | Primary Screen Usages                                                                    | Notes                                                                                        |
| ----------------- | ------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `TransactionRow`  | Expense (−), Income (+), Transfer (↔) | 40px icon, title + meta, right-aligned amount | `/home`, `/money/accounts/:id`, `/plan/jars/:id`, `/money/investments/:id`               | Tabular numbers; color semantics: Rose for expense, Emerald for income, Sky for transfer     |
| `InstrumentRow`   | Bank, Savings, Loan, Debt             | 40px icon, name + mask, right-aligned balance | `/money`, `/money/accounts`, `/money/loans`, `/money/debts`                              | Standardized 40×40px badge container; ownership tag chip; zero-debt reassurance              |
| `MemberRow`       | Household Member Row                  | 40px avatar, name + email, role badge         | `/together`, `/together/members`                                                         | Role badge (`Quản trị` Deep Teal vs `Đối tác` Slate); action menu trigger                    |
| `ReviewCard`      | Inbox Attention Card                  | 40px icon, title, description, amount, status | `/inbox` (SCR-41)                                                                        | Heterogeneous attention cards with unmapped tags, maturity alerts, and deep links            |
| `Card`            | Canvas Surface (Level 1)              | 12px or 14px radius, 1px hairline border      | All screens                                                                              | Elevated on dark mode (`#1C1C1F`), white on light mode (`#FFFFFF`)                           |
| `InvariantBanner` | Blue Advisory Callout                 | 10px radius, Sky blue container               | `/plan/jars/:id`, `/together/policies`, `/inbox/:id`, `/money/investments/:id/valuation` | **P0 Critical Invariant**: Explicit notification that action does not alter bank ledger cash |
| `StatusBadge`     | Semantic Tag / Pill                   | 22px height, pill radius, 11px font           | All screens                                                                              | Success (Emerald), Warning (Amber), Danger (Rose), Info (Sky), Neutral (Slate)               |
| `ProgressBar`     | Clamped Ratio Indicator               | 4px or 6px height, rounded ends               | `/plan` (Jars), `/money/loans/:id` (Repaid), `/money/cards/:id` (Utilization)            | Clamped strictly between 0% and 100%; over-budget triggers amber/rose styling                |

---

## 5. Navigation & Structural Shell

| Component          | Specs & Behavior                             | Primary Screen Usages                                             | Notes                                                                              |
| ------------------ | -------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `TopAppBar`        | 56px height, sticky top, safe-area top inset | All product screens                                               | Hub title, back affordance (`<`), role indicator, avatar, search affordance        |
| `BottomNavigation` | 56px height, 5 equal slots, sticky bottom    | `/home`, `/money`, `/plan`, `/inbox`, `/together`                 | Active tab container with primary mint tint; 24px centered icon + 11px label       |
| `AppViewport`      | Centered 440px frame, min-height 100vh       | Entire application                                                | Desktop horizontal centering with neutral backdrop; 100% width on mobile viewports |
| `ActionSheet`      | Bottom modal drawer, 16px top radius         | `/money/transactions/new`, `/money/savings/providers/new`, SCR-50 | Dimmed scrim backdrop (`rgba(0,0,0,0.65)`), drag handle, sticky action footer      |
| `EmptyState`       | Centered illustration, headline, CTA         | `/inbox` (SCR-45), `/money/investments` (Empty), `/plan`          | Calm non-alarmist illustration, reassuring copy, primary navigation button         |
