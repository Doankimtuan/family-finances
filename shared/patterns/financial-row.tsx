import type { ReactNode } from "react";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  FinancialAmount,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type FinancialRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  amount: ReactNode | number;
  amountSubtitle?: ReactNode;
  tone?: FinancialAmountTone;
  showSign?: boolean;
  currency?: string;
  action?: ReactNode;
  showChevron?: boolean;
  divider?: BaseRowDivider;
  minHeight?: BaseRowMinHeight;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Composite financial row: Leading visual + Title/Subtitle + Trailing Amount/Metadata.
 * Acts as the shared foundation for TransactionRow, AccountRow, SavingsRow, and LoanRow.
 */
export function FinancialRow({
  leading,
  title,
  subtitle,
  amount,
  amountSubtitle,
  tone = FinancialAmountTone.NEUTRAL,
  showSign = false,
  currency = "₫",
  action,
  showChevron = false,
  divider = "inset",
  minHeight = BaseRowMinHeight.STANDARD,
  href,
  onClick,
  onPress,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: FinancialRowProps) {
  const renderedAmount =
    typeof amount === "number" ? (
      <FinancialAmount
        value={amount}
        tone={tone}
        showSign={showSign}
        currency={currency}
      />
    ) : (
      amount
    );

  const trailingContent = (
    <div className="flex flex-col items-end gap-0.5">
      <div className="leading-tight">{renderedAmount}</div>
      {amountSubtitle ? (
        <div className="text-xs text-text-muted leading-tight">
          {amountSubtitle}
        </div>
      ) : null}
    </div>
  );

  const actionContent = action ? (
    action
  ) : showChevron ? (
    <AppIcon
      icon={ACTION_ICONS.forward}
      size="sm"
      className="text-text-muted/60"
    />
  ) : null;

  return (
    <BaseRow
      leading={leading}
      title={title}
      subtitle={subtitle}
      trailing={trailingContent}
      action={actionContent}
      divider={divider}
      minHeight={minHeight}
      href={href}
      onClick={onClick}
      onPress={onPress}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
}
