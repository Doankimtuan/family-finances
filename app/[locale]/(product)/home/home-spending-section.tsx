import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatPercent } from "@/shared/i18n/formatters";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
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
  const insightPresentation = metrics.spendingInsight
    ? {
        icon:
          metrics.spendingInsight.kind === "higher"
            ? FINANCE_ICONS.expense
            : FINANCE_ICONS.income,
        tone: metrics.spendingInsight.kind === "higher" ? "danger" : "success",
      }
    : null;
  const description = metrics.spendingInsight
    ? t.rich(`spending.insight.${metrics.spendingInsight.kind}`, {
        amount: () => (
          <span
            className={`inline-flex items-center gap-(--space-1) ${
              insightPresentation?.tone === "danger"
                ? "text-danger"
                : "text-success"
            }`}
          >
            {insightPresentation ? (
              <AppIcon icon={insightPresentation.icon} size={AppIconSize.XS} />
            ) : null}
            <FinancialValue className="tabular-nums">
              {formatCurrency(
                metrics.spendingInsight?.amount ?? 0,
                currency,
                locale,
                { maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS },
              )}
            </FinancialValue>
          </span>
        ),
      })
    : t("spending.hint");

  return (
    <div
      className="flex flex-col gap-(--space-2)"
      data-testid={HOME_TEST_ID.SPENDING}
    >
      <Heading
        level={3}
        className="text-sm font-semibold tracking-normal text-text-primary"
      >
        {t("spending.title")}
      </Heading>
      <Text size="xs" tone="secondary" className="text-pretty">
        {description}
      </Text>
      <div
        id="home-cash-flow-breakdown"
        className="flex flex-col divide-y divide-divider"
      >
        {metrics.spendingCategories.map((category) => {
          const visual = categoryVisualFor({
            categoryId: category.id,
            categoryName: category.name,
          });
          const categoryName = category.name ?? t("spending.uncategorized");
          const percentage = formatPercent(category.proportion, locale, {
            maximumFractionDigits: 0,
          });
          const isUncategorized = category.id == null;

          return (
            <div
              key={category.id ?? visual.iconKey}
              className="grid grid-cols-[auto_minmax(0,1fr)_var(--financial-number-column-width)] items-center gap-(--space-3) py-(--space-3) first:pt-0 last:pb-0"
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
                <Progress
                  value={category.progressPercent}
                  label={t("spending.share", {
                    category: categoryName,
                    percentage,
                  })}
                  showLabel={false}
                  tone={visual.tone}
                  className="mt-(--space-2)"
                  trackClassName="h-1.5"
                />
                {isUncategorized && canReviewUncategorized ? (
                  <Link
                    href={APP_PATH.INBOX}
                    aria-label={t("spending.reviewAria", {
                      category: categoryName,
                    })}
                    className="mt-(--space-2) inline-flex min-h-9 w-fit items-center gap-(--space-1) rounded-full border border-warning/30 bg-warning/10 px-(--space-3) text-xs font-semibold text-warning transition-[background-color,transform] duration-(--duration-fast) hover:bg-warning/20 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    {t("spending.review")}
                    <AppIcon icon={ACTION_ICONS.forward} size="xs" />
                  </Link>
                ) : null}
              </div>
              <div className="min-w-0 tabular-nums text-right">
                <Text
                  size="sm"
                  className="font-semibold text-text-primary"
                  tabular
                >
                  <FinancialValue>
                    {formatCurrency(category.amount, currency, locale, {
                      maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                    })}
                  </FinancialValue>
                </Text>
                <Text size="xs" tone="muted" tabular>
                  {percentage}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
