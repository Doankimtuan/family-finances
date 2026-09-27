import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { IconContainer } from "@/shared/ui/icon-container";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type PersonalDebtDirection =
  "lent" | "borrowed" | "lending" | "borrowing";

export type PersonalDebtRowProps = {
  direction: PersonalDebtDirection;
  /** Explicit textual direction label, e.g. "Cho vay" or "Đi vay". Defaults based on direction if omitted. */
  directionLabel?: string;
  counterpartyName: ReactNode;
  counterpartyAvatar?: ReactNode;
  initials?: string;
  remainingAmount: number | string;
  dueDate?: string;
  statusBadge?: ReactNode;
  currency?: string;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha PersonalDebtRow primitive (Task 11 / Warm Precision).
 * Tracks peer lending with explicit semantic direction ("Cho vay" vs "Đi vay")
 * so debt liabilities are never confused with receivable assets.
 */
export function PersonalDebtRow({
  direction,
  directionLabel,
  counterpartyName,
  counterpartyAvatar,
  initials,
  remainingAmount,
  dueDate,
  statusBadge,
  currency = "₫",
  href,
  onClick,
  onPress,
  disabled = false,
  divider = "inset",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: PersonalDebtRowProps) {
  const isLent = direction === "lent" || direction === "lending";
  const resolvedDirectionLabel =
    directionLabel ?? (isLent ? "Cho vay" : "Đi vay");

  const derivedInitials =
    initials ??
    (typeof counterpartyName === "string"
      ? counterpartyName
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "PD");

  const leadingSlot = counterpartyAvatar ?? (
    <IconContainer tone={isLent ? "income" : "debt"} size="md">
      <span className="text-xs font-bold" aria-hidden>
        {derivedInitials}
      </span>
    </IconContainer>
  );

  const numRemaining =
    typeof remainingAmount === "number" ? remainingAmount : undefined;
  const labelRemaining =
    typeof remainingAmount === "string" ? remainingAmount : undefined;

  const subtitleParts = [resolvedDirectionLabel, dueDate].filter(Boolean);

  const trailingSlot = (
    <div className="flex flex-col items-end gap-0.5 max-w-[50%]">
      <FinancialAmount
        value={numRemaining}
        amountLabel={labelRemaining}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={isLent ? FinancialAmountTone.INCOME : FinancialAmountTone.DEBT}
        privacyAware
      />
      {statusBadge ? (
        <div className="shrink-0">{statusBadge}</div>
      ) : (
        <span
          className={`text-xs font-medium leading-tight ${isLent ? "text-income" : "text-debt"}`}
        >
          {resolvedDirectionLabel}
        </span>
      )}
    </div>
  );

  return (
    <BaseRow
      leading={leadingSlot}
      title={counterpartyName}
      subtitle={subtitleParts.join(" · ") || undefined}
      trailing={trailingSlot}
      minHeight={BaseRowMinHeight.STANDARD}
      divider={divider}
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
