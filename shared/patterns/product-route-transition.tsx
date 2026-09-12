"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { usePathname } from "@/i18n/navigation";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";

export function ProductRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { enabled: motionEnabled, mounted } = useMotionPolicy();
  const isPrimaryTabRoute = TABS.some(({ href }) => href === pathname);
  const shouldAnimate = mounted && motionEnabled && isPrimaryTabRoute;

  return (
    <motion.div
      key={isPrimaryTabRoute ? pathname : undefined}
      className="flex min-h-0 flex-1 flex-col"
      initial={
        shouldAnimate ? { opacity: 0, y: motionTokens.distance.xs } : false
      }
      animate={{ opacity: 1, y: 0 }}
      transition={
        motionEnabled
          ? springs.snappy
          : { duration: motionTokens.duration.none }
      }
    >
      {children}
    </motion.div>
  );
}
