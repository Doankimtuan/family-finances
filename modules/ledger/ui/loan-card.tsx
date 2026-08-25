import type { ReactNode } from "react";
import type { LoanStatus as LoanStatusValue } from "@/modules/ledger/application/loan-constants";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Progress } from "@/shared/ui/progress";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { LoanStatusBadge } from "./loan-presentation";

export type LoanCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  remainingLabel: ReactNode;
  remainingAmount?: ReactNode;
  monthlyLabel: ReactNode;
  monthlyAmount?: ReactNode;
  nextDueLabel?: ReactNode;
  progressLabel: ReactNode;
  progressValue?: number;
  progressAriaLabel?: string;
  interestLabel?: ReactNode;
  statusLabel: string;
  status: LoanStatusValue;
  className?: string;
  "data-testid"?: string;
};

/** Loan / installment summary — never labels amounts as a bank Balance. */
export function LoanCard({
  title,
  subtitle,
  remainingLabel,
  remainingAmount,
  monthlyLabel,
  monthlyAmount,
  nextDueLabel,
  progressLabel,
  progressValue,
  progressAriaLabel,
  interestLabel,
  statusLabel,
  status,
  className,
  "data-testid": testId,
}: LoanCardProps) {
  const progressPercent =
    progressValue == null ? null : Math.round(progressValue * 100);

  return (
    <Card
      tone="interactive"
      className={cn("gap-(--space-3) p-(--space-3)", className)}
      data-testid={testId ?? "loan-card"}
      data-loan-status={status}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-semibold text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text size="sm" tone="secondary" className="truncate text-pretty">
              {subtitle}
            </Text>
          ) : null}
        </div>
        <LoanStatusBadge status={status} label={statusLabel} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-3)">
        <div className="min-w-0">
          <Text size="xs" tone="secondary">
            {remainingLabel}
          </Text>
          <Text size="lg" className="font-semibold tabular-nums tracking-tight">
            {remainingAmount ? (
              <FinancialValue>{remainingAmount}</FinancialValue>
            ) : null}
          </Text>
        </div>
        <div className="text-right">
          <Text size="xs" tone="secondary">
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
        <div className="border-t border-divider pt-(--space-2)">
          <Text size="sm" tone="secondary" className="text-pretty">
            {nextDueLabel}
          </Text>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="xs" tone="secondary" className="tabular-nums">
          {progressLabel}
        </Text>
        {interestLabel ? (
          <Text size="xs" tone="secondary" className="text-right">
            {interestLabel}
          </Text>
        ) : null}
      </div>
      {progressPercent != null ? (
        <Progress
          value={progressPercent}
          max={100}
          label={progressAriaLabel ?? String(progressLabel)}
          showLabel={false}
          trackClassName="h-1.5"
          className="gap-0"
        />
      ) : null}
    </Card>
  );
}
