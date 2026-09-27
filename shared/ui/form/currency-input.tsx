"use client";

import { useId, type ReactNode } from "react";
import { useLocale } from "next-intl";
import {
  formatAmountInput,
  parseAmountDigits,
} from "@/shared/i18n/amount-input";
import { formatVietnameseCurrencyWords } from "@/shared/utils/vietnamese-words";
import { cn } from "@/shared/utils/cn";
import { FormField, formFieldA11y } from "./form-field";

export type CurrencyInputProps = {
  id?: string;
  label?: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  isHero?: boolean;
  showWordsPreview?: boolean;
  showQuickChips?: boolean;
  quickChips?: readonly number[];
  locale?: string;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
};

const DEFAULT_QUICK_CHIPS = [50_000, 100_000, 500_000, 1_000_000];

/**
 * Canonical ViNha CurrencyInput primitive (Task 11 / Warm Precision).
 * High-speed, zero-error VND entry with tabular numbers, ₫ prefix,
 * Vietnamese spoken pronunciation preview, and quick multiplier chips.
 */
export function CurrencyInput({
  id: idProp,
  label,
  value,
  onValueChange,
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  disabled,
  readOnly,
  isHero = false,
  showWordsPreview = true,
  showQuickChips = false,
  quickChips = DEFAULT_QUICK_CHIPS,
  locale: localeProp,
  placeholder = "0",
  className,
  "data-testid": testId,
}: CurrencyInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;

  const effectiveDisabled = isDisabled || disabled;
  const effectiveReadOnly = isReadOnly || readOnly;
  const hasError = Boolean(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description), required);

  const displayString = value != null ? formatAmountInput(value, locale) : "";
  const wordsPreview =
    showWordsPreview && value != null && value > 0
      ? formatVietnameseCurrencyWords(value)
      : null;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const parsed = parseAmountDigits(raw);
    onValueChange(parsed);
  };

  const handleAddAmount = (delta: number) => {
    if (effectiveDisabled || effectiveReadOnly) return;
    const current = value ?? 0;
    onValueChange(current + delta);
  };

  const handleRoundAmount = () => {
    if (effectiveDisabled || effectiveReadOnly || value == null || value === 0)
      return;
    // Round to nearest 10,000 or 50,000
    const rounded = Math.round(value / 10_000) * 10_000;
    onValueChange(rounded);
  };

  // Gracefully scale down hero font if length exceeds 12 chars
  const heroFontSize =
    displayString.length > 14
      ? "text-xl"
      : displayString.length > 10
        ? "text-2xl"
        : "text-numeric-hero";

  const control = (
    <div className="flex flex-col gap-1.5 w-full">
      <div
        className={cn(
          "relative flex w-full items-center rounded-[var(--radius-control)] border transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
          isHero
            ? "h-16 min-h-16 px-4 bg-surface"
            : "h-12 min-h-12 px-3.5 bg-surface",
          hasError
            ? "border-debt focus-within:border-debt focus-within:outline-debt"
            : "border-border-subtle hover:border-border-strong focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
          effectiveDisabled &&
            "opacity-45 bg-surface-subtle cursor-not-allowed",
          effectiveReadOnly && "bg-surface-subtle cursor-default",
          className,
        )}
      >
        <span
          className={cn(
            "pointer-events-none select-none font-semibold text-text-muted mr-1.5",
            isHero ? "text-xl" : "text-base",
          )}
        >
          ₫
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={displayString}
          disabled={effectiveDisabled}
          readOnly={effectiveReadOnly}
          aria-readonly={effectiveReadOnly || undefined}
          onChange={handleInputChange}
          data-testid={testId}
          className={cn(
            "w-full bg-transparent font-medium tracking-tight text-text-primary outline-none tabular-nums placeholder:text-text-muted",
            isHero ? heroFontSize : "text-base md:text-sm",
          )}
          {...a11y}
        />
      </div>

      {/* Real-time Vietnamese Pronunciation Preview */}
      {wordsPreview && !effectiveDisabled ? (
        <p
          className="text-label-sm text-text-secondary italic pl-1 leading-tight select-none animate-fadeIn"
          aria-live="polite"
        >
          {wordsPreview}
        </p>
      ) : null}

      {/* Quick Multiplier Chips */}
      {showQuickChips && !effectiveDisabled && !effectiveReadOnly ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickChips.map((chipAmount) => (
            <button
              key={chipAmount}
              type="button"
              onClick={() => handleAddAmount(chipAmount)}
              className="inline-flex h-7 items-center rounded-full bg-surface-subtle px-2.5 text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft border border-border-subtle"
            >
              +
              {formatAmountInput(chipAmount, locale)
                .replace(/\.000$/, "k")
                .replace(/\.000\.000$/, "M")}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRoundAmount}
            className="inline-flex h-7 items-center rounded-full bg-surface-subtle px-2.5 text-label-sm font-medium text-text-muted hover:text-text-primary border border-border-subtle"
          >
            Làm tròn
          </button>
        </div>
      ) : null}
    </div>
  );

  if (label) {
    return (
      <FormField
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
      >
        {control}
      </FormField>
    );
  }

  return control;
}
