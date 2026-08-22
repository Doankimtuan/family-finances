import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyInvestmentBuyPath,
  moneyInvestmentIncomePath,
  moneyInvestmentPath,
  moneyInvestmentSellPath,
  moneyInvestmentValuationPath,
} from "@/modules/tenancy/application/app-path";
import {
  getInvestmentHoldingResult,
  listInvestmentActivities,
  deriveSlippage,
  InvestmentActivityType,
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentLifecycleStatus,
  InvestmentHoldingReadStatus,
  MarketValuationQuality,
  INVESTMENT_REPORTING_CURRENCY,
} from "@/modules/investments/application";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/shared/i18n/formatters";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { InvestmentValuationMeta } from "../investment-valuation-meta";
import { InvestmentMoreActions } from "../investment-more-actions";

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ receipt?: string }>;
};

const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
const PERCENT_DECIMAL_DIGITS = 1;
const ZERO_AMOUNT = 0;

const friendlyActivity = (
  type: string,
  asset: InvestmentUxType,
  t: (
    key:
      | "activities.opening_position"
      | "activities.buy_fund"
      | "activities.buy"
      | "activities.sell_fund"
      | "activities.sell"
      | "activities.investment_income_fund"
      | "activities.investment_income"
      | "activities.valuation"
      | "activities.adjustment",
  ) => string,
) => {
  if (type === InvestmentActivityType.OPENING_POSITION)
    return t("activities.opening_position");
  if (type === InvestmentActivityType.BUY)
    return asset === InvestmentAssetClass.FUND
      ? t("activities.buy_fund")
      : t("activities.buy");
  if (type === InvestmentActivityType.SELL)
    return asset === InvestmentAssetClass.FUND
      ? t("activities.sell_fund")
      : t("activities.sell");
  if (type === InvestmentActivityType.INVESTMENT_INCOME)
    return asset === InvestmentAssetClass.FUND
      ? t("activities.investment_income_fund")
      : t("activities.investment_income");
  if (type === InvestmentActivityType.VALUATION)
    return t("activities.valuation");
  return t("activities.adjustment");
};

export default async function InvestmentDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ locale }, { receipt }, t, tUx, holdingResult, activities] =
    await Promise.all([
      params,
      searchParams,
      getTranslations("money.investments.detail"),
      getTranslations("money.investments"),
      params.then(({ id: value }) => getInvestmentHoldingResult(value)),
      params.then(({ id: value }) => listInvestmentActivities(value)),
    ]);
  if (holdingResult.status === InvestmentHoldingReadStatus.ERROR)
    return (
      <Page topBar={<TopAppBar title={t("title")} />}>
        <StatusAlert variant="danger" title={t("readError")} />
        <Link
          href={moneyInvestmentPath((await params).id)}
          className="text-sm font-medium text-accent"
        >
          {t("retry")}
        </Link>
      </Page>
    );
  if (holdingResult.status === InvestmentHoldingReadStatus.NOT_FOUND)
    return (
      <Page topBar={<TopAppBar title={t("title")} />}>
        <EmptyState title={t("notFound")} />
        <Link
          href={APP_PATH.MONEY_INVESTMENTS}
          className="text-sm font-medium text-accent"
        >
          {t("back")}
        </Link>
      </Page>
    );
  const holding = holdingResult.holding;
  const asset = holding.assetClass as InvestmentUxType;
  const ux = investmentUxConfig(asset);
  const money = (value: number | null) =>
    value == null
      ? t("unavailable")
      : formatCurrency(value, INVESTMENT_REPORTING_CURRENCY, locale, {
          maximumFractionDigits: 0,
        });
  const quantity = Number(holding.quantity);
  const isClosed =
    holding.lifecycleStatus === InvestmentLifecycleStatus.EXITED ||
    quantity <= ZERO_AMOUNT;
  const hasBasis =
    !isClosed &&
    holding.remainingTotalCostBasis != null &&
    holding.unrealizedResult != null &&
    holding.valuation?.quality !== MarketValuationQuality.UNKNOWN;
  const pnlPercent =
    hasBasis && holding.remainingTotalCostBasis! > ZERO_AMOUNT
      ? holding.unrealizedResult! / holding.remainingTotalCostBasis!
      : null;
  const realized =
    activities?.reduce(
      (sum, activity) => sum + (activity.realizedResultVnd ?? 0),
      0,
    ) ?? null;
  const receivedIncome =
    activities?.reduce(
      (sum, activity) =>
        sum + (activity.incomeKind ? (activity.executedValueVnd ?? 0) : 0),
      0,
    ) ?? null;
  const valuationLabel =
    asset === InvestmentAssetClass.FUND
      ? t("updateNav")
      : asset === InvestmentAssetClass.GOLD
        ? t("updateGoldBuyBack")
        : t("updatePrice");
  const providerDisplay = holding.providerCustodian || t("noProvider");
  const instrumentContext = holding.instrument
    ? `${holding.instrument.symbol} · ${holding.instrument.name}`
    : holding.symbol || tUx(ux.titleKey);
  const canUpdateManualValue =
    holding.ownership.canMutate &&
    !isClosed &&
    !holding.instrument?.autoPriceSupported;

  return (
    <Page
      testId="investment-detail"
      topBar={<TopAppBar title={holding.name} subtitle={instrumentContext} />}
    >
      <MoneyOfflineBanner />
      {receipt ? (
        <StatusAlert
          variant="success"
          title={t("receiptSaved")}
          description={t("correlation", { id: receipt })}
        />
      ) : null}
      {holding.historyStatus === InvestmentHistoryStatus.COST_BASIS_UNKNOWN ? (
        <StatusAlert
          variant="warning"
          title={t("missingBasisAlertTitle")}
          description={t("missingBasisAlertDescription")}
        />
      ) : null}
      <section
        className="rounded-(--radius-card) bg-surface-elevated p-(--space-5)"
        data-testid="investment-detail-hero"
      >
        <FinancialOwnershipBadge
          financialScope={holding.ownership.financialScope}
          isOwnedByMe={holding.ownership.isOwnedByMe}
          ownerStatus={holding.ownership.ownerStatus}
          showExplanation
        />
        <Text size="sm" tone="secondary">
          {tUx(ux.titleKey)} · {providerDisplay}
        </Text>
        {!isClosed ? (
          <>
            <Text size="sm" tone="secondary" className="mt-(--space-4)">
              {asset === InvestmentAssetClass.GOLD
                ? t("currentGoldValue")
                : t("currentValue")}
            </Text>
            <Text
              as="div"
              size="lg"
              weight="semibold"
              tabular
              className="mt-1 text-3xl"
            >
              {holding.currentValue == null ? (
                tUx("valuation.noCurrentValue")
              ) : (
                <FinancialValue>{money(holding.currentValue)}</FinancialValue>
              )}
            </Text>
          </>
        ) : (
          <Text size="sm" tone="secondary" className="mt-(--space-4)">
            {t("closedValueUnavailable")}
          </Text>
        )}
        {!isClosed && hasBasis ? (
          <div className="mt-(--space-2) flex items-center gap-2">
            <Text
              size="sm"
              tone={
                holding.unrealizedResult! >= ZERO_AMOUNT ? "success" : "danger"
              }
              weight="semibold"
            >
              <FinancialValue>
                {`${holding.unrealizedResult! >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(holding.unrealizedResult!))} · ${formatPercent(pnlPercent!, locale, { maximumFractionDigits: PERCENT_DECIMAL_DIGITS })}`}
              </FinancialValue>
            </Text>
          </div>
        ) : !isClosed ? (
          <Text size="sm" tone="secondary" className="mt-2">
            {t("missingBasisAlertTitle")}
          </Text>
        ) : null}
      </section>
      {holding.ownership.canMutate ? (
        <div className="flex items-stretch gap-(--space-2)">
          <Link
            href={moneyInvestmentBuyPath(holding.id)}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg"
          >
            {tUx(ux.purchaseActionKey)}
          </Link>
          {!isClosed ? (
            <>
              <Link
                href={moneyInvestmentSellPath(holding.id)}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary"
              >
                {tUx(ux.disposalActionKey)}
              </Link>
              <InvestmentMoreActions
                label={t("moreActions")}
                incomeHref={moneyInvestmentIncomePath(holding.id)}
                incomeLabel={tUx(ux.incomeLabelKey)}
                valuationHref={
                  canUpdateManualValue
                    ? moneyInvestmentValuationPath(holding.id)
                    : undefined
                }
                valuationLabel={
                  canUpdateManualValue ? valuationLabel : undefined
                }
              />
            </>
          ) : null}
        </div>
      ) : null}
      {isClosed ? (
        <StatusAlert
          variant="info"
          title={t("closedTitle")}
          description={t("closedDescription")}
        />
      ) : null}
      <Section title={t("performanceSection")}>
        <div className="grid gap-(--space-3) sm:grid-cols-2">
          <Amount
            label={t("quantityLabel")}
            amountLabel={`${formatNumber(quantity, locale, { maximumFractionDigits: asset === InvestmentAssetClass.CRYPTO ? CRYPTO_DECIMAL_DIGITS : STANDARD_DECIMAL_DIGITS })} ${asset === InvestmentAssetClass.FUND ? tUx("overview.fundUnit") : t("unit")}`}
          />
          {!isClosed ? (
            <div className="flex flex-col gap-(--space-1)">
              <Text size="sm" tone="secondary">
                {asset === InvestmentAssetClass.FUND
                  ? t("fundNavLabel")
                  : t("referencePriceLabel")}
              </Text>
              <InvestmentValuationMeta holding={holding} detail />
            </div>
          ) : null}
          <Amount
            label={t("remainingBasis")}
            amountLabel={money(holding.remainingTotalCostBasis)}
          />
          <Amount
            label={t("unrealizedResult")}
            amountLabel={
              hasBasis
                ? `${holding.unrealizedResult! >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(holding.unrealizedResult!))} · ${formatPercent(pnlPercent!, locale, { maximumFractionDigits: PERCENT_DECIMAL_DIGITS })}`
                : t("unavailable")
            }
          />
          <Amount
            label={t("realizedResult")}
            amountLabel={realized == null ? t("unavailable") : money(realized)}
          />
          <Amount
            label={t("receivedIncome")}
            amountLabel={
              receivedIncome == null ? t("unavailable") : money(receivedIncome)
            }
          />
        </div>
      </Section>
      <Section title={t("instrumentSection")}>
        <Text weight="medium">{instrumentContext}</Text>
        {holding.instrument?.exchange ? (
          <Text size="sm" tone="secondary">
            {t("exchange")}: {holding.instrument.exchange}
          </Text>
        ) : null}
        <InvestmentValuationMeta holding={holding} detail />
        {asset === InvestmentAssetClass.GOLD ? (
          <Text size="sm" tone="secondary">
            {t("goldValuationNote")}
          </Text>
        ) : null}
      </Section>
      <Section title={t("activitySection")}>
        <div className="flex flex-col gap-(--space-3)">
          {activities === null ? (
            <StatusAlert
              variant="danger"
              title={t("activityReadError")}
              action={
                <Link
                  href={moneyInvestmentPath(holding.id)}
                  className="text-sm font-medium text-accent"
                >
                  {t("retry")}
                </Link>
              }
            />
          ) : activities.length ? (
            activities.map((activity) => {
              const slippage =
                activity.executedValueVnd == null
                  ? null
                  : deriveSlippage({
                      quotedValue: activity.quotedValueVnd,
                      executedValue: activity.executedValueVnd,
                    });
              return (
                <article
                  key={activity.id}
                  className="rounded-(--radius-control) border border-border-subtle p-(--space-3)"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Text weight="medium">
                      {friendlyActivity(activity.type, asset, t)}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {formatDate(
                        new Date(`${activity.effectiveDate}T00:00:00`),
                        locale,
                      )}
                    </Text>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                    {activity.sourceQuantity ? (
                      <span>
                        {formatNumber(Number(activity.sourceQuantity), locale, {
                          maximumFractionDigits:
                            asset === InvestmentAssetClass.CRYPTO
                              ? CRYPTO_DECIMAL_DIGITS
                              : STANDARD_DECIMAL_DIGITS,
                        })}{" "}
                        {t("unit")}
                      </span>
                    ) : null}
                    {activity.executedValueVnd != null ? (
                      <span>
                        <FinancialValue>
                          {money(activity.executedValueVnd)}
                        </FinancialValue>
                      </span>
                    ) : null}
                    {activity.realizedResultVnd != null ? (
                      <span
                        className={
                          activity.realizedResultVnd >= ZERO_AMOUNT
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        <FinancialValue>
                          {`${t("realizedPnlLabel")} ${activity.realizedResultVnd >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(activity.realizedResultVnd))}`}
                        </FinancialValue>
                      </span>
                    ) : null}
                    {slippage != null ? (
                      <span>
                        <FinancialValue>
                          {t("slippageLabel", {
                            amount: money(Math.abs(slippage)),
                          })}
                        </FinancialValue>
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <Text size="sm" tone="secondary">
              {t("activityEmpty")}
            </Text>
          )}
        </div>
      </Section>
      <Link
        href={APP_PATH.MONEY_INVESTMENTS}
        className="text-sm font-medium text-accent"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
