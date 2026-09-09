import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  buildDebtSummary,
  createMoneyHubCreditCards,
  createMoneyHubModuleSummaries,
  createMoneyHubViewModel,
  calculateMoneyAssetOverview,
  DEFAULT_CURRENCY,
  getRealPosition,
  listCreditCards,
  listDebts,
  listLoanSummaries,
  MoneyAccountGroupKey,
  MoneyAssetOverviewStatus,
  MoneyCreditAttention,
  MoneyModuleAttentionLevel,
  MoneyReadStatus,
  toMoneyReadState,
  type MoneyHubDomainSummary,
} from "@/modules/ledger/application";
import { getSavingsHomeSummary } from "@/modules/savings/application";
import { listInvestmentHomeSummary } from "@/modules/investments/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { MotionReveal } from "@/shared/motion";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { FINANCE_ICONS, NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
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
    savingsSummary,
    debtsList,
    loanSummaries,
    investmentSummary,
  ] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getRealPosition(),
    listCreditCards(),
    getSavingsHomeSummary(),
    listDebts(),
    listLoanSummaries(),
    listInvestmentHomeSummary(),
  ]);

  const reads = {
    position: toMoneyReadState(position),
    cards: toMoneyReadState(cardsListed),
    savings: toMoneyReadState(savingsSummary),
    investments: toMoneyReadState(investmentSummary),
    debts: toMoneyReadState(debtsList),
    loans: toMoneyReadState(loanSummaries),
  };
  const currency =
    reads.position.status === MoneyReadStatus.READY
      ? reads.position.data.currency
      : reads.cards.status === MoneyReadStatus.READY
        ? reads.cards.data.currency
        : DEFAULT_CURRENCY;
  const viewModel =
    reads.position.status === MoneyReadStatus.READY
      ? createMoneyHubViewModel({
          position: reads.position.data,
          creditCards:
            reads.cards.status === MoneyReadStatus.READY
              ? reads.cards.data.cards
              : [],
        })
      : null;
  const creditCards =
    reads.cards.status === MoneyReadStatus.READY
      ? createMoneyHubCreditCards(reads.cards.data.cards)
      : [];
  const totalAccountCount = viewModel?.activeAccountCount ?? 0;

  const debtSummary =
    reads.debts.status === MoneyReadStatus.READY
      ? buildDebtSummary(reads.debts.data, todayIso)
      : null;
  const modules = createMoneyHubModuleSummaries({
    savings:
      reads.savings.status === MoneyReadStatus.READY
        ? {
            totalPrincipal: reads.savings.data.principal,
            activeCount: reads.savings.data.activeCount,
            attentionCount: reads.savings.data.actionRequiredCount,
            currency: DEFAULT_CURRENCY,
          }
        : null,
    investments:
      reads.investments.status === MoneyReadStatus.READY
        ? reads.investments.data
        : null,
    loans:
      reads.loans.status === MoneyReadStatus.READY ? reads.loans.data : null,
    debts: debtSummary
      ? {
          borrowedRemaining: debtSummary.totalBorrowed,
          lentRemaining: debtSummary.totalLent,
          activeCount: debtSummary.activeCount,
          overdueCount: debtSummary.overdueCount,
          dueSoonCount: debtSummary.dueSoonCount,
          currency:
            reads.debts.status === MoneyReadStatus.READY
              ? (reads.debts.data[0]?.currency ?? DEFAULT_CURRENCY)
              : DEFAULT_CURRENCY,
        }
      : null,
  });
  const assetOverview = calculateMoneyAssetOverview({
    accounts: viewModel?.totalOwnedBalance ?? null,
    savings:
      reads.savings.status === MoneyReadStatus.READY
        ? reads.savings.data.principal
        : null,
    investments:
      reads.investments.status === MoneyReadStatus.READY
        ? {
            amount: reads.investments.data.marketValue,
            valuationIncluded: reads.investments.data.valuationIncluded,
            valuationTotal: reads.investments.data.valuationTotal,
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
        ? {
            state: "value",
            label: money(summary.total, summary.currency),
            kind: FinancialNumberKind.CURRENT_STATE,
          }
        : { state: "empty", label: t("hub.modules.empty") };

  const investmentHoldingsValue = (
    summary: MoneyHubDomainSummary,
  ): MoneyModuleValue => {
    if (!summary.loaded) return unavailableValue();
    if (summary.count === 0) {
      return { state: "empty", label: t("hub.modules.empty") };
    }
    if (summary.total != null) {
      return {
        state: "value",
        label: money(summary.total, summary.currency),
        kind: FinancialNumberKind.ESTIMATE,
      };
    }
    return {
      state: "count",
      label: t("hub.modules.investmentCount", { count: summary.count }),
    };
  };

  const investmentMeta = (summary: MoneyHubDomainSummary) => {
    if (!summary.loaded || summary.count === 0) return undefined;
    if (
      summary.valuationCoverage != null &&
      summary.valuationCoverage.total > summary.valuationCoverage.included
    ) {
      return t("hub.modules.investmentCoverage", summary.valuationCoverage);
    }
    return t("hub.modules.investmentCount", { count: summary.count });
  };

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
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
          subtitle={t("header.subtitle")}
          icon={NAVIGATION_ICONS.money}
          meta={t("header.accountsMeta", { accountCount: totalAccountCount })}
        />
      }
    >
      <MoneyOfflineBanner />
      <>
        <MotionReveal>
          <MoneyPositionHero
            ownedMoneyLabel={t("realPosition")}
            ownedMoneyHint={t("realPositionHint")}
            ownedMoneyValue={
              viewModel ? money(viewModel.totalOwnedBalance, currency) : null
            }
            positionUnavailableLabel={t("hub.modules.positionUnavailable")}
            heroAccessibleLabel={t("hub.heroAccessibleLabel")}
            metaLine={
              viewModel ? (
                <div className="flex flex-wrap items-center gap-x-(--space-3) gap-y-(--space-1)">
                  <Text size="sm" className="text-hero-muted">
                    {t("hub.activeAccounts", {
                      count: viewModel.activeAccountCount,
                    })}
                  </Text>
                  {reads.cards.status === MoneyReadStatus.READY &&
                  viewModel.totalCreditOutstanding > 0 ? (
                    <span className="border-l border-white/25 pl-(--space-3) text-sm tabular-nums text-hero-muted">
                      {t.rich("hub.totalCreditOutstandingLabel", {
                        value: (chunks) => (
                          <FinancialValue>{chunks}</FinancialValue>
                        ),
                        amount: money(
                          viewModel.totalCreditOutstanding,
                          currency,
                        ),
                      })}
                    </span>
                  ) : null}
                </div>
              ) : (
                <Text size="sm" className="text-hero-muted">
                  {t("hub.modules.positionUnavailable")}
                </Text>
              )
            }
            allocationLabel={t("hub.assetAllocation.title")}
            allocationHint={
              assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
                ? t(
                    "hub.assetAllocation.partial",
                    assetOverview.investmentCoverage,
                  )
                : assetOverview.status === MoneyAssetOverviewStatus.COMPLETE
                  ? t("hub.assetAllocation.hint")
                  : undefined
            }
            allocationUnavailableLabel={
              assetOverview.status === MoneyAssetOverviewStatus.UNAVAILABLE
                ? t("hub.assetAllocation.unavailable")
                : undefined
            }
            allocation={
              assetOverview.status === MoneyAssetOverviewStatus.UNAVAILABLE
                ? []
                : assetOverview.allocation.map((segment) => ({
                    key: segment.key,
                    label: t(`hub.assetAllocation.groups.${segment.key}`),
                    percentage: segment.percentage,
                    percentageLabel: segment.isLessThanOnePercent
                      ? t("hub.lessThanOnePercent")
                      : t("hub.percentage", { value: segment.percentage }),
                    balanceLabel: money(segment.amount, currency),
                  }))
            }
            activityHref={APP_PATH.MONEY_TRANSACTIONS}
            activityLabel={t("seeActivity")}
            privacy={{
              hideLabel: t("financialPrivacy.hide"),
              showLabel: t("financialPrivacy.show"),
            }}
          />
        </MotionReveal>
        <MoneyHubAccounts
          accountGroups={buildAccountRows(viewModel?.accountGroups ?? [])}
          initialAccountGroups={buildAccountRows(
            viewModel?.initialAccountGroups ?? [],
          )}
          accountPresentation={viewModel?.accountPresentation ?? "flat"}
          hasMoreAccounts={viewModel?.hasMoreAccounts ?? false}
          creditCards={creditCards.map((card) => ({
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
          accountsUnavailable={
            reads.position.status === MoneyReadStatus.UNAVAILABLE
          }
          creditCardsUnavailable={
            reads.cards.status === MoneyReadStatus.UNAVAILABLE
          }
          liquidOptions={(viewModel?.accountGroups ?? []).flatMap((group) =>
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
            sectionDescription: t("hub.accountsHint"),
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
            accountsUnavailable: t("hub.modules.accountsUnavailable"),
            creditCardsUnavailable: t("hub.modules.creditCardsUnavailable"),
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
          description={t("hub.modules.growingHint")}
          testId="money-modules-growing"
        >
          <MoneyModuleRow
            href={APP_PATH.MONEY_SAVINGS}
            testId="money-link-savings"
            icon={FINANCE_ICONS.savings}
            iconTone={IconContainerTone.SAVINGS}
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
            iconTone={IconContainerTone.INVESTMENT}
            label={t("investmentsLabel")}
            value={investmentHoldingsValue(modules.investments)}
            meta={investmentMeta(modules.investments)}
          />
        </MoneyModuleCard>
        <MoneyModuleCard
          title={t("hub.modules.owedTitle")}
          description={t("hub.modules.owedHint")}
          testId="money-modules-owed"
        >
          <MoneyModuleRow
            href={APP_PATH.MONEY_LOANS}
            testId="money-link-loans"
            icon={FINANCE_ICONS.loan}
            iconTone={IconContainerTone.INFO}
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
            iconTone={IconContainerTone.DEBT}
            label={t("debts")}
            value={
              !modules.debts.loaded
                ? unavailableValue()
                : modules.debts.total != null && modules.debts.total > 0
                  ? {
                      state: "value",
                      label: money(modules.debts.total, modules.debts.currency),
                      kind: FinancialNumberKind.CURRENT_STATE,
                    }
                  : { state: "empty", label: t("hub.modules.noDebt") }
            }
            meta={
              modules.debts.loaded &&
              modules.debts.secondaryTotal != null &&
              modules.debts.secondaryTotal > 0
                ? t.rich("hub.modules.debtsLent", {
                    value: (chunks) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                    amount: money(
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
    </Page>
  );
}
