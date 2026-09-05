import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  BankIcon,
  ChartBarLineIcon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import {
  APP_PATH,
  moneyInvestmentIncomePath,
  moneyInvestmentPath,
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
  InvestmentInputRateSource,
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
import { Card } from "@/shared/patterns/card";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MotionReveal } from "@/shared/motion";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { InvestmentValuationMeta } from "../investment-valuation-meta";
import { InvestmentDetailActions } from "../investment-detail-actions";
import { InvestmentMoreActions } from "../investment-more-actions";

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ receipt?: string }>;
};

const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
const PERCENT_DECIMAL_DIGITS = 1;
const ZERO_AMOUNT = 0;

const iconFor = (asset: InvestmentUxType) =>
  asset === InvestmentAssetClass.STOCK
    ? ChartBarLineIcon
    : asset === InvestmentAssetClass.CRYPTO
      ? SmartPhoneIcon
      : asset === InvestmentAssetClass.GOLD
        ? BankIcon
        : Wallet02Icon;

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
      <Page
        topBar={
          <TopAppBar
            variant="detail"
            backHref={APP_PATH.MONEY_INVESTMENTS}
            title={t("title")}
          />
        }
      >
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
      <Page
        topBar={
          <TopAppBar
            variant="detail"
            backHref={APP_PATH.MONEY_INVESTMENTS}
            title={t("title")}
          />
        }
      >
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
  const pnlLabel = hasBasis
    ? `${holding.unrealizedResult! >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(holding.unrealizedResult!))} · ${formatPercent(pnlPercent!, locale, { maximumFractionDigits: PERCENT_DECIMAL_DIGITS })}`
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
  const providerDisplay = holding.providerCustodian || t("noProvider");
  const instrumentContext = holding.instrument
    ? `${holding.instrument.symbol} · ${holding.instrument.name}`
    : holding.symbol || tUx(ux.titleKey);
  const canUpdateManualValue =
    holding.ownership.canMutate &&
    !isClosed &&
    !holding.instrument?.autoPriceSupported;
  const valuationLabel =
    asset === InvestmentAssetClass.FUND
      ? t("updateNav")
      : asset === InvestmentAssetClass.GOLD
        ? t("updateGoldBuyBack")
        : t("updatePrice");
  const quantityDigits =
    asset === InvestmentAssetClass.CRYPTO
      ? CRYPTO_DECIMAL_DIGITS
      : STANDARD_DECIMAL_DIGITS;
  const quantityText = `${formatNumber(quantity, locale, { maximumFractionDigits: quantityDigits })} ${asset === InvestmentAssetClass.FUND ? tUx("overview.fundUnit") : t("unit")}`;
  const valueCaption = isClosed
    ? t("closedTitle")
    : asset === InvestmentAssetClass.GOLD
      ? t("currentGoldValue")
      : t("currentValue");
  const referenceLabel =
    asset === InvestmentAssetClass.FUND
      ? t("fundNavLabel")
      : t("referencePriceLabel");

  return (
    <Page
      testId="investment-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={holding.name}
          subtitle={instrumentContext}
          trailing={
            holding.ownership.canMutate && !isClosed ? (
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
            ) : undefined
          }
        />
      }
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
      <MotionReveal>
        <Card
          tone="hero"
          className="gap-0 overflow-hidden p-(--space-4)"
          data-testid="investment-detail-hero"
        >
          <div className="flex items-start justify-between gap-(--space-3)">
            <div className="flex min-w-0 items-center gap-(--space-3)">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
                <AppIcon icon={iconFor(asset)} size="md" emphasized />
              </span>
              <div className="min-w-0">
                <Text size="sm" weight="medium" className="text-hero-muted">
                  {valueCaption}
                </Text>
                <Text
                  size="xs"
                  className="mt-(--space-1) truncate text-hero-muted"
                >
                  {tUx(ux.titleKey)}
                </Text>
              </div>
            </div>
            {!isClosed ? (
              <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-(--space-2) py-(--space-1) text-xs font-medium text-hero-muted">
                {t("estimated")}
              </span>
            ) : null}
          </div>
          {!isClosed ? (
            <p className="mt-(--space-4) font-semibold tabular-nums tracking-tight text-3xl text-hero-fg">
              {holding.currentValue == null ? (
                tUx("valuation.noCurrentValue")
              ) : (
                <FinancialValue>{money(holding.currentValue)}</FinancialValue>
              )}
            </p>
          ) : (
            <Text size="sm" className="mt-(--space-4) text-hero-muted">
              {t("closedValueUnavailable")}
            </Text>
          )}
          <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
            <FinancialOwnershipBadge
              financialScope={holding.ownership.financialScope}
              isOwnedByMe={holding.ownership.isOwnedByMe}
              ownerStatus={holding.ownership.ownerStatus}
              onHero
              showExplanation
            />
            {!isClosed ? (
              <InvestmentValuationMeta
                holding={holding}
                variant="inline"
                onHero
              />
            ) : null}
          </div>
        </Card>
      </MotionReveal>
      {holding.ownership.canMutate ? (
        <InvestmentDetailActions
          holdingId={holding.id}
          assetClass={asset}
          showSell={!isClosed}
        />
      ) : null}
      {isClosed ? (
        <StatusAlert
          variant="info"
          title={t("closedTitle")}
          description={t("closedDescription")}
        />
      ) : null}
      <Section title={t("performanceSection")}>
        <div className="grid grid-cols-2 gap-x-(--space-4) rounded-(--radius-card) border border-border-subtle/60 bg-surface-muted/45 px-(--space-3) sm:gap-x-(--space-5)">
          <Amount
            className="min-w-0 border-b border-border-subtle/60 py-(--space-3)"
            label={t("quantityLabel")}
            amountLabel={quantityText}
          />
          {!isClosed ? (
            <div className="min-w-0 border-b border-border-subtle/60 py-(--space-3)">
              <Text size="sm" tone="secondary">
                {referenceLabel}
              </Text>
              <InvestmentValuationMeta holding={holding} detail />
            </div>
          ) : (
            <div className="min-w-0 border-b border-border-subtle/60 py-(--space-3)" />
          )}
          <Amount
            className="min-w-0 border-b border-border-subtle/60 py-(--space-3)"
            label={t("remainingBasis")}
            amountLabel={money(holding.remainingTotalCostBasis)}
          />
          <Amount
            className="min-w-0 border-b border-border-subtle/60 py-(--space-3)"
            label={t("unrealizedResult")}
            amountLabel={pnlLabel ?? t("unavailable")}
          />
          <Amount
            className="min-w-0 py-(--space-3)"
            label={t("realizedResult")}
            amountLabel={realized == null ? t("unavailable") : money(realized)}
          />
          <Amount
            className="min-w-0 py-(--space-3)"
            label={t("receivedIncome")}
            amountLabel={
              receivedIncome == null ? t("unavailable") : money(receivedIncome)
            }
          />
        </div>
      </Section>
      <Section title={t("instrumentSection")} variant="surface">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text size="xs" tone="secondary">
              {t("linkedInstrument")}
            </Text>
            <Text weight="semibold" className="mt-1 text-balance">
              {instrumentContext}
            </Text>
          </div>
          <Text size="xs" tone="muted" className="shrink-0 text-right">
            {providerDisplay}
          </Text>
        </div>
        {holding.instrument?.exchange ? (
          <div className="flex items-center justify-between gap-(--space-3) border-t border-border-subtle/60 pt-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("exchange")}
            </Text>
            <Text size="sm" weight="medium" className="text-right">
              {holding.instrument.exchange}
            </Text>
          </div>
        ) : null}
        <InvestmentValuationMeta holding={holding} detail />
        {asset === InvestmentAssetClass.GOLD ? (
          <Text
            size="sm"
            tone="secondary"
            className="border-t border-border-subtle/60 pt-(--space-3)"
          >
            {t("goldValuationNote")}
          </Text>
        ) : null}
      </Section>
      <Section title={t("activitySection")}>
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
          <Card tone="elevated" className="p-(--space-4)">
            <ul className="flex flex-col divide-y divide-border-subtle/65">
              {activities.map((activity) => {
                const activityInputCurrency =
                  activity.inputCurrency ?? INVESTMENT_REPORTING_CURRENCY;
                const slippage =
                  activity.executedValueVnd == null
                    ? null
                    : deriveSlippage({
                        quotedValue: activity.quotedValueVnd,
                        executedValue: activity.executedValueVnd,
                      });
                const formatInputValue = (value: number) =>
                  `${formatNumber(value, locale, {
                    maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                  })} ${activityInputCurrency}`;
                const hasInputCostAndCurrent =
                  activity.inputCostBasis != null &&
                  activity.inputCurrentValuation != null;
                const inputCostAndCurrentDetails =
                  activity.inputCostBasis != null &&
                  activity.inputCurrentValuation != null
                    ? `${t("inputCurrency", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputCostBasis)} · ${t("currentValue")}: ${formatInputValue(activity.inputCurrentValuation)}`
                    : null;
                const inputRateSourceLabel =
                  activity.inputRateSource === InvestmentInputRateSource.MANUAL
                    ? tUx("valuation.manual")
                    : activity.inputRateSource ===
                        InvestmentInputRateSource.AUTOMATIC
                      ? tUx("valuation.automatic")
                      : null;
                const inputDetails = [
                  inputCostAndCurrentDetails,
                  !hasInputCostAndCurrent && activity.inputTotalValue != null
                    ? `${t("inputTotalValue", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputTotalValue)}`
                    : null,
                  !hasInputCostAndCurrent && activity.inputAmount != null
                    ? `${t("inputCurrency", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputAmount)}`
                    : null,
                  !hasInputCostAndCurrent && activity.inputExecutedValue != null
                    ? `${t("inputCurrency", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputExecutedValue)}`
                    : null,
                  !hasInputCostAndCurrent &&
                  activity.inputCurrentValuation != null
                    ? `${t("currentValue")}: ${formatInputValue(activity.inputCurrentValuation)}`
                    : null,
                  !hasInputCostAndCurrent && activity.inputCostBasis != null
                    ? `${t("basis")}: ${formatInputValue(activity.inputCostBasis)}`
                    : null,
                  activity.inputUnitPrice != null
                    ? `${t("inputUnitPrice", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputUnitPrice)}`
                    : null,
                  activity.inputQuotedValue != null
                    ? `${t("inputCurrency", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputQuotedValue)}`
                    : null,
                  activity.inputRateToVnd != null
                    ? t("inputRate", {
                        rate: formatNumber(activity.inputRateToVnd, locale, {
                          maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                        }),
                        currency: activityInputCurrency,
                      })
                    : null,
                  inputRateSourceLabel
                    ? t("inputRateSource", { source: inputRateSourceLabel })
                    : null,
                  activity.inputRateDate
                    ? t("inputRateDate", {
                        date: formatDate(
                          new Date(activity.inputRateDate),
                          locale,
                        ),
                      })
                    : null,
                  activity.inputFeeValue != null
                    ? `${t("inputFeeValue", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputFeeValue)}`
                    : null,
                  activity.inputFeeAmount != null
                    ? `${t("inputFeeAmount", {
                        currency: activityInputCurrency,
                      })}: ${formatInputValue(activity.inputFeeAmount)}`
                    : null,
                ].filter((part): part is string => part != null);
                const hasInputSnapshot =
                  activityInputCurrency !== INVESTMENT_REPORTING_CURRENCY &&
                  inputDetails.length > 0;
                return (
                  <li
                    key={activity.id}
                    className="flex items-start justify-between gap-(--space-3) py-(--space-3) first:pt-0 last:pb-0"
                    data-testid="investment-activity-row"
                  >
                    <div className="min-w-0">
                      <Text size="sm" weight="medium">
                        {friendlyActivity(activity.type, asset, t)}
                      </Text>
                      <Text size="xs" tone="secondary">
                        {formatDate(
                          new Date(`${activity.effectiveDate}T00:00:00`),
                          locale,
                        )}
                        {activity.sourceQuantity
                          ? ` · ${formatNumber(
                              Number(activity.sourceQuantity),
                              locale,
                              {
                                maximumFractionDigits: quantityDigits,
                              },
                            )} ${t("unit")}`
                          : ""}
                      </Text>
                      {hasInputSnapshot ? (
                        <Text size="xs" tone="secondary">
                          {inputDetails.join(" · ")}
                        </Text>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-(--space-1) text-right">
                      {activity.executedValueVnd != null ? (
                        <Text size="sm" weight="semibold" tabular>
                          <FinancialValue>
                            {money(activity.executedValueVnd)}
                          </FinancialValue>
                        </Text>
                      ) : null}
                      {activity.realizedResultVnd != null ? (
                        <Text
                          size="xs"
                          tabular
                          tone={
                            activity.realizedResultVnd >= ZERO_AMOUNT
                              ? "success"
                              : "danger"
                          }
                        >
                          <FinancialValue>
                            {`${t("realizedPnlLabel")} ${activity.realizedResultVnd >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(activity.realizedResultVnd))}`}
                          </FinancialValue>
                        </Text>
                      ) : null}
                      {slippage != null ? (
                        <Text size="xs" tone="secondary">
                          <FinancialValue>
                            {t("slippageLabel", {
                              amount: money(Math.abs(slippage)),
                            })}
                          </FinancialValue>
                        </Text>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <Text size="sm" tone="secondary">
            {t("activityEmpty")}
          </Text>
        )}
      </Section>
    </Page>
  );
}
