import { Link } from "@/i18n/navigation";
import {
  LoanDueState,
  LoanStatus,
  type LoanDueState as LoanDueStateValue,
  type LoanStatus as LoanStatusValue,
  type LoanType,
} from "@/modules/ledger/application/loan-constants";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";
import {
  FINANCIAL_SCOPE,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  LoanDueBadge,
  LoanStatusBadge,
} from "@/modules/ledger/ui/loan-presentation";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { loanTypeIcon } from "./loan-type-icon";

type OwnershipView = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
};

export type LoanProductRowProps = {
  href: string;
  testId: string;
  loanType: LoanType;
  typeLabel: string;
  title: string;
  subtitle: string;
  remainingAmount: string;
  remainingCaption: string;
  nextPaymentCaption: string;
  nextPaymentAmount?: string;
  dueState: LoanDueStateValue;
  dueLabel?: string;
  status: LoanStatusValue;
  statusLabel: string;
  ownership?: OwnershipView;
  history?: boolean;
};

/**
 * Remaining-principal-first loan row. Next payment is secondary context;
 * progress stays on detail rather than competing on the scan list.
 */
export function LoanProductRow({
  href,
  testId,
  loanType,
  typeLabel,
  title,
  subtitle,
  remainingAmount,
  remainingCaption,
  nextPaymentCaption,
  nextPaymentAmount,
  dueState,
  dueLabel,
  status,
  statusLabel,
  ownership,
  history = false,
}: LoanProductRowProps) {
  const personalOwnership =
    ownership?.financialScope === FINANCIAL_SCOPE.PERSONAL ? ownership : null;
  const showDue = dueState !== LoanDueState.NONE && dueLabel != null;
  const showStatus = history || status !== LoanStatus.ACTIVE;

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
      data-loan-status={status}
      data-financial-object="loan"
    >
      <IconContainer tone={IconContainerTone.DEBT} size="sm">
        <AppIcon
          icon={loanTypeIcon(loanType)}
          size={AppIconSize.SM}
          label={typeLabel}
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
        {history ? null : nextPaymentAmount ? (
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-2) text-pretty tabular-nums"
          >
            {nextPaymentCaption}{" "}
            <FinancialValue>{nextPaymentAmount}</FinancialValue>
          </Text>
        ) : null}
        {showDue || showStatus ? (
          <div className="mt-(--space-2) flex flex-wrap items-center gap-(--space-1)">
            {showStatus ? (
              <LoanStatusBadge status={status} label={statusLabel} />
            ) : null}
            {showDue ? (
              <LoanDueBadge state={dueState} label={dueLabel} />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-start gap-(--space-2)">
        <div className="min-w-[var(--financial-number-column-width)] text-right">
          <Text
            size="sm"
            weight={history ? "medium" : "semibold"}
            tabular
            className="text-text-primary"
          >
            <FinancialValue>{remainingAmount}</FinancialValue>
          </Text>
          <Text size="xs" tone="muted" className="mt-(--space-1) text-pretty">
            {remainingCaption}
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
