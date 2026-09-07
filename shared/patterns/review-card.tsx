import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Card } from "./card";

export const ReviewCardDensity = {
  CARD: "card",
  ROW: "row",
} as const;

export type ReviewCardDensity =
  (typeof ReviewCardDensity)[keyof typeof ReviewCardDensity];

export const REVIEW_CARD_TEST_ID = {
  ROOT: "review-card",
  KIND: "review-card-kind",
  UNREAD: "review-card-unread",
} as const;

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
  density?: ReviewCardDensity;
  showChevron?: boolean;
  unread?: boolean;
  className?: string;
  "data-testid"?: string;
};

function UnreadCue() {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-primary"
      data-testid={REVIEW_CARD_TEST_ID.UNREAD}
      aria-hidden
    />
  );
}

function ReviewAmount({ children }: { children: ReactNode }) {
  return (
    <span className="min-w-[var(--financial-number-column-width)] text-right text-sm font-semibold tabular-nums tracking-tight wrap-break-word text-text-primary">
      {children}
    </span>
  );
}

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
  statusTone = StatusBadgeTone.NEUTRAL,
  actionLabel,
  density = ReviewCardDensity.CARD,
  showChevron = false,
  unread = false,
  className,
  "data-testid": testId,
}: ReviewCardProps) {
  if (density === ReviewCardDensity.ROW) {
    return (
      <div
        className={cn(
          "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3)",
          "transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100",
          className,
        )}
        data-testid={testId ?? REVIEW_CARD_TEST_ID.ROOT}
      >
        {leading}
        <div className="min-w-0 flex-1">
          <Text
            size="sm"
            weight="semibold"
            className="truncate text-text-primary"
          >
            {title}
          </Text>
          <Text
            as="p"
            size="xs"
            tone="muted"
            className="mt-(--space-1) truncate leading-snug"
          >
            <span data-testid={REVIEW_CARD_TEST_ID.KIND}>{kindLabel}</span>
            {subtitle ? <span> · {subtitle}</span> : null}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-(--space-2)">
          <ReviewAmount>{amountLabel}</ReviewAmount>
          {unread ? <UnreadCue /> : null}
          {showChevron ? (
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.SM}
              className="text-text-tertiary"
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Card
      tone="elevated"
      className={cn(
        "flex min-h-11 flex-col gap-(--space-3) p-(--space-4)",
        "transition-[background-color,border-color,transform,box-shadow] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover hover:shadow-[var(--elevation-2)] active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId ?? REVIEW_CARD_TEST_ID.ROOT}
    >
      <div className="flex items-start gap-(--space-3)">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-(--space-2)">
            {unread ? <UnreadCue /> : null}
            <Text
              size="sm"
              weight="semibold"
              className="wrap-break-word text-text-primary"
            >
              {title}
            </Text>
          </div>
          {subtitle ? (
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) wrap-break-word text-pretty"
            >
              {subtitle}
            </Text>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-(--space-2)">
          <ReviewAmount>{amountLabel}</ReviewAmount>
          {showChevron ? (
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.SM}
              className="mt-(--space-1) text-text-tertiary"
            />
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-(--space-3)">
        <StatusBadge
          tone={statusTone}
          className="max-w-[70%] truncate"
          data-testid={REVIEW_CARD_TEST_ID.KIND}
        >
          {kindLabel}
        </StatusBadge>
        {actionLabel ? (
          <span className="shrink-0 text-xs font-semibold text-text-secondary">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
