import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/**
 * Applies safe-area padding for notched devices.
 * Used on AppViewport chrome (top bar / bottom nav).
 */
export function SafeArea({
  children,
  className,
  edges = ["top", "bottom"],
}: {
  children: ReactNode;
  className?: string;
  edges?: Array<"top" | "right" | "bottom" | "left">;
}) {
  const padding: string[] = [];
  if (edges.includes("top")) padding.push("pt-[var(--safe-area-top)]");
  if (edges.includes("right")) padding.push("pr-[var(--safe-area-right)]");
  if (edges.includes("bottom")) padding.push("pb-[var(--safe-area-bottom)]");
  if (edges.includes("left")) padding.push("pl-[var(--safe-area-left)]");

  return <div className={cn(padding.join(" "), className)}>{children}</div>;
}
