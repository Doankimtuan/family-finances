import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import {
  LoanStatus,
  type LoanStatusValue,
} from "@/modules/ledger/application/client";

export type LoanCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  remainingLabel: ReactNode;
  monthlyLabel: ReactNode;
  nextDueLabel?: ReactNode;
  progressLabel: ReactNode;
  interestLabel?: ReactNode;
  methodLabel?: ReactNode;
  statusLabel: ReactNode;
  status: LoanStatusValue;
  className?: string;
  "data-testid"?: string;
};

/**
 * Loan / installment summary — never labels amounts as bank Balance (BR-01).
 */
export function LoanCard({
  title,
  subtitle,
  remainingLabel,
  monthlyLabel,
  nextDueLabel,
  progressLabel,
  interestLabel,
  methodLabel,
  statusLabel,
  status,
  className,
  "data-testid": testId,
}: LoanCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)",
        className,
      )}
      data-testid={testId ?? "loan-card"}
      data-loan-status={status}
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
            status === LoanStatus.COMPLETED
              ? "border-accent/40 bg-accent/10 text-text-primary"
              : "border-border-subtle text-text-secondary",
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary">
          {remainingLabel}
        </Text>
        <span className="text-sm font-semibold tabular-nums text-text-primary">
          {monthlyLabel}
        </span>
      </div>
      {nextDueLabel ? (
        <Text size="sm" tone="secondary">
          {nextDueLabel}
        </Text>
      ) : null}
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary">
          {progressLabel}
        </Text>
        {interestLabel ? (
          <Text size="sm" tone="secondary">
            {interestLabel}
          </Text>
        ) : null}
      </div>
      {methodLabel ? (
        <Text size="sm" tone="secondary" data-testid="loan-method-badge">
          {methodLabel}
        </Text>
      ) : null}
    </div>
  );
}

/** @deprecated Use LoanCard. */
export const InstallmentCard = LoanCard;
export type InstallmentCardProps = LoanCardProps;
