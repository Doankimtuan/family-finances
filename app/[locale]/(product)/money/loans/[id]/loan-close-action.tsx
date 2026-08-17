"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { CLIENT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { LoanStatus } from "@/modules/ledger/application/client";
import { setLoanStatusAction } from "../../money-products-actions";

type Props = {
  loanId: string;
};

export function LoanCloseAction({ loanId }: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-close-open"
        isDisabled={!online}
        onPress={() => setConfirm(true)}
      >
        {t("closeLoan")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="loan-close">
      <StatusAlert variant={AlertVariant.DANGER} title={t("closeConfirm")} />
      <div className="flex gap-(--space-2)">
        <Button
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-close-confirm"
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
              const result = await setLoanStatusAction({
                loanId,
                status: LoanStatus.ARCHIVED,
              });
              if (result.status === "success") {
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
          {isPending ? t("closing") : t("confirmClose")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => {
            statusAlert.hide();
            setConfirm(false);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
