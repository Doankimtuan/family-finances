import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionEditPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getTransaction,
  TransactionDirection,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Balance } from "@/shared/patterns/balance";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function TransactionDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
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

  const [t, tCatalog, tx] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getTransaction(id),
  ]);

  if (!tx) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-detail"
      >
        <TopAppBar title={t("detailPage.notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  const signed = `${tx.type === TransactionDirection.EXPENSE ? "−" : "+"}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`;

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-transaction-detail"
    >
      <TopAppBar
        title={t("detailPage.title")}
        subtitle={t(`direction.${tx.type}`)}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Balance
          label={t(`direction.${tx.type}`)}
          amountLabel={signed}
          size="lg"
        />

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("detailPage.meta")} />
          <dl className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)">
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.account")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {localizeCatalogName(tCatalog, "accounts", tx.accountName) ||
                  "—"}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.date")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {tx.transactionDate}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.note")}
              </Text>
              <Text
                size="sm"
                className="text-right font-medium text-text-primary"
              >
                {tx.note || "—"}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.jar")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {tx.jarName
                  ? localizeCatalogName(tCatalog, "jars", tx.jarName)
                  : t("detailPage.unmapped")}
              </Text>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("detailPage.tags")} />
          {tx.categoryName ? (
            <span className="inline-flex min-h-11 items-center rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary">
              {localizeCatalogName(tCatalog, "tags", tx.categoryName)}
            </span>
          ) : (
            <Text size="sm" tone="secondary">
              {t("detailPage.noTag")}
            </Text>
          )}
        </section>

        <Link
          href={moneyTransactionEditPath(tx.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="transaction-edit"
        >
          {t("detailPage.edit")}
        </Link>
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary"
        >
          {t("detailPage.back")}
        </Link>
      </div>
    </div>
  );
}
