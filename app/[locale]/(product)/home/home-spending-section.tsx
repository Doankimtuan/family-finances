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
import { Progress } from "@/shared/ui/progress";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

export function HomeSpendingSection({
  metrics,
  currency,
  locale,
  canReviewUncategorized,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
  canReviewUncategorized: boolean;
}) {
  const t = useTranslations("home");
  if (metrics.spendingCategories.length === 0) return null;
  const description = metrics.spendingInsight
    ? t.rich(`spending.insight.${metrics.spendingInsight.kind}`, {
        amount: () => (
          <FinancialValue>
            {formatCurrency(
              metrics.spendingInsight?.amount ?? 0,
              currency,
              locale,
              { maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS },
            )}
          </FinancialValue>
        ),
      })
    : t("spending.hint");

  return (
    <KpiBlock
      title={t("spending.title")}
      description={
        <Text size="xs" tone="secondary" className="text-pretty">
          {description}
        </Text>
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
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-(--space-3) py-(--space-4) first:pt-0 last:pb-0"
            >
              <IconContainer
                tone={visual.tone}
                size="sm"
                className="opacity-80"
              >
                <AppIcon icon={visual.icon} size="sm" />
              </IconContainer>
              <div className="min-w-0">
                <Text
                  size="sm"
                  className="truncate font-medium text-text-primary"
                >
                  {categoryName}
                  {category.id == null && canReviewUncategorized ? (
                    <span className="ml-(--space-1) text-xs font-normal text-warning">
                      · {t("spending.reviewAvailable")}
                    </span>
                  ) : null}
                </Text>
                <Progress
                  value={category.progressPercent}
                  label={t("spending.share", {
                    category: categoryName,
                    percentage,
                  })}
                  showLabel={false}
                  className="mt-(--space-2)"
                  trackClassName="h-1 bg-surface-muted/75"
                  indicatorClassName="bg-expense/70"
                />
              </div>
              <div className="text-right">
                <Text
                  size="sm"
                  className="font-semibold tabular-nums text-text-primary"
                >
                  <FinancialValue>
                    {formatCurrency(category.amount, currency, locale, {
                      maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                    })}
                  </FinancialValue>
                </Text>
                <Text size="sm" tone="secondary" className="tabular-nums">
                  {percentage}
                </Text>
              </div>
              {category.id == null && canReviewUncategorized ? (
                <Link
                  href={APP_PATH.INBOX}
                  className="col-start-2 row-start-2 justify-self-start text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {t("spending.review")}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </KpiBlock>
  );
}
