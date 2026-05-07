"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";

type MoneyInputProps = {
  id?: string;
  name: string;
  defaultValue?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  onValueChange?: (value: number | undefined) => void;
};

export function MoneyInput({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  className,
  autoFocus = false,
  onValueChange,
}: MoneyInputProps) {
  const { locale } = useI18n();
  const [raw, setRaw] = useState<string>(
    defaultValue === undefined || defaultValue === null
      ? ""
      : String(Math.max(0, Math.round(defaultValue))),
  );
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const displayValue = useMemo(() => {
    if (!raw) return "";
    return formatter.format(Number(raw));
  }, [raw, formatter]);

  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={displayValue}
        required={required}
        placeholder={placeholder}
        onChange={(event) => {
          const stripped = event.target.value.replace(/\D/g, "");
          const nextVal = stripped.length === 0 ? undefined : Number(stripped);
          setRaw(stripped.length === 0 ? "" : String(nextVal));
          onValueChange?.(nextVal);
        }}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
