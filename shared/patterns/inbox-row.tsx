import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";
import { Card } from "./card";

export type InboxAccent = "amber" | "violet" | "rose" | "teal" | "neutral";

export type InboxRowProps = {
  presentation?: "row" | "card";
  accent?: InboxAccent;
  urgency?: "urgent" | "high" | "medium" | "low" | string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  categoryBadge?: ReactNode;
  urgencyLabel?: ReactNode;
  impactAmount?: number | string;
  impactAmountContent?: ReactNode;
  currency?: string;
  action?: ReactNode;
  actionLabel?: ReactNode;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  unread?: boolean;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

const ACCENT_BAR_CLASSES: Record<InboxAccent, string> = {
  amber: "bg-warning",
  violet: "bg-investment",
  rose: "bg-debt",
  teal: "bg-primary",
  neutral: "bg-border-strong",
};

/** Shared decision row with compact and card presentations. */
export function InboxRow({
  presentation = "row",
  accent,
  urgency,
  leading,
  title,
  subtitle,
  categoryBadge,
  urgencyLabel,
  impactAmount,
  impactAmountContent,
  currency = "₫",
  action,
  actionLabel,
  href,
  onClick,
  onPress,
  disabled = false,
  unread = false,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: InboxRowProps) {
  const isInteractive = Boolean(href || onClick || onPress) && !disabled;
  const isLink = Boolean(href) && !disabled;
  const handleAction = onClick ?? onPress;

  const numImpact = typeof impactAmount === "number" ? impactAmount : undefined;
  const labelImpact =
    typeof impactAmount === "string" ? impactAmount : undefined;
  const amount =
    impactAmountContent !== undefined ? (
      impactAmountContent
    ) : impactAmount !== undefined ? (
      <FinancialAmount
        value={numImpact}
        amountLabel={labelImpact}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={FinancialAmountTone.NEUTRAL}
        privacyAware
      />
    ) : null;

  const resolvedAccent: InboxAccent =
    accent ??
    (urgency === "urgent" || urgency === "high"
      ? "rose"
      : urgency === "medium"
        ? "amber"
        : urgency === "low"
          ? "teal"
          : "amber");

  const identity = (
    <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          {categoryBadge ? (
            <div className="shrink-0">{categoryBadge}</div>
          ) : null}
          {urgencyLabel ? (
            <span className="truncate text-[11px] font-semibold text-text-muted">
              {urgencyLabel}
            </span>
          ) : null}
        </div>
        <div className="truncate text-sm font-semibold leading-snug text-text-primary">
          {title}
        </div>
        {subtitle ? (
          <div className="truncate text-xs leading-tight text-text-muted">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );

  const unreadIndicator = unread ? (
    <span
      className="size-2 shrink-0 rounded-full bg-primary"
      aria-hidden="true"
    />
  ) : null;

  const innerContent =
    presentation === "card" ? (
      <Card
        tone="default"
        className={cn(
          "relative flex w-full flex-col gap-(--space-2) overflow-hidden p-(--space-3)",
          isInteractive &&
            "transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
          disabled && "pointer-events-none opacity-45",
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-(--space-3)">
          {identity}
          {unreadIndicator}
        </div>
        <div className="flex items-center justify-between gap-(--space-3) border-t border-divider pt-(--space-2)">
          {amount}
          {actionLabel && isInteractive ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-(--space-1) text-xs font-semibold text-primary">
              {actionLabel}
              <AppIcon icon={ACTION_ICONS.forward} size="sm" />
            </span>
          ) : null}
        </div>
      </Card>
    ) : (
      <div
        className={cn(
          "relative flex min-h-16 w-full items-center gap-(--space-3) border-b border-border-subtle/70 bg-surface py-(--space-3) pl-(--space-4) pr-(--space-3)",
          isInteractive &&
            "transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)]",
          disabled && "pointer-events-none opacity-45",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-2 left-0 w-[3px] rounded-r-full",
            ACCENT_BAR_CLASSES[resolvedAccent],
          )}
        />
        {identity}
        <div className="flex shrink-0 items-center gap-3">
          {amount}
          {unreadIndicator}
          {action ? (
            <div
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {action}
            </div>
          ) : null}
          {!action && isInteractive ? (
            <AppIcon
              icon={ACTION_ICONS.forward}
              size="sm"
              className="text-text-muted/60"
            />
          ) : null}
        </div>
      </div>
    );

  if (isLink && href) {
    return (
      <Link
        href={href}
        prefetch={PRODUCT_LINK_PREFETCH}
        aria-label={ariaLabel}
        data-testid={testId}
        className="block w-full outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
      >
        {innerContent}
      </Link>
    );
  }

  if (isInteractive && handleAction) {
    return (
      <button
        type="button"
        onClick={handleAction}
        disabled={disabled}
        aria-label={ariaLabel}
        data-testid={testId}
        className="w-full text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div
      data-testid={testId}
      aria-label={ariaLabel}
      role={ariaLabel ? "group" : undefined}
    >
      {innerContent}
    </div>
  );
}
