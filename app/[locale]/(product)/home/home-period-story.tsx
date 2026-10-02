import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_TEST_ID,
  type HomeDashboardPeriod,
} from "@/modules/home/application/home-constants";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { HomeCashFlowSection } from "./home-cash-flow-section";
import { HomePeriodData } from "./home-period-transition";
import { HomeSpendingSection } from "./home-spending-section";

export function HomePeriodStory({
  metrics,
  currency,
  locale,
  period,
  periodControl,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
  periodControl: ReactNode;
}) {
  const t = useTranslations("home");
  const hasCashFlow = metrics.income > 0 || metrics.expense > 0;

  return (
    <Section testId={HOME_TEST_ID.PERIOD_STORY}>
      <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-(--space-3)">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {t("cashFlow.title")}
            </h2>
            <Text size="xs" tone="secondary">
              {t("cashFlow.summaryHint")}
            </Text>
          </div>
          {periodControl}
        </div>

        <HomePeriodData>
          {hasCashFlow ? (
            <>
              <HomeCashFlowSection
                metrics={metrics}
                currency={currency}
                locale={locale}
                period={period}
              />
              {metrics.spendingCategories.length > 0 ? (
                <>
                  <div className="border-t border-divider" />
                  <HomeSpendingSection
                    metrics={metrics}
                    currency={currency}
                    locale={locale}
                  />
                </>
              ) : null}
            </>
          ) : (
            <Text size="sm" tone="secondary" className="text-pretty">
              {t("periodStory.empty")}
            </Text>
          )}
        </HomePeriodData>
      </Card>
    </Section>
  );
}
