"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/shared/utils/cn";

export const AppIconSize = {
  XS: "xs",
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
  DISPLAY: "display",
} as const;

export type AppIconSize = (typeof AppIconSize)[keyof typeof AppIconSize];

export const APP_ICON_SIZE_VALUES = [
  AppIconSize.XS,
  AppIconSize.SM,
  AppIconSize.MD,
  AppIconSize.LG,
  AppIconSize.XL,
  AppIconSize.DISPLAY,
] as const;

const ICON_SIZES: Record<AppIconSize, number> = {
  [AppIconSize.XS]: 14,
  [AppIconSize.SM]: 16,
  [AppIconSize.MD]: 20,
  [AppIconSize.LG]: 24,
  [AppIconSize.XL]: 32,
  [AppIconSize.DISPLAY]: 40,
};

export type AppIconProps = {
  icon: IconSvgElement;
  size?: AppIconSize;
  emphasized?: boolean;
  label?: string;
  decorative?: boolean;
  className?: string;
};

/** The only low-level rendering boundary for Free Hugeicons. */
export function AppIcon({
  icon,
  size = AppIconSize.MD,
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
