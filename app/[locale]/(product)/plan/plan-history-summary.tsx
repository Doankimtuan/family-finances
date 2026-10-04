import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { Text } from "@/shared/ui/text";

export function PlanHistorySummary({
  readOnlyLabel,
  closedLabel,
  notice,
  metrics,
  usageLabel,
  usagePercent,
}: {
  readOnlyLabel: string;
  closedLabel: string;
  notice: string;
  metrics: readonly {
    label: string;
    value: ReactNode;
    detail?: string;
    testId: string;
  }[];
  usageLabel?: string;
  usagePercent: number | null;
}) {
  return (
    <Card
      tone="default"
      className="gap-(--space-3) p-(--space-4)"
      data-testid="plan-period-pulse"
    >
      <div className="flex items-center justify-between gap-(--space-2)">
        <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
          <AppIcon icon={PLAN_ICONS.lockedPeriod} size={AppIconSize.XS} />
          {readOnlyLabel}
        </StatusBadge>
        <Text size="xs" tone="secondary" className="shrink-0">
          {closedLabel}
        </Text>
      </div>
      <div className="flex items-start gap-(--space-2) rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
        <AppIcon
          icon={UTILITY_ICONS.info}
          size={AppIconSize.SM}
          className="shrink-0 text-text-secondary"
        />
        <Text size="xs" tone="secondary" className="leading-relaxed">
          {notice}
        </Text>
      </div>
      <div className="grid grid-cols-3 gap-(--space-2) border-t border-divider-subtle pt-(--space-3)">
        {metrics.map((metric) => (
          <div key={metric.testId} className="min-w-0">
            <Text size="xs" tone="secondary" className="text-pretty">
              {metric.label}
            </Text>
            <Text
              size="sm"
              weight="semibold"
              tabular
              className="mt-(--space-1) text-pretty"
              data-financial-kind={FinancialNumberKind.INTENTION}
              data-testid={metric.testId}
            >
              <FinancialValue>{metric.value}</FinancialValue>
            </Text>
            {metric.detail ? (
              <Text size="xs" tone="secondary" className="mt-(--space-1)">
                <FinancialValue>{metric.detail}</FinancialValue>
              </Text>
            ) : null}
          </div>
        ))}
      </div>
      {usagePercent != null ? (
        <Progress
          value={usagePercent}
          label={usageLabel}
          privacyAware
          trackClassName="h-(--space-1)"
        />
      ) : null}
    </Card>
  );
}
