import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { ProviderLogo } from "./provider-row";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type InvestmentGainLossTone = "positive" | "negative" | "neutral";

export type InvestmentRowProps = {
  assetName: ReactNode;
  ticker?: string;
  symbol?: string;
  icon?: ReactNode;
  iconSrc?: string | null;
  /** Holding quantity and unit label, e.g. "100 CCQ" or "2,5 Chỉ". */
  quantityLabel?: string;
  quantity?: number;
  /** Formatted unit price, e.g. "₫ 25.400". */
  unitPriceLabel?: string;
  currentPrice?: number;
  /** Current total market value of the position. */
  marketValue: number | string;
  /** Gain/loss amount, e.g. 2450000 or "+₫ 2.450.000". */
  gainLossAmount?: number | string;
  unrealizedGainLoss?: number | string;
  /** Formatted percentage change, e.g. "+9,8%". */
  gainLossPercent?: string;
  unrealizedGainLossPercent?: number;
  gainLossTone?: InvestmentGainLossTone;
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
 * Canonical ViNha InvestmentRow primitive (Task 11 / Warm Precision).
 * Calm, dignified wealth tracking for funds, stocks, and assets without trading terminal anxiety.
 */
export function InvestmentRow({
  assetName,
  ticker,
  symbol,
  icon,
  iconSrc,
  quantityLabel,
  quantity,
  unitPriceLabel,
  currentPrice,
  marketValue,
  gainLossAmount,
  unrealizedGainLoss,
  gainLossPercent,
  unrealizedGainLossPercent,
  gainLossTone,
  currency = "₫",
  href,
  onClick,
  onPress,
  disabled = false,
  divider = "inset",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: InvestmentRowProps) {
  const resolvedTicker = ticker ?? symbol;
  const resolvedGainLoss = gainLossAmount ?? unrealizedGainLoss;
  const resolvedPercent =
    gainLossPercent ??
    (unrealizedGainLossPercent !== undefined
      ? `${unrealizedGainLossPercent >= 0 ? "+" : ""}${unrealizedGainLossPercent}%`
      : undefined);

  const numGain =
    typeof resolvedGainLoss === "number" ? resolvedGainLoss : undefined;
  const resolvedTone: InvestmentGainLossTone =
    gainLossTone ??
    (numGain !== undefined
      ? numGain > 0
        ? "positive"
        : numGain < 0
          ? "negative"
          : "neutral"
      : unrealizedGainLossPercent !== undefined
        ? unrealizedGainLossPercent > 0
          ? "positive"
          : unrealizedGainLossPercent < 0
            ? "negative"
            : "neutral"
        : "neutral");

  const nameString =
    typeof assetName === "string" ? assetName : (resolvedTicker ?? "Asset");

  const leadingSlot = icon ?? (
    <ProviderLogo src={iconSrc} name={nameString} initials={resolvedTicker} />
  );

  const resolvedQtyPrice =
    quantityLabel && unitPriceLabel
      ? `${quantityLabel} × ${unitPriceLabel}`
      : quantity !== undefined && currentPrice !== undefined
        ? `${quantity} × ${currentPrice}`
        : quantityLabel || unitPriceLabel;

  const subtitleParts = [
    resolvedTicker ? assetName : undefined,
    resolvedQtyPrice,
  ].filter(Boolean);

  const titleContent = resolvedTicker ?? assetName;
  const subtitleContent = subtitleParts.join(" · ") || undefined;

  const numMarketValue =
    typeof marketValue === "number" ? marketValue : undefined;
  const labelMarketValue =
    typeof marketValue === "string" ? marketValue : undefined;

  const labelGainLoss =
    typeof resolvedGainLoss === "string" ? resolvedGainLoss : undefined;

  const toneClass =
    resolvedTone === "positive"
      ? "text-income"
      : resolvedTone === "negative"
        ? "text-debt"
        : "text-text-muted";

  const trailingSlot = (
    <div className="flex flex-col items-end gap-0.5 max-w-[50%]">
      <FinancialAmount
        value={numMarketValue}
        amountLabel={labelMarketValue}
        currency={currency}
        size={FinancialAmountSize.ROW_AMOUNT}
        tone={FinancialAmountTone.NEUTRAL}
        privacyAware
      />
      {resolvedGainLoss !== undefined || resolvedPercent ? (
        <span
          className={`text-xs font-medium leading-tight text-right truncate ${toneClass}`}
        >
          {resolvedTone === "positive" ? "+" : ""}
          {resolvedGainLoss !== undefined ? (
            <FinancialAmount
              value={numGain}
              amountLabel={labelGainLoss}
              currency={currency}
              size={FinancialAmountSize.MICRO_AMOUNT}
              tone={FinancialAmountTone.MUTED}
              privacyAware
            />
          ) : null}
          {resolvedPercent ? ` (${resolvedPercent})` : ""}
        </span>
      ) : null}
    </div>
  );

  return (
    <BaseRow
      leading={leadingSlot}
      title={titleContent}
      subtitle={subtitleContent}
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
