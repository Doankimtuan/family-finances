import type { ReactNode } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Text } from "@/shared/ui/text";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  ACTION_ICONS,
  PLAN_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { PlanPrivacyToggle } from "./plan-privacy-toggle";
import {
  PlanHomeHealthStatus,
  type PlanHomeHealthStatus as PlanHomeHealthStatusValue,
} from "@/modules/plan/application/plan-home-health";

type PlanHubHeroProps = {
  periodCaption: string;
  periodLabel: string;
  assistLabel: string;
  health?: PlanHomeHealthStatusValue;
  healthTitle?: string;
  healthBody?: string;
  contextMeta?: string;
  incomeLabel: string;
  incomeValue: ReactNode;
  status?: ReactNode;
};

type PlanHubHeroStatusProps = {
  health: PlanHomeHealthStatusValue;
  healthTitle: string;
  healthBody: string;
  contextMeta: string;
};

function healthIcon(health: PlanHomeHealthStatusValue) {
  switch (health) {
    case PlanHomeHealthStatus.HEALTHY:
      return ACTION_ICONS.success;
    case PlanHomeHealthStatus.ATTENTION:
      return UTILITY_ICONS.info;
    case PlanHomeHealthStatus.OFF_TRACK:
      return Alert02Icon;
    default:
      return PLAN_ICONS.jar;
  }
}

export function PlanHubHero({
  periodCaption,
  periodLabel,
  assistLabel,
  health,
  healthTitle,
  healthBody,
  contextMeta,
  incomeLabel,
  incomeValue,
  status,
}: PlanHubHeroProps) {
  return (
    <Card
      tone="hero"
      className="gap-(--space-4) p-(--space-4)"
      data-testid="plan-period-pulse"
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" weight="medium" className="text-hero-muted">
            {periodCaption}
          </Text>
          <Text
            size="sm"
            className="mt-(--space-1) text-pretty text-hero-muted"
          >
            {periodLabel}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-(--space-2)">
          <StatusBadge
            tone={StatusBadgeTone.SELECTED}
            className="bg-white/10 text-hero-fg ring-white/15"
          >
            {assistLabel}
          </StatusBadge>
          <PlanPrivacyToggle testId="plan-financial-privacy-toggle" />
        </div>
      </div>
      {status ??
        (health && healthTitle && healthBody && contextMeta ? (
          <PlanHubHeroStatus
            health={health}
            healthTitle={healthTitle}
            healthBody={healthBody}
            contextMeta={contextMeta}
          />
        ) : null)}
      <div
        className="border-t border-white/15 pt-(--space-3)"
        data-testid="plan-hub-income-base"
        data-financial-kind={FinancialNumberKind.INTENTION}
      >
        <Text size="xs" className="text-hero-muted">
          {incomeLabel}
        </Text>
        <Text
          size="sm"
          weight="semibold"
          className="mt-(--space-1) tracking-tight text-hero-fg"
        >
          {incomeValue}
        </Text>
      </div>
    </Card>
  );
}

export function PlanHubHeroStatus({
  health,
  healthTitle,
  healthBody,
  contextMeta,
}: PlanHubHeroStatusProps) {
  return (
    <div className="flex items-start gap-(--space-3)">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) bg-white/10 text-hero-fg">
        <AppIcon icon={healthIcon(health)} size="sm" />
      </span>
      <div className="min-w-0">
        <Text weight="semibold" className="text-balance text-hero-fg">
          {healthTitle}
        </Text>
        <Text size="sm" className="mt-(--space-1) text-pretty text-hero-muted">
          {healthBody}
        </Text>
        <Text size="xs" className="mt-(--space-2) text-pretty text-hero-muted">
          {contextMeta}
        </Text>
      </div>
    </div>
  );
}

export function PlanHubHeroStatusLoading() {
  return (
    <div className="flex items-start gap-(--space-3)" aria-hidden="true">
      <Skeleton className="mt-0.5 size-8 shrink-0 rounded-(--radius-control) bg-white/20" />
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
        <Skeleton className="h-5 w-36 bg-white/20" />
        <Skeleton className="h-4 w-full bg-white/15" />
        <Skeleton className="h-3 w-40 bg-white/15" />
      </div>
    </div>
  );
}
