import type { ReactNode } from "react";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  DebtDirection,
  DebtDueState,
  type DebtDue,
  type DebtProgress,
} from "@/modules/ledger/application";

type DueLabels = {
  dueDate: (date: string) => string;
  today: string;
  daysLeft: (days: number) => string;
  daysOverdue: (days: number) => string;
  completed: string;
};

type ProgressLabels = {
  paid: string;
  received: string;
};

export type DebtDetailHeroLabels = DueLabels &
  ProgressLabels & {
    remainingToPay: string;
    remainingToReceive: string;
  };

const DUE_TONE: Record<DebtDueState, StatusBadgeTone> = {
  [DebtDueState.NONE]: StatusBadgeTone.NEUTRAL,
  [DebtDueState.UPCOMING]: StatusBadgeTone.INFO,
  [DebtDueState.DUE_SOON]: StatusBadgeTone.WARNING,
  [DebtDueState.DUE_TODAY]: StatusBadgeTone.WARNING,
  [DebtDueState.OVERDUE]: StatusBadgeTone.ATTENTION,
  [DebtDueState.COMPLETED]: StatusBadgeTone.POSITIVE,
};

export function DebtDueBadge({
  due,
  dueDate,
  labels,
  locale,
}: {
  due: DebtDue;
  dueDate: string | null;
  labels: DueLabels;
  locale: string;
}) {
  if (due.state === DebtDueState.NONE) return null;
  if (due.state === DebtDueState.COMPLETED) {
    return (
      <StatusBadge tone={DUE_TONE[due.state]}>{labels.completed}</StatusBadge>
    );
  }
  const absoluteDate = dueDate
    ? formatDate(new Date(`${dueDate}T00:00:00Z`), locale, {
        day: "2-digit",
        month: "2-digit",
      })
    : "";
  const label =
    due.state === DebtDueState.OVERDUE
      ? labels.daysOverdue(Math.abs(due.daysUntilDue ?? 0))
      : due.state === DebtDueState.DUE_TODAY
        ? labels.today
        : due.state === DebtDueState.DUE_SOON
          ? labels.daysLeft(due.daysUntilDue ?? 0)
          : labels.dueDate(absoluteDate);
  return <StatusBadge tone={DUE_TONE[due.state]}>{label}</StatusBadge>;
}

export function DebtDetailHero({
  direction,
  remainingAmount,
  due,
  dueDate,
  progress,
  currency,
  locale,
  labels,
  trailing,
  context,
  directionLabel,
}: {
  direction: DebtDirection;
  remainingAmount: number;
  due: DebtDue;
  dueDate: string | null;
  progress: DebtProgress;
  currency: string;
  locale: string;
  labels: DebtDetailHeroLabels;
  trailing?: ReactNode;
  context?: ReactNode;
  directionLabel: string;
}) {
  const isBorrowed = direction === DebtDirection.BORROWED;
  const remainingLabel = isBorrowed
    ? labels.remainingToPay
    : labels.remainingToReceive;
  const progressLabel = isBorrowed ? labels.paid : labels.received;
  const progressAmount = formatCurrency(progress.paidAmount, currency, locale, {
    maximumFractionDigits: 0,
  });
  const progressAriaLabel = `${progressLabel} ${progress.percent}%`;

  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-testid="debt-detail-hero"
      data-financial-object="debt"
      data-debt-direction={direction}
    >
      <div className="flex items-center gap-(--space-3)">
        <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
            <AppIcon
              icon={isBorrowed ? FINANCE_ICONS.debt : FINANCE_ICONS.income}
              size={AppIconSize.MD}
              emphasized
            />
          </span>
          <Text
            size="sm"
            weight="medium"
            className="text-pretty text-hero-muted"
          >
            {remainingLabel}
          </Text>
        </div>
        {trailing}
      </div>
      <Amount
        amountLabel={formatCurrency(remainingAmount, currency, locale, {
          maximumFractionDigits: 0,
        })}
        size={AmountSize.HERO}
        className="mt-(--space-3)"
        amountClassName="text-hero-fg"
      />
      <Text
        size="sm"
        weight="medium"
        className="mt-(--space-2) text-pretty text-hero-muted"
      >
        {directionLabel}
      </Text>
      <div className="mt-(--space-3)">
        <DebtDueBadge
          due={due}
          dueDate={dueDate}
          labels={labels}
          locale={locale}
        />
      </div>
      <div className="mt-(--space-4) flex items-end justify-between gap-(--space-3) border-t border-white/15 pt-(--space-3)">
        <Text size="sm" className="text-hero-muted">
          {progressLabel} <FinancialValue>{progressAmount}</FinancialValue>
        </Text>
        <Text size="sm" weight="semibold" className="tabular-nums text-hero-fg">
          {progress.percent}%
        </Text>
      </div>
      <Progress
        value={progress.percent}
        max={100}
        label={progressAriaLabel}
        showLabel={false}
        trackClassName="bg-white/15 ring-white/20"
        indicatorClassName="bg-white/80"
        className="mt-(--space-2)"
      />
      {context ? (
        <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
          {context}
        </div>
      ) : null}
    </Card>
  );
}
