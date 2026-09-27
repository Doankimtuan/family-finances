# Accounts Experience Visual QA & Quality Audit

## Overview & Scope

- **Audit Date**: September 26, 2026
- **Auditor**: Senior Product Designer & Design Systems Lead (ViNha Core Team)
- **Design Authority**: ViNha Canonical UX/IA Guidelines (`artifacts/ux-redesign/CURRENT/`, `artifacts/information-architecture/CURRENT/`, `artifacts/design-system-evolution/CURRENT/`)
- **Stitch Project**: `16826760243481546078`
- **Scope**: All 10 canonical Accounts screens (Light & Dark), including Accounts Overview, Add Account, Add Credit, Account Detail (Asset), and Account Detail (Credit).

---

## Canonical Screen Registry Audited

| #   | Screen Description                                     | Theme | Stitch Screen ID                   | Status             |
| --- | ------------------------------------------------------ | ----- | ---------------------------------- | ------------------ |
| 1   | Accounts Overview (Danh sách tài khoản)                | Light | `8290004c6eac4233a560c80c476ccd32` | Canonical Approved |
| 2   | Accounts Overview (Danh sách tài khoản)                | Dark  | `c563d8765f9f4d47936a91218d303096` | Canonical Approved |
| 3   | Add Account (Thêm tài khoản thanh toán / ví)           | Light | `5c9b43db686d4c578b6898aa0dda63d1` | Canonical Approved |
| 4   | Add Account (Thêm tài khoản thanh toán / ví)           | Dark  | `69b29dfd4cd847a3963dc38b20205455` | Canonical Approved |
| 5   | Add Credit (Thêm thẻ tín dụng)                         | Light | `2c175c8080b34c0b9ae1f9af9bc56e04` | Canonical Approved |
| 6   | Add Credit (Thêm thẻ tín dụng)                         | Dark  | `e31a42aaa04049948cc4a512d91725a8` | Canonical Approved |
| 7   | Account Detail — Asset (Chi tiết tài khoản thanh toán) | Light | `4172437cc096433c99bb1bedc7f4fc9e` | Canonical Approved |
| 8   | Account Detail — Asset (Chi tiết tài khoản thanh toán) | Dark  | `c45ae48661c84d9f802728d3253f9fb6` | Canonical Approved |
| 9   | Account Detail — Credit (Chi tiết thẻ tín dụng)        | Light | `8e932438378c49409dde4e94350dee07` | Canonical Approved |
| 10  | Account Detail — Credit (Chi tiết thẻ tín dụng)        | Dark  | `c6c2473077ab4a82be23288eebf59763` | Canonical Approved |

---

## Complete Defect Inventory (Phases 1–26)

| ID     | Screen                                  | Severity | Issue                                                                                                                 | Root Cause                                                                                         | Fix                                                                                                                                                                                                                                  | Status   |
| ------ | --------------------------------------- | -------: | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| DEF-01 | Add Account (Light & Dark)              |       P0 | Opening balance input looks like an income transaction, risking confusion that it adds to monthly income.             | Generic numeric input without domain context or accounting guardrails.                             | Added explicit historical bookmark badge & callout: _"Tiền đã có sẵn trong tài khoản trước khi dùng ViNha. Không tính vào thu nhập hay ngân sách tháng."_                                                                            | RESOLVED |
| DEF-02 | Add Credit (Light & Dark)               |       P0 | Credit limit could be mistaken for available household cash/asset wealth if formatted identically to liquid accounts. | Lack of semantic separation between credit limit (borrowing capacity) and household liquid assets. | Designed dedicated liability header in rose palette (`#BE123C`), separating Credit Limit (`Hạn mức`) from Initial Debt (`Dư nợ ban đầu`), with alert banner: _"Thẻ tín dụng là hạn mức vay ngân hàng cấp, KHÔNG phải tiền của bạn."_ | RESOLVED |
| DEF-03 | Account Detail Credit (Light & Dark)    |       P0 | Credit card debt repayments could be classified as regular monthly operational expenses or income.                    | Generic transaction row styling without distinct debt settlement transfer classification.          | Styled debt repayment transactions in Sky Blue (`#0369A1`) with _"Trả nợ"_ badge and explicit microcopy: _"Khoản thanh toán nợ thẻ không được tính là thu nhập hay chi tiêu của tháng."_                                             | RESOLVED |
| DEF-04 | Accounts Overview → Add Credit Flow     |       P1 | Users wanting to add a credit card tap `+ Thêm` and enter standard asset flow without credit billing options.         | Single entry button without routing affordance for liabilities.                                    | Added high-contrast liability routing banner inside Add Account (_"Cần thêm thẻ tín dụng? Nhấn vào đây để thiết lập hạn mức và ngày sao kê →"_), plus segregated Credit section in Overview.                                         | RESOLVED |
| DEF-05 | Add Account & Add Credit (Light & Dark) |       P1 | Sticky bottom submit buttons occlude bottom form inputs and helper text on compact mobile screens (360×800).          | Absolute sticky footer without bottom container padding compensation.                              | Added `pb-28` to scrollable form containers, guaranteeing all inputs and microcopy remain visible above sticky button even with software keyboard open.                                                                              | RESOLVED |
| DEF-06 | Add Account & Add Credit (All)          |       P1 | Exiting form risks losing entered data or feels trap-like if modal back behavior is inconsistent.                     | Ambiguous close/back triggers in form headers.                                                     | Enforced canonical Ephemeral Create policy: standard 44px back arrow with text label (_"Tài khoản"_ / _"Hủy"_), clearing uncommitted draft states cleanly without blocking modal loops.                                              | RESOLVED |
| DEF-07 | Accounts Overview (Light & Dark)        |       P2 | Account row icons had uneven container sizes (varying between 36px and 44px) causing ragged vertical alignment.       | Ad-hoc wrapper sizing per account type.                                                            | Standardized all account list icon containers to exactly 40×40px (`w-10 h-10 rounded-xl`), `stroke-width="1.8"`, with standardized 12px gap to labels.                                                                               | RESOLVED |
| DEF-08 | All 10 Screens                          |       P2 | Inconsistent numeric alignment across balance lists and transaction feeds.                                            | Proportional numerals causing fluctuating widths for digits 1 vs 0.                                | Applied `font-variant-numeric: tabular-nums` (`.tabular-nums`) to all financial amounts, balances, limits, and dates.                                                                                                                | RESOLVED |
| DEF-09 | All Dark Canonical Screens              |       P2 | Dark theme input backgrounds using pure black (`#000000`) or overly high-contrast borders, breaking design harmony.   | Untuned dark tokens defaulting to generic dark styles.                                             | Harmonized dark surfaces to `#18181B` (card surface), `#27272A` (inputs/borders), `#09090B` (canvas background), with soft teal `#2DD4BF` active states.                                                                             | RESOLVED |
| DEF-10 | Accounts Overview (Light & Dark)        |       P2 | Potential section fragmentation if every account type created its own card group.                                     | Excessive section grouping for single accounts.                                                    | Consolidated into 3 semantic groups with integrated subtotals: _Ngân hàng_, _Tiền mặt & Ví_, _Thẻ tín dụng_. Works seamlessly for 1 or 10 accounts.                                                                                  | RESOLVED |
| DEF-11 | All 10 Screens                          |       P3 | Icon buttons (back arrows, options menus, edit icons) lacking explicit 44×44px interactive bounding boxes.            | Direct SVG click targets smaller than WCAG AA touch minimum.                                       | Wrapped all interactive icons in `min-w-[44px] min-h-[44px]` flex touch targets with visible focus rings.                                                                                                                            | RESOLVED |
| DEF-12 | Accounts Overview & Detail (All)        |       P3 | Long account names (e.g., _"Tài khoản thanh toán Vietcombank Ba Đình"_) could cause balance or chevron wrap clipping. | Flex children missing `min-w-0` and truncation classes.                                            | Applied `min-w-0` on text flex containers and `truncate` on labels with `shrink-0` on balance amounts and chevrons.                                                                                                                  | RESOLVED |

---

## Detailed QA Audit by Dimension

### 1. Financial Semantics QA (P0 Gate)

- **Opening Balance (`Số dư ban đầu`)**:
  - PASS. Clearly defined as historical balance existing prior to ViNha tracking.
  - Zero possibility of being treated as monthly income or distorting monthly cash flow.
  - Accompanied by neutral bookmark iconography (`bookmark-check`) rather than incoming money arrows.
- **Credit Facilities & Limits (`Hạn mức tín dụng`)**:
  - PASS. Prominently segregated from liquid cash.
  - Hero card in Overview displays true liquid total (`₫ 12.747.748`), keeping credit debt (`₫ 0` or outstanding) in a separate status badge.
  - Credit limit is explicitly labeled as bank-granted borrowing capacity, not family wealth.
- **Credit Debt (`Dư nợ tín dụng`)**:
  - PASS. Displayed in rose liability tokens (`#BE123C` Light, `#FB7185` Dark) with percentage utilization and due date countdown.
- **Account Transfers & Debt Payments**:
  - PASS. Internal transfers between accounts and credit card payoffs are classified as liquidity movements (`Trả nợ / Chuyển ví`), never operational expenses or income.

### 2. Design System & Icon Consistency QA

- **Icon Artwork**:
  - 100% native inline SVGs rendered with `stroke-width="1.8"` or `stroke-width="2"` for key navigation symbols.
  - Zero Material Symbols font ligatures across all 10 screens.
- **Icon Containers**:
  - Peer account row icon containers locked to 40×40px (`w-10 h-10`) with `rounded-xl` and 1-pixel border.
  - Category and action badges locked to standardized 28×28px or 32×32px containers.
- **Color Tokens**:
  - Primary Brand: Deep Forest Teal (`#0F766E` Light, `#2DD4BF` Dark).
  - Background Canvas: Warm Cream Stone (`#FAFAF9` Light, `#09090B` Dark).
  - Card Surfaces: White `#FFFFFF` with `#DDE4E1` borders (Light) / `#18181B` with `#27272A` borders (Dark).
  - Liability / Debt: Crimson Rose (`#BE123C` Light, `#FB7185` Dark).
  - Asset / Surplus: Forest Emerald (`#047857` Light, `#34D399` Dark).

### 3. Typography & Spacing System

- **Font Stack**: Geist / Inter with strict typography scale:
  - Page Title: 17px font-semibold (sticky bar)
  - Hero Balance: 32px font-bold with `.tabular-nums`
  - Group Header: 12px font-semibold uppercase tracking-wider
  - Account Row Title: 14px font-semibold
  - Metadata / Subtitle: 11px / 12px font-normal text-zinc-500
- **Spacing Grid**:
  - Screen Gutters: 16px (`px-4`)
  - Vertical Gap between Sections: 16px (`space-y-4`)
  - Row Padding: 14px vertical (`p-3.5` / `min-h-[56px]`)
  - Form Gap: 16px (`space-y-4`) with 6px (`space-y-1.5`) between label and input

### 4. Responsive Viewport Audits

- **360 × 800 (Compact Mobile / Android)**:
  - PASS. Single-column layout scales fluidly. Long bank names truncate cleanly without horizontal overflow. Bottom submit buttons retain full visibility with `pb-28` scroll padding.
- **390 × 844 (Standard iPhone)**:
  - PASS. Target canonical baseline. Perfect visual balance, generous 44px touch targets, comfortable reading density.
- **430 × 932 (Large Mobile / iPhone Max)**:
  - PASS. Max-width container capped at 440px with elegant desktop centering and border frame, preventing oversized blown-out controls.

### 5. First-Time User Journey Validation

#### Scenario A: Adding Existing Bank Balance (₫ 10.000.000)

- **Journey**: `Money` → `Accounts` → `Add Account` → Select `Tài khoản thanh toán` → Enter `Techcombank` → Enter Opening Balance `₫ 10.000.000`.
- **Validation**: User sees prominent reminder: _"Số tiền đang có sẵn khi bắt đầu dùng ViNha. Không tính vào thu nhập hay ngân sách tháng."_
- **Result**: PASS. User confidently enters existing funds without fear of skewing monthly earnings.

#### Scenario B: Adding Credit Card (Limit ₫ 50M, Debt ₫ 8M)

- **Journey**: `Money` → `Accounts` → `Add Credit` → Enter Limit `₫ 50.000.000` → Enter Current Debt `₫ 8.000.000` → Enter Statement Date (20th) & Due Date (5th).
- **Validation**: Form explicitly differentiates "Hạn mức" from "Dư nợ". Overview displays debt in rose (`- ₫ 8.000.000`) and does NOT add ₫ 50.000.000 to household liquid assets.
- **Result**: PASS. Financial liability is strictly segregated from assets.

#### Scenario C: Inspecting Bank Account Activity & Transfers

- **Journey**: `Accounts Overview` → Tap `TP Bank chồng` → `Account Detail (Asset)`.
- **Validation**: Shows true balance (`₫ 7.420.000`), quick actions (`Chuyển khoản`, `Nạp tiền`, `Chi tiêu`), and transaction feed where transfers to other accounts or debt settlements are clearly marked with transfer icons, not expense debits.
- **Result**: PASS. Clear, intuitive, and accurate.

---

## Final QA Sign-Off

All 12 identified defects (3 P0, 3 P1, 4 P2, 2 P3) have been systematically resolved across the canonical Google Stitch designs. The full Accounts experience forms an unbroken, harmonious, and financially rigorous experience matching Home and Money.
