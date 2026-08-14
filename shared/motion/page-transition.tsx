"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { motionTokens } from "./tokens";
import { useMotionPolicy } from "./use-motion-policy";
import { pageVariants, reducedPageVariants } from "./variants";

export function MotionPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const policy = useMotionPolicy();
  const variants = policy.reducedMotion ? reducedPageVariants : pageVariants;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial={policy.enabled ? "initial" : false}
        animate="enter"
        exit="exit"
        transition={{
          duration: policy.enabled
            ? motionTokens.duration.slow
            : motionTokens.duration.instant,
          ease: motionTokens.easing.standard,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
