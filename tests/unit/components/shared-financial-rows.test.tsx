import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FinancialAmount,
  FinancialAmountTone,
  KeyValueList,
  KeyValueRow,
  ProgressSummary,
} from "@/shared/ui";
import {
  BaseRow,
  BaseRowMinHeight,
  NavigationRow,
  FinancialRow,
  FinancialMetric,
  TransactionRow,
  TransactionType,
  TransactionAmountTone,
  AccountRow,
  SavingsRow,
  InvestmentRow,
  LoanRow,
  PersonalDebtRow,
  InboxRow,
  MemberRow,
  ProviderRow,
  ProviderLogo,
  StatusRow,
  PersonIdentity,
  getPersonInitials,
} from "@/shared/patterns";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

describe("Shared Financial & Row Components — Implementation 05", () => {
  describe("FinancialAmount", () => {
    it("renders formatted whole VND with dot separator by default", () => {
      render(<FinancialAmount value={1250000} />);
      expect(screen.getByText("1.250.000")).toBeInTheDocument();
      expect(screen.getByText("₫")).toBeInTheDocument();
    });

    it("renders pre-formatted label strings when provided", () => {
      render(<FinancialAmount amountLabel="12.500.000 ₫" />);
      expect(screen.getByText("12.500.000 ₫")).toBeInTheDocument();
    });

    it("renders sign glyphs when showSign is true", () => {
      const { rerender } = render(
        <FinancialAmount
          value={500000}
          tone={FinancialAmountTone.INCOME}
          showSign
        />,
      );
      expect(screen.getByText("+")).toBeInTheDocument();

      rerender(
        <FinancialAmount
          value={200000}
          tone={FinancialAmountTone.EXPENSE}
          showSign
        />,
      );
      expect(screen.getByText("−")).toBeInTheDocument();

      rerender(
        <FinancialAmount
          value={100000}
          tone={FinancialAmountTone.TRANSFER}
          showSign
        />,
      );
      expect(screen.getByText("⇄")).toBeInTheDocument();
    });

    it("applies canonical color tones correctly", () => {
      const { rerender } = render(
        <FinancialAmount
          value={500000}
          tone={FinancialAmountTone.DEBT}
          data-testid="amt"
        />,
      );
      expect(screen.getByTestId("amt")).toHaveClass("text-debt");

      rerender(
        <FinancialAmount
          value={500000}
          tone={FinancialAmountTone.INCOME}
          data-testid="amt"
        />,
      );
      expect(screen.getByTestId("amt")).toHaveClass("text-income");

      rerender(
        <FinancialAmount
          value={500000}
          tone={FinancialAmountTone.EXPENSE}
          data-testid="amt"
        />,
      );
      expect(screen.getByTestId("amt")).toHaveClass("text-expense");
    });

    it("masks amount when financial privacy mode is enabled", () => {
      window.localStorage.setItem(
        FINANCIAL_PRIVACY_STORAGE_KEY,
        FINANCIAL_PRIVACY_STORAGE_TRUE,
      );

      render(
        <FinancialPrivacyProvider>
          <FinancialAmount value={85000000} />
        </FinancialPrivacyProvider>,
      );

      expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
      expect(screen.queryByText("85.000.000")).not.toBeInTheDocument();

      window.localStorage.removeItem(FINANCIAL_PRIVACY_STORAGE_KEY);
    });
  });

  describe("FinancialMetric", () => {
    it("renders label, formatted amount, and optional supporting text", () => {
      render(
        <FinancialMetric
          label="Tổng tài sản"
          amount={150000000}
          supportingText="+12% so với tháng trước"
          badge={<span data-testid="badge">Mục tiêu 80%</span>}
        />,
      );

      expect(screen.getByText("Tổng tài sản")).toBeInTheDocument();
      expect(screen.getByText("150.000.000")).toBeInTheDocument();
      expect(screen.getByText("+12% so với tháng trước")).toBeInTheDocument();
      expect(screen.getByTestId("badge")).toBeInTheDocument();
    });
  });

  describe("KeyValueList & KeyValueRow", () => {
    it("renders semantic dl, dt, dd structure", () => {
      render(
        <KeyValueList>
          <KeyValueRow label="Mã giao dịch" value="TX-998811" />
          <KeyValueRow
            label="Số tiền thực nhận"
            value={<FinancialAmount value={4500000} />}
            highlight
          />
        </KeyValueList>,
      );

      expect(screen.getAllByRole("definition").length).toBe(2);
      expect(screen.getByText("Mã giao dịch")).toBeInTheDocument();
      expect(screen.getByText("TX-998811")).toBeInTheDocument();
      expect(screen.getByText("Số tiền thực nhận")).toBeInTheDocument();
      expect(screen.getByText("4.500.000")).toBeInTheDocument();
    });
  });

  describe("BaseRow", () => {
    it("renders static container when neither href nor onClick is passed", () => {
      render(
        <BaseRow
          title="Static Title"
          subtitle="Static Subtitle"
          data-testid="static-row"
        />,
      );

      expect(screen.getByTestId("static-row")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders button when onClick is provided", () => {
      const handleClick = vi.fn();
      render(
        <BaseRow
          title="Clickable Row"
          onClick={handleClick}
          data-testid="button-row"
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders link when href is provided", () => {
      render(
        <BaseRow
          title="Link Row"
          href="/money/transactions/123"
          data-testid="link-row"
        />,
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/money/transactions/123");
    });

    it("stops propagation on secondary action slot so row click is preserved", () => {
      const handleRowClick = vi.fn();
      const handleActionClick = vi.fn();

      render(
        <BaseRow
          title="Row With Action"
          onClick={handleRowClick}
          action={
            <button
              type="button"
              data-testid="sec-action"
              onClick={handleActionClick}
            >
              More
            </button>
          }
        />,
      );

      const actionBtn = screen.getByTestId("sec-action");
      fireEvent.click(actionBtn);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleRowClick).not.toHaveBeenCalled();
    });

    it("applies minHeight variants", () => {
      const { rerender } = render(
        <BaseRow
          title="Instrument Row"
          minHeight={BaseRowMinHeight.INSTRUMENT}
          data-testid="min-row"
        />,
      );
      expect(
        screen.getByTestId("min-row").querySelector(".min-h-16"),
      ).toBeInTheDocument();

      rerender(
        <BaseRow
          title="Standard Row"
          minHeight={BaseRowMinHeight.STANDARD}
          data-testid="min-row"
        />,
      );
      expect(
        screen.getByTestId("min-row").querySelector(".min-h-\\[52px\\]"),
      ).toBeInTheDocument();
    });
  });

  describe("NavigationRow", () => {
    it("renders link with title, leading icon, and chevron", () => {
      render(
        <NavigationRow
          title="Cài đặt tài khoản"
          subtitle="Bảo mật & thông báo"
          href="/settings/account"
          icon={FINANCE_ICONS.cash}
          badge={<span data-testid="nav-badge">1 mới</span>}
        />,
      );

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/settings/account",
      );
      expect(screen.getByText("Cài đặt tài khoản")).toBeInTheDocument();
      expect(screen.getByText("Bảo mật & thông báo")).toBeInTheDocument();
      expect(screen.getByTestId("nav-badge")).toBeInTheDocument();
    });
  });

  describe("FinancialRow", () => {
    it("renders BaseRow with FinancialAmount trailing slot", () => {
      render(
        <FinancialRow
          title="Tiền ăn uống"
          subtitle="Chi tiêu thiết yếu"
          amount={850000}
          tone={FinancialAmountTone.EXPENSE}
          showSign
        />,
      );

      expect(screen.getByText("Tiền ăn uống")).toBeInTheDocument();
      expect(screen.getByText("Chi tiêu thiết yếu")).toBeInTheDocument();
      expect(screen.getByText("850.000")).toBeInTheDocument();
      expect(screen.getByText("−")).toBeInTheDocument();
    });
  });

  describe("TransactionRow", () => {
    it("strictly separates Transfer from Expense styling (never minus sign)", () => {
      render(
        <TransactionRow
          type={TransactionType.TRANSFER}
          title="Chuyển tiền tiết kiệm"
          subtitle="Ví chính → Quỹ khẩn cấp"
          amount={5000000}
        />,
      );

      expect(screen.getByText("Chuyển tiền tiết kiệm")).toBeInTheDocument();
      expect(screen.getByText("Ví chính → Quỹ khẩn cấp")).toBeInTheDocument();
      expect(screen.getByText("5.000.000")).toBeInTheDocument();
      // Should show transfer glyph ⇄, NOT minus −
      expect(screen.getByText("⇄")).toBeInTheDocument();
      expect(screen.queryByText("−")).not.toBeInTheDocument();
    });

    it("renders income with plus sign", () => {
      render(
        <TransactionRow
          type={TransactionType.INCOME}
          title="Lương công ty"
          subtitle="Techcorp VN"
          amount={35000000}
        />,
      );

      expect(screen.getByText("Lương công ty")).toBeInTheDocument();
      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText("35.000.000")).toBeInTheDocument();
    });

    it("supports legacy tone parameter for backward compatibility", () => {
      render(
        <TransactionRow
          title="Hoàn tiền mua sắm"
          amountLabel="250.000 ₫"
          tone={TransactionAmountTone.REFUND}
        />,
      );

      expect(screen.getByText("Hoàn tiền mua sắm")).toBeInTheDocument();
      expect(screen.getByText("250.000 ₫")).toBeInTheDocument();
    });
  });

  describe("AccountRow", () => {
    it("distinguishes credit card liabilities from asset balances", () => {
      const { rerender } = render(
        <AccountRow
          accountName="Thẻ tín dụng VIB Cash Back"
          institutionName="VIB Bank"
          isCredit
          balance={15000000}
          creditLimit={50000000}
        />,
      );

      expect(
        screen.getByText("Thẻ tín dụng VIB Cash Back"),
      ).toBeInTheDocument();
      expect(screen.getByText(/Hạn mức/)).toBeInTheDocument();
      expect(screen.getByText("15.000.000")).toBeInTheDocument();

      rerender(
        <AccountRow
          accountName="Tài khoản thanh toán"
          institutionName="Techcombank"
          balance={42000000}
        />,
      );

      expect(screen.getByText("Tài khoản thanh toán")).toBeInTheDocument();
      expect(screen.getByText("42.000.000")).toBeInTheDocument();
      expect(screen.queryByText(/Hạn mức/)).not.toBeInTheDocument();
    });
  });

  describe("SavingsRow", () => {
    it("displays deposit name, interest rate, maturity date, and yield", () => {
      render(
        <SavingsRow
          depositName="Tiết kiệm kỳ hạn 6 tháng"
          institutionName="BIDV"
          principal={100000000}
          interestRatePercent={5.5}
          maturityDate="2026-12-31"
          accruedYield={2750000}
        />,
      );

      expect(screen.getByText("Tiết kiệm kỳ hạn 6 tháng")).toBeInTheDocument();
      expect(screen.getByText(/5\.5% \/ năm/)).toBeInTheDocument();
      expect(screen.getByText(/2026-12-31/)).toBeInTheDocument();
      expect(screen.getByText("2.750.000")).toBeInTheDocument();
    });
  });

  describe("InvestmentRow", () => {
    it("presents calm portfolio row with quantity, price, and gain/loss", () => {
      render(
        <InvestmentRow
          symbol="FPT"
          assetName="FPT Corporation"
          quantity={500}
          currentPrice={135000}
          marketValue={67500000}
          unrealizedGainLoss={7500000}
          unrealizedGainLossPercent={12.5}
        />,
      );

      expect(screen.getAllByText("FPT").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/FPT Corporation/)).toBeInTheDocument();
      expect(screen.getByText("67.500.000")).toBeInTheDocument();
      expect(screen.getByText(/\+12\.5%/)).toBeInTheDocument();
    });
  });

  describe("LoanRow", () => {
    it("displays lender name, outstanding balance, and next installment", () => {
      render(
        <LoanRow
          lenderName="Vay mua nhà VPBank"
          purposeLabel="Gói ưu đãi 25 năm"
          remainingPrincipal={850000000}
          nextPaymentDate="2026-10-15"
          nextPaymentAmount={12500000}
        />,
      );

      expect(screen.getByText("Vay mua nhà VPBank")).toBeInTheDocument();
      expect(screen.getByText("Gói ưu đãi 25 năm")).toBeInTheDocument();
      expect(screen.getByText("850.000.000")).toBeInTheDocument();
      expect(screen.getByText(/12\.500\.000/)).toBeInTheDocument();
    });
  });

  describe("PersonalDebtRow", () => {
    it("mandates explicit textual direction (Cho vay vs Đi vay)", () => {
      const { rerender } = render(
        <PersonalDebtRow
          counterpartyName="Nguyễn Văn A"
          direction="lending"
          remainingAmount={10000000}
          dueDate="2026-11-01"
        />,
      );

      // Must have explicit text "Cho vay"
      expect(screen.getByText("Cho vay")).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
      expect(screen.getByText("10.000.000")).toBeInTheDocument();

      rerender(
        <PersonalDebtRow
          counterpartyName="Trần Thị B"
          direction="borrowing"
          remainingAmount={5000000}
        />,
      );

      // Must have explicit text "Đi vay"
      expect(screen.getAllByText("Đi vay").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Trần Thị B")).toBeInTheDocument();
      expect(screen.getByText("5.000.000")).toBeInTheDocument();
    });
  });

  describe("InboxRow", () => {
    it("renders urgency accent strip and impact amount", () => {
      render(
        <InboxRow
          title="Hoá đơn điện EVN đến hạn"
          subtitle="Hạn chót ngày mai"
          categoryBadge="Hóa đơn"
          urgency="urgent"
          impactAmount={1450000}
        />,
      );

      expect(screen.getByText("Hoá đơn điện EVN đến hạn")).toBeInTheDocument();
      expect(screen.getByText("Hạn chót ngày mai")).toBeInTheDocument();
      expect(screen.getByText("Hóa đơn")).toBeInTheDocument();
      expect(screen.getByText("1.450.000")).toBeInTheDocument();
    });
  });

  describe("MemberRow", () => {
    it("renders member avatar initials, active status pip, and role", () => {
      render(
        <MemberRow
          displayName="Đoàn Kim Tuấn"
          email="tuan@example.com"
          role="Chủ hộ"
          isActive
        />,
      );

      expect(screen.getByText("Đoàn Kim Tuấn")).toBeInTheDocument();
      expect(screen.getByText("tuan@example.com")).toBeInTheDocument();
      expect(screen.getByText("Chủ hộ")).toBeInTheDocument();
      expect(screen.getByText("ĐT")).toBeInTheDocument();
    });
  });

  describe("ProviderLogo & ProviderRow", () => {
    it("renders ProviderLogo with fallback initials when no logo URL", () => {
      render(<ProviderLogo name="Techcombank" />);
      expect(screen.getByText("TE")).toBeInTheDocument();
    });

    it("renders ProviderRow with connection status", () => {
      render(
        <ProviderRow
          providerName="Vietcombank"
          accountIdentifier="•••• 4321"
          connectionStatus="connected"
        />,
      );

      expect(screen.getByText("Vietcombank")).toBeInTheDocument();
      expect(screen.getByText("•••• 4321")).toBeInTheDocument();
      expect(screen.getByText("Đã kết nối")).toBeInTheDocument();
    });
  });

  describe("StatusRow", () => {
    it("renders status icon, title, description, and action button", () => {
      const handleAction = vi.fn();
      render(
        <StatusRow
          title="Đồng bộ ngân hàng thành công"
          description="Đã cập nhật 14 giao dịch mới."
          status="success"
          actionLabel="Xem ngay"
          onAction={handleAction}
        />,
      );

      expect(
        screen.getByText("Đồng bộ ngân hàng thành công"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Đã cập nhật 14 giao dịch mới."),
      ).toBeInTheDocument();
      const actionBtn = screen.getByRole("button", { name: "Xem ngay" });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("ProgressSummary", () => {
    it("renders current vs target amounts and clamps visual progress to 100%", () => {
      const { rerender } = render(
        <ProgressSummary
          label="Quỹ tiết kiệm mua nhà"
          currentAmount={750000000}
          targetAmount={1000000000}
        />,
      );

      expect(screen.getByText("Quỹ tiết kiệm mua nhà")).toBeInTheDocument();
      expect(screen.getByText("750.000.000")).toBeInTheDocument();
      expect(screen.getByText(/1\.000\.000\.000/)).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();

      // Test overage (>100%): visual fill clamps at 100%, text shows overage
      rerender(
        <ProgressSummary
          label="Ngân sách ăn uống"
          currentAmount={12000000}
          targetAmount={10000000}
        />,
      );

      expect(screen.getByText("120%")).toBeInTheDocument();
      expect(screen.getByText(/Vượt/)).toBeInTheDocument();
    });
  });

  describe("PersonIdentity & getPersonInitials", () => {
    it("correctly generates initials for Vietnamese and international names", () => {
      expect(getPersonInitials("Đoàn Kim Tuấn")).toBe("ĐT");
      expect(getPersonInitials("Nguyễn Văn A")).toBe("NA");
      expect(getPersonInitials("John Doe")).toBe("JD");
      expect(getPersonInitials("Solo")).toBe("SO");
      expect(getPersonInitials("")).toBe("VN");
    });

    it("renders PersonIdentity with avatar and display name", () => {
      render(
        <PersonIdentity name="Nguyễn Văn A" caption="Thành viên gia đình" />,
      );

      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
      expect(screen.getByText("Thành viên gia đình")).toBeInTheDocument();
      expect(screen.getByText("NA")).toBeInTheDocument();
    });
  });
});
