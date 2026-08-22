"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
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
import { AnimatePresence, motion } from "motion/react";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";

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
  const focusPeriod = useRef<HomeDashboardPeriodValue | null>(null);
  const optimisticPeriod =
    isPending && pendingPeriod != null ? pendingPeriod : period;

  useEffect(() => {
    const selectedPeriod = focusPeriod.current;
    if (selectedPeriod == null || isPending) return;

    if (selectedPeriod === period) {
      const testId =
        selectedPeriod === HomeDashboardPeriod.MONTH
          ? HOME_TEST_ID.PERIOD_MONTH
          : HOME_TEST_ID.PERIOD_QUARTER;
      const selectedControl = document.querySelector<HTMLElement>(
        `[data-testid="${testId}"]`,
      );
      selectedControl?.focus();
    }

    focusPeriod.current = null;
  }, [isPending, period]);

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
    focusPeriod.current = nextPeriod;
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
export function HomePeriodData({
  children,
  period,
}: {
  children: ReactNode;
  period: HomeDashboardPeriodValue;
}) {
  const { isPending } = useHomePeriodTransition();
  const t = useTranslations("home");
  const policy = useMotionPolicy();
  const loading = (
    <div
      role="status"
      aria-live="polite"
      data-testid={HOME_TEST_ID.PERIOD_LOADING}
    >
      <span className="sr-only">{t("periodControl.loading")}</span>
      <HomeDashboardSkeleton />
    </div>
  );

  if (!policy.mounted || !policy.enabled) {
    return (
      <div
        className="flex flex-col gap-(--space-6)"
        aria-busy={isPending}
        data-testid={HOME_TEST_ID.PERIOD_CONTENT}
      >
        {isPending ? loading : children}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3)"
      aria-busy={isPending}
      data-testid={HOME_TEST_ID.PERIOD_CONTENT}
    >
      <AnimatePresence initial={false} mode="wait">
        {isPending ? (
          <motion.div
            key={HOME_TEST_ID.PERIOD_LOADING}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: motionTokens.duration.fast,
              ease: motionTokens.easing.standard,
            }}
          >
            {loading}
          </motion.div>
        ) : (
          <motion.div
            key={period}
            className="flex flex-col gap-(--space-6)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: motionTokens.duration.fast,
              ease: motionTokens.easing.standard,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
