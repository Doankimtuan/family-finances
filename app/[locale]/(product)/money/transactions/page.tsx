import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
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
import { FloatingAction } from "@/shared/patterns/floating-action";
import { AppIcon, AppIconSize } from "@/shared/ui";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { MoneyCaptureAction } from "../money-capture-action";
import { TransactionsFilterBar } from "./transactions-filter-bar";
import { TransactionsActivityList } from "./transactions-activity-list";
import { transactionsListHref } from "./transactions-list-presentations";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
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
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const sp = await searchParams;
  const parsedFilters = transactionEventFilterSchema.safeParse({
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
  });
  if (sp.cursor) redirect({ href: currentHref, locale });

  const [t, tMoney, result, filterOptions, availableTags] = await Promise.all([
    getTranslations("money.transactionsPage"),
    getTranslations("money"),
    listTransactionEvents({
      ...filters,
      limit: TRANSACTION_LIST_PAGE_SIZE,
    }),
    listTransactionFilterOptions(),
    listTransactionTags({ includeArchived: true }),
  ]);

  const hasActiveFilter =
    filters.type !== TransactionFilterType.ALL ||
    Boolean(
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
  );

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
        type={filters.type}
        query={filters.q ?? ""}
        categoryIds={filters.categoryIds}
        jarIds={filters.jarIds}
        availableTags={availableTags ?? []}
        availableCategories={filterOptions?.categories ?? []}
        availableJars={filterOptions?.jars ?? []}
        selectedTagIds={filters.tagIds}
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
      <FloatingAction>
        <MoneyCaptureAction testId="transactions-add" />
      </FloatingAction>
    </Page>
  );
}
