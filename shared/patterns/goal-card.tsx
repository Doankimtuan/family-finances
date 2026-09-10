import { isValidElement, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, PLAN_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "./financial-value";

const GOAL_INTENTION_ROW_CLASS =
  "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";

export type GoalCardProps = {
  name: ReactNode;
  fundedLabel: ReactNode;
  targetLabel: ReactNode;
  progressPercent: number | null;
  progressLabel?: string;
  progressUnavailableLabel?: ReactNode;
  statusLabel?: ReactNode;
  sourceLabel?: ReactNode;
  iconTone?: IconContainerTone;
  href?: string;
  className?: string;
  "data-testid"?: string;
};

function financialLeaf(value: ReactNode) {
  return isValidElement(value) ? (
    value
  ) : (
    <FinancialValue>{value}</FinancialValue>
  );
}

function GoalCardBody({
  name,
  fundedLabel,
  targetLabel,
  progressPercent,
  progressLabel,
  progressUnavailableLabel,
  statusLabel,
  sourceLabel,
  iconTone = IconContainerTone.SAVINGS,
}: Omit<GoalCardProps, "href" | "className" | "data-testid">) {
  return (
    <>
      <div className={GOAL_INTENTION_ROW_CLASS}>
        <IconContainer tone={iconTone} size="sm">
          <AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.SM} />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <Text
            size="sm"
            weight="semibold"
            className="truncate text-text-primary"
          >
            {name}
          </Text>
          <Text
            size="xs"
            tone="muted"
            className="mt-(--space-1) truncate text-pretty"
          >
            {sourceLabel ?? statusLabel}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-(--space-2)">
          <div className="min-w-[var(--financial-number-column-width)] text-right">
            <Text
              size="sm"
              weight="semibold"
              tabular
              className="tracking-tight"
              data-financial-kind={FinancialNumberKind.INTENTION}
              data-financial-object="goal"
            >
              {financialLeaf(fundedLabel)}
            </Text>
            <Text
              size="xs"
              tone="muted"
              tabular
              className="mt-(--space-1)"
              data-financial-kind={FinancialNumberKind.INTENTION}
            >
              {financialLeaf(targetLabel)}
            </Text>
          </div>
          <AppIcon
            icon={ACTION_ICONS.forward}
            size={AppIconSize.SM}
            className="shrink-0 text-text-tertiary"
          />
        </div>
      </div>
      <div className="px-(--space-4) pb-(--space-3)">
        {progressPercent == null ? (
          <Text size="xs" tone="secondary" className="text-pretty">
            {progressUnavailableLabel}
          </Text>
        ) : (
          <Progress
            value={progressPercent}
            max={100}
            label={progressLabel ?? `${progressPercent}%`}
            privacyAware
          />
        )}
        {statusLabel && sourceLabel ? (
          <div className="mt-(--space-2) flex justify-start">
            <StatusBadge tone={StatusBadgeTone.INFO}>{statusLabel}</StatusBadge>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** Goal progress row — funded/target are intention, never bank Balance. */
export function GoalCard({
  href,
  className,
  "data-testid": testId,
  ...body
}: GoalCardProps) {
  const shared = {
    className: cn("flex flex-col", className),
    "data-testid": testId,
    "data-financial-object": "goal",
  } as const;

  if (href) {
    return (
      <Link href={href} prefetch={PRODUCT_LINK_PREFETCH} {...shared}>
        <GoalCardBody {...body} />
      </Link>
    );
  }

  return (
    <div {...shared}>
      <GoalCardBody {...body} />
    </div>
  );
}
