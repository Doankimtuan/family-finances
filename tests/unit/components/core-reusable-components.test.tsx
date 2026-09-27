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
  CheckboxGroup,
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
  SearchableSelect,
} from "@/shared/ui/form";
import { formatVietnameseCurrencyWords } from "@/shared/utils/vietnamese-words";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        "a11y.search": "Tìm kiếm",
        "a11y.clearSearch": "Xóa nội dung tìm kiếm",
        "a11y.viewTabs": "Tùy chọn chế độ xem",
        "a11y.showPassword": "Hiện mật khẩu",
        "a11y.hidePassword": "Ẩn mật khẩu",
        "forms.searchInput.placeholder": "Tìm kiếm",
        "forms.searchableSelect.placeholder": "Chọn một mục",
        "forms.searchableSelect.searchPlaceholder": "Tìm trong các lựa chọn",
        "forms.searchableSelect.noResults": "Không tìm thấy kết quả phù hợp",
        "forms.dateShortcuts.today": "Hôm nay",
        "forms.dateShortcuts.yesterday": "Hôm qua",
        "forms.quantityInput.max": "Tối đa",
        "forms.quantityInput.maxValue": "{label}: {value}",
        "forms.percentageInput.suffix": "%",
      };
      return Object.entries(values ?? {}).reduce(
        (message, [name, value]) => message.replace(`{${name}}`, String(value)),
        messages[`${namespace}.${key}`] ?? key,
      );
    },
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
      const input = screen.getByRole("textbox", { name: "Kỳ hạn" });
      expect(input).toHaveValue("12");

      fireEvent.change(input, { target: { value: "24" } });
      fireEvent.blur(input);
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
          quickChips={[50_000, 100_000]}
        />,
      );

      const add50k = screen
        .getAllByRole("button")
        .find((button) => button.textContent?.startsWith("+50"));
      expect(add50k).toBeDefined();
      if (!add50k) throw new Error("The 50,000 amount chip was not rendered");
      fireEvent.click(add50k);
      expect(handleChange).toHaveBeenCalledWith(150_000);
    });

    it("uses compact locale labels and omits Vietnamese words in English", () => {
      render(
        <CurrencyInput
          label="Amount"
          locale="en"
          value={25_000_000}
          onValueChange={vi.fn()}
          quickChips={[1_000_000]}
          showWordsPreview
        />,
      );

      expect(screen.getByRole("button", { name: "+1M" })).toBeInTheDocument();
      expect(screen.queryByText("Hai mươi lăm triệu đồng")).toBeNull();
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
    it("renders a localized percentage suffix without domain-specific warnings", () => {
      render(
        <PercentageInput label="Lãi suất" value={35} onValueChange={vi.fn()} />,
      );

      expect(screen.getByText("%")).toBeInTheDocument();
      expect(screen.queryByText(/Lưu ý: Lãi suất/)).not.toBeInTheDocument();
    });
  });

  describe("Checkbox & CheckboxGroup", () => {
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
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      expect(screen.getByRole("checkbox")).toBePartiallyChecked();
      expect(screen.getByText("Ghi nhớ")).toBeInTheDocument();
    });

    it("uses defaultChecked for the native and visual states", () => {
      render(<Checkbox label="Ghi nhớ" defaultChecked />);
      expect(screen.getByRole("checkbox", { name: "Ghi nhớ" })).toBeChecked();
    });

    it("renders CheckboxGroup with label, description, and grouped items", () => {
      render(
        <CheckboxGroup label="Tùy chọn" description="Chọn các mục liên quan">
          <Checkbox label="Mục 1" />
          <Checkbox label="Mục 2" />
        </CheckboxGroup>,
      );

      expect(screen.getByText("Tùy chọn")).toBeInTheDocument();
      expect(screen.getByText("Chọn các mục liên quan")).toBeInTheDocument();
      expect(screen.getByText("Mục 1")).toBeInTheDocument();
      expect(screen.getByText("Mục 2")).toBeInTheDocument();
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

    it("initializes and updates an uncontrolled group from defaultValue", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup defaultValue="quarter" onChange={handleChange}>
          <Radio value="month" label="Hàng tháng" />
          <Radio value="quarter" label="Hàng quý" />
        </RadioGroup>,
      );

      const monthRadio = screen.getByRole("radio", { name: "Hàng tháng" });
      const quarterRadio = screen.getByRole("radio", { name: "Hàng quý" });
      expect(quarterRadio).toBeChecked();

      fireEvent.click(monthRadio);
      expect(monthRadio).toBeChecked();
      expect(handleChange).toHaveBeenCalledWith("month");
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

    it("moves focus and selection with tab arrow keys", () => {
      const handleChange = vi.fn();
      render(
        <Tabs
          tabs={[
            { id: "active", label: "Active" },
            { id: "archived", label: "Archived" },
          ]}
          activeTab="active"
          onChange={handleChange}
        />,
      );

      const activeTab = screen.getByRole("tab", { name: "Active" });
      const archivedTab = screen.getByRole("tab", { name: "Archived" });
      activeTab.focus();
      fireEvent.keyDown(activeTab, { key: "ArrowRight" });

      expect(archivedTab).toHaveFocus();
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

    it("skips disabled options during keyboard navigation", () => {
      const handleChange = vi.fn();
      render(
        <SegmentedControl
          options={[
            { id: "month", label: "Month" },
            { id: "quarter", label: "Quarter", disabled: true },
            { id: "year", label: "Year" },
          ]}
          value="month"
          onChange={handleChange}
        />,
      );

      const monthTab = screen.getByRole("tab", { name: "Month" });
      const yearTab = screen.getByRole("tab", { name: "Year" });
      fireEvent.keyDown(monthTab, { key: "ArrowRight" });

      expect(yearTab).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith("year");
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

      expect(input).toHaveAccessibleName("Tìm kiếm");
      const clearBtn = screen.getByRole("button", {
        name: "Xóa nội dung tìm kiếm",
      });
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

  describe("SearchableSelect", () => {
    it("marks unavailable options disabled", () => {
      render(
        <SearchableSelect
          id="account"
          label="Account"
          value=""
          onChange={vi.fn()}
          options={[
            { id: "open", label: "Open account" },
            { id: "closed", label: "Closed account", disabled: true },
          ]}
        />,
      );

      fireEvent.click(screen.getByRole("button"));
      expect(
        screen.getByRole("option", { name: "Closed account" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });
});
