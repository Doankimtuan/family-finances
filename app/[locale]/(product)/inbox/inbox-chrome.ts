/** Shared chrome for Inbox queue, detail, and recovery links. */

export const INBOX_ACCENT_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const INBOX_REVIEW_ROW_CLASS =
  "block rounded-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";

/** Quiet list rows for source and read-state on Inbox detail. */
export const INBOX_META_ROW_CLASS =
  "flex min-h-11 w-full items-center justify-between gap-(--space-3) px-(--space-4) py-(--space-3) text-left text-sm font-medium text-text-primary transition-[background-color,color] duration-(--duration-fast) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";
