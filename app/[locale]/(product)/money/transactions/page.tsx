import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import {
  listTransactionEvents,
  listTransactionTags,
  listTransactionFilterOptions,
  TRANSACTION_LIST_PAGE_SIZE,
  TransactionFilterType,
  transactionEventFilterSchema,
} from "@/modules/ledger/application";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";
import { AppIcon, AppIconSize } from "@/shared/ui";
import { FINANCE_ICONS, ACTION_ICONS } from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { TransactionsFilterBar } from "./transactions-filter-bar";
import { TransactionsActivityList } from "./transactions-activity-list";
import {
  accountTransactionsHref,
  transactionsListHref,
} from "./transactions-list-presentations";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    account?: string;
    type?: string;
    tags?: string;
    cursor?: string;
    q?: string;
    category?: string;
    jar?: string;
  }>;
};

export default async function TransactionsListPage({
  params,
  searchParams,
}: Props) {
  const { locale: rawLocale } = await params;
  const { locale } = await withPerfSpan(
    PERF_TRACE_OP.TRANSACTION_SESSION_GATE,
    () => requireProductSession({ localeParam: rawLocale }),
  );

  const sp = await searchParams;
  const parsedFilters = transactionEventFilterSchema.safeParse({
    account: sp.account,
    type: sp.type,
    tags: sp.tags,
    q: sp.q,
    category: sp.category,
    jar: sp.jar,
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : transactionEventFilterSchema.parse({});
  const currentHref = transactionsListHref(filters.type, filters.tagIds, {
    q: filters.q || undefined,
    categoryIds: filters.categoryIds,
    jarIds: filters.jarIds,
    accountId: filters.accountId,
  });
  if (sp.cursor) redirect({ href: currentHref, locale });

  const filterOptionsPromise = listTransactionFilterOptions();
  const transactionTagsPromise = listTransactionTags({ includeArchived: true });
  const [t, tMoney, result] = await Promise.all([
    getTranslations("money.transactionsPage"),
    getTranslations("money"),
    withPerfSpan(PERF_TRACE_OP.TRANSACTION_EVENT_LOADER, () =>
      listTransactionEvents({
        ...filters,
        limit: TRANSACTION_LIST_PAGE_SIZE,
      }),
    ),
  ]);

  const hasActiveFilter =
    filters.type !== TransactionFilterType.ALL ||
    Boolean(
      filters.accountId ||
      filters.q ||
      filters.categoryIds.length ||
      filters.jarIds.length ||
      filters.tagIds.length,
    );
  const emptyState = (
    <div data-testid="transactions-empty">
      <EmptyState
        icon={<AppIcon icon={FINANCE_ICONS.cash} size={AppIconSize.DISPLAY} />}
        title={t(hasActiveFilter ? "filteredEmptyTitle" : "emptyTitle")}
        description={t(
          hasActiveFilter ? "filteredEmptyDescription" : "emptyDescription",
        )}
        className="flex-none py-(--space-2)"
        action={
          hasActiveFilter ? (
            <Link
              href={
                filters.accountId
                  ? accountTransactionsHref(filters.accountId)
                  : APP_PATH.MONEY_TRANSACTIONS
              }
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("clearFilters")}
            </Link>
          ) : (
            <Link
              href={APP_PATH.MONEY_ADD}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) bg-primary px-(--space-4) text-sm font-medium text-primary-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("addFirst")}
            </Link>
          )
        }
      />
    </div>
  );

  return (
    <Page
      testId="money-transactions"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          className="border-b border-border-subtle [&_h1]:text-center [&_h1+div]:text-center [&_h1+div]:text-xs [&_h1+div]:leading-snug"
          title={
            filters.accountId
              ? tMoney("accountDetail.statementTitle")
              : t("title")
          }
          subtitle={t("subtitle")}
          backHref={
            filters.accountId
              ? moneyAccountPath(filters.accountId)
              : APP_PATH.MONEY
          }
          backLabel={
            filters.accountId
              ? tMoney("accountDetail.title")
              : tMoney("backToMoney")
          }
          trailing={
            <FinancialPrivacyToggle
              hideLabel={tMoney("financialPrivacy.hide")}
              showLabel={tMoney("financialPrivacy.show")}
              testId="transactions-financial-privacy-toggle"
              tone={FinancialPrivacyToggleTone.SURFACE}
              className="border-transparent bg-transparent"
            />
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <TransactionsFilterBar
        accountId={filters.accountId}
        type={filters.type}
        query={filters.q ?? ""}
        categoryIds={filters.categoryIds}
        jarIds={filters.jarIds}
        selectedTagIds={filters.tagIds}
        filterOptionsPromise={filterOptionsPromise}
        transactionTagsPromise={transactionTagsPromise}
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
      ) : result.activities.length === 0 && !result.hasMore ? (
        emptyState
      ) : (
        <TransactionsActivityList
          accountId={filters.accountId}
          key={currentHref}
          listKey={currentHref}
          initialActivities={result.activities}
          initialNextCursor={result.nextCursor}
          initialHasMore={result.hasMore}
          type={filters.type}
          query={filters.q ?? ""}
          categoryIds={filters.categoryIds}
          jarIds={filters.jarIds}
          selectedTagIds={filters.tagIds}
          emptyState={emptyState}
        />
      )}
      <div className="pointer-events-none sticky bottom-(--space-3) z-(--z-sticky) mt-auto flex justify-end pt-(--space-3)">
        <Link
          href={APP_PATH.MONEY_ADD}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-(--space-2) rounded-full bg-primary px-(--space-4) text-sm font-semibold text-primary-fg shadow-lg hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="transactions-add"
        >
          <AppIcon icon={ACTION_ICONS.add} size="sm" />
          {t("addTransaction")}
        </Link>
      </div>
    </Page>
  );
}
