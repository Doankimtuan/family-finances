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
import {
  CAPTURE_MODE_IDLE_CLASS,
  CAPTURE_MODE_SELECTED_CLASS,
  CAPTURE_MODE_TRACK_CLASS,
} from "./transaction-chrome";
import { MotionStep } from "@/shared/motion/step";

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
      className="flex flex-col gap-(--space-5)"
      data-testid="money-capture-entry"
    >
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="sr-only">{t("modeLabel")}</legend>
        <div
          className={CAPTURE_MODE_TRACK_CLASS}
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
                  ? CAPTURE_MODE_SELECTED_CLASS
                  : CAPTURE_MODE_IDLE_CLASS
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

      <MotionStep stepKey={mode}>
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
      </MotionStep>
    </div>
  );
}
