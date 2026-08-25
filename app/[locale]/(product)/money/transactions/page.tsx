import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { z } from "zod";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  FinancialEventCategory,
  listTransactionEvents,
  listTransactionTags,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_LIST_PAGE_SIZE,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionFilterType,
  TransactionStatus,
  type TransactionActivity,
} from "@/modules/ledger/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  localizeCatalogName,
  CatalogGroup,
} from "@/shared/i18n/localize-catalog-name";
import {
  todayIsoDate,
  differenceInUtcCalendarDays,
} from "@/shared/utils/iso-date";
import {
  AppIcon,
  FinanceIconKey,
  IconContainer,
  IconContainerTone,
  financeIconFor,
} from "@/shared/ui";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Page } from "@/shared/patterns/page";
import { StatusAlert } from "@/shared/ui/status-alert";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { TransactionsFilterBar } from "./transactions-filter-bar";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    tags?: string;
    cursor?: string;
  }>;
};

const TRANSACTION_COMMON_FILTER_SET = new Set<string>(
  TRANSACTION_COMMON_FILTER_OPTIONS,
);

const ACTIVITY_TONE_TO_AMOUNT_TONE: Record<
  TransactionActivityTone,
  TransactionAmountTone
> = {
  [TransactionActivityTone.CREDIT]: TransactionAmountTone.CREDIT,
  [TransactionActivityTone.DEBIT]: TransactionAmountTone.DEBIT,
  [TransactionActivityTone.REFUND]: TransactionAmountTone.REFUND,
  [TransactionActivityTone.NEUTRAL]: TransactionAmountTone.NEUTRAL,
};

function isCommonFilter(
  value: string | undefined,
): value is TransactionFilterType {
  return value !== undefined && TRANSACTION_COMMON_FILTER_SET.has(value);
}

function activityIconKey(activity: TransactionActivity): FinanceIconKey {
  if (activity.kind === TransactionActivityKind.REFUND)
    return FinanceIconKey.REFUND;
  if (activity.semanticCategory === FinancialEventCategory.LIABILITY)
    return FinanceIconKey.LOAN;
  return activity.semanticCategory as FinanceIconKey;
}

function activityIconTone(activity: TransactionActivity): IconContainerTone {
  if (activity.kind === TransactionActivityKind.REFUND)
    return IconContainerTone.REFUND;
  const tones: Partial<Record<FinancialEventCategory, IconContainerTone>> = {
    [FinancialEventCategory.INCOME]: IconContainerTone.INCOME,
    [FinancialEventCategory.EXPENSE]: IconContainerTone.EXPENSE,
    [FinancialEventCategory.TRANSFER]: IconContainerTone.TRANSFER,
    [FinancialEventCategory.INVESTMENT]: IconContainerTone.INVESTMENT,
    [FinancialEventCategory.SAVINGS]: IconContainerTone.SAVINGS,
    [FinancialEventCategory.DEBT]: IconContainerTone.DEBT,
    [FinancialEventCategory.LIABILITY]: IconContainerTone.DEBT,
  };
  return tones[activity.semanticCategory] ?? IconContainerTone.NEUTRAL;
}

function localizedName(
  value: string | null | undefined,
  tCatalog: Parameters<typeof localizeCatalogName>[0],
) {
  return value
    ? localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, value)
    : "";
}

function activityTitle(
  activity: TransactionActivity,
  labels: Record<TransactionActivityKind, string>,
  tCatalog: Parameters<typeof localizeCatalogName>[0],
) {
  if (activity.kind === TransactionActivityKind.TRANSFER) {
    return (
      [
        localizedName(activity.sourceAccount?.name, tCatalog),
        localizedName(activity.destinationAccount?.name, tCatalog),
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

function activitySubtitle(
  activity: TransactionActivity,
  title: string,
  labels: Record<TransactionActivityKind, string>,
  tCatalog: Parameters<typeof localizeCatalogName>[0],
) {
  if (activity.kind === TransactionActivityKind.TRANSFER) {
    return [activity.note, labels[activity.kind]].filter(Boolean).join(" · ");
  }
  const category = activity.categoryName
    ? localizeCatalogName(tCatalog, CatalogGroup.TAGS, activity.categoryName)
    : "";
  const account = localizedName(
    activity.sourceAccount?.name ?? activity.destinationAccount?.name,
    tCatalog,
  );
  const parts = [category !== title ? category : "", account];
  return parts.filter(Boolean).join(" · ");
}

function dateLabel(
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

function groupActivities(activities: TransactionActivity[]) {
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

function listHref(
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

export default async function TransactionsListPage({
  params,
  searchParams,
}: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const sp = await searchParams;
  const type = isCommonFilter(sp.type) ? sp.type : TransactionFilterType.ALL;
  const tagIds = (sp.tags ?? "")
    .split(",")
    .filter((id) => z.string().uuid().safeParse(id).success);
  const [t, tCatalog, result, availableTags] = await Promise.all([
    getTranslations("money.transactionsPage"),
    getTranslations("catalog"),
    listTransactionEvents({
      type,
      tagIds,
      cursor: sp.cursor,
      limit: TRANSACTION_LIST_PAGE_SIZE,
    }),
    listTransactionTags({ includeArchived: true }),
  ]);

  const activityKindLabels: Record<TransactionActivityKind, string> = {
    [TransactionActivityKind.INCOME]: t("activityKind.income"),
    [TransactionActivityKind.EXPENSE]: t("activityKind.expense"),
    [TransactionActivityKind.TRANSFER]: t("activityKind.transfer"),
    [TransactionActivityKind.REFUND]: t("activityKind.refund"),
    [TransactionActivityKind.LIABILITY_PAYMENT]: t(
      "activityKind.liability_payment",
    ),
    [TransactionActivityKind.LOAN_INTEREST]: t("activityKind.loan_interest"),
    [TransactionActivityKind.DEBT_BORROWING]: t("activityKind.debt_borrowing"),
    [TransactionActivityKind.DEBT_LENDING]: t("activityKind.debt_lending"),
    [TransactionActivityKind.DEBT_RECEIPT]: t("activityKind.debt_receipt"),
    [TransactionActivityKind.SAVINGS]: t("activityKind.savings"),
    [TransactionActivityKind.INVESTMENT]: t("activityKind.investment"),
    [TransactionActivityKind.OTHER]: t("activityKind.other"),
  };
  const dateLabels = {
    today: t("dates.today"),
    yesterday: t("dates.yesterday"),
  };

  const currentHref = listHref(type, tagIds);
  const groups = groupActivities(result?.activities ?? []);
  const hasActiveFilter =
    type !== TransactionFilterType.ALL || tagIds.length > 0;

  return (
    <Page
      testId="money-transactions"
      topBar={
        <TopAppBar
          title={t("title")}
          subtitle={t("subtitle")}
          trailing={
            <Link
              href={APP_PATH.MONEY_ADD}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-(--space-3) text-sm font-semibold text-accent-fg shadow-[var(--elevation-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="transactions-add"
            >
              {t("add")}
            </Link>
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <TransactionsFilterBar
        type={type}
        availableTags={availableTags ?? []}
        selectedTagIds={tagIds}
      />

      {result === null ? (
        <StatusAlert
          variant="danger"
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          action={
            <Link
              href={currentHref}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title={t(hasActiveFilter ? "filteredEmptyTitle" : "emptyTitle")}
          description={t(
            hasActiveFilter ? "filteredEmptyDescription" : "emptyDescription",
          )}
          action={
            !hasActiveFilter ? (
              <Link
                href={APP_PATH.MONEY_ADD}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-(--space-5)">
          {groups.map((group) => (
            <section
              key={group.date}
              aria-labelledby={`transactions-date-${group.date}`}
              className="relative border-l border-border-subtle/70 pl-(--space-3)"
            >
              <span
                className="absolute -left-[5px] top-(--space-1) size-2 rounded-full border-2 border-canvas bg-accent"
                aria-hidden
              />
              <h2
                id={`transactions-date-${group.date}`}
                className="mb-(--space-1) flex items-center gap-(--space-2) text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
              >
                {dateLabel(group.date, locale, dateLabels)}
              </h2>
              <ul>
                {group.activities.map((activity) => {
                  const title = activityTitle(
                    activity,
                    activityKindLabels,
                    tCatalog,
                  );
                  const subtitle = activitySubtitle(
                    activity,
                    title,
                    activityKindLabels,
                    tCatalog,
                  );
                  const relationship =
                    activity.kind === TransactionActivityKind.EXPENSE &&
                    activity.status === TransactionStatus.PARTIALLY_REFUNDED
                      ? t("relationship.partiallyRefunded")
                      : activity.kind === TransactionActivityKind.EXPENSE &&
                          activity.status === TransactionStatus.FULLY_REFUNDED
                        ? t("relationship.fullyRefunded")
                        : "";
                  return (
                    <li key={activity.id}>
                      <Link
                        href={moneyTransactionPath(
                          activity.relatedTransactionIds[0],
                        )}
                        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        data-testid={`transaction-row-${activity.id}`}
                      >
                        <TransactionRow
                          leading={
                            <IconContainer
                              tone={activityIconTone(activity)}
                              size="sm"
                              className="mt-(--space-1)"
                            >
                              <AppIcon
                                icon={financeIconFor(activityIconKey(activity))}
                                size="sm"
                              />
                            </IconContainer>
                          }
                          title={title}
                          subtitle={[subtitle, relationship]
                            .filter(Boolean)
                            .join(" · ")}
                          amountLabel={`${activity.sign}${formatCurrency(activity.amount, activity.currency, locale, { maximumFractionDigits: 0 })}`}
                          tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {result?.hasMore && result.nextCursor ? (
            <Link
              href={listHref(type, tagIds, result.nextCursor)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface/80 text-sm font-semibold text-text-primary shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
              data-testid="transactions-load-more"
            >
              {t("loadMore")}
            </Link>
          ) : null}
        </div>
      )}
    </Page>
  );
}
