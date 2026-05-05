import { cn } from "@/lib/utils";
import type {
  SkeletonBlockProps,
  SkeletonLineProps,
  SkeletonGridProps,
} from "@/lib/loading/types";

export function SkeletonBlock({
  height = "h-32",
  width = "w-full",
  rounded = "rounded-2xl",
  className,
}: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "skeleton-shimmer shadow-sm",
        height,
        width,
        rounded,
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({
  width = "w-32",
  height = "h-4",
  className,
}: SkeletonLineProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded", width, height, className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonGrid({
  cols = 2,
  gap = "gap-3",
  children,
  className,
}: SkeletonGridProps) {
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[cols] || `grid-cols-${cols}`;

  return (
    <div
      className={cn("grid", gridColsClass, gap, className)}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
