"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/utils/cn";
import { motionTokens } from "@/shared/motion/tokens";
import { useMotionPolicy } from "@/shared/motion/use-motion-policy";

export type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
};

/**
 * Design System Progress — deterministic step progress for onboard.
 * Native bar (HeroUI v3 has no Progress export in this project).
 */
export function Progress({
  value,
  max = 100,
  label,
  showLabel = true,
  className,
  trackClassName,
  indicatorClassName,
}: ProgressProps) {
  const policy = useMotionPolicy({ essential: true });
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ratio = clamped / safeMax;

  return (
    <div className={cn("flex w-full flex-col gap-(--space-2)", className)}>
      {label && showLabel ? (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      ) : null}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-border-subtle",
          trackClassName,
        )}
      >
        <motion.div
          className={cn(
            "h-full origin-left rounded-full bg-accent",
            indicatorClassName,
          )}
          initial={false}
          animate={{ scaleX: ratio }}
          transition={{
            duration: policy.enabled
              ? motionTokens.duration.fast
              : motionTokens.duration.instant,
            ease: motionTokens.easing.standard,
          }}
          data-slot="progress-indicator"
        />
      </div>
    </div>
  );
}
