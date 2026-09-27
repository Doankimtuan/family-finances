import type { ElementType, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { cn } from "@/shared/utils/cn";

export const BaseRowMinHeight = {
  STANDARD: "standard", // 52px
  INSTRUMENT: "instrument", // 64px
} as const;

export type BaseRowMinHeight =
  (typeof BaseRowMinHeight)[keyof typeof BaseRowMinHeight];

export type BaseRowDivider = "inset" | "full" | "none";

export type BaseRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  divider?: BaseRowDivider;
  minHeight?: BaseRowMinHeight;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  as?: ElementType;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  trailingClassName?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Fundamental building block for all structured feeds, table rows, and list items in ViNha.
 * Standardizes 52px/64px min-height, 12px horizontal padding, 56px inset dividers,
 * and semantic Link / Button / Container switching without nested-interactive errors.
 */
export function BaseRow({
  leading,
  title,
  subtitle,
  trailing,
  action,
  divider = "inset",
  minHeight = BaseRowMinHeight.STANDARD,
  href,
  onClick,
  onPress,
  disabled = false,
  selected = false,
  as: Component = "div",
  className,
  contentClassName,
  titleClassName,
  subtitleClassName,
  trailingClassName,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: BaseRowProps) {
  const isInteractive = Boolean(href || onClick || onPress) && !disabled;
  const isLink = Boolean(href) && !disabled;
  const handleAction = onClick ?? onPress;

  const minHeightClass =
    minHeight === BaseRowMinHeight.INSTRUMENT ? "min-h-16" : "min-h-[52px]";

  const dividerElement =
    divider !== "none" ? (
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 right-0 h-px bg-border-subtle/70",
          divider === "inset" ? "left-14" : "left-0",
        )}
      />
    ) : null;

  const rowContent = (
    <>
      {leading ? (
        <div className="flex shrink-0 items-center justify-center">
          {leading}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div
          className={cn(
            "truncate text-sm font-medium text-text-primary leading-snug",
            titleClassName,
          )}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            className={cn(
              "truncate text-xs text-text-muted leading-tight",
              subtitleClassName,
            )}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {trailing ? (
        <div
          className={cn(
            "flex shrink-0 flex-col items-end justify-center gap-0.5",
            trailingClassName,
          )}
        >
          {trailing}
        </div>
      ) : null}
    </>
  );

  const actionElement = action ? (
    <div className="flex shrink-0 items-center justify-center ml-1">
      {action}
    </div>
  ) : null;

  const Wrapper = Component === "li" ? "li" : "div";

  const containerClasses = cn(
    "relative flex w-full items-center gap-(--space-3) px-(--space-3) py-(--space-2)",
    minHeightClass,
    disabled && "opacity-45 pointer-events-none",
    selected && "bg-primary-soft/40",
    contentClassName,
  );

  if (isLink && href) {
    return (
      <Wrapper
        className={cn("relative list-none", className)}
        data-testid={testId}
      >
        <div className={containerClasses}>
          <Link
            href={href}
            prefetch={PRODUCT_LINK_PREFETCH}
            aria-label={ariaLabel}
            className="flex min-w-0 flex-1 items-center gap-(--space-3) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring rounded-[var(--radius-control)] transition-[background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {rowContent}
          </Link>
          {actionElement}
        </div>
        {dividerElement}
      </Wrapper>
    );
  }

  if (isInteractive && handleAction) {
    return (
      <Wrapper
        className={cn("relative list-none", className)}
        data-testid={testId}
      >
        <div className={containerClasses}>
          <button
            type="button"
            onClick={handleAction}
            disabled={disabled}
            aria-label={ariaLabel}
            className="flex min-w-0 flex-1 items-center gap-(--space-3) text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring rounded-[var(--radius-control)] transition-[background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {rowContent}
          </button>
          {actionElement}
        </div>
        {dividerElement}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className={cn("relative", className)}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <div className={containerClasses}>
        {rowContent}
        {actionElement}
      </div>
      {dividerElement}
    </Wrapper>
  );
}
