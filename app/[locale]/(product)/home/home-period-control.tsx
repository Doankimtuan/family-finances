"use client";

import { useEffect, useId } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  HomeDashboardPeriod,
  HOME_PERIOD_FOCUS_INTENT_KEY,
  HOME_PERIOD_FOCUS_QUERY,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";
import { useHomePeriodTransition } from "./home-period-transition";

/** Surface segmented control for the dashboard period. */
export function HomePeriodControl({
  restoreFocus = false,
}: {
  restoreFocus?: boolean;
}) {
  const t = useTranslations("home");
  const thumbId = useId();
  const policy = useMotionPolicy();
  const { isPending, optimisticPeriod, selectPeriod } =
    useHomePeriodTransition();

  useEffect(() => {
    if (!restoreFocus) return;
    const query = new URLSearchParams(window.location.search);
    query.delete(HOME_PERIOD_FOCUS_QUERY);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query.toString() ? `?${query}` : ""}`,
    );
  }, [restoreFocus]);

  const segments = [
    {
      period: HomeDashboardPeriod.MONTH,
      label: t("periodControl.month"),
      testId: HOME_TEST_ID.PERIOD_MONTH,
    },
    {
      period: HomeDashboardPeriod.QUARTER,
      label: t("periodControl.quarter"),
      testId: HOME_TEST_ID.PERIOD_QUARTER,
    },
  ] as const;

  return (
    <div
      className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)"
      role="group"
      aria-label={t("periodControl.label")}
      aria-busy={isPending}
      data-testid={HOME_TEST_ID.PERIOD_CONTROL}
    >
      {segments.map((segment) => {
        const selected = optimisticPeriod === segment.period;
        const thumbClassName =
          "absolute inset-0 rounded-full bg-primary-soft shadow-(--elevation-1)";
        return (
          <button
            key={segment.period}
            type="button"
            aria-pressed={selected}
            disabled={isPending}
            autoFocus={restoreFocus && selected}
            data-testid={segment.testId}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                window.sessionStorage.setItem(
                  HOME_PERIOD_FOCUS_INTENT_KEY,
                  segment.period,
                );
              }
            }}
            onClick={(event) =>
              selectPeriod(
                segment.period,
                event.detail === 0 ||
                  window.sessionStorage.getItem(
                    HOME_PERIOD_FOCUS_INTENT_KEY,
                  ) === segment.period,
              )
            }
            className={cn(
              "relative flex min-h-11 flex-1 items-center justify-center rounded-full px-(--space-3) text-sm font-medium leading-tight transition-colors duration-(--duration-fast) ease-(--ease-standard) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none",
              selected
                ? "font-semibold text-primary"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              isPending && "cursor-not-allowed opacity-60",
            )}
          >
            {selected ? (
              policy.enabled ? (
                <motion.span
                  layoutId={thumbId}
                  className={thumbClassName}
                  transition={{
                    duration: motionTokens.duration.fast,
                    ease: motionTokens.easing.standard,
                  }}
                  aria-hidden="true"
                />
              ) : (
                <span className={thumbClassName} aria-hidden="true" />
              )
            ) : null}
            <span className="relative">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
