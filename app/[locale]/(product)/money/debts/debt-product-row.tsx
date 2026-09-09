import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DebtDirection, type DebtDue } from "@/modules/ledger/application";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";
import {
  FINANCIAL_SCOPE,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { DebtDueBadge } from "./debt-presentation";

type OwnershipView = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
};

type DueLabels = {
  dueDate: (date: string) => string;
  today: string;
  daysLeft: (days: number) => string;
  daysOverdue: (days: number) => string;
  completed: string;
};

export type DebtProductRowProps = {
  href: string;
  testId: string;
  direction: DebtDirection;
  directionLabel: string;
  title: string;
  amountLabel: string;
  amountCaption: string;
  due: DebtDue;
  dueDate: string | null;
  dueLabels: DueLabels;
  locale: string;
  ownership?: OwnershipView;
  history?: boolean;
};

/**
 * Counterpart-first debt row. Direction is a text label (not color-only);
 * outstanding amount is the primary figure. Progress stays on detail.
 */
export function DebtProductRow({
  href,
  testId,
  direction,
  directionLabel,
  title,
  amountLabel,
  amountCaption,
  due,
  dueDate,
  dueLabels,
  locale,
  ownership,
  history = false,
}: DebtProductRowProps) {
  const isBorrowed = direction === DebtDirection.BORROWED;
  const personalOwnership =
    ownership?.financialScope === FINANCIAL_SCOPE.PERSONAL ? ownership : null;
  const iconTone = isBorrowed
    ? IconContainerTone.DEBT
    : IconContainerTone.INCOME;

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
      data-financial-object="debt"
      data-debt-direction={direction}
    >
      <IconContainer tone={iconTone} size="sm">
        <AppIcon
          icon={isBorrowed ? FINANCE_ICONS.debt : FINANCE_ICONS.income}
          size={AppIconSize.SM}
          label={directionLabel}
        />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text
          size="sm"
          weight="semibold"
          className="truncate text-text-primary"
        >
          {title}
        </Text>
        <Text
          size="xs"
          tone="secondary"
          className="mt-(--space-1) truncate text-pretty"
        >
          {directionLabel}
        </Text>
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
        {history ? null : (
          <div className="mt-(--space-2)">
            <DebtDueBadge
              due={due}
              dueDate={dueDate}
              labels={dueLabels}
              locale={locale}
            />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-(--space-2)">
        <div className="min-w-[var(--financial-number-column-width)] text-right">
          <Text
            size="sm"
            weight={history ? "medium" : "semibold"}
            tabular
            className="text-text-primary"
          >
            <FinancialValue>{amountLabel}</FinancialValue>
          </Text>
          <Text size="xs" tone="muted" className="mt-(--space-1) text-pretty">
            {amountCaption}
          </Text>
        </div>
        <AppIcon
          icon={ACTION_ICONS.forward}
          size={AppIconSize.SM}
          className="mt-(--space-1) shrink-0 text-text-tertiary"
        />
      </div>
    </Link>
  );
}

export function DebtGroupEmpty({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" tone="secondary" className="px-(--space-4) py-(--space-3)">
      {children}
    </Text>
  );
}
