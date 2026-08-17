"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { CLIENT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { updateLoanMetadataAction } from "../../money-products-actions";

type Props = {
  loanId: string;
  initialName: string;
  initialLender: string;
  initialNote: string;
};

export function LoanEditAction({
  loanId,
  initialName,
  initialLender,
  initialNote,
}: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [lender, setLender] = useState(initialLender);
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-edit-open"
        isDisabled={!online}
        onPress={() => setOpen(true)}
      >
        {t("editLoan")}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle p-(--space-3)"
      data-testid="loan-edit-form"
    >
      <TextField
        id="loan-edit-name"
        label={t("editNameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="loan-edit-lender"
        label={t("editLenderLabel")}
        value={lender}
        onChange={(e) => setLender(e.target.value)}
      />
      <TextField
        id="loan-edit-note"
        label={t("editNoteLabel")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-(--space-2)">
        <Button
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-edit-save"
          isDisabled={isPending || !online}
          onPress={() => {
            statusAlert.hide();
            if (!online) {
              statusAlert.show({
                variant: AlertVariant.DANGER,
                title: tErr(CLIENT_ACTION_ERROR_CODE.OFFLINE),
              });
              return;
            }
            startTransition(async () => {
              const result = await updateLoanMetadataAction({
                loanId,
                name,
                lender: lender.trim() || null,
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
          }}
        >
          {isPending ? t("saving") : t("saveEdit")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => {
            statusAlert.hide();
            setOpen(false);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
