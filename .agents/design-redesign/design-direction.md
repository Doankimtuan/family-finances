# ViNha Visual Design Direction: Warm Precision

## 1. Design Philosophy: Warm Precision

Family finances are emotionally loaded. Misunderstandings about money can provoke tension, anxiety, or defensiveness between partners.
The **Warm Precision** design direction counters this anxiety by establishing:

- **Absolute Calm & Stability**: The interface rejects loud, gamified fintech tropes (neon gradients, flashing celebratory animations, harsh alarm reds).
- **Humanistic Craft**: Warm stone and slate surfaces (`#FAFAF9` canvas, pure white card containers, hairline warm borders) paired with generous breathing room and tactile corner curves (12px).
- **Mathematical Exactness**: Numbers, balances, and ledger lines use Geist tabular figures (`tnum`) aligned to a rigid 4px optical baseline.
- **Bilingual Grace**: Typographic line heights (1.4x–1.5x) are engineered so Vietnamese stacked accents (e.g., `ẩ`, `ễ`, `ặ`) never collide or create vertical imbalance.

---

## 2. Color Palette & Financial Semantics

| Token                    | Light Value                | Dark Value            | Financial Role                                       | Prohibited Usage                           |
| ------------------------ | -------------------------- | --------------------- | ---------------------------------------------------- | ------------------------------------------ |
| **Primary Brand**        | `#0F766E` (Deep Teal)      | `#2DD4BF` (Teal)      | Household navigation, primary CTA, brand mark        | Never use for expenses or negative alerts  |
| **Income & Yield**       | `#047857` (Emerald)        | `#34D399` (Mint)      | Incoming salary, deposit yield, net positive balance | Never use for internal transfers           |
| **Expense**              | `#27272A` (Charcoal Slate) | `#E4E4E7` (Off-white) | Natural expenditures, merchant bills                 | Do NOT render expenses in alarming red!    |
| **Debt & Liabilities**   | `#BE123C` (Crisp Crimson)  | `#FB7185` (Rose)      | Credit card balances, loan liabilities, overdues     | Never use for planned routine living costs |
| **Transfer & Liquidity** | `#0369A1` (Sky Blue)       | `#38BDF8` (Sky)       | Inter-account balancing, wallet withdrawals          | Never count as an expense or revenue       |
| **Investment & Growth**  | `#7C3AED` (Deep Violet)    | `#A78BFA` (Lavender)  | Risk-bearing capital, gold, stock portfolios         | Do not conflate with liquid cash           |
| **Warning & Pending**    | `#B45309` (Warm Amber)     | `#FBBF24` (Amber)     | Uncategorized items, pending review decisions        | Do not use for general system warnings     |

---

## 3. Typographic System (Geist)

- **Display Hero**: 28px/34px (Mobile) - 32px/38px (Large), Weight 600, Tracking -0.02em. Used for primary balance displays.
- **Headline**: 20px/26px, Weight 600, Tracking -0.01em. Used for section titles.
- **Title / Metric**: 16px/22px, Weight 500. Used for card headers.
- **Body Regular**: 14px/20px, Weight 400. Used for explanations and secondary metadata.
- **Label / Caption**: 11px/14px, Weight 500, Tracking 0.02em. Used for navigation tabs and status badges.
- **Tabular Numerals**: All currency figures enforce `font-variant-numeric: tabular-nums`.

---

## 4. Surfaces, Radius & Elevation

- **Canvas (Level 0)**: `#FAFAF9` (Light) / `#141416` (Dark).
- **Cards & Rows (Level 1)**: `#FFFFFF` (Light) / `#1C1C1F` (Dark), bound by 1px solid hairline `#DDE4E1` (Light) / `#3F3F46` (Dark), 12px radius, no heavy drop shadow.
- **Overlays & Modals (Level 2)**: 16px radius, soft ambient diffused shadow:
  - Light: `0 8px 24px -4px rgba(24, 24, 27, 0.08)`
  - Dark: `0 8px 24px -4px rgba(0, 0, 0, 0.45)`
- **Pills**: `9999px` full roundness reserved for tags, chips, and the floating Add CTA.

---

## 5. Icon Family Integration

- Rendered strictly via `AppIcon` from `shared/ui/stitch-icon-artwork.ts`.
- 24×24px master viewBox with 2px optical margin.
- 1.5px consistent stroke with round joins and caps.
- Monochromatic glyphs inheriting `currentColor`.
- Rendered inside 32×32px (transaction rows) or 40×40px (account cards) containers with 10px corner radius.
