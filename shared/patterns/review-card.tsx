import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";

export type ReviewCardProps = {
  title: ReactNode;
  kindLabel: ReactNode;
  amountLabel: string;
  /** Optional secondary context under the title */
  subtitle?: ReactNode;
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
  subtitle,
  className,
  "data-testid": testId,
}: ReviewCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 p-(--space-4)",
        className,
      )}
      data-testid={testId ?? "review-card"}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0 flex-1">
          <Text size="sm" className="truncate font-medium text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text size="sm" tone="secondary" className="truncate">
              {subtitle}
            </Text>
          ) : null}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
          {amountLabel}
        </span>
      </div>
      <StatusBadge className="w-fit truncate" data-testid="review-card-kind">
        {kindLabel}
      </StatusBadge>
    </div>
  );
}
