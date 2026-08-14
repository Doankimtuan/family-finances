"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionPolicy } from "./use-motion-policy";
import { springs } from "./tokens";
import { reducedRevealVariants, revealVariants } from "./variants";

export function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const policy = useMotionPolicy();
  const variants = policy.reducedMotion
    ? reducedRevealVariants
    : revealVariants;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial={policy.enabled ? "hidden" : false}
      whileInView={policy.enabled ? "visible" : undefined}
      exit="exit"
      viewport={{ once: true }}
      transition={{ ...springs.gentle, delay }}
    >
      {children}
    </motion.div>
  );
}
