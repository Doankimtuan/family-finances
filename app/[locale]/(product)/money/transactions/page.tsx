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
  listTransactionEvents,
  listTransactionTags,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_LIST_PAGE_SIZE,
  TransactionActivityKind,
  TransactionFilterType,
  type TransactionActivity,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  AppIcon,
  AppIconSize,
  IconContainer,
  financeIconFor,
} from "@/shared/ui";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { MoneyCaptureAction } from "../money-capture-action";
import { TransactionsFilterBar } from "./transactions-filter-bar";
import { TransactionsDateGroup } from "./transactions-date-group";
import {
  ACTIVITY_TONE_TO_AMOUNT_TONE,
  activityIconKey,
  activityIconTone,
  activityRelationshipLabel,
  activityStatusMeta,
  activitySubtitle,
  activityTitle,
  amountAriaToneKey,
  dateGroupLabel,
  groupActivities,
  transactionsListHref,
} from "./transactions-list-presentations";

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

function isCommonFilter(
  value: string | undefined,
): value is TransactionFilterType {
  return value !== undefined && TRANSACTION_COMMON_FILTER_SET.has(value);
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
  const [t, tMoney, tCatalog, result, availableTags] = await Promise.all([
    getTranslations("money.transactionsPage"),
    getTranslations("money"),
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
  const relationshipLabels = {
    partiallyRefunded: t("relationship.partiallyRefunded"),
    fullyRefunded: t("relationship.fullyRefunded"),
  };

  const currentHref = transactionsListHref(type, tagIds);
  const groups = groupActivities(result?.activities ?? []);
  const hasActiveFilter =
    type !== TransactionFilterType.ALL || tagIds.length > 0;

  return (
    <Page
      testId="money-transactions"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("title")}
          subtitle={t("subtitle")}
          backHref={APP_PATH.MONEY}
          backLabel={tMoney("backToMoney")}
          trailing={
            <FinancialPrivacyToggle
              hideLabel={tMoney("financialPrivacy.hide")}
              showLabel={tMoney("financialPrivacy.show")}
              testId="transactions-financial-privacy-toggle"
              tone={FinancialPrivacyToggleTone.SURFACE}
            />
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
        <ErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          action={
            <Link
              href={currentHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : groups.length === 0 ? (
        <div data-testid="transactions-empty">
          <EmptyState
            icon={
              <AppIcon icon={FINANCE_ICONS.cash} size={AppIconSize.DISPLAY} />
            }
            title={t(hasActiveFilter ? "filteredEmptyTitle" : "emptyTitle")}
            description={t(
              hasActiveFilter ? "filteredEmptyDescription" : "emptyDescription",
            )}
            className="flex-none py-(--space-2)"
            action={
              hasActiveFilter ? (
                <Link
                  href={APP_PATH.MONEY_TRANSACTIONS}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {t("clearFilters")}
                </Link>
              ) : (
                <Link
                  href={APP_PATH.MONEY_ADD}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-(--elevation-1) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid="transactions-empty-add"
                >
                  {t("add")}
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-(--space-5)">
          {groups.map((group) => (
            <TransactionsDateGroup
              key={group.date}
              date={group.date}
              label={dateGroupLabel(group.date, locale, dateLabels)}
            >
              {group.activities.map((activity) => {
                const title = activityTitle(
                  activity,
                  activityKindLabels,
                  tCatalog,
                );
                return (
                  <TransactionListItem
                    key={activity.id}
                    activity={activity}
                    locale={locale}
                    title={title}
                    subtitle={activitySubtitle(
                      activity,
                      title,
                      activityKindLabels,
                      tCatalog,
                    )}
                    amountMeta={[
                      activityStatusMeta(activity, (status) =>
                        tMoney(`status.${status}`),
                      ),
                      activityRelationshipLabel(activity, relationshipLabels),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    amountAria={t(amountAriaToneKey(activity.tone), {
                      amount: formatCurrency(
                        activity.amount,
                        activity.currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                    })}
                  />
                );
              })}
            </TransactionsDateGroup>
          ))}
          {result?.hasMore && result.nextCursor ? (
            <Link
              href={transactionsListHref(type, tagIds, result.nextCursor)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-semibold text-text-primary shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
              data-testid="transactions-load-more"
            >
              {t("loadMore")}
            </Link>
          ) : null}
        </div>
      )}
      <FloatingAction>
        <MoneyCaptureAction testId="transactions-add" />
      </FloatingAction>
    </Page>
  );
}

function TransactionListItem({
  activity,
  locale,
  title,
  subtitle,
  amountMeta,
  amountAria,
}: {
  activity: TransactionActivity;
  locale: string;
  title: string;
  subtitle: string;
  amountMeta: string;
  amountAria: string;
}) {
  const amountLabel = `${activity.sign}${formatCurrency(
    activity.amount,
    activity.currency,
    locale,
    { maximumFractionDigits: 0 },
  )}`;

  return (
    <li>
      <Link
        href={moneyTransactionPath(activity.relatedTransactionIds[0])}
        className="block min-h-11 rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
        aria-label={`${title}. ${amountAria}${subtitle ? `. ${subtitle}` : ""}`}
        data-testid={`transaction-row-${activity.id}`}
      >
        <TransactionRow
          leading={
            <IconContainer tone={activityIconTone(activity)} size="sm">
              <AppIcon
                icon={financeIconFor(activityIconKey(activity))}
                size="sm"
              />
            </IconContainer>
          }
          title={title}
          subtitle={subtitle}
          amountLabel={amountLabel}
          amountMeta={amountMeta || undefined}
          amountAriaLabel={amountAria}
          tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
          showRail={false}
          showChevron
          className="border-b-0 px-(--space-4)"
        />
      </Link>
    </li>
  );
}
