import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";
import {
  FINANCIAL_SCOPE,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

type OwnershipView = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
};

export type InvestmentPositionRowProps = {
  href: string;
  testId: string;
  cardTestId: string;
  icon: IconSvgElement;
  title: string;
  subtitle?: string;
  meta?: string;
  valueLabel?: string;
  quantityLabel?: string;
  valuation?: ReactNode;
  performance?: ReactNode;
  ownership?: OwnershipView;
  closed?: boolean;
  closedStatus?: string;
  closedNote?: string;
};

/**
 * One navigable holding inside a grouped elevated card. Identity uses leftover
 * width so names wrap; the amount column stays nowrap and sized to the figure.
 */
export function InvestmentPositionRow({
  href,
  testId,
  cardTestId,
  icon,
  title,
  subtitle,
  meta,
  valueLabel,
  quantityLabel,
  valuation,
  performance,
  ownership,
  closed = false,
  closedStatus,
  closedNote,
}: InvestmentPositionRowProps) {
  const personalOwnership =
    ownership?.financialScope === FINANCIAL_SCOPE.PERSONAL ? ownership : null;
  const hasAmountColumn = Boolean(
    valueLabel || quantityLabel || performance || valuation,
  );

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-14 items-start gap-(--space-3) px-(--space-4) py-(--space-3)",
        "transition-[background-color,transform] duration-(--duration-fast)",
        "hover:bg-surface-hover active:scale-(--press-scale)",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
      )}
      data-testid={testId}
    >
      <div
        className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-(--space-3)"
        data-testid={cardTestId}
      >
        <IconContainer tone={IconContainerTone.INVESTMENT} size="sm">
          <AppIcon icon={icon} size={AppIconSize.SM} />
        </IconContainer>
        <div className="min-w-0">
          <Text
            size="sm"
            weight="semibold"
            className="line-clamp-2 text-pretty break-words leading-snug text-text-primary"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) truncate leading-snug"
            >
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text
              size="xs"
              tone="muted"
              className="mt-(--space-1) truncate leading-snug"
            >
              {meta}
            </Text>
          ) : null}
          {personalOwnership ? (
            <div className="mt-(--space-1)">
              <FinancialOwnershipBadge
                financialScope={personalOwnership.financialScope}
                isOwnedByMe={personalOwnership.isOwnedByMe}
                ownerStatus={personalOwnership.ownerStatus}
                compact
              />
            </div>
          ) : null}
          {closed && closedStatus ? (
            <div className="mt-(--space-2) flex flex-wrap items-center gap-(--space-2)">
              <StatusBadge tone="neutral">{closedStatus}</StatusBadge>
              {closedNote ? (
                <Text size="xs" tone="muted" className="text-pretty">
                  {closedNote}
                </Text>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-(--space-2)">
          {hasAmountColumn ? (
            <div className="w-max min-w-[var(--financial-number-column-width)] text-right whitespace-nowrap">
              {valueLabel ? (
                <Text
                  size="sm"
                  weight={closed ? "medium" : "semibold"}
                  tabular
                  className="leading-snug text-text-primary"
                >
                  <FinancialValue>{valueLabel}</FinancialValue>
                </Text>
              ) : null}
              {quantityLabel ? (
                <Text
                  size="xs"
                  tone="muted"
                  className="mt-(--space-1) leading-snug"
                >
                  {quantityLabel}
                </Text>
              ) : null}
              {performance ? (
                <div className="mt-(--space-1)">{performance}</div>
              ) : null}
              {valuation ? (
                <div className="mt-(--space-1)">{valuation}</div>
              ) : null}
            </div>
          ) : null}
          <AppIcon
            icon={ACTION_ICONS.forward}
            size={AppIconSize.SM}
            className="mt-(--space-1) shrink-0 text-text-tertiary"
          />
        </div>
      </div>
    </Link>
  );
}
