import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ProviderLogo } from "./provider-row";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type SavingsRowProps = {
  depositName: ReactNode;
  providerName?: string;
  institutionName?: string;
  logo?: ReactNode;
  logoSrc?: string | null;
  /** Formatted rate string, e.g. "6,5% / năm". */
  interestRate?: string;
  /** Numeric rate percent, e.g. 5.5 */
  interestRatePercent?: number;
  /** Maturity description, e.g. "Đáo hạn 28/09/2026". */
  maturityDate?: string;
  /** Principal or current balance. */
  principal: number | string;
  /** Estimated or accrued interest (already calculated upstream). */
  accruedYield?: number | string;
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
 * Canonical ViNha SavingsRow primitive (Task 11 / Warm Precision).
 * Renders savings contracts with provider identity, interest rate, maturity, and live balance.
 */
export function SavingsRow({
  depositName,
  providerName,
  institutionName,
  logo,
  logoSrc,
  interestRate,
  interestRatePercent,
  maturityDate,
  principal,
  accruedYield,
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
}: SavingsRowProps) {
  const resolvedProvider = providerName ?? institutionName;
  const resolvedRate =
    interestRate ??
    (interestRatePercent !== undefined
      ? `${interestRatePercent}% / năm`
      : undefined);

  const nameString =
    typeof depositName === "string"
      ? depositName
      : (resolvedProvider ?? "Savings");
  const leadingSlot = logo ?? <ProviderLogo src={logoSrc} name={nameString} />;

  const subtitleParts = [resolvedProvider, resolvedRate, maturityDate].filter(
    Boolean,
  );

  const numPrincipal = typeof principal === "number" ? principal : undefined;
  const labelPrincipal = typeof principal === "string" ? principal : undefined;

  const numYield = typeof accruedYield === "number" ? accruedYield : undefined;
  const labelYield =
    typeof accruedYield === "string" ? accruedYield : undefined;

  const trailingSlot = (
    <div className="flex flex-col items-end gap-0.5 max-w-[50%]">
      <FinancialAmount
        value={numPrincipal}
        amountLabel={labelPrincipal}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={FinancialAmountTone.NEUTRAL}
        privacyAware
      />
      {accruedYield !== undefined ? (
        <span className="text-xs text-income font-medium leading-tight text-right truncate">
          +
          <FinancialAmount
            value={numYield}
            amountLabel={labelYield}
            currency={currency}
            size={FinancialAmountSize.MICRO_AMOUNT}
            tone={FinancialAmountTone.INCOME}
            privacyAware
          />{" "}
          lãi
        </span>
      ) : statusBadge ? (
        statusBadge
      ) : null}
    </div>
  );

  return (
    <BaseRow
      leading={leadingSlot}
      title={depositName}
      subtitle={subtitleParts.join(" · ") || undefined}
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
