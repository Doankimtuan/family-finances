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
};

export function MoneyInput({
  id,
  name,
  defaultValue = 0,
  placeholder,
  required,
  className,
  autoFocus = false,
}: MoneyInputProps) {
  const { locale } = useI18n();
  const [raw, setRaw] = useState<string>(
    String(Math.max(0, Math.round(defaultValue))),
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
          setRaw(stripped.length === 0 ? "" : String(Number(stripped)));
        }}
        className={className}
      />
      <input type="hidden" name={name} value={raw || "0"} />
    </>
  );
}
