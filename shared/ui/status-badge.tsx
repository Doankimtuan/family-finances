import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export const StatusBadgeTone = {
  NEUTRAL: "neutral",
  POSITIVE: "positive",
  WARNING: "warning",
  DANGER: "danger",
  INFO: "info",
  GROWTH: "growth",
  SUCCESS: "success",
  ATTENTION: "attention",
  ERROR: "error",
  SELECTED: "selected",
} as const;

export type StatusBadgeTone =
  (typeof StatusBadgeTone)[keyof typeof StatusBadgeTone];

export const STATUS_BADGE_TONE_VALUES = [
  StatusBadgeTone.NEUTRAL,
  StatusBadgeTone.POSITIVE,
  StatusBadgeTone.WARNING,
  StatusBadgeTone.DANGER,
  StatusBadgeTone.INFO,
  StatusBadgeTone.GROWTH,
  StatusBadgeTone.SUCCESS,
  StatusBadgeTone.ATTENTION,
  StatusBadgeTone.ERROR,
  StatusBadgeTone.SELECTED,
] as const;

const TONE_STYLES: Record<StatusBadgeTone, string> = {
  positive: "bg-success/10 text-success border border-income/20",
  success: "bg-success/10 text-success border border-income/20",
  warning: "bg-warning/10 text-warning border border-warning/25",
  danger: "bg-danger/10 text-danger border border-debt/20",
  error: "bg-danger/10 text-danger border border-debt/20",
  attention: "bg-danger/10 text-danger border border-debt/20",
  info: "bg-info/10 text-info border border-transfer/20",
  growth: "bg-investment-soft text-investment border border-investment/20",
  neutral: "bg-surface-muted text-text-secondary border border-border-subtle",
  selected: "bg-primary-soft text-primary ring-1 ring-primary/20",
};

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  icon?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha StatusBadge primitive (Task 11 / Warm Precision).
 * High-legibility status pill adhering strictly to the 6 canonical domain tones.
 * Never communicates status through color alone (always pairs text + tone).
 */
export function StatusBadge({
  children,
  tone = StatusBadgeTone.NEUTRAL,
  icon,
  className,
  "data-testid": testId,
}: StatusBadgeProps) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.neutral;

  return (
    <span
      data-testid={testId}
      data-slot="status-badge"
      className={cn(
        "inline-flex h-5.5 min-h-[22px] max-w-full items-center gap-1 rounded-full px-2 text-[11px] font-semibold leading-none select-none tracking-tight",
        toneClass,
        className,
      )}
    >
      {icon ? <span className="flex shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}
