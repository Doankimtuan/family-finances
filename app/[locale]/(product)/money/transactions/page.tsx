import { getTranslations } from "next-intl/server";
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
import { listTransactions } from "@/modules/ledger/application";
import type { TransactionDirection } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { TransactionsFilterBar } from "./transactions-filter-bar";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
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
  const typeRaw = sp.type ?? "all";
  const type: TransactionDirection | "all" =
    typeRaw === "income" || typeRaw === "expense" ? typeRaw : "all";

  const [t, tCatalog, rows] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    listTransactions({ q, type, limit: 100 }),
  ]);

  const activity = rows ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="money-transactions">
      <TopAppBar
        title={t("transactionsPage.title")}
        subtitle={t("transactionsPage.subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <TransactionsFilterBar q={q} type={type} />

        {activity.length === 0 ? (
          <EmptyState
            title={t("transactionsPage.emptyTitle")}
            description={t("transactionsPage.emptyDescription")}
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {activity.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={moneyTransactionPath(tx.id)}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid={`transaction-row-${tx.id}`}
                >
                  <TransactionRow
                    title={
                      tx.note ||
                      localizeCatalogName(tCatalog, "tags", tx.categoryName) ||
                      t(`direction.${tx.type}`)
                    }
                    subtitle={localizeCatalogName(
                      tCatalog,
                      "accounts",
                      tx.accountName,
                    )}
                    amountLabel={`${tx.type === "expense" ? "−" : "+"}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`}
                    tone={tx.type === "expense" ? "debit" : "credit"}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={APP_PATH.MONEY}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary"
        >
          {t("backToMoney")}
        </Link>
      </div>
    </div>
  );
}
