/** Shared chrome for transaction list, detail, capture, and correction/refund flows. */

export const TRANSACTION_SURFACE_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const TRANSACTION_ACCENT_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const TRANSACTION_GHOST_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] px-(--space-4) text-sm font-medium text-text-secondary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const RECEIPT_ACTION_LINK_CLASS = {
  primary: TRANSACTION_ACCENT_LINK_CLASS,
  secondary: TRANSACTION_SURFACE_LINK_CLASS,
  tertiary: TRANSACTION_GHOST_LINK_CLASS,
} as const;

export const CAPTURE_MODE_TRACK_CLASS =
  "grid grid-cols-3 gap-(--space-1) rounded-[var(--radius-control)] bg-surface-muted/65 p-(--space-1)";

export const CAPTURE_MODE_SELECTED_CLASS =
  "min-h-11 rounded-[var(--radius-control)] bg-primary-soft px-(--space-2) text-sm font-semibold text-primary ring-1 ring-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export const CAPTURE_MODE_IDLE_CLASS =
  "min-h-11 rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const CAPTURE_SPLIT_CANCEL_LINK_CLASS =
  "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export const CAPTURE_AMOUNT_FIELD_CLASS =
  "min-h-16 text-2xl font-semibold tracking-tight";

/** Same type as `FormField` labels. Native `<legend>` must reset float/padding. */
export const CAPTURE_FIELDSET_LEGEND_CLASS =
  "float-none w-full p-0 text-sm font-medium text-text-primary";

export const TRANSFER_ACCOUNT_ROW_CLASS =
  "flex min-h-12 cursor-pointer items-center gap-(--space-3) rounded-[var(--radius-control)] border border-transparent bg-surface-muted px-(--space-3) py-(--space-2) transition-[background-color,border-color,box-shadow] duration-(--duration-fast) hover:bg-surface-hover has-[:checked]:border-primary/25 has-[:checked]:bg-primary-soft has-[:checked]:shadow-(--elevation-1) has-[:checked]:ring-1 has-[:checked]:ring-primary/20 motion-reduce:transition-none";
