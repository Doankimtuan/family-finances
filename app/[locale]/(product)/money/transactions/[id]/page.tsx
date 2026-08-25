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
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount, AmountTone } from "@/shared/patterns/amount";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { TransactionTagEditor } from "../transaction-tag-editor";

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
      ? localizeCatalogName(tCatalog, "tags", tx.categoryName)
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
    ? localizeCatalogName(tCatalog, "accounts", activity.sourceAccount.name)
    : t("transferDetail.emptyValue");
  const destinationName = activity.destinationAccount?.name
    ? localizeCatalogName(
        tCatalog,
        "accounts",
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
    <div
      className="flex min-h-full flex-col"
      data-testid="money-transfer-detail"
    >
      <TopAppBar
        title={t("transferDetail.title")}
        subtitle={t("transferDetail.subtitle")}
        backHref={APP_PATH.MONEY_TRANSACTIONS}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Amount
          label={t("transferDetail.event")}
          amountLabel={amountLabel}
          size="lg"
          tone={AmountTone.NEUTRAL}
        />

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("transferDetail.routeTitle")} />
          <dl className="divide-y divide-border-subtle border-y border-border-subtle">
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("transferDetail.from")}
              </Text>
              <Text size="sm" className="text-right font-medium">
                {sourceName}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("transferDetail.to")}
              </Text>
              <Text size="sm" className="text-right font-medium">
                {destinationName}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("transferDetail.date")}
              </Text>
              <Text size="sm" className="text-right font-medium tabular-nums">
                {formatEffectiveDate(activity.effectiveDate, locale)}
              </Text>
            </div>
            {activity.note ? (
              <div className="flex justify-between gap-(--space-3) py-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("transferDetail.note")}
                </Text>
                <Text size="sm" className="text-right font-medium">
                  {activity.note}
                </Text>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="border-l-2 border-transfer pl-(--space-3)">
          <Text size="sm" tone="secondary">
            {t("transferDetail.neutrality")}
          </Text>
        </div>
      </div>
    </div>
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
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-detail"
      >
        <TopAppBar title={t("detailPage.readErrorTitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="danger"
            title={t("detailPage.readErrorTitle")}
            description={t("detailPage.readErrorBody")}
          />
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (transactionResult.status === TransactionReadStatus.NOT_FOUND) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-detail"
      >
        <TopAppBar title={t("detailPage.notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
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
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-detail"
      >
        <TopAppBar title={t("detailPage.readErrorTitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="danger"
            title={t("detailPage.readErrorTitle")}
            description={t("detailPage.readErrorBody")}
          />
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
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
    <div
      className="flex min-h-full flex-col bg-canvas"
      data-testid="money-transaction-detail"
    >
      <TopAppBar
        title={detailLabel}
        subtitle={t("detailPage.subtitle")}
        backHref={APP_PATH.MONEY_TRANSACTIONS}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <div className="rounded-[var(--radius-card)] border border-border-subtle/80 bg-surface/70 px-(--space-4) py-(--space-5) shadow-(--elevation-1)">
          <Amount
            label={t("detailPage.amount")}
            amountLabel={signed}
            size="lg"
            tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
          />
        </div>

        {activity.breakdown.kind ===
        TransactionActivityBreakdownKind.LOAN_PAYMENT ? (
          <section
            className="flex flex-col gap-(--space-3)"
            data-testid="loan-payment-breakdown"
          >
            <SectionHeader title={t("detailPage.loanBreakdown.title")} />
            <dl className="divide-y divide-border-subtle border-y border-border-subtle bg-surface/35">
              <div className="flex justify-between gap-(--space-3) py-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("detailPage.loanBreakdown.principal")}
                </Text>
                <Text size="sm" className="font-medium tabular-nums">
                  <FinancialValue>
                    {formatCurrency(
                      activity.breakdown.principalAmount,
                      tx.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </Text>
              </div>
              <div className="flex justify-between gap-(--space-3) py-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("detailPage.loanBreakdown.interest")}
                </Text>
                <Text size="sm" className="font-medium tabular-nums">
                  <FinancialValue>
                    {formatCurrency(
                      activity.breakdown.interestAmount,
                      tx.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </Text>
              </div>
              <div className="flex justify-between gap-(--space-3) py-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("detailPage.loanBreakdown.total")}
                </Text>
                <Text size="sm" className="font-semibold tabular-nums">
                  <FinancialValue>
                    {formatCurrency(
                      activity.breakdown.totalPaid,
                      tx.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </Text>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("detailPage.context")} />
          <dl className="divide-y divide-border-subtle border-y border-border-subtle bg-surface/35">
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.account")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {localizeCatalogName(tCatalog, "accounts", tx.accountName) ||
                  t("detailPage.emptyValue")}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.date")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {formatEffectiveDate(tx.transactionDate, locale)}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("detailPage.status")}
              </Text>
              <Text size="sm" className="font-medium text-text-primary">
                {t(`status.${statusKey}`)}
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3) py-(--space-3)">
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
          <SectionHeader title={t("detailPage.category")} />
          {tx.categoryName ? (
            <span className="inline-flex min-h-11 items-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary">
              {localizeCatalogName(tCatalog, "tags", tx.categoryName)}
            </span>
          ) : (
            <Text size="sm" tone="secondary">
              {t("detailPage.noTag")}
            </Text>
          )}
        </section>

        <TransactionTagEditor
          transactionId={tx.id}
          initialTags={tx.tags}
          availableTags={availableTags ?? []}
        />

        {productContext ? (
          <section className="border-t border-border-subtle pt-(--space-3)">
            <Text size="sm" tone="secondary">
              {productContext}
            </Text>
          </section>
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
            <ul className="divide-y divide-border-subtle border-y border-border-subtle">
              {tx.status === TransactionStatus.PARTIALLY_REFUNDED ? (
                <li className="py-(--space-3) text-sm font-medium text-text-primary">
                  {t("detailPage.refundPartial")}
                </li>
              ) : null}
              {tx.status === TransactionStatus.FULLY_REFUNDED ? (
                <li className="py-(--space-3) text-sm font-medium text-text-primary">
                  {t("detailPage.refundFull")}
                </li>
              ) : null}
              {tx.isReversal ? (
                <li className="py-(--space-3) text-sm text-text-primary">
                  <Link
                    href={moneyTransactionPath(chain.original.id)}
                    className="font-medium underline underline-offset-2"
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
                  className="py-(--space-3) text-sm text-text-secondary"
                >
                  <Link
                    href={moneyTransactionPath(leg.id)}
                    className="underline underline-offset-2"
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
                  <li className="py-(--space-3) text-sm font-medium text-text-primary">
                    {t("detailPage.correctionStory")}
                  </li>
                  <li className="py-(--space-3) text-sm text-text-secondary">
                    <Link
                      href={moneyTransactionPath(chain.original.id)}
                      className="underline underline-offset-2"
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
                      className="py-(--space-3) text-sm text-text-primary"
                    >
                      <Link
                        href={moneyTransactionPath(leg.id)}
                        className="underline underline-offset-2"
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
          </section>
        ) : null}

        {canCorrect ? (
          <Link
            href={moneyTransactionCorrectPath(tx.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
            data-testid="transaction-correct"
          >
            {t("detailPage.correct")}
          </Link>
        ) : null}
        {canRefund ? (
          <Link
            href={moneyTransactionRefundPath(tx.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
            data-testid="transaction-refund"
          >
            {t("detailPage.refundAction")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
