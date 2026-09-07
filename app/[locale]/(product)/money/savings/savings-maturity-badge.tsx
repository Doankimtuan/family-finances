import type { ReactNode } from "react";
import { SavingsMaturityState } from "@/modules/savings/application";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

const MaturityStatusKind = {
  RUNNING: "running",
  SOON: "soon",
  ACTION: "action",
  SETTLED: "settled",
} as const;

type MaturityStatusKind =
  (typeof MaturityStatusKind)[keyof typeof MaturityStatusKind];

const MATURITY_STATUS_KIND: Record<SavingsMaturityState, MaturityStatusKind> = {
  [SavingsMaturityState.ACTIVE]: MaturityStatusKind.RUNNING,
  [SavingsMaturityState.MATURING_SOON]: MaturityStatusKind.SOON,
  [SavingsMaturityState.MATURE_TODAY]: MaturityStatusKind.ACTION,
  [SavingsMaturityState.MATURED]: MaturityStatusKind.ACTION,
  [SavingsMaturityState.ACTION_REQUIRED]: MaturityStatusKind.ACTION,
  [SavingsMaturityState.SETTLED]: MaturityStatusKind.SETTLED,
  [SavingsMaturityState.EARLY_SETTLED]: MaturityStatusKind.SETTLED,
};

const STATUS_CHIP_CLASS: Record<MaturityStatusKind, string> = {
  [MaturityStatusKind.RUNNING]: "bg-savings-soft text-savings",
  [MaturityStatusKind.SOON]: "bg-warning text-inverse-fg",
  [MaturityStatusKind.ACTION]: "bg-danger text-inverse-fg",
  [MaturityStatusKind.SETTLED]: "bg-surface-muted text-text-secondary",
};

const STATUS_META_CLASS: Record<MaturityStatusKind, string> = {
  [MaturityStatusKind.RUNNING]: "text-text-secondary",
  [MaturityStatusKind.SOON]: "text-warning",
  [MaturityStatusKind.ACTION]: "text-danger",
  [MaturityStatusKind.SETTLED]: "text-text-muted",
};

const STATUS_DOT_CLASS: Record<MaturityStatusKind, string> = {
  [MaturityStatusKind.RUNNING]: "bg-savings",
  [MaturityStatusKind.SOON]: "bg-inverse-fg/80",
  [MaturityStatusKind.ACTION]: "bg-inverse-fg/80",
  [MaturityStatusKind.SETTLED]: "bg-text-tertiary",
};

/**
 * Savings lifecycle status. Solid token surfaces — not translucent StatusBadge
 * fills — so running, due-soon, and action-required stay distinct in dark mode.
 */
export function SavingsMaturityBadge({
  state,
  label,
  meta,
  testId,
}: {
  state: SavingsMaturityState;
  label: string;
  meta?: ReactNode;
  testId?: string;
}) {
  const kind = MATURITY_STATUS_KIND[state];

  return (
    <span
      className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)"
      data-testid={testId}
    >
      <span
        className={cn(
          "inline-flex min-h-6 max-w-full items-center gap-(--space-1) rounded-full px-(--space-2) text-xs font-semibold tracking-tight",
          STATUS_CHIP_CLASS[kind],
        )}
        data-slot="savings-maturity-status"
      >
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            STATUS_DOT_CLASS[kind],
          )}
        />
        <span className="truncate">{label}</span>
      </span>
      {meta ? (
        <Text
          size="xs"
          weight="medium"
          tabular
          className={cn("text-pretty", STATUS_META_CLASS[kind])}
        >
          {meta}
        </Text>
      ) : null}
    </span>
  );
}
