# Localization Readiness & Copy Consistency — ViNha Design System

**Supported Locales**: Vietnamese (`vi` — Primary canonical), English (`en` — Secondary fallback)  
**Font Family**: Geist Sans (Unified across VI & EN)  
**Layout Canvas**: Centered 440px viewport (tested at 360px, 390px, 430px)

---

## 1. Canonical Financial Terminology Dictionary (Phase 27)

To ensure absolute copy consistency across all screens, implementation must strictly adhere to the following normalized domain terminology. Do not invent arbitrary synonyms.

| Concept / Entity        | Canonical Vietnamese (vi)      | Canonical English (en)   | Forbidden / Deprecated Synonyms    |
| ----------------------- | ------------------------------ | ------------------------ | ---------------------------------- |
| **Bank Account**        | Tài khoản                      | Account                  | Ví phụ, Tài khoản con              |
| **Cash Account**        | Tiền mặt                       | Cash                     | Tiền túi, Tiền ví                  |
| **Credit Card**         | Thẻ tín dụng                   | Credit Card              | Thẻ nợ, Thẻ quẹt                   |
| **Credit Limit**        | Hạn mức khả dụng / Hạn mức thẻ | Credit Limit             | Tiền trong thẻ, Số dư thẻ          |
| **Credit Debt**         | Dư nợ thẻ                      | Credit Card Debt         | Nợ thẻ tín dụng, Số tiền đã tiêu   |
| **Opening Balance**     | Số dư ban đầu                  | Opening Balance          | Thu nhập ban đầu, Vốn khởi tạo     |
| **Savings / Deposit**   | Tiết kiệm & Tiền gửi           | Savings & Term Deposits  | Sổ gửi, Gửi lãi                    |
| **Principal**           | Tiền gốc                       | Principal                | Gốc ban đầu, Số tiền gửi           |
| **Interest**            | Tiền lãi / Lãi suất            | Interest / Interest Rate | Lời, Tiền lời, Lợi nhuận           |
| **Maturity Date**       | Ngày đáo hạn                   | Maturity Date            | Hết hạn, Ngày kết thúc             |
| **Rollover / Renewal**  | Tái tục                        | Rollover / Renewal       | Gia hạn, Gửi tiếp                  |
| **Investment**          | Đầu tư & Tài sản               | Investments & Assets     | Chứng khoán, Tài sản số            |
| **Unit Price**          | Giá mỗi đơn vị (₫/đơn vị)      | Unit Price               | Đơn giá, Giá thị trường            |
| **Quantity**            | Số lượng (CCQ / Cổ phiếu)      | Quantity                 | Khối lượng, Số cổ                  |
| **Cost Basis**          | Giá vốn                        | Cost Basis               | Vốn ban đầu, Giá mua gốc           |
| **Unrealized Gain**     | Lợi nhuận tạm tính             | Unrealized Gain/Loss     | Lãi thực, Lãi tạm thời             |
| **Bank Loan**           | Khoản vay ngân hàng            | Bank Loan                | Nợ ngân hàng, Vay tín dụng         |
| **Outstanding Balance** | Dư nợ gốc còn lại              | Outstanding Principal    | Tiền nợ còn lại, Số dư nợ          |
| **Installment**         | Kỳ thanh toán / Đợt trả        | Installment / Payment    | Kỳ đóng, Đợt đóng                  |
| **Personal Lending**    | Cho vay mượn cá nhân           | Personal Lending & Debts | Nợ bạn bè, Nợ ngoài                |
| **I Lend**              | Mình cho vay (Chờ nhận lại)    | I Lent (Receivable)      | Cho mượn, Đang đòi                 |
| **I Borrow**            | Mình đi vay (Cần trả)          | I Borrowed (Payable)     | Đi mượn, Đang nợ                   |
| **Counterparty**        | Người liên quan                | Counterparty             | Bạn nợ, Chủ nợ, Con nợ             |
| **Budget Jar**          | Hũ chi tiêu                    | Budget Jar               | Phong bì, Ví chi tiêu, Hạn mức chi |
| **Jar Quota**           | Hạn mức hũ                     | Jar Budget / Quota       | Số dư hũ, Tiền trong hũ            |
| **Capacity Move**       | Điều chỉnh phân bổ hũ          | Reallocate Jar Capacity  | Chuyển khoản hũ, Nạp tiền hũ       |
| **Decision Inbox**      | Hộp thư quyết định             | Decision Inbox           | Thông báo, Cảnh báo, Tin nhắn      |
| **Unmapped Tx**         | Chi tiêu chưa gắn hũ           | Unmapped Transaction     | Giao dịch chưa chia, Tiền lạc      |
| **Together Hub**        | Cùng nhau                      | Together                 | Hộ gia đình, Gia đình, Nhóm        |
| **Household Member**    | Thành viên hộ                  | Household Member         | Bạn chung, Người dùng chung        |
| **Administrator**       | Quản trị                       | Admin                    | Trưởng hộ, Chủ phòng               |
| **Partner**             | Đối tác                        | Partner                  | Thành viên, Vợ/Chồng, Bạn          |

---

## 2. Vietnamese Diacritical Spacing Rules

1. **Stacked Diacritical Clearance**:
   - Vietnamese glyphs frequently feature stacked accents (e.g., `ẩ`, `ẫ`, `ễ`, `ố`, `ộ`, `ặ`).
   - Standard browser default line heights (`1.15` to `1.2`) cause descenders and ascenders of adjacent lines to collide with stacked diacritics.
   - **Rule**: All body and label text must enforce a minimum line-height of **1.4x to 1.5x** font size:
     - `11px` label $\rightarrow$ `16px` line-height (`leading-4`).
     - `12px` caption $\rightarrow$ `16px` line-height (`leading-4`).
     - `14px` body $\rightarrow$ `20px` line-height (`leading-5`).
     - `16px` body $\rightarrow$ `24px` line-height (`leading-6`).
     - `20px` headline $\rightarrow$ `28px` line-height (`leading-7`).
     - `32px` hero $\rightarrow$ `40px` line-height (`leading-10`).

2. **No Uppercase Diacritic Clipping**:
   - Headers styled in uppercase or titles with initial capital accented letters (e.g., `Ăn uống`, `Điều chỉnh`) must preserve `padding-top: 2px` or sufficient line box height to avoid upper bounding-box clipping in iOS Safari.

---

## 3. English String Length Resilience Audit

English translations frequently expand or contract compared to Vietnamese. The layout has been stress-tested for English resilience across key structural surfaces:

| UI Component         | Vietnamese Baseline   | English Translation          | Length Ratio | Layout Resilience Directive                                         |
| -------------------- | --------------------- | ---------------------------- | ------------ | ------------------------------------------------------------------- |
| **Bottom Tab 1**     | Trang chủ             | Home                         | −50%         | Fixed width 20% slot; label remains centered below icon             |
| **Bottom Tab 2**     | Tiền                  | Money                        | +25%         | Fits comfortably within 88px slot without truncation                |
| **Bottom Tab 3**     | Kế hoạch              | Plan                         | −40%         | Fits comfortably; centered                                          |
| **Bottom Tab 4**     | Hộp thư               | Inbox                        | −28%         | Fits comfortably; badge offset preserved                            |
| **Bottom Tab 5**     | Cùng nhau             | Together                     | +12%         | Fits comfortably; no wrapping                                       |
| **Floating CTA**     | `+ Giao dịch`         | `+ Add Tx` / `+ Transaction` | 0% to +20%   | Pill container uses `px-4 whitespace-nowrap`; expands symmetrically |
| **Primary Form CTA** | `Lưu hũ kế hoạch`     | `Save budget jar`            | +15%         | Full-width `w-full` button; text centered                           |
| **Confirmation CTA** | `Xoá đối tác khỏi hộ` | `Remove partner`             | −20%         | Full-width button; fits without wrapping                            |
| **Domain Row Label** | `Khoản vay ngân hàng` | `Bank loans & debt`          | 0%           | Multi-line title wrap supported; status pill remains `shrink-0`     |
| **Filter Chip**      | `Chưa gắn hũ`         | `Unmapped`                   | −30%         | Horizontal scroll container accommodates variable chip widths       |

---

## 4. Currency Formatting Standards

All monetary amounts must follow the strict formatting token rules:

- **Currency Symbol**: Vietnamese Dong symbol (`₫`) placed **before** the amount in Vietnamese (`₫ 1.500.000`), with an unbreakable space (`&nbsp;` or standard non-breaking space).
- **Thousand Separator**: Period (`.`) in Vietnamese mode (`₫ 2.036.547.748`), comma (`,`) in English mode (`₫ 2,036,547,748`).
- **Decimals**: Prohibited for Vietnamese Dong (₫ does not have fractional cents). Allowed only for Investment Quantities (`4.800 CCQ`) and Interest Rates (`6.20%/năm`).
- **Tabular Numerals**: Mandatory `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) across all balances, transaction amounts, budgets, and rates.
