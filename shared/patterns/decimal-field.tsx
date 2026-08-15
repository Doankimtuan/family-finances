"use client";
import { TextField, type TextFieldProps } from "@/shared/ui/form";
import { cn } from "@/shared/utils/cn";
export type DecimalFieldProps = Omit<
  TextFieldProps,
  "value" | "onChange" | "type" | "inputMode" | "defaultValue"
> & { value: string; onValueChange: (value: string) => void };
export function DecimalField({
  value,
  onValueChange,
  className,
  autoComplete = "off",
  ...props
}: DecimalFieldProps) {
  return (
    <TextField
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete={autoComplete}
      className={cn("tabular-nums", className)}
      value={value}
      onChange={(event) =>
        onValueChange(
          event.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, "."),
        )
      }
    />
  );
}
