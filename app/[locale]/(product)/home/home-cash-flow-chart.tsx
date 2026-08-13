"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type {
  HomeCashFlowTrend,
  HomeCashFlowTrendPoint,
} from "@/modules/home/application/home-dashboard-metrics";
import {
  HOME_CASH_FLOW_CHART_ACTIVE_DOT_RADIUS,
  HOME_CASH_FLOW_CHART_AREA_OPACITY,
  HOME_CASH_FLOW_CHART_HEIGHT,
  HOME_CASH_FLOW_CHART_MARGIN,
  HOME_CASH_FLOW_CHART_STROKE_WIDTH,
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { Text } from "@/shared/ui/text";

const CASH_FLOW_CHART_DATE_OPTIONS = {
  month: "short",
  day: "numeric",
} satisfies Intl.DateTimeFormatOptions;

function dateFromStorageValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatTrendDate(value: string, locale: string) {
  return formatDate(
    dateFromStorageValue(value),
    locale,
    CASH_FLOW_CHART_DATE_OPTIONS,
  );
}

function formatTrendDateRange(point: HomeCashFlowTrendPoint, locale: string) {
  const start = formatTrendDate(point.startDate, locale);
  if (point.startDate === point.endDate) return start;
  return `${start} – ${formatTrendDate(point.endDate, locale)}`;
}

export function HomeCashFlowChart({
  trend,
  currency,
  locale,
}: {
  trend: HomeCashFlowTrend;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("home");
  const gradientId = useId().replace(/:/g, "");
  const chartSummaryId = `${gradientId}-summary`;
  const hasSparseData = trend.activePointCount <= 1;

  return (
    <div
      className="rounded-[var(--radius-control)] bg-surface-elevated/70 px-(--space-2) pb-(--space-2) pt-(--space-3)"
      data-testid={HOME_TEST_ID.CASH_FLOW_CHART}
    >
      <div
        className="w-full"
        style={{ height: HOME_CASH_FLOW_CHART_HEIGHT }}
        role="img"
        aria-describedby={chartSummaryId}
        aria-label={t(`cashFlow.chartAria.${trend.granularity}`)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend.points}
            margin={{
              top: HOME_CASH_FLOW_CHART_MARGIN.TOP,
              right: HOME_CASH_FLOW_CHART_MARGIN.RIGHT,
              left: HOME_CASH_FLOW_CHART_MARGIN.LEFT,
              bottom: HOME_CASH_FLOW_CHART_MARGIN.BOTTOM,
            }}
          >
            <defs>
              <linearGradient
                id={`${gradientId}-income`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-chart-positive)"
                  stopOpacity={HOME_CASH_FLOW_CHART_AREA_OPACITY.INCOME}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-chart-positive)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id={`${gradientId}-expense`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-chart-negative)"
                  stopOpacity={HOME_CASH_FLOW_CHART_AREA_OPACITY.EXPENSE}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-chart-negative)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeOpacity={0.55}
            />
            <XAxis
              dataKey="startDate"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
              tickFormatter={(value: string) => formatTrendDate(value, locale)}
            />
            <Tooltip
              cursor={{
                stroke: "var(--color-border-strong)",
                strokeOpacity: 0.7,
              }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  HomeCashFlowTrendPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div
                    className="min-w-40 rounded-[var(--radius-control)] border border-border-subtle bg-surface-elevated px-(--space-3) py-(--space-2) shadow-[var(--elevation-1)]"
                    data-testid={HOME_TEST_ID.CASH_FLOW_TOOLTIP}
                    role="status"
                    aria-live="polite"
                  >
                    <Text size="sm" tone="secondary">
                      {formatTrendDateRange(point, locale)}
                    </Text>
                    <div className="mt-(--space-2) grid grid-cols-[1fr_auto] gap-x-(--space-4) gap-y-(--space-1)">
                      <Text size="sm" className="text-income">
                        {t("cashFlow.income")}
                      </Text>
                      <Text size="sm" className="font-semibold tabular-nums">
                        {formatCurrency(point.income, currency, locale, {
                          maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                        })}
                      </Text>
                      <Text size="sm" className="text-expense">
                        {t("cashFlow.expense")}
                      </Text>
                      <Text size="sm" className="font-semibold tabular-nums">
                        {formatCurrency(point.expense, currency, locale, {
                          maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                        })}
                      </Text>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="linear"
              dataKey="income"
              name={t("cashFlow.income")}
              stroke="var(--color-chart-positive)"
              strokeWidth={HOME_CASH_FLOW_CHART_STROKE_WIDTH}
              fill={`url(#${gradientId}-income)`}
              activeDot={{
                r: HOME_CASH_FLOW_CHART_ACTIVE_DOT_RADIUS,
                fill: "var(--color-chart-positive)",
              }}
              isAnimationActive={false}
            />
            <Area
              type="linear"
              dataKey="expense"
              name={t("cashFlow.expense")}
              stroke="var(--color-chart-negative)"
              strokeWidth={HOME_CASH_FLOW_CHART_STROKE_WIDTH}
              fill={`url(#${gradientId}-expense)`}
              activeDot={{
                r: HOME_CASH_FLOW_CHART_ACTIVE_DOT_RADIUS,
                fill: "var(--color-chart-negative)",
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Text
        id={chartSummaryId}
        size="sm"
        tone="secondary"
        className="px-(--space-1)"
      >
        {hasSparseData
          ? t("cashFlow.lowData")
          : t(`cashFlow.chartSummary.${trend.granularity}`)}
      </Text>
    </div>
  );
}
