import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import {
  moneyTransactionPath,
  moneyTransactionCorrectPath,
  moneyTransactionRefundPath,
} from "@/modules/tenancy/application/app-path";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
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
import { FinancialAmount } from "@/shared/ui/financial-amount";
import {
  FinancialAmountTone,
  FinancialAmountSize,
} from "@/shared/ui/financial-amount-constants";
import { AppIcon } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { SavingsEventKind } from "@/modules/savings/application/savings-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import {
  TRANSACTION_ACCENT_LINK_CLASS,
  TRANSACTION_SURFACE_LINK_CLASS,
} from "../transaction-chrome";
import { Amount, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";
import { Page } from "@/shared/patterns/page";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { TransactionTagEditor } from "../transaction-tag-editor";
import {
  TransactionFactRow,
  TransactionFactsCard,
} from "../transaction-facts-card";
import {
  TransactionsReturnLink,
  TransactionsReturnTopAppBar,
} from "./transactions-return-navigation";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};
type MoneyTranslator = Awaited<ReturnType<typeof getTranslations<"money">>>;
type CatalogTranslator = Awaited<ReturnType<typeof getTranslations<"catalog">>>;

const ACTIVITY_TONE_TO_AMOUNT_TONE: Record<
  TransactionActivityTone,
  AmountTone
> = {
  [TransactionActivityTone.CREDIT]: AmountTone.CREDIT,
  [TransactionActivityTone.DEBIT]: AmountTone.EXPENSE,
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
  t: MoneyTranslator,
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
  t: MoneyTranslator,
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
  tCatalog: CatalogTranslator,
  t: MoneyTranslator,
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
  t: MoneyTranslator;
  tCatalog: CatalogTranslator;
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

  return (
    <Page
      testId="money-transfer-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TransactionsReturnTopAppBar
          variant="detail"
          title={t("transferDetail.title")}
          subtitle={t("transferDetail.subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      <Card tone="soft" className="gap-(--space-3) p-(--space-5)">
        <Text size="sm" tone="secondary">
          {t("transferDetail.event")}
        </Text>
        <FinancialAmount
          value={activity.amount}
          tone={FinancialAmountTone.TRANSFER}
          size={FinancialAmountSize.DISPLAY_HERO}
          showSign
        />
        <StatusBadge tone={StatusBadgeTone.INFO}>
          {t("transferDetail.balanced")}
        </StatusBadge>
      </Card>

      <Card
        tone="soft"
        className="gap-(--space-3) p-(--space-4)"
        data-testid="transfer-route"
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text size="sm" tone="secondary">
              {t("transferDetail.from")}
            </Text>
            <Text weight="medium">{sourceName}</Text>
          </div>
          <FinancialAmount
            value={activity.amount}
            tone={FinancialAmountTone.EXPENSE}
            showSign
          />
        </div>
        <div className="self-center text-transfer" aria-hidden="true">
          <AppIcon icon={FINANCE_ICONS.transfer} size="md" />
        </div>
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text size="sm" tone="secondary">
              {t("transferDetail.to")}
            </Text>
            <Text weight="medium">{destinationName}</Text>
          </div>
          <FinancialAmount
            value={activity.amount}
            tone={FinancialAmountTone.INCOME}
            showSign
          />
        </div>
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
        <TransactionFactRow
          label={t("transferDetail.auditId")}
          value={
            <span className="break-all font-mono text-xs">
              {activity.relatedTransactionIds.join(" · ")}
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

function DetailSectionFallback({ children }: { children: ReactNode }) {
  return (
    <div role="status">
      <Card tone="soft" className="p-(--space-4)">
        <Text size="sm" tone="secondary">
          {children}
        </Text>
      </Card>
    </div>
  );
}

async function TransactionTagsSection({
  tx,
  tagOptionsPromise,
  t,
}: {
  tx: NonNullable<Awaited<ReturnType<typeof getTransaction>>>;
  tagOptionsPromise: ReturnType<typeof listTransactionTags>;
  t: MoneyTranslator;
}) {
  const availableTags = await tagOptionsPromise;

  return (
    <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
      {availableTags === null ? (
        <StatusAlert
          variant="danger"
          title={t("detailPage.tagOptionsUnavailableTitle")}
          description={t("detailPage.tagOptionsUnavailableBody")}
        />
      ) : null}
      <TransactionTagEditor
        transactionId={tx.id}
        initialTags={tx.tags}
        availableTags={availableTags ?? tx.tags}
        disabled={availableTags === null}
      />
    </Card>
  );
}

async function TransactionAuditHistory({
  tx,
  auditChainPromise,
  locale,
  t,
  tCatalog,
}: {
  tx: NonNullable<Awaited<ReturnType<typeof getTransaction>>>;
  auditChainPromise: ReturnType<typeof getTransactionAuditChain>;
  locale: string;
  t: MoneyTranslator;
  tCatalog: CatalogTranslator;
}) {
  const chain = await auditChainPromise;
  if (chain === null) {
    return (
      <StatusAlert
        variant="danger"
        title={t("detailPage.historyUnavailableTitle")}
        description={t("detailPage.historyUnavailableBody")}
      />
    );
  }

  const hasRefundHistory =
    tx.isReversal ||
    chain.reversals.length > 0 ||
    tx.status === TransactionStatus.PARTIALLY_REFUNDED ||
    tx.status === TransactionStatus.FULLY_REFUNDED;
  const hasCorrectionHistory =
    Boolean(tx.correctsTransactionId) || chain.corrections.length > 0;
  if (!hasRefundHistory && !hasCorrectionHistory) return null;

  return (
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
                  title: transactionContextTitle(chain.original, tCatalog, t),
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
                    title: transactionContextTitle(chain.original, tCatalog, t),
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
            </>
          ) : null}
        </ul>
      </Card>
    </section>
  );
}

export default function TransactionDetailPage(props: Props) {
  return withPerfSpan(PERF_TRACE_OP.TRANSACTION_DETAIL_ROUTE_RETURN, () =>
    renderTransactionDetailPage(props),
  );
}

async function renderTransactionDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const { locale } = await withPerfSpan(
    PERF_TRACE_OP.TRANSACTION_SESSION_GATE,
    () => requireProductSession({ localeParam: rawLocale }),
  );

  const detailResultPromise = getTransactionReadResult(id);
  const activityPromise = getTransactionActivity(id);
  const secondaryTransactionPromise = detailResultPromise.then((result) => {
    if (result.status !== TransactionReadStatus.OK) return null;
    if (
      result.transaction.type === TransactionLedgerType.TRANSFER_IN ||
      result.transaction.type === TransactionLedgerType.TRANSFER_OUT
    ) {
      return null;
    }
    return result.transaction;
  });
  const auditChainPromise = secondaryTransactionPromise.then((transaction) => {
    if (!transaction) return null;
    return withPerfSpan(PERF_TRACE_OP.TRANSACTION_DETAIL_AUDIT_CHAIN, () =>
      getTransactionAuditChain(id),
    );
  });
  const tagOptionsPromise = secondaryTransactionPromise.then((transaction) => {
    if (!transaction) return null;
    return withPerfSpan(PERF_TRACE_OP.TRANSACTION_DETAIL_TAG_OPTIONS, () =>
      listTransactionTags({ includeArchived: true }),
    );
  });
  const heroDataPromise = withPerfSpan(
    PERF_TRACE_OP.TRANSACTION_DETAIL_HERO_READY,
    async () => {
      const [detailResult, activity] = await Promise.all([
        detailResultPromise,
        activityPromise,
      ]);
      return { detailResult, activity };
    },
  );
  const [t, tCatalog, { detailResult, activity }] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    heroDataPromise,
  ]);

  if (detailResult.status === TransactionReadStatus.ERROR) {
    return (
      <Page
        testId="money-transaction-detail"
        topBar={
          <TransactionsReturnTopAppBar
            variant="detail"
            title={t("detailPage.readErrorTitle")}
          />
        }
      >
        <StatusAlert
          variant="danger"
          title={t("detailPage.readErrorTitle")}
          description={t("detailPage.readErrorBody")}
        />
        <TransactionsReturnLink className={TRANSACTION_SURFACE_LINK_CLASS}>
          {t("detailPage.back")}
        </TransactionsReturnLink>
      </Page>
    );
  }

  if (detailResult.status === TransactionReadStatus.NOT_FOUND) {
    return (
      <Page
        testId="money-transaction-detail"
        topBar={
          <TransactionsReturnTopAppBar
            variant="detail"
            title={t("detailPage.notFound")}
          />
        }
      >
        <TransactionsReturnLink className={TRANSACTION_SURFACE_LINK_CLASS}>
          {t("detailPage.back")}
        </TransactionsReturnLink>
      </Page>
    );
  }

  const tx = detailResult.transaction;
  const isPersonalExpense =
    tx.type === TransactionLedgerType.EXPENSE &&
    tx.accountFinancialScope === FINANCIAL_SCOPE.PERSONAL;
  let jarFactValue = tx.jarName
    ? localizeCatalogName(tCatalog, CatalogGroup.JARS, tx.jarName)
    : t("detailPage.unmapped");
  if (isPersonalExpense && tx.jarName) {
    jarFactValue = t("detailPage.planIncluded", { jar: jarFactValue });
  } else if (isPersonalExpense) {
    jarFactValue = t("detailPage.planExcluded");
  }

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
          <TransactionsReturnTopAppBar
            variant="detail"
            title={t("detailPage.readErrorTitle")}
          />
        }
      >
        <StatusAlert
          variant="danger"
          title={t("detailPage.readErrorTitle")}
          description={t("detailPage.readErrorBody")}
        />
        <TransactionsReturnLink className={TRANSACTION_SURFACE_LINK_CLASS}>
          {t("detailPage.back")}
        </TransactionsReturnLink>
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
  const productContext = productContextLabel(activity, t);

  return (
    <Page
      testId="money-transaction-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TransactionsReturnTopAppBar
          variant="detail"
          title={detailLabel}
          subtitle={transactionContextTitle(tx, tCatalog, t)}
          trailing={
            <FinancialPrivacyToggle
              hideLabel={t("financialPrivacy.hide")}
              showLabel={t("financialPrivacy.show")}
              testId="transaction-detail-financial-privacy-toggle"
              tone={FinancialPrivacyToggleTone.SURFACE}
            />
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <Card tone="soft" className="gap-(--space-3) p-(--space-5)">
        <Amount
          label={t("detailPage.amount")}
          amountLabel={signed}
          size="lg"
          kind={FinancialNumberKind.MOVEMENT}
          tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
        />
        <Text size="sm" weight="medium">
          {transactionContextTitle(tx, tCatalog, t)}
        </Text>
        <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
          {t(`status.${statusKey}`)}
        </StatusBadge>
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
          label={t("detailPage.auditId")}
          value={<span className="break-all font-mono text-xs">{tx.id}</span>}
        />
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
          label={t("detailPage.category")}
          value={
            tx.categoryName
              ? localizeCatalogName(
                  tCatalog,
                  CatalogGroup.TAGS,
                  tx.categoryName,
                )
              : t("detailPage.noTag")
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
          label={
            isPersonalExpense ? t("detailPage.familyPlan") : t("detailPage.jar")
          }
          value={jarFactValue}
        />
        {tx.note ? (
          <TransactionFactRow label={t("detailPage.note")} value={tx.note} />
        ) : null}
      </TransactionFactsCard>

      <Suspense
        fallback={
          <DetailSectionFallback>
            {t("detailPage.loadingTags")}
          </DetailSectionFallback>
        }
      >
        <TransactionTagsSection
          tx={tx}
          tagOptionsPromise={tagOptionsPromise}
          t={t}
        />
      </Suspense>

      {productContext ? (
        <Card tone="soft" className="gap-0 p-(--space-4)">
          <Text size="sm" tone="secondary">
            {productContext}
          </Text>
        </Card>
      ) : null}

      <Suspense
        fallback={
          <DetailSectionFallback>
            {t("detailPage.loadingHistory")}
          </DetailSectionFallback>
        }
      >
        <TransactionAuditHistory
          tx={tx}
          auditChainPromise={auditChainPromise}
          locale={locale}
          t={t}
          tCatalog={tCatalog}
        />
      </Suspense>

      {canCorrect || canRefund ? (
        <Text size="sm" tone="secondary">
          {t("detailPage.immutableNotice")}
        </Text>
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
