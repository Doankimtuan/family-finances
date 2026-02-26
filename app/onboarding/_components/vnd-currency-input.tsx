"use client";

import { useMemo, useState } from "react";

type VndCurrencyInputProps = {
  id: string;
  name: string;
  defaultValue?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeDigits(value: string): string {
  const stripped = digitsOnly(value);
  if (stripped.length === 0) return "";
  return String(Number(stripped));
}

export function VndCurrencyInput({
  id,
  name,
  defaultValue = 0,
  placeholder,
  required,
  className,
}: VndCurrencyInputProps) {
  const [raw, setRaw] = useState<string>(String(Math.max(0, Math.round(defaultValue))));

  const displayValue = useMemo(() => {
    if (!raw) return "";
    return formatter.format(Number(raw));
  }, [raw]);

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        required={required}
        placeholder={placeholder}
        onChange={(event) => setRaw(normalizeDigits(event.target.value))}
        className={className}
      />
      <input type="hidden" name={name} value={raw || "0"} />
    </>
  );
}
