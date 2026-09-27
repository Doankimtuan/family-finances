import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export const CalculatedPreviewStatus = {
  VALID: "valid",
  INCOMPLETE: "incomplete",
  ERROR: "error",
} as const;

export type CalculatedPreviewStatus =
  (typeof CalculatedPreviewStatus)[keyof typeof CalculatedPreviewStatus];

type CalculatedPreviewBaseProps = {
  label: ReactNode;
  value?: ReactNode;
  formula?: ReactNode;
  incompletePlaceholder?: string;
  className?: string;
  testId?: string;
};

export type CalculatedPreviewProps = CalculatedPreviewBaseProps &
  (
    | { status?: "valid"; errorMessage?: never }
    | { status: "incomplete"; errorMessage?: never }
    | { status: "error"; errorMessage: ReactNode }
  );

/**
 * ViNha Canonical CalculatedPreview.
 * Read-only display of derived financial values (e.g. Quantity × Unit Price).
 * Distinct from editable form inputs.
 * Strictly does NOT perform mathematical calculations internally.
 */
export function CalculatedPreview({
  label,
  value,
  formula,
  status = CalculatedPreviewStatus.VALID,
  errorMessage,
  incompletePlaceholder = "—",
  className,
  testId,
}: CalculatedPreviewProps) {
  const isValid = status === CalculatedPreviewStatus.VALID;
  const isIncomplete = status === CalculatedPreviewStatus.INCOMPLETE;
  const isError = status === CalculatedPreviewStatus.ERROR;

  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col gap-1 rounded-(--radius-control) border border-border-subtle bg-surface-muted/50 p-3",
        "transition-colors",
        isError && "border-danger/30 bg-danger-soft/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-secondary select-none">
          {label}
        </span>
        {formula ? (
          <span className="text-xs text-text-muted select-none">{formula}</span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {isValid ? (
          <span className="text-base font-semibold tabular-nums text-text-primary">
            {value}
          </span>
        ) : null}

        {isIncomplete ? (
          <span className="text-base font-medium text-text-muted select-none">
            {incompletePlaceholder}
          </span>
        ) : null}

        {isError ? (
          <span className="text-xs font-medium text-danger">
            {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
