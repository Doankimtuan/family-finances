import {
  FinancialEventCategory,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionFilterType,
  TransactionStatus,
  type TransactionActivity,
} from "@/modules/ledger/application";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";
import { FinanceIconKey, IconContainerTone } from "@/shared/ui";
import { TransactionAmountTone } from "@/shared/patterns/transaction-row";

export const ACTIVITY_TONE_TO_AMOUNT_TONE: Record<
  TransactionActivityTone,
  TransactionAmountTone
> = {
  [TransactionActivityTone.CREDIT]: TransactionAmountTone.CREDIT,
  [TransactionActivityTone.DEBIT]: TransactionAmountTone.DEBIT,
  [TransactionActivityTone.REFUND]: TransactionAmountTone.REFUND,
  [TransactionActivityTone.NEUTRAL]: TransactionAmountTone.NEUTRAL,
};

const ACTIVITY_ICON_TONES: Partial<
  Record<FinancialEventCategory, IconContainerTone>
> = {
  [FinancialEventCategory.INCOME]: IconContainerTone.INCOME,
  [FinancialEventCategory.EXPENSE]: IconContainerTone.EXPENSE,
  [FinancialEventCategory.TRANSFER]: IconContainerTone.TRANSFER,
  [FinancialEventCategory.INVESTMENT]: IconContainerTone.INVESTMENT,
  [FinancialEventCategory.SAVINGS]: IconContainerTone.SAVINGS,
  [FinancialEventCategory.DEBT]: IconContainerTone.DEBT,
  [FinancialEventCategory.LIABILITY]: IconContainerTone.DEBT,
};

type CatalogTranslator = Parameters<typeof localizeCatalogName>[0];

export function activityIconKey(activity: TransactionActivity): FinanceIconKey {
  if (activity.kind === TransactionActivityKind.REFUND)
    return FinanceIconKey.REFUND;
  if (activity.semanticCategory === FinancialEventCategory.LIABILITY)
    return FinanceIconKey.LOAN;
  return activity.semanticCategory as FinanceIconKey;
}

export function activityIconTone(
  activity: TransactionActivity,
): IconContainerTone {
  if (activity.kind === TransactionActivityKind.REFUND)
    return IconContainerTone.REFUND;
  return (
    ACTIVITY_ICON_TONES[activity.semanticCategory] ?? IconContainerTone.NEUTRAL
  );
}

export function localizedAccountName(
  value: string | null | undefined,
  tCatalog: CatalogTranslator,
) {
  return value
    ? localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, value)
    : "";
}

export function activityTitle(
  activity: TransactionActivity,
  labels: Record<TransactionActivityKind, string>,
  tCatalog: CatalogTranslator,
) {
  if (activity.kind === TransactionActivityKind.TRANSFER) {
    return (
      [
        localizedAccountName(activity.sourceAccount?.name, tCatalog),
        localizedAccountName(activity.destinationAccount?.name, tCatalog),
      ]
        .filter(Boolean)
        .join(" → ") || labels[activity.kind]
    );
  }
  if (activity.kind === TransactionActivityKind.REFUND) {
    const category = activity.categoryName
      ? localizeCatalogName(tCatalog, CatalogGroup.TAGS, activity.categoryName)
      : "";
    return [labels[activity.kind], category].filter(Boolean).join(" · ");
  }
  return (
    activity.note ||
    localizeCatalogName(tCatalog, CatalogGroup.TAGS, activity.categoryName) ||
    labels[activity.kind]
  );
}

export function activitySubtitle(
  activity: TransactionActivity,
  title: string,
  labels: Record<TransactionActivityKind, string>,
  tCatalog: CatalogTranslator,
) {
  if (activity.kind === TransactionActivityKind.TRANSFER) {
    return [activity.note, labels[activity.kind]].filter(Boolean).join(" · ");
  }
  const category = activity.categoryName
    ? localizeCatalogName(tCatalog, CatalogGroup.TAGS, activity.categoryName)
    : "";
  const account = localizedAccountName(
    activity.sourceAccount?.name ?? activity.destinationAccount?.name,
    tCatalog,
  );
  const parts = [category !== title ? category : "", account];
  return parts.filter(Boolean).join(" · ");
}

export function dateGroupLabel(
  date: string,
  locale: string,
  labels: { today: string; yesterday: string },
) {
  const today = todayIsoDate();
  const age = differenceInUtcCalendarDays(date, today);
  if (age === 0) return labels.today;
  if (age === 1) return labels.yesterday;
  const isCurrentYear = date.slice(0, 4) === today.slice(0, 4);
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });
}

export function activityRelationshipLabel(
  activity: TransactionActivity,
  labels: { partiallyRefunded: string; fullyRefunded: string },
) {
  if (activity.kind !== TransactionActivityKind.EXPENSE) return "";
  if (activity.status === TransactionStatus.PARTIALLY_REFUNDED) {
    return labels.partiallyRefunded;
  }
  if (activity.status === TransactionStatus.FULLY_REFUNDED) {
    return labels.fullyRefunded;
  }
  return "";
}

function isTransactionStatus(value: string): value is TransactionStatus {
  return (TRANSACTION_STATUS_VALUES as readonly string[]).includes(value);
}

export function activityStatusMeta(
  activity: TransactionActivity,
  statusLabel: (status: TransactionStatus) => string,
) {
  if (activity.status === TransactionStatus.POSTED) return "";
  if (!isTransactionStatus(activity.status)) return "";
  return statusLabel(activity.status);
}

export function groupActivities(activities: TransactionActivity[]) {
  const groups: Array<{ date: string; activities: TransactionActivity[] }> = [];
  for (const activity of activities) {
    const current = groups.at(-1);
    if (current?.date === activity.effectiveDate) {
      current.activities.push(activity);
    } else {
      groups.push({ date: activity.effectiveDate, activities: [activity] });
    }
  }
  return groups;
}

export function transactionsListHref(
  type: TransactionFilterType,
  tagIds: string[],
  cursor?: string,
) {
  const params = new URLSearchParams();
  if (type !== TransactionFilterType.ALL)
    params.set(TRANSACTION_TYPE_QUERY_PARAM, type);
  if (tagIds.length > 0)
    params.set(TRANSACTION_TAG_FILTER_QUERY_PARAM, tagIds.join(","));
  if (cursor) params.set(TRANSACTION_CURSOR_QUERY_PARAM, cursor);
  const query = params.toString();
  return query
    ? `${APP_PATH.MONEY_TRANSACTIONS}?${query}`
    : APP_PATH.MONEY_TRANSACTIONS;
}

export function amountAriaToneKey(tone: TransactionActivityTone) {
  switch (tone) {
    case TransactionActivityTone.CREDIT:
      return "amountAria.credit" as const;
    case TransactionActivityTone.DEBIT:
      return "amountAria.debit" as const;
    case TransactionActivityTone.REFUND:
      return "amountAria.refund" as const;
    default:
      return "amountAria.neutral" as const;
  }
}
