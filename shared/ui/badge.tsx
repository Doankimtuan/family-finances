"use client";

import {
  Badge as HeroBadge,
  type BadgeProps as HeroBadgeProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type BadgeProps = HeroBadgeProps;

export function Badge({ className, ...props }: BadgeProps) {
  return <HeroBadge className={cn(className)} {...props} />;
}

Badge.Label = HeroBadge.Label;
Badge.Anchor = HeroBadge.Anchor;
