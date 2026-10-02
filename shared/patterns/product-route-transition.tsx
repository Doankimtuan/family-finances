"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { usePathname } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/shared-kernel/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";

export function ProductRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { enabled: motionEnabled, mounted } = useMotionPolicy();
  const isPrimaryProductRoute =
    pathname === APP_PATH.TOGETHER ||
    TABS.some(({ href }) => href === pathname);
  const shouldAnimate = mounted && motionEnabled && isPrimaryProductRoute;

  return (
    <motion.div
      key={isPrimaryProductRoute ? pathname : undefined}
      className="flex min-h-0 flex-1 flex-col"
      initial={
        shouldAnimate
          ? { opacity: motionTokens.opacity.transitionStart }
          : false
      }
      animate={{ opacity: 1 }}
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
