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
  HOME_PERIOD_FOCUS_INTENT_KEY,
  HOME_PERIOD_FOCUS_QUERY,
  HOME_TEST_ID,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "@/modules/home/application/home-constants";
import { AnimatePresence, motion } from "motion/react";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";

type HomePeriodTransitionState = {
  isPending: boolean;
  optimisticPeriod: HomeDashboardPeriodValue;
  selectPeriod: (
    period: HomeDashboardPeriodValue,
    restoreFocus: boolean,
  ) => void;
};

const HomePeriodTransitionContext =
  createContext<HomePeriodTransitionState | null>(null);

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
    router.prefetch(
      alternatePeriod === HomeDashboardPeriod.MONTH
        ? APP_PATH.HOME
        : { pathname: APP_PATH.HOME, query: { period: alternatePeriod } },
    );
  }, [period, router]);

  const selectPeriod = (
    nextPeriod: HomeDashboardPeriodValue,
    restoreFocus: boolean,
  ) => {
    if (nextPeriod === optimisticPeriod || isPending) return;

    setPendingPeriod(nextPeriod);
    if (restoreFocus) {
      window.sessionStorage.setItem(HOME_PERIOD_FOCUS_INTENT_KEY, nextPeriod);
    }
    startTransition(() => {
      const query = {
        ...(nextPeriod === HomeDashboardPeriod.QUARTER
          ? { period: nextPeriod }
          : {}),
        ...(restoreFocus
          ? { [HOME_PERIOD_FOCUS_QUERY]: HOME_PERIOD_FOCUS_INTENT_KEY }
          : {}),
      };
      router.replace(
        Object.keys(query).length > 0
          ? { pathname: APP_PATH.HOME, query }
          : APP_PATH.HOME,
      );
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
        className="flex flex-col gap-(--space-5)"
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
            className="flex flex-col gap-(--space-5)"
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
