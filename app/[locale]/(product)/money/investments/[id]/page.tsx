import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyInvestmentBuyPath,
  moneyInvestmentIncomePath,
  moneyInvestmentSellPath,
  moneyInvestmentValuationPath,
} from "@/modules/tenancy/application/app-path";
import {
  getInvestmentHolding,
  listInvestmentActivities,
  deriveSlippage,
  InvestmentActivityType,
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentLifecycleStatus,
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
  const [{ locale }, { receipt }, t, holding, activities] = await Promise.all([
    params,
    searchParams,
    getTranslations("money.investments.detail"),
    params.then(({ id: value }) => getInvestmentHolding(value)),
    params.then(({ id: value }) => listInvestmentActivities(value)),
  ]);
  if (!holding)
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
  const asset = holding.assetClass as InvestmentUxType;
  const ux = investmentUxConfig(asset);
  const money = (value: number | null) =>
    value == null
      ? t("unavailable")
      : formatCurrency(value, "VND", locale, { maximumFractionDigits: 0 });
  const quantity = Number(holding.quantity);
  const average =
    holding.remainingTotalCostBasis != null && quantity > ZERO_AMOUNT
      ? holding.remainingTotalCostBasis / quantity
      : null;
  const referencePrice =
    holding.currentValue != null && quantity > ZERO_AMOUNT
      ? holding.currentValue / quantity
      : null;
  const hasBasis =
    holding.remainingTotalCostBasis != null && holding.unrealizedResult != null;
  const pnlPercent =
    hasBasis && holding.remainingTotalCostBasis! > ZERO_AMOUNT
      ? holding.unrealizedResult! / holding.remainingTotalCostBasis!
      : null;
  const isClosed =
    holding.lifecycleStatus === InvestmentLifecycleStatus.EXITED ||
    quantity <= ZERO_AMOUNT;
  const realized = (activities ?? []).reduce(
    (sum, activity) => sum + (activity.realizedResultVnd ?? 0),
    0,
  );
  const valuationLabel =
    asset === InvestmentAssetClass.FUND
      ? t("updateNav")
      : asset === InvestmentAssetClass.GOLD
        ? t("updateGoldBuyBack")
        : t("updatePrice");
  const providerDisplay = holding.providerCustodian || t("noProvider");

  return (
    <Page
      testId="investment-detail"
      topBar={
        <TopAppBar
          title={holding.symbol || holding.name}
          subtitle={`${providerDisplay} · ${ux.title}`}
        />
      }
    >
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
        />
        <Text size="sm" tone="secondary">
          {ux.title} · {providerDisplay}
        </Text>
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
          {money(holding.currentValue)}
        </Text>
        {hasBasis ? (
          <div className="mt-(--space-2) flex items-center gap-2">
            <Text
              size="sm"
              tone={
                holding.unrealizedResult! >= ZERO_AMOUNT ? "success" : "danger"
              }
              weight="semibold"
            >
              {holding.unrealizedResult! >= ZERO_AMOUNT ? "+" : "−"}
              {money(Math.abs(holding.unrealizedResult!))}
            </Text>
            <Text size="sm" tone="secondary">
              (
              {formatPercent(pnlPercent!, locale, {
                maximumFractionDigits: PERCENT_DECIMAL_DIGITS,
              })}{" "}
              · {t("estimated")})
            </Text>
          </div>
        ) : (
          <Text size="sm" tone="secondary" className="mt-2">
            {t("missingBasisAlertTitle")}
          </Text>
        )}
      </section>
      {!isClosed && holding.ownership.canMutate ? (
        <div className="grid grid-cols-2 gap-(--space-2)">
          <Link
            href={moneyInvestmentBuyPath(holding.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg"
          >
            {ux.purchaseAction}
          </Link>
          <Link
            href={moneyInvestmentSellPath(holding.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary"
          >
            {ux.disposalAction}
          </Link>
        </div>
      ) : (
        <StatusAlert
          variant="info"
          title={t("closedTitle")}
          description={t("closedDescription")}
        />
      )}
      <Section title={t("performanceSection")}>
        <div className="grid gap-(--space-3) sm:grid-cols-2">
          <Amount
            label={t("remainingBasis")}
            amountLabel={money(holding.remainingTotalCostBasis)}
          />
          <Amount
            label={t("unrealizedResult")}
            amountLabel={
              hasBasis
                ? `${holding.unrealizedResult! >= ZERO_AMOUNT ? "+" : "−"}${money(Math.abs(holding.unrealizedResult!))}`
                : t("unavailable")
            }
          />
          <Amount label={t("realizedResult")} amountLabel={money(realized)} />
          <Amount
            label={
              asset === InvestmentAssetClass.FUND
                ? t("receivedIncome")
                : t("quantityLabel")
            }
            amountLabel={
              asset === InvestmentAssetClass.FUND
                ? money(null)
                : `${formatNumber(quantity, locale, { maximumFractionDigits: asset === InvestmentAssetClass.CRYPTO ? CRYPTO_DECIMAL_DIGITS : STANDARD_DECIMAL_DIGITS })} ${t("unit")}`
            }
          />
        </div>
      </Section>
      <Section
        title={
          asset === InvestmentAssetClass.GOLD
            ? t("goldBuyBackSection")
            : asset === InvestmentAssetClass.FUND
              ? t("fundNavSection")
              : t("referencePriceSection")
        }
      >
        <div className="grid gap-(--space-3) sm:grid-cols-2">
          <Amount
            label={
              asset === InvestmentAssetClass.GOLD
                ? t("goldBuyBackPriceLabel")
                : asset === InvestmentAssetClass.FUND
                  ? t("fundNavLabel")
                  : t("referencePriceLabel")
            }
            amountLabel={money(referencePrice)}
          />
          {asset !== InvestmentAssetClass.FUND &&
          asset !== InvestmentAssetClass.GOLD ? (
            <Amount label={t("averageCost")} amountLabel={money(average)} />
          ) : null}
          {asset === InvestmentAssetClass.GOLD ? (
            <Text size="sm" tone="secondary">
              {t("goldValuationNote")}
            </Text>
          ) : null}
        </div>
      </Section>
      <Section title={t("activitySection")}>
        <div className="flex flex-col gap-(--space-3)">
          {activities?.length ? (
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
                      <span>{money(activity.executedValueVnd)}</span>
                    ) : null}
                    {activity.realizedResultVnd != null ? (
                      <span
                        className={
                          activity.realizedResultVnd >= ZERO_AMOUNT
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {t("realizedPnlLabel")}{" "}
                        {activity.realizedResultVnd >= ZERO_AMOUNT ? "+" : "−"}
                        {money(Math.abs(activity.realizedResultVnd))}
                      </span>
                    ) : null}
                    {slippage != null ? (
                      <span>
                        {t("slippageLabel", {
                          amount: money(Math.abs(slippage)),
                        })}
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
      {!isClosed && holding.ownership.canMutate ? (
        <div className="grid grid-cols-2 gap-(--space-2)">
          <Link
            href={moneyInvestmentIncomePath(holding.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary"
          >
            {ux.incomeLabel}
          </Link>
          <Link
            href={moneyInvestmentValuationPath(holding.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary"
          >
            {valuationLabel}
          </Link>
        </div>
      ) : null}
      <Link
        href={APP_PATH.MONEY_INVESTMENTS}
        className="text-sm font-medium text-accent"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
