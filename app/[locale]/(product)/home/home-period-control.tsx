"use client";

import { useTranslations } from "next-intl";
import {
  HomeDashboardPeriod,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { useHomePeriodTransition } from "./home-period-transition";

export function HomePeriodControl() {
  const t = useTranslations("home");
  const { isPending, optimisticPeriod, selectPeriod } =
    useHomePeriodTransition();

  return (
    <div className="flex items-center gap-(--space-2)">
      <div
        className="flex items-center gap-(--space-2)"
        role="group"
        aria-label={t("periodControl.label")}
        aria-busy={isPending}
        data-testid={HOME_TEST_ID.PERIOD_CONTROL}
      >
        <FilterChip
          selected={optimisticPeriod === HomeDashboardPeriod.MONTH}
          isDisabled={isPending}
          data-testid={HOME_TEST_ID.PERIOD_MONTH}
          onPress={() => selectPeriod(HomeDashboardPeriod.MONTH)}
        >
          {t("periodControl.month")}
        </FilterChip>
        <FilterChip
          selected={optimisticPeriod === HomeDashboardPeriod.QUARTER}
          isDisabled={isPending}
          data-testid={HOME_TEST_ID.PERIOD_QUARTER}
          onPress={() => selectPeriod(HomeDashboardPeriod.QUARTER)}
        >
          {t("periodControl.quarter")}
        </FilterChip>
      </div>
    </div>
  );
}
