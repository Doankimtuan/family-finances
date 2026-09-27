import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ConfirmDialog,
  DialogVariant,
  BottomSheet,
  BottomSheetContent,
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuItemVariant,
  Toast,
  toast,
  InlineAlert,
  InlineAlertVariant,
  SkeletonText,
  SkeletonMetric,
  SkeletonIcon,
  SkeletonCard,
  SkeletonAmount,
  EmptyState,
  EmptyStateVariant,
  ErrorState,
  FormSection,
  FieldGroup,
  StickyFormAction,
  StickyFormActionLayout,
  CalculatedPreview,
  CalculatedPreviewStatus,
  ConfirmationSummary,
} from "@/shared/ui";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string) => key,
}));

describe("Overlays, Feedback & Form Infrastructure — Implementation 03", () => {
  describe("Dialog & ConfirmDialog", () => {
    it("renders ConfirmDialog in confirmation mode with confirm and cancel buttons", () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();
      const handleOpenChange = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          onOpenChange={handleOpenChange}
          title="Xác nhận lưu thay đổi"
          description="Dữ liệu sẽ được cập nhật vào sổ cái."
          confirmLabel="Lưu ngay"
          cancelLabel="Huỷ bỏ"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          testId="confirm-dialog-test"
        />,
      );

      expect(screen.getByText("Xác nhận lưu thay đổi")).toBeDefined();
      expect(
        screen.getByText("Dữ liệu sẽ được cập nhật vào sổ cái."),
      ).toBeDefined();

      const confirmBtn = screen.getByText("Lưu ngay");
      const cancelBtn = screen.getByText("Huỷ bỏ");

      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("renders destructive ConfirmDialog with alertdialog role and destructive button", () => {
      const handleConfirm = vi.fn();
      render(
        <ConfirmDialog
          isOpen={true}
          onOpenChange={vi.fn()}
          variant={DialogVariant.DESTRUCTIVE}
          title="Xoá tài khoản thành viên"
          description="Hành động này không thể hoàn tác."
          confirmLabel="Xoá vĩnh viễn"
          onConfirm={handleConfirm}
          testId="destructive-dialog-test"
        />,
      );

      const dialog = screen.getByTestId("destructive-dialog-test");
      expect(dialog.getAttribute("role")).toBe("alertdialog");
      expect(screen.getByText("Xoá tài khoản thành viên")).toBeDefined();
    });

    it("disables confirm button when isConfirmLoading or isConfirmDisabled is true", () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onOpenChange={vi.fn()}
          title="Đang xử lý"
          confirmLabel="Đang lưu..."
          isConfirmLoading={true}
          onConfirm={vi.fn()}
        />,
      );

      const confirmBtn = screen.getByText("Đang lưu...").closest("button");
      expect(confirmBtn).toBeDefined();
      expect(
        confirmBtn?.getAttribute("aria-disabled") ??
          confirmBtn?.getAttribute("disabled"),
      ).toBeTruthy();
    });
  });

  describe("BottomSheet", () => {
    it("renders bottom sheet with handle and content", () => {
      render(
        <BottomSheet isOpen={true} onOpenChange={vi.fn()}>
          <BottomSheetContent testId="sheet-test">
            <div data-testid="sheet-body-content">Nội dung chọn phân loại</div>
          </BottomSheetContent>
        </BottomSheet>,
      );

      expect(screen.getByTestId("sheet-test")).toBeDefined();
      expect(screen.getByTestId("sheet-body-content")).toBeDefined();
    });
  });

  describe("ActionMenu", () => {
    it("renders action menu trigger and responds to click", () => {
      render(
        <ActionMenu>
          <ActionMenuTrigger>Thao tác</ActionMenuTrigger>
          <ActionMenuContent testId="action-menu-test">
            <ActionMenuItem>Chỉnh sửa</ActionMenuItem>
            <ActionMenuItem isDisabled={true}>Khoá tài khoản</ActionMenuItem>
            <ActionMenuSeparator />
            <ActionMenuItem variant={ActionMenuItemVariant.DESTRUCTIVE}>
              Xoá mục
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>,
      );

      const triggerBtn = screen.getByText("Thao tác");
      expect(triggerBtn).toBeDefined();
      fireEvent.click(triggerBtn);

      expect(screen.getByTestId("action-menu-test")).toBeDefined();
      expect(screen.getByText("Chỉnh sửa")).toBeDefined();
      expect(screen.getByText("Khoá tài khoản")).toBeDefined();
      expect(screen.getByText("Xoá mục")).toBeDefined();
    });
  });

  describe("Toast", () => {
    it("exports Toast component and toast dispatcher", () => {
      expect(Toast).toBeDefined();
      expect(toast).toBeDefined();
      expect(typeof toast.success).toBe("function");
      expect(typeof toast.danger).toBe("function");
      expect(typeof toast.warning).toBe("function");
      expect(typeof toast.info).toBe("function");
    });
  });

  describe("InlineAlert", () => {
    it("renders with 4 semantic variants: info, warning, error, success", () => {
      const { rerender } = render(
        <InlineAlert
          variant={InlineAlertVariant.INFO}
          title="Thông tin tài khoản"
          description="Số dư ngân hàng được bảo toàn độc lập."
          testId="alert-info"
        />,
      );

      const infoAlert = screen.getByTestId("alert-info");
      expect(infoAlert.getAttribute("role")).toBe("status");
      expect(screen.getByText("Thông tin tài khoản")).toBeDefined();

      rerender(
        <InlineAlert
          variant={InlineAlertVariant.ERROR}
          title="Khoản vay quá hạn"
          description="Vui lòng kiểm tra lại kỳ thanh toán."
          testId="alert-error"
        />,
      );

      const errorAlert = screen.getByTestId("alert-error");
      expect(errorAlert.getAttribute("role")).toBe("alert");
      expect(screen.getByText("Khoản vay quá hạn")).toBeDefined();
    });

    it("supports optional action and dismiss button", () => {
      const handleDismiss = vi.fn();
      render(
        <InlineAlert
          variant={InlineAlertVariant.WARNING}
          title="Sắp chạm hạn mức"
          action={<button type="button">Xem chi tiết</button>}
          onDismiss={handleDismiss}
        />,
      );

      expect(screen.getByText("Xem chi tiết")).toBeDefined();
      const dismissBtn = screen.getByRole("button", { name: "Đóng thông báo" });
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Skeleton Primitives", () => {
    it("renders geometric skeletons with layout stability attributes", () => {
      render(
        <div data-testid="skeleton-container">
          <SkeletonText data-testid="sk-text" />
          <SkeletonMetric data-testid="sk-metric" />
          <SkeletonIcon data-testid="sk-icon" />
          <SkeletonCard data-testid="sk-card" />
          <SkeletonAmount data-testid="sk-amount" />
        </div>,
      );

      expect(screen.getByTestId("sk-text").getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(screen.getByTestId("sk-metric").getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(screen.getByTestId("sk-icon").getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(screen.getByTestId("sk-card").getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(screen.getByTestId("sk-amount").getAttribute("aria-hidden")).toBe(
        "true",
      );
    });
  });

  describe("EmptyState", () => {
    it("renders EmptyState with canonical variants and optional CTA", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          variant={EmptyStateVariant.PENDING_CLEAR}
          title="Hiện không có việc nào cần chú ý"
          description="Tất cả giao dịch đã được gắn hũ."
          action={
            <button type="button" onClick={handleAction}>
              Xem tổng quan
            </button>
          }
          testId="empty-pending-clear"
        />,
      );

      expect(
        screen.getByText("Hiện không có việc nào cần chú ý"),
      ).toBeDefined();
      expect(
        screen.getByText("Tất cả giao dịch đã được gắn hũ."),
      ).toBeDefined();

      const actionBtn = screen.getByText("Xem tổng quan");
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("renders Zero Debt variant without forced CTA", () => {
      render(
        <EmptyState
          variant={EmptyStateVariant.ZERO_DEBT}
          title="Hộ gia đình không có khoản nợ nào"
          description="Bạn đã hoàn tất tất cả các nghĩa vụ tài chính."
        />,
      );

      expect(
        screen.getByText("Hộ gia đình không có khoản nợ nào"),
      ).toBeDefined();
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("ErrorState", () => {
    it("renders ErrorState with user-facing message and retry CTA", () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Mất kết nối mạng"
          description="Dữ liệu cục bộ vẫn an toàn. Vui lòng kiểm tra Wi-Fi hoặc 4G."
          onRetry={handleRetry}
          retryLabel="Thử lại ngay"
          testId="error-state-test"
        />,
      );

      expect(screen.getByTestId("error-state-test")).toBeDefined();
      expect(screen.getByText("Mất kết nối mạng")).toBeDefined();

      const retryBtn = screen.getByText("Thử lại ngay");
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("FormSection & FieldGroup", () => {
    it("renders FormSection with title, description, and fields", () => {
      render(
        <FormSection
          title="Thông tin hợp đồng"
          description="Nhập thông tin sổ tiết kiệm gửi tại ngân hàng."
          testId="form-section-test"
        >
          <div data-testid="field-child">Field 1</div>
        </FormSection>,
      );

      expect(screen.getByTestId("form-section-test")).toBeDefined();
      expect(screen.getByText("Thông tin hợp đồng")).toBeDefined();
      expect(
        screen.getByText("Nhập thông tin sổ tiết kiệm gửi tại ngân hàng."),
      ).toBeDefined();
      expect(screen.getByTestId("field-child")).toBeDefined();
    });

    it("renders FieldGroup with responsive columns", () => {
      render(
        <FieldGroup columns={2} testId="field-group-test">
          <div>Cột 1</div>
          <div>Cột 2</div>
        </FieldGroup>,
      );

      expect(screen.getByTestId("field-group-test")).toBeDefined();
      expect(screen.getByText("Cột 1")).toBeDefined();
      expect(screen.getByText("Cột 2")).toBeDefined();
    });
  });

  describe("StickyFormAction", () => {
    it("renders sticky action bar with primary and secondary actions", () => {
      render(
        <StickyFormAction
          primaryAction={<button type="button">Lưu giao dịch</button>}
          secondaryAction={<button type="button">Huỷ</button>}
          layout={StickyFormActionLayout.SPLIT}
          testId="sticky-action-test"
        />,
      );

      expect(screen.getByTestId("sticky-action-test")).toBeDefined();
      expect(screen.getByText("Lưu giao dịch")).toBeDefined();
      expect(screen.getByText("Huỷ")).toBeDefined();
    });
  });

  describe("CalculatedPreview", () => {
    it("renders valid calculated value with formula label", () => {
      render(
        <CalculatedPreview
          label="Tổng tiền dự tính"
          value="₫ 25.000.000"
          formula="10 CCQ × ₫ 2.500.000"
          status={CalculatedPreviewStatus.VALID}
          testId="calc-valid"
        />,
      );

      expect(screen.getByText("Tổng tiền dự tính")).toBeDefined();
      expect(screen.getByText("₫ 25.000.000")).toBeDefined();
      expect(screen.getByText("10 CCQ × ₫ 2.500.000")).toBeDefined();
    });

    it("renders incomplete state with subtle dash placeholder (not fake ₫0)", () => {
      render(
        <CalculatedPreview
          label="Tổng thanh toán"
          status={CalculatedPreviewStatus.INCOMPLETE}
          testId="calc-incomplete"
        />,
      );

      expect(screen.getByText("—")).toBeDefined();
      expect(screen.queryByText("₫ 0")).toBeNull();
    });

    it("renders error state with clear warning message", () => {
      render(
        <CalculatedPreview
          label="Phân bổ ngân sách"
          status={CalculatedPreviewStatus.ERROR}
          errorMessage="Số tiền vượt quá hạn mức còn lại của hũ"
          testId="calc-error"
        />,
      );

      expect(
        screen.getByText("Số tiền vượt quá hạn mức còn lại của hũ"),
      ).toBeDefined();
    });
  });

  describe("ConfirmationSummary", () => {
    it("renders key-value summary rows, highlight row, note, and edit button", () => {
      const handleEdit = vi.fn();
      render(
        <ConfirmationSummary
          title="Tóm tắt giao dịch chuyển tiền"
          onEdit={handleEdit}
          editLabel="Sửa giao dịch"
          rows={[
            {
              id: "from",
              label: "Tài khoản nguồn",
              value: "VPBank (...4821)",
              kind: "text",
            },
            { id: "to", label: "Hũ nhận", value: "Hũ Sinh hoạt", kind: "text" },
            {
              id: "amount",
              label: "Số tiền",
              value: "₫ 5.000.000",
              kind: "text",
              isHighlighted: true,
            },
          ]}
          note="Giao dịch phân bổ nội bộ không làm biến động tổng số dư ngân hàng."
          testId="confirm-summary-test"
        />,
      );

      expect(screen.getByText("Tóm tắt giao dịch chuyển tiền")).toBeDefined();
      expect(screen.getByText("Tài khoản nguồn")).toBeDefined();
      expect(screen.getByText("VPBank (...4821)")).toBeDefined();
      expect(screen.getByText("₫ 5.000.000")).toBeDefined();
      expect(
        screen.getByText(
          "Giao dịch phân bổ nội bộ không làm biến động tổng số dư ngân hàng.",
        ),
      ).toBeDefined();

      const editBtn = screen.getByText("Sửa giao dịch");
      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledTimes(1);
    });
  });
});
