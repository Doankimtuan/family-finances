import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { RecurringDirection } from "@/modules/plan/application/client";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, PLAN_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { PLAN_DESTINATION_ROW_CLASS } from "../plan-chrome";

type PlanRecurringRowProps = {
  href: string;
  testId: string;
  name: string;
  cadenceLabel: string;
  nextRun?: ReactNode;
  amountLabel: string;
  statusLabel: string;
  isActive: boolean;
  direction: (typeof RecurringDirection)[keyof typeof RecurringDirection];
};

function directionTone(
  direction: PlanRecurringRowProps["direction"],
): IconContainerTone {
  return direction === RecurringDirection.INCOME
    ? IconContainerTone.INCOME
    : IconContainerTone.EXPENSE;
}

/** Scan-first recurring rule: identity, cadence, next date, planned amount. */
export function PlanRecurringRow({
  href,
  testId,
  name,
  cadenceLabel,
  nextRun,
  amountLabel,
  statusLabel,
  isActive,
  direction,
}: PlanRecurringRowProps) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={PLAN_DESTINATION_ROW_CLASS}
      data-testid={testId}
    >
      <IconContainer tone={directionTone(direction)} size="sm">
        <AppIcon icon={PLAN_ICONS.recurring} size={AppIconSize.SM} />
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
          tone="secondary"
          className="mt-(--space-1) truncate text-pretty"
        >
          {cadenceLabel}
        </Text>
        {nextRun ? (
          <Text size="xs" tone="muted" className="mt-(--space-1) truncate">
            {nextRun}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-(--space-2)">
        <div className="min-w-[var(--financial-number-column-width)] text-right">
          <Text size="sm" weight="semibold" tabular>
            <FinancialValue>
              <span data-financial-kind={FinancialNumberKind.INTENTION}>
                {amountLabel}
              </span>
            </FinancialValue>
          </Text>
          <StatusBadge
            tone={isActive ? StatusBadgeTone.POSITIVE : StatusBadgeTone.NEUTRAL}
            className="mt-(--space-1)"
          >
            {statusLabel}
          </StatusBadge>
        </div>
        <AppIcon
          icon={ACTION_ICONS.forward}
          size={AppIconSize.SM}
          className="shrink-0 text-text-tertiary"
        />
      </div>
    </Link>
  );
}
