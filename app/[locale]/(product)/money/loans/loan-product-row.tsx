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
import { Progress } from "@/shared/ui/progress";
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
  monthlyLabel: string;
  monthlyAmount: string;
  interestLabel: string;
  dueState: LoanDueStateValue;
  dueLabel?: string;
  nextDueAmount?: string;
  progressLabel: string;
  progressValue: number;
  progressAriaLabel: string;
  status: LoanStatusValue;
  statusLabel: string;
  ownership?: OwnershipView;
  history?: boolean;
};

/**
 * One navigable loan inside a grouped elevated card. Layout follows Money
 * module rows: identity, quiet meta, amount column, trailing chevron.
 */
export function LoanProductRow({
  href,
  testId,
  loanType,
  typeLabel,
  title,
  subtitle,
  remainingAmount,
  monthlyLabel,
  monthlyAmount,
  interestLabel,
  dueState,
  dueLabel,
  nextDueAmount,
  progressLabel,
  progressValue,
  progressAriaLabel,
  status,
  statusLabel,
  ownership,
  history = false,
}: LoanProductRowProps) {
  const personalOwnership =
    ownership?.financialScope === FINANCIAL_SCOPE.PERSONAL ? ownership : null;
  const progressPercent = Math.round(progressValue * 100);
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
        {nextDueAmount ? (
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) tabular-nums"
          >
            <FinancialValue>{nextDueAmount}</FinancialValue>
          </Text>
        ) : null}
        <div className="mt-(--space-2) flex items-center justify-between gap-(--space-3)">
          <Text size="xs" tone="muted" className="tabular-nums">
            {progressLabel}
          </Text>
          <Text size="xs" tone="muted" className="text-right">
            {interestLabel}
          </Text>
        </div>
        <Progress
          value={progressPercent}
          max={100}
          label={progressAriaLabel}
          showLabel={false}
          tone={IconContainerTone.DEBT}
          trackClassName="h-1.5"
          className="mt-(--space-1) gap-0"
        />
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
          <Text size="xs" tone="muted" className="mt-(--space-1)">
            {monthlyLabel}
          </Text>
          <Text size="xs" tone="muted" className="mt-(--space-1) tabular-nums">
            <FinancialValue>{monthlyAmount}</FinancialValue>
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
