import Image from "next/image";
import { BRAND_ASSET_PATHS, BRAND_NAME } from "@/shared/constants/brand";
import { cn } from "@/shared/utils/cn";

const SIZE = {
  sm: "size-8",
  md: "size-14",
  lg: "size-16",
  xl: "size-20",
} as const;

export type BrandMarkSize = keyof typeof SIZE;
export type BrandMarkVariant = "mark" | "soft" | "plate" | "lockup";

export type BrandMarkProps = {
  size?: BrandMarkSize;
  /** mark — compact app mark; lockup — approved wordmark; soft/plate — app icon. */
  variant?: BrandMarkVariant;
  className?: string;
  /** When true (default), decorative aria-hidden. Set false for labeled landmark. */
  decorative?: boolean;
  title?: string;
};

/**
 * Family Finance approved mark for identity surfaces. Product controls still
 * use AppIcon for semantic actions and navigation.
 */
export function BrandMark({
  size = "md",
  variant = "soft",
  className,
  decorative = true,
  title = BRAND_NAME,
}: BrandMarkProps) {
  const box = variant === "mark" ? "size-10" : SIZE[size];
  const a11y = decorative
    ? ({ "aria-hidden": true as const } as const)
    : ({ role: "img" as const, "aria-label": title } as const);

  if (variant === "lockup") {
    return (
      <span {...a11y} className={cn("inline-flex w-full max-w-64", className)}>
        <Image
          src={BRAND_ASSET_PATHS.LOCKUP}
          alt=""
          width={700}
          height={600}
          className="h-auto w-full"
        />
      </span>
    );
  }

  return (
    <span
      {...a11y}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        variant === "mark" ? null : "overflow-hidden rounded-(--radius-card)",
        box,
        className,
      )}
    >
      <Image
        src={
          variant === "mark"
            ? BRAND_ASSET_PATHS.TRANSPARENT_MARK
            : BRAND_ASSET_PATHS.APP_ICON
        }
        alt=""
        width={450}
        height={400}
        className="size-full object-contain"
      />
    </span>
  );
}
