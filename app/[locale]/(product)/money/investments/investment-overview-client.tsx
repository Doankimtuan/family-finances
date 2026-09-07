"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { HeroPillLink } from "@/shared/patterns/hero-pill-link";
import {
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentOverviewFilter,
  INVESTMENT_OVERVIEW_FILTER_VALUES,
  type InvestmentOverviewFilter as InvestmentOverviewFilterType,
} from "@/modules/investments/application/investment-constants";
import type {
  InvestmentPortfolio,
  InvestmentHolding,
} from "@/modules/investments/application/investment-types";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  moneyInvestmentPath,
  APP_PATH,
} from "@/modules/tenancy/application/app-path";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { Input } from "@/shared/ui/input";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { Card } from "@/shared/patterns/card";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { StatusAlert } from "@/shared/ui/status-alert";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { MotionReveal } from "@/shared/motion";
import {
  InvestmentValuationMeta,
  InvestmentValuationMetaVariant,
} from "./investment-valuation-meta";
import { investmentAssetIcon } from "./investment-asset-icon";
import { InvestmentCreateAction } from "./investment-create-action";
import { InvestmentPositionRow } from "./investment-position-row";
import { InvestmentPrivacyToggle } from "./investment-privacy-toggle";
import { InvestmentSectionTitle } from "./investment-section-title";

const CHART_COLORS = [
  "chart-series-real",
  "chart-positive",
  "chart-series-intention",
  "chart-negative",
  "chart-neutral",
] as const;
const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
const PERCENT_DECIMAL_DIGITS = 1;
const ZERO_VALUE = 0;
const PERCENT_DIVISOR = 100;
const BASIS_POINTS_DIVISOR = 100;
/** Initial holdings rendered before the show-all toggle (hub scan cap rule). */
const VISIBLE_HOLDINGS_COUNT = 8;

const HoldingsTab = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

type HoldingsTab = (typeof HoldingsTab)[keyof typeof HoldingsTab];

const chartColorVariable = (index: number) =>
  `var(--color-${CHART_COLORS[index % CHART_COLORS.length]})`;

const money = (value: number | null, locale: string) =>
  value == null
    ? "—"
    : formatCurrency(value, DEFAULT_CURRENCY, locale, {
        maximumFractionDigits: 0,
      });

const signedMoney = (value: number | null, locale: string) =>
  value == null
    ? "—"
    : `${value >= ZERO_VALUE ? "+" : "−"}${money(Math.abs(value), locale)}`;

function resolveHoldingValueLabel(
  isActive: boolean,
  currentValue: number | null,
  unknownValue: string,
  locale: string,
) {
  if (!isActive) return undefined;
  if (currentValue == null) return unknownValue;
  return money(currentValue, locale);
}

function resolveHoldingRowSubtitle(
  holding: InvestmentHolding,
  classLabel: string,
  noProvider: string,
) {
  const symbol = holding.instrument?.symbol ?? holding.symbol;
  const provider = holding.providerCustodian || noProvider;
  if (symbol) return `${symbol} · ${provider}`;
  return `${provider} · ${classLabel}`;
}

function quantityLabel(
  holding: InvestmentHolding,
  locale: string,
  t: ReturnType<typeof useTranslations>,
) {
  const unit =
    holding.assetClass === InvestmentAssetClass.FUND
      ? t("fundUnit")
      : t("unit");
  return `${formatNumber(Number(holding.quantity), locale, {
    maximumFractionDigits:
      holding.assetClass === InvestmentAssetClass.CRYPTO
        ? CRYPTO_DECIMAL_DIGITS
        : STANDARD_DECIMAL_DIGITS,
  })} ${unit}`;
}

function HoldingPerformance({
  holding,
  locale,
}: {
  holding: InvestmentHolding;
  locale: string;
}) {
  const t = useTranslations("money.investments.overview");
  const hasPnl =
    holding.unrealizedResult != null && holding.remainingTotalCostBasis != null;

  if (hasPnl) {
    const tone = holding.unrealizedResult! >= ZERO_VALUE ? "success" : "danger";
    return (
      <div className="flex flex-col items-end">
        <Text
          size="xs"
          weight="semibold"
          tabular
          tone={tone}
          className="leading-snug"
        >
          <FinancialValue>
            {signedMoney(holding.unrealizedResult, locale)}
          </FinancialValue>
        </Text>
        <Text size="xs" tabular tone={tone} className="leading-snug">
          <FinancialValue>
            {formatPercent(holding.estimatedUnrealizedPnlPercent ?? 0, locale, {
              maximumFractionDigits: PERCENT_DECIMAL_DIGITS,
            })}
          </FinancialValue>
        </Text>
      </div>
    );
  }

  if (holding.historyStatus === InvestmentHistoryStatus.COST_BASIS_UNKNOWN) {
    return <StatusBadge tone="warning">{t("missingBasisTag")}</StatusBadge>;
  }

  return (
    <Text size="xs" tone="secondary">
      {t("insufficientData")}
    </Text>
  );
}

function SummaryMetric({
  label,
  children,
  note,
}: {
  label: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <div className="min-w-0 text-right">
        {children}
        {note ? (
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) text-pretty"
          >
            {note}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

export function InvestmentOverviewClient({
  portfolio,
  locale,
}: {
  portfolio: InvestmentPortfolio;
  locale: string;
}) {
  const t = useTranslations("money.investments.overview");
  const tUx = useTranslations("money.investments");
  const [filter, setFilter] = useState<InvestmentOverviewFilterType>(
    InvestmentOverviewFilter.ALL,
  );
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<HoldingsTab>(
    portfolio.activeHoldings.length > ZERO_VALUE
      ? HoldingsTab.ACTIVE
      : HoldingsTab.CLOSED,
  );
  const [showAll, setShowAll] = useState(false);
  const active = useMemo(
    () =>
      portfolio.activeHoldings
        .filter((holding) => {
          const matchesFilter =
            filter === InvestmentOverviewFilter.ALL ||
            holding.assetClass === filter;
          const text =
            `${holding.name} ${holding.symbol ?? ""} ${holding.providerCustodian ?? ""} ${holding.instrument?.symbol ?? ""} ${holding.instrument?.name ?? ""} ${holding.instrument?.exchange ?? ""}`.toLowerCase();
          return matchesFilter && text.includes(query.trim().toLowerCase());
        })
        .sort(
          (a, b) =>
            (b.currentValue ?? ZERO_VALUE) - (a.currentValue ?? ZERO_VALUE),
        ),
    [filter, portfolio.activeHoldings, query],
  );
  const closed = useMemo(
    () =>
      portfolio.closedHoldings.filter((holding) => {
        const text =
          `${holding.name} ${holding.symbol ?? ""} ${holding.providerCustodian ?? ""} ${holding.instrument?.symbol ?? ""} ${holding.instrument?.name ?? ""}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      }),
    [portfolio.closedHoldings, query],
  );
  const chartData = portfolio.allocationByAssetClass.map((row) => ({
    assetClass: row.assetClass as InvestmentUxType,
    name: tUx(investmentUxConfig(row.assetClass).titleKey),
    valueVnd: row.valueVnd,
    sharePercent: row.shareBasisPoints / BASIS_POINTS_DIVISOR,
  }));
  const pnlCoverageCount = portfolio.activeHoldings.filter(
    (holding) =>
      holding.currentValue != null && holding.remainingTotalCostBasis != null,
  ).length;
  const valuationNote =
    portfolio.valuationCoverage.included < portfolio.valuationCoverage.total
      ? t("valuationCoverage", {
          included: portfolio.valuationCoverage.included,
          total: portfolio.valuationCoverage.total,
        })
      : undefined;
  const pnlNote =
    pnlCoverageCount < portfolio.activeHoldings.length
      ? t("pnlCoverage", {
          included: pnlCoverageCount,
          total: portfolio.activeHoldings.length,
        })
      : undefined;
  const tabList = portfolio.closedHoldings.length
    ? [
        {
          id: HoldingsTab.ACTIVE,
          label: t("activeTab", { count: portfolio.activeHoldings.length }),
        },
        {
          id: HoldingsTab.CLOSED,
          label: t("closedTab", { count: portfolio.closedPositionCount }),
        },
      ]
    : [
        {
          id: HoldingsTab.ACTIVE,
          label: t("activeTab", { count: portfolio.activeHoldings.length }),
        },
      ];
  const tabHoldings = tab === HoldingsTab.ACTIVE ? active : closed;
  const visibleHoldings = showAll
    ? tabHoldings
    : tabHoldings.slice(0, VISIBLE_HOLDINGS_COUNT);
  const hasMoreHoldings = tabHoldings.length > VISIBLE_HOLDINGS_COUNT;
  const heroValue =
    portfolio.totalCurrentValue == null
      ? t("unknownValue")
      : money(portfolio.totalCurrentValue, locale);

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="investment-overview-client"
    >
      <MotionReveal>
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="investment-portfolio-summary"
        >
          <Card tone="hero" className="gap-0 p-(--space-4)">
            <div className="flex items-center justify-between gap-(--space-3)">
              <Text size="sm" weight="medium" className="text-hero-muted">
                {t("currentValue")}
              </Text>
              <InvestmentPrivacyToggle testId="investment-financial-privacy-toggle" />
            </div>
            <Amount
              amountLabel={heroValue}
              size={AmountSize.HERO}
              className="mt-(--space-2)"
              amountClassName="text-hero-fg"
            />
            <Text
              size="xs"
              className="mt-(--space-2) text-pretty text-hero-muted"
            >
              {valuationNote ?? t("estimatedNotCash")}
            </Text>
            <div className="mt-(--space-4) flex justify-end border-t border-white/15 pt-(--space-3)">
              <HeroPillLink
                href={APP_PATH.MONEY_INVESTMENTS_CONVERT}
                data-testid="investment-convert-link"
              >
                {t("convert")}
                <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
              </HeroPillLink>
            </div>
          </Card>
          <Card
            tone="elevated"
            className="gap-0 p-(--space-4)"
            data-testid="investment-portfolio-metrics"
          >
            <InvestmentSectionTitle>
              {t("portfolioTitle")}
            </InvestmentSectionTitle>
            <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
              <SummaryMetric label={t("knownBasis")}>
                <Text size="sm" weight="semibold" tabular>
                  <FinancialValue>
                    {portfolio.totalRemainingCostBasis == null
                      ? t("unavailable")
                      : money(portfolio.totalRemainingCostBasis, locale)}
                  </FinancialValue>
                </Text>
              </SummaryMetric>
              <SummaryMetric label={t("unrealized")} note={pnlNote}>
                {portfolio.unrealizedResult == null ? (
                  <Text size="sm" weight="semibold" tabular>
                    {t("unknownValue")}
                  </Text>
                ) : (
                  <Text
                    size="sm"
                    weight="semibold"
                    tabular
                    tone={
                      portfolio.unrealizedResult >= ZERO_VALUE
                        ? "success"
                        : "danger"
                    }
                  >
                    <FinancialValue>
                      {`${signedMoney(portfolio.unrealizedResult, locale)} · ${formatPercent(portfolio.estimatedUnrealizedPnlPercent ?? 0, locale, { maximumFractionDigits: PERCENT_DECIMAL_DIGITS })}`}
                    </FinancialValue>
                  </Text>
                )}
              </SummaryMetric>
              <SummaryMetric label={t("realized")}>
                <Text size="sm" weight="semibold" tabular>
                  <FinancialValue>
                    {signedMoney(portfolio.realizedSaleResult, locale)}
                  </FinancialValue>
                </Text>
              </SummaryMetric>
              <SummaryMetric label={t("income")}>
                <Text size="sm" weight="semibold" tabular>
                  <FinancialValue>
                    {money(portfolio.investmentIncome, locale)}
                  </FinancialValue>
                </Text>
              </SummaryMetric>
            </div>
          </Card>
        </section>
      </MotionReveal>
      {portfolio.incompleteBasisCount > ZERO_VALUE ? (
        <StatusAlert
          variant="warning"
          title={t("incompleteBasisAlert", {
            count: portfolio.incompleteBasisCount,
          })}
        />
      ) : null}
      {chartData.length ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="investment-allocation"
        >
          <div>
            <InvestmentSectionTitle>
              {t("allocationTitle")}
            </InvestmentSectionTitle>
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {t("allocationHint")}
            </Text>
          </div>
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <div className="px-(--space-4) pt-(--space-4)">
              <div
                className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
                aria-hidden="true"
                data-testid="investment-allocation-strip"
              >
                {chartData.map((row, index) => (
                  <span
                    key={row.name}
                    className="min-w-1"
                    style={{
                      width: `${row.sharePercent}%`,
                      backgroundColor: chartColorVariable(index),
                    }}
                  />
                ))}
              </div>
            </div>
            <ul
              className="mt-(--space-2) divide-y divide-divider"
              aria-label={t("allocationChartAria")}
            >
              {chartData.map((row) => {
                const AssetIcon = investmentAssetIcon(row.assetClass);
                return (
                  <li
                    key={row.name}
                    className="flex min-w-0 items-center gap-(--space-3) px-(--space-4) py-(--space-3)"
                    data-testid={`investment-allocation-${row.assetClass}`}
                  >
                    <IconContainer
                      tone={IconContainerTone.INVESTMENT}
                      size="sm"
                    >
                      <AppIcon icon={AssetIcon} size={AppIconSize.SM} />
                    </IconContainer>
                    <div className="min-w-0 flex-1">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-(--space-2)">
                        <span className="min-w-0 break-words text-sm font-medium leading-snug text-text-primary">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                          {formatPercent(
                            row.sharePercent / PERCENT_DIVISOR,
                            locale,
                            {
                              maximumFractionDigits: PERCENT_DECIMAL_DIGITS,
                            },
                          )}
                        </span>
                      </div>
                      <span className="mt-(--space-1) block text-sm tabular-nums tracking-tight text-text-secondary">
                        <FinancialValue>
                          {money(row.valueVnd, locale)}
                        </FinancialValue>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ) : null}
      <section className="flex flex-col gap-(--space-2)">
        <div className="flex items-end justify-between gap-(--space-3)">
          <div className="min-w-0">
            <InvestmentSectionTitle>
              {t("holdingsTitle")}
            </InvestmentSectionTitle>
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {t("holdingsHint")}
            </Text>
          </div>
          <Text size="xs" tone="muted" className="shrink-0 tabular-nums">
            {tab === HoldingsTab.ACTIVE
              ? t("activeTab", { count: portfolio.activeHoldings.length })
              : t("closedTab", { count: portfolio.closedPositionCount })}
          </Text>
        </div>
        <div className="flex flex-col gap-(--space-3)">
          {tabList.length > 1 ? (
            <div
              className="grid grid-cols-2 rounded-full bg-surface-muted p-1"
              role="group"
              aria-label={t("holdingsViewAria")}
              data-testid="investment-holdings-tabs"
            >
              {tabList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() => {
                    setTab(item.id);
                    setShowAll(false);
                  }}
                  className={`min-h-9 rounded-full px-(--space-3) text-sm font-medium transition-colors duration-(--duration-fast) ease-(--ease-standard) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                    tab === item.id
                      ? "bg-surface text-text-primary shadow-(--elevation-1)"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
          <Input
            type="search"
            aria-label={t("searchAria")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full"
            data-testid="investment-search"
          />
          {tab === HoldingsTab.ACTIVE ? (
            <div
              className="flex flex-wrap gap-(--space-2)"
              role="group"
              aria-label={t("filterAria")}
            >
              {INVESTMENT_OVERVIEW_FILTER_VALUES.map((item) => (
                <FilterChip
                  key={item}
                  selected={filter === item}
                  onPress={() => setFilter(item)}
                >
                  {t(`filters.${item}`)}
                </FilterChip>
              ))}
            </div>
          ) : (
            <Text size="xs" tone="secondary" className="text-pretty">
              {t("closedDescription")}
            </Text>
          )}
          {visibleHoldings.length ? (
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              <ul className="divide-y divide-divider">
                {visibleHoldings.map((holding) => {
                  const config = investmentUxConfig(
                    holding.assetClass as InvestmentUxType,
                  );
                  const isActive = tab === HoldingsTab.ACTIVE;
                  const valueLabel = resolveHoldingValueLabel(
                    isActive,
                    holding.currentValue,
                    t("unknownValue"),
                    locale,
                  );

                  return (
                    <li key={holding.id}>
                      <InvestmentPositionRow
                        href={moneyInvestmentPath(holding.id)}
                        testId={
                          isActive
                            ? `investment-position-${holding.id}`
                            : `investment-closed-position-${holding.id}`
                        }
                        cardTestId={`investment-position-card-${holding.id}`}
                        icon={investmentAssetIcon(
                          holding.assetClass as InvestmentUxType,
                        )}
                        title={holding.name}
                        subtitle={resolveHoldingRowSubtitle(
                          holding,
                          tUx(config.titleKey),
                          t("noProvider"),
                        )}
                        valueLabel={valueLabel}
                        quantityLabel={
                          isActive
                            ? quantityLabel(holding, locale, t)
                            : undefined
                        }
                        valuation={
                          isActive ? (
                            <InvestmentValuationMeta
                              holding={holding}
                              variant={InvestmentValuationMetaVariant.ROW}
                            />
                          ) : null
                        }
                        performance={
                          isActive ? (
                            <HoldingPerformance
                              holding={holding}
                              locale={locale}
                            />
                          ) : null
                        }
                        ownership={
                          holding.ownership.financialScope ===
                          FINANCIAL_SCOPE.PERSONAL
                            ? holding.ownership
                            : undefined
                        }
                        closed={!isActive}
                        closedStatus={isActive ? undefined : t("closedStatus")}
                        closedNote={
                          isActive ? undefined : t("closedHistoryNote")
                        }
                      />
                    </li>
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
                {tab === HoldingsTab.ACTIVE
                  ? t("noFilteredResults")
                  : t("noClosedResults")}
              </Text>
            </Card>
          )}
          {hasMoreHoldings ? (
            <button
              type="button"
              className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
              data-testid="investment-holdings-show-all"
            >
              {showAll
                ? t("showLessHoldings")
                : t("showAllHoldings", { count: tabHoldings.length })}
            </button>
          ) : null}
        </div>
      </section>
      <div aria-hidden="true" className="h-(--space-16) shrink-0" />
      <InvestmentCreateAction />
    </div>
  );
}
