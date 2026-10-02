"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  InvestmentAssetClass,
  InvestmentHoldingsTab,
  InvestmentOverviewFilter,
  INVESTMENT_HOLDINGS_TAB_VALUES,
  INVESTMENT_OVERVIEW_FILTER_VALUES,
  INVESTMENT_REPORTING_CURRENCY,
} from "@/modules/investments/application/investment-constants";
import type {
  InvestmentHolding,
  InvestmentPortfolio,
} from "@/modules/investments/application/investment-types";
import { investmentUxConfig } from "@/modules/investments/application/investment-ux";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/shared/i18n/formatters";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import {
  ACTION_ICONS,
  INVESTMENT_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { InlineAlert, InlineAlertVariant } from "@/shared/ui/inline-alert";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import {
  InvestmentValuationMeta,
  InvestmentValuationMetaVariant,
} from "../investment-valuation-meta";

const ASSET_VISUALS = {
  [InvestmentAssetClass.FUND]: {
    icon: INVESTMENT_ICONS.fund,
    tone: IconContainerTone.INVESTMENT,
    color: "bg-investment dark:bg-primary",
    badgeTone: StatusBadgeTone.GROWTH,
  },
  [InvestmentAssetClass.STOCK]: {
    icon: INVESTMENT_ICONS.stock,
    tone: IconContainerTone.PRIMARY,
    color: "bg-primary dark:bg-info",
    badgeTone: StatusBadgeTone.SELECTED,
  },
  [InvestmentAssetClass.CRYPTO]: {
    icon: INVESTMENT_ICONS.crypto,
    tone: IconContainerTone.INFO,
    color: "bg-info dark:bg-investment",
    badgeTone: StatusBadgeTone.INFO,
  },
  [InvestmentAssetClass.GOLD]: {
    icon: INVESTMENT_ICONS.gold,
    tone: IconContainerTone.WARNING,
    color: "bg-warning",
    badgeTone: StatusBadgeTone.WARNING,
  },
  [InvestmentAssetClass.BOND]: {
    icon: INVESTMENT_ICONS.bond,
    tone: IconContainerTone.NEUTRAL,
    color: "bg-chart-neutral",
    badgeTone: StatusBadgeTone.NEUTRAL,
  },
} as const;
const BASIS_POINTS_PER_PERCENT = 100;
const BASIS_POINTS_PER_WHOLE = 10_000;

function Performance({
  value,
  percent,
  locale,
  compact = false,
}: {
  value: number | null;
  percent?: number | null;
  locale: string;
  compact?: boolean;
}) {
  const t = useTranslations("money.investments.overview");
  if (value == null)
    return (
      <Text size="xs" tone="secondary">
        {t("insufficientData")}
      </Text>
    );
  const tone =
    value >= 0 ? FinancialAmountTone.INCOME : FinancialAmountTone.EXPENSE;
  return (
    <div className="flex flex-wrap items-baseline justify-end gap-x-(--space-1) text-xs tabular-nums">
      <FinancialAmount
        value={value}
        size={FinancialAmountSize.MICRO_AMOUNT}
        tone={tone}
        showSign
        className="flex-wrap"
        amountLabel={
          compact
            ? formatCurrency(
                Math.abs(value),
                INVESTMENT_REPORTING_CURRENCY,
                locale,
                { notation: "compact", maximumFractionDigits: 1 },
              )
            : undefined
        }
        currency={compact ? "" : undefined}
      />
      {percent != null ? (
        <span className={value >= 0 ? "text-income" : "text-expense"}>
          <FinancialValue>
            ({formatPercent(percent, locale, { maximumFractionDigits: 1 })})
          </FinancialValue>
        </span>
      ) : null}
    </div>
  );
}

function AssetRow({
  holding,
  locale,
  closed,
}: {
  holding: InvestmentHolding;
  locale: string;
  closed: boolean;
}) {
  const t = useTranslations("money.investments.stitchOverview");
  const tOverview = useTranslations("money.investments.overview");
  const tUx = useTranslations("money.investments");
  const visual = ASSET_VISUALS[holding.assetClass];
  const symbol = holding.instrument?.symbol ?? holding.symbol;
  const unit = tUx(investmentUxConfig(holding.assetClass).unitSuffixKey);
  const quantity = formatNumber(Number(holding.quantity), locale, {
    maximumFractionDigits:
      holding.assetClass === InvestmentAssetClass.CRYPTO ? 8 : 2,
  });
  const unitPrice = holding.valuation?.unitPriceVnd;
  return (
    <Card tone="elevated" className="gap-0 p-0">
      <Link
        href={moneyInvestmentPath(holding.id)}
        className="flex min-w-0 items-start gap-(--space-2) rounded-(--radius-card) p-(--space-3) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid={`investment-overview-position-${holding.id}`}
      >
        <IconContainer tone={visual.tone}>
          <AppIcon icon={visual.icon} size={AppIconSize.MD} />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-(--space-1)">
            <h3 className="text-sm font-semibold leading-snug text-text-primary wrap-break-word">
              {holding.name}
            </h3>
            <StatusBadge tone={visual.badgeTone}>
              {t(`filters.${holding.assetClass}`)}
            </StatusBadge>
          </div>
          <p className="mt-(--space-1) text-xs leading-snug text-text-secondary wrap-break-word">
            {[symbol, holding.providerCustodian || tOverview("noProvider")]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {!closed ? (
            <p className="mt-(--space-1) text-xs leading-snug text-text-secondary tabular-nums">
              <FinancialValue>
                {quantity} {unit}
                {unitPrice != null
                  ? ` × ${formatCurrency(unitPrice, INVESTMENT_REPORTING_CURRENCY, locale, { maximumFractionDigits: 0 })}`
                  : ""}
              </FinancialValue>
            </p>
          ) : null}
          {holding.ownership.financialScope === FINANCIAL_SCOPE.PERSONAL ? (
            <div className="mt-(--space-1)">
              <FinancialOwnershipBadge {...holding.ownership} compact />
            </div>
          ) : null}
          {!closed ? (
            <InvestmentValuationMeta
              holding={holding}
              variant={InvestmentValuationMetaVariant.ROW}
            />
          ) : (
            <Text size="xs" tone="secondary">
              {tOverview("closedHistoryNote")}
            </Text>
          )}
        </div>
        <div className="flex min-w-0 max-w-1/2 flex-col items-end gap-(--space-1) text-right">
          {closed ? (
            <StatusBadge>{tOverview("closedStatus")}</StatusBadge>
          ) : (
            <>
              {holding.currentValue == null ? (
                <Text size="xs" tone="secondary">
                  {tOverview("unknownValue")}
                </Text>
              ) : (
                <FinancialAmount
                  value={holding.currentValue}
                  size={FinancialAmountSize.ROW_AMOUNT}
                  kind={FinancialNumberKind.ESTIMATE}
                  className="flex-wrap justify-end"
                />
              )}
              <Performance
                value={holding.unrealizedResult}
                percent={holding.estimatedUnrealizedPnlPercent}
                locale={locale}
              />
              <p className="text-xs leading-snug text-text-secondary">
                <FinancialValue>
                  {t("basis", {
                    amount:
                      holding.remainingTotalCostBasis == null
                        ? tOverview("unavailable")
                        : formatCurrency(
                            holding.remainingTotalCostBasis,
                            INVESTMENT_REPORTING_CURRENCY,
                            locale,
                            { notation: "compact", maximumFractionDigits: 1 },
                          ),
                  })}
                </FinancialValue>
              </p>
            </>
          )}
        </div>
      </Link>
    </Card>
  );
}

export function InvestmentsOverview({
  portfolio,
  locale,
}: {
  portfolio: InvestmentPortfolio;
  locale: string;
}) {
  const t = useTranslations("money.investments.stitchOverview");
  const tOverview = useTranslations("money.investments.overview");
  const tMoney = useTranslations("money");
  const [tab, setTab] = useState<InvestmentHoldingsTab>(
    InvestmentHoldingsTab.ACTIVE,
  );
  const [filter, setFilter] = useState<InvestmentOverviewFilter>(
    InvestmentOverviewFilter.ALL,
  );
  const [query, setQuery] = useState("");
  const holdings =
    tab === InvestmentHoldingsTab.ACTIVE
      ? portfolio.activeHoldings
      : portfolio.closedHoldings;
  const search = query.trim().toLocaleLowerCase();
  const visible = holdings
    .filter(
      (holding) =>
        (filter === InvestmentOverviewFilter.ALL ||
          holding.assetClass === filter) &&
        `${holding.name} ${holding.symbol ?? ""} ${holding.providerCustodian ?? ""} ${holding.instrument?.name ?? ""} ${holding.instrument?.symbol ?? ""}`
          .toLocaleLowerCase()
          .includes(search),
    )
    .toSorted(
      (left, right) =>
        (right.currentValue ?? -Infinity) - (left.currentValue ?? -Infinity),
    );
  const pnlCount = portfolio.activeHoldings.filter(
    (holding) =>
      holding.currentValue != null && holding.remainingTotalCostBasis != null,
  ).length;
  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="investment-stitch-overview"
    >
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-4)"
        data-testid="investment-overview-summary"
      >
        <div>
          <div className="flex items-center justify-between gap-(--space-2)">
            <p className="flex items-center gap-(--space-2) text-xs font-medium tracking-wide text-text-secondary uppercase">
              <span
                className="size-2 shrink-0 rounded-full bg-investment"
                aria-hidden
              />
              {t("marketValue")}
            </p>
            <FinancialPrivacyToggle
              hideLabel={tMoney("financialPrivacy.hide")}
              showLabel={tMoney("financialPrivacy.show")}
              testId="investment-overview-privacy"
              tone={FinancialPrivacyToggleTone.SURFACE}
            />
          </div>
          {portfolio.totalCurrentValue == null ? (
            <Text tone="secondary">{tOverview("unknownValue")}</Text>
          ) : (
            <FinancialAmount
              value={portfolio.totalCurrentValue}
              size={FinancialAmountSize.DISPLAY_HERO}
              kind={FinancialNumberKind.ESTIMATE}
              className="flex-wrap"
              data-testid="investment-overview-total"
            />
          )}
        </div>
        <InlineAlert
          variant={InlineAlertVariant.WARNING}
          icon={
            <AppIcon
              icon={UTILITY_ICONS.info}
              size={AppIconSize.SM}
              className="text-warning"
            />
          }
          description={<span className="text-warning">{t("notCash")}</span>}
          testId="investment-overview-not-cash"
        />
        <dl className="grid grid-cols-3 gap-(--space-2) border-t border-border-subtle pt-(--space-3)">
          <div className="min-w-0">
            <dt className="mb-(--space-1) text-xs text-text-secondary">
              {t("knownBasis")}
            </dt>
            <dd>
              {portfolio.totalRemainingCostBasis == null ? (
                <Text size="xs" tone="secondary">
                  {tOverview("unavailable")}
                </Text>
              ) : (
                <FinancialAmount
                  value={portfolio.totalRemainingCostBasis}
                  size={FinancialAmountSize.MICRO_AMOUNT}
                  className="flex-wrap"
                />
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="mb-(--space-1) text-xs text-text-secondary">
              {t("unrealized")}
            </dt>
            <dd className="[&>div]:justify-start">
              <Performance
                value={portfolio.unrealizedResult}
                percent={portfolio.estimatedUnrealizedPnlPercent}
                locale={locale}
                compact
              />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="mb-(--space-1) text-xs text-text-secondary">
              {t("realized")}
            </dt>
            <dd className="[&>div]:justify-start">
              <Performance
                value={portfolio.realizedSaleResult}
                locale={locale}
                compact
              />
            </dd>
          </div>
        </dl>
        {portfolio.investmentIncome !== 0 ? (
          <div className="flex items-baseline justify-between gap-(--space-2)">
            <Text size="xs" tone="secondary">
              {tOverview("income")}
            </Text>
            <FinancialAmount
              value={portfolio.investmentIncome}
              size={FinancialAmountSize.MICRO_AMOUNT}
            />
          </div>
        ) : null}
        {portfolio.valuationCoverage.included <
        portfolio.valuationCoverage.total ? (
          <Text size="xs" tone="secondary">
            {tOverview("valuationCoverage", portfolio.valuationCoverage)}
          </Text>
        ) : null}
        {pnlCount < portfolio.activeHoldings.length ? (
          <Text size="xs" tone="secondary">
            {tOverview("pnlCoverage", {
              included: pnlCount,
              total: portfolio.activeHoldings.length,
            })}
          </Text>
        ) : null}
        {portfolio.incompleteBasisCount > 0 ? (
          <Text size="xs" className="text-warning">
            {tOverview("incompleteBasisAlert", {
              count: portfolio.incompleteBasisCount,
            })}
          </Text>
        ) : null}
        <div
          className="border-t border-border-subtle pt-(--space-3)"
          data-testid="investment-overview-allocation"
        >
          <div className="mb-(--space-2) flex items-center justify-between gap-(--space-2)">
            <h2 className="text-xs font-semibold text-text-primary">
              {t("allocation")}
            </h2>
            <Text size="xs" tone="secondary">
              {t("groups", { count: portfolio.allocationByAssetClass.length })}
            </Text>
          </div>
          <div
            className="flex h-2 overflow-hidden rounded-full bg-surface-muted"
            aria-hidden
          >
            {portfolio.allocationByAssetClass.map((row) => (
              <span
                key={row.assetClass}
                className={ASSET_VISUALS[row.assetClass].color}
                style={{
                  width: `${row.shareBasisPoints / BASIS_POINTS_PER_PERCENT}%`,
                }}
              />
            ))}
          </div>
          <ul
            className="mt-(--space-2) grid grid-cols-2 gap-(--space-2)"
            aria-label={tOverview("allocationChartAria")}
          >
            {portfolio.allocationByAssetClass.map((row) => (
              <li
                key={row.assetClass}
                className="flex min-w-0 items-start gap-(--space-2) text-xs leading-snug"
              >
                <span
                  className={cn(
                    "mt-(--space-1) size-2 shrink-0 rounded-full",
                    ASSET_VISUALS[row.assetClass].color,
                  )}
                  aria-hidden
                />
                <span className="min-w-0 text-text-secondary">
                  {t(`filters.${row.assetClass}`)}:{" "}
                  <strong className="font-semibold text-text-primary">
                    <FinancialValue>
                      {formatPercent(
                        row.shareBasisPoints / BASIS_POINTS_PER_WHOLE,
                        locale,
                        { maximumFractionDigits: 1 },
                      )}
                    </FinancialValue>
                  </strong>{" "}
                  <FinancialValue>
                    (
                    {formatCurrency(
                      row.valueVnd,
                      INVESTMENT_REPORTING_CURRENCY,
                      locale,
                      { notation: "compact", maximumFractionDigits: 1 },
                    )}
                    )
                  </FinancialValue>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <section className="flex flex-col gap-(--space-3)">
        <div className="flex items-center justify-between gap-(--space-2)">
          <div
            className="flex min-w-0 gap-(--space-2)"
            role="group"
            aria-label={tOverview("holdingsViewAria")}
          >
            {INVESTMENT_HOLDINGS_TAB_VALUES.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => {
                  setTab(id);
                  setFilter(InvestmentOverviewFilter.ALL);
                }}
                className={cn(
                  "min-h-11 border-b-2 px-(--space-1) text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary",
                )}
              >
                {id === InvestmentHoldingsTab.ACTIVE
                  ? t("active")
                  : t("closed")}{" "}
                <span className="rounded-full bg-surface-muted px-(--space-1)">
                  {id === InvestmentHoldingsTab.ACTIVE
                    ? portfolio.activeHoldings.length
                    : portfolio.closedPositionCount}
                </span>
              </button>
            ))}
          </div>
          <Link
            href={APP_PATH.MONEY_INVESTMENTS_CONVERT}
            className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {tOverview("convert")}
          </Link>
        </div>
        <div
          className="-mx-(--space-1) flex gap-(--space-2) overflow-x-auto px-(--space-1) py-(--space-1)"
          role="group"
          aria-label={tOverview("filterAria")}
        >
          {INVESTMENT_OVERVIEW_FILTER_VALUES.map((id) => (
            <FilterChip
              key={id}
              selected={filter === id}
              onPress={() => setFilter(id)}
              className={
                filter === id
                  ? "border-primary bg-primary text-primary-fg"
                  : undefined
              }
            >
              {t(`filters.${id}`)} (
              {id === InvestmentOverviewFilter.ALL
                ? holdings.length
                : holdings.filter((holding) => holding.assetClass === id)
                    .length}
              )
            </FilterChip>
          ))}
        </div>
        <Input
          type="search"
          aria-label={tOverview("searchAria")}
          placeholder={tOverview("searchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          data-testid="investment-overview-search"
        />
        <div className="flex items-baseline justify-between gap-(--space-2)">
          <h2 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
            {tab === InvestmentHoldingsTab.ACTIVE
              ? t("holdings")
              : t("closedHoldings")}
          </h2>
          <Text size="xs" tone="secondary" className="shrink-0">
            {t("basisAndPnl")}
          </Text>
        </div>
        {visible.length ? (
          <ul className="flex flex-col gap-(--space-2)">
            {visible.map((holding) => (
              <li key={holding.id}>
                <AssetRow
                  holding={holding}
                  locale={locale}
                  closed={tab === InvestmentHoldingsTab.CLOSED}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={
              portfolio.holdings.length
                ? tab === InvestmentHoldingsTab.ACTIVE
                  ? tOverview("noFilteredResults")
                  : tOverview("noClosedResults")
                : tOverview("emptyTitle")
            }
            description={
              portfolio.holdings.length
                ? undefined
                : tOverview("emptyDescription")
            }
            className="flex-none py-(--space-4)"
          />
        )}
      </section>
      <Card tone="elevated" className="gap-(--space-2) p-(--space-4)">
        <h2 className="flex items-center gap-(--space-2) text-sm font-semibold text-text-primary">
          <AppIcon
            icon={INVESTMENT_ICONS.rules}
            size={AppIconSize.SM}
            className="text-primary"
          />
          {t("rulesTitle")}
        </h2>
        <Text size="xs" tone="secondary" className="leading-relaxed">
          {t("rulesDescription")}
        </Text>
        <Link
          href={APP_PATH.POLICIES}
          className="flex min-h-11 items-center justify-end gap-(--space-1) border-t border-border-subtle text-xs font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("rulesLink")}
          <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
        </Link>
      </Card>
    </div>
  );
}
