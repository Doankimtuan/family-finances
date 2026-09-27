import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Card } from "./card";
import { FinancialValue } from "./financial-value";

type ConfirmSummaryRowBase = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  isHighlighted?: boolean;
};

export type ConfirmSummaryRow = ConfirmSummaryRowBase &
  ({ kind: "text" } | { kind: "financial" });

type ConfirmSummaryBaseProps = {
  title?: ReactNode;
  rows: ConfirmSummaryRow[];
  note?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export type ConfirmSummaryProps = ConfirmSummaryBaseProps &
  (
    | { onEdit?: never; editLabel?: never }
    | { onEdit: () => void; editLabel: string }
  );

/**
 * Compact label/value preview used by payment confirm steps app-wide.
 */
export function ConfirmSummary({
  title,
  rows,
  note,
  onEdit,
  editLabel,
  className,
  "data-testid": testId,
}: ConfirmSummaryProps) {
  return (
    <Card
      tone="elevated"
      className={cn("gap-(--space-3) p-(--space-4) shadow-none", className)}
      data-testid={testId}
    >
      {title || onEdit ? (
        <div className="flex items-center justify-between gap-(--space-2) border-b border-border-subtle pb-(--space-2)">
          {title ? (
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="min-h-11 px-(--space-2) text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              {editLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-col gap-(--space-3)">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              "flex items-start justify-between gap-(--space-3)",
              row.isHighlighted &&
                "rounded-xs bg-primary-soft/30 px-2 py-1 -mx-2",
            )}
          >
            <Text size="sm" tone="secondary" className="min-w-0 shrink-0">
              {row.label}
            </Text>
            <Text
              size="sm"
              className="min-w-0 text-right font-medium tabular-nums"
            >
              {row.kind === "financial" ? (
                <FinancialValue>{row.value}</FinancialValue>
              ) : (
                row.value
              )}
            </Text>
          </div>
        ))}
      </dl>
      {note ? (
        <Text size="sm" tone="muted" className="leading-relaxed">
          {note}
        </Text>
      ) : null}
    </Card>
  );
}
