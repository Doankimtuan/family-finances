import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  createTransactionActivities,
  listTransactions,
  FinancialEventCategory,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionDirection,
  TransactionFilterType,
  listTransactionTags,
} from "@/modules/ledger/application";
import { TRANSACTION_TAG_FILTER_QUERY_PARAM } from "@/modules/ledger/application/client";
import {
  AppIcon,
  FinanceIconKey,
  IconContainer,
  IconContainerTone,
  financeIconFor,
} from "@/shared/ui";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import {
  TransactionRow,
  TransactionAmountTone,
} from "@/shared/patterns/transaction-row";
import { Page } from "@/shared/patterns/page";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { TransactionsFilterBar } from "./transactions-filter-bar";

function activityIconKey(category: FinancialEventCategory): FinanceIconKey {
  return category === FinancialEventCategory.LIABILITY
    ? FinanceIconKey.LOAN
    : (category as FinanceIconKey);
}

function activityIconTone(category: FinancialEventCategory): IconContainerTone {
  if (category === FinancialEventCategory.INCOME) {
    return IconContainerTone.INCOME;
  }
  if (category === FinancialEventCategory.EXPENSE) {
    return IconContainerTone.EXPENSE;
  }
  if (category === FinancialEventCategory.TRANSFER) {
    return IconContainerTone.TRANSFER;
  }
  if (category === FinancialEventCategory.INVESTMENT) {
    return IconContainerTone.INVESTMENT;
  }
  if (category === FinancialEventCategory.SAVINGS) {
    return IconContainerTone.SAVINGS;
  }
  if (
    category === FinancialEventCategory.DEBT ||
    category === FinancialEventCategory.LIABILITY
  ) {
    return IconContainerTone.DEBT;
  }
  if (category === FinancialEventCategory.REFUND) {
    return IconContainerTone.REFUND;
  }
  return IconContainerTone.NEUTRAL;
}
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string; tags?: string }>;
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
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const typeRaw = sp.type ?? TransactionFilterType.ALL;
  const type: (typeof TransactionFilterType)[keyof typeof TransactionFilterType] =
    typeRaw === TransactionDirection.INCOME ||
    typeRaw === TransactionDirection.EXPENSE ||
    typeRaw === TransactionFilterType.TRANSFER ||
    typeRaw === TransactionFilterType.INVESTMENT ||
    typeRaw === TransactionFilterType.SAVINGS ||
    typeRaw === TransactionFilterType.DEBT
      ? typeRaw
      : TransactionFilterType.ALL;
  const tagIds = (sp[TRANSACTION_TAG_FILTER_QUERY_PARAM] ?? "")
    .split(",")
    .filter((id) => z.string().uuid().safeParse(id).success);

  const [t, tCatalog, rows, availableTags] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    listTransactions({ q, type, tagIds, limit: 100 }),
    listTransactionTags({ includeArchived: true }),
  ]);

  const activity = createTransactionActivities(rows ?? []);

  return (
    <Page
      testId="money-transactions"
      topBar={
        <TopAppBar
          title={t("transactionsPage.title")}
          subtitle={t("transactionsPage.subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      <TransactionsFilterBar
        q={q}
        type={type}
        availableTags={availableTags ?? []}
        selectedTagIds={tagIds}
      />

      {activity.length === 0 ? (
        <EmptyState
          title={t("transactionsPage.emptyTitle")}
          description={t("transactionsPage.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-2)">
          {activity.map((tx) => (
            <li key={tx.id}>
              <Link
                href={moneyTransactionPath(tx.relatedTransactionIds[0])}
                className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid={`transaction-row-${tx.id}`}
              >
                <TransactionRow
                  leading={
                    <IconContainer
                      tone={activityIconTone(tx.semanticCategory)}
                      size="sm"
                    >
                      <AppIcon
                        icon={financeIconFor(
                          activityIconKey(tx.semanticCategory),
                        )}
                        size="sm"
                      />
                    </IconContainer>
                  }
                  title={
                    tx.note ||
                    localizeCatalogName(
                      tCatalog,
                      CatalogGroup.TAGS,
                      tx.categoryName,
                    ) ||
                    t(`transactionsPage.activityKind.${tx.kind}`)
                  }
                  subtitle={
                    tx.kind === TransactionActivityKind.TRANSFER
                      ? [tx.sourceAccount?.name, tx.destinationAccount?.name]
                          .filter(Boolean)
                          .map((name) =>
                            localizeCatalogName(
                              tCatalog,
                              CatalogGroup.ACCOUNTS,
                              name,
                            ),
                          )
                          .join(" → ")
                      : [
                          localizeCatalogName(
                            tCatalog,
                            CatalogGroup.ACCOUNTS,
                            tx.sourceAccount?.name ??
                              tx.destinationAccount?.name,
                          ),
                          tx.tags.map((tag) => tag.name).join(" · "),
                        ]
                          .filter(Boolean)
                          .join(" · ")
                  }
                  amountLabel={`${tx.sign}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`}
                  tone={
                    tx.tone === TransactionActivityTone.CREDIT
                      ? TransactionAmountTone.CREDIT
                      : tx.tone === TransactionActivityTone.DEBIT
                        ? TransactionAmountTone.DEBIT
                        : TransactionAmountTone.NEUTRAL
                  }
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={APP_PATH.MONEY}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("backToMoney")}
      </Link>
    </Page>
  );
}
