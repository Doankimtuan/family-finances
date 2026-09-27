# Design Token Handoff — ViNha Warm Precision System

**Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")  
**Component Reference Boards**: `DS-01` Light (`5c680552...`) & Dark (`b07644fd...`)  
**Tailwind Configuration Base**: Tailwind CSS v3 / v4 compatible semantic CSS variables

---

## 1. Color Palette Tokens

### Canvas & Surface Tokens

| Token Name             | Light Value             | Dark Value            | CSS Variable               | Tailwind Class Equivalent            |
| ---------------------- | ----------------------- | --------------------- | -------------------------- | ------------------------------------ |
| **Canvas Background**  | `#FAFAF9` (Stone-50)    | `#141416` (Slate-950) | `--color-canvas`           | `bg-[var(--color-canvas)]`           |
| **Surface Card**       | `#FFFFFF` (White)       | `#1C1C1F` (Slate-900) | `--color-surface`          | `bg-[var(--color-surface)]`          |
| **Elevated Surface**   | `#FFFFFF`               | `#242428` (Slate-850) | `--color-surface-elevated` | `bg-[var(--color-surface-elevated)]` |
| **Popover / Dropdown** | `#FFFFFF`               | `#28282D` (Slate-800) | `--color-popover`          | `bg-[var(--color-popover)]`          |
| **Hairline Border**    | `#DDE4E1` (Neutral-200) | `#2E2E33` / `#3F3F46` | `--color-border`           | `border-[var(--color-border)]`       |
| **Text Primary**       | `#18181B` (Zinc-900)    | `#F4F4F5` (Zinc-100)  | `--color-text-primary`     | `text-[var(--color-text-primary)]`   |
| **Text Muted**         | `#52525B` (Zinc-600)    | `#A1A1AA` (Zinc-400)  | `--color-text-muted`       | `text-[var(--color-text-muted)]`     |

### Financial Semantic Tokens

| Semantic Role            | Light Hex               | Dark Hex                | Soft Container Light | Soft Container Dark | Usage Policy                                                     |
| ------------------------ | ----------------------- | ----------------------- | -------------------- | ------------------- | ---------------------------------------------------------------- |
| **Primary Brand**        | `#0D3331` / `#0F766E`   | `#2DD4BF`               | `#E7F5F1`            | `#173B37`           | Navigation anchors, primary buttons, active tabs                 |
| **Income / Positive**    | `#059669` (Emerald-600) | `#34D399` (Emerald-400) | `#ECFDF5`            | `#064E3B/40`        | Cash inflows, savings yield, investment gain, receivable (+₫)    |
| **Expense / Outflow**    | `#27272A` (Slate-800)   | `#E4E4E7` (Zinc-200)    | `#F4F4F5`            | `#27272A/50`        | Routine living expenses, non-alarmist negative outflows (−₫)     |
| **Debt / Liability**     | `#BE123C` (Rose-700)    | `#FB7185` (Rose-400)    | `#FFE4E6`            | `#3B1219/60`        | Credit card debt, unpaid loans, payables owed, critical overdues |
| **Transfer / Liquidity** | `#0369A1` (Sky-700)     | `#38BDF8` (Sky-400)     | `#E0F2FE`            | `#082F49/50`        | Inter-account transfers, debt relief preview, invariant banners  |
| **Investment / Growth**  | `#7C3AED` (Violet-600)  | `#A78BFA` (Violet-400)  | `#F5F3FF`            | `#2E1065/40`        | Market holdings, mutual funds, long-term capital assets          |
| **Warning / Attention**  | `#B45309` (Amber-700)   | `#FBBF24` (Amber-400)   | `#FEF3C7`            | `#451A03/50`        | Unmapped items, approaching maturity, over-budget warnings       |

---

## 2. Typography Scale (Geist Sans)

| Token Name          | Font Size | Weight         | Line Height | Letter Spacing | CSS Usage Directive                                     |
| ------------------- | --------- | -------------- | ----------- | -------------- | ------------------------------------------------------- |
| **Numeric Hero**    | 32px      | 600 (Semibold) | 40px        | -0.03em        | Net Wealth hero, Fast Add input (`tabular-nums`)        |
| **Numeric Large**   | 20px      | 600 (Semibold) | 28px        | -0.02em        | Section total balances, holding values (`tabular-nums`) |
| **Numeric Medium**  | 15px      | 500 (Medium)   | 20px        | -0.01em        | Transaction amounts, rate percentages (`tabular-nums`)  |
| **Display Large**   | 28px      | 600 (Semibold) | 36px        | -0.02em        | Welcome screen main headline                            |
| **Headline Large**  | 24px      | 600 (Semibold) | 32px        | -0.015em       | TopAppBar hub titles, Auth screen titles                |
| **Headline Medium** | 20px      | 600 (Semibold) | 28px        | -0.01em        | Card titles, section headers                            |
| **Title Medium**    | 16px      | 500 (Medium)   | 24px        | 0              | Dialog titles, card metric titles                       |
| **Body Large**      | 16px      | 400 (Regular)  | 24px        | 0              | Primary form input values (avoids iOS Safari auto-zoom) |
| **Body Medium**     | 14px      | 400 (Regular)  | 20px        | 0              | Standard description text, row concept labels           |
| **Label Medium**    | 12px      | 500 (Medium)   | 16px        | +0.01em        | Form field labels, card metadata, timestamps            |
| **Label Small**     | 11px      | 500 (Medium)   | 14px        | +0.02em        | Status pill text, BottomNavigation tab labels           |

---

## 3. Corner Radii & Border Widths

| Token Name       | Radius Value | Applied Components                                                                 | Tailwind Class   |
| ---------------- | ------------ | ---------------------------------------------------------------------------------- | ---------------- |
| `radius-xs`      | 4px          | Progress bar inner pill, atomic indicators                                         | `rounded`        |
| `radius-sm`      | 8px          | Status badges, compact tags                                                        | `rounded-lg`     |
| `radius-md`      | 10px         | **Primary control radius**: Form inputs, action buttons, 32px/40px icon containers | `rounded-[10px]` |
| `radius-lg`      | 12px         | Financial surface cards, list groupings                                            | `rounded-xl`     |
| `radius-xl`      | 14px         | Large metric cards, hero containers                                                | `rounded-[14px]` |
| `radius-2xl`     | 16px         | Overlays: ActionSheet top corners, Dialogs                                         | `rounded-2xl`    |
| `radius-full`    | 9999px       | FloatingAddCTA pill, user avatars, filter chips                                    | `rounded-full`   |
| **Border Width** | 1px          | All card boundaries, inputs, dividers (`border-[1px]`)                             | `border`         |

---

## 4. Spacing Rhythm (4px Base Grid)

| Spacing Token    | Pixel Value | Structural Usage                                         |
| ---------------- | ----------- | -------------------------------------------------------- |
| `space-1` (`xs`) | 4px         | Micro gap between icon and label, atomic badges          |
| `space-2` (`sm`) | 8px         | Internal control padding, gap between chips, row spacing |
| `space-3`        | 12px        | Internal card gap, input horizontal padding              |
| `space-4` (`md`) | 16px        | Standard card padding (`p-4`), page gutters (`px-4`)     |
| `space-6` (`lg`) | 24px        | Vertical spacing between primary page sections           |
| `space-8` (`xl`) | 32px        | Clearance before sticky bottom action bars               |

---

## 5. Control Heights & Touch Targets

- **Standard Interactive Control**: `44px` height (`h-11`), `10px` radius. Applies to `Button`, `TextInput`, `Select`, `DateInput`, `AmountField`.
- **Icon Button Target**: `44×44px` minimum bounding box (`min-w-[44px] min-h-[44px]`) with centered 20px SVG.
- **TopAppBar Height**: `56px` height (`h-14`) with top safe-area padding.
- **BottomNavigation Height**: `56px` height (`h-14`) with bottom safe-area padding.
- **Hero Currency Container**: `64px` height (`h-16`).

---

## 6. Icon System Standards (Warm Precision)

- **ViewBox**: Strict `0 0 24 24` master viewBox with 2px optical margin.
- **Stroke Width**: `1.5px` resting stroke, `1.9px` active/selected stroke.
- **Line Endings**: `stroke-linecap="round"` and `stroke-linejoin="round"`.
- **Coloring**: Always inherits via `currentColor`. Drop shadows and multi-tone fills prohibited.
- **Art Source**: Canonical stitch artwork in `shared/ui/stitch-icon-artwork.ts`.

---

## 7. Motion & Interaction Tokens

- **Library**: `motion/react` only. (No `framer-motion` imports).
- **Spring Presets**:
  - `snappy`: `{ stiffness: 400, damping: 30 }` (Button press, tab switch).
  - `gentle`: `{ stiffness: 200, damping: 25 }` (Sheet open/close, dialog reveal).
- **Animatable Properties**: Strict `transform` and `opacity` only. Never animate `width`, `height`, `margin`, or `padding`.
- **Accessibility**: When `prefers-reduced-motion: reduce` is detected, all transforms are disabled and short opacity fades (150ms) are used.
