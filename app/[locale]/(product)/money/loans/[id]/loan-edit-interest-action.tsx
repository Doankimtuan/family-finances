"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { updateLoanInterestRateAction } from "../../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  loanId: string;
  currentRate: number;
  defaultEffectiveFrom: string;
};

export function LoanEditInterestAction({
  loanId,
  currentRate,
  defaultEffectiveFrom,
}: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(currentRate);
  const [effectiveFrom, setEffectiveFrom] = useState(defaultEffectiveFrom);
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-edit-interest-open"
        isDisabled={!online}
        onPress={() => setOpen(true)}
      >
        {t("editInterest")}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle p-(--space-3)"
      data-testid="loan-edit-interest-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="loan-edit-interest-rate"
        label={t("editInterestRateLabel")}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step="0.01"
        value={String(rate)}
        onChange={(e) => {
          const next = Number(e.target.value);
          setRate(Number.isFinite(next) ? next : 0);
        }}
      />
      <TextField
        id="loan-edit-interest-effective"
        label={t("editInterestEffectiveLabel")}
        type="date"
        value={effectiveFrom}
        onChange={(e) => setEffectiveFrom(e.target.value)}
      />
      <TextField
        id="loan-edit-interest-note"
        label={t("editInterestNoteLabel")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-(--space-2)">
        <Button
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-edit-interest-save"
          isDisabled={isPending || !online}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            startTransition(async () => {
              const result = await updateLoanInterestRateAction({
                loanId,
                annualInterestRate: rate,
                effectiveFrom,
                note: note.trim() || null,
              });
              if (result.status === "success") {
                setOpen(false);
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("saving") : t("saveInterest")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
