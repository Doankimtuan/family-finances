"use client";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
export const StatusBadgeTone = {
  NEUTRAL: "neutral",
  POSITIVE: "positive",
  INFO: "info",
  WARNING: "warning",
  ATTENTION: "attention",
  SELECTED: "selected",
  SUCCESS: "success",
  DANGER: "danger",
  ERROR: "error",
} as const;

export type StatusBadgeTone =
  (typeof StatusBadgeTone)[keyof typeof StatusBadgeTone];

export const STATUS_BADGE_TONE_VALUES = [
  StatusBadgeTone.NEUTRAL,
  StatusBadgeTone.POSITIVE,
  StatusBadgeTone.INFO,
  StatusBadgeTone.WARNING,
  StatusBadgeTone.ATTENTION,
  StatusBadgeTone.SELECTED,
  StatusBadgeTone.SUCCESS,
  StatusBadgeTone.DANGER,
  StatusBadgeTone.ERROR,
] as const;

const toneClassName: Record<StatusBadgeTone, string> = {
  [StatusBadgeTone.NEUTRAL]: "bg-surface-muted text-text-secondary",
  [StatusBadgeTone.POSITIVE]: "bg-success/10 text-success",
  [StatusBadgeTone.SUCCESS]: "bg-success/10 text-success",
  [StatusBadgeTone.INFO]: "bg-info/10 text-info",
  [StatusBadgeTone.WARNING]: "bg-warning/10 text-warning",
  [StatusBadgeTone.ATTENTION]: "bg-danger/10 text-danger",
  [StatusBadgeTone.DANGER]: "bg-danger/10 text-danger",
  [StatusBadgeTone.ERROR]: "bg-danger/10 text-danger",
  [StatusBadgeTone.SELECTED]: "bg-primary-soft text-primary ring-1 ring-primary/20",
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
