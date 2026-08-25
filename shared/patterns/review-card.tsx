import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge, type StatusBadgeTone } from "@/shared/ui/status-badge";

export type ReviewCardProps = {
  title: ReactNode;
  kindLabel: ReactNode;
  amountLabel: ReactNode;
  /** Optional leading semantic identity for the item. */
  leading?: ReactNode;
  /** Optional secondary context under the title. */
  subtitle?: ReactNode;
  /** Semantic emphasis for the kind/status badge. */
  statusTone?: StatusBadgeTone;
  /** Quiet next-step cue; the surrounding link remains the action target. */
  actionLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Inbox ReviewItem decision card — one item, one decision (AC-005 / BR-05).
 * Partners share resolve rights (AC-020); pattern itself is presentational.
 */
export function ReviewCard({
  title,
  kindLabel,
  amountLabel,
  leading,
  subtitle,
  statusTone = "neutral",
  actionLabel,
  className,
  "data-testid": testId,
}: ReviewCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface p-(--space-3) shadow-[var(--elevation-1)] transition-[background-color,border-color,transform,box-shadow] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover hover:shadow-[var(--elevation-2)] active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId ?? "review-card"}
    >
      <div className="flex items-start gap-(--space-3)">
        {leading}
        <div className="min-w-0 flex-1">
          <Text
            size="sm"
            className="wrap-break-word font-semibold text-text-primary"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) wrap-break-word"
            >
              {subtitle}
            </Text>
          ) : null}
        </div>
        <span className="shrink-0 text-right text-sm font-semibold tabular-nums tracking-tight text-text-primary">
          {amountLabel}
        </span>
      </div>
      <div className="flex items-center justify-between gap-(--space-3)">
        <StatusBadge
          tone={statusTone}
          className="max-w-[70%] truncate"
          data-testid="review-card-kind"
        >
          {kindLabel}
        </StatusBadge>
        {actionLabel ? (
          <span className="shrink-0 text-xs font-semibold text-text-secondary">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
