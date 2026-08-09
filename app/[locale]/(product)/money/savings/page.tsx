import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsPath,
  moneySavingsNewPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listSavings,
  SavingStatus,
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../money-offline-banner";

type Props = { params: Promise<{ locale: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

/** money.savings — product list (ledger-funded). */
export default async function SavingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  await backfillLegacySavingsAccounts();
  await detectMaturedSavings();

  const [t, tMoney, tProducts, items] = await Promise.all([
    getTranslations("money.savingsPage"),
    getTranslations("money"),
    getTranslations("money.products"),
    listSavings(),
  ]);

  const loadFailed = items == null;
  const list = items ?? [];
  const activeOrDue = list.filter(
    (item) =>
      item.status === SavingStatus.ACTIVE ||
      item.status === SavingStatus.MATURED,
  );
  const history = list.filter(
    (item) =>
      item.status === SavingStatus.CLOSED ||
      item.status === SavingStatus.EARLY_CLOSED,
  );
  const attentionCount = activeOrDue.filter(
    (item) => item.status === SavingStatus.MATURED,
  ).length;

  return (
    <Page
      testId="money-savings"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <MoneyOfflineBanner />
      <Text size="sm" tone="secondary">
        {t("orientation", {
          active: activeOrDue.length,
          due: attentionCount,
        })}
      </Text>
      <Text size="sm" tone="secondary">
        {tProducts("notBankBalance")}
      </Text>
      <Link
        href={moneySavingsNewPath()}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="savings-add-open"
      >
        {t("add")}
      </Link>
      {loadFailed ? (
        <ErrorState
          title={t("emptyTitle")}
          description={tProducts("errors.unknown")}
          className="flex-none py-(--space-4)"
        />
      ) : list.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <>
          <Section title={t("activeSection")} testId="savings-active-section">
            {activeOrDue.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("activeEmpty")}
              </Text>
            ) : (
              <ul className="flex flex-col gap-(--space-2)">
                {activeOrDue.map((item) => {
                  const cycle = item.latestCycle;
                  const principal = cycle?.principal ?? 0;
                  const isDue = item.status === SavingStatus.MATURED;
                  return (
                    <li key={item.id}>
                      <Link
                        href={moneySavingsPath(item.id)}
                        className="block rounded-xl border border-border-subtle bg-surface p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        data-testid={`savings-row-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-(--space-3)">
                          <Text
                            size="sm"
                            className="font-medium text-text-primary"
                          >
                            {item.productName ||
                              item.providerName ||
                              t("fallbackName")}
                          </Text>
                          {isDue ? (
                            <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-(--space-2) py-(--space-1) text-xs font-medium">
                              {t("maturityBadge")}
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs text-text-secondary">
                              {t(`status.${item.status}`)}
                            </span>
                          )}
                        </div>
                        <Amount
                          className="mt-(--space-2)"
                          label={tProducts("principalLabel")}
                          amountLabel={formatCurrency(
                            principal,
                            DEFAULT_CURRENCY,
                            locale,
                            { maximumFractionDigits: 0 },
                          )}
                        />
                        {cycle ? (
                          <Text
                            size="sm"
                            tone="secondary"
                            className="mt-(--space-1)"
                          >
                            {t("rowMeta", {
                              rate: cycle.lockedRate,
                              date: formatIsoDate(cycle.endDate, locale),
                            })}
                          </Text>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
          {history.length > 0 ? (
            <Section
              title={t("historySection")}
              testId="savings-history-section"
            >
              <ul className="flex flex-col gap-(--space-2)">
                {history.map((item) => {
                  const cycle = item.latestCycle;
                  const principal = cycle?.principal ?? 0;
                  return (
                    <li key={item.id}>
                      <Link
                        href={moneySavingsPath(item.id)}
                        className="block rounded-xl border border-border-subtle/70 bg-canvas p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        data-testid={`savings-history-row-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-(--space-3)">
                          <Text
                            size="sm"
                            className="font-medium text-text-primary"
                          >
                            {item.productName ||
                              item.providerName ||
                              t("fallbackName")}
                          </Text>
                          <span className="shrink-0 text-xs text-text-secondary">
                            {t(`status.${item.status}`)}
                          </span>
                        </div>
                        <Amount
                          className="mt-(--space-2)"
                          label={tProducts("principalLabel")}
                          amountLabel={formatCurrency(
                            principal,
                            DEFAULT_CURRENCY,
                            locale,
                            { maximumFractionDigits: 0 },
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}
        </>
      )}
      <Link
        href={APP_PATH.MONEY}
        className="text-sm font-medium text-accent"
        data-testid="savings-back-money"
      >
        {tMoney("backToMoney")}
      </Link>
    </Page>
  );
}
