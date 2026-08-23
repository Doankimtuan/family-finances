import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  buildDebtSummary,
  createMoneyHubModuleSummaries,
  createMoneyHubViewModel,
  DEFAULT_CURRENCY,
  getRealPosition,
  listCreditCards,
  listDebts,
  listLoanSummaries,
  MoneyAccountGroupKey,
  MoneyCreditAttention,
  MoneyModuleAttentionLevel,
  type MoneyHubDomainSummary,
} from "@/modules/ledger/application";
import {
  buildSavingsOverviewModel,
  listSavings,
} from "@/modules/savings/application";
import { countActiveInvestmentHoldings } from "@/modules/investments/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { MotionReveal } from "@/shared/motion";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "./money-offline-banner";
import { MoneyHubAccounts } from "./money-hub-accounts";
import { MoneyPositionHero } from "./money-position-hero";
import {
  MoneyModuleCard,
  MoneyModuleRow,
  type MoneyModuleValue,
} from "./money-module-section";
import { MoneyCaptureAction } from "./money-capture-action";
import { moneyAccountVisualFor } from "./money-account-visuals";

type Props = { params: Promise<{ locale: string }> };

function asUtcDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

/**
 * Money is the financial inventory hub: position → where it sits → account
 * containers → the other money domains. Domain totals come from each module's
 * own read model; nothing here re-derives financial rules or invents aggregates.
 */
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

  const todayIso = todayIsoDate();
  const [
    t,
    tCatalog,
    position,
    cardsListed,
    savingsList,
    debtsList,
    loanSummaries,
    investmentCount,
  ] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getRealPosition(),
    listCreditCards(),
    listSavings(),
    listDebts(),
    listLoanSummaries(),
    countActiveInvestmentHoldings(),
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

  const savingsOverview = savingsList
    ? buildSavingsOverviewModel(savingsList, todayIso)
    : null;
  const debtSummary = debtsList ? buildDebtSummary(debtsList, todayIso) : null;
  const modules = createMoneyHubModuleSummaries({
    savings: savingsOverview
      ? {
          totalPrincipal: savingsOverview.totalPrincipal,
          activeCount: savingsOverview.activeItems.length,
          attentionCount: savingsOverview.attentionCount,
          currency: DEFAULT_CURRENCY,
        }
      : null,
    investments:
      investmentCount == null ? null : { activeCount: investmentCount },
    loans: loanSummaries,
    debts: debtSummary
      ? {
          borrowedRemaining: debtSummary.totalBorrowed,
          lentRemaining: debtSummary.totalLent,
          activeCount: debtSummary.activeCount,
          overdueCount: debtSummary.overdueCount,
          dueSoonCount: debtSummary.dueSoonCount,
          currency: debtsList?.[0]?.currency ?? DEFAULT_CURRENCY,
        }
      : null,
  });

  const money = (value: number, valueCurrency: string | null) =>
    formatCurrency(value, valueCurrency ?? currency, locale, {
      maximumFractionDigits: 0,
    });
  const unavailableValue = (): MoneyModuleValue => ({
    state: "unavailable",
    label: t("hub.modules.unavailable"),
  });
  const principalValue = (summary: MoneyHubDomainSummary): MoneyModuleValue =>
    !summary.loaded
      ? unavailableValue()
      : summary.count > 0 && summary.total != null
        ? { state: "value", label: money(summary.total, summary.currency) }
        : { state: "empty", label: t("hub.modules.empty") };

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
          balanceCaption: t("accountDetail.balanceLabel"),
          balanceLabel: money(account.balance, currency),
          icon: visual.icon,
          iconTone: visual.tone,
          financialScope: account.financialScope,
          isOwnedByMe: account.isOwnedByMe,
          ownerStatus: account.ownerStatus,
        };
      }),
    }));

  return (
    <Page
      testId="money-hub"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
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
            className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="money-retry"
          >
            {t("hub.retry")}
          </Link>
        </Section>
      ) : (
        <>
          <MotionReveal>
            <MoneyPositionHero
              ownedMoneyLabel={t("realPosition")}
              ownedMoneyValue={money(viewModel.totalOwnedBalance, currency)}
              metaLine={
                <div className="flex flex-wrap items-center gap-x-(--space-3) gap-y-(--space-1)">
                  <Text size="sm" className="text-hero-muted">
                    {t("hub.activeAccounts", {
                      count: viewModel.activeAccountCount,
                    })}
                  </Text>
                  {viewModel.totalCreditOutstanding > 0 ? (
                    <span className="border-l border-white/25 pl-(--space-3) text-sm tabular-nums text-hero-muted">
                      {t("hub.totalCreditOutstandingLabel", {
                        value: money(
                          viewModel.totalCreditOutstanding,
                          currency,
                        ),
                      })}
                    </span>
                  ) : null}
                </div>
              }
              compositionLabel={t("hub.composition")}
              composition={viewModel.composition.map((segment) => ({
                ...segment,
                label: t(`hub.groups.${segment.key}`),
                percentageLabel: segment.isLessThanOnePercent
                  ? t("hub.lessThanOnePercent")
                  : t("hub.percentage", { value: segment.percentage }),
                balanceLabel: money(segment.balance, currency),
              }))}
              activityHref={APP_PATH.MONEY_TRANSACTIONS}
              activityLabel={t("seeActivity")}
            />
          </MotionReveal>
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
              outstandingLabel: money(card.outstanding, currency),
              availableLabel: money(card.availableCredit, currency),
              limitLabel: money(card.creditLimit, currency),
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
            currency={currency}
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
              creditCardType: t("types.credit_card"),
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
          <MoneyModuleCard
            title={t("hub.modules.growingTitle")}
            testId="money-modules-growing"
          >
            <MoneyModuleRow
              href={APP_PATH.MONEY_SAVINGS}
              testId="money-link-savings"
              icon={FINANCE_ICONS.savings}
              iconTone="savings"
              label={t("savings")}
              value={principalValue(modules.savings)}
              meta={
                modules.savings.count > 0
                  ? t("hub.modules.savingsCount", {
                      count: modules.savings.count,
                    })
                  : undefined
              }
              attention={
                modules.savings.attention
                  ? {
                      level: modules.savings.attention.level,
                      label: t("hub.modules.savingsAttention", {
                        count: modules.savings.attention.count,
                      }),
                    }
                  : null
              }
            />
            <MoneyModuleRow
              href={APP_PATH.MONEY_INVESTMENTS}
              testId="money-link-investments"
              icon={FINANCE_ICONS.investment}
              iconTone="investment"
              label={t("investmentsLabel")}
              value={
                !modules.investments.loaded
                  ? unavailableValue()
                  : modules.investments.count > 0
                    ? {
                        state: "value",
                        label: t("hub.modules.investmentsCount", {
                          count: modules.investments.count,
                        }),
                      }
                    : { state: "empty", label: t("hub.modules.empty") }
              }
            />
          </MoneyModuleCard>
          <MoneyModuleCard
            title={t("hub.modules.owedTitle")}
            testId="money-modules-owed"
          >
            <MoneyModuleRow
              href={APP_PATH.MONEY_LOANS}
              testId="money-link-loans"
              icon={FINANCE_ICONS.loan}
              iconTone="info"
              label={t("loans")}
              value={principalValue(modules.loans)}
              meta={
                modules.loans.count > 0
                  ? t("hub.modules.loansCount", { count: modules.loans.count })
                  : undefined
              }
              attention={
                modules.loans.attention
                  ? {
                      level: modules.loans.attention.level,
                      label:
                        modules.loans.attention.level ===
                        MoneyModuleAttentionLevel.CRITICAL
                          ? t("hub.modules.loansOverdue", {
                              count: modules.loans.attention.count,
                            })
                          : t("hub.modules.loansDueSoon", {
                              count: modules.loans.attention.count,
                            }),
                    }
                  : null
              }
            />
            <MoneyModuleRow
              href={APP_PATH.MONEY_DEBTS}
              testId="money-link-debts"
              icon={FINANCE_ICONS.debt}
              iconTone="debt"
              label={t("debts")}
              value={
                !modules.debts.loaded
                  ? unavailableValue()
                  : modules.debts.total != null && modules.debts.total > 0
                    ? {
                        state: "value",
                        label: money(
                          modules.debts.total,
                          modules.debts.currency,
                        ),
                      }
                    : { state: "empty", label: t("hub.modules.noDebt") }
              }
              meta={
                modules.debts.loaded &&
                modules.debts.secondaryTotal != null &&
                modules.debts.secondaryTotal > 0
                  ? t("hub.modules.debtsLent", {
                      value: money(
                        modules.debts.secondaryTotal,
                        modules.debts.currency,
                      ),
                    })
                  : undefined
              }
              attention={
                modules.debts.attention
                  ? {
                      level: modules.debts.attention.level,
                      label:
                        modules.debts.attention.level ===
                        MoneyModuleAttentionLevel.CRITICAL
                          ? t("hub.modules.debtsOverdue", {
                              count: modules.debts.attention.count,
                            })
                          : t("hub.modules.debtsDueSoon", {
                              count: modules.debts.attention.count,
                            }),
                    }
                  : null
              }
            />
          </MoneyModuleCard>
          <FloatingAction>
            <MoneyCaptureAction />
          </FloatingAction>
        </>
      )}
    </Page>
  );
}
