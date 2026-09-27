"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import { formatNumber } from "@/shared/i18n/formatters";
import { cn } from "@/shared/utils/cn";
import { formatVietnameseCurrencyWords } from "@/shared/utils/vietnamese-words";
import { AmountField, type AmountFieldProps } from "./amount-field";

export type CurrencyInputProps = Omit<
  AmountFieldProps,
  "id" | "value" | "onValueChange" | "leadingIcon" | "trailingElement"
> & {
  id?: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  isHero?: boolean;
  showWordsPreview?: boolean;
  quickChips?: readonly number[];
  disabled?: boolean;
  readOnly?: boolean;
};

/** VND amount entry composed from the shared localized AmountField. */
export function CurrencyInput({
  id: idProp,
  value,
  onValueChange,
  locale: localeProp,
  isHero = false,
  showWordsPreview = true,
  quickChips,
  disabled,
  readOnly,
  isReadOnly,
  className,
  ...props
}: CurrencyInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;
  const isVietnamese = locale.toLowerCase().startsWith("vi");
  const shouldShowVietnameseWords =
    showWordsPreview && isVietnamese && value != null && value > 0;

  return (
    <div className="flex w-full flex-col gap-(--space-2)">
      <AmountField
        id={id}
        {...props}
        value={value}
        onValueChange={onValueChange}
        locale={locale}
        disabled={disabled}
        isReadOnly={Boolean(readOnly || isReadOnly)}
        leadingIcon={
          !isVietnamese ? (
            <span aria-hidden="true" className="font-semibold">
              ₫
            </span>
          ) : undefined
        }
        trailingElement={
          isVietnamese ? (
            <span aria-hidden="true" className="font-semibold">
              ₫
            </span>
          ) : undefined
        }
        className={cn(
          "text-base md:text-sm",
          isHero && "h-16 min-h-16 text-numeric-hero",
          className,
        )}
      />

      {shouldShowVietnameseWords && !disabled ? (
        <p
          className="text-label-sm pl-1 leading-tight text-text-secondary italic"
          aria-live="polite"
        >
          {formatVietnameseCurrencyWords(value)}
        </p>
      ) : null}

      {quickChips?.length && !disabled && !readOnly && !isReadOnly ? (
        <div className="flex flex-wrap gap-(--space-1.5) pt-(--space-1)">
          {quickChips.map((chipAmount) => (
            <button
              key={chipAmount}
              type="button"
              onClick={() => onValueChange((value ?? 0) + chipAmount)}
              className="inline-flex min-h-11 items-center rounded-full border border-border-subtle bg-surface-subtle px-(--space-3) text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              +{formatNumber(chipAmount, locale, { notation: "compact" })}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
