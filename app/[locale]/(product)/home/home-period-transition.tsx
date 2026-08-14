"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  HomeDashboardPeriod,
  HOME_TEST_ID,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "@/modules/home/application/home-constants";
import { Skeleton } from "@/shared/ui/skeleton";

type HomePeriodTransitionState = {
  isPending: boolean;
  optimisticPeriod: HomeDashboardPeriodValue;
  selectPeriod: (period: HomeDashboardPeriodValue) => void;
};

const HomePeriodTransitionContext =
  createContext<HomePeriodTransitionState | null>(null);

function homePathForPeriod(period: HomeDashboardPeriodValue) {
  return period === HomeDashboardPeriod.MONTH ? "" : `?period=${period}`;
}

export function HomePeriodTransition({
  period,
  children,
}: {
  period: HomeDashboardPeriodValue;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPeriod, setPendingPeriod] =
    useState<HomeDashboardPeriodValue | null>(null);
  const optimisticPeriod =
    isPending && pendingPeriod != null ? pendingPeriod : period;

  useEffect(() => {
    const alternatePeriod =
      period === HomeDashboardPeriod.MONTH
        ? HomeDashboardPeriod.QUARTER
        : HomeDashboardPeriod.MONTH;
    router.prefetch(`${APP_PATH.HOME}${homePathForPeriod(alternatePeriod)}`);
  }, [period, router]);

  const selectPeriod = (nextPeriod: HomeDashboardPeriodValue) => {
    if (nextPeriod === optimisticPeriod || isPending) return;

    setPendingPeriod(nextPeriod);
    startTransition(() => {
      router.replace(`${APP_PATH.HOME}${homePathForPeriod(nextPeriod)}`);
    });
  };

  return (
    <HomePeriodTransitionContext.Provider
      value={{ isPending, optimisticPeriod, selectPeriod }}
    >
      {children}
    </HomePeriodTransitionContext.Provider>
  );
}

export function useHomePeriodTransition() {
  const state = useContext(HomePeriodTransitionContext);
  if (state == null) {
    throw new Error(
      "Home period controls require a HomePeriodTransition parent.",
    );
  }
  return state;
}

/** Limits period loading feedback to the dashboard data that changes. */
export function HomePeriodData({ children }: { children: ReactNode }) {
  const { isPending } = useHomePeriodTransition();
  const t = useTranslations("home");

  return (
    <div
      className="flex flex-col gap-(--space-3)"
      aria-busy={isPending}
      data-testid={HOME_TEST_ID.PERIOD_CONTENT}
    >
      {isPending ? (
        <div
          className="flex flex-col gap-(--space-3)"
          role="status"
          aria-live="polite"
          data-testid={HOME_TEST_ID.PERIOD_LOADING}
        >
          <span className="sr-only">{t("periodControl.loading")}</span>
          <Skeleton className="h-56 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-72 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius-card)]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
