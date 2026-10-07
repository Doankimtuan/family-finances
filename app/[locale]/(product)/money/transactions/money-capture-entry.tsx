"use client";

import { Suspense, use, useEffect, useState } from "react";
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
  accountsPromise: Promise<LedgerAccount[]>;
  expenseTagsPromise: Promise<CategoryTag[] | null>;
  incomeTagsPromise: Promise<CategoryTag[] | null>;
  jarsPromise: Promise<CaptureJarOption[] | null>;
  transactionTagsPromise: Promise<TransactionTag[] | null>;
  currency: string;
  initialMode?: MoneyCaptureMode;
  initialAccountId?: string;
};

function ReferenceDataResolver<T>({
  promise,
  onResolve,
}: {
  promise: Promise<T>;
  onResolve: (value: T) => void;
}) {
  const value = use(promise);

  useEffect(() => onResolve(value), [onResolve, promise, value]);
  return null;
}

/**
 * Capture entry — expense/income fast path or owned-account transfer.
 */
export function MoneyCaptureEntry({
  accountsPromise,
  expenseTagsPromise,
  incomeTagsPromise,
  jarsPromise,
  transactionTagsPromise,
  currency,
  initialMode = MoneyCaptureMode.EXPENSE,
  initialAccountId,
}: Props) {
  const t = useTranslations("money.captureForm");
  const [mode, setMode] = useState<MoneyCaptureMode>(initialMode);
  const [accounts, setAccounts] = useState<LedgerAccount[]>();
  const [expenseTags, setExpenseTags] = useState<CategoryTag[] | null>();
  const [incomeTags, setIncomeTags] = useState<CategoryTag[] | null>();
  const [jars, setJars] = useState<CaptureJarOption[] | null>();
  const [transactionTags, setTransactionTags] = useState<
    TransactionTag[] | null
  >();

  return (
    <div
      className="flex flex-1 flex-col gap-(--space-5)"
      data-testid="money-capture-entry"
    >
      <Suspense fallback={null}>
        <ReferenceDataResolver
          promise={accountsPromise}
          onResolve={setAccounts}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ReferenceDataResolver
          promise={expenseTagsPromise}
          onResolve={setExpenseTags}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ReferenceDataResolver
          promise={incomeTagsPromise}
          onResolve={setIncomeTags}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ReferenceDataResolver promise={jarsPromise} onResolve={setJars} />
      </Suspense>
      <Suspense fallback={null}>
        <ReferenceDataResolver
          promise={transactionTagsPromise}
          onResolve={setTransactionTags}
        />
      </Suspense>

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

      <div className="flex flex-1 flex-col">
        <MotionStep stepKey={mode} className="flex flex-1 flex-col">
          {mode === MoneyCaptureMode.TRANSFER ? (
            <TransferCaptureFlow
              accounts={accounts ?? []}
              accountsReady={accounts !== undefined}
              currency={currency}
              initialSourceAccountId={initialAccountId}
              onBackToCapture={() => setMode(MoneyCaptureMode.EXPENSE)}
            />
          ) : (
            <CaptureTransactionForm
              key={mode}
              accounts={accounts ?? []}
              accountsReady={accounts !== undefined}
              expenseTags={expenseTags ?? []}
              expenseTagsReady={expenseTags !== undefined}
              incomeTags={incomeTags ?? []}
              incomeTagsReady={incomeTags !== undefined}
              jars={jars ?? []}
              jarsReady={jars !== undefined}
              transactionTags={transactionTags ?? []}
              transactionTagsReady={transactionTags !== undefined}
              currency={currency}
              initialDirection={mode}
              initialAccountId={initialAccountId}
            />
          )}
        </MotionStep>
      </div>
    </div>
  );
}
