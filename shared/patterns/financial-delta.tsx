"use client";

import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text, type TextProps } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";
import { cn } from "@/shared/utils/cn";

export const FinancialDeltaDirection = {
  POSITIVE: "positive",
  NEGATIVE: "negative",
  NEUTRAL: "neutral",
} as const;

export type FinancialDeltaDirection =
  (typeof FinancialDeltaDirection)[keyof typeof FinancialDeltaDirection];

export const FINANCIAL_DELTA_DIRECTION_VALUES = [
  FinancialDeltaDirection.POSITIVE,
  FinancialDeltaDirection.NEGATIVE,
  FinancialDeltaDirection.NEUTRAL,
] as const;

const FINANCIAL_DELTA_DIRECTION_SET = new Set<FinancialDeltaDirection>(
  FINANCIAL_DELTA_DIRECTION_VALUES,
);

type TextTone = NonNullable<TextProps["tone"]>;

/**
 * Signed financial movement (net cash flow, gain/loss, period delta).
 * Current-state values (balances) never use this — they stay neutral.
 */
export const FINANCIAL_DELTA_PRESENTATION: Record<
  FinancialDeltaDirection,
  { tone: TextTone; icon: IconSvgElement | null; badgeClassName: string | null }
> = {
  [FinancialDeltaDirection.POSITIVE]: {
    tone: "success",
    icon: FINANCE_ICONS.income,
    badgeClassName: "bg-success/10 text-success",
  },
  [FinancialDeltaDirection.NEGATIVE]: {
    tone: "danger",
    icon: FINANCE_ICONS.expense,
    badgeClassName: "bg-danger/10 text-danger",
  },
  [FinancialDeltaDirection.NEUTRAL]: {
    tone: "primary",
    icon: null,
    badgeClassName: null,
  },
};

function resolveDeltaPresentation(
  direction: FinancialDeltaDirection | undefined,
) {
  if (direction != null && FINANCIAL_DELTA_DIRECTION_SET.has(direction)) {
    return FINANCIAL_DELTA_PRESENTATION[direction];
  }
  return FINANCIAL_DELTA_PRESENTATION[FinancialDeltaDirection.NEUTRAL];
}

/** Leading directional cue — tinted circle badge with an up/down icon. */
export function FinancialDeltaBadge({
  direction,
  className,
}: {
  direction?: FinancialDeltaDirection;
  className?: string;
}) {
  const presentation = resolveDeltaPresentation(direction);
  if (presentation.icon == null) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        presentation.badgeClassName,
        className,
      )}
    >
      <AppIcon icon={presentation.icon} size={AppIconSize.SM} />
    </span>
  );
}

/**
 * Signed movement value: semantic tone + semibold tabular numerals +
 * privacy masking. `children` is the already-formatted amount.
 */
export function FinancialDeltaValue({
  direction,
  children,
  className,
}: {
  direction?: FinancialDeltaDirection;
  children: ReactNode;
  className?: string;
}) {
  const presentation = resolveDeltaPresentation(direction);
  return (
    <Text
      size="lg"
      tone={presentation.tone}
      weight="semibold"
      tabular
      className={className}
    >
      <FinancialValue>{children}</FinancialValue>
    </Text>
  );
}
