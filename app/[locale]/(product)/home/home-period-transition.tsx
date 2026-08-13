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
import { Spinner } from "@/shared/ui/spinner";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

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

/** Keeps the previous period stable while signaling that its data is refreshing. */
export function HomePeriodData({ children }: { children: ReactNode }) {
  const { isPending } = useHomePeriodTransition();
  const t = useTranslations("home");

  return (
    <div
      className="relative"
      aria-busy={isPending}
      data-testid={HOME_TEST_ID.PERIOD_CONTENT}
    >
      <div
        className={cn(
          "flex flex-col gap-(--space-3) transition-opacity duration-(--duration-fast) motion-reduce:transition-none",
          isPending && "opacity-45",
        )}
      >
        {children}
      </div>
      {isPending ? (
        <div
          className="absolute inset-0 z-10 flex flex-col gap-(--space-3) rounded-[var(--radius-card)] bg-canvas/88 p-(--space-4)"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-(--space-2)">
            <Spinner
              size="sm"
              color="accent"
              aria-label={t("periodControl.loading")}
            />
            <Text size="sm" tone="secondary">
              {t("periodControl.loading")}
            </Text>
          </div>
          <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-control)]" />
          <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        </div>
      ) : null}
    </div>
  );
}
