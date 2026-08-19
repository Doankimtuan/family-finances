"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  BankIcon,
  ChartBarLineIcon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import {
  InvestmentAssetClass,
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
import {
  moneyInvestmentPath,
  APP_PATH,
} from "@/modules/tenancy/application/app-path";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/shared/i18n/formatters";
import { AppIcon } from "@/shared/ui/app-icon";
import { Section } from "@/shared/patterns/section";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";

const CHART_COLORS = ["#2563eb", "#16a34a", "#9333ea", "#d97706", "#64748b"];
const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
const PERCENT_DECIMAL_DIGITS = 1;
const ZERO_VALUE = 0;
const INNER_CHART_RADIUS = 45;
const OUTER_CHART_RADIUS = 68;
const CHART_PADDING_ANGLE = 2;
const BASIS_POINTS_DIVISOR = 100;
const PERCENT_DIVISOR = 100;

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
    : formatCurrency(value, "VND", locale, { maximumFractionDigits: 0 });

const signedMoney = (value: number | null, locale: string) =>
  value == null
    ? "—"
    : `${value >= ZERO_VALUE ? "+" : "−"}${money(Math.abs(value), locale)}`;

function PositionCard({
  holding,
  locale,
}: {
  holding: InvestmentHolding;
  locale: string;
}) {
  const t = useTranslations("money.investments.overview");
  const tUx = useTranslations("money.investments");
  const config = investmentUxConfig(holding.assetClass as InvestmentUxType);
  const unitLabel =
    holding.assetClass === InvestmentAssetClass.FUND
      ? t("fundUnit")
      : t("unit");
  const quantity = `${formatNumber(Number(holding.quantity), locale, { maximumFractionDigits: holding.assetClass === InvestmentAssetClass.CRYPTO ? CRYPTO_DECIMAL_DIGITS : STANDARD_DECIMAL_DIGITS })} ${unitLabel}`;
  const hasPnl =
    holding.unrealizedResult != null && holding.remainingTotalCostBasis != null;

  return (
    <li>
      <Link
        href={moneyInvestmentPath(holding.id)}
        className="block rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid={`investment-position-${holding.id}`}
      >
        <div className="flex items-start gap-(--space-3)">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent">
            <AppIcon
              icon={iconFor(holding.assetClass as InvestmentUxType)}
              size="md"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Text weight="semibold" className="truncate">
                  {holding.symbol || holding.name}
                </Text>
                <Text size="sm" tone="secondary" className="truncate">
                  {holding.providerCustodian || t("noProvider")} ·{" "}
                  {tUx(config.titleKey)}
                </Text>
                <FinancialOwnershipBadge
                  financialScope={holding.ownership.financialScope}
                  isOwnedByMe={holding.ownership.isOwnedByMe}
                  ownerStatus={holding.ownership.ownerStatus}
                />
              </div>
              <Text size="sm" tone="secondary" className="whitespace-nowrap">
                {quantity}
              </Text>
            </div>
            <div className="mt-(--space-4) flex items-end justify-between gap-3">
              <div>
                <Text size="xs" tone="secondary">
                  {t("currentValue")}
                </Text>
                <Text size="lg" weight="semibold" tabular>
                  {money(holding.currentValue, locale)}
                </Text>
              </div>
              <div className="text-right">
                {hasPnl ? (
                  <>
                    <Text size="xs" tone="secondary">
                      {t("unrealized")}
                    </Text>
                    <Text
                      size="sm"
                      weight="semibold"
                      tone={
                        holding.unrealizedResult! >= ZERO_VALUE
                          ? "success"
                          : "danger"
                      }
                      tabular
                    >
                      {signedMoney(holding.unrealizedResult, locale)}
                    </Text>
                  </>
                ) : (
                  <Text size="sm" tone="secondary">
                    {t("insufficientData")}
                  </Text>
                )}
              </div>
            </div>
            {holding.historyStatus === "cost_basis_unknown" ? (
              <div className="mt-(--space-3) rounded-(--radius-control) bg-surface-muted px-(--space-3) py-(--space-2)">
                <Text size="xs" tone="secondary">
                  {t("missingBasisTag")}
                </Text>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
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
  const active = useMemo(
    () =>
      portfolio.activeHoldings
        .filter((holding) => {
          const matchesFilter =
            filter === InvestmentOverviewFilter.ALL ||
            holding.assetClass === filter;
          const text =
            `${holding.name} ${holding.symbol ?? ""} ${holding.providerCustodian ?? ""}`.toLowerCase();
          return matchesFilter && text.includes(query.trim().toLowerCase());
        })
        .sort(
          (a, b) =>
            (b.currentValue ?? ZERO_VALUE) - (a.currentValue ?? ZERO_VALUE),
        ),
    [filter, portfolio.activeHoldings, query],
  );
  const chartData = portfolio.allocationByAssetClass.map((row) => ({
    name: tUx(investmentUxConfig(row.assetClass).titleKey),
    value: row.valueVnd,
    share: row.shareBasisPoints / BASIS_POINTS_DIVISOR,
  }));

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="investment-overview-client"
    >
      <section
        className="rounded-(--radius-card) bg-surface-elevated p-(--space-5)"
        data-testid="investment-portfolio-summary"
      >
        <Text size="sm" tone="secondary">
          {t("portfolioSummary")}
        </Text>
        <Text size="lg" weight="semibold" className="mt-1">
          {t("currentValue")}
        </Text>
        <Text
          as="div"
          size="lg"
          weight="semibold"
          tabular
          className="mt-1 text-3xl"
        >
          {money(portfolio.totalCurrentValue, locale)}
        </Text>
        <div className="mt-(--space-5) grid grid-cols-2 gap-(--space-4) sm:grid-cols-4">
          <div>
            <Text size="xs" tone="secondary">
              {t("knownBasis")}
            </Text>
            <Text weight="semibold" tabular>
              {money(portfolio.totalRemainingCostBasis, locale)}
            </Text>
          </div>
          <div>
            <Text size="xs" tone="secondary">
              {t("unrealized")}
            </Text>
            <Text
              weight="semibold"
              tone={
                portfolio.unrealizedResult == null
                  ? "secondary"
                  : portfolio.unrealizedResult >= ZERO_VALUE
                    ? "success"
                    : "danger"
              }
              tabular
            >
              {signedMoney(portfolio.unrealizedResult, locale)}
            </Text>
          </div>
          <div>
            <Text size="xs" tone="secondary">
              {t("realized")}
            </Text>
            <Text weight="semibold" tabular>
              {signedMoney(portfolio.realizedSaleResult, locale)}
            </Text>
          </div>
          <div>
            <Text size="xs" tone="secondary">
              {t("income")}
            </Text>
            <Text weight="semibold" tabular>
              {money(portfolio.investmentIncome, locale)}
            </Text>
          </div>
        </div>
        {portfolio.incompleteBasisCount > ZERO_VALUE ? (
          <StatusAlert
            className="mt-(--space-4)"
            variant="warning"
            title={t("incompleteBasisAlert", {
              count: portfolio.incompleteBasisCount,
            })}
          />
        ) : null}
      </section>
      {chartData.length ? (
        <Section title={t("allocationTitle")}>
          <div className="grid gap-(--space-4) sm:grid-cols-[160px_1fr] sm:items-center">
            <div
              className="h-40"
              role="img"
              aria-label={t("allocationChartAria")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={INNER_CHART_RADIUS}
                    outerRadius={OUTER_CHART_RADIUS}
                    paddingAngle={CHART_PADDING_ANGLE}
                  >
                    {chartData.map((row, index) => (
                      <Cell
                        key={row.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => money(Number(value), locale)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <dl className="flex flex-col gap-(--space-2)">
              {chartData.map((row, index) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                      aria-hidden="true"
                    />
                    {row.name}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {formatPercent(row.share / PERCENT_DIVISOR, locale, {
                      maximumFractionDigits: PERCENT_DECIMAL_DIGITS,
                    })}{" "}
                    · {money(row.value, locale)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      ) : null}
      <Section title={t("holdingsTitle")}>
        <div className="flex flex-col gap-(--space-3)">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label={t("searchAria")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 flex-1 rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-focus-ring"
            />
            <div
              className="flex gap-1 overflow-x-auto"
              role="group"
              aria-label={t("filterAria")}
            >
              {INVESTMENT_OVERVIEW_FILTER_VALUES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                  className={`min-h-11 whitespace-nowrap rounded-(--radius-control) px-(--space-3) text-sm ${filter === item ? "bg-primary-soft text-accent" : "bg-surface-muted text-text-secondary"}`}
                >
                  {t(`filters.${item}`)}
                </button>
              ))}
            </div>
          </div>
          {active.length ? (
            <ul className="flex flex-col gap-(--space-3)">
              {active.map((holding) => (
                <PositionCard
                  key={holding.id}
                  holding={holding}
                  locale={locale}
                />
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="secondary">
              {t("noFilteredResults")}
            </Text>
          )}
        </div>
      </Section>
      {portfolio.closedHoldings.length ? (
        <Section
          title={t("closedSectionTitle", {
            count: portfolio.closedPositionCount,
          })}
        >
          <ul className="flex flex-col gap-(--space-3)">
            {portfolio.closedHoldings.map((holding) => (
              <li
                key={holding.id}
                className="rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Text weight="medium">
                      {holding.symbol || holding.name}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {holding.providerCustodian || t("noProvider")} ·{" "}
                      {t("closedStatus")}
                    </Text>
                  </div>
                  <Text size="sm" tone="secondary">
                    {formatNumber(Number(holding.quantity), locale)}
                  </Text>
                </div>
                <Text size="sm" tone="secondary" className="mt-2">
                  {t("closedDescription")}
                </Text>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <div className="grid grid-cols-2 gap-(--space-2)">
        <Link
          href={APP_PATH.MONEY_INVESTMENTS_NEW}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-(--space-3) text-sm font-medium text-accent-fg"
          data-testid="investment-opening-link"
        >
          {t("addOpening")}
        </Link>
        <Link
          href={APP_PATH.MONEY_INVESTMENTS_CONVERT}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary"
        >
          {t("convert")}
        </Link>
      </div>
    </div>
  );
}
