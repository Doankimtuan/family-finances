"use client";

import { useState, useMemo, type ReactNode } from "react";
import { Select } from "@/shared/ui/select";
import { Search01Icon } from "@/shared/ui/stitch-icon-compat";
import { AppIcon } from "@/shared/ui/app-icon";
import { FormField, formFieldA11y } from "./form-field";

export type SearchableSelectOption = {
  id: string;
  label: string;
  secondaryText?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SearchableSelectProps = {
  id: string;
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha SearchableSelect primitive (Task 11 / Warm Precision).
 * High-performance dropdown with sticky search input for large option sets (e.g. banks, funds).
 */
export function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy kết quả phù hợp",
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  className,
  "data-testid": testId,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const hasError = Boolean(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description), required);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.secondaryText && opt.secondaryText.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const selectedOption = options.find((opt) => opt.id === value);

  const control = (
    <Select
      {...a11y}
      aria-label={typeof label === "string" ? label : id}
      className={className}
      selectedKey={value || null}
      onSelectionChange={(key) => {
        onChange(key == null ? "" : String(key));
        setQuery("");
      }}
      isDisabled={isDisabled || isReadOnly}
      isInvalid={hasError}
      placeholder={placeholder}
      data-testid={testId}
    >
      <Select.Trigger
        leadingIcon={selectedOption?.icon}
        hasError={hasError}
        className="w-full"
      >
        <Select.Value>
          {selectedOption ? selectedOption.label : placeholder}
        </Select.Value>
      </Select.Trigger>

      <Select.Popover>
        {/* Sticky Search Input */}
        <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-elevated p-2">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-2.5 text-text-muted">
              <AppIcon icon={Search01Icon} size="sm" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-border-subtle bg-surface pl-8 pr-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <Select.ListBox className="p-1">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-muted">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <Select.Item
                key={opt.id}
                id={opt.id}
                textValue={opt.label}
                leadingIcon={opt.icon}
                secondaryText={opt.secondaryText}
                isSelected={opt.id === value}
              >
                {opt.label}
              </Select.Item>
            ))
          )}
        </Select.ListBox>
      </Select.Popover>
    </Select>
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
