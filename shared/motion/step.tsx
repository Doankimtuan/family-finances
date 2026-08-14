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

export function MotionStep({
  stepKey,
  direction = MotionStepDirection.FORWARD,
  children,
}: {
  stepKey: string;
  direction?: MotionStepDirectionValue;
  children: ReactNode;
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
