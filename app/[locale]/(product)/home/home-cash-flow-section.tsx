import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "@/modules/home/application/home-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";
import { HomeCashFlowChart } from "./home-cash-flow-chart";

export function HomeCashFlowSection({
  metrics,
  currency,
  locale,
  period,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
  period: HomeDashboardPeriodValue;
}) {
  const t = useTranslations("home");
  const summaryRows = [
    {
      key: "net",
      label: t("cashFlow.net"),
      amount: metrics.netCashFlow,
      tone: metrics.netCashFlow >= 0 ? "text-success" : "text-text-secondary",
      signed: true,
      available: metrics.hasTransactions,
    },
    {
      key: "income",
      label: t("cashFlow.income"),
      amount: metrics.income,
      tone: "text-text-primary",
      signed: false,
      available: true,
    },
    {
      key: "expense",
      label: t("cashFlow.expense"),
      amount: metrics.expense,
      tone: "text-text-primary",
      signed: false,
      available: true,
    },
  ] as const;

  return (
    <div
      id="home-cash-flow-summary"
      className="flex flex-col gap-(--space-4)"
      data-testid={HOME_TEST_ID.CASH_FLOW}
    >
      <dl
        className="grid grid-cols-3 gap-(--space-2) rounded-(--radius-card) bg-surface-muted/60 px-(--space-3) py-(--space-2)"
        aria-label={`${t("cashFlow.summaryLabel")}. ${t(`financialPulse.netLabel.${period}`)}`}
      >
        {summaryRows.map((row) => (
          <div key={row.key} className="min-w-0">
            <Text as="dt" size="xs" tone="secondary" className="truncate">
              {row.label}
            </Text>
            <Text
              as="dd"
              size="xs"
              weight="semibold"
              tabular
              className={`mt-(--space-1) truncate tracking-tight ${row.tone}`}
            >
              {row.available ? (
                <FinancialValue>
                  {formatCurrency(row.amount, currency, locale, {
                    maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                    ...(row.signed ? { signDisplay: "always" as const } : {}),
                  })}
                </FinancialValue>
              ) : (
                t("common.unavailable")
              )}
            </Text>
          </div>
        ))}
      </dl>
      <div id="home-cash-flow-trend" className="flex flex-col">
        <HomeCashFlowChart
          trend={metrics.trend}
          currency={currency}
          locale={locale}
        />
        <div
          className="flex flex-wrap justify-center gap-x-(--space-5) gap-y-(--space-2) py-(--space-2)"
          role="group"
          aria-label={t("cashFlow.legend.label")}
        >
          <span className="inline-flex items-center gap-(--space-2)">
            <span
              aria-hidden
              className="inline-block h-0.5 w-4 rounded-full bg-chart-positive"
            />
            <Text size="xs" tone="secondary">
              {t("cashFlow.legend.income")}
            </Text>
          </span>
          <span className="inline-flex items-center gap-(--space-2)">
            <span
              aria-hidden
              className="inline-block w-4 border-t-2 border-dashed border-chart-negative"
            />
            <Text size="xs" tone="secondary">
              {t("cashFlow.legend.expense")}
            </Text>
          </span>
        </div>
      </div>
    </div>
  );
}
