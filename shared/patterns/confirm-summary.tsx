import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type ConfirmSummaryRow = {
  id: string;
  label: ReactNode;
  value: ReactNode;
};

export type ConfirmSummaryProps = {
  rows: ConfirmSummaryRow[];
  className?: string;
  "data-testid"?: string;
};

/**
 * Compact label/value preview used by payment confirm steps app-wide.
 */
export function ConfirmSummary({
  rows,
  className,
  "data-testid": testId,
}: ConfirmSummaryProps) {
  return (
    <dl
      className={cn(
        "flex flex-col gap-(--space-3) rounded-md border border-border-subtle bg-surface p-(--space-4)",
        className,
      )}
      data-testid={testId}
    >
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex justify-between gap-(--space-3)"
        >
          <Text size="sm" tone="secondary">
            {row.label}
          </Text>
          <Text size="sm" className="font-medium">
            {row.value}
          </Text>
        </div>
      ))}
    </dl>
  );
}
