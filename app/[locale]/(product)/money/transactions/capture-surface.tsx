import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { cn } from "@/shared/utils/cn";

type CaptureSurfaceProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
};

/**
 * Elevated grouping surface for capture form sections. Presentation only.
 */
export function CaptureSurface({
  children,
  className,
  testId,
}: CaptureSurfaceProps) {
  return (
    <Card
      tone="elevated"
      className={cn("gap-(--space-3) p-(--space-4)", className)}
      data-testid={testId}
    >
      {children}
    </Card>
  );
}
