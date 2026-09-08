import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { cn } from "@/shared/utils/cn";

/** 44×44px interactive target. Visual chrome stays on the inner pill. */
export const HERO_PILL_LINK_HIT_AREA_CLASS =
  "group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm font-medium text-hero-fg transition-[transform] duration-(--duration-fast) active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-fg";

/** Compact on-hero pill chrome. Does not define the touch target. */
export const HERO_PILL_LINK_VISUAL_CLASS =
  "inline-flex min-h-8 items-center gap-(--space-1) rounded-full border border-white/25 bg-white/10 px-(--space-3) transition-[background-color] duration-(--duration-fast) group-hover:bg-white/20 motion-reduce:transition-none";

type HeroPillLinkProps = ComponentProps<typeof Link>;

/**
 * On-hero compact pill link. The anchor is a 44×44px target; the visible
 * pill stays the existing compact treatment.
 */
export function HeroPillLink({
  children,
  className,
  ...props
}: HeroPillLinkProps) {
  return (
    <Link
      {...props}
      className={cn(HERO_PILL_LINK_HIT_AREA_CLASS, className)}
      prefetch={PRODUCT_LINK_PREFETCH}
    >
      <span className={HERO_PILL_LINK_VISUAL_CLASS}>{children}</span>
    </Link>
  );
}
