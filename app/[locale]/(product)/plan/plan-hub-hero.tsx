import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { StatusBadgeTone } from "@/shared/ui/status-badge";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { Progress } from "@/shared/ui/progress";

type PlanHubHeroProps = {
  attentionLabel: string;
  attentionTone: StatusBadgeTone;
  dayProgressLabel?: string;
  dayProgressPercent: number | null;
  todayLabel: string;
  activeJarSummary: string;
  incomeLabel: string;
  incomeValue: ReactNode;
  usagePercent: number | null;
  usageLabel?: string;
  overBudgetSpendShare: number | null;
  plannedLabel: string;
  plannedValue: ReactNode;
  spentLabel: string;
  spentValue: ReactNode;
  spentDetail?: string;
  remainingLabel: string;
  remainingValue: ReactNode;
};

function SummaryMetric({
  label,
  value,
  detail,
  testId,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  testId: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 px-(--space-2) first:ps-0 last:pe-0">
      <Text size="xs" className="text-pretty leading-tight text-text-secondary">
        {label}
      </Text>
      <Text
        size="xs"
        weight="semibold"
        tabular
        className={`mt-(--space-2) whitespace-nowrap tracking-tight ${valueClassName ?? "text-text-primary"}`}
        data-financial-kind={FinancialNumberKind.INTENTION}
        data-testid={testId}
      >
        <FinancialValue>{value}</FinancialValue>
      </Text>
      {detail ? (
        <Text
          size="xs"
          className="mt-(--space-1) whitespace-nowrap text-text-secondary"
        >
          <FinancialValue>{detail}</FinancialValue>
        </Text>
      ) : null}
    </div>
  );
}

export function PlanHubHero({
  attentionLabel,
  attentionTone,
  dayProgressLabel,
  dayProgressPercent,
  todayLabel,
  activeJarSummary,
  incomeLabel,
  incomeValue,
  usagePercent,
  usageLabel,
  overBudgetSpendShare,
  plannedLabel,
  plannedValue,
  spentLabel,
  spentValue,
  spentDetail,
  remainingLabel,
  remainingValue,
}: PlanHubHeroProps) {
  return (
    <Card
      tone="default"
      className="gap-(--space-4) p-(--space-4)"
      data-testid="plan-period-pulse"
    >
      <div className="flex items-center justify-between gap-(--space-2)">
        <StatusBadge
          tone={attentionTone}
          className="min-h-7 px-(--space-3) text-xs"
        >
          {attentionLabel}
        </StatusBadge>
        {dayProgressLabel ? (
          <Text
            size="xs"
            className="shrink-0 whitespace-nowrap text-text-secondary"
          >
            {dayProgressLabel}
          </Text>
        ) : null}
      </div>
      <Text size="xs" className="text-pretty text-text-secondary">
        {activeJarSummary} · {incomeLabel}:{" "}
        <FinancialValue>{incomeValue}</FinancialValue>
      </Text>
      {usagePercent != null ? (
        <div className="relative pb-(--space-6)">
          <Progress
            value={usagePercent}
            label={usageLabel}
            showLabel={false}
            tone={IconContainerTone.PRIMARY}
            indicatorClassName={overBudgetSpendShare ? "bg-none" : undefined}
            indicatorStyle={
              overBudgetSpendShare != null && overBudgetSpendShare > 0
                ? {
                    backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${100 - overBudgetSpendShare}%, var(--color-danger) ${100 - overBudgetSpendShare}%, var(--color-danger) 100%)`,
                  }
                : undefined
            }
            privacyAware
          />
          {dayProgressPercent != null ? (
            <span
              className="absolute top-2 inline-flex min-h-6 w-max -translate-x-1/2 items-center whitespace-nowrap rounded-sm bg-surface-muted px-(--space-2) py-(--space-1) text-[10px] leading-tight text-text-secondary"
              style={{
                left: `clamp(var(--space-5), ${dayProgressPercent}%, calc(100% - var(--space-5)))`,
              }}
            >
              {todayLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-3 divide-x divide-divider-subtle border-t border-divider-subtle pt-(--space-3)">
        <SummaryMetric
          label={plannedLabel}
          value={plannedValue}
          testId="plan-summary-planned"
        />
        <SummaryMetric
          label={spentLabel}
          value={spentValue}
          detail={spentDetail}
          testId="plan-summary-spent"
        />
        <SummaryMetric
          label={remainingLabel}
          value={remainingValue}
          testId="plan-summary-remaining"
          valueClassName="text-primary"
        />
      </div>
    </Card>
  );
}
