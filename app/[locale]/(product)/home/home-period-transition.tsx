"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
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
  HOME_PERIOD_SCROLL_KEY,
  HOME_TEST_ID,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "@/modules/home/application/home-constants";
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";
import { cn } from "@/shared/utils/cn";

function shellScrollRegion(): HTMLElement | null {
  const region = document.querySelector(
    `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
  );
  return region instanceof HTMLElement ? region : null;
}

function readShellScrollTop(): number {
  return shellScrollRegion()?.scrollTop ?? 0;
}

function restoreShellScrollTop(top: number): void {
  const region = shellScrollRegion();
  if (region) region.scrollTop = top;
}

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
    window.sessionStorage.setItem(
      HOME_PERIOD_SCROLL_KEY,
      String(readShellScrollTop()),
    );
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
        { scroll: false },
      );
    });
  };

  useLayoutEffect(() => {
    const raw = window.sessionStorage.getItem(HOME_PERIOD_SCROLL_KEY);
    if (raw == null) return;
    const top = Number(raw);
    if (!Number.isFinite(top)) {
      window.sessionStorage.removeItem(HOME_PERIOD_SCROLL_KEY);
      return;
    }

    restoreShellScrollTop(top);
    const frame = window.requestAnimationFrame(() => {
      restoreShellScrollTop(top);
      if (!isPending) {
        window.sessionStorage.removeItem(HOME_PERIOD_SCROLL_KEY);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isPending, period]);

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

/** Keeps period chrome mounted; only the figures inside refresh. */
export function HomePeriodData({ children }: { children: ReactNode }) {
  const { isPending } = useHomePeriodTransition();
  const t = useTranslations("home");

  return (
    <div aria-busy={isPending} data-testid={HOME_TEST_ID.PERIOD_CONTENT}>
      {isPending ? (
        <span
          role="status"
          aria-live="polite"
          className="sr-only"
          data-testid={HOME_TEST_ID.PERIOD_LOADING}
        >
          {t("periodControl.loading")}
        </span>
      ) : null}
      <div
        className={cn(
          "transition-opacity duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        {children}
      </div>
    </div>
  );
}
