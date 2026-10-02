import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export const IconContainerTone = {
  NEUTRAL: "neutral",
  PRIMARY: "primary",
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  INVESTMENT: "investment",
  SAVINGS: "savings",
  WARNING: "warning",
  DEBT: "debt",
  INFO: "info",
  REFUND: "refund",
} as const;

export type IconContainerTone =
  (typeof IconContainerTone)[keyof typeof IconContainerTone];

export type IconContainerProps = {
  children: ReactNode;
  tone?: IconContainerTone;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const toneClassName: Record<IconContainerTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  primary: "bg-primary-soft text-primary",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
  investment: "bg-investment-soft text-investment",
  savings: "bg-savings-soft text-savings",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  debt: "bg-debt-soft text-debt",
  refund: "bg-refund-soft text-refund",
};

/** A low-emphasis, token-driven container for category and financial-status icons. */
export function IconContainer({
  children,
  tone = "neutral",
  size = "md",
  className,
}: IconContainerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-control)]",
        size === "xs"
          ? "size-7 rounded-(--radius-sm)"
          : size === "sm"
            ? "size-8"
            : "size-10",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
