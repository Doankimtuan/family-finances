import type { ReactNode } from "react";
import {
  LoanDueState,
  LoanScheduleDisplayStatus,
  LoanStatus,
  type LoanDueState as LoanDueStateValue,
  type LoanScheduleDisplayStatus as LoanScheduleDisplayStatusValue,
  type LoanStatus as LoanStatusValue,
} from "@/modules/ledger/application/loan-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

const LOAN_DUE_TONE: Record<LoanDueStateValue, StatusBadgeTone> = {
  [LoanDueState.NONE]: StatusBadgeTone.NEUTRAL,
  [LoanDueState.UPCOMING]: StatusBadgeTone.INFO,
  [LoanDueState.DUE_SOON]: StatusBadgeTone.WARNING,
  [LoanDueState.DUE_TODAY]: StatusBadgeTone.WARNING,
  [LoanDueState.OVERDUE]: StatusBadgeTone.ATTENTION,
};

const LOAN_SCHEDULE_TONE: Record<
  LoanScheduleDisplayStatusValue,
  StatusBadgeTone
> = {
  [LoanScheduleDisplayStatus.UPCOMING]: StatusBadgeTone.INFO,
  [LoanScheduleDisplayStatus.DUE_TODAY]: StatusBadgeTone.WARNING,
  [LoanScheduleDisplayStatus.OVERDUE]: StatusBadgeTone.ATTENTION,
  [LoanScheduleDisplayStatus.PAID]: StatusBadgeTone.SUCCESS,
  [LoanScheduleDisplayStatus.WAIVED]: StatusBadgeTone.NEUTRAL,
};

const LOAN_STATUS_TONE: Record<LoanStatusValue, StatusBadgeTone> = {
  [LoanStatus.ACTIVE]: StatusBadgeTone.NEUTRAL,
  [LoanStatus.COMPLETED]: StatusBadgeTone.SUCCESS,
  [LoanStatus.CANCELLED]: StatusBadgeTone.NEUTRAL,
  [LoanStatus.DEFAULTED]: StatusBadgeTone.ATTENTION,
  [LoanStatus.ARCHIVED]: StatusBadgeTone.NEUTRAL,
};

export function LoanStatusBadge({
  status,
  label,
}: {
  status: LoanStatusValue;
  label: string;
}) {
  return <StatusBadge tone={LOAN_STATUS_TONE[status]}>{label}</StatusBadge>;
}

export function LoanDueBadge({
  state,
  label,
}: {
  state: LoanDueStateValue;
  label: string;
}) {
  if (state === LoanDueState.NONE) return null;
  return <StatusBadge tone={LOAN_DUE_TONE[state]}>{label}</StatusBadge>;
}

export function LoanScheduleStatusBadge({
  status,
  label,
}: {
  status: LoanScheduleDisplayStatusValue;
  label: string;
}) {
  return <StatusBadge tone={LOAN_SCHEDULE_TONE[status]}>{label}</StatusBadge>;
}

export function LoanDetailHero({
  remainingPrincipal,
  currency,
  locale,
  dueState,
  dueLabel,
  statusLabel,
  status,
  nextPaymentAmount,
  nextPaymentDate,
  labels,
  progress,
}: {
  remainingPrincipal: number;
  currency: string;
  locale: string;
  dueState: LoanDueStateValue;
  dueLabel: string;
  status: LoanStatusValue;
  statusLabel: string;
  nextPaymentAmount: number | null;
  nextPaymentDate: string | null;
  labels: {
    remaining: string;
    nextPayment: string;
    nextPaymentDate: string;
    progress: string;
    none: string;
  };
  progress: number;
}) {
  const remainingAmount = formatCurrency(remainingPrincipal, currency, locale, {
    maximumFractionDigits: 0,
  });
  const nextAmount =
    nextPaymentAmount == null
      ? null
      : formatCurrency(nextPaymentAmount, currency, locale, {
          maximumFractionDigits: 0,
        });
  const progressPercent = Math.round(progress * 100);

  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-testid="loan-detail-hero"
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
            <AppIcon
              icon={FINANCE_ICONS.loan}
              size={AppIconSize.MD}
              emphasized
            />
          </span>
          <Text size="sm" weight="medium" className="text-hero-muted">
            {labels.remaining}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-(--space-1)">
          <LoanStatusBadge status={status} label={statusLabel} />
          <LoanDueBadge state={dueState} label={dueLabel} />
        </div>
      </div>
      <Amount
        label={labels.remaining}
        amountLabel={remainingAmount}
        size={AmountSize.HERO}
        labelClassName="text-hero-muted"
        amountClassName="text-hero-fg"
        className="mt-(--space-3)"
      />
      <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-white/15 pt-(--space-3)">
        <LoanHeroFact
          label={labels.nextPayment}
          value={nextAmount}
          emptyLabel={labels.none}
        />
        <LoanHeroFact
          label={labels.nextPaymentDate}
          value={nextPaymentDate}
          emptyLabel={labels.none}
        />
      </div>
      <div className="mt-(--space-4) flex items-end justify-between gap-(--space-3)">
        <Text size="sm" className="text-hero-muted">
          {labels.progress}
        </Text>
        <Text size="sm" weight="semibold" className="tabular-nums text-hero-fg">
          {progressPercent}%
        </Text>
      </div>
      <Progress
        value={progressPercent}
        max={100}
        label={`${labels.progress} ${progressPercent}%`}
        showLabel={false}
        trackClassName="bg-white/15 ring-white/20"
        indicatorClassName="bg-white/80"
        className="mt-(--space-2)"
      />
    </Card>
  );
}

function LoanHeroFact({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
}) {
  return (
    <div className="min-w-0">
      <Text size="xs" className="text-hero-muted">
        {label}
      </Text>
      <Text size="sm" weight="semibold" className="mt-(--space-1) text-hero-fg">
        {value ?? emptyLabel}
      </Text>
    </div>
  );
}

export function LoanFact({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-(--space-3) py-(--space-3)">
      <dt className="min-w-0 text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[62%] text-right text-sm font-medium tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}

export function LoanAmountText({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: string;
  locale: string;
}) {
  return (
    <FinancialValue>
      {formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })}
    </FinancialValue>
  );
}

export function formatLoanDate(
  isoDate: string | null,
  locale: string,
): string | null {
  if (!isoDate) return null;
  return formatDate(new Date(`${isoDate}T00:00:00Z`), locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
