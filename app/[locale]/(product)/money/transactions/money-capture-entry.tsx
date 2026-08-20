"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  TransactionTag,
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
  transactionTags: TransactionTag[];
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
  transactionTags,
  currency,
}: Props) {
  const t = useTranslations("money.captureForm");
  const [mode, setMode] = useState<MoneyCaptureMode>(MoneyCaptureMode.EXPENSE);

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="money-capture-entry"
    >
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="sr-only">{t("modeLabel")}</legend>
        <div
          className="grid grid-cols-3 gap-(--space-1) rounded-[var(--radius-control)] border border-border-subtle bg-surface p-(--space-1)"
          role="radiogroup"
          aria-label={t("modeLabel")}
          data-testid="capture-mode-group"
        >
          {MONEY_CAPTURE_MODE_OPTIONS.map((value, index) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              tabIndex={mode === value ? 0 : -1}
              aria-label={t(`mode.${value}`)}
              data-testid={`capture-mode-${value}`}
              className={
                mode === value
                  ? "min-h-11 rounded-[var(--radius-control)] border border-accent/40 bg-accent/10 px-(--space-2) text-sm font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              }
              onClick={() => setMode(value)}
              onKeyDown={(event) => {
                const offset =
                  event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? 1
                    : event.key === "ArrowLeft" || event.key === "ArrowUp"
                      ? -1
                      : 0;
                if (!offset) return;
                event.preventDefault();
                const nextIndex =
                  (index + offset + MONEY_CAPTURE_MODE_OPTIONS.length) %
                  MONEY_CAPTURE_MODE_OPTIONS.length;
                setMode(MONEY_CAPTURE_MODE_OPTIONS[nextIndex]);
                document
                  .querySelector<HTMLButtonElement>(
                    `[data-testid="capture-mode-${MONEY_CAPTURE_MODE_OPTIONS[nextIndex]}"]`,
                  )
                  ?.focus();
              }}
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
          transactionTags={transactionTags}
          currency={currency}
          initialDirection={mode}
        />
      )}
    </div>
  );
}
