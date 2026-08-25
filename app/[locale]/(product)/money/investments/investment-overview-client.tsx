"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  BankIcon,
  ChartBarLineIcon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Section, SectionVariant } from "@/shared/patterns/section";
import { StatusAlert } from "@/shared/ui/status-alert";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { MotionReveal } from "@/shared/motion";
import {
  InvestmentValuationMeta,
  InvestmentValuationMetaVariant,
} from "./investment-valuation-meta";

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

const chartColorVariable = (index: number) =>
  `var(--color-${CHART_COLORS[index % CHART_COLORS.length]})`;

const HoldingsTab = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

type HoldingsTab = (typeof HoldingsTab)[keyof typeof HoldingsTab];

const iconFor = (asset: InvestmentUxType) =>
  asset === InvestmentAssetClass.STOCK
    ? ChartBarLineIcon
    : asset === InvestmentAssetClass.CRYPTO
      ? SmartPhoneIcon
      : asset === InvestmentAssetClass.GOLD
        ? BankIcon
        : Wallet02Icon;

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

/**
 * One holding in the scan list — instrument identity, current valuation, and
 * gain/loss where reliable. Basis lives on the detail screen; only a missing
 * basis surfaces here as a quiet warning tag.
 */
function InvestmentPositionCard({
  holding,
  locale,
}: {
  holding: InvestmentHolding;
  locale: string;
}) {
  const t = useTranslations("money.investments.overview");
  const tUx = useTranslations("money.investments");
  const config = investmentUxConfig(holding.assetClass as InvestmentUxType);
  const hasPnl =
    holding.unrealizedResult != null && holding.remainingTotalCostBasis != null;
  const instrumentContext = holding.instrument
    ? `${holding.instrument.symbol} · ${holding.instrument.name}`
    : holding.symbol;
  const classContext = `${holding.providerCustodian || t("noProvider")} · ${tUx(config.titleKey)}`;
  const pnlLabel = hasPnl
    ? `${signedMoney(holding.unrealizedResult, locale)} · ${formatPercent(holding.estimatedUnrealizedPnlPercent ?? 0, locale, { maximumFractionDigits: PERCENT_DECIMAL_DIGITS })}`
    : null;

  return (
    <Card
      tone="interactive"
      className="gap-(--space-3) p-(--space-3)"
      data-testid={`investment-position-card-${holding.id}`}
    >
      <div className="flex items-start gap-(--space-3)">
        <IconContainer tone="investment" size="sm">
          <AppIcon
            icon={iconFor(holding.assetClass as InvestmentUxType)}
            size="sm"
          />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <Text
            size="sm"
            weight="semibold"
            className="truncate text-text-primary"
          >
            {holding.name}
          </Text>
          {instrumentContext ? (
            <Text size="xs" tone="secondary" className="truncate">
              {instrumentContext}
            </Text>
          ) : null}
          <Text size="xs" tone="muted" className="truncate">
            {classContext}
          </Text>
        </div>
        <div className="shrink-0 text-right">
          {holding.currentValue == null ? (
            <Text size="sm" tone="secondary">
              {t("unknownValue")}
            </Text>
          ) : (
            <Text size="lg" weight="semibold" tabular>
              <FinancialValue>
                {money(holding.currentValue, locale)}
              </FinancialValue>
            </Text>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between gap-(--space-3) border-t border-divider pt-(--space-2)">
        <div className="min-w-0">
          {hasPnl ? (
            <>
              <Text size="xs" tone="secondary">
                {t("unrealized")}
              </Text>
              <Text
                size="sm"
                weight="semibold"
                tabular
                tone={
                  holding.unrealizedResult! >= ZERO_VALUE ? "success" : "danger"
                }
              >
                <FinancialValue>{pnlLabel}</FinancialValue>
              </Text>
            </>
          ) : holding.historyStatus ===
            InvestmentHistoryStatus.COST_BASIS_UNKNOWN ? (
            <StatusBadge tone="warning">{t("missingBasisTag")}</StatusBadge>
          ) : (
            <Text size="xs" tone="secondary">
              {t("insufficientData")}
            </Text>
          )}
          {holding.ownership.financialScope === FINANCIAL_SCOPE.PERSONAL ? (
            <FinancialOwnershipBadge
              financialScope={holding.ownership.financialScope}
              isOwnedByMe={holding.ownership.isOwnedByMe}
              ownerStatus={holding.ownership.ownerStatus}
              compact
            />
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-(--space-1) text-right">
          <Text size="xs" tone="muted">
            {quantityLabel(holding, locale, t)}
          </Text>
          <InvestmentValuationMeta
            holding={holding}
            variant={InvestmentValuationMetaVariant.INLINE}
          />
        </div>
      </div>
    </Card>
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
    <div className="min-w-0">
      <Text size="xs" tone="secondary" className="text-pretty">
        {label}
      </Text>
      {/* div — the PnL metric nests a tone-carrying Text value inside. */}
      <Text
        as="div"
        size="sm"
        weight="semibold"
        tabular
        className="mt-(--space-1) text-pretty text-text-primary"
      >
        {children}
      </Text>
      {note ? (
        <Text size="xs" tone="secondary" className="mt-(--space-1) text-pretty">
          {note}
        </Text>
      ) : null}
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
  const router = useRouter();
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

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="investment-overview-client"
    >
      <MotionReveal>
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="investment-portfolio-summary"
        >
          <Card tone="hero" className="gap-0 p-(--space-4)">
            <Text size="sm" weight="medium" className="text-hero-muted">
              {t("currentValue")}
            </Text>
            <p className="mt-(--space-2) font-semibold tabular-nums tracking-tight text-3xl text-hero-fg">
              {portfolio.totalCurrentValue == null ? (
                t("unknownValue")
              ) : (
                <FinancialValue>
                  {money(portfolio.totalCurrentValue, locale)}
                </FinancialValue>
              )}
            </p>
            {valuationNote ? (
              <Text
                size="xs"
                className="mt-(--space-2) text-pretty text-hero-muted"
              >
                {valuationNote}
              </Text>
            ) : null}
          </Card>
          <Card
            tone="elevated"
            className="grid grid-cols-2 gap-(--space-3) p-(--space-4)"
            data-testid="investment-portfolio-metrics"
          >
            <SummaryMetric label={t("knownBasis")}>
              {portfolio.totalRemainingCostBasis == null ? (
                t("unavailable")
              ) : (
                <FinancialValue>
                  {money(portfolio.totalRemainingCostBasis, locale)}
                </FinancialValue>
              )}
            </SummaryMetric>
            <SummaryMetric label={t("unrealized")} note={pnlNote ?? undefined}>
              {portfolio.unrealizedResult == null ? (
                t("unknownValue")
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
              <FinancialValue>
                {signedMoney(portfolio.realizedSaleResult, locale)}
              </FinancialValue>
            </SummaryMetric>
            <SummaryMetric label={t("income")}>
              <FinancialValue>
                {money(portfolio.investmentIncome, locale)}
              </FinancialValue>
            </SummaryMetric>
          </Card>
        </div>
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
        <Section
          title={t("allocationTitle")}
          variant={SectionVariant.SURFACE}
          contentClassName="gap-(--space-4)"
        >
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
            aria-hidden="true"
            data-testid="investment-allocation-strip"
          >
            {chartData.map((row, index) => (
              <span
                key={row.name}
                className="min-w-1 transition-[filter] duration-(--duration-fast) ease-(--ease-standard)"
                style={{
                  width: `${row.sharePercent}%`,
                  backgroundColor: chartColorVariable(index),
                }}
              />
            ))}
          </div>
          <ul
            className="grid grid-cols-1 gap-(--space-2)"
            aria-label={t("allocationChartAria")}
          >
            {chartData.map((row) => {
              const AssetIcon = iconFor(row.assetClass);
              return (
                <li
                  key={row.name}
                  className="flex min-w-0 items-center gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface px-(--space-3) py-(--space-3) transition-[background-color,border-color,transform] duration-(--duration-fast) ease-(--ease-standard) hover:border-border-strong hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100"
                  data-testid={`investment-allocation-${row.assetClass}`}
                >
                  <IconContainer tone={IconContainerTone.INVESTMENT} size="sm">
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
        </Section>
      ) : null}
      <Section
        title={t("holdingsTitle")}
        action={
          <Link
            href={APP_PATH.MONEY_INVESTMENTS_CONVERT}
            className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
            data-testid="investment-convert-link"
          >
            {t("convert")}
          </Link>
        }
      >
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
            <ul className="flex flex-col gap-(--space-2)">
              {visibleHoldings.map((holding) =>
                tab === HoldingsTab.ACTIVE ? (
                  <li key={holding.id}>
                    <Link
                      href={moneyInvestmentPath(holding.id)}
                      className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid={`investment-position-${holding.id}`}
                    >
                      <InvestmentPositionCard
                        holding={holding}
                        locale={locale}
                      />
                    </Link>
                  </li>
                ) : (
                  <li key={holding.id}>
                    <Link
                      href={moneyInvestmentPath(holding.id)}
                      className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid={`investment-closed-position-${holding.id}`}
                    >
                      <Card
                        tone="soft"
                        className="gap-(--space-2) p-(--space-3)"
                      >
                        <div className="flex items-start justify-between gap-(--space-3)">
                          <div className="min-w-0">
                            <Text
                              size="sm"
                              weight="medium"
                              className="truncate"
                            >
                              {holding.name}
                            </Text>
                            <Text
                              size="xs"
                              tone="secondary"
                              className="truncate text-pretty"
                            >
                              {holding.instrument
                                ? `${holding.instrument.symbol} · ${holding.instrument.name}`
                                : holding.symbol ||
                                  holding.providerCustodian ||
                                  t("noProvider")}
                            </Text>
                          </div>
                          <StatusBadge tone="neutral">
                            {t("closedStatus")}
                          </StatusBadge>
                        </div>
                        <Text size="xs" tone="muted" className="text-pretty">
                          {t("closedHistoryNote")}
                        </Text>
                      </Card>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <Text size="sm" tone="secondary">
              {tab === HoldingsTab.ACTIVE
                ? t("noFilteredResults")
                : t("noClosedResults")}
            </Text>
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
      </Section>
      <FloatingAction>
        <Button
          className="pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2) rounded-full px-(--space-4) shadow-(--elevation-2)"
          onPress={() => router.push(APP_PATH.MONEY_INVESTMENTS_NEW)}
          data-testid="investment-opening-link"
        >
          <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
          <span>{t("addOpening")}</span>
        </Button>
      </FloatingAction>
    </div>
  );
}
