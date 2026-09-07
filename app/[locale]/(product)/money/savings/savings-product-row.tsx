import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import {
  SavingsFamily,
  type SavingsMaturityState,
} from "@/modules/savings/application";
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
import { Text } from "@/shared/ui/text";
import { BankIcon, SmartPhoneIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";
import { SavingsMaturityBadge } from "./savings-maturity-badge";

type OwnershipView = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
};

export type SavingsProductRowProps = {
  href: string;
  testId: string;
  family: SavingsFamily;
  familyLabel: string;
  title: string;
  subtitle: string;
  principalLabel: string;
  rateLabel: string;
  maturityState: SavingsMaturityState;
  maturityLabel: string;
  maturityMeta?: string;
  ownership?: OwnershipView;
  history?: boolean;
};

function familyIcon(family: SavingsFamily) {
  return family === SavingsFamily.BANK ? BankIcon : SmartPhoneIcon;
}

/**
 * One navigable savings product inside a grouped elevated card. Layout follows
 * Money module rows: identity, quiet meta, amount column, trailing chevron.
 */
export function SavingsProductRow({
  href,
  testId,
  family,
  familyLabel,
  title,
  subtitle,
  principalLabel,
  rateLabel,
  maturityState,
  maturityLabel,
  maturityMeta,
  ownership,
  history = false,
}: SavingsProductRowProps) {
  const personalOwnership =
    ownership?.financialScope === FINANCIAL_SCOPE.PERSONAL ? ownership : null;

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
      <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
        <AppIcon
          icon={familyIcon(family)}
          size={AppIconSize.SM}
          label={familyLabel}
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
          {subtitle}
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
        <div className="mt-(--space-2)">
          <SavingsMaturityBadge
            state={maturityState}
            label={maturityLabel}
            meta={maturityMeta}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-(--space-2)">
        <div className="min-w-[var(--financial-number-column-width)] text-right">
          <Text
            size="sm"
            weight={history ? "medium" : "semibold"}
            tabular
            className="text-text-primary"
          >
            <FinancialValue>{principalLabel}</FinancialValue>
          </Text>
          <Text size="xs" tone="muted" className="mt-(--space-1)">
            {rateLabel}
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

export function SavingsGroupEmpty({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" tone="secondary" className="px-(--space-4) py-(--space-3)">
      {children}
    </Text>
  );
}
