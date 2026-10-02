"use client";

import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import type { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { cn } from "@/shared/utils/cn";

export const FinancialAmountSize = {
  DISPLAY_HERO: "displayHero",
  SECTION_TOTAL: "sectionTotal",
  METRIC_MEDIUM: "metricMedium",
  ROW_AMOUNT: "rowAmount",
  MICRO_AMOUNT: "microAmount",
} as const;

export type FinancialAmountSize =
  | (typeof FinancialAmountSize)[keyof typeof FinancialAmountSize]
  | "hero"
  | "lg"
  | "md"
  | "sm"
  | "xs";

export const FinancialAmountTone = {
  INCOME: "income",
  EXPENSE: "expense",
  DEBT: "debt",
  TRANSFER: "transfer",
  NEUTRAL: "neutral",
  MUTED: "muted",
} as const;

export type FinancialAmountTone =
  (typeof FinancialAmountTone)[keyof typeof FinancialAmountTone];

const SIZE_CLASSES: Record<string, string> = {
  displayHero: "text-[32px] font-semibold leading-[38px] tracking-tight",
  sectionTotal: "text-2xl font-semibold leading-[30px] tracking-tight",
  metricMedium: "text-lg font-medium leading-[24px]",
  rowAmount: "text-[15px] font-medium leading-[20px]",
  microAmount: "text-xs font-medium leading-[16px]",
  // Backward compatibility with AmountSize tokens
  hero: "text-[32px] font-semibold leading-[38px] tracking-tight",
  lg: "text-2xl font-semibold leading-[30px] tracking-tight",
  md: "text-lg font-medium leading-[24px]",
  sm: "text-[15px] font-medium leading-[20px]",
  xs: "text-xs font-medium leading-[16px]",
};

const TONE_CLASSES: Record<FinancialAmountTone, string> = {
  income: "text-income",
  expense: "text-expense",
  debt: "text-debt",
  transfer: "text-transfer",
  neutral: "text-text-primary",
  muted: "text-text-secondary",
};

export type FinancialAmountProps = {
  /** Numeric value in major units (e.g. 500000 for 500,000 VND). */
  value?: number | null;
  /** Pre-formatted amount string (takes precedence if provided). */
  amountLabel?: string;
  /** Currency symbol, default "₫". */
  currency?: string;
  /** Position of the currency symbol. Defaults to "prefix". */
  currencyPosition?: "prefix" | "suffix";
  size?: FinancialAmountSize;
  tone?: FinancialAmountTone;
  kind?: FinancialNumberKind;
  /** Explicit sign prefix: "+" for income, "−" for expense, "⇄" for transfer. */
  showSign?: boolean;
  /** When true, masks value when financial privacy mode is enabled. */
  privacyAware?: boolean;
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  "data-testid"?: string;
};

/**
 * Canonical ViNha FinancialAmount primitive (Task 11 / Warm Precision).
 * Enforces tabular numbers, whole VND integers with dot separators,
 * standard size hierarchy, and explicit semantic color discipline.
 */
function useSafeLocale(): string {
  try {
    return useLocale();
  } catch {
    return "vi";
  }
}

export function FinancialAmount({
  value,
  amountLabel,
  currency = "₫",
  currencyPosition = "prefix",
  size = FinancialAmountSize.ROW_AMOUNT,
  tone = FinancialAmountTone.NEUTRAL,
  kind,
  showSign = false,
  privacyAware = true,
  className,
  prefix,
  suffix,
  "data-testid": testId,
}: FinancialAmountProps) {
  const locale = useSafeLocale();

  let formattedNumber = "";
  if (amountLabel !== undefined) {
    formattedNumber = amountLabel;
  } else if (value != null && Number.isFinite(value)) {
    const absVal = Math.abs(value);
    formattedNumber = formatNumber(absVal, locale, {
      maximumFractionDigits: 0,
    });
  }

  // Resolve semantic prefix sign if requested
  let signGlyph = "";
  if (showSign) {
    if (tone === FinancialAmountTone.INCOME) {
      signGlyph = "+ ";
    } else if (tone === FinancialAmountTone.EXPENSE) {
      signGlyph = "− ";
    } else if (tone === FinancialAmountTone.TRANSFER) {
      signGlyph = "⇄ ";
    }
  }

  const hasCurrency = Boolean(currency);
  const currencyElement = hasCurrency ? (
    <span className="font-semibold select-none">{currency}</span>
  ) : null;

  const content = (
    <>
      {prefix}
      {signGlyph}
      {currencyPosition === "prefix" && hasCurrency ? (
        <>
          {currencyElement}
          <span>&nbsp;</span>
        </>
      ) : null}
      <span>{formattedNumber}</span>
      {currencyPosition === "suffix" && hasCurrency ? (
        <>
          <span>&nbsp;</span>
          {currencyElement}
        </>
      ) : null}
      {suffix}
    </>
  );

  return (
    <span
      className={cn(
        "inline-flex items-baseline tabular-nums select-text",
        SIZE_CLASSES[size] ?? SIZE_CLASSES.rowAmount,
        TONE_CLASSES[tone] ?? TONE_CLASSES.neutral,
        className,
      )}
      data-financial-kind={kind}
      data-testid={testId}
    >
      {privacyAware ? <FinancialValue>{content}</FinancialValue> : content}
    </span>
  );
}
