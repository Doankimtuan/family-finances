"use client";

import { MoneyCaptureMode } from "@/modules/ledger/application/client";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import {
  CurrencyInput,
  CurrencyInputCurrencyPosition,
  type CurrencyInputProps,
} from "@/shared/ui/form/currency-input";
import { cn } from "@/shared/utils/cn";

const AMOUNT_TONE: Record<MoneyCaptureMode, string> = {
  [MoneyCaptureMode.EXPENSE]: "text-expense",
  [MoneyCaptureMode.INCOME]: "text-income",
  [MoneyCaptureMode.TRANSFER]: "text-transfer",
};

export function TransactionAmountField({
  mode,
  currency,
  ...props
}: CurrencyInputProps & { mode: MoneyCaptureMode; currency: string }) {
  return (
    <CurrencyInput
      {...props}
      currencyPosition={CurrencyInputCurrencyPosition.PREFIX}
      showWordsPreview={currency === DEFAULT_CURRENCY}
      className={cn(
        "text-xl font-semibold placeholder:text-sm placeholder:font-normal",
        AMOUNT_TONE[mode],
      )}
    />
  );
}
