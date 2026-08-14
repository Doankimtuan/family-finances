import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, type StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import {
  DebtDirection,
  DebtDueState,
  DebtProgressState,
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
  paid: (amount: string, percent: number) => string;
  received: (amount: string, percent: number) => string;
  noPayment: string;
  completed: string;
};

const DUE_TONE: Record<DebtDueState, StatusBadgeTone> = {
  [DebtDueState.NONE]: "neutral",
  [DebtDueState.UPCOMING]: "info",
  [DebtDueState.DUE_SOON]: "warning",
  [DebtDueState.DUE_TODAY]: "warning",
  [DebtDueState.OVERDUE]: "attention",
  [DebtDueState.COMPLETED]: "positive",
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

export function DebtProgressSummary({
  direction,
  progress,
  currency,
  locale,
  labels,
}: {
  direction: DebtDirection;
  progress: DebtProgress;
  currency: string;
  locale: string;
  labels: ProgressLabels;
}) {
  const amountLabel = formatCurrency(progress.paidAmount, currency, locale, {
    maximumFractionDigits: 0,
  });
  if (progress.state === DebtProgressState.COMPLETED) {
    return <StatusBadge tone="positive">{labels.completed}</StatusBadge>;
  }
  if (progress.state === DebtProgressState.NOT_STARTED) {
    return (
      <Text size="sm" tone="secondary">
        {labels.noPayment}
      </Text>
    );
  }
  const progressLabel =
    direction === DebtDirection.BORROWED
      ? labels.paid(amountLabel, progress.percent)
      : labels.received(amountLabel, progress.percent);
  return (
    <div className="flex flex-col gap-(--space-2)">
      <Text size="sm" tone="secondary">
        {progressLabel}
      </Text>
      <Progress
        value={progress.percent}
        max={100}
        label={progressLabel}
        showLabel={false}
      />
    </div>
  );
}
