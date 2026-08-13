import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type IconContainerTone =
  | "neutral"
  | "primary"
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "savings"
  | "debt"
  | "info"
  | "refund";

export type IconContainerProps = {
  children: ReactNode;
  tone?: IconContainerTone;
  size?: "sm" | "md";
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
        size === "sm" ? "size-8" : "size-10",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
