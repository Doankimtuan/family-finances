import { isValidElement, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { FinancialValue } from "./financial-value";
import { Card } from "./card";

export type GoalCardProps = {
  name: ReactNode;
  fundedLabel: ReactNode;
  targetLabel: ReactNode;
  progressPercent: number | null;
  progressUnavailableLabel?: ReactNode;
  statusLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

function statusTone(statusLabel: ReactNode): StatusBadgeTone {
  return statusLabel ? StatusBadgeTone.INFO : StatusBadgeTone.NEUTRAL;
}

function financialLeaf(value: ReactNode) {
  return isValidElement(value) ? (
    value
  ) : (
    <FinancialValue>{value}</FinancialValue>
  );
}

/** Goal progress card — funded/target are intention, never bank Balance (BR-01). */
export function GoalCard({
  name,
  fundedLabel,
  targetLabel,
  progressPercent,
  progressUnavailableLabel,
  statusLabel,
  className,
  "data-testid": testId,
}: GoalCardProps) {
  return (
    <Card
      tone="interactive"
      className={cn("gap-(--space-4) p-(--space-4)", className)}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <Text
          size="sm"
          className="min-w-0 truncate font-semibold text-text-primary"
        >
          {name}
        </Text>
        {statusLabel ? (
          <StatusBadge tone={statusTone(statusLabel)}>
            {statusLabel}
          </StatusBadge>
        ) : null}
      </div>

      {progressPercent == null ? (
        <div className="rounded-(--radius-control) bg-surface-muted/70 px-(--space-3) py-(--space-2)">
          <Text size="sm" tone="secondary">
            {progressUnavailableLabel}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-(--space-2)">
          <Progress
            value={progressPercent}
            max={100}
            label={`${progressPercent}%`}
            privacyAware
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-(--space-3) border-t border-divider pt-(--space-3)">
        <Text size="sm" className="tabular-nums font-medium text-text-primary">
          {financialLeaf(fundedLabel)}
        </Text>
        <Text
          size="sm"
          className="text-right tabular-nums font-medium text-text-primary"
        >
          {financialLeaf(targetLabel)}
        </Text>
      </div>
    </Card>
  );
}
