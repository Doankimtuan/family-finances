"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  MotionStepDirection,
  motionTokens,
  type MotionStepDirection as MotionStepDirectionValue,
} from "./tokens";
import { useMotionPolicy } from "./use-motion-policy";
import { stepVariants } from "./variants";
import { cn } from "@/shared/utils/cn";

export function MotionStep({
  stepKey,
  direction = MotionStepDirection.FORWARD,
  children,
  className,
}: {
  stepKey: string;
  direction?: MotionStepDirectionValue;
  children: ReactNode;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const variants = stepVariants(
    direction,
    policy.reducedMotion || !policy.enabled,
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={stepKey}
        className={cn("min-h-0", className)}
        variants={variants}
        initial={policy.enabled ? "initial" : false}
        animate="animate"
        exit="exit"
        transition={
          policy.enabled
            ? {
                duration: motionTokens.duration.normal,
                ease: motionTokens.easing.standard,
              }
            : { duration: motionTokens.duration.instant }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
