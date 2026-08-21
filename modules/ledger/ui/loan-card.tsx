import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  LoanStatus,
  type LoanStatusValue,
} from "@/modules/ledger/application/client";

export type LoanCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  remainingLabel: ReactNode;
  remainingAmount?: ReactNode;
  monthlyLabel: ReactNode;
  monthlyAmount?: ReactNode;
  nextDueLabel?: ReactNode;
  progressLabel: ReactNode;
  interestLabel?: ReactNode;
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
  remainingAmount,
  monthlyLabel,
  monthlyAmount,
  nextDueLabel,
  progressLabel,
  interestLabel,
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
      <div className="flex items-end justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary">
            {remainingLabel}
          </Text>
          <Text size="lg" className="font-semibold tabular-nums text-debt">
            {remainingAmount ? (
              <FinancialValue>{remainingAmount}</FinancialValue>
            ) : null}
          </Text>
        </div>
        <div className="text-right">
          <Text size="sm" tone="secondary">
            {monthlyLabel}
          </Text>
          {monthlyAmount ? (
            <Text
              size="sm"
              className="font-semibold tabular-nums text-text-primary"
            >
              <FinancialValue>{monthlyAmount}</FinancialValue>
            </Text>
          ) : null}
        </div>
      </div>
      {nextDueLabel ? (
        <Text size="sm" tone="secondary">
          {nextDueLabel}
        </Text>
      ) : null}
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary" className="text-success">
          {progressLabel}
        </Text>
        {interestLabel ? (
          <Text size="sm" tone="secondary">
            {interestLabel}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated Use LoanCard. */
export const InstallmentCard = LoanCard;
export type InstallmentCardProps = LoanCardProps;
