import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  createMoneyHubViewModel,
  DEFAULT_CURRENCY,
  getRealPosition,
  listCreditCards,
  MoneyAccountGroupKey,
  MoneyCreditAttention,
} from "@/modules/ledger/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { StatusAlert } from "@/shared/ui/status-alert";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "./money-offline-banner";
import { MoneyHubAccounts } from "./money-hub-accounts";
import { MoneyMoreLink } from "./money-more-link";
import { MoneyPositionHero } from "./money-position-hero";
import {
  MONEY_RELATED_FINANCE_ITEMS,
  MoneyRelatedFinanceKey,
} from "./money-related-finance";
import { moneyAccountVisualFor } from "./money-account-visuals";

type Props = { params: Promise<{ locale: string }> };

function asUtcDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

export default async function MoneyHubPage({ params }: Props) {
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

  const [t, tCatalog, position, cardsListed] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getRealPosition(),
    listCreditCards(),
  ]);

  const loadFailed = position == null || cardsListed == null;
  const currency =
    position?.currency ?? cardsListed?.currency ?? DEFAULT_CURRENCY;
  const viewModel =
    position && cardsListed
      ? createMoneyHubViewModel({ position, creditCards: cardsListed.cards })
      : null;
  const totalAccountCount =
    viewModel?.activeAccountCount ?? cardsListed?.cards.length ?? 0;
  const buildAccountRows = (
    groups: NonNullable<typeof viewModel>["accountGroups"],
  ) =>
    groups.map((group) => ({
      key: group.key,
      accounts: group.accounts.map((account) => {
        const visual = moneyAccountVisualFor(account.type);
        return {
          id: account.id,
          title: localizeCatalogName(tCatalog, "accounts", account.name),
          typeLabel: t(`types.${account.type}`),
          balanceLabel: formatCurrency(account.balance, currency, locale, {
            maximumFractionDigits: 0,
          }),
          icon: visual.icon,
          iconTone: visual.tone,
        };
      }),
    }));

  const relatedFinanceLabels: Record<MoneyRelatedFinanceKey, string> = {
    [MoneyRelatedFinanceKey.DEBTS]: t("debts"),
    [MoneyRelatedFinanceKey.SAVINGS]: t("savings"),
    [MoneyRelatedFinanceKey.INVESTMENTS]: t("investmentsLabel"),
    [MoneyRelatedFinanceKey.LOANS]: t("loans"),
  };
  const relatedFinanceDescriptions: Record<MoneyRelatedFinanceKey, string> = {
    [MoneyRelatedFinanceKey.DEBTS]: t("hub.related.debts"),
    [MoneyRelatedFinanceKey.SAVINGS]: t("hub.related.savings"),
    [MoneyRelatedFinanceKey.INVESTMENTS]: t("hub.related.investments"),
    [MoneyRelatedFinanceKey.LOANS]: t("hub.related.loans"),
  };

  return (
    <Page
      testId="money-hub"
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("header.headline")}
          subtitle={t("header.supporting")}
          icon={NAVIGATION_ICONS.money}
          meta={t("header.accountsMeta", { accountCount: totalAccountCount })}
        />
      }
    >
      <MoneyOfflineBanner />
      {loadFailed || !viewModel ? (
        <Section variant="surface" testId="money-load-error">
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
          <Link
            href={APP_PATH.MONEY}
            className="w-fit text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="money-retry"
          >
            {t("hub.retry")}
          </Link>
        </Section>
      ) : (
        <>
          <MoneyPositionHero
            ownedMoneyLabel={t("realPosition")}
            ownedMoneyValue={formatCurrency(
              viewModel.totalOwnedBalance,
              currency,
              locale,
              { maximumFractionDigits: 0 },
            )}
            accountCountLabel={t("hub.activeAccounts", {
              count: viewModel.activeAccountCount,
            })}
            creditOutstandingLabel={
              viewModel.totalCreditOutstanding > 0
                ? t("hub.totalCreditOutstanding", {
                    amount: formatCurrency(
                      viewModel.totalCreditOutstanding,
                      currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                  })
                : undefined
            }
            compositionLabel={t("hub.composition")}
            composition={viewModel.composition.map((segment) => ({
              ...segment,
              label: t(`hub.groups.${segment.key}`),
              percentageLabel: segment.isLessThanOnePercent
                ? t("hub.lessThanOnePercent")
                : t("hub.percentage", { value: segment.percentage }),
              balanceLabel: formatCurrency(segment.balance, currency, locale, {
                maximumFractionDigits: 0,
              }),
            }))}
            activityHref={APP_PATH.MONEY_TRANSACTIONS}
            activityLabel={t("seeActivity")}
          />
          <MoneyHubAccounts
            accountGroups={buildAccountRows(viewModel.accountGroups)}
            initialAccountGroups={buildAccountRows(
              viewModel.initialAccountGroups,
            )}
            accountPresentation={viewModel.accountPresentation}
            hasMoreAccounts={viewModel.hasMoreAccounts}
            creditCards={viewModel.creditCards.map((card) => ({
              id: card.accountId,
              title: localizeCatalogName(tCatalog, "accounts", card.name),
              outstandingLabel: formatCurrency(
                card.outstanding,
                currency,
                locale,
                {
                  maximumFractionDigits: 0,
                },
              ),
              availableLabel: formatCurrency(
                card.availableCredit,
                currency,
                locale,
                { maximumFractionDigits: 0 },
              ),
              limitLabel: formatCurrency(card.creditLimit, currency, locale, {
                maximumFractionDigits: 0,
              }),
              utilizationPct: card.utilizationForDisplay,
              utilizationLabel:
                card.utilizationForDisplay == null
                  ? t("hub.utilizationUnavailable")
                  : t("accountsPage.utilization", {
                      pct: card.utilizationForDisplay,
                    }),
              utilizationAriaLabel:
                card.utilizationForDisplay == null
                  ? t("hub.utilizationUnavailable")
                  : t("hub.utilizationAria", {
                      pct: card.utilizationForDisplay,
                    }),
              dueLabel: card.nextDueDate
                ? t("accountsPage.nextDue", {
                    date: formatDate(asUtcDate(card.nextDueDate), locale),
                  })
                : undefined,
              attention: card.attention,
            }))}
            liquidOptions={viewModel.accountGroups.flatMap((group) =>
              group.accounts.map((account) => ({
                id: account.id,
                name: localizeCatalogName(tCatalog, "accounts", account.name),
              })),
            )}
            createLabel={t("createAccount")}
            createOfflineLabel={t("createAccountOffline")}
            labels={{
              sectionTitle: t("accounts"),
              groupTitles: {
                [MoneyAccountGroupKey.CASH]: t("hub.groups.cash"),
                [MoneyAccountGroupKey.BANK]: t("hub.groups.bank"),
                [MoneyAccountGroupKey.WALLET]: t("hub.groups.wallet"),
                [MoneyAccountGroupKey.SAVINGS]: t("hub.groups.savings"),
                [MoneyAccountGroupKey.INVESTMENT]: t("hub.groups.investment"),
                [MoneyAccountGroupKey.OTHER]: t("hub.groups.other"),
              },
              creditCardsTitle: t("accountsPage.creditCardsTitle"),
              creditCardsHint: t("accountsPage.creditCardsHint"),
              outstanding: t("accountsPage.outstanding"),
              availableCredit: t("accountsPage.availableCredit"),
              creditLimit: t("hub.creditLimit"),
              emptyTitle: t("hub.emptyTitle"),
              emptyDescription: t("hub.emptyDescription"),
              showAll: t("hub.showAllAccounts"),
              showLess: t("hub.showLessAccounts"),
              attentionLabels: {
                [MoneyCreditAttention.OVERDUE]: t("hub.attention.overdue"),
                [MoneyCreditAttention.DUE_SOON]: t("hub.attention.dueSoon"),
                [MoneyCreditAttention.HIGH_UTILIZATION]: t(
                  "hub.attention.highUtilization",
                ),
              },
            }}
          />
        </>
      )}
      <Section title={t("more")} contentClassName="gap-0">
        <div className="divide-y divide-border-subtle/65 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle/65 bg-surface-muted/35">
          {MONEY_RELATED_FINANCE_ITEMS.map((item) => (
            <MoneyMoreLink
              key={item.key}
              href={item.href}
              label={relatedFinanceLabels[item.key]}
              description={relatedFinanceDescriptions[item.key]}
              icon={item.icon}
              iconTone={item.iconTone}
              testId={item.testId}
            />
          ))}
        </div>
      </Section>
    </Page>
  );
}
