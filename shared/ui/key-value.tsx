import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type KeyValueRowProps = {
  id?: string;
  label: ReactNode;
  value: ReactNode;
  /** Optional faint dotted leader connecting label and value. */
  dotLeader?: boolean;
  /** Emphasized row (e.g. Total, Final, or Critical Highlight). */
  isHighlighted?: boolean;
  /** Alias for isHighlighted. */
  highlight?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  "data-testid"?: string;
};

/**
 * Structured parameter row for contract details, terms, and metadata.
 * Renders semantic dt/dd within a description list.
 */
export function KeyValueRow({
  id,
  label,
  value,
  dotLeader = false,
  isHighlighted = false,
  highlight,
  className,
  labelClassName,
  valueClassName,
  "data-testid": testId,
}: KeyValueRowProps) {
  const resolvedHighlighted = highlight ?? isHighlighted;
  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        "flex min-h-8 items-baseline justify-between gap-(--space-3) py-1.5 text-sm",
        resolvedHighlighted &&
          "rounded-[var(--radius-xs)] bg-primary-soft/30 px-2 py-1 -mx-2 font-medium",
        className,
      )}
    >
      <dt
        className={cn(
          "min-w-0 shrink-0 text-[13px] text-text-secondary leading-snug",
          labelClassName,
        )}
      >
        {label}
      </dt>

      {dotLeader ? (
        <span
          className="mx-1 h-0 flex-1 border-b border-dotted border-border-subtle select-none opacity-60 self-center"
          aria-hidden
        />
      ) : null}

      <dd
        className={cn(
          "min-w-0 text-right text-[14px] font-semibold text-text-primary tabular-nums leading-snug break-words",
          isHighlighted && "text-primary",
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export type KeyValueListProps = {
  children: ReactNode;
  /** When true, renders a subtle divider between each row. */
  divided?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Semantic description list (<dl>) container for financial metadata facts.
 */
export function KeyValueList({
  children,
  divided = false,
  className,
  "data-testid": testId,
}: KeyValueListProps) {
  return (
    <dl
      data-testid={testId}
      className={cn(
        "flex flex-col",
        divided ? "divide-y divide-border-subtle/70" : "gap-(--space-1)",
        className,
      )}
    >
      {children}
    </dl>
  );
}
