# Personal Lending / Borrowing Experience Review

## Existing Data Model

ViNha models personal debt relationships as informal non-bank obligations between individuals (`modules/ledger/application/debt-constants.ts`, `modules/ledger/domain/debt-domain.ts`, `modules/ledger/application/commands/debt.schemas.ts`, `modules/ledger/application/commands/debt-commands.ts`).

Core relationship:
$$\text{Dư nợ còn lại (Remaining Amount)} = \text{Tiền gốc ban đầu (Principal Amount)} - \sum \text{Tiền đã thanh toán / thu hồi (Payments)}$$

An informal personal debt entity in ViNha contains:

- `id`: Unique identifier của khoản công nợ cá nhân.
- `counterparty`: Tên đối ứng của người vay / người cho vay (tối thiểu 1, tối đa 80 ký tự; ví dụ: _Nguyễn Hoàng Minh Anh_, _Trần Văn Bình_).
- `direction` (`DebtDirection`): Hướng nợ từ góc nhìn gia đình (`borrowed` — Mình đi vay vs `lent` — Mình cho vay).
- `creationMode` (`DebtCreationMode`): Phương thức ghi nhận khởi tạo (`existing_balance` — Số dư đã có từ trước vs `money_moved` — Tiền thực chuyển hôm nay).
- `principalAmount`: Số tiền gốc ban đầu của khoản vay mượn (₫, số nguyên dương).
- `remainingAmount`: Số tiền còn lại chưa thanh toán / chưa thu hồi được (₫).
- `startDate`: Ngày phát sinh khoản nợ / ngày bắt đầu hợp đồng miệng (YYYY-MM-DD).
- `dueDate`: Ngày hẹn hoàn trả (YYYY-MM-DD, tùy chọn; nếu có phải $\ge$ `startDate`).
- `status` (`DebtStatus`): Trạng thái (`active` — Đang theo dõi, `completed` — Đã hoàn tất, `archived` — Đã đóng/lưu trữ).
- `financialScope`: Phạm vi tài chính (`household` — Chung ví gia đình vs `personal` — Cá nhân riêng).
- `originAccountId`: Tài khoản thanh khoản phát sinh giao dịch ban đầu (nếu `money_moved`).
- `originTransactionId`: Mã giao dịch thanh toán nguồn trong sổ cái (nếu `money_moved`).
- `note`: Ghi chú nội bộ mục đích vay mượn (tối đa 200 ký tự).

---

## Debt Direction Model

Hệ thống định nghĩa hướng nợ với sự phân định rạch ròi, tuyệt đối không gây nhầm lẫn:

1. **Mình cho người khác vay (`DebtDirection.LENT` — "Mình cho vay")**:
   - Tiền rời khỏi ví/tài khoản gia đình (nếu chuyển tiền hôm nay).
   - Người khác nợ gia đình bạn $\rightarrow$ Đây là **Khoản phải thu (Receivable)** / Tài sản ròng đang nằm ở người khác.
   - Nhãn giao diện chủ đạo: **"Đang nợ bạn"** / **"Chờ nhận lại"**.
   - Hành vi kế tiếp: **"Ghi nhận nhận tiền"** (Thu hồi tiền gốc).
   - Tông màu đại diện: Xanh lục bảo Emerald (`#047857` Light / `#34D399` Dark).

2. **Mình đi vay người khác (`DebtDirection.BORROWED` — "Mình đi vay")**:
   - Tiền đi vào tài khoản gia đình (nếu nhận tiền hôm nay).
   - Bạn nợ người khác $\rightarrow$ Đây là **Khoản phải trả (Payable / Liability)** / Nghĩa vụ tài chính gia đình cần hoàn trả.
   - Nhãn giao diện chủ đạo: **"Bạn đang nợ"** / **"Cần trả"**.
   - Hành vi kế tiếp: **"Ghi nhận trả nợ"** (Thanh toán giảm trừ nợ gốc).
   - Tông màu đại diện: Đỏ hồng Rose (`#BE123C` Light / `#FB7185` Dark).

---

## Overview

- **Đường dẫn**: `/money/debts`
- **Mã màn hình Stitch**:
  - Light: `156df93ab879437c8bcf3d9340b157e2` (SCR-29 Light)
  - Dark: `7ded5ac3aa9e407e87b29f1708fc3ffe` (SCR-29 Dark)
- **Kiến trúc & Khả năng quét thông tin**:
  1. **Top App Bar**: Nút back 44×44px quay lại `/money`, tiêu đề _"Vay mượn cá nhân"_, huy hiệu phân loại _"Công nợ"_, phụ đề _"Theo dõi tiền cần trả & tiền đang chờ về"_, và nút tác vụ `+ Thêm khoản`.
  2. **Thẻ tổng quan dư nợ (Debt Summary Hero)**:
     - Số tiền nghĩa vụ nợ cần trả hiển thị nổi bật: **₫ 35.000.000** (Chữ số tài chính cỡ lớn 32px tabular-nums).
     - Khung cảnh báo quy tắc tài chính gia đình: _"Theo dõi nghĩa vụ nợ cá nhân minh bạch, không cộng vào chi tiêu sinh hoạt."_
     - Dải số liệu 3 cột:
       - **Chờ nhận lại**: **₫ 18.000.000** (#047857 / #34D399)
       - **Đang theo dõi**: **3 khoản** (1 nợ · 2 cho vay)
       - **Sắp đến hạn**: **1 khoản** (#B45309 / #FBBF24 amber)
  3. **Bộ lọc danh mục**: Tab cuộn ngang _Tất cả (3)_, _Bạn đang nợ (1)_, _Đang nợ bạn (2)_, _Đã hoàn tất (1)_.
  4. **Nhóm 1: Bạn đang nợ (Cần trả)**:
     - _Trần Văn Bình (Anh họ)_: Vay tiền sửa bếp | Hẹn trả 10/11/2026 (Còn 15 ngày) | Còn phải trả: **₫ 35.000.000** (Gốc ₫ 50M) | Nút thao tác nhanh `Ghi nhận trả nợ →`.
  5. **Nhóm 2: Đang nợ bạn (Chờ nhận)**:
     - _Nguyễn Hoàng Minh Anh_: Mượn cọc xe máy | Hẹn trả 05/11/2026 (Sắp đến hạn) | Còn được nhận: **₫ 10.000.000** (Đã thu: ₫ 5M / ₫ 15M).
     - _Lê Thị Thu Hằng_: Góp vốn mua máy ảnh | Không có ngày hẹn trả | Còn được nhận: **₫ 8.000.000**.
  6. **Nhóm 3: Đã hoàn tất gần đây (Lịch sử lưu trữ)**:
     - _Phạm Tuấn Kiệt_: Đã tất toán **₫ 5.000.000** (Gạch ngang số tiền, badge xanh _Đã tất toán_ và _Đã đóng sổ_).
  7. **Thanh điều hướng 5 tab cố định**: Giữ vững vị trí chuẩn mực với chỉ báo sáng tại tab _Tiền_.
  8. **Nút tác vụ nổi (Floating Action Pill)**: `+ Thêm khoản nợ` nổi bật giữa màn hình.

---

## Lend Flow

- Khởi tạo từ `DebtCreateSheet` với lựa chọn `Mình cho vay` (`DebtDirection.LENT`).
- **Ngữ nghĩa rõ ràng**:
  - Giao diện đặt câu hỏi: _"Ai đang nợ bạn?"_
  - Hộp thông báo nhấn mạnh: _"Khoản này ghi nhận người khác có nghĩa vụ trả tiền cho bạn. Hoàn toàn không tính vào chi phí sinh hoạt hàng ngày."_
- **Các trường nhập liệu**:
  - Tên người vay (Counterparty): Text input (ví dụ: _Nguyễn Hoàng Minh Anh_) kèm avatar chữ cái tắt và chip gợi ý quan hệ.
  - Số tiền cho vay (Principal Amount): Hỗ trợ đọc bằng chữ tiếng Việt (_"Mười lăm triệu đồng"_) và phím tắt `+1M`, `+5M`, `+10M`.
  - Tài khoản trích tiền cho vay (nếu chọn `money_moved`): Hiển thị danh sách tài khoản thanh khoản khả dụng và số dư tương ứng.

---

## Borrow Flow

- Khởi tạo từ `DebtCreateSheet` với lựa chọn `Mình đi vay` (`DebtDirection.BORROWED`).
- **Ngữ nghĩa rõ ràng**:
  - Giao diện đặt câu hỏi: _"Bạn đang nợ ai?"_
  - Nhắc nhở tài chính: _"Bạn sẽ có nghĩa vụ hoàn trả lại khoản gốc này. Đây không phải là thu nhập của gia đình."_
- **Các trường nhập liệu**:
  - Tên người cho vay: Text input (ví dụ: _Trần Văn Bình_).
  - Số tiền vay: Nhập số tiền gốc ban đầu.
  - Tài khoản nhận tiền vay (nếu chọn `money_moved`): Chọn tài khoản nhận tiền giải ngân để cộng tiền vào số dư khả dụng thực tế.

---

## Existing Debt Flow

- **Định luật kế toán then chốt (P0 Accounting Law)**:
  - Khi người dùng thêm khoản vay mượn đã phát sinh từ vài tháng hoặc năm trước, họ chọn:
    $$\text{Cách ghi nhận} = \text{"Đã có từ trước (Khuyên dùng)"} \quad (`DebtCreationMode.EXISTING_BALANCE`)$$
  - **Bảo toàn số dư**: ViNha chỉ ghi nhận số nợ vào sổ theo dõi công nợ, **hoàn toàn KHÔNG can thiệp, không cộng/trừ số dư** của bất kỳ tài khoản thanh toán nào.
  - Cho phép nhập ngày bắt đầu trong quá khứ (`startDate < todayIsoDate()`).
  - Không sinh ra các giao dịch thu nhập hay chi phí ảo làm sai lệch báo cáo dòng tiền sinh hoạt gia đình.

---

## Counterparty UX

- Không áp đặt hệ thống quản lý danh bạ phức tạp không cần thiết; người dùng nhập tên linh hoạt kèm gợi ý quan hệ thân thuộc (_Bạn bè_, _Đồng nghiệp_, _Anh/chị em_, _Họ hàng_).
- Hiển thị avatar tròn với 2 chữ cái viết tắt (Monogram avatar, ví dụ: `MA` cho Minh Anh, `TB` cho Tuấn Bình) với màu nền đồng bộ theo hướng nợ (Teal cho người nợ bạn, Rose cho người bạn đang nợ).
- Hỗ trợ tìm kiếm và chọn lại các đối ứng đã từng có giao dịch trong quá khứ.

---

## Personal Debt Detail

- **Đường dẫn**: `/money/debts/:id`
- **Mã màn hình Stitch**:
  - **Màn hình Cho vay (Lent)**:
    - Light: `b00b08d96d1e4296a4ceea2876f9e6d6` (SCR-31 Light)
    - Dark: `e401f90ec8304d51a521436ffda6342a` (SCR-31 Dark)
  - **Màn hình Đi vay (Borrowed)**:
    - Light: `71473cccdfc7497fbd94daeffc20446e` (SCR-32 Light)
    - Dark: `8bc5c352b3cf4e058e798813d6a3be70` (SCR-32 Dark)
- **Cấu trúc màn hình chi tiết**:
  1. **Header**: Tên đối tác đối ứng, avatar chữ cái, nhãn quan hệ trực quan (_"Đang nợ bạn"_ vs _"Bạn đang nợ"_), nút chỉnh sửa (`Pencil`).
  2. **Thẻ Hero dư nợ**:
     - Số tiền còn lại nổi bật (Xanh Emerald nếu cho vay, Đỏ Rose nếu đi vay).
     - Thanh tiến độ hoàn trả trực quan: tỷ lệ phần trăm đã thu hồi hoặc đã thanh toán kèm số tiền lũy kế so với gốc ban đầu.
     - Khung cảnh báo hạn trả: đếm ngược số ngày còn lại (hoặc nhãn _Không có ngày hẹn cụ thể_).
  3. **Thẻ thông số công nợ (Debt Facts Card)**: 9 trường dữ liệu bóc tách rõ ràng: Người liên quan, Chiều nợ, Tiền gốc ban đầu, Đã thu/trả, Ngày bắt đầu, Ngày hẹn trả, Tài khoản phát sinh, Mã giao dịch liên kết và Ghi chú.
  4. **Lịch sử thanh toán qua các đợt (Payment History)**: Bản ghi từng đợt tiền chuyển thực tế kèm ngày giờ, số tiền và tài khoản trích/nhận.
  5. **Thanh tác vụ cố định (Sticky Action Bar)**: Nút phụ `Sửa thông tin` và nút chính định hướng rõ ràng (`Ghi nhận nhận tiền →` hoặc `Ghi nhận trả nợ →`).

---

## Partial Repayment

- ViNha hỗ trợ hoàn trả từng phần linh hoạt đối với công nợ cá nhân (`modules/ledger/application/commands/debt-commands.ts:recordDebtPayment`).
- **Kiểm định trần nợ (Overpayment Protection)**:
  $$\text{Số tiền thanh toán mỗi lần} \le \text{Dư nợ gốc còn lại hiện tại}$$
  Hệ thống hiển thị lỗi nếu người dùng nhập số tiền vượt quá dư nợ thực tế.
- **Sổ đối soát xem trước (Live Reconciliation Preview)**:
  Mô phỏng minh bạch trước khi lưu: Dư nợ trước thanh toán − Số tiền trả đợt này = Dư nợ còn lại sau giao dịch.

---

## Full Settlement

- Tích hợp phím tắt nhanh **`100% / Trả hết`** hoặc **`Nhận hết`** trong biểu mẫu thanh toán.
- Khi số tiền thanh toán bằng đúng dư nợ còn lại:
  - Khoản nợ tự động chuyển trạng thái sang `completed` (_Đã hoàn tất_).
  - Không xóa bỏ bản ghi mà di chuyển khoản nợ vào mục _Đã hoàn tất & Lưu trữ_ để hai vợ chồng luôn có thể tra cứu đối soát khi cần.

---

## Repayment / Receipt History

- Tách bạch rõ ràng giữa hai luồng tiền:
  - Khi đi vay: Ghi nhận dấu trừ `− ₫ 5.000.000` (Tiền rời khỏi tài khoản gia đình để trả nợ).
  - Khi cho vay: Ghi nhận dấu cộng `+ ₫ 5.000.000` (Tiền người vay chuyển trả vào tài khoản gia đình).
- Mỗi đợt ghi nhận đều liên kết với giao dịch sổ cái (`transactionId`), cho phép nhấp vào để xem chi tiết giao dịch ngân quỹ.

---

## Due Date Model

- Khác với khoản vay ngân hàng có kỳ hạn pháp lý bắt buộc hàng tháng, công nợ cá nhân hỗ trợ đầy đủ hai trạng thái:
  1. **Có ngày hẹn trả cụ thể**: Hệ thống tự động tính số ngày còn lại, kích hoạt cảnh báo _Sắp đến hạn_ khi còn $\le 7$ ngày (`DEBT_DUE_SOON_DAYS = 7`), hoặc cảnh báo _Quá hạn_ khi vượt quá ngày hẹn.
  2. **Không có ngày hẹn trả (`dueDate: null`)**: Hiển thị nhãn _"Khoản nợ mở / Không có ngày hẹn cụ thể"_, không ép buộc người dùng phải nhập ngày giả lập.

---

## Interest Model

- **Quy tắc trung thực với sản phẩm (P0)**:
  - Mô hình công nợ cá nhân hiện tại trong ViNha là **không tính lãi suất tự động** (0% interest, thuần túy là khoản vay mượn hỗ trợ giữa người thân, bạn bè).
  - Thiết kế tuyệt đối **không tự ý bịa đặt** trường lãi suất phần trăm (%/năm) hoặc bảng khấu hao niên kim phức tạp vào màn hình công nợ cá nhân, giữ đúng tính chất thân mật và đời thường của sản phẩm.

---

## Status Model

| Trạng thái  | Hiển thị giao diện         | Màu sắc        | Ý nghĩa                                                                |
| ----------- | -------------------------- | -------------- | ---------------------------------------------------------------------- |
| `ACTIVE`    | Đang theo dõi / Đang nợ    | Teal / Rose    | Khoản nợ còn dư nợ gốc $> 0$, đang trong quá trình thực hiện nghĩa vụ. |
| `DUE_SOON`  | Sắp đến hạn ($\le 7$ ngày) | Hổ phách Amber | Nhắc nhở người dùng chuẩn bị tiền hoặc gửi tin nhắn nhắc bạn bè.       |
| `OVERDUE`   | Quá hạn thanh toán         | Đỏ hồng Rose   | Đã quá ngày hẹn trả mà chưa hoàn tất ghi nhận.                         |
| `COMPLETED` | Đã hoàn tất / Đã tất toán  | Xanh Emerald   | Dư nợ còn lại $= 0$, hoàn thành toàn bộ nghĩa vụ nợ.                   |
| `ARCHIVED`  | Đã đóng / Đã lưu trữ       | Xám Slate      | Đóng thủ công hoặc lưu trữ hồ sơ.                                      |

---

## Financial Semantics

Tuân thủ tuyệt đối 8 định luật phân định tài chính:

1. **Tôi cho vay $\neq$ Tôi đi vay**: Chiều nợ quyết định tài sản hay nghĩa vụ nợ, không bao giờ gộp chung thành một số dư không nhãn.
2. **Số tiền ban đầu $\neq$ Số dư còn lại**: Ban đầu là quy mô khoản nợ lúc phát sinh; số dư còn lại là số tiền thực tế cần thanh lý tại thời điểm xem xét.
3. **Tiền đi vay $\neq$ Thu nhập gia đình**: Nhận tiền vay là tăng nghĩa vụ nợ, không phải tăng thu nhập để đem đi chi tiêu tùy tiện.
4. **Tiền cho vay $\neq$ Chi phí sinh hoạt**: Cho người khác vay là chuyển đổi tài sản từ tiền mặt sang khoản phải thu, không phải chi phí mất đi.
5. **Tiền nhận lại $\neq$ Thu nhập mới**: Thu hồi nợ cho vay chỉ là thu hồi vốn gốc của gia đình.
6. **Tiền trả nợ $\neq$ Chi phí sinh hoạt**: Trả nợ là giảm nghĩa vụ tài chính đã cam kết từ trước.
7. **Thêm khoản nợ cũ $\neq$ Tạo giao dịch mới hôm nay**: Chế độ nợ đã tồn tại không được tạo giao dịch trừ/cộng tiền mặt ảo.
8. **Công nợ cá nhân $\neq$ Vay ngân hàng**: Vay mượn cá nhân mang tính quan hệ con người, không có hợp đồng thế chấp phức tạp hay phí phạt phạt trễ hạn kiểu ngân hàng.

---

## Cash Flow Semantics

- Mọi hành động thanh toán công nợ liên kết với tài khoản (`money_moved`) được hệ thống hạch toán theo loại giao dịch chuyên biệt:
  - `debt_borrowing`: Tiền vay nhận vào tài khoản.
  - `debt_lending`: Tiền cho vay xuất từ tài khoản.
  - `debt_receivable_payment`: Tiền thu hồi nợ chuyển vào tài khoản.
  - `liability_payment`: Tiền thanh toán trả nợ xuất từ tài khoản.
- Các giao dịch này được phân loại riêng trong báo cáo tài chính gia đình, bảo đảm tỷ lệ tiết kiệm và hạn mức ngân sách các hũ chi tiêu (`/plan`) không bị sai lệch.

---

## Form Consistency

- Tất cả các trường nhập số tiền đều sử dụng `AmountField` chuẩn hóa: định dạng phân cách hàng nghìn dấu chấm (`.`), biểu tượng tiền tệ `₫`, và hỗ trợ gõ bàn phím số di động tối ưu.
- Các Choice Tiles chọn hướng nợ và chế độ ghi nhận dùng chung component `ChoiceTileGroup` với trạng thái được chọn (Selected) rõ ràng, có độ tương phản cao.
- Nút bấm hành động cố định chân trang (Sticky Action Footer) tuân thủ chiều cao chuẩn 44px, bo góc 10–12px, kiểm tra tính hợp lệ dữ liệu trước khi gửi.

---

## UI Consistency

- Đồng bộ 100% với hệ thống thiết kế **ViNha Warm Precision** đã được phê duyệt tại Home, Money, Accounts, Savings, Investments, và Bank Loans.
- Độ rộng khung canvas khóa cứng ở mức tối đa 440px căn giữa màn hình.
- 100% biểu tượng SVG nội tuyến sắc nét, không dùng icon font hay emoji thay thế.
- Phông chữ Geist hỗ trợ đầy đủ dấu thanh tiếng Việt và định dạng số `tabular-nums`.

---

## Visual QA

- Kiểm tra tính toàn vẹn của 12 màn hình Stitch:
  - Không có tình trạng chữ bị tràn hoặc cắt bớt đối với các tên người dài (ví dụ: _Nguyễn Hoàng Minh Anh_).
  - Các số tiền lớn (ví dụ: `₫ 35.000.000`, `₫ 50.000.000`) hiển thị trọn vẹn, không bị xuống dòng vụng về.
  - Khoảng cách lề, đệm viền tuân thủ lưới cơ sở 4px.

---

## Responsive Review

Đã thẩm định và kiểm tra khả năng hiển thị tương thích trên 3 độ phân giải di động tiêu chuẩn:

- **360 × 800 (Android phổ thông)**: Bố cục 1 cột hiển thị hoàn hảo, không có thanh cuộn ngang, nút bấm lưu nằm gọn gàng trong vùng nhìn thấy.
- **390 × 844 (iPhone 14 / 15 chuẩn)**: Khoảng cách giữa các khối dữ liệu hài hòa, cân đối.
- **430 × 932 (iPhone Pro Max / Plus)**: Vùng hiển thị rộng rãi, canvas 440px giữ vững cấu trúc trang nhã.

---

## Accessibility

- Đạt chuẩn **WCAG AA**:
  - Tỷ lệ tương phản chữ và nền đạt tối thiểu 4.5:1.
  - Hướng nợ được biểu đạt đa chiều: kết hợp giữa văn bản rõ nghĩa (_"Bạn đang nợ"_, _"Đang nợ bạn"_), màu sắc đặc thù, và biểu tượng chỉ hướng (mũi tên ra/vào).
  - Vùng chạm cảm ứng tối thiểu 44×44px cho tất cả các nút bấm, biểu tượng đóng và chip lựa chọn.

---

## Light Theme

- Nền vải ấm `canvas-light` (`#FAFAF9`), thẻ bề mặt màu trắng tinh khiết `surface-light` (`#FFFFFF`), đường viền hairline `#DDE4E1`.
- Mang lại cảm giác nhẹ nhàng, minh bạch và an tâm cho các thành viên trong gia đình khi theo dõi các khoản nợ cá nhân.

---

## Dark Theme

- Nền đá phiến sẫm `canvas-dark` (`#0B0F17` / `#141416`), thẻ bề mặt xanh đen `#131B2E` / `#1C1C1F`, viền tối `#1E293B` / `#2E2E33`.
- Đảm bảo tương đồng cấu trúc 1-1 với bản Light, màu sắc nợ nần được làm dịu mắt (Rose `#FB7185` và Emerald `#34D399` trên nền tối), không gây chói lóa ban đêm.

---

## Prototype

Các luồng tương tác thực tế đã được chuẩn hóa:

1. **Tiền (`/money`) → Vay mượn cá nhân (`/money/debts`)**: Nhấp vào mục Công nợ tại Money Overview mở ra Personal Lending Overview với danh sách phân nhóm rõ ràng.
2. **Tổng quan → Thêm khoản nợ (`DebtCreateSheet`)**: Chọn hướng nợ (_Mình cho vay_ hoặc _Mình đi vay_), nhập người liên quan, chọn nợ cũ hoặc tiền chuyển ngay hôm nay.
3. **Tổng quan → Chi tiết khoản cho vay (`/money/debts/:id` - Lent)**: Xem tiến độ đã thu hồi và nhấp `Ghi nhận nhận tiền →`.
4. **Tổng quan → Chi tiết khoản đi vay (`/money/debts/:id` - Borrowed)**: Xem số tiền còn phải trả và nhấp `Ghi nhận trả nợ →`.
5. **Chi tiết → Ghi nhận thanh toán (`DebtPaymentSheet`)**: Nhập số tiền trả/nhận, chọn phím tắt 50% hoặc Trả hết, chọn tài khoản trích tiền và xem trước dư nợ mới.
6. **Chi tiết → Chỉnh sửa & Tất toán (`DebtEditSheet`)**: Chỉnh sửa tên, gia hạn ngày trả, hoặc bấm `Đánh dấu đã hoàn tất khoản nợ` để đóng sổ.

---

## Deferred Issues

1. **Khoản vay ngân hàng (`/money/loans`)**: Đã hoàn thành độc lập tại Task 06, không gộp lẫn với công nợ cá nhân.
2. **Kế hoạch ngân sách (`/plan`), Hộp thư (`/inbox`), Gia đình (`/together`)**: Giữ nguyên toàn vẹn.
3. **Mã nguồn Next.js & Supabase**: Tuyệt đối không can thiệp, bảo toàn trạng thái triển khai sản xuất.
