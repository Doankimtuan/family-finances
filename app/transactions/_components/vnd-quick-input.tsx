"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/lib/providers/i18n-provider";

type VndQuickInputProps = {
  id: string;
  name: string;
  defaultValue?: number;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

export function VndQuickInput({
  id,
  name,
  defaultValue = 0,
  className,
  placeholder,
  autoFocus = false,
}: VndQuickInputProps) {
  const { locale } = useI18n();
  const [raw, setRaw] = useState(String(Math.max(0, Math.round(defaultValue))));
  const formatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);

  const display = useMemo(() => {
    const n = Number(raw || 0);
    if (!raw) return "";
    return formatter.format(n);
  }, [raw, formatter]);

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={display}
        onChange={(event) => setRaw(event.target.value.replace(/\D/g, "") || "0")}
        className={className}
        placeholder={placeholder}
      />
      <input type="hidden" name={name} value={raw || "0"} />
    </>
  );
}
