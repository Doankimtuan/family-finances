"use client";

import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { BaseRow, type BaseRowDivider } from "./base-row";

export const TransactionAmountTone = {
  CREDIT: "credit",
  DEBIT: "debit",
  REFUND: "refund",
  NEUTRAL: "neutral",
} as const;

export type TransactionAmountTone =
  (typeof TransactionAmountTone)[keyof typeof TransactionAmountTone];

export const TransactionType = {
  EXPENSE: "expense",
  INCOME: "income",
  TRANSFER: "transfer",
  REFUND: "refund",
  NEUTRAL: "neutral",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export type TransactionRowProps = {
  /** Explicit transaction type (mandatory for P0 transfer semantics). */
  type?: TransactionType;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Amount value (number in major units or pre-formatted string). */
  amount?: number | string;
  /** Legacy alias for amount string. */
  amountLabel?: string;
  currency?: string;
  amountMeta?: ReactNode;
  amountAriaLabel?: string;
  /** Legacy tone parameter (mapped to canonical type if provided). */
  tone?: TransactionAmountTone;
  icon?: IconSvgElement;
  iconNode?: ReactNode;
  iconTone?: IconContainerTone;
  leading?: ReactNode;
  showRail?: boolean;
  showChevron?: boolean;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

function resolveTransactionTone(
  type?: TransactionType,
  tone?: TransactionAmountTone,
): { tone: FinancialAmountTone; showSign: boolean } {
  if (type === "income" || tone === TransactionAmountTone.CREDIT) {
    return { tone: FinancialAmountTone.INCOME, showSign: true };
  }
  if (type === "expense" || tone === TransactionAmountTone.DEBIT) {
    return { tone: FinancialAmountTone.EXPENSE, showSign: true };
  }
  if (type === "transfer") {
    return { tone: FinancialAmountTone.TRANSFER, showSign: true };
  }
  if (type === "refund" || tone === TransactionAmountTone.REFUND) {
    return { tone: FinancialAmountTone.MUTED, showSign: false };
  }
  return { tone: FinancialAmountTone.NEUTRAL, showSign: false };
}

/**
 * Canonical ViNha TransactionRow primitive (Task 11 / Warm Precision).
 * Renders individual debits, credits, and transfers with 32x32px category icon,
 * merchant/account details, and explicit financial semantics (Transfer != Expense).
 */
export function TransactionRow({
  type,
  title,
  subtitle,
  amount,
  amountLabel,
  currency = "₫",
  amountMeta,
  amountAriaLabel,
  tone,
  icon,
  iconNode,
  iconTone = "neutral",
  leading,
  showRail = false,
  showChevron = false,
  href,
  onClick,
  onPress,
  disabled = false,
  divider = "inset",
  className,
  "aria-label": ariaLabelProp,
  "data-testid": testId,
}: TransactionRowProps) {
  const { isHidden } = useFinancialPrivacy();
  const resolvedAmount = amount ?? amountLabel ?? "";
  const numValue =
    typeof resolvedAmount === "number" ? resolvedAmount : undefined;
  const labelValue =
    typeof resolvedAmount === "string" ? resolvedAmount : undefined;

  const { tone: financialTone, showSign } = resolveTransactionTone(type, tone);

  const leadingSlot = leading ? (
    leading
  ) : iconNode ? (
    iconNode
  ) : icon ? (
    <IconContainer tone={iconTone} size="sm">
      <AppIcon icon={icon} size="sm" />
    </IconContainer>
  ) : showRail ? (
    <span
      className={cn(
        "size-2 rounded-full",
        financialTone === "income" && "bg-income",
        financialTone === "expense" && "bg-expense",
        financialTone === "transfer" && "bg-transfer",
        financialTone === "neutral" && "bg-border-strong",
      )}
      aria-hidden
    />
  ) : null;

  const trailingSlot = (
    <div className="flex max-w-full flex-col items-end gap-0.5">
      <FinancialAmount
        value={numValue}
        amountLabel={labelValue}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={financialTone}
        showSign={showSign}
        privacyAware
      />
      {amountMeta ? (
        <span className="text-xs text-text-muted leading-tight text-right truncate max-w-full">
          {amountMeta}
        </span>
      ) : null}
      {amountAriaLabel && !isHidden ? (
        <span className="sr-only">{amountAriaLabel}</span>
      ) : null}
    </div>
  );

  const actionSlot = showChevron ? (
    <AppIcon
      icon={ACTION_ICONS.forward}
      size="sm"
      className="text-text-muted/60"
    />
  ) : null;

  return (
    <BaseRow
      leading={leadingSlot}
      title={title}
      subtitle={subtitle}
      trailing={trailingSlot}
      trailingClassName="max-w-[50%]"
      action={actionSlot}
      divider={divider === "inset" ? "none" : divider}
      href={href}
      onClick={onClick}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "group border-b border-border-subtle/70 bg-transparent",
        className,
      )}
      aria-label={ariaLabelProp ?? (!isHidden ? amountAriaLabel : undefined)}
      data-testid={testId}
    />
  );
}
