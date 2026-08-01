"use client";

import {
  Skeleton as HeroSkeleton,
  type SkeletonProps as HeroSkeletonProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type SkeletonProps = HeroSkeletonProps;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <HeroSkeleton className={cn(className)} {...props} />;
}
