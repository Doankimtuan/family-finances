import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionPath,
  moneyTransactionCorrectPath,
  moneyTransactionRefundPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getTransaction,
  getTransactionReadResult,
  getTransactionActivity,
  getTransactionAuditChain,
  listTransactionTags,
  isRefundableStatus,
  TransactionStatus,
  TransactionLedgerType,
  TransactionReadStatus,
  TRANSACTION_CORRECTABLE_STATUS_VALUES,
  TRANSACTION_STATUS_VALUES,
  type TransactionStatus as TransactionStatusValue,
  TransactionOwner,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionActivityBreakdownKind,
  TransactionProductEvent,
} from "@/modules/ledger/application";
import { SavingsEventKind } from "@/modules/savings/application/savings-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import {
  TRANSACTION_ACCENT_LINK_CLASS,
  TRANSACTION_SURFACE_LINK_CLASS,
} from "../transaction-chrome";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Page } from "@/shared/patterns/page";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { TransactionTagEditor } from "../transaction-tag-editor";
import {
  TransactionFactRow,
  TransactionFactsCard,
} from "../transaction-facts-card";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const ACTIVITY_TONE_TO_AMOUNT_TONE: Record<
  TransactionActivityTone,
  AmountTone
> = {
  [TransactionActivityTone.CREDIT]: AmountTone.CREDIT,
  [TransactionActivityTone.DEBIT]: AmountTone.DEBIT,
  [TransactionActivityTone.REFUND]: AmountTone.REFUND,
  [TransactionActivityTone.NEUTRAL]: AmountTone.NEUTRAL,
};

function formatEffectiveDate(date: string, locale: string) {
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function eventLabel(
  tx: NonNullable<Awaited<ReturnType<typeof getTransaction>>>,
  activity: NonNullable<Awaited<ReturnType<typeof getTransactionActivity>>>,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (activity.kind === TransactionActivityKind.REFUND) {
    return t("detailPage.refund");
  }
  if (activity.productEvent === TransactionProductEvent.CARD_PAYMENT) {
    return t("detailPage.productKind.cardPayment");
  }
  if (activity.owner === TransactionOwner.CREDIT_CARD) {
    return t("detailPage.productKind.cardPurchase");
  }
  if (
    activity.owner === TransactionOwner.SAVINGS &&
    tx.savingsEventKind === SavingsEventKind.PRINCIPAL_PLACEMENT
  ) {
    return t("detailPage.productKind.savingsPlacement");
  }
  if (
    activity.owner === TransactionOwner.SAVINGS &&
    tx.savingsEventKind === SavingsEventKind.PRINCIPAL_RETURN
  ) {
    return t("detailPage.productKind.savingsReturn");
  }
  switch (tx.type) {
    case TransactionLedgerType.INVESTMENT_BUY:
      return t("detailPage.productKind.investmentBuy");
    case TransactionLedgerType.INVESTMENT_SELL_PROCEEDS:
      return t("detailPage.productKind.investmentSell");
    case TransactionLedgerType.DEBT_BORROWING:
      return t("detailPage.productKind.debtBorrowing");
    case TransactionLedgerType.LIABILITY_PAYMENT:
      return t("detailPage.productKind.debtPayment");
    case TransactionLedgerType.LOAN_INTEREST:
      return t("detailPage.productKind.loanInterest");
    default:
      switch (activity.kind) {
        case TransactionActivityKind.INCOME:
          return t("direction.income");
        case TransactionActivityKind.EXPENSE:
          return t("direction.expense");
        case TransactionActivityKind.LIABILITY_PAYMENT:
          return t("detailPage.productKind.debtPayment");
        case TransactionActivityKind.LOAN_INTEREST:
          return t("detailPage.productKind.loanInterest");
        case TransactionActivityKind.DEBT_BORROWING:
          return t("detailPage.productKind.debtBorrowing");
        case TransactionActivityKind.INVESTMENT:
          return t("detailPage.productKind.investment");
        case TransactionActivityKind.SAVINGS:
          return t("detailPage.productKind.savings");
        default:
          return t("detailPage.productKind.other");
      }
  }
}

function productContextLabel(
  activity: NonNullable<Awaited<ReturnType<typeof getTransactionActivity>>>,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (activity.productEvent === TransactionProductEvent.CARD_PAYMENT) {
    return t("detailPage.productContext.cardPayment");
  }
  switch (activity.owner) {
    case TransactionOwner.CREDIT_CARD:
      return t("detailPage.productContext.cardPurchase");
    case TransactionOwner.SAVINGS:
      return t("detailPage.productContext.savings");
    case TransactionOwner.INVESTMENT:
      return t("detailPage.productContext.investment");
    case TransactionOwner.DEBT:
    case TransactionOwner.LOAN:
      return t("detailPage.productContext.debt");
    default:
      return null;
  }
}

function transactionContextTitle(
  tx: NonNullable<Awaited<ReturnType<typeof getTransaction>>>,
  tCatalog: Awaited<ReturnType<typeof getTranslations>>,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  return (
    tx.note ||
    (tx.categoryName
      ? localizeCatalogName(tCatalog, CatalogGroup.TAGS, tx.categoryName)
      : null) ||
    t("detailPage.eventFallback")
  );
}

function TransferDetail({
  activity,
  locale,
  t,
  tCatalog,
}: {
  activity: NonNullable<Awaited<ReturnType<typeof getTransactionActivity>>>;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  tCatalog: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const sourceName = activity.sourceAccount?.name
    ? localizeCatalogName(
        tCatalog,
        CatalogGroup.ACCOUNTS,
        activity.sourceAccount.name,
      )
    : t("transferDetail.emptyValue");
  const destinationName = activity.destinationAccount?.name
    ? localizeCatalogName(
        tCatalog,
        CatalogGroup.ACCOUNTS,
        activity.destinationAccount.name,
      )
    : t("transferDetail.emptyValue");
  const amountLabel = formatCurrency(
    activity.amount,
    activity.currency,
    locale,
    { maximumFractionDigits: 0 },
  );

  return (
    <Page
      testId="money-transfer-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("transferDetail.title")}
          subtitle={t("transferDetail.subtitle")}
          backHref={APP_PATH.MONEY_TRANSACTIONS}
        />
      }
    >
      <MoneyOfflineBanner />
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Amount
          label={t("transferDetail.event")}
          amountLabel={amountLabel}
          size="lg"
          tone={AmountTone.NEUTRAL}
        />
      </Card>

      <TransactionFactsCard title={t("transferDetail.routeTitle")}>
        <TransactionFactRow
          label={t("transferDetail.from")}
          value={sourceName}
        />
        <TransactionFactRow
          label={t("transferDetail.to")}
          value={destinationName}
        />
        <TransactionFactRow
          label={t("transferDetail.date")}
          value={
            <span className="tabular-nums">
              {formatEffectiveDate(activity.effectiveDate, locale)}
            </span>
          }
        />
        {activity.note ? (
          <TransactionFactRow
            label={t("transferDetail.note")}
            value={activity.note}
          />
        ) : null}
      </TransactionFactsCard>

      <Card tone="soft" className="gap-0 p-(--space-4)">
        <Text size="sm" tone="secondary">
          {t("transferDetail.neutrality")}
        </Text>
      </Card>
    </Page>
  );
}

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

  const [t, tCatalog, transactionResult, activity, chain, availableTags] =
    await Promise.all([
      getTranslations("money"),
      getTranslations("catalog"),
      getTransactionReadResult(id),
      getTransactionActivity(id),
      getTransactionAuditChain(id),
      listTransactionTags({ includeArchived: true }),
    ]);

  if (transactionResult.status === TransactionReadStatus.ERROR) {
    return (
      <Page
        testId="money-transaction-detail"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("detailPage.readErrorTitle")}
            backHref={APP_PATH.MONEY_TRANSACTIONS}
          />
        }
      >
        <StatusAlert
          variant="danger"
          title={t("detailPage.readErrorTitle")}
          description={t("detailPage.readErrorBody")}
        />
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
    );
  }

  if (transactionResult.status === TransactionReadStatus.NOT_FOUND) {
    return (
      <Page
        testId="money-transaction-detail"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("detailPage.notFound")}
            backHref={APP_PATH.MONEY_TRANSACTIONS}
          />
        }
      >
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
    );
  }

  const tx = transactionResult.transaction;

  if (activity?.kind === TransactionActivityKind.TRANSFER) {
    return (
      <TransferDetail
        activity={activity}
        locale={locale}
        t={t}
        tCatalog={tCatalog}
      />
    );
  }

  if (!activity) {
    return (
      <Page
        testId="money-transaction-detail"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("detailPage.readErrorTitle")}
            backHref={APP_PATH.MONEY_TRANSACTIONS}
          />
        }
      >
        <StatusAlert
          variant="danger"
          title={t("detailPage.readErrorTitle")}
          description={t("detailPage.readErrorBody")}
        />
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
    );
  }

  const signed = `${activity.sign}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`;
  const detailLabel = eventLabel(tx, activity, t);
  const statusKey = (TRANSACTION_STATUS_VALUES as readonly string[]).includes(
    tx.status,
  )
    ? (tx.status as TransactionStatusValue)
    : TransactionStatus.POSTED;
  const canRefund = activity.canGenericRefund && isRefundableStatus(tx.status);
  const canCorrect =
    activity.canGenericCorrect &&
    (TRANSACTION_CORRECTABLE_STATUS_VALUES as readonly string[]).includes(
      tx.status,
    );
  const hasRefundHistory =
    tx.isReversal ||
    (chain?.reversals.length ?? 0) > 0 ||
    tx.status === TransactionStatus.PARTIALLY_REFUNDED ||
    tx.status === TransactionStatus.FULLY_REFUNDED;
  const hasCorrectionHistory =
    Boolean(tx.correctsTransactionId) || (chain?.corrections.length ?? 0) > 0;
  const hasHistory = hasRefundHistory || hasCorrectionHistory;
  const productContext = productContextLabel(activity, t);

  return (
    <Page
      testId="money-transaction-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={detailLabel}
          subtitle={t("detailPage.subtitle")}
          backHref={APP_PATH.MONEY_TRANSACTIONS}
        />
      }
    >
      <MoneyOfflineBanner />
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Amount
          label={t("detailPage.amount")}
          amountLabel={signed}
          size="lg"
          tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
        />
      </Card>

      {activity.breakdown.kind ===
      TransactionActivityBreakdownKind.LOAN_PAYMENT ? (
        <TransactionFactsCard
          title={t("detailPage.loanBreakdown.title")}
          testId="loan-payment-breakdown"
        >
          <TransactionFactRow
            label={t("detailPage.loanBreakdown.principal")}
            value={
              <span className="tabular-nums">
                <FinancialValue>
                  {formatCurrency(
                    activity.breakdown.principalAmount,
                    tx.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                </FinancialValue>
              </span>
            }
          />
          <TransactionFactRow
            label={t("detailPage.loanBreakdown.interest")}
            value={
              <span className="tabular-nums">
                <FinancialValue>
                  {formatCurrency(
                    activity.breakdown.interestAmount,
                    tx.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                </FinancialValue>
              </span>
            }
          />
          <TransactionFactRow
            label={t("detailPage.loanBreakdown.total")}
            value={
              <span className="tabular-nums font-semibold">
                <FinancialValue>
                  {formatCurrency(
                    activity.breakdown.totalPaid,
                    tx.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                </FinancialValue>
              </span>
            }
          />
        </TransactionFactsCard>
      ) : null}

      <TransactionFactsCard title={t("detailPage.context")}>
        <TransactionFactRow
          label={t("detailPage.account")}
          value={
            localizeCatalogName(
              tCatalog,
              CatalogGroup.ACCOUNTS,
              tx.accountName,
            ) || t("detailPage.emptyValue")
          }
        />
        <TransactionFactRow
          label={t("detailPage.date")}
          value={formatEffectiveDate(tx.transactionDate, locale)}
        />
        <TransactionFactRow
          label={t("detailPage.status")}
          value={t(`status.${statusKey}`)}
        />
        <TransactionFactRow
          label={t("detailPage.jar")}
          value={
            tx.jarName
              ? localizeCatalogName(tCatalog, CatalogGroup.JARS, tx.jarName)
              : t("detailPage.unmapped")
          }
        />
      </TransactionFactsCard>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader title={t("detailPage.category")} />
        {tx.categoryName ? (
          <span className="inline-flex min-h-11 items-center self-start rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary">
            {localizeCatalogName(tCatalog, CatalogGroup.TAGS, tx.categoryName)}
          </span>
        ) : (
          <Text size="sm" tone="secondary">
            {t("detailPage.noTag")}
          </Text>
        )}
      </section>

      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <TransactionTagEditor
          transactionId={tx.id}
          initialTags={tx.tags}
          availableTags={availableTags ?? []}
        />
      </Card>

      {productContext ? (
        <Card tone="soft" className="gap-0 p-(--space-4)">
          <Text size="sm" tone="secondary">
            {productContext}
          </Text>
        </Card>
      ) : null}

      {hasHistory && chain ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="transaction-relationships"
        >
          <SectionHeader
            title={
              hasRefundHistory
                ? t("detailPage.refundRelationship")
                : t("detailPage.changeHistory")
            }
          />
          <Card tone="elevated" className="gap-0 p-0">
            <ul className="divide-y divide-border-subtle/65">
              {tx.status === TransactionStatus.PARTIALLY_REFUNDED ? (
                <li className="px-(--space-4) py-(--space-3) text-sm font-medium text-text-primary">
                  {t("detailPage.refundPartial")}
                </li>
              ) : null}
              {tx.status === TransactionStatus.FULLY_REFUNDED ? (
                <li className="px-(--space-4) py-(--space-3) text-sm font-medium text-text-primary">
                  {t("detailPage.refundFull")}
                </li>
              ) : null}
              {tx.isReversal ? (
                <li className="px-(--space-4) py-(--space-3) text-sm text-text-primary">
                  <Link
                    href={moneyTransactionPath(chain.original.id)}
                    className="font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {t.rich("detailPage.refundOriginal", {
                      title: transactionContextTitle(
                        chain.original,
                        tCatalog,
                        t,
                      ),
                      amount: () => (
                        <FinancialValue>
                          {formatCurrency(
                            chain.original.amount,
                            chain.original.currency,
                            locale,
                            { maximumFractionDigits: 0 },
                          )}
                        </FinancialValue>
                      ),
                      date: formatEffectiveDate(
                        chain.original.transactionDate,
                        locale,
                      ),
                    })}
                  </Link>
                </li>
              ) : null}
              {chain.reversals.map((leg) => (
                <li
                  key={leg.id}
                  className="px-(--space-4) py-(--space-3) text-sm text-text-secondary"
                >
                  <Link
                    href={moneyTransactionPath(leg.id)}
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {t.rich("detailPage.refundEntry", {
                      amount: () => (
                        <FinancialValue>
                          {formatCurrency(leg.amount, leg.currency, locale, {
                            maximumFractionDigits: 0,
                          })}
                        </FinancialValue>
                      ),
                      date: formatEffectiveDate(leg.transactionDate, locale),
                    })}
                  </Link>
                </li>
              ))}
              {hasCorrectionHistory ? (
                <>
                  <li className="px-(--space-4) py-(--space-3) text-sm font-medium text-text-primary">
                    {t("detailPage.correctionStory")}
                  </li>
                  <li className="px-(--space-4) py-(--space-3) text-sm text-text-secondary">
                    <Link
                      href={moneyTransactionPath(chain.original.id)}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {t.rich("detailPage.correctionOriginal", {
                        title: transactionContextTitle(
                          chain.original,
                          tCatalog,
                          t,
                        ),
                        amount: () => (
                          <FinancialValue>
                            {formatCurrency(
                              chain.original.amount,
                              chain.original.currency,
                              locale,
                              { maximumFractionDigits: 0 },
                            )}
                          </FinancialValue>
                        ),
                        date: formatEffectiveDate(
                          chain.original.transactionDate,
                          locale,
                        ),
                      })}
                    </Link>
                  </li>
                  {chain.corrections.map((leg) => (
                    <li
                      key={leg.id}
                      className="px-(--space-4) py-(--space-3) text-sm text-text-primary"
                    >
                      <Link
                        href={moneyTransactionPath(leg.id)}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        {t.rich("detailPage.correctionCorrected", {
                          amount: () => (
                            <FinancialValue>
                              {formatCurrency(
                                leg.amount,
                                leg.currency,
                                locale,
                                { maximumFractionDigits: 0 },
                              )}
                            </FinancialValue>
                          ),
                          date: formatEffectiveDate(
                            leg.transactionDate,
                            locale,
                          ),
                        })}
                      </Link>
                    </li>
                  ))}
                </>
              ) : null}
            </ul>
          </Card>
        </section>
      ) : null}

      {canCorrect ? (
        <Link
          href={moneyTransactionCorrectPath(tx.id)}
          className={TRANSACTION_ACCENT_LINK_CLASS}
          data-testid="transaction-correct"
        >
          {t("detailPage.correct")}
        </Link>
      ) : null}
      {canRefund ? (
        <Link
          href={moneyTransactionRefundPath(tx.id)}
          className={TRANSACTION_SURFACE_LINK_CLASS}
          data-testid="transaction-refund"
        >
          {t("detailPage.refundAction")}
        </Link>
      ) : null}
    </Page>
  );
}
