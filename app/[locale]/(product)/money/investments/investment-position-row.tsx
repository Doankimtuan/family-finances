import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";
import {
  FINANCIAL_SCOPE,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
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
  /** Formatted estimated market value. Omit when the value is unavailable. */
  valueLabel?: string;
  /** Unmasked copy when price/valuation is missing. Never a fabricated ₫0. */
  unavailableLabel?: string;
  quantityLabel?: string;
  valuation?: ReactNode;
  performance?: ReactNode;
  ownership?: OwnershipView;
  closed?: boolean;
  closedStatus?: string;
  closedNote?: string;
};

/**
 * Scan-first holding card. Estimated value is primary; cost basis stays off
 * the row. Closed holdings are quiet and historical, still navigable.
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
  unavailableLabel,
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
  const hasFooter = closed
    ? Boolean(closedStatus)
    : Boolean(performance || quantityLabel || valuation);

  return (
    <Card
      tone={closed ? "soft" : "interactive"}
      className="gap-0 overflow-hidden p-0"
      data-financial-object="investment"
      data-testid={cardTestId}
    >
      <Link
        href={href}
        className={cn(
          "flex min-h-14 flex-col",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
        )}
        data-testid={testId}
      >
        <div className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)">
          <IconContainer tone={IconContainerTone.INVESTMENT} size="sm">
            <AppIcon icon={icon} size={AppIconSize.SM} />
          </IconContainer>
          <div className="min-w-0 flex-1">
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
          </div>
          <div className="flex shrink-0 items-start gap-(--space-2)">
            <div className="w-max min-w-[var(--financial-number-column-width)] text-right">
              {valueLabel ? (
                <Text
                  size="sm"
                  weight={closed ? "medium" : "semibold"}
                  tabular
                  className="leading-snug text-text-primary"
                >
                  <span data-financial-kind={FinancialNumberKind.ESTIMATE}>
                    <FinancialValue>{valueLabel}</FinancialValue>
                  </span>
                </Text>
              ) : unavailableLabel ? (
                <Text
                  size="xs"
                  tone="secondary"
                  className="text-pretty leading-snug"
                >
                  {unavailableLabel}
                </Text>
              ) : null}
            </div>
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.SM}
              className="mt-(--space-1) shrink-0 text-text-tertiary"
            />
          </div>
        </div>
        {hasFooter ? (
          <div className="flex items-center justify-between gap-(--space-3) border-t border-divider px-(--space-4) py-(--space-2)">
            {closed ? (
              <div className="flex min-w-0 flex-wrap items-center gap-(--space-2)">
                {closedStatus ? (
                  <StatusBadge tone="neutral">{closedStatus}</StatusBadge>
                ) : null}
                {closedNote ? (
                  <Text size="xs" tone="muted" className="text-pretty">
                    {closedNote}
                  </Text>
                ) : null}
              </div>
            ) : (
              <>
                <div className="min-w-0">{performance}</div>
                <div className="flex min-w-0 shrink-0 flex-col items-end">
                  {quantityLabel ? (
                    <Text size="xs" tone="muted" className="leading-snug">
                      {quantityLabel}
                    </Text>
                  ) : null}
                  {valuation ? (
                    <div className="mt-(--space-1)">{valuation}</div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        ) : null}
      </Link>
    </Card>
  );
}
