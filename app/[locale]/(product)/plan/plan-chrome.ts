/** Shared chrome for Plan hub, lists, details, and recovery links. */

export const PLAN_SURFACE_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const PLAN_ACCENT_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const PLAN_INLINE_LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-semibold text-accent transition-colors duration-(--duration-fast) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export const PLAN_DESTINATION_ROW_CLASS =
  "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";
