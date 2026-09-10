"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/utils/cn";
import {
  IconContainerTone,
  type IconContainerTone as IconContainerToneValue,
} from "./icon-container";
import { motionTokens } from "@/shared/motion/tokens";
import { useMotionPolicy } from "@/shared/motion/use-motion-policy";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";

const PROGRESS_INDICATOR_TONE_CLASS_NAME: Record<
  IconContainerToneValue,
  string
> = {
  [IconContainerTone.NEUTRAL]: "bg-border-strong/80",
  [IconContainerTone.PRIMARY]: "bg-primary/70",
  [IconContainerTone.INCOME]: "bg-income/70",
  [IconContainerTone.EXPENSE]: "bg-expense/70",
  [IconContainerTone.TRANSFER]: "bg-transfer/70",
  [IconContainerTone.INVESTMENT]: "bg-investment/70",
  [IconContainerTone.SAVINGS]: "bg-savings/70",
  [IconContainerTone.DEBT]: "bg-debt/70",
  [IconContainerTone.INFO]: "bg-info/70",
  [IconContainerTone.REFUND]: "bg-refund/70",
};

export type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  tone?: IconContainerToneValue;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  privacyAware?: boolean;
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
  tone = IconContainerTone.PRIMARY,
  className,
  trackClassName,
  indicatorClassName,
  privacyAware = false,
}: ProgressProps) {
  const policy = useMotionPolicy({ essential: true });
  const { isHidden } = useFinancialPrivacy();
  const privacyHidden = privacyAware && isHidden;
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ratio = clamped / safeMax;

  return (
    <div className={cn("flex w-full flex-col gap-(--space-2)", className)}>
      {label && showLabel ? (
        <span className="text-xs font-medium text-text-secondary">
          {privacyHidden ? FINANCIAL_PRIVACY_MASK : label}
        </span>
      ) : null}
      <div
        role="progressbar"
        aria-label={privacyHidden ? FINANCIAL_PRIVACY_MASK : label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={privacyHidden ? undefined : clamped}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-progress-track ring-1 ring-inset ring-border-subtle",
          trackClassName,
        )}
      >
        <motion.div
          className={cn(
            "h-full origin-left rounded-full",
            PROGRESS_INDICATOR_TONE_CLASS_NAME[tone],
            indicatorClassName,
          )}
          initial={false}
          animate={{ scaleX: privacyHidden ? 0 : ratio }}
          transition={{
            duration: policy.enabled
              ? motionTokens.duration.fast
              : motionTokens.duration.none,
            ease: motionTokens.easing.standard,
          }}
          data-slot="progress-indicator"
        />
      </div>
    </div>
  );
}
