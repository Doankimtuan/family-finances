import { getTranslations } from "next-intl/server";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import {
  createMoneyHubCreditCards,
  createMoneyHubViewModel,
  DEFAULT_CURRENCY,
  getRealPosition,
  listCreditCards,
  MoneyAccountGroupKey,
  MoneyCreditAttention,
  MoneyReadStatus,
  toMoneyReadState,
} from "@/modules/ledger/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { moneyAccountVisualFor } from "../money-account-visuals";
import { MoneyAccountsDirectory } from "../money-accounts-directory";
import type {
  MoneyHubAccountGroup,
  MoneyHubCardRow,
} from "../money-accounts-scan";

type Props = { params: Promise<{ locale: string }> };

function asUtcDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

export default async function AccountsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const { locale } = await requireProductSession({ localeParam: rawLocale });

  const [t, tCatalog, position, cardsListed] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getRealPosition(),
    listCreditCards(),
  ]);
  const positionRead = toMoneyReadState(position);
  const cardsRead = toMoneyReadState(cardsListed);
  let currency = DEFAULT_CURRENCY;
  if (positionRead.status === MoneyReadStatus.READY) {
    currency = positionRead.data.currency;
  } else if (cardsRead.status === MoneyReadStatus.READY) {
    currency = cardsRead.data.currency;
  }
  const money = (amount: number, valueCurrency = currency) =>
    formatCurrency(amount, valueCurrency, locale, { maximumFractionDigits: 0 });
  const creditCardData =
    cardsRead.status === MoneyReadStatus.READY ? cardsRead.data.cards : [];
  const viewModel =
    positionRead.status === MoneyReadStatus.READY
      ? createMoneyHubViewModel({
          position: positionRead.data,
          creditCards: creditCardData,
        })
      : null;
  const cards =
    viewModel?.creditCards ??
    (cardsRead.status === MoneyReadStatus.READY
      ? createMoneyHubCreditCards(cardsRead.data.cards)
      : []);
  const accountGroups: MoneyHubAccountGroup[] =
    viewModel?.directoryAccountGroups.map((group) => ({
      key: group.key,
      totalBalanceLabel: money(group.totalBalance),
      accounts: group.accounts.map((account) => {
        const visual = moneyAccountVisualFor(account.type, account.iconKey);
        return {
          id: account.id,
          title: localizeCatalogName(tCatalog, "accounts", account.name),
          balanceLabel: money(account.balance),
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
    })) ?? [];
  const creditCards: MoneyHubCardRow[] = cards.map((card) => ({
    id: card.accountId,
    title: localizeCatalogName(tCatalog, "accounts", card.name),
    outstandingLabel: money(card.outstanding),
    utilizationLabel:
      card.utilizationForDisplay == null
        ? t("hub.utilizationUnavailable")
        : t("accountsPage.utilization", {
            pct: card.utilizationForDisplay,
          }),
    dueLabel: card.nextDueDate
      ? t("accountsPage.nextDue", {
          date: formatDate(asUtcDate(card.nextDueDate), locale),
        })
      : undefined,
    attention: card.attention,
  }));
  const accountCountSummary = viewModel
    ? t("hub.activeAccounts", { count: viewModel.activeAccountCount })
    : t("hub.modules.accountsUnavailable");

  return (
    <MoneyAccountsDirectory
      accounts={accountGroups}
      creditCards={creditCards}
      accountsUnavailable={positionRead.status === MoneyReadStatus.UNAVAILABLE}
      creditCardsUnavailable={cardsRead.status === MoneyReadStatus.UNAVAILABLE}
      ownedBalanceValue={viewModel ? money(viewModel.totalOwnedBalance) : null}
      ownedBalanceUnavailable={t("hub.modules.accountsUnavailable")}
      labels={{
        pageTitle: t("accountsPage.title"),
        pageSubtitle: t("accountsPage.subtitle"),
        backToMoney: t("backToMoney"),
        addAccount: t("accountsPage.add"),
        ownedBalanceLabel: t("accountsPage.totalAccountBalance"),
        ownershipHint: t("accountsPage.ownershipHint"),
        sectionTitle: t("accountsPage.liquidTitle"),
        sectionDescription: accountCountSummary,
        creditCardsTitle: t("accountsPage.creditCardsTitle"),
        creditCardsHint: t("accountsPage.creditCardsHint"),
        creditCardsEmpty: t("accountsPage.creditCardsEmpty"),
        addCreditCard: t("accountsPage.addCreditCard"),
        accountGroupLabels: {
          [MoneyAccountGroupKey.CASH]: t("hub.groups.cash"),
          [MoneyAccountGroupKey.BANK]: t("hub.groups.bank"),
          [MoneyAccountGroupKey.WALLET]: t("hub.groups.wallet"),
          [MoneyAccountGroupKey.SAVINGS]: t("hub.groups.savings"),
          [MoneyAccountGroupKey.INVESTMENT]: t("hub.groups.investment"),
          [MoneyAccountGroupKey.OTHER]: t("hub.groups.other"),
        },
        cashWalletGroupTitle: t("hub.groups.cashAndWallet"),
        creditCardType: t("types.credit_card"),
        outstanding: t("accountsPage.outstanding"),
        accountsUnavailable: t("hub.modules.accountsUnavailable"),
        creditCardsUnavailable: t("hub.modules.creditCardsUnavailable"),
        emptyTitle: t("hub.emptyTitle"),
        emptyDescription: t("hub.emptyDescription"),
        attentionLabels: {
          [MoneyCreditAttention.OVERDUE]: t("hub.attention.overdue"),
          [MoneyCreditAttention.DUE_SOON]: t("hub.attention.dueSoon"),
          [MoneyCreditAttention.HIGH_UTILIZATION]: t(
            "hub.attention.highUtilization",
          ),
        },
      }}
    />
  );
}
