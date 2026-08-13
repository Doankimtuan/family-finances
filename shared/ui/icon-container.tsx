import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type IconContainerTone =
  | "neutral"
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "savings"
  | "debt"
  | "refund";

export type IconContainerProps = {
  children: ReactNode;
  tone?: IconContainerTone;
  size?: "sm" | "md";
  className?: string;
};

const toneClassName: Record<IconContainerTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
  investment: "bg-investment-soft text-investment",
  savings: "bg-savings-soft text-savings",
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
        size === "sm" ? "size-8" : "size-10",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
