import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatPercent } from "@/shared/i18n/formatters";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { categoryVisualFor } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";

const DISTRIBUTION_TONES = [
  IconContainerTone.PRIMARY,
  IconContainerTone.INFO,
  IconContainerTone.INVESTMENT,
  IconContainerTone.DEBT,
] as const;

const DISTRIBUTION_TONE_CLASS = {
  [IconContainerTone.NEUTRAL]: "bg-progress-track",
  [IconContainerTone.PRIMARY]: "bg-primary",
  [IconContainerTone.INFO]: "bg-info",
  [IconContainerTone.INVESTMENT]: "bg-investment",
  [IconContainerTone.DEBT]: "bg-debt",
} satisfies Record<
  (typeof DISTRIBUTION_TONES)[number] | typeof IconContainerTone.NEUTRAL,
  string
>;

type SpendingDistributionItem = {
  key: string;
  label: string;
  amount: number;
  proportion: number;
  progressPercent: number;
  tone: DistributionTone;
};

type DistributionTone =
  (typeof DISTRIBUTION_TONES)[number] | typeof IconContainerTone.NEUTRAL;

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
  const distributionItems: SpendingDistributionItem[] =
    metrics.spendingCategories.map((category, index) => {
      const visual = categoryVisualFor({
        categoryId: category.id,
        categoryName: category.name,
        iconKey: category.iconKey,
      });
      return {
        key: category.id ?? visual.iconKey,
        label: category.name ?? t("spending.uncategorized"),
        amount: category.amount,
        proportion: category.proportion,
        progressPercent: category.progressPercent,
        tone: DISTRIBUTION_TONES[index],
      };
    });
  if (metrics.spendingRemainder) {
    distributionItems.push({
      key: t("spending.other"),
      label: t("spending.other"),
      ...metrics.spendingRemainder,
      tone: IconContainerTone.NEUTRAL,
    });
  }
  const insight = metrics.spendingInsight;
  const insightPresentation = insight
    ? {
        icon:
          insight.kind === "higher"
            ? FINANCE_ICONS.expense
            : FINANCE_ICONS.income,
        tone: insight.kind === "higher" ? "text-danger" : "text-success",
      }
    : null;
  const description = insight
    ? t.rich(`spending.insight.${insight.kind}`, {
        amount: () => (
          <span
            className={`inline-flex items-center gap-(--space-1) ${insightPresentation?.tone}`}
          >
            {insightPresentation ? (
              <AppIcon icon={insightPresentation.icon} size={AppIconSize.XS} />
            ) : null}
            <FinancialValue className="tabular-nums">
              {formatCurrency(insight.amount, currency, locale, {
                maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
              })}
            </FinancialValue>
          </span>
        ),
      })
    : null;

  return (
    <div
      className="flex flex-col gap-(--space-2) pt-(--space-2)"
      data-testid={HOME_TEST_ID.SPENDING}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <Heading
          level={3}
          className="text-sm font-semibold tracking-normal text-text-primary"
        >
          {t("spending.title")}
        </Heading>
      </div>
      {description ? (
        <Text size="xs" tone="secondary" className="text-pretty">
          {description}
        </Text>
      ) : null}
      <div
        id="home-cash-flow-breakdown"
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
        aria-hidden="true"
      >
        {distributionItems.map((item) => (
          <span
            key={item.key}
            className={DISTRIBUTION_TONE_CLASS[item.tone]}
            style={{ width: `${item.progressPercent}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-(--space-3) gap-y-(--space-2)">
        {distributionItems.map((item) => {
          const percentage = formatPercent(item.proportion, locale, {
            maximumFractionDigits: 0,
          });
          return (
            <div
              key={item.key}
              className="flex min-w-0 items-start gap-(--space-1)"
            >
              <span
                className={`mt-(--space-1) size-2 shrink-0 rounded-full ${DISTRIBUTION_TONE_CLASS[item.tone]}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <Text size="xs" className="text-pretty text-text-secondary">
                  <span className="font-medium">{item.label}:</span>{" "}
                  <span className="font-semibold tabular-nums text-text-primary">
                    {percentage}
                  </span>{" "}
                  <span className="tabular-nums text-text-muted">(</span>
                  <FinancialValue>
                    {formatCurrency(item.amount, currency, locale, {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    })}
                  </FinancialValue>
                  <span className="text-text-muted">)</span>
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
