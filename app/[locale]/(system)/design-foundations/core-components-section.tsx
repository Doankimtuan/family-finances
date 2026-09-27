"use client";

import { useState } from "react";
import {
  Button,
  ButtonVariant,
  ButtonSize,
  IconButton,
  IconButtonVariant,
  Input,
  Textarea,
  Select,
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
  FormField,
  PasswordInput,
  CurrencyInput,
  QuantityInput,
  PercentageInput,
  NumberInput,
  SearchableSelect,
  DateInput,
} from "@/shared/ui/form";
import {
  Add01Icon,
  Search01Icon,
  FilterIcon,
  Settings01Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
} from "@/shared/ui/stitch-icon-compat";
import { AppIcon } from "@/shared/ui/app-icon";

export function CoreComponentsSection() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [text, setText] = useState("Nguyễn Văn A");
  const [password, setPassword] = useState("ViNha@2026");
  const [textarea, setTextarea] = useState(
    "Chi tiêu sinh hoạt gia đình tháng này",
  );
  const [numberVal, setNumberVal] = useState<number | null>(12);
  const [currencyVal, setCurrencyVal] = useState<number | null>(25_000_000);
  const [quantityVal, setQuantityVal] = useState<number | null>(1500);
  const [percentVal, setPercentVal] = useState<number | null>(7.5);
  const [selectVal, setSelectVal] = useState("tpbank");
  const [searchableVal, setSearchableVal] = useState("vcb");
  const [chkChecked, setChkChecked] = useState(true);
  const [chkIndet, setChkIndet] = useState(false);
  const [radioVal, setRadioVal] = useState("monthly");
  const [switchVal, setSwitchVal] = useState(true);
  const [tabVal, setTabVal] = useState("all");
  const [segmentVal, setSegmentVal] = useState("month");
  const [chipSelected, setChipSelected] = useState(true);
  const [searchQuery, setSearchQuery] = useState("Ăn uống");
  const [dateVal, setDateVal] = useState("2026-09-27");

  const bankOptions = [
    { id: "vcb", label: "Vietcombank — 001100... (Chính)" },
    { id: "tcb", label: "Techcombank — 19034... (Chi tiêu)" },
    { id: "tpbank", label: "TPBank — 03948... (Tiết kiệm)" },
    { id: "mbb", label: "MB Bank — 8888... (Dự phòng)" },
  ];

  return (
    <section className="flex flex-col gap-6 border-t border-border-subtle pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-title-lg text-text-primary">
              8. Core Reusable Components
            </h2>
            <span className="rounded-[var(--radius-xs)] bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg">
              TASK 02
            </span>
          </div>
          <p className="text-body-sm text-text-muted mt-0.5">
            Canonical ViNha Component Library (Warm Precision)
          </p>
        </div>
      </div>

      {/* Button Family */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">Button & IconButton</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.MD}
            isLoading={btnLoading}
            onClick={() => setBtnLoading(!btnLoading)}
          >
            {btnLoading ? "Đang lưu..." : "Primary Action"}
          </Button>
          <Button variant={ButtonVariant.TONAL} size={ButtonSize.MD}>
            Tonal Button
          </Button>
          <Button variant={ButtonVariant.OUTLINE} size={ButtonSize.MD}>
            Outlined
          </Button>
          <Button variant={ButtonVariant.GHOST} size={ButtonSize.MD}>
            Ghost
          </Button>
          <Button variant={ButtonVariant.DESTRUCTIVE} size={ButtonSize.MD}>
            Destructive
          </Button>
          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.MD}
            isDisabled
          >
            Disabled
          </Button>
        </div>

        {/* Sizes & Icons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.SM}
            leadingIcon={<AppIcon icon={Add01Icon} size="xs" />}
          >
            Small (36px)
          </Button>
          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.MD}
            leadingIcon={<AppIcon icon={CheckmarkCircle02Icon} size="sm" />}
          >
            Medium (44px)
          </Button>
          <Button variant={ButtonVariant.PRIMARY} size={ButtonSize.LG}>
            Large (52px)
          </Button>

          {/* IconButtons */}
          <div className="flex items-center gap-1.5 pl-2">
            <IconButton
              aria-label="Tìm kiếm"
              icon={<AppIcon icon={Search01Icon} size="sm" />}
              variant={IconButtonVariant.SURFACE}
            />
            <IconButton
              aria-label="Bộ lọc"
              icon={<AppIcon icon={FilterIcon} size="sm" />}
              variant={IconButtonVariant.GHOST}
            />
            <IconButton
              aria-label="Cài đặt"
              icon={<AppIcon icon={Settings01Icon} size="sm" />}
              variant={IconButtonVariant.PRIMARY}
            />
            <IconButton
              aria-label="Xóa"
              icon={<AppIcon icon={Delete02Icon} size="sm" />}
              variant={IconButtonVariant.DESTRUCTIVE}
            />
          </div>
        </div>
      </div>

      {/* Input Family */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">
          Text, Password & Textarea
        </h3>
        <div className="flex flex-col gap-3">
          <FormField
            id="user-name"
            label="Họ và tên"
            description="Tên hiển thị cho các thành viên trong gia đình"
          >
            <Input
              id="user-name"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tên người dùng"
            />
          </FormField>

          <PasswordInput
            id="user-password"
            label="Mật khẩu bảo vệ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <FormField
            id="error-field"
            label="Trường có lỗi (Error Validation)"
            error="Định dạng email không hợp lệ"
          >
            <Input id="error-field" value="invalid-email" hasError isReadOnly />
          </FormField>

          <FormField
            id="readonly-field"
            label="Chỉ đọc (Read-only vs Disabled)"
            description="Read-only retains 100% opacity and selection"
          >
            <Input id="readonly-field" value="user@vinha.app" isReadOnly />
          </FormField>

          <FormField id="notes-field" label="Ghi chú chi tiêu">
            <Textarea
              id="notes-field"
              value={textarea}
              onChange={(e) => setTextarea(e.target.value)}
              maxLength={200}
              showCounter
            />
          </FormField>
        </div>
      </div>

      {/* Financial Numeric Inputs */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">
          Financial Numeric Suite
        </h3>
        <div className="flex flex-col gap-3">
          <CurrencyInput
            label="Số tiền nạp vào hũ (VND)"
            value={currencyVal}
            onValueChange={setCurrencyVal}
            showWordsPreview
            quickChips={[50_000, 100_000, 500_000]}
            description="Nhập nhanh bằng các nút gợi ý bên dưới"
          />

          <div className="flex flex-col gap-3">
            <QuantityInput
              label="Khối lượng CCQ"
              value={quantityVal}
              onValueChange={setQuantityVal}
              maxValue={2500}
              unitSuffix="CCQ"
            />
            <PercentageInput
              label="Lãi suất vay"
              value={percentVal}
              onValueChange={setPercentVal}
              suffix="% / năm"
            />
          </div>

          <NumberInput
            label="Kỳ hạn thanh toán"
            value={numberVal}
            onValueChange={setNumberVal}
            min={1}
            max={360}
            suffix="tháng"
          />
        </div>
      </div>

      {/* Select & Dropdown */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">
          Select & Searchable Dropdown
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Tài khoản thanh toán (Canonical Select)
            </label>
            <Select
              selectedKey={selectVal}
              onSelectionChange={(key) => setSelectVal(String(key))}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Popover>
                <Select.ListBox>
                  {bankOptions.map((opt) => (
                    <Select.Item key={opt.id} id={opt.id} textValue={opt.label}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.ListBox>
              </Select.Popover>
            </Select>
          </div>

          <SearchableSelect
            id="searchable-bank"
            label="Tài khoản nhận tiền (Searchable Select)"
            options={bankOptions}
            value={searchableVal}
            onChange={setSearchableVal}
            placeholder="Chọn hoặc gõ tên ngân hàng..."
          />
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">Selection Controls</h3>
        <div className="flex flex-col gap-3">
          <CheckboxGroup>
            <Checkbox
              checked={chkChecked}
              onChange={(checked) => setChkChecked(checked)}
              label="Đồng ý điều khoản"
            />
            <Checkbox
              checked={false}
              indeterminate={chkIndet}
              onChange={() => setChkIndet(!chkIndet)}
              label="Chọn tất cả hũ (Indeterminate)"
            />
            <Checkbox checked={true} disabled label="Đã khóa (Disabled)" />
          </CheckboxGroup>

          <div className="pt-2 border-t border-border-subtle">
            <RadioGroup
              label="Chu kỳ lặp lại"
              value={radioVal}
              onChange={setRadioVal}
            >
              <Radio value="weekly" label="Hàng tuần" />
              <Radio value="monthly" label="Hàng tháng" />
              <Radio value="quarterly" label="Hàng quý" />
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Tự động trích tiền tiết kiệm
              </p>
              <p className="text-xs text-text-muted">
                Trích tự động vào ngày nhận lương hàng tháng
              </p>
            </div>
            <Switch
              checked={switchVal}
              onChange={setSwitchVal}
              aria-label="Tự động trích tiền"
            />
          </div>
        </div>
      </div>

      {/* Navigation & Filtering Controls */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">
          Tabs & Segmented Control
        </h3>
        <div className="flex flex-col gap-3">
          <Tabs
            tabs={[
              { id: "all", label: "Tất cả", count: 48 },
              { id: "income", label: "Thu nhập", count: 12 },
              { id: "expense", label: "Chi tiêu", count: 36 },
            ]}
            activeTab={tabVal}
            onChange={setTabVal}
            variant="capsule"
          />

          <Tabs
            tabs={[
              { id: "all", label: "Tổng quan" },
              { id: "detail", label: "Chi tiết dòng tiền" },
              { id: "history", label: "Lịch sử biến động" },
            ]}
            activeTab={tabVal}
            onChange={setTabVal}
            variant="underline"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-text-secondary">
              Xem theo:
            </span>
            <SegmentedControl
              options={[
                { id: "month", label: "Tháng" },
                { id: "quarter", label: "Quý" },
                { id: "year", label: "Năm" },
              ]}
              value={segmentVal}
              onChange={setSegmentVal}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
            <FilterChip
              selected={chipSelected}
              onPress={() => setChipSelected(!chipSelected)}
              count={5}
            >
              Hũ Chi Tiêu
            </FilterChip>
            <FilterChip
              selected={!chipSelected}
              onPress={() => setChipSelected(!chipSelected)}
            >
              Chưa phân loại
            </FilterChip>
            <FilterChip selected={false} onPress={() => {}} count={12}>
              Đã thanh toán
            </FilterChip>
          </div>
        </div>
      </div>

      {/* Badges & Statuses */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">Status Badge Family</h3>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={StatusBadgeTone.POSITIVE}>
            Đã nhận (Positive)
          </StatusBadge>
          <StatusBadge tone={StatusBadgeTone.WARNING}>
            Đến hạn (Warning)
          </StatusBadge>
          <StatusBadge tone={StatusBadgeTone.DANGER}>
            Quá hạn (Danger)
          </StatusBadge>
          <StatusBadge tone={StatusBadgeTone.INFO}>
            Đang chuyển (Info)
          </StatusBadge>
          <StatusBadge tone={StatusBadgeTone.GROWTH}>
            +12.4% (Growth)
          </StatusBadge>
          <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
            Dự thảo (Neutral)
          </StatusBadge>
        </div>
      </div>

      {/* Utility Inputs: Search & Date */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-xs">
        <h3 className="text-title-sm text-text-primary">Utility Inputs</h3>
        <div className="flex flex-col gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm giao dịch, người nhận, số tiền..."
          />

          <DateInput
            label="Ngày thực hiện giao dịch"
            value={dateVal}
            onChange={setDateVal}
            showShortcuts
            description="Hỗ trợ phím tắt Hôm nay và Hôm qua"
          />
        </div>
      </div>
    </section>
  );
}
