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
import { HomeMovementStrip } from "./home-movement-strip";
import { HomePeriodData } from "./home-period-transition";
import { HomeSpendingSection } from "./home-spending-section";

/**
 * Period movement and activity. Answers how income and spending moved, not
 * what cash is available. The chart is justified by that question only.
 */
export function HomePeriodStory({
  metrics,
  currency,
  locale,
  period,
  canReviewUncategorized,
  periodControl,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
  canReviewUncategorized: boolean;
  periodControl: ReactNode;
}) {
  const t = useTranslations("home");
  const hasCashFlow = metrics.income > 0 || metrics.expense > 0;

  return (
    <Section title={t("periodStory.title")} testId={HOME_TEST_ID.PERIOD_STORY}>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        {periodControl}
        <div className="my-(--space-4) border-t border-divider" />
        <HomePeriodData>
          <HomeMovementStrip
            metrics={metrics}
            currency={currency}
            locale={locale}
            period={period}
          />
          {hasCashFlow ? (
            <>
              <div className="my-(--space-4) border-t border-divider" />
              <HomeCashFlowSection
                metrics={metrics}
                currency={currency}
                locale={locale}
              />
              {metrics.spendingCategories.length > 0 ? (
                <>
                  <div className="my-(--space-4) border-t border-divider" />
                  <HomeSpendingSection
                    metrics={metrics}
                    currency={currency}
                    locale={locale}
                    canReviewUncategorized={canReviewUncategorized}
                  />
                </>
              ) : null}
            </>
          ) : (
            <>
              <div className="my-(--space-4) border-t border-divider" />
              <Text size="sm" tone="secondary" className="text-pretty">
                {t("periodStory.empty")}
              </Text>
            </>
          )}
        </HomePeriodData>
      </Card>
    </Section>
  );
}
