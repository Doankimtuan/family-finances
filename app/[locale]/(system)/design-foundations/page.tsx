"use client";

import { useTheme } from "@/providers/theme-provider";
import { useLocale } from "next-intl";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import { formatCurrency } from "@/shared/i18n/formatters";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  StitchSunIcon,
  StitchMoonIcon,
} from "@/shared/ui/stitch-icon-extensions";
import { CoreComponentsSection } from "./core-components-section";

/**
 * Development QA Harness for ViNha Design Foundations & Tokens (Implementation 01).
 * Allows visual inspection of:
 * - Color tokens & Light/Dark contrast
 * - Typography scale & Vietnamese diacritics
 * - Tabular financial numerals
 * - Corner radii tiers
 * - Spacing rhythm & screen gutters
 * - Elevation & hairline borders
 * - Focus-visible, Disabled (opacity 0.45), and Read-Only (opacity 1.0)
 * - Minimum 44x44px touch targets
 */
export default function DesignFoundationsPage() {
  const locale = useLocale();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const formatVnd = (value: number, options?: Intl.NumberFormatOptions) =>
    formatCurrency(value, DEFAULT_CURRENCY, locale, {
      maximumFractionDigits: 0,
      ...options,
    });

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const financialNumbers = [
    { label: "Zero", value: formatVnd(0) },
    { label: "Small Outflow", value: formatVnd(-50_000) },
    {
      label: "Monthly Income",
      value: formatVnd(5_000_000, { signDisplay: "always" }),
    },
    { label: "Large Jar", value: formatVnd(999_999_999) },
    { label: "Net Wealth Hero", value: formatVnd(2_036_547_748) },
    { label: "Long-term Asset", value: formatVnd(12_000_000_000) },
  ];

  return (
    <div
      data-testid="design-foundations-harness"
      className="flex min-h-full flex-col overflow-y-auto bg-canvas text-text-primary screen-gutter py-6 gap-6"
    >
      {/* Header & Theme Switcher */}
      <header className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg text-text-primary">
              Design Foundations
            </h1>
            <span className="rounded-[var(--radius-xs)] bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg">
              TASK 01
            </span>
          </div>
          <p className="text-body-sm text-text-muted mt-0.5">
            ViNha Warm Precision • Theme:{" "}
            <strong className="capitalize">{resolvedTheme}</strong> ({theme})
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          data-testid="theme-toggle-btn"
          aria-label="Chuyển giao diện sáng tối"
          className="touch-target-44 rounded-[var(--radius-control)] border border-border-subtle bg-surface text-text-primary hover:bg-surface-hover focus-ring"
        >
          <AppIcon
            icon={resolvedTheme === "dark" ? StitchSunIcon : StitchMoonIcon}
            size="md"
          />
        </button>
      </header>

      {/* 1. Color Palette Tokens */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          1. Canvas & Surface Hierarchy
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-canvas p-3">
            <span className="font-semibold text-text-primary">Canvas</span>
            <span className="text-[11px] text-text-muted">--color-canvas</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-3">
            <span className="font-semibold text-text-primary">
              Surface Card
            </span>
            <span className="text-[11px] text-text-muted">--color-surface</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface-subtle p-3">
            <span className="font-semibold text-text-primary">
              Surface Subtle
            </span>
            <span className="text-[11px] text-text-muted">
              --color-surface-subtle
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface-elevated shadow-(--elevation-1) p-3">
            <span className="font-semibold text-text-primary">
              Surface Elevated
            </span>
            <span className="text-[11px] text-text-muted">
              --color-surface-elevated
            </span>
          </div>
        </div>
      </section>

      {/* 2. Financial Domain Semantics */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          2. Financial Domain Semantic Tokens
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-primary-soft p-2.5 text-primary border border-primary/20">
            <span className="font-semibold">Primary Brand</span>
            <span className="font-mono text-[10px]">#0F766E</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-income-soft p-2.5 text-income border border-income/20">
            <span className="font-semibold">Income (+)</span>
            <span className="font-mono text-[10px]">Emerald</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-expense-soft p-2.5 text-expense border border-border-subtle">
            <span className="font-semibold">Expense (−)</span>
            <span className="font-mono text-[10px]">Slate</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-debt-soft p-2.5 text-debt border border-debt/20">
            <span className="font-semibold">Debt / Due</span>
            <span className="font-mono text-[10px]">Rose</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-transfer-soft p-2.5 text-transfer border border-transfer/20">
            <span className="font-semibold">Transfer</span>
            <span className="font-mono text-[10px]">Sky</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-investment-soft p-2.5 text-investment border border-investment/20">
            <span className="font-semibold">Investment</span>
            <span className="font-mono text-[10px]">Violet</span>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-[var(--radius-control)] bg-warning-soft p-2.5 text-warning border border-warning/20">
            <span className="font-semibold">Warning / Action Required</span>
            <span className="font-mono text-[10px]">Amber</span>
          </div>
        </div>
      </section>

      {/* 3. Typography & Vietnamese Diacritics */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          3. Typography Scale & Diacritic Safeguards
        </h2>
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
          <p className="text-numeric-hero text-text-primary">
            {formatVnd(2_036_547_748)}
          </p>
          <p className="text-headline-md text-text-primary">
            Tổng tài sản ròng khả dụng
          </p>
          <p className="text-title-md text-text-secondary">
            Khoản tiết kiệm tích lũy mỗi tháng (ễ, ẩ, ộ, đ)
          </p>
          <p className="text-body-md text-text-secondary">
            Bảo đảm chiều cao dòng tối thiểu 1.4x để không bị cắt dấu tiếng Việt
            trong mọi ngữ cảnh hiển thị.
          </p>
          <p className="text-label-md text-text-muted uppercase tracking-wider">
            Nhãn trường dữ liệu • 12px Medium
          </p>
        </div>
      </section>

      {/* 4. Tabular Financial Numerals */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          4. Tabular Financial Numerals
        </h2>
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 divide-y divide-border-subtle/50">
          {financialNumbers.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-text-secondary">{item.label}</span>
              <span className="font-medium tabular-nums text-text-primary text-numeric-md">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Disabled vs Read-Only System */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          5. Disabled vs. Read-Only System
        </h2>
        <div className="flex flex-col gap-2">
          {/* Disabled state */}
          <div className="flex flex-col gap-1 rounded-[var(--radius-control)] border p-3 state-disabled">
            <div className="flex items-center justify-between">
              <span className="font-medium text-xs">
                Disabled State ([disabled])
              </span>
              <span className="text-[10px]">
                opacity: 0.45 · pointer-events: none
              </span>
            </div>
            <p className="text-xs">
              Không tương tác được, giá trị chưa áp dụng hoặc bỏ qua.
            </p>
          </div>

          {/* Read-Only state */}
          <div className="flex flex-col gap-1 rounded-[var(--radius-control)] border p-3 state-readonly">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-text-primary">
                Read-Only State ([readonly])
              </span>
              <span className="text-[10px] text-text-muted">
                opacity: 1.0 · focusable · copyable
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Số dư gốc hợp đồng:{" "}
              <strong className="tabular-nums text-text-primary">
                {formatVnd(500_000_000)}
              </strong>{" "}
              (Thông tin quan trọng, không sửa được).
            </p>
          </div>
        </div>
      </section>

      {/* 6. Corner Radii & Elevation */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title-md text-text-primary">
          6. Corner Radii & Elevation
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-surface rounded-[var(--radius-sm)] shadow-(--elevation-1)">
            <span className="font-medium">Radius SM</span>
            <span className="text-[10px] text-text-muted">--radius-sm</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-surface rounded-[var(--radius-control)] shadow-(--elevation-1)">
            <span className="font-medium">Control</span>
            <span className="text-[10px] text-text-muted">
              --radius-control
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-surface rounded-[var(--radius-card)] shadow-(--elevation-2)">
            <span className="font-medium">Card</span>
            <span className="text-[10px] text-text-muted">--radius-card</span>
          </div>
        </div>
      </section>

      {/* 7. Interactive Touch Target & Focus-Visible */}
      <section className="flex flex-col gap-3 pb-8">
        <h2 className="text-title-md text-text-primary">
          7. Touch Target & Focus Ring
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="touch-target-44 rounded-[var(--radius-control)] bg-primary px-4 text-xs font-semibold text-primary-fg focus-ring transition-transform active:scale-[0.98]"
          >
            Button 44px (Touch Pass)
          </button>
          <button
            type="button"
            className="touch-target-44 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-4 text-xs font-medium text-text-primary focus-ring"
          >
            Outline 44px
          </button>
        </div>
      </section>

      {/* 8. Implementation 02 — Core Reusable Components */}
      <CoreComponentsSection />
    </div>
  );
}
