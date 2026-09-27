"use client";

import {
  Skeleton as HeroSkeleton,
  type SkeletonProps as HeroSkeletonProps,
} from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export type SkeletonProps = HeroSkeletonProps;

/**
 * ViNha Base Skeleton.
 * Provides subtle 1.5s pulse animation, layout stability, and reduced-motion support.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <HeroSkeleton
      aria-hidden="true"
      className={cn(
        "bg-surface-muted/80 dark:bg-[#242428] animate-pulse motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export type SkeletonTextProps = ComponentProps<"div"> & {
  width?: "full" | "60%" | "80%" | "90%" | string;
};

/**
 * Skeleton placeholder for body and caption text lines:
 * Height: 14px, Radius: 4px.
 */
export function SkeletonText({
  width = "90%",
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn(
        "h-3.5 rounded-xs",
        width === "full" && "w-full",
        width === "60%" && "w-3/5",
        width === "80%" && "w-4/5",
        (width === "90%" || !["full", "60%", "80%"].includes(width)) &&
          "w-[90%]",
        className,
      )}
      {...props}
    />
  );
}

export type SkeletonMetricProps = ComponentProps<"div">;

/**
 * Skeleton placeholder for large KPI / financial balance numbers:
 * Height: 28px, Width: 140px, Radius: 6px.
 */
export function SkeletonMetric({ className, ...props }: SkeletonMetricProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn("h-7 w-[140px] rounded-sm", className)}
      {...props}
    />
  );
}

export type SkeletonIconProps = ComponentProps<"div"> & {
  size?: "sm" | "md" | "lg";
};

/**
 * Skeleton placeholder for category or instrument icons:
 * Default: 40×40px, Radius: 10px (--radius-control).
 */
export function SkeletonIcon({
  size = "md",
  className,
  ...props
}: SkeletonIconProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn(
        "rounded-(--radius-control) shrink-0",
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-14",
        className,
      )}
      {...props}
    />
  );
}

export type SkeletonCardProps = ComponentProps<"div">;

/**
 * Skeleton placeholder for financial card blocks:
 * Height: 120px, Radius: 12px (--radius-card), full container width.
 */
export function SkeletonCard({ className, ...props }: SkeletonCardProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn("h-[120px] w-full rounded-(--radius-card)", className)}
      {...props}
    />
  );
}

export type SkeletonAmountProps = ComponentProps<"div">;

/**
 * Skeleton placeholder for transaction and row monetary figures:
 * Height: 20px, Width: 100px, Radius: 4px.
 */
export function SkeletonAmount({ className, ...props }: SkeletonAmountProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn("h-5 w-[100px] rounded-xs", className)}
      {...props}
    />
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Metric = SkeletonMetric;
Skeleton.Icon = SkeletonIcon;
Skeleton.Card = SkeletonCard;
Skeleton.Amount = SkeletonAmount;
