import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MotionReveal } from "@/shared/motion";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import {
  InvestmentValuationMeta,
  InvestmentValuationMetaVariant,
} from "../investment-valuation-meta";
import { InvestmentDetailActions } from "../investment-detail-actions";
import { InvestmentMoreActions } from "../investment-more-actions";
import { investmentAssetIcon } from "../investment-asset-icon";
import { InvestmentActivityRow } from "../investment-activity-row";
import { InvestmentDetailHero } from "../investment-detail-hero";
import {
  InvestmentFactNote,
  InvestmentFactRow,
  InvestmentFactsCard,
} from "../investment-facts";
import { InvestmentPrivacyToggle } from "../investment-privacy-toggle";
import { InvestmentSectionTitle } from "../investment-section-title";

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ receipt?: string }>;
};

const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
const PERCENT_DECIMAL_DIGITS = 1;
const ZERO_AMOUNT = 0;

const RECOVERY_ACTION_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) bg-accent px-(--space-4) text-sm font-semibold text-accent-fg transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-px active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100";

function resolveUnrealizedTone(hasBasis: boolean, result: number | null) {
  if (!hasBasis || result == null) return undefined;
  return result >= ZERO_AMOUNT ? "success" : "danger";
}

function resolveValuationActionLabel(
  asset: InvestmentUxType,
  t: (key: "updateNav" | "updateGoldBuyBack" | "updatePrice") => string,
) {
  if (asset === InvestmentAssetClass.FUND) return t("updateNav");
  if (asset === InvestmentAssetClass.GOLD) return t("updateGoldBuyBack");
  return t("updatePrice");
}

function resolveValueCaption(
  isClosed: boolean,
  asset: InvestmentUxType,
  t: (key: "closedTitle" | "currentGoldValue" | "currentValue") => string,
) {
  if (isClosed) return t("closedTitle");
  if (asset === InvestmentAssetClass.GOLD) return t("currentGoldValue");
  return t("currentValue");
}

function resolveHeroAmountLabel(
  isClosed: boolean,
  currentValue: number | null,
  noCurrentValue: string,
  formattedValue: string,
) {
  if (isClosed) return undefined;
  if (currentValue == null) return noCurrentValue;
  return formattedValue;
}

function resolveRealizedTone(result: number | null) {
  if (result == null) return undefined;
  return result >= ZERO_AMOUNT ? "success" : "danger";
}

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
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="detail"
            backHref={APP_PATH.MONEY_INVESTMENTS}
            title={t("title")}
          />
        }
      >
        <ErrorState
          title={t("readError")}
          className="flex-none py-(--space-4)"
          action={
            <Link
              href={moneyInvestmentPath((await params).id)}
              className={RECOVERY_ACTION_CLASS}
            >
              {t("retry")}
            </Link>
          }
        />
      </Page>
    );
  if (holdingResult.status === InvestmentHoldingReadStatus.NOT_FOUND)
    return (
      <Page
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="detail"
            backHref={APP_PATH.MONEY_INVESTMENTS}
            title={t("title")}
          />
        }
      >
        <EmptyState
          title={t("notFound")}
          description={t("notFoundDescription")}
          className="flex-none py-(--space-4)"
          icon={
            <AppIcon
              icon={FINANCE_ICONS.investment}
              size={AppIconSize.DISPLAY}
            />
          }
          action={
            <Link
              href={APP_PATH.MONEY_INVESTMENTS}
              className={RECOVERY_ACTION_CLASS}
            >
              {t("back")}
            </Link>
          }
        />
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
  const unrealizedTone = resolveUnrealizedTone(
    hasBasis,
    holding.unrealizedResult,
  );
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
  const valuationLabel = resolveValuationActionLabel(asset, t);
  const quantityDigits =
    asset === InvestmentAssetClass.CRYPTO
      ? CRYPTO_DECIMAL_DIGITS
      : STANDARD_DECIMAL_DIGITS;
  const quantityText = `${formatNumber(quantity, locale, { maximumFractionDigits: quantityDigits })} ${asset === InvestmentAssetClass.FUND ? tUx("overview.fundUnit") : t("unit")}`;
  const valueCaption = resolveValueCaption(isClosed, asset, t);
  const referenceLabel =
    asset === InvestmentAssetClass.FUND
      ? t("fundNavLabel")
      : t("referencePriceLabel");
  const quoteCurrency = holding.valuation?.priceCurrency;

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
        <InvestmentDetailHero
          icon={investmentAssetIcon(asset)}
          caption={valueCaption}
          amountLabel={resolveHeroAmountLabel(
            isClosed,
            holding.currentValue,
            tUx("valuation.noCurrentValue"),
            money(holding.currentValue),
          )}
          closedMessage={isClosed ? t("closedValueUnavailable") : undefined}
          pnl={
            pnlLabel ? (
              <Text size="sm" weight="semibold" tabular tone={unrealizedTone}>
                <FinancialValue>{pnlLabel}</FinancialValue>
              </Text>
            ) : null
          }
          trailing={
            <InvestmentPrivacyToggle testId="investment-detail-financial-privacy-toggle" />
          }
          context={
            <>
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
                  variant={InvestmentValuationMetaVariant.INLINE}
                  onHero
                />
              ) : null}
            </>
          }
        />
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
      <InvestmentFactsCard
        title={t("performanceSection")}
        testId="investment-detail-performance"
      >
        <InvestmentFactRow
          label={t("quantityLabel")}
          value={
            <Text size="sm" weight="medium" tabular>
              {quantityText}
            </Text>
          }
        />
        {!isClosed ? (
          <InvestmentFactRow
            label={referenceLabel}
            value={<InvestmentValuationMeta holding={holding} detail />}
          />
        ) : null}
        <InvestmentFactRow
          label={t("remainingBasis")}
          value={
            <Text size="sm" weight="medium" tabular>
              <FinancialValue>
                {money(holding.remainingTotalCostBasis)}
              </FinancialValue>
            </Text>
          }
        />
        <InvestmentFactRow
          label={t("unrealizedResult")}
          value={
            <Text size="sm" weight="medium" tabular tone={unrealizedTone}>
              <FinancialValue>{pnlLabel ?? t("unavailable")}</FinancialValue>
            </Text>
          }
        />
        <InvestmentFactRow
          label={t("realizedResult")}
          value={
            <Text size="sm" weight="medium" tabular>
              <FinancialValue>
                {realized == null ? t("unavailable") : money(realized)}
              </FinancialValue>
            </Text>
          }
        />
        <InvestmentFactRow
          label={t("receivedIncome")}
          value={
            <Text size="sm" weight="medium" tabular>
              <FinancialValue>
                {receivedIncome == null
                  ? t("unavailable")
                  : money(receivedIncome)}
              </FinancialValue>
            </Text>
          }
        />
      </InvestmentFactsCard>
      <InvestmentFactsCard
        title={t("instrumentSection")}
        testId="investment-detail-instrument"
      >
        <InvestmentFactRow
          label={t("linkedInstrument")}
          value={
            <div className="flex flex-col items-end gap-(--space-1)">
              <Text size="sm" weight="medium" className="text-balance">
                {instrumentContext}
              </Text>
              <Text size="xs" tone="muted">
                {providerDisplay}
              </Text>
            </div>
          }
        />
        {holding.instrument?.exchange ? (
          <InvestmentFactRow
            label={t("exchange")}
            value={
              <Text size="sm" weight="medium">
                {holding.instrument.exchange}
              </Text>
            }
          />
        ) : null}
        {quoteCurrency ? (
          <InvestmentFactRow
            label={t("quoteCurrency")}
            value={
              <Text size="sm" weight="medium">
                {quoteCurrency}
              </Text>
            }
          />
        ) : null}
        {asset === InvestmentAssetClass.GOLD ? (
          <InvestmentFactNote>{t("goldValuationNote")}</InvestmentFactNote>
        ) : null}
      </InvestmentFactsCard>
      <section
        className="flex flex-col gap-(--space-3)"
        data-testid="investment-detail-activity"
      >
        <div>
          <InvestmentSectionTitle>
            {t("activitySection")}
          </InvestmentSectionTitle>
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) text-pretty"
          >
            {t("activityHint")}
          </Text>
        </div>
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
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-divider">
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
                const quantityPart = activity.sourceQuantity
                  ? ` · ${formatNumber(
                      Number(activity.sourceQuantity),
                      locale,
                      {
                        maximumFractionDigits: quantityDigits,
                      },
                    )} ${t("unit")}`
                  : "";
                return (
                  <InvestmentActivityRow
                    key={activity.id}
                    title={friendlyActivity(activity.type, asset, t)}
                    subtitle={`${formatDate(
                      new Date(`${activity.effectiveDate}T00:00:00`),
                      locale,
                    )}${quantityPart}`}
                    amountLabel={
                      activity.executedValueVnd == null
                        ? undefined
                        : money(activity.executedValueVnd)
                    }
                    realizedLabel={
                      activity.realizedResultVnd == null
                        ? undefined
                        : `${t("realizedPnlLabel")} ${activity.realizedResultVnd >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(activity.realizedResultVnd))}`
                    }
                    realizedTone={resolveRealizedTone(
                      activity.realizedResultVnd,
                    )}
                    slippageLabel={
                      slippage == null
                        ? undefined
                        : t("slippageLabel", {
                            amount: money(Math.abs(slippage)),
                          })
                    }
                    snapshot={
                      hasInputSnapshot ? inputDetails.join(" · ") : undefined
                    }
                  />
                );
              })}
            </ul>
          </Card>
        ) : (
          <Card tone="elevated" className="gap-0 p-0">
            <Text
              size="sm"
              tone="secondary"
              className="px-(--space-4) py-(--space-3)"
            >
              {t("activityEmpty")}
            </Text>
          </Card>
        )}
      </section>
    </Page>
  );
}
