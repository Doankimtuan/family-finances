"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/shared/utils/cn";

const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  display: 40,
} as const;

export type AppIconProps = {
  icon: IconSvgElement;
  size?: keyof typeof ICON_SIZES;
  emphasized?: boolean;
  label?: string;
  decorative?: boolean;
  className?: string;
};

/** The only low-level rendering boundary for Free Hugeicons. */
export function AppIcon({
  icon,
  size = "md",
  emphasized = false,
  label,
  decorative = !label,
  className,
}: AppIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={ICON_SIZES[size]}
      strokeWidth={emphasized ? 1.9 : 1.5}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
      role={decorative ? undefined : "img"}
      className={cn("shrink-0", className)}
    />
  );
}

export { ICON_SIZES };
