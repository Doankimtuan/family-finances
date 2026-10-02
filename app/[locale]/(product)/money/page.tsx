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
  MoneyAssetOverviewStatus,
  MoneyCreditAttention,
  MoneyModuleAttentionLevel,
  MoneyReadStatus,
  MONEY_HUB_ACCOUNTS_QUERY_PARAM,
  MONEY_HUB_ACCOUNTS_ALL_VALUE,
  toMoneyReadState,
  type MoneyHubDomainSummary,
} from "@/modules/ledger/application";
import { getSavingsHomeSummary } from "@/modules/savings/application";
import {
  InvestmentHomeValuationQuality,
  listInvestmentHomeSummary,
} from "@/modules/investments/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { MotionReveal } from "@/shared/motion";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  HOME_PRODUCT_SUMMARY_ICONS,
  MONEY_OVERVIEW_ICONS,
} from "@/shared/ui/icon-registry";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { StatusBadgeTone } from "@/shared/ui/status-badge";
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
import { moneyAccountVisualFor } from "./money-account-visuals";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asUtcDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

/**
 * Money is the financial inventory hub: position → where it sits → account
 * containers → the other money domains. Domain totals come from each module's
 * own read model; nothing here re-derives financial rules or invents aggregates.
 */
export default async function MoneyHubPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const initiallyExpanded =
    query[MONEY_HUB_ACCOUNTS_QUERY_PARAM] === MONEY_HUB_ACCOUNTS_ALL_VALUE;
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
  const compactMoney = (value: number, valueCurrency: string | null) =>
    formatCurrency(value, valueCurrency ?? currency, locale, {
      maximumFractionDigits: 1,
      notation: "compact",
    });
  const unavailableValue = (): MoneyModuleValue => ({
    state: "unavailable",
    label: t("hub.modules.unavailable"),
  });
  const principalValue = (summary: MoneyHubDomainSummary): MoneyModuleValue => {
    if (!summary.loaded) return unavailableValue();
    if (summary.count <= 0 || summary.total == null) {
      return { state: "empty", label: t("hub.modules.empty") };
    }
    return {
      state: "value",
      label: money(summary.total, summary.currency),
      kind: FinancialNumberKind.CURRENT_STATE,
    };
  };

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

  const investmentStatus = () => {
    const summary = modules.investments;
    if (!summary.loaded || summary.count === 0) return undefined;
    switch (summary.valuationQuality) {
      case InvestmentHomeValuationQuality.CURRENT:
        return {
          label: t("hub.modules.investmentValuationCurrent"),
          tone: StatusBadgeTone.POSITIVE,
        };
      case InvestmentHomeValuationQuality.STALE:
        return {
          label: t("hub.modules.investmentValuationStale"),
          tone: StatusBadgeTone.WARNING,
        };
      case InvestmentHomeValuationQuality.MANUAL:
        return {
          label: t("hub.modules.investmentValuationManual"),
          tone: StatusBadgeTone.NEUTRAL,
        };
      case InvestmentHomeValuationQuality.PARTIAL:
        return {
          label: t("hub.modules.investmentValuationPartial"),
          tone: StatusBadgeTone.WARNING,
        };
      case InvestmentHomeValuationQuality.UNKNOWN:
        return {
          label: t("hub.modules.investmentValuationUnknown"),
          tone: StatusBadgeTone.NEUTRAL,
        };
      default:
        return undefined;
    }
  };

  const debtValue = (): MoneyModuleValue => {
    if (!modules.debts.loaded) return unavailableValue();
    if (modules.debts.total == null || modules.debts.total <= 0) {
      return { state: "empty", label: t("hub.modules.noDebt") };
    }
    return {
      state: "value",
      label: money(modules.debts.total, modules.debts.currency),
      kind: FinancialNumberKind.CURRENT_STATE,
    };
  };

  const loanAttentionLabel = (
    attention: NonNullable<typeof modules.loans.attention>,
  ) =>
    attention.level === MoneyModuleAttentionLevel.CRITICAL
      ? t("hub.modules.loansOverdue", { count: attention.count })
      : t("hub.modules.loansDueSoon", { count: attention.count });

  const debtAttentionLabel = (
    attention: NonNullable<typeof modules.debts.attention>,
  ) =>
    attention.level === MoneyModuleAttentionLevel.CRITICAL
      ? t("hub.modules.debtsOverdue", { count: attention.count })
      : t("hub.modules.debtsDueSoon", { count: attention.count });

  const buildAccountRows = (
    groups: NonNullable<typeof viewModel>["accountGroups"],
  ) =>
    groups.map((group) => ({
      key: group.key,
      accounts: group.accounts.map((account) => {
        const visual = moneyAccountVisualFor(account.type, account.iconKey);
        return {
          id: account.id,
          title: localizeCatalogName(tCatalog, "accounts", account.name),
          balanceLabel: money(account.balance, currency),
          icon: visual.icon,
          iconTone: visual.tone,
          typeLabel: t(`types.${account.type}`),
          ownership: {
            financialScope: account.financialScope,
            isOwnedByMe: account.isOwnedByMe,
            ownerStatus: account.ownerStatus,
          },
        };
      }),
    }));

  const summaryUsesAssets =
    assetOverview.status !== MoneyAssetOverviewStatus.UNAVAILABLE;
  const summaryLabel = summaryUsesAssets
    ? t("hub.assetSummaryTitle")
    : t("realPosition");
  let summaryValue: string | null = null;
  if (summaryUsesAssets) {
    summaryValue = money(assetOverview.total, currency);
  } else if (viewModel) {
    summaryValue = money(viewModel.totalOwnedBalance, currency);
  }
  const summaryHint = summaryUsesAssets
    ? t("hub.assetSummaryHint")
    : t("realPositionHint");

  return (
    <Page
      testId="money-hub"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
          subtitle={t("header.subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      <>
        <MotionReveal>
          <MoneyPositionHero
            ownedMoneyLabel={summaryLabel}
            ownedMoneyHint={summaryHint}
            ownedMoneyValue={summaryValue}
            ownedMoneyKind={
              summaryUsesAssets
                ? FinancialNumberKind.ESTIMATE
                : FinancialNumberKind.CURRENT_STATE
            }
            positionUnavailableLabel={t("hub.modules.positionUnavailable")}
            heroAccessibleLabel={t("hub.heroAccessibleLabel")}
            metaLine={
              viewModel && reads.cards.status === MoneyReadStatus.READY
                ? t.rich("hub.totalCreditOutstandingLabel", {
                    value: (chunks) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                    amount: money(viewModel.totalCreditOutstanding, currency),
                  })
                : null
            }
            allocationLabel={t("hub.assetAllocation.title")}
            allocationHint={
              assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
                ? t(
                    "hub.assetAllocation.partial",
                    assetOverview.investmentCoverage,
                  )
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
                    balanceLabel: compactMoney(segment.amount, currency),
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
          accounts={buildAccountRows(viewModel?.initialAccountGroups ?? [])}
          allAccounts={buildAccountRows(viewModel?.accountGroups ?? [])}
          initiallyExpanded={initiallyExpanded}
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
            sectionTitle: t("hub.accountsTitle"),
            sectionDescription:
              viewModel && reads.cards.status === MoneyReadStatus.READY
                ? t("hub.accountCountSummary", {
                    accountCount: viewModel.activeAccountCount,
                    cardCount: creditCards.length,
                  })
                : viewModel
                  ? t("hub.accountCountSummaryAccountsOnly", {
                      accountCount: viewModel.activeAccountCount,
                    })
                  : t("hub.modules.accountsUnavailable"),
            totalBalanceLabel: viewModel
              ? money(viewModel.totalOwnedBalance, currency)
              : t("hub.modules.unavailable"),
            creditCardType: t("types.credit_card"),
            availableCredit: t("accountsPage.availableCredit"),
            creditLimit: t("hub.creditLimit"),
            accountsUnavailable: t("hub.modules.accountsUnavailable"),
            creditCardsUnavailable: t("hub.modules.creditCardsUnavailable"),
            outstanding: t("accountsPage.outstanding"),
            emptyTitle: t("hub.emptyTitle"),
            emptyDescription: t("hub.emptyDescription"),
            viewAccounts: t("hub.viewAccounts"),
            showAllAccounts: t("hub.showAllAccounts"),
            showFewerAccounts: t("hub.showFewerAccounts"),
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
            icon={MONEY_OVERVIEW_ICONS.savings}
            iconTone={IconContainerTone.SAVINGS}
            iconClassName="bg-success/10 text-success"
            label={t("savings")}
            value={principalValue(modules.savings)}
            meta={
              reads.savings.status === MoneyReadStatus.READY &&
              reads.savings.data.activeCount > 0
                ? t("hub.modules.savingsActivity", {
                    count: reads.savings.data.activeCount,
                    upcoming: reads.savings.data.upcomingMaturityCount,
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
            icon={HOME_PRODUCT_SUMMARY_ICONS.investments}
            iconTone={IconContainerTone.INVESTMENT}
            label={t("investmentsLabel")}
            value={investmentHoldingsValue(modules.investments)}
            status={investmentStatus()}
            meta={investmentMeta(modules.investments)}
          />
        </MoneyModuleCard>
        <MoneyModuleCard
          title={t("hub.modules.owedTitle")}
          testId="money-modules-owed"
        >
          <MoneyModuleRow
            href={APP_PATH.MONEY_LOANS}
            testId="money-link-loans"
            icon={HOME_PRODUCT_SUMMARY_ICONS.loans}
            iconTone={IconContainerTone.NEUTRAL}
            label={t("hub.modules.loansTitle")}
            value={principalValue(modules.loans)}
            meta={
              modules.loans.loaded
                ? t("hub.modules.loansCount", { count: modules.loans.count })
                : undefined
            }
            attention={
              modules.loans.attention
                ? {
                    level: modules.loans.attention.level,
                    label: loanAttentionLabel(modules.loans.attention),
                  }
                : null
            }
            trailingMeta={
              modules.loans.loaded && !modules.loans.attention ? (
                <Text
                  as="span"
                  size="xs"
                  tone="success"
                  className="max-w-full text-right text-pretty leading-tight"
                >
                  {modules.loans.count > 0
                    ? t("hub.modules.noPaymentAction")
                    : t("hub.modules.loansNone")}
                </Text>
              ) : undefined
            }
          />
          <MoneyModuleRow
            href={APP_PATH.MONEY_DEBTS}
            testId="money-link-debts"
            icon={HOME_PRODUCT_SUMMARY_ICONS.debt}
            iconTone={IconContainerTone.WARNING}
            label={t("hub.modules.debtsTitle")}
            value={debtValue()}
            meta={
              debtSummary
                ? t("hub.modules.debtsBreakdown", {
                    borrowed: debtSummary.borrowedCount,
                    lent: debtSummary.lentCount,
                  })
                : undefined
            }
            attention={
              modules.debts.attention
                ? {
                    level: modules.debts.attention.level,
                    label: debtAttentionLabel(modules.debts.attention),
                  }
                : null
            }
            trailingMeta={
              debtSummary && !modules.debts.attention ? (
                <Text
                  as="span"
                  size="xs"
                  tone={debtSummary.activeCount > 0 ? "success" : "secondary"}
                  className="max-w-full text-right text-pretty leading-tight"
                >
                  {debtSummary.activeCount > 0
                    ? t("hub.modules.noPaymentAction")
                    : t("hub.modules.debtsNone")}
                </Text>
              ) : undefined
            }
          />
        </MoneyModuleCard>
      </>
    </Page>
  );
}
