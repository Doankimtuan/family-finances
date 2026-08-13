"use client";

import { useTranslations } from "next-intl";
import {
  HomeDashboardPeriod,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { Spinner } from "@/shared/ui/spinner";
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
          onPress={() => selectPeriod(HomeDashboardPeriod.MONTH)}
        >
          {t("periodControl.month")}
        </FilterChip>
        <FilterChip
          selected={optimisticPeriod === HomeDashboardPeriod.QUARTER}
          isDisabled={isPending}
          onPress={() => selectPeriod(HomeDashboardPeriod.QUARTER)}
        >
          {t("periodControl.quarter")}
        </FilterChip>
      </div>
      <div
        className="flex min-h-6 items-center"
        role="status"
        aria-live="polite"
        data-testid={HOME_TEST_ID.PERIOD_LOADING}
      >
        {isPending ? (
          <>
            <Spinner
              size="sm"
              color="accent"
              aria-label={t("periodControl.loading")}
            />
            <span className="sr-only">{t("periodControl.loading")}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
