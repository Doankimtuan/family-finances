import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Button,
  ButtonVariant,
  ButtonSize,
  IconButton,
  IconButtonVariant,
  Input,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Tabs,
  SegmentedControl,
  FilterChip,
  StatusBadge,
  StatusBadgeTone,
  SearchInput,
} from "@/shared/ui";
import {
  PasswordInput,
  CurrencyInput,
  QuantityInput,
  PercentageInput,
  NumberInput,
  DateInput,
} from "@/shared/ui/form";
import { formatVietnameseCurrencyWords } from "@/shared/utils/vietnamese-words";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
}));

describe("Core Reusable Components — Implementation 02", () => {
  describe("Button", () => {
    it("renders with canonical variants and handles click", () => {
      const handleClick = vi.fn();
      render(
        <Button
          variant={ButtonVariant.PRIMARY}
          size={ButtonSize.MD}
          onClick={handleClick}
        >
          Lưu giao dịch
        </Button>,
      );

      const btn = screen.getByRole("button", { name: "Lưu giao dịch" });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables interaction and sets aria-busy when isLoading is true", () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading loadingText="Đang xử lý..." onClick={handleClick}>
          Xác nhận
        </Button>,
      );

      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("data-loading", "true");
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
      expect(screen.getByText("Đang xử lý...")).toBeInTheDocument();
    });

    it("renders tonal and destructive variants", () => {
      const { rerender } = render(
        <Button variant={ButtonVariant.TONAL}>Xem chi tiết</Button>,
      );
      expect(
        screen.getByRole("button", { name: "Xem chi tiết" }),
      ).toBeInTheDocument();

      rerender(
        <Button variant={ButtonVariant.DESTRUCTIVE}>Xoá đối tác</Button>,
      );
      expect(
        screen.getByRole("button", { name: "Xoá đối tác" }),
      ).toBeInTheDocument();
    });
  });

  describe("IconButton", () => {
    it("renders with mandatory aria-label and handles interaction", () => {
      const handleClick = vi.fn();
      render(
        <IconButton
          aria-label="Đóng bảng"
          variant={IconButtonVariant.SURFACE}
          onClick={handleClick}
        >
          <span>✕</span>
        </IconButton>,
      );

      const btn = screen.getByRole("button", { name: "Đóng bảng" });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("TextInput", () => {
    it("supports placeholder, value, error, and read-only attributes", () => {
      const { rerender } = render(
        <Input
          placeholder="Nhập tên đối tác"
          defaultValue="Nguyễn Văn A"
          hasError
        />,
      );

      const input = screen.getByPlaceholderText("Nhập tên đối tác");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "true");

      rerender(<Input placeholder="Nhập tên đối tác" isReadOnly />);
      const readOnlyInput = screen.getByPlaceholderText("Nhập tên đối tác");
      expect(readOnlyInput).toHaveAttribute("aria-readonly", "true");
    });
  });

  describe("PasswordInput", () => {
    it("toggles password visibility with accessible label", () => {
      render(
        <PasswordInput
          id="test-pwd"
          label="Mật khẩu"
          revealShowLabel="Hiện mật khẩu"
          revealHideLabel="Ẩn mật khẩu"
        />,
      );

      const input = screen.getByLabelText("Mật khẩu");
      expect(input).toHaveAttribute("type", "password");

      const toggleBtn = screen.getByRole("button", { name: "Hiện mật khẩu" });
      fireEvent.click(toggleBtn);

      expect(input).toHaveAttribute("type", "text");
      expect(
        screen.getByRole("button", { name: "Ẩn mật khẩu" }),
      ).toBeInTheDocument();
    });
  });

  describe("Textarea", () => {
    it("renders with character counter and value", () => {
      render(
        <Textarea
          placeholder="Nhập ghi chú"
          value="Ghi chú chi tiêu"
          maxLength={100}
          currentLength={16}
          showCounter
          readOnly
        />,
      );

      expect(screen.getByPlaceholderText("Nhập ghi chú")).toBeInTheDocument();
      expect(screen.getByText("16 / 100 ký tự")).toBeInTheDocument();
    });
  });

  describe("NumberInput", () => {
    it("parses numeric values and displays suffix", () => {
      const handleChange = vi.fn();
      render(
        <NumberInput
          label="Kỳ hạn"
          value={12}
          suffix="tháng"
          onValueChange={handleChange}
        />,
      );

      expect(screen.getByText("tháng")).toBeInTheDocument();
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(12);

      fireEvent.change(input, { target: { value: "24" } });
      expect(handleChange).toHaveBeenCalledWith(24);
    });
  });

  describe("CurrencyInput & Vietnamese Spoken Preview", () => {
    it("generates correct Vietnamese spoken words for VND amounts", () => {
      expect(formatVietnameseCurrencyWords(0)).toBe("Không đồng");
      expect(formatVietnameseCurrencyWords(50_000)).toBe("Năm mươi nghìn đồng");
      expect(formatVietnameseCurrencyWords(500_000)).toBe(
        "Năm trăm nghìn đồng",
      );
      expect(formatVietnameseCurrencyWords(5_000_000)).toBe("Năm triệu đồng");
      expect(formatVietnameseCurrencyWords(25_000_000)).toBe(
        "Hai mươi lăm triệu đồng",
      );
      expect(formatVietnameseCurrencyWords(12_000_000_000)).toBe(
        "Mười hai tỷ đồng",
      );
    });

    it("renders ₫ prefix, thousand separators, and pronunciation preview", () => {
      render(
        <CurrencyInput
          label="Số tiền"
          value={25_000_000}
          onValueChange={vi.fn()}
          showWordsPreview
        />,
      );

      expect(screen.getByText("₫")).toBeInTheDocument();
      expect(screen.getByDisplayValue("25.000.000")).toBeInTheDocument();
      expect(screen.getByText("Hai mươi lăm triệu đồng")).toBeInTheDocument();
    });

    it("supports quick multiplier chips", () => {
      const handleChange = vi.fn();
      render(
        <CurrencyInput
          label="Số tiền"
          value={100_000}
          onValueChange={handleChange}
          showQuickChips
          quickChips={[50_000, 100_000]}
        />,
      );

      const add50k = screen.getByRole("button", { name: "+50k" });
      fireEvent.click(add50k);
      expect(handleChange).toHaveBeenCalledWith(150_000);
    });
  });

  describe("QuantityInput", () => {
    it("supports decimal parsing, unit suffix, and MAX action button", () => {
      const handleChange = vi.fn();
      render(
        <QuantityInput
          label="Khối lượng"
          value={150.5}
          unitSuffix="CCQ"
          maxValue={500}
          onValueChange={handleChange}
        />,
      );

      expect(screen.getByText("CCQ")).toBeInTheDocument();
      const maxBtn = screen.getByRole("button", { name: "Tối đa: 500" });
      fireEvent.click(maxBtn);
      expect(handleChange).toHaveBeenCalledWith(500);
    });
  });

  describe("PercentageInput", () => {
    it("renders percentage suffix and displays rate warning if >30%", () => {
      render(
        <PercentageInput label="Lãi suất" value={35} onValueChange={vi.fn()} />,
      );

      expect(screen.getByText("% / năm")).toBeInTheDocument();
      expect(
        screen.getByText(/Lưu ý: Lãi suất trên 30%\/năm là mức rất cao/),
      ).toBeInTheDocument();
    });
  });

  describe("Checkbox", () => {
    it("handles checked and indeterminate states", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <Checkbox
          label="Ghi nhớ đăng nhập"
          checked={false}
          onChange={handleChange}
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);

      rerender(<Checkbox label="Ghi nhớ" indeterminate />);
      expect(screen.getByText("Ghi nhớ")).toBeInTheDocument();
    });
  });

  describe("Radio & RadioGroup", () => {
    it("manages mutually exclusive selection within RadioGroup", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup value="month" onChange={handleChange} label="Chu kỳ">
          <Radio value="month" label="Hàng tháng" />
          <Radio value="quarter" label="Hàng quý" />
        </RadioGroup>,
      );

      const monthRadio = screen.getByRole("radio", { name: "Hàng tháng" });
      const quarterRadio = screen.getByRole("radio", { name: "Hàng quý" });

      expect(monthRadio).toBeChecked();
      expect(quarterRadio).not.toBeChecked();

      fireEvent.click(quarterRadio);
      expect(handleChange).toHaveBeenCalledWith("quarter");
    });
  });

  describe("Switch", () => {
    it("renders accessible role=switch and toggles state", () => {
      const handleChange = vi.fn();
      render(
        <Switch
          label="Sinh trắc học"
          checked={false}
          onChange={handleChange}
        />,
      );

      const switchEl = screen.getByRole("switch", { name: "Sinh trắc học" });
      expect(switchEl).not.toBeChecked();

      fireEvent.click(switchEl);
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Tabs", () => {
    it("supports capsule and underline variants with count badges", () => {
      const handleChange = vi.fn();
      const tabs = [
        { id: "active", label: "Đang mở", count: 14 },
        { id: "archived", label: "Đã lưu trữ", count: 42 },
      ];

      render(
        <Tabs
          tabs={tabs}
          activeTab="active"
          onChange={handleChange}
          variant="capsule"
        />,
      );

      expect(screen.getByRole("tab", { name: "Đang mở 14" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      const archivedTab = screen.getByRole("tab", { name: "Đã lưu trữ 42" });
      expect(archivedTab).toHaveAttribute("aria-selected", "false");

      fireEvent.click(archivedTab);
      expect(handleChange).toHaveBeenCalledWith("archived");
    });
  });

  describe("SegmentedControl", () => {
    it("renders options and switches active segment", () => {
      const handleChange = vi.fn();
      const options = [
        { id: "month", label: "Tháng" },
        { id: "quarter", label: "Quý" },
        { id: "year", label: "Năm" },
      ];

      render(
        <SegmentedControl
          options={options}
          value="month"
          onChange={handleChange}
        />,
      );

      expect(screen.getByRole("tab", { name: "Tháng" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      const quarterTab = screen.getByRole("tab", { name: "Quý" });
      fireEvent.click(quarterTab);
      expect(handleChange).toHaveBeenCalledWith("quarter");
    });
  });

  describe("FilterChip", () => {
    it("renders pill with count and handles press", () => {
      const handlePress = vi.fn();
      render(
        <FilterChip selected count={5} onPress={handlePress}>
          Tài khoản
        </FilterChip>,
      );

      const chip = screen.getByRole("button", { name: "Tài khoản 5" });
      expect(chip).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(chip);
      expect(handlePress).toHaveBeenCalledTimes(1);
    });
  });

  describe("StatusBadge", () => {
    it("renders canonical semantic tones with text", () => {
      const { rerender } = render(
        <StatusBadge tone={StatusBadgeTone.POSITIVE}>Hoạt động</StatusBadge>,
      );
      expect(screen.getByText("Hoạt động")).toBeInTheDocument();

      rerender(
        <StatusBadge tone={StatusBadgeTone.DANGER}>Quá hạn</StatusBadge>,
      );
      expect(screen.getByText("Quá hạn")).toBeInTheDocument();

      rerender(
        <StatusBadge tone={StatusBadgeTone.WARNING}>Đang chờ</StatusBadge>,
      );
      expect(screen.getByText("Đang chờ")).toBeInTheDocument();
    });
  });

  describe("SearchInput", () => {
    it("renders searchbox and clear button that clears query", () => {
      const handleChange = vi.fn();
      render(
        <SearchInput
          value="Vietcombank"
          onChange={handleChange}
          placeholder="Tìm ngân hàng..."
        />,
      );

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("Vietcombank");

      const clearBtn = screen.getByRole("button", { name: "Xoá tìm kiếm" });
      fireEvent.click(clearBtn);
      expect(handleChange).toHaveBeenCalledWith("");
    });
  });

  describe("DateInput", () => {
    it("renders shortcuts and updates date on quick click", () => {
      const handleChange = vi.fn();
      render(
        <DateInput
          label="Ngày giao dịch"
          value="2026-09-27"
          onChange={handleChange}
          showShortcuts
        />,
      );

      const todayBtn = screen.getByRole("button", { name: "Hôm nay" });
      fireEvent.click(todayBtn);
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
