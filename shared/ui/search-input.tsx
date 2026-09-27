"use client";

import { useRef, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Search01Icon } from "@/shared/ui/stitch-icon-compat";
import { StitchCloseIcon } from "@/shared/ui/stitch-icon-artwork";
import { AppIcon } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  variant?: "rounded" | "pill";
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha SearchInput primitive (Task 11 / Warm Precision).
 * Features 44px height, leading search icon, and interactive clear button
 * that preserves input focus when tapped.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  variant = "rounded",
  disabled = false,
  autoFocus,
  className,
  "data-testid": testId,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tA11y = useTranslations("a11y");
  const tForms = useTranslations("forms");

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div
      className={cn(
        "relative flex h-11 min-h-11 w-full items-center border bg-surface text-text-primary transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
        variant === "pill"
          ? "rounded-full px-4"
          : "rounded-[var(--radius-control)] px-3.5",
        "border-border-subtle hover:border-border-strong focus-within:border-transparent focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-focus-ring",
        disabled && "opacity-45 bg-surface-subtle cursor-not-allowed",
        className,
      )}
    >
      <span className="pointer-events-none flex shrink-0 text-text-muted mr-2.5">
        <AppIcon icon={Search01Icon} size="md" />
      </span>

      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel ?? tA11y("search")}
        placeholder={placeholder ?? tForms("searchInput.placeholder")}
        disabled={disabled}
        autoFocus={autoFocus}
        data-testid={testId}
        className="search-input__input w-full bg-transparent text-sm font-normal text-text-primary outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
      />

      {value && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label={tA11y("clearSearch")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary active:scale-95"
        >
          <AppIcon icon={StitchCloseIcon} size="sm" />
        </button>
      ) : null}
    </div>
  );
}
