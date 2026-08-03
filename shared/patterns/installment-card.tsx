import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type InstallmentCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  progressLabel: ReactNode;
  amountLabel: string;
  statusLabel: ReactNode;
  status: "active" | "completed";
  className?: string;
  "data-testid"?: string;
};

/**
 * Card/EMI installment summary — never labels amounts as bank Balance (BR-01).
 */
export function InstallmentCard({
  title,
  subtitle,
  progressLabel,
  amountLabel,
  statusLabel,
  status,
  className,
  "data-testid": testId,
}: InstallmentCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)",
        className,
      )}
      data-testid={testId ?? "installment-card"}
      data-installment-status={status}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-medium text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text size="sm" tone="secondary" className="truncate">
              {subtitle}
            </Text>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-(--space-2) py-(--space-1) text-xs font-medium",
            status === "completed"
              ? "border-accent/40 bg-accent/10 text-text-primary"
              : "border-border-subtle text-text-secondary",
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary">
          {progressLabel}
        </Text>
        <span className="text-sm font-semibold tabular-nums text-text-primary">
          {amountLabel}
        </span>
      </div>
    </div>
  );
}
