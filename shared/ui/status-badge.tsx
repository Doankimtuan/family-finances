"use client";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
export type StatusBadgeTone =
  "neutral" | "positive" | "info" | "warning" | "attention" | "selected";
const toneClassName: Record<StatusBadgeTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  positive: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  attention: "bg-danger/10 text-danger",
  selected: "bg-primary-soft text-primary ring-1 ring-primary/20",
};
export function StatusBadge({
  children,
  tone = "neutral",
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 max-w-full items-center rounded-full px-(--space-2) text-xs font-semibold leading-tight",
        toneClassName[tone],
        className,
      )}
      data-slot="status-badge"
      data-testid={testId}
    >
      {children}
    </span>
  );
}
