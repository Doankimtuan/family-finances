"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LoanStatus } from "@/modules/ledger/application/client";
import { setLoanStatusAction } from "../../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  loanId: string;
};

export function LoanCloseAction({ loanId }: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [confirm, setConfirm] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
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
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <StatusAlert variant="danger" title={t("closeConfirm")} />
      <div className="flex gap-(--space-2)">
        <Button
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-close-confirm"
          isDisabled={isPending || !online}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
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
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("closing") : t("confirmClose")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => setConfirm(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
