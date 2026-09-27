# Loans Experience Review

## Existing Loan Model

ViNha models bank and institutional debts as formal amortizing liabilities (`modules/ledger/application/loan-constants.ts`, `modules/ledger/domain/loan-domain.ts`, `modules/ledger/application/commands/loans.ts`, `modules/ledger/application/loan-amortization.ts`).

Core relationship:
$$\text{Dư nợ gốc còn lại (Outstanding Balance)} = \text{Số tiền vay ban đầu (Original Principal)} - \sum \text{Tiền gốc đã thanh toán (Paid Principal)}$$

An institutional loan entity in ViNha contains:

- `id`: Định danh duy nhất của khoản vay tín dụng.
- `name`: Tên định danh khoản vay (ví dụ: _Gói vay mua nhà_, _Vay mua xe VinFast VF8_).
- `lender`: Tên ngân hàng / tổ chức tín dụng cấp khoản vay (ví dụ: _Vietcombank_, _Techcombank_, _BIDV_).
- `originalPrincipal`: Số tiền vay gốc ban đầu theo hợp đồng tín dụng (₫).
- `outstandingBalance`: Dư nợ gốc thực tế còn nợ tại thời điểm hiện tại (₫).
- `interestRateAnnualPercent`: Lãi suất vay danh nghĩa theo năm (% / năm).
- `termMonths`: Tổng thời hạn vay tính theo tháng (ví dụ: 240 tháng = 20 năm, 60 tháng = 5 năm).
- `startDate`: Ngày bắt đầu giải ngân / kích hoạt khoản nợ.
- `amortizationMethod`: Phương thức tính và trả nợ (`REDUCING_BALANCE` — Dư nợ giảm dần, hoặc `FIXED_MONTHLY` — Niên kim cố định).
- `paymentFrequency`: Tần suất trả nợ (`MONTHLY` — Hàng tháng, `QUARTERLY` — Hàng quý).
- `monthlyPaymentDay`: Ngày đến hạn trả nợ trong tháng (ví dụ: ngày 15 hàng tháng).
- `nextPaymentDueDate`: Ngày đến hạn của kỳ thanh toán tiếp theo.
- `nextPaymentAmount`: Tổng số tiền ước tính phải trả ở kỳ tới (Gốc kỳ này + Lãi kỳ này).
- `paidPrincipalTotal`: Lũy kế tiền gốc đã trả qua các kỳ.
- `paidInterestTotal`: Lũy kế tiền lãi đã trả qua các kỳ.
- `status`: Trạng thái khoản vay (`ACTIVE`, `PAID_OFF`, `DELINQUENT`).
- `notes`: Ghi chú hoặc điều khoản ràng buộc hợp đồng.

---

## Loan Status Model

ViNha triển khai hệ thống trạng thái khoản vay nghiêm ngặt, phản ánh trung thực nghĩa vụ tài chính mà không tạo áp lực tiêu cực hay hoảng loạn cho gia đình:

| Mã trạng thái  | Tên hiển thị tiếng Việt    | Màu sắc & Token                              | Ý nghĩa tài chính                                                                                   |
| -------------- | -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ACTIVE`       | Đang vay / Đang hoạt động  | Xanh ngọc / Slate (`#0F766E` / `#2DD4BF`)    | Khoản vay đang trong thời hạn trả góp định kỳ, nghĩa vụ thanh toán diễn ra bình thường.             |
| `PAID_OFF`     | Đã tất toán                | Xanh lục bảo Emerald (`#047857` / `#34D399`) | Khoản vay đã trả hết 100% dư nợ gốc và lãi phát sinh; hợp đồng tín dụng đã hoàn tất thanh lý.       |
| `DELINQUENT`   | Quá hạn thanh toán         | Đỏ hồng Rose (`#BE123C` / `#FB7185`)         | Kỳ thanh toán đã vượt quá ngày đến hạn mà chưa được ghi nhận trả nợ.                                |
| `DUE_SOON`     | Sắp đến hạn (trong 7 ngày) | Vàng hổ phách Amber (`#B45309` / `#FBBF24`)  | Cảnh báo lịch thanh toán trong vòng 7 ngày tới để chuẩn bị số dư khả dụng trong tài khoản trích nợ. |
| `CURRENT_PAID` | Đã trả kỳ này              | Xanh Mint Tonal (`#E7F5F1` / `#173B37`)      | Kỳ hiện tại đã thanh toán đầy đủ, kỳ tiếp theo bắt đầu tính từ tháng sau.                           |

---

## Loans Overview

- **Đường dẫn**: `/money/loans`
- **Mã màn hình Stitch**:
  - Light: `61b5bbda00aa4e08a88cfff34f61b739` (SCR-23 Light)
  - Dark: `fae5c9a8edf84fed877168c6baae5b15` (SCR-23 Dark)
- **Kiến trúc & Khả năng quét thông tin**:
  1. **Thanh điều hướng trên cùng (Sticky Header)**: Nút back 44×44px quay lại `/money`, tiêu đề _"Khoản vay & Nợ ngân hàng"_, phụ đề số lượng khoản nợ đang hoạt động, và nút tác vụ `+ Thêm khoản`.
  2. **Thẻ tổng quan dư nợ (Debt Summary Hero)**:
     - Số dư nợ gốc nổi bật: **₫ 1.847.500.000** (font chữ số tài chính lớn, `tabular-nums`).
     - Thanh phân bổ dư nợ: Gói mua nhà Vietcombank (82.3%) và Vay mua ô tô Techcombank (17.7%).
     - Dải số liệu 3 cột:
       - Tổng nợ gốc ban đầu: **₫ 2.500.000.000**
       - Đã trả được: **₫ 652.500.000 (26.1%)**
       - Kỳ tới gần nhất: **15/11/2026 — ₫ 18.250.000**
     - Lưu ý ranh giới tài chính (Guardrail Callout): _"Tổng dư nợ nghĩa vụ tài chính tại các ngân hàng & tổ chức tín dụng. Không bao gồm nợ thẻ tín dụng và vay mượn cá nhân."_
  3. **Bộ lọc danh mục**: Tab chuyển nhanh _Tất cả (2)_, _Đang vay (2)_, _Đã tất toán (0)_.
  4. **Danh sách khoản vay (Loan List)**:
     - Thẻ khoản vay 1: _Gói vay mua nhà — Vietcombank_ | Dư nợ: **₫ 1.520.000.000** (Gốc ban đầu: ₫ 2.000.000.000) | Lãi suất: 8.50%/năm | Kỳ tới: 15/11/2026 (₫ 18.250.000) | Trạng thái: Đang vay (28/240 kỳ).
     - Thẻ khoản vay 2: _Vay mua ô tô VinFast VF8 — Techcombank_ | Dư nợ: **₫ 327.500.000** (Gốc ban đầu: ₫ 500.000.000) | Lãi suất: 9.20%/năm | Kỳ tới: 25/11/2026 (₫ 9.850.000) | Trạng thái: Đang vay (18/60 kỳ).
  5. **Thanh điều hướng 5 tab (Bottom Navigation Bar)**: Cố định chuẩn mực với chỉ báo sáng tại tab _Tiền_.

---

## Add Loan

- **Đường dẫn**: `/money/loans/new`
- **Mã màn hình Stitch**:
  - Light: `842363acb3784aa6b490834ca8675046` (SCR-24 Light)
  - Dark: `8f680232ef3941c6b1abeb9dae6d68a6` (SCR-24 Dark)
- **Cấu trúc biểu mẫu chuẩn hóa**:
  - **Phần 1: Thông tin hợp đồng**: Tên khoản vay (_"Vay mua nhà"_, _"Vay kinh doanh"_), Ngân hàng / Tổ chức cho vay (chọn từ danh bạ ngân hàng hoặc tùy chọn khác).
  - **Phần 2: Số tiền & Thời hạn**: Số tiền vay gốc ban đầu (₫), Dư nợ gốc hiện tại (₫), Ngày bắt đầu giải ngân, Thời hạn vay (số tháng với chip chọn nhanh 12T, 36T, 60T, 120T, 240T).
  - **Phần 3: Lãi suất & Phương thức trả nợ**: Lãi suất danh nghĩa (%/năm), Phương thức tính lãi (`REDUCING_BALANCE` vs `FIXED_MONTHLY`), Ngày thanh toán cố định hàng tháng (từ ngày 1 đến ngày 28).
  - **Phần 4: Xem trước lịch trả kỳ đầu**: Tự động ước tính tiền gốc kỳ đầu + tiền lãi kỳ đầu = tổng trả kỳ đầu.
  - **Nút hành động cố định**: `+ Tạo khoản vay`.

---

## Add Existing Loan

- **Nguyên tắc kế toán cốt lõi (P0 Accounting Law)**:
  - Form Add Loan tích hợp bộ chuyển chế độ khởi tạo:
    - **Chế độ A — Khoản vay mới giải ngân hôm nay (`NEW_LOAN`)**: Ghi nhận khoản nợ mới phát sinh từ hôm nay, bắt đầu tính từ kỳ số 1.
    - **Chế độ B — Khoản vay đã tồn tại từ trước (`EXISTING_LOAN`)**: Cho phép người dùng nhập khoản vay ngân hàng đã trả được nhiều tháng/năm trước khi bắt đầu dùng ViNha.
  - **Minh bạch hóa tài chính**:
    - Cho phép nhập _Ngày bắt đầu hợp đồng trong quá khứ_ (ví dụ: `01/10/2024`).
    - Nhập tách biệt _Số tiền vay ban đầu_ (ví dụ: ₫ 2.000.000.000) và _Dư nợ gốc còn lại hiện tại_ (ví dụ: ₫ 1.520.000.000).
    - Hệ thống xác định chính xác số kỳ đã hoàn thành (ví dụ: kỳ 28/240) và chỉ lên lịch nhắc nợ cho các kỳ còn lại (212 kỳ tiếp theo).
    - **Không bơm tiền ảo**: Hành vi tạo khoản vay đã tồn tại hoàn toàn **KHÔNG** sinh ra dòng tiền thu nhập ảo hay giao dịch giải ngân giả vào các tài khoản thanh toán gia đình.

---

## Original Principal vs Outstanding Principal

- **Tuyệt đối phân định rõ ràng (P0)**:
  - Giao diện không bao giờ dùng nhãn chung chung là _"Số tiền"_.
  - **Số tiền vay ban đầu (Original Principal)**: Đại diện cho quy mô gói tín dụng đã ký kết ban đầu với ngân hàng (giá trị lịch sử hợp đồng).
  - **Dư nợ gốc hiện tại (Current Outstanding Balance)**: Đại diện cho nghĩa vụ nợ thực tế gia đình vẫn còn phải chịu trách nhiệm hoàn trả tại thời điểm tra cứu (thước đo nghĩa vụ thực tế).
- **Trình bày trực quan**:
  - Dư nợ gốc hiện tại luôn được hiển thị ở cấp độ hiển thị chính (Hero metric, font chữ số tài chính lớn 28–32px).
  - Số tiền vay ban đầu được trình bày trong bảng thông số hợp đồng và dùng làm mẫu số để tính % tiến độ trả nợ lũy kế.

---

## Interest Rate UX

- **Đơn vị rõ ràng và nhất quán (P0)**:
  - Mọi trường nhập và nhãn hiển thị đều gắn nhãn rõ ràng: `% / năm` (Lãi suất theo năm).
  - Tuyệt đối không hiển thị con số trần trụi (ví dụ `8.5`) mà thiếu đơn vị và chu kỳ tính.
- **Độ chính xác số học**:
  - Hỗ trợ tối thiểu 2 chữ số thập phân (ví dụ: `8,50% / năm`, `9,25% / năm`).
  - Đi kèm dòng chú thích ngữ cảnh: _"Lãi suất danh nghĩa theo hợp đồng tín dụng. Thường được điều chỉnh định kỳ 3-6 tháng theo biên độ thả nổi của ngân hàng."_

---

## Term UX

- **Đơn vị kỳ hạn**:
  - Sử dụng đơn vị chuẩn xác là **Tháng (Months)**, đồng thời hiển thị số năm quy đổi tương đương để người dùng dễ hình dung (ví dụ: `240 tháng (20 năm)`, `60 tháng (5 năm)`).
- **Mối quan hệ thời gian**:
  $$\text{Ngày giải ngân (Start Date)} + \text{Thời hạn (Term)} = \text{Ngày đáo hạn hợp đồng (Maturity Date)}$$
- **Trực quan hóa**:
  - Hiển thị tiến trình thời gian đã trôi qua: _Đã trải qua 28 / 240 tháng (11.7% thời gian hợp đồng)_.

---

## Repayment UX

- **Chu kỳ trả nợ**: Mặc định là **Hàng tháng (Monthly)** — phương thức trả nợ áp dụng cho 99% các hợp đồng vay mua nhà, mua xe và vay tiêu dùng tại Việt Nam.
- **Phương thức tính lãi & gốc**:
  1. `REDUCING_BALANCE` (_Dư nợ giảm dần_):
     $$\text{Tiền gốc mỗi tháng} = \frac{\text{Dư nợ ban đầu}}{\text{Tổng số tháng}}$$
     $$\text{Tiền lãi mỗi tháng} = \text{Dư nợ gốc thực tế còn lại} \times \frac{\text{Lãi suất năm}}{12}$$
     _(Tổng số tiền phải trả giảm dần qua từng tháng)._
  2. `FIXED_MONTHLY` (_Niên kim cố định / Trả đều mỗi tháng_):
     Tổng số tiền trả mỗi kỳ bằng nhau; trong đó những kỳ đầu tiền lãi chiếm tỷ trọng cao, các kỳ sau tiền gốc tăng dần.

---

## Record Payment

- **Đường dẫn**: `/money/loans/:id/pay`
- **Mã màn hình Stitch**:
  - Light: `e7091987c504411abb983eaa1a84bc97` (SCR-26 Light)
  - Dark: `edbba3a84f4d404994bc3b4558b3d63c` (SCR-26 Dark)
- **Quy tắc phân bổ thanh toán**:
  - **Tổng tiền thanh toán kỳ này**: **₫ 18.250.000**
  - **Tách bạch dòng tiền (P0 Semantics)**:
    - Tiền gốc kỳ này: **₫ 8.333.333** (giảm trực tiếp dư nợ gốc trên sổ nợ).
    - Tiền lãi kỳ này: **₫ 9.916.667** (ghi nhận là chi phí lãi vay của gia đình).
    - Phí phạt trễ hạn / phí dịch vụ: **₫ 0**.
  - **Tài khoản nguồn trích nợ**: Lựa chọn tài khoản thanh toán khả dụng (ví dụ: _VCB Priority — Số dư: ₫ 45.200.000_). Hệ thống kiểm tra số dư và hiển thị nhãn _Đủ số dư_.
  - **Xem trước biến động dư nợ (Live Preview)**:
    - Dư nợ trước thanh toán: ₫ 1.520.000.000
    - Trừ gốc kỳ này: − ₫ 8.333.333
    - Dư nợ sau thanh toán: **₫ 1.511.666.667**
  - **Nút hành động cố định**: `Xác nhận thanh toán`.

---

## Payment History

- Được tích hợp đồng bộ trong màn hình Chi tiết khoản vay (`/money/loans/:id`) và lịch sử đối soát.
- Mỗi bản ghi thanh toán hiển thị:
  - Ngày giờ ghi nhận giao dịch (ví dụ: _15/10/2026_).
  - Tổng số tiền đã thanh toán (₫ 18.320.000).
  - Phân tích chi tiết: Tiền gốc (₫ 8.333.333) + Tiền lãi (₫ 9.986.667).
  - Tài khoản trích tiền (_VCB Priority_).
  - Huy hiệu trạng thái: _Đã trích nợ thành công_.

---

## Repayment Schedule

- **Đường dẫn**: `/money/loans/:id/schedule`
- **Mã màn hình Stitch**:
  - Light: `4aa5abed5faa4da6b5ee7e0fceb70993` (SCR-27 Light)
  - Dark: `014e2e48b92244a6b90d967ca442c59e` (SCR-27 Dark)
- **Cấu trúc lịch trả nợ chuẩn mực**:
  - Header tóm tắt: Đang ở kỳ **29 / 240**, Dư nợ gốc còn lại: **₫ 1.520.000.000**, Tổng lãi dự kiến còn phải trả: **₫ 945.000.000**.
  - Thanh lọc kỳ: _Tất cả các kỳ_, _Sắp tới (212 kỳ)_, _Đã trả (28 kỳ)_.
  - Bảng chi tiết từng kỳ (Schedule Cards / Rows):
    - Kỳ 29 (15/11/2026): Gốc ₫ 8.333.333 | Lãi ₫ 9.916.667 | Tổng: ₫ 18.250.000 | Dư nợ còn: ₫ 1.511.666.667 (Huy hiệu: _Kỳ tiếp theo_).
    - Kỳ 30 (15/12/2026): Gốc ₫ 8.333.333 | Lãi ₫ 9.855.208 | Tổng: ₫ 18.188.541 | Dư nợ còn: ₫ 1.503.333.334.
    - Kỳ 31 (15/01/2027): Gốc ₫ 8.333.333 | Lãi ₫ 9.793.750 | Tổng: ₫ 18.127.083 | Dư nợ còn: ₫ 1.495.000.001.

---

## Loan Detail

- **Đường dẫn**: `/money/loans/:id`
- **Mã màn hình Stitch**:
  - Light: `a2c43ce53d124837bb7c1950e94f5fd6` (SCR-25 Light)
  - Dark: `28bf67d57768404bb4ed3aeda4e614b9` (SCR-25 Dark)
- **Bố cục màn hình chi tiết**:
  1. **Header**: Nút quay lại `/money/loans`, Tên khoản vay (_Gói vay mua nhà_), Tên ngân hàng (_Vietcombank_), và tag trạng thái `Đang hoạt động`.
  2. **Thẻ Dư nợ hiện tại (Hero Balance Card)**:
     - Dư nợ gốc còn lại: **₫ 1.520.000.000** (Chữ số tài chính cỡ lớn, màu Slate trung tính, không tô đỏ hoảng loạn).
     - Tiến độ hoàn trả: Đã trả **24.0%** dư nợ gốc (₫ 480.000.000 / ₫ 2.000.000.000).
  3. **Thẻ Nhắc kỳ thanh toán tiếp theo (Next Payment Alert)**:
     - Ngày đến hạn: **15/11/2026** (Còn 19 ngày).
     - Số tiền cần thanh toán: **₫ 18.250.000** (Gốc ₫ 8.333.333 + Lãi ₫ 9.916.667).
     - Nút tác vụ trực tiếp: `Ghi nhận trả nợ →`.
  4. **Lưới thông số hợp đồng tín dụng**:
     - Số tiền vay ban đầu: ₫ 2.000.000.000
     - Lãi suất vay: 8.50% / năm
     - Tổng thời hạn: 240 tháng (20 năm)
     - Phương thức tính lãi: Dư nợ giảm dần
     - Ngày giải ngân: 15/07/2024
     - Ngày đáo hạn: 15/07/2044
  5. **Các mục điều hướng chức năng liên kết**:
     - _Lịch trả nợ chi tiết (240 kỳ)_ → dẫn tới SCR-27.
     - _Lịch sử thanh toán đã ghi nhận_ → xem các kỳ đã trích nợ.
     - _Ước tính tất toán trước hạn_ → dẫn tới SCR-28.

---

## Payoff / Settlement

- **Đường dẫn**: `/money/loans/:id/payoff`
- **Mã màn hình Stitch**:
  - Light: `3939cc807d144184afcbe6883b1d72e5` (SCR-28 Light)
  - Dark: `94b9db1104174409bca90282c0deed5b` (SCR-28 Dark)
- **Minh bạch ngữ nghĩa tất toán**:
  - Khung thông báo tư vấn: _"Lưu ý: Đây là số liệu tham khảo dựa trên lịch trả nợ chuẩn. Số tiền thực tế phụ thuộc vào ngày chốt dư nợ và biên bản thanh lý chính thức từ ngân hàng."_
  - Bảng bóc tách chi phí tất toán:
    - Dư nợ gốc cần thanh lý: **₫ 1.520.000.000**
    - Lãi phát sinh tạm tính đến kỳ này: **₫ 6.540.000** (tính theo số ngày thực tế)
    - Phí phạt tất toán trước hạn (1.5% dư nợ gốc): **₫ 22.800.000**
    - Thuế / Phí hành chính: **₫ 0**
    - **Tổng số tiền dự kiến tất toán**: **₫ 1.549.340.000**
  - Huy hiệu lợi ích: Tiết kiệm ~**₫ 945.000.000** tiền lãi suất cho 212 kỳ còn lại.
  - Hướng dẫn quy trình 3 bước làm việc với ngân hàng (Báo trước 5 ngày → Chốt số dư & nộp ủy nhiệm chi → Nhận lại hồ sơ giải chấp sổ hồng).
  - Chọn tài khoản trích nợ thanh lý kèm nút `Xác nhận tất toán`.

---

## Bank / Lender Identity

- Tích hợp nhận diện thương hiệu chuẩn xác của các tổ chức tín dụng tại Việt Nam:
  - Vietcombank (VCB), Techcombank (TCB), BIDV, VietinBank, MB Bank, ACB, VPBank, TPBank.
  - Cho phép chọn _Tổ chức tín dụng khác / Công ty tài chính_ cho các khoản vay chuyên biệt (Home Credit, Shinhan Finance, Quỹ phát triển nhà ở).
- Container icon đồng bộ kích thước chuẩn 40×40px, bo góc 10px, hiển thị glyph logo rõ nét và có độ tương phản cao.

---

## Financial Semantics

ViNha tuân thủ tuyệt đối 7 định luật ngữ nghĩa kế toán đối với khoản nợ tổ chức:

1. **Số tiền vay ban đầu ≠ Dư nợ gốc hiện tại**: Ban đầu là quy mô gói tín dụng ký kết; dư nợ hiện tại là nghĩa vụ còn lại sau khi trừ các khoản gốc đã trả.
2. **Dư nợ gốc ≠ Số tiền phải trả kỳ này**: Dư nợ gốc là hàng tỷ đồng; số tiền phải trả kỳ này chỉ là mười mấy triệu đồng gồm gốc và lãi tháng này.
3. **Tiền gốc ≠ Tiền lãi**: Trả tiền gốc giúp giảm dư nợ; trả tiền lãi là chi phí dịch vụ sử dụng vốn, không làm giảm dư nợ gốc.
4. **Thanh toán định kỳ ≠ Chi phí thuần túy**: Chỉ có phần tiền lãi là chi phí; phần tiền gốc là dịch vụ chuyển giao thanh lý nghĩa vụ nợ.
5. **Khoản vay đã tồn tại ≠ Khoản vay mới phát sinh**: Thêm khoản vay cũ không sinh ra dòng tiền giải ngân ảo vào tài khoản gia đình.
6. **Tất toán trước hạn ≠ Thanh toán một kỳ thông thường**: Tất toán đóng vĩnh viễn hợp đồng tín dụng và phát sinh phí phạt tất toán trước hạn theo hợp đồng.
7. **Khoản vay ngân hàng ≠ Vay mượn cá nhân**: Vay ngân hàng có hợp đồng thế chấp/tín chấp, lịch trả nợ cố định và lãi suất công chứng; vay mượn cá nhân là giao dịch dân sự linh hoạt (được quản lý riêng tại `/money/personal-loans`).

---

## Form Consistency

- Tất cả các trường nhập tiền tệ đều dùng `MoneyInput` / `AmountField` với hậu tố `₫`, định dạng phân cách hàng nghìn dấu chấm (`.`), hỗ trợ gõ phím số trên di động (`inputMode="numeric"`).
- Tất cả trường tỷ lệ phần trăm đều hiển thị rõ ràng `% / năm`.
- Các nút CTA chính đều có chiều cao chuẩn 44px, bo góc 10px, đặt ở vị trí cố định (sticky bottom bar) và kiểm tra tính hợp lệ trước khi gửi.

---

## UI Consistency

- Đồng bộ 100% với ngôn ngữ thiết kế **ViNha Warm Precision** đã được phê duyệt tại Home, Money, Accounts, Savings, Investments.
- Khung canvas cố định 440px căn giữa trên mọi thiết bị.
- Typography đồng nhất bằng phông chữ Geist, `tabular-nums` cho số liệu tài chính.
- Màu sắc nợ nần được xử lý điềm tĩnh, trung tính (Slate `#18181B` / `#F4F4F5` kết hợp nhấn nhẹ Rose `#BE123C` / `#FB7185`), không gây hoảng loạn tâm lý cho gia đình.

---

## Visual QA

- Kiểm tra tính toàn vẹn của 12 màn hình Stitch:
  - 100% biểu tượng SVG nội tuyến sắc nét, không phụ thuộc font icon bên ngoài.
  - Không có hiện tượng cắt chữ, tràn chữ đối với các giá trị tiền tệ lớn (ví dụ: `₫ 1.847.500.000`, `₫ 1.520.000.000`).
  - Khoảng cách thẻ, đệm viền tuân thủ lưới 4px (padding 16px, gap 12px, border 1px).

---

## Responsive Review

Đã thẩm định bố cục trên 3 kích thước thiết bị tiêu chuẩn:

- **360 × 800 (Android phổ thông)**: Bố cục 1 cột hiển thị hoàn hảo, không có thanh cuộn ngang, các nút CTA hiển thị trọn vẹn trên màn hình.
- **390 × 844 (iPhone 14 / 15 chuẩn)**: Khoảng trống cân đối, các thẻ số liệu 3 cột co giãn tự nhiên.
- **430 × 932 (iPhone Pro Max / Plus)**: Vùng hiển thị thoáng đãng, canvas duy trì giới hạn tối đa 440px thanh lịch.

---

## Accessibility

- Đạt chuẩn **WCAG AA**:
  - Độ tương phản chữ/nền tối thiểu 4.5:1 đối với văn bản thông thường và 3:1 đối với chữ số tài chính lớn.
  - Không biểu đạt trạng thái chỉ bằng màu sắc duy nhất: luôn đi kèm văn bản giải thích rõ ràng (ví dụ: nhãn _"Quá hạn"_, nhãn _"Sắp đến hạn"_, nhãn _"Đã tất toán"_).
  - Vùng chạm cảm ứng tối thiểu 44×44px cho tất cả các nút bấm, biểu tượng quay lại và nút chọn tài khoản.

---

## Light Theme

- Sử dụng nền giấy ấm `canvas-light` (`#FAFAF9`), thẻ bề mặt màu trắng tinh khiết `surface-light` (`#FFFFFF`), đường viền hairline xám nhạt `border-light` (`#DDE4E1`), chữ chính `text-light` (`#18181B`).
- Thể hiện sự thanh thoát, sáng sủa và minh bạch cho các buổi hoạch định tài chính ban ngày.

---

## Dark Theme

- Sử dụng nền đá phiến sẫm `canvas-dark` (`#0B0F17` / `#141416`), thẻ bề mặt xanh đen `surface-dark` (`#131B2E` / `#1C1C1F`), đường viền tối `border-dark` (`#1E293B` / `#2E2E33`), chữ chính `text-dark` (`#F8FAFC` / `#F4F4F5`).
- Giữ vững nguyên tắc tương quan 1-1 về mặt cấu trúc và dữ liệu so với bản Light, không gây chói mắt và không làm mất đi độ sắc nét của số liệu tài chính ban đêm.

---

## Prototype

Các luồng tương tác thực tế đã được chuẩn hóa:

1. **Tiền (`/money`) → Khoản vay (`/money/loans`)**: Nhấp vào mục Nợ & Khoản vay tại Money Overview mở ra Loans Overview với tổng dư nợ và danh sách gói vay.
2. **Khoản vay → Thêm khoản vay (`/money/loans/new`)**: Nhấp `+ Thêm khoản` mở wizard hỗ trợ cả tạo khoản vay mới và thêm khoản vay đã tồn tại từ trước.
3. **Khoản vay → Chi tiết khoản vay (`/money/loans/:id`)**: Nhấp vào từng thẻ khoản vay mở ra toàn bộ thông số hợp đồng và cảnh báo kỳ tới.
4. **Chi tiết → Ghi nhận trả nợ (`/money/loans/:id/pay`)**: Nhấp `Ghi nhận trả nợ` mở giao diện phân bổ gốc/lãi và trích tiền từ tài khoản thanh toán.
5. **Chi tiết → Lịch trả nợ (`/money/loans/:id/schedule`)**: Nhấp xem toàn bộ 240 kỳ khấu hao với từng kỳ hạn chi tiết.
6. **Chi tiết → Ước tính tất toán (`/money/loans/:id/payoff`)**: Mở bảng tính chi phí tất toán trước hạn, tiền lãi tiết kiệm và checklist giải chấp sổ hồng.

---

## Deferred Issues

1. **Vay mượn cá nhân (`/money/personal-loans`)**: Tách biệt hoàn toàn, không xâm lấn trong phạm vi Task 06 theo chỉ thị nghiêm ngặt.
2. **Kế hoạch ngân sách & Hũ chi tiêu (`/plan`)**: Không sửa đổi.
3. **Hộp thư quyết định (`/inbox`)**: Không sửa đổi.
4. **Không can thiệp mã nguồn Next.js & Supabase**: Toàn bộ thiết kế được hoàn thiện độc lập và lưu trữ chuẩn xác trên Google Stitch.
