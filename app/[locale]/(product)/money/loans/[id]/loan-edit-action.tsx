"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { CLIENT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { updateLoanMetadataAction } from "../../money-products-actions";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";

type Props = {
  loanId: string;
  initialName: string;
  initialLender: string;
  initialNote: string;
  compactTrigger?: boolean;
};

export function LoanEditAction({
  loanId,
  initialName,
  initialLender,
  initialNote,
  compactTrigger = false,
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

  const reset = () => {
    setName(initialName);
    setLender(initialLender);
    setNote(initialNote);
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
  };

  const handleCancel = () => {
    statusAlert.hide();
    reset();
    setOpen(false);
  };

  return (
    <Sheet
      isOpen={open}
      onOpenChange={(next) => {
        if (next) reset();
        setOpen(next);
      }}
    >
      {compactTrigger ? (
        <IconButton
          aria-label={t("editLoan")}
          variant="secondary"
          data-testid="loan-edit-open"
          isDisabled={!online}
          onPress={() => {
            reset();
            setOpen(true);
          }}
        >
          <AppIcon icon={ACTION_ICONS.edit} size="sm" />
        </IconButton>
      ) : (
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          data-testid="loan-edit-open"
          isDisabled={!online}
          onPress={() => {
            reset();
            setOpen(true);
          }}
        >
          {t("editLoan")}
        </Button>
      )}
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {t("editLoan")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <div
            className="flex flex-col gap-(--space-3)"
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
          </div>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={isPending ? t("saving") : t("saveEdit")}
          primaryTestId="loan-edit-save"
          isDisabled={!online}
          isPending={isPending}
          onSecondary={handleCancel}
          onPrimary={handleSave}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
