"use client";

import { AnimatePresence, motion } from "motion/react";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { IconButton } from "@/shared/ui/icon-button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";

export const FinancialPrivacyToggleTone = {
  HERO: "hero",
  SURFACE: "surface",
} as const;

export type FinancialPrivacyToggleTone =
  (typeof FinancialPrivacyToggleTone)[keyof typeof FinancialPrivacyToggleTone];

type Props = {
  hideLabel: string;
  showLabel: string;
  testId: string;
  tone?: FinancialPrivacyToggleTone;
  className?: string;
};

const TONE_CLASS_NAME: Record<FinancialPrivacyToggleTone, string> = {
  [FinancialPrivacyToggleTone.HERO]:
    "border border-white/25 bg-white/10 text-hero-fg shadow-none hover:bg-white/20 focus-visible:outline-hero-fg",
  [FinancialPrivacyToggleTone.SURFACE]:
    "border border-border-subtle bg-surface text-text-primary shadow-none hover:bg-surface-hover",
};

/**
 * Shared hide/show control for financial amounts. Same privacy store as Home;
 * labels stay with the calling surface so each hub owns its copy.
 */
export function FinancialPrivacyToggle({
  hideLabel,
  showLabel,
  testId,
  tone = FinancialPrivacyToggleTone.HERO,
  className,
}: Props) {
  const { isHidden, toggle } = useFinancialPrivacy();
  const policy = useMotionPolicy({ essential: true });
  const label = isHidden ? showLabel : hideLabel;
  const swapScale = policy.reducedMotion ? 1 : motionTokens.scale.subtle;

  return (
    <IconButton
      aria-label={label}
      aria-pressed={isHidden}
      data-testid={testId}
      onPress={toggle}
      variant="tertiary"
      className={cn(TONE_CLASS_NAME[tone], "disabled:opacity-50", className)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isHidden ? "hidden" : "visible"}
          className="inline-flex items-center justify-center"
          initial={{ opacity: 0, scale: swapScale }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: swapScale }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.easing.standard,
          }}
        >
          <AppIcon
            icon={
              isHidden
                ? UTILITY_ICONS.financialHidden
                : UTILITY_ICONS.financialVisible
            }
            size={AppIconSize.MD}
          />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
