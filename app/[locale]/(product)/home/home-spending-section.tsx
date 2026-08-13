import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatPercent } from "@/shared/i18n/formatters";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { categoryVisualFor } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";

export function HomeSpendingSection({
  metrics,
  currency,
  locale,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("home");
  if (metrics.spendingCategories.length === 0) return null;

  return (
    <KpiBlock
      title={t("spending.title")}
      description={
        metrics.spendingInsight
          ? t(`spending.insight.${metrics.spendingInsight.kind}`, {
              amount: formatCurrency(
                metrics.spendingInsight.amount,
                currency,
                locale,
                { maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS },
              ),
            })
          : t("spending.hint")
      }
      variant="plain"
      data-testid={HOME_TEST_ID.SPENDING}
    >
      <div className="flex flex-col divide-y divide-border-subtle">
        {metrics.spendingCategories.map((category) => {
          const visual = categoryVisualFor({
            categoryId: category.id,
            categoryName: category.name,
          });
          const categoryName = category.name ?? t("spending.uncategorized");
          const percentage = formatPercent(category.proportion, locale, {
            maximumFractionDigits: 0,
          });

          return (
            <div
              key={category.id ?? visual.iconKey}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-(--space-3) py-(--space-3) first:pt-0 last:pb-0"
            >
              <IconContainer tone={visual.tone} size="sm">
                <AppIcon icon={visual.icon} size="sm" />
              </IconContainer>
              <div className="min-w-0">
                <Text
                  size="sm"
                  className="truncate font-medium text-text-primary"
                >
                  {categoryName}
                </Text>
                <div
                  className="mt-(--space-2) h-1.5 overflow-hidden rounded-full bg-surface-muted"
                  role="progressbar"
                  aria-label={t("spending.share", {
                    category: categoryName,
                    percentage,
                  })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={category.progressPercent}
                >
                  <div
                    className="h-full rounded-full bg-expense"
                    style={{ width: `${category.progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <Text
                  size="sm"
                  className="font-semibold tabular-nums text-text-primary"
                >
                  {formatCurrency(category.amount, currency, locale, {
                    maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                  })}
                </Text>
                <Text size="sm" tone="secondary" className="tabular-nums">
                  {percentage}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </KpiBlock>
  );
}
