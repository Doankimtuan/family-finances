"use client";

import { useMemo, useState } from "react";

type VndInputProps = {
  id: string;
  name: string;
  defaultValue?: number;
  className?: string;
  placeholder?: string;
};

const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function VndInput({ id, name, defaultValue = 0, className, placeholder }: VndInputProps) {
  const [raw, setRaw] = useState(String(Math.max(0, Math.round(defaultValue))));

  const display = useMemo(() => {
    const n = Number(raw || 0);
    if (!raw) return "";
    return formatter.format(n);
  }, [raw]);

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(event) => setRaw((event.target.value.replace(/\D/g, "") || "0"))}
        className={className}
        placeholder={placeholder}
      />
      <input type="hidden" name={name} value={raw || "0"} />
    </>
  );
}
