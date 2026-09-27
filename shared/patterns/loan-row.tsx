import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ProviderLogo } from "./provider-row";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type LoanRowProps = {
  loanName?: ReactNode;
  lenderName?: string;
  purposeLabel?: ReactNode;
  logo?: ReactNode;
  logoSrc?: string | null;
  /** Current outstanding debt to repay. */
  outstandingPrincipal?: number | string;
  /** Alias for outstandingPrincipal. */
  remainingPrincipal?: number | string;
  /** Upcoming installment amount. */
  nextPaymentAmount?: number | string;
  /** Upcoming installment date description, e.g. "Kỳ tới 05/10:". */
  nextPaymentDate?: string;
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
 * Canonical ViNha LoanRow primitive (Task 11 / Warm Precision).
 * Renders loans with lender identity, outstanding debt, and upcoming repayment clarity.
 */
export function LoanRow({
  loanName,
  lenderName,
  purposeLabel,
  logo,
  logoSrc,
  outstandingPrincipal,
  remainingPrincipal,
  nextPaymentAmount,
  nextPaymentDate,
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
}: LoanRowProps) {
  const resolvedTitle = loanName ?? lenderName ?? "Khoản vay";
  const resolvedSubtitle = loanName
    ? (lenderName ?? purposeLabel)
    : purposeLabel;
  const resolvedPrincipal = outstandingPrincipal ?? remainingPrincipal ?? 0;
  const nameString = typeof resolvedTitle === "string" ? resolvedTitle : "Loan";

  const leadingSlot = logo ?? <ProviderLogo src={logoSrc} name={nameString} />;

  const numOutstanding =
    typeof resolvedPrincipal === "number" ? resolvedPrincipal : undefined;
  const labelOutstanding =
    typeof resolvedPrincipal === "string" ? resolvedPrincipal : undefined;

  const numNext =
    typeof nextPaymentAmount === "number" ? nextPaymentAmount : undefined;
  const labelNext =
    typeof nextPaymentAmount === "string" ? nextPaymentAmount : undefined;

  const trailingSlot = (
    <div className="flex flex-col items-end gap-0.5 max-w-[50%]">
      <FinancialAmount
        value={numOutstanding}
        amountLabel={labelOutstanding}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={FinancialAmountTone.DEBT}
        privacyAware
      />
      {nextPaymentAmount !== undefined ? (
        <span className="text-xs text-text-muted leading-tight text-right truncate">
          {nextPaymentDate ? `${nextPaymentDate} ` : "Kỳ tới: "}
          <FinancialAmount
            value={numNext}
            amountLabel={labelNext}
            currency={currency}
            size={FinancialAmountSize.MICRO_AMOUNT}
            tone={FinancialAmountTone.MUTED}
            privacyAware
          />
        </span>
      ) : statusBadge ? (
        statusBadge
      ) : null}
    </div>
  );

  return (
    <BaseRow
      leading={leadingSlot}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      trailing={trailingSlot}
      minHeight={BaseRowMinHeight.INSTRUMENT}
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
