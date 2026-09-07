"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { DatePickerField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { CLIENT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { updateLoanInterestRateAction } from "../../money-products-actions";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Card } from "@/shared/patterns/card";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";

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
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(currentRate);
  const [effectiveFrom, setEffectiveFrom] = useState(defaultEffectiveFrom);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setRate(currentRate);
    setEffectiveFrom(defaultEffectiveFrom);
    setNote("");
  };

  const handleSave = () => {
    statusAlert.hide();
    if (!online) {
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tErr(CLIENT_ACTION_ERROR_CODE.OFFLINE),
      });
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
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tErr(result.code),
      });
    });
  };

  const handleCancel = () => {
    statusAlert.hide();
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-edit-interest-open"
        isDisabled={!online}
        onPress={() => {
          reset();
          setOpen(true);
        }}
      >
        {t("editInterest")}
      </Button>
    );
  }

  return (
    <Sheet
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {t("editInterest")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <Card
            tone="elevated"
            className="flex flex-col gap-(--space-3) p-(--space-4)"
            data-testid="loan-edit-interest-form"
          >
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
            <DatePickerField
              id="loan-edit-interest-effective"
              label={t("editInterestEffectiveLabel")}
              value={effectiveFrom}
              onChange={setEffectiveFrom}
            />
            <Text size="sm" tone="secondary">
              {t("editInterestFutureHint")}
            </Text>
            <TextField
              id="loan-edit-interest-note"
              label={t("editInterestNoteLabel")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Card>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={isPending ? t("saving") : t("saveInterest")}
            primaryTestId="loan-edit-interest-save"
            isDisabled={!online}
            isPending={isPending}
            onSecondary={handleCancel}
            onPrimary={handleSave}
          />
        </ActionSheetLayout.Body>
      </ActionSheetLayout>
    </Sheet>
  );
}
