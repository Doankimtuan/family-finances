"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  HomeDashboardPeriod,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";
import { useHomePeriodTransition } from "./home-period-transition";

/** On-hero segmented control for the dashboard period. */
export function HomePeriodControl() {
  const t = useTranslations("home");
  const thumbId = useId();
  const policy = useMotionPolicy();
  const { isPending, optimisticPeriod, selectPeriod } =
    useHomePeriodTransition();

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
      className="flex gap-(--space-1) rounded-full bg-black/20 p-(--space-1)"
      role="group"
      aria-label={t("periodControl.label")}
      aria-busy={isPending}
      data-testid={HOME_TEST_ID.PERIOD_CONTROL}
    >
      {segments.map((segment) => {
        const selected = optimisticPeriod === segment.period;
        const thumbClassName =
          "absolute inset-0 rounded-full bg-hero-fg shadow-(--elevation-1)";
        return (
          <button
            key={segment.period}
            type="button"
            aria-pressed={selected}
            disabled={isPending}
            data-testid={segment.testId}
            onClick={() => selectPeriod(segment.period)}
            className={cn(
              "relative flex min-h-9 flex-1 items-center justify-center rounded-full px-(--space-3) text-sm font-medium leading-tight transition-colors duration-(--duration-fast) ease-(--ease-standard) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-fg motion-reduce:transition-none",
              selected
                ? "font-semibold text-hero-deep"
                : "text-hero-muted hover:bg-white/10 hover:text-hero-fg",
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
