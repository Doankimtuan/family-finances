"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
} from "@/modules/ledger/application/client";
import {
  MoneyCaptureMode,
  MONEY_CAPTURE_MODE_OPTIONS,
} from "@/modules/ledger/application/client";
import { CaptureTransactionForm } from "./capture-transaction-form";
import { TransferCaptureFlow } from "./transfer-capture-flow";

type Props = {
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  currency: string;
};

/**
 * Capture entry — expense/income fast path or owned-account transfer.
 */
export function MoneyCaptureEntry({
  accounts,
  expenseTags,
  incomeTags,
  jars,
  currency,
}: Props) {
  const t = useTranslations("money.captureForm");
  const [mode, setMode] = useState<MoneyCaptureMode>(MoneyCaptureMode.EXPENSE);

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="money-capture-entry">
      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("modeLabel")}
        </legend>
        <div
          className="grid grid-cols-3 gap-(--space-2) rounded-lg bg-canvas p-(--space-1)"
          role="radiogroup"
          data-testid="capture-mode-group"
        >
          {MONEY_CAPTURE_MODE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              data-testid={`capture-mode-${value}`}
              className={
                mode === value
                  ? "min-h-11 rounded-md border border-accent/40 bg-surface px-(--space-2) text-sm font-semibold text-text-primary shadow-[var(--elevation-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-md px-(--space-2) text-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              }
              onClick={() => setMode(value)}
            >
              {t(`mode.${value}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === MoneyCaptureMode.TRANSFER ? (
        <TransferCaptureFlow
          accounts={accounts}
          currency={currency}
          onBackToCapture={() => setMode(MoneyCaptureMode.EXPENSE)}
        />
      ) : (
        <CaptureTransactionForm
          key={mode}
          accounts={accounts}
          expenseTags={expenseTags}
          incomeTags={incomeTags}
          jars={jars}
          currency={currency}
          initialDirection={mode}
        />
      )}
    </div>
  );
}
