"use client";

import type { ReactNode } from "react";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";
import { motionTokens, useMotionPolicy } from "@/shared/motion";

export function FinancialValue({
  children,
  className,
  dataTestId,
}: {
  children: ReactNode;
  className?: string;
  dataTestId?: string;
}) {
  const { isHidden } = useFinancialPrivacy();
  const policy = useMotionPolicy({ essential: true });
  const content = isHidden ? FINANCIAL_PRIVACY_MASK : children;
  const sharedClassName = cn(
    "tabular-nums",
    isHidden && "select-none",
    className,
  );

  // Privacy toggle crossfades the masked ↔ visible state; reduced motion and
  // low-end devices swap instantly.
  if (!policy.enabled) {
    return (
      <span className={sharedClassName} data-testid={dataTestId}>
        {content}
      </span>
    );
  }

  return (
    <motion.span
      key={isHidden ? "hidden" : "visible"}
      className={sharedClassName}
      data-testid={dataTestId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: motionTokens.duration.fast,
        ease: motionTokens.easing.standard,
      }}
    >
      {content}
    </motion.span>
  );
}
