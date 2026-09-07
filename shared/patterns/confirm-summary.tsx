import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Card } from "./card";
import { FinancialValue } from "./financial-value";

export type ConfirmSummaryRow = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  kind?: "text" | "financial";
  /** Unclassified legacy rows remain masked conservatively. */
  financial?: boolean;
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
    <Card
      tone="elevated"
      className={cn("gap-(--space-3) p-(--space-4) shadow-none", className)}
      data-testid={testId}
    >
      <dl className="flex flex-col gap-(--space-3)">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-start justify-between gap-(--space-3)"
          >
            <Text size="sm" tone="secondary" className="min-w-0 shrink-0">
              {row.label}
            </Text>
            <Text
              size="sm"
              className="min-w-0 text-right font-medium tabular-nums"
            >
              {row.kind !== "text" && row.financial !== false ? (
                <FinancialValue>{row.value}</FinancialValue>
              ) : (
                row.value
              )}
            </Text>
          </div>
        ))}
      </dl>
    </Card>
  );
}
