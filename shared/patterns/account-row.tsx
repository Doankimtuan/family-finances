import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ProviderLogo } from "./provider-row";
import {
  FinancialNumberKind,
  type FinancialNumberKind as FinancialNumberKindValue,
} from "./financial-number-kind";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type AccountKind = "asset" | "credit";

export type AccountRowProps = {
  /** Account category: "asset" (Cash, Checking) vs "credit" (Liability). */
  accountKind?: AccountKind;
  /** Explicit boolean flag for credit liability accounts. */
  isCredit?: boolean;
  name?: ReactNode;
  accountName?: ReactNode;
  /** Masked digits or account code, e.g. "••• 4892". */
  accountNumberMask?: string;
  institutionName?: string;
  logo?: ReactNode;
  logoSrc?: string | null;
  /** Primary monetary figure (Asset balance or Credit outstanding). */
  balance: number | string;
  balanceKind?: FinancialNumberKindValue;
  /** Credit limit if this is a credit card. */
  creditLimit?: number | string;
  /** Optional precomposed subtitle for concise overview rows. */
  subtitle?: ReactNode;
  subtitleClassName?: string;
  currency?: string;
  secondaryAction?: ReactNode;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  minHeight?: BaseRowMinHeight;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha AccountRow primitive (Task 11 / Warm Precision).
 * Renders cash assets and credit liabilities with explicit financial distinction:
 * Credit liabilities NEVER display as positive cash wealth.
 */
export function AccountRow({
  accountKind = "asset",
  isCredit: isCreditProp,
  name,
  accountName,
  accountNumberMask,
  institutionName,
  logo,
  logoSrc,
  subtitle,
  subtitleClassName,
  balance,
  balanceKind = FinancialNumberKind.CURRENT_STATE,
  creditLimit,
  currency = "₫",
  secondaryAction,
  href,
  onClick,
  onPress,
  disabled = false,
  minHeight = BaseRowMinHeight.INSTRUMENT,
  divider = "inset",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: AccountRowProps) {
  const isCredit =
    isCreditProp !== undefined ? isCreditProp : accountKind === "credit";
  const resolvedName = name ?? accountName ?? "Tài khoản";
  const numBalance = typeof balance === "number" ? balance : undefined;
  const labelBalance = typeof balance === "string" ? balance : undefined;

  const nameString =
    typeof resolvedName === "string"
      ? resolvedName
      : (institutionName ?? "Account");

  const leadingSlot = logo ?? <ProviderLogo src={logoSrc} name={nameString} />;

  const subtitleText =
    subtitle ??
    ([institutionName, accountNumberMask].filter(Boolean).join(" · ") ||
      undefined);

  const trailingSlot = (
    <div className="flex flex-col items-end gap-0.5 max-w-[50%]">
      <FinancialAmount
        value={numBalance}
        amountLabel={labelBalance}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={isCredit ? FinancialAmountTone.DEBT : FinancialAmountTone.NEUTRAL}
        kind={balanceKind}
        privacyAware
      />
      {isCredit && creditLimit !== undefined ? (
        <span className="text-xs text-text-muted leading-tight text-right truncate">
          Hạn mức:{" "}
          <FinancialAmount
            value={typeof creditLimit === "number" ? creditLimit : undefined}
            amountLabel={
              typeof creditLimit === "string" ? creditLimit : undefined
            }
            currency={currency}
            size={FinancialAmountSize.MICRO_AMOUNT}
            tone={FinancialAmountTone.MUTED}
            privacyAware
          />
        </span>
      ) : null}
    </div>
  );

  return (
    <BaseRow
      leading={leadingSlot}
      title={resolvedName}
      subtitle={subtitleText}
      subtitleClassName={subtitleClassName}
      trailing={trailingSlot}
      action={secondaryAction}
      minHeight={minHeight}
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
