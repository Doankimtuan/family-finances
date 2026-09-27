"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";

export type ConfirmationSummaryRow = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  kind?: "text" | "financial";
  /** Unclassified legacy rows remain masked conservatively. */
  financial?: boolean;
  isHighlighted?: boolean;
};

export type ConfirmationSummaryProps = {
  title?: ReactNode;
  rows: ConfirmationSummaryRow[];
  note?: ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  className?: string;
  testId?: string;
  "data-testid"?: string;
};

/**
 * ViNha Canonical ConfirmationSummary.
 * Reusable key-value review container for high-stakes financial steps.
 */
export function ConfirmationSummary({
  title,
  rows,
  note,
  onEdit,
  editLabel = "Sửa",
  className,
  testId,
  "data-testid": dataTestId,
}: ConfirmationSummaryProps) {
  return (
    <div
      data-testid={testId ?? dataTestId}
      className={cn(
        "flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface-elevated p-(--space-4) shadow-[var(--elevation-1)]",
        className,
      )}
    >
      {title || onEdit ? (
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
          {title ? (
            <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          ) : (
            <span />
          )}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-primary hover:underline"
            >
              {editLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-col gap-(--space-2.5)">
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
            <div
              className={cn(
                "min-w-0 text-right text-sm tabular-nums",
                row.isHighlighted
                  ? "font-bold text-text-primary"
                  : "font-medium text-text-primary",
              )}
            >
              {row.kind !== "text" && row.financial !== false ? (
                <FinancialValue>{row.value}</FinancialValue>
              ) : (
                row.value
              )}
            </div>
          </div>
        ))}
      </dl>

      {note ? (
        <div className="mt-1 rounded-sm border border-border-subtle bg-surface-muted/50 p-2.5 text-xs text-text-muted leading-relaxed">
          {note}
        </div>
      ) : null}
    </div>
  );
}

// Backward compatibility alias
export { ConfirmationSummary as ConfirmSummary };
export type {
  ConfirmationSummaryProps as ConfirmSummaryProps,
  ConfirmationSummaryRow as ConfirmSummaryRow,
};
