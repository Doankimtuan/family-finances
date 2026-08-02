"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Divider } from "@/shared/ui/divider";
import { Text } from "@/shared/ui/text";

export function DividerWithText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-(--space-3)", className)}>
      <Divider className="flex-1 bg-border-subtle" />
      <Text tone="muted" size="sm" className="shrink-0 font-medium">
        {children}
      </Text>
      <Divider className="flex-1 bg-border-subtle" />
    </div>
  );
}
