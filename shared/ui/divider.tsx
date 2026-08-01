"use client";

import { Separator, type SeparatorProps } from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type DividerProps = SeparatorProps;

/** Design System Divider → HeroUI Separator */
export function Divider({ className, ...props }: DividerProps) {
  return <Separator className={cn(className)} {...props} />;
}
