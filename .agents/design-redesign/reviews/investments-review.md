# Investments Experience Review

## Existing Investment Model

ViNha models investments as quantity-bearing financial positions with marked-to-market valuations (`modules/investments/application/investment-constants.ts`, `modules/investments/domain/investment-domain.ts`, `modules/investments/application/commands/investment-commands.schema.ts`).

Core formula:
$$\text{Giá trị thị trường (Current Value)} = \text{Số lượng (Quantity)} \times \text{Đơn giá hiện tại (Current Price Per Unit)}$$

An investment holding entity in ViNha contains:

- `id`: Unique identifier of the investment holding position.
- `assetName`: Display name of the asset (e.g., _Chứng chỉ quỹ DCDS_, _Cổ phiếu FPT_, _Vàng nhẫn tròn trơn 9999_, _Bitcoin_).
- `assetClass` (`InvestmentAssetClass`): `fund`, `stock`, `gold`, `crypto`, `bond`.
- `symbol`: Ticker or trading code (e.g., `DCDS`, `FPT`, `BTC`, `SJC`).
- `quantity`: High-precision decimal string (up to 18 decimal places in storage, 8 for crypto, 2–4 for funds, integer for stocks).
- `remainingTotalCostBasis`: Total remaining cost basis of the active holding position.
- `averageCost`: Derived weighted average cost per unit ($\text{remainingTotalCostBasis} / \text{quantity}$).
- `accountingMethod`: `WEIGHTED_AVERAGE` (default for stock, crypto, manual assets) or `FIFO` (default for funds, gold).
- `currentUnitPrice`: Current market price per unit (NAV for funds, buy-back price for gold, last trade for stocks/crypto).
- `currentValue`: Derived current market valuation ($\text{quantity} \times \text{currentUnitPrice}$).
- `unrealizedResult`: Unrealized gain/loss ($\text{currentValue} - \text{remainingTotalCostBasis}$).
- `realizedResult`: Accumulated realized profit/loss from past closed lots.
- `providerCustodian`: Brokerage or platform custodian (e.g., _Dragon Capital / Fmarket_, _TCBS_, _Bảo Tín Minh Châu_, _Binance_).
- `visibilityContext`: Household sharing scope (`household` / _Chung ví_ vs `unclear` / private).
- `valuationQuality` & `freshness`: `AUTO_CURRENT`, `AUTO_STALE`, `MANUAL`.

---

## Asset Types

ViNha supports 5 canonical asset classes (`InvestmentAssetClass`):

| Asset Class | Vietnamese Label | Pricing Unit Concept                             | Default Custodian Example            |
| ----------- | ---------------- | ------------------------------------------------ | ------------------------------------ |
| `FUND`      | Quỹ mở (CCQ)     | Giá trị tài sản ròng / CCQ (`NAV_PER_UNIT`)      | Fmarket, Dragon Capital, VinaCapital |
| `STOCK`     | Cổ phiếu         | Giá khớp lệnh / Cổ phiếu (`UNIT_PRICE`)          | TCBS, SSI, VPS, VNDIRECT             |
| `GOLD`      | Vàng tích trữ    | Giá mua lại / Chỉ hoặc Lượng (`BUYBACK_PRICE`)   | Bảo Tín Minh Châu, SJC, DOJI         |
| `CRYPTO`    | Tiền mã hóa      | Giá giao ngay / Token (`UNIT_PRICE` in VND/USDT) | Binance Spot, Onus                   |
| `BOND`      | Trái phiếu       | Mệnh giá / Tổng giá trị (`TOTAL_VALUE`)          | Techcombank, TCBS                    |

---

## Investment Overview

- **Route**: `/money/investments`
- **Screens**:
  - Light: `48f9de1f42e84169ab9b0642e62e97bf`
  - Dark: `7936e0227fae4afdab77b28f3c759e94`
- **Architecture & Scannability**:
  1. **Top App Bar**: Sticky navigation with 44×44px back button to `/money`, title _"Đầu tư & Tài sản"_, asset badge, household subtitle, and header CTA `+ Thêm khoản`.
  2. **Top Portfolio Summary Hero**:
     - Large tabular metric: **₫ 285.500.000** with privacy eye toggle.
     - Ring-fencing guardrail banner: _"Ước tính giá trị thị trường, không phải tiền mặt sẵn sàng chi tiêu cho sinh hoạt gia đình."_
     - 3-column financial strip:
       - Giá vốn đã biết: **₫ 250.000.000**
       - Lãi chưa thực hiện: **+₫ 35.500.000 (+14.2%)** [Emerald]
       - Lãi đã thực hiện: **+₫ 12.000.000** [Emerald]
  3. **Asset Allocation Bar**:
     - Visual proportional progress track: Quỹ CCQ 55% (`#0F766E`), Cổ phiếu 25% (`#38BDF8`), Vàng 15% (`#F59E0B`), Tiền mã hóa 5% (`#8B5CF6`).
  4. **Search & Filter Bar**:
     - Instant filter chips: _Tất cả (5)_, _Quỹ CCQ (2)_, _Cổ phiếu (1)_, _Vàng (1)_, _Tiền mã hóa (1)_.
  5. **Holdings Tabs**:
     - Sub-segment: _Đang nắm giữ (5)_ vs _Đã tất toán (1)_.
  6. **Holdings List**:
     - 5 verified holdings with 40×40px badge wrappers, asset ticker, quantity, unit price, total market value, and unrealized profit badge.
  7. **Docked 5-Tab Navigation**: Canonical bottom bar with active indicator on _Tiền_.

---

## Add Investment

- **Route**: `/money/investments/new`
- **Screens**:
  - Light: `3eefdaec2a0d406996d33cb93a621a19`
  - Dark: `540e12aba7514a7894845caa82ae5869`
- **Wizard Structure**:
  - Step 1: Chọn loại tài sản (Quỹ CCQ, Cổ phiếu, Vàng, Tiền mã hóa, Trái phiếu).
  - Step 2: Nhập số lượng & Đơn giá (với tính toán tự động giá trị thị trường).
  - Step 3: Xem lại & Xác nhận tạo vị thế.

---

## Add Existing Investment

- **Domain Accounting Law (P0)**: The form features an explicit **Creation Mode Switcher**:
  - **Tab A — Sở hữu từ trước (`HISTORICAL` / `OPENING_POSITION`)**:
    - For investments acquired prior to using ViNha.
    - Locks `cashAccountId: null`.
    - No cash is deducted from household checking accounts.
    - Historical acquisition date is entered (`asOfDate < todayIsoDate()`).
    - User enters original cost per unit (`costPerUnit`) or total cost basis (`totalBasisInput`), plus current unit price (`currentUnitValuation`).
    - **Guaranteed P0 Law**: Does **NOT** generate artificial income, spending, or cash outflows, preserving household cash-flow integrity.
  - **Tab B — Mua mới hôm nay (`PURCHASE`)**:
    - For new acquisitions executed today.
    - Requires selecting funding cash account (`cashAccountId`).
    - Deducts funds immediately as an inter-asset liquidity transfer.

---

## Quantity UX

- **First-Class Dimension**: Quantity is never hidden or merged into total value.
- **Precision Discipline**:
  - Crypto: Up to 8 decimal places (e.g. `0.0092 BTC`).
  - Mutual funds: Up to 2–4 decimal places (e.g. `4.000 CCQ` or `1.250,50 CCQ`).
  - Gold: Up to 2 decimal places (e.g. `5,00 chỉ`).
  - Stocks: Integer quantities (e.g. `500 CP`).
- **Touch Steppers**: `[-]` and `[+]` adjusters provided alongside numerical keyboard entry.

---

## Unit Price UX

- **Single Unit Clarity (P0)**: All input labels explicitly read:
  - _"Giá vốn mỗi đơn vị (₫ / CCQ)"_
  - _"Đơn giá mua mỗi đơn vị (₫ / CP)"_
  - _"Giá thị trường mới cho mỗi đơn vị (₫ / Token)"_
- **No Confusion with Total Value**: The user never enters total value in place of unit price. Total value is derived and displayed with explicit multiplication notation:
  $$\text{Số lượng} \times \text{Đơn giá} = \text{Tổng giá trị}$$
- **Quick Stepper Chips**: `+500`, `+1.000`, `+2.000`, `+5.000` for rapid adjustment.

---

## Cost Basis

- **Accounting Principles**:
  - `WEIGHTED_AVERAGE`: Weighted average cost basis per unit ($C_{\text{avg}} = \frac{\sum \text{Cost}}{\sum \text{Qty}}$). Used for stocks, crypto, and general assets.
  - `FIFO`: First-in, first-out lot consumption. Used for mutual funds and physical gold where tax and holding duration rules apply.
- **Cost vs Market Value**: Cost basis is kept strictly segregated from current market valuation on all cards and tables.

---

## Market Value

- **Valuation Calculation**:
  $$\text{Market Value} = \text{Active Quantity} \times \text{Current Unit Price}$$
- **Non-Cash Indicator**: Every screen displaying portfolio market value carries the standard ViNha guardrail:
  > _"Ước tính giá trị thị trường, không phải tiền mặt sẵn sàng chi tiêu cho sinh hoạt gia đình."_

---

## Buy Flow

- **Route**: `/money/investments/:id/buy`
- **Screens**:
  - Light: `f844c0c1417b42c5842b1754d08913bf`
  - Dark: `f8cf1bba9cf643ccac3e8dd668f19b80`
- **Key Workflow**:
  1. Shows current asset context: `4.000 CCQ · NAV ₫ 30.000 / CCQ`.
  2. Enter additional quantity to purchase: `1.000 CCQ` (with quick chips `+100`, `+500`, `+1.000`).
  3. Enter purchase unit price: `₫ 30.000 / CCQ` (synced to market NAV).
  4. Select funding bank account: _Techcombank chồng_ (showing available liquid cash).
  5. Derived preview displays:
     - Tổng tiền trích thanh toán: `₫ 30.000.000`
     - Số lượng mới: `5.000 CCQ`
     - Giá vốn bình quân mới: `₫ 26.000 / CCQ`
     - Accounting note: _"Đây là chuyển đổi tài sản, không tính là chi phí sinh hoạt."_

---

## Sell Flow

- **Route**: `/money/investments/:id/sell`
- **Screens**:
  - Light: `0f00e9296e1f42498e32093b5678efb3`
  - Dark: `05f20908b5d7488083cb56a8500e8062`
- **Key Workflow**:
  1. Shows available units: `Khả dụng: 4.000 CCQ`.
  2. Quantity input with `Tất cả (MAX)` button and percentage chips (`25%`, `50%`, `100%`).
  3. Enter sell unit price: `₫ 30.000 / CCQ`.
  4. Select destination checking account: _Techcombank chồng_.
  5. Fees and personal income tax (TNCN 0.1%): `₫ 150.000`.
  6. Derived preview displays:
     - Gross proceeds: `₫ 45.000.000`
     - Fees & taxes: `−₫ 150.000`
     - Net proceeds: `₫ 44.850.000`
     - Realized PnL: `+₫ 7.350.000 (+19.6%)` based on disposed cost basis `₫ 37.500.000`.
     - Remaining position: `2.500 CCQ (₫ 75.000.000)`.

---

## MAX Behavior

- The `Tất cả (MAX)` button sits directly adjacent to the sell quantity field.
- Clicking `MAX` automatically populates the input with the exact available quantity (`4.000 CCQ`).
- It does **not** alter the unit price or fees.
- It provides a safe, one-tap full position liquidation shortcut.

---

## Update Unit Price

- **Route**: `/money/investments/:id/valuation`
- **Screens**:
  - Light: `00b35540ef36427383ee43c86953d368`
  - Dark: `99c1c510c84b4fd7adb317a9b9459ac5`
- **Non-Transaction Semantics (P0)**:
  - Top alert banner: _"Cập nhật giá thị trường cho mỗi đơn vị tài sản. Thao tác này KHÔNG tạo ra giao dịch mua bán và KHÔNG làm phát sinh dòng tiền mặt gia đình."_
- **Inputs**:
  - New market price per unit: `₫ 32.500 / CCQ` (with quick stepper chips `+500`, `+1.000`, `+2.000`).
  - Valuation date: `26/09/2026`.
  - Reference source: _Sao kê Fmarket / Công bố quỹ_.
- **Derived Valuation Impact Preview**:
  - New market value: `4.000 CCQ × ₫ 32.500 = ₫ 130.000.000`
  - Asset growth: `+₫ 10.000.000`
  - Updated unrealized PnL: `+₫ 30.000.000 (+30.0%)`
  - Cash impact: `₫ 0 (Không thay đổi số dư tiền mặt tài khoản)`.

---

## Investment Detail

- **Route**: `/money/investments/:id`
- **Screens**:
  - Light: `a88d7b15c1d64880bf6484c1a844cb13`
  - Dark: `c90bc3cb8a7943ae894a11608a2ca5cb`
- **Information Architecture**:
  1. Top App Bar with back button, asset title, ticker, and overflow menu.
  2. Hero Card: Asset emblem, headline market value (**₫ 120.000.000**), formula breakdown (`4.000 CCQ × ₫ 30.000`), household ownership badge (_"• Chung ví"_), and live sync tag.
  3. Action Buttons Bar: `+ Mua thêm`, `Bán`, `Cập nhật giá`, and `...` more options.
  4. Financial Facts Card: 8 structured metrics covering cost basis, average unit cost, unrealized gain, realized gain, units held, latest NAV, custody platform, and holding duration.
  5. Household Context Banner: Percentage of fund portfolio (42.1%) and total family assets (5.4%).
  6. Activity History Timeline: Audit trail of historical acquisitions, purchases, and valuation updates.

---

## Investment Activity

The activity timeline reflects verified events:

1. `OPENING_POSITION`: Initial pre-existing balance import.
2. `BUY`: Capital deployment from a checking account.
3. `SELL`: Capital liquidation into a checking account.
4. `VALUATION`: Periodic market price adjustment (marked as non-cashflow).
5. `INVESTMENT_INCOME`: Cash dividend or fund distribution credited to a checking account.

---

## Gain/Loss Semantics

- **Unrealized Gain/Loss**: Marked with clear sign (`+` or `−`), VND monetary value, and percentage gain relative to cost basis. Uses soft emerald (`#047857` / `#34D399`) for gains and soft rose (`#BE123C` / `#FB7185`) for losses.
- **Realized Gain/Loss**: Computed strictly on closed positions after deducting fees and personal taxes.
- **Zero Neon Aesthetics**: Calm, stable, and readable without flashing stock-market ticker distractions.

---

## Provider / Platform

- Platforms (Fmarket, Dragon Capital, TCBS, Bảo Tín Minh Châu, Binance) are treated as **Custodians / Exchanges**, not liquid bank checking accounts.
- Transactions clearly distinguish between the investment custodian and the household checking account providing or receiving liquidity.

---

## Form Consistency

Across Add Investment, Buy, Sell, and Update Price:

- Equivalent fields use identical components (`DecimalField`, `NumberField`, `SelectField`).
- Currency units are always displayed as `₫ / đơn vị` or `₫`.
- Live derived calculation cards share an identical visual language, border radius, and typography across all operation sheets.

---

## Financial Semantics

- [x] **Số lượng $\ne$ Giá trị**: Quantity is explicitly preserved and distinct from monetary value.
- [x] **Giá mỗi đơn vị $\ne$ Tổng giá trị**: User always inputs price per single unit.
- [x] **Giá vốn $\ne$ Giá trị thị trường**: Cost basis and current market valuation are distinctly labeled and computed.
- [x] **Mua thêm $\ne$ Cập nhật giá**: Buying moves cash and increases holdings; updating price only modifies valuation.
- [x] **Bán $\ne$ Điều chỉnh giá**: Selling liquidates units and credits checking balance.
- [x] **Khoản đầu tư đã sở hữu $\ne$ Khoản mua hôm nay**: Historical opening does not deduct cash balances or inflate current monthly expenses.
- [x] **Lợi nhuận chưa thực hiện $\ne$ Lợi nhuận đã thực hiện**: Unrealized paper gains are separate from realized closed cash gains.

---

## UI Consistency

All 12 canonical screens conform strictly to the **ViNha Warm Precision** design tokens:

- **Geometry**: 440px centered frame, 12px card radii, 10px control radii, 40×40px badge wrappers.
- **Typography**: Geist font with `tabular-nums` for all numbers.
- **Iconography**: 100% native inline SVGs with standard 1.8px round strokes. Zero external icon fonts or emoji.
- **Light/Dark Parity**: Exact 1-to-1 component tree and spatial hierarchy across light and dark canonical pairs.

---

## Visual QA

- **Icon Standard**: Standardized 40×40px badge wrappers with 1.8px round strokes.
- **Status Pills**: Configured with `whitespace-nowrap shrink-0` to eliminate wrapping.
- **Touch Targets**: All interactive buttons, chips, and steppers satisfy minimum 44×44px touch targets.
- **Spacing**: Strict 8pt grid with 16px horizontal screen gutters.

---

## Responsive Review

Validated at:

- `360 × 800` (Small Android): Zero horizontal scroll, tabular numbers fit comfortably within cards.
- `390 × 844` (iPhone 14/15): Optimal balanced layout with comfortable margins.
- `430 × 932` (iPhone Pro Max): Clean centered column presentation without layout stretching.

---

## Accessibility

- **WCAG AA Compliance**: High-contrast text ratios ($\ge 4.5:1$ for body text, $\ge 3:1$ for large numbers).
- **Non-Color Indicators**: All gains and losses pair color tokens with explicit `+` or `−` signs and percentage labels.
- **Focus Rings**: Standardized 2px focus outlines on all interactive inputs.

---

## Light Theme

- Canvas: Warm Linen `#FBFBF9`
- Cards: Pure White `#FFFFFF` with `#E4E4E7` borders
- Text: Deep Charcoal `#18181B`
- Accents: Mint Teal `#0F766E`, Emerald `#047857`, Amber `#B45309`, Sky Blue `#0284C7`, Violet `#7C3AED`

---

## Dark Theme

- Canvas: Slate Charcoal `#141416`
- Cards: Dark Surface `#1C1C1F` with `#2E2E33` borders
- Text: Crisp White `#F4F4F5`
- Accents: Bright Teal `#2DD4BF`, Bright Emerald `#34D399`, Warm Amber `#FBBF24`, Sky Blue `#38BDF8`, Violet `#A78BFA`

---

## Prototype

- `Money → Investments`: Seamless navigation from `/money` investment pillar to `/money/investments`.
- `Investments → Add Investment → Detail`: Complete 3-step wizard with dual-mode creation leading to active asset detail.
- `Investments → Add Existing Investment → Detail`: Historical asset entry without cash deduction.
- `Detail → Buy More → Detail`: Buy flow with source checking account and recalculation of weighted average cost basis.
- `Detail → Sell → Detail`: Sell flow with MAX button, gross/net proceeds, and realized PnL.
- `Detail → Update Unit Price → Detail`: Non-cash valuation update with derived portfolio delta.

---

## Deferred Issues

- **Loans & Mortgages Domain**: Untouched (remains out of scope).
- **Personal Lending / Borrowing**: Untouched (remains out of scope).
- **Plan, Inbox, Together Domains**: Untouched (remain out of scope).
- **Production Code Implementation**: No modifications made to Next.js or Supabase code. All designs live canonically in Google Stitch project `16826760243481546078`.
