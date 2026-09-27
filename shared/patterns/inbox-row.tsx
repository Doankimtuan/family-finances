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

export type InboxAccent = "amber" | "violet" | "rose" | "teal" | "neutral";

export type InboxRowProps = {
  accent?: InboxAccent;
  urgency?: "urgent" | "high" | "medium" | "low" | string;
  title: ReactNode;
  subtitle?: ReactNode;
  categoryBadge?: ReactNode;
  urgencyLabel?: ReactNode;
  impactAmount?: number | string;
  currency?: string;
  action?: ReactNode;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
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

/**
 * Canonical ViNha Decision Queue row for `/inbox`.
 * Features a 3px urgency accent strip, category & deadline badge, decision title,
 * and bold financial impact figure for immediate household triaging.
 */
export function InboxRow({
  accent,
  urgency,
  title,
  subtitle,
  categoryBadge,
  urgencyLabel,
  impactAmount,
  currency = "₫",
  action,
  href,
  onClick,
  onPress,
  disabled = false,
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

  const resolvedAccent: InboxAccent =
    accent ??
    (urgency === "urgent" || urgency === "high"
      ? "rose"
      : urgency === "medium"
        ? "amber"
        : urgency === "low"
          ? "teal"
          : "amber");

  const innerContent = (
    <div
      className={cn(
        "relative flex w-full items-center gap-(--space-3) py-3 pl-4 pr-3 min-h-[64px]",
        "border-b border-border-subtle/70 bg-surface",
        isInteractive &&
          "transition-[background-color,transform] duration-[var(--duration-fast)] hover:bg-surface-hover active:scale-[var(--press-scale)]",
        disabled && "opacity-45 pointer-events-none",
        className,
      )}
    >
      {/* 3px vertical urgency accent bar */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-2 left-0 w-[3px] rounded-r-full",
          ACCENT_BAR_CLASSES[resolvedAccent] ?? ACCENT_BAR_CLASSES.amber,
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          {categoryBadge ? (
            <div className="shrink-0">{categoryBadge}</div>
          ) : null}
          {urgencyLabel ? (
            <span className="text-[11px] font-semibold text-text-muted truncate">
              {urgencyLabel}
            </span>
          ) : null}
        </div>

        <div className="truncate text-sm font-semibold text-text-primary leading-snug">
          {title}
        </div>

        {subtitle ? (
          <div className="truncate text-xs text-text-muted leading-tight">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {impactAmount !== undefined ? (
          <FinancialAmount
            value={numImpact}
            amountLabel={labelImpact}
            currency={currency}
            size={FinancialAmountSize.ROW_AMOUNT}
            tone={FinancialAmountTone.NEUTRAL}
            privacyAware
          />
        ) : null}

        {action ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {action}
          </div>
        ) : (
          <AppIcon
            icon={ACTION_ICONS.forward}
            size="sm"
            className="text-text-muted/60"
          />
        )}
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
    <div data-testid={testId} aria-label={ariaLabel}>
      {innerContent}
    </div>
  );
}
