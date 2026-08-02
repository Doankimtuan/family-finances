import { cn } from "@/shared/utils/cn";

/** Cradle & Seed path — master geometry from artifacts/branding (viewBox 0 0 32). */
export const BRAND_MARK_PATH =
  "M6,18 L6,20 A10,10 0 0,0 26,20 L26,18 A2,2 0 0,0 22,18 L22,20 A6,6 0 0,1 10,20 L10,18 A2,2 0 0,0 6,18 Z M16,5 A4,4 0 1,1 16,13 A4,4 0 1,1 16,5 Z";

/** Deprecated alias for backwards compatibility. Points to the new Cradle & Seed path. */
export const TWIN_NEST_PATH = BRAND_MARK_PATH;

const SIZE = {
  sm: { box: "size-8", icon: 18 },
  md: { box: "size-14", icon: 28 },
  lg: { box: "size-16", icon: 32 },
  xl: { box: "size-20", icon: 40 },
} as const;

export type BrandMarkSize = keyof typeof SIZE;
export type BrandMarkVariant = "mark" | "soft" | "plate";

export type BrandMarkProps = {
  size?: BrandMarkSize;
  /**
   * mark — glyph only (currentColor)
   * soft — calm accent wash plate (auth / welcome)
   * plate — solid accent app-icon style
   */
  variant?: BrandMarkVariant;
  className?: string;
  /** When true (default), decorative aria-hidden. Set false for labeled landmark. */
  decorative?: boolean;
  title?: string;
};

/**
 * ViNha Cradle & Seed brand mark — single source for in-app brand identity.
 * Not for Phosphor UI chrome (nav, actions); identity surfaces only.
 */
export function BrandMark({
  size = "md",
  variant = "soft",
  className,
  decorative = true,
  title = "ViNha",
}: BrandMarkProps) {
  const { box, icon } = SIZE[size];
  const a11y = decorative
    ? ({ "aria-hidden": true as const } as const)
    : ({ role: "img" as const, "aria-label": title } as const);

  const glyph = (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...(decorative ? { "aria-hidden": true } : {})}
    >
      <path d={BRAND_MARK_PATH} />
    </svg>
  );

  if (variant === "mark") {
    return (
      <span {...a11y} className={cn("inline-flex text-accent", className)}>
        {glyph}
      </span>
    );
  }

  if (variant === "plate") {
    return (
      <div
        {...a11y}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-xl)]",
          "bg-accent text-accent-fg shadow-[var(--elevation-1)]",
          box,
          className,
        )}
      >
        {glyph}
      </div>
    );
  }

  // soft
  return (
    <div
      {...a11y}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-xl)]",
        "bg-accent/12 text-accent ring-1 ring-accent/25",
        "shadow-[0_0_24px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
        box,
        className,
      )}
    >
      {glyph}
    </div>
  );
}
